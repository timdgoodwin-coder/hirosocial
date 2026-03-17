import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
  title: string;
  content: string;
  excerpt: string;
  siteName: string | null;
}

// =============================================================================
// CONFIG
// =============================================================================

/**
 * Minimum character count for extracted article body to be considered valid.
 * Anything shorter is likely navigation/boilerplate rather than real content.
 */
const MIN_CONTENT_LENGTH = 200;

/**
 * Maximum content length we send downstream (to Claude). Keeps token usage sane.
 */
const MAX_CONTENT_LENGTH = 12_000;

/**
 * Timeout for the initial HTTP fetch (ms).
 */
const FETCH_TIMEOUT_MS = 20_000;

/**
 * Realistic browser User-Agent. Many sites block obvious bots but allow
 * standard desktop browser strings.
 */
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * Selectors for elements that should be stripped from the HTML before any
 * content extraction takes place. These are typically non-article chrome.
 */
const NOISE_SELECTORS = [
  // Core non-content elements
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'nav',
  'header:not(.article-header)',  // Keep article headers
  'footer',
  'aside',

  // Navigation & menus
  '.sidebar',
  '.nav',
  '.navbar',
  '.menu',
  '.footer',
  '.header',

  // Ads & promotions
  '.advertisement',
  '.ad',
  '.ads',
  '.promo',

  // Social & sharing
  '.social-share',
  '.social-links',
  '.share-buttons',

  // Popups & overlays
  '.cookie-banner',
  '.cookie-consent',
  '.popup',
  '.modal',
  '.newsletter',
  '.subscribe',

  // Related / secondary content
  '.related-posts',
  '.related-articles',
  '.comments',
  '.comment-section',
  '#comments',
  '.breadcrumb',
  '.breadcrumbs',
  '.pagination',

  // WordPress-specific
  '.wp-block-latest-posts',

  // Shopify-specific
  '.shopify-section--blog-posts',        // Related blog posts section
  '.shopify-section-group-header-group',  // Site header section group
  '.shopify-section-group-footer-group',  // Site footer section group
  '[data-section-type="header"]',
  '[data-section-type="footer"]',
  '.announcement-bar',

  // Generic "more posts" / "keep reading" blocks
  '[class*="related"]',
  '[class*="recommended"]',
  '[class*="more-posts"]',
  '[class*="more-articles"]',
];

/**
 * Selectors used (in priority order) to locate the article body container.
 * The first match with substantial content wins.
 */
const ARTICLE_CONTAINER_SELECTORS = [
  // Shopify blog
  '.rte',
  '.article_content',
  '.article-content',
  '.blog-article__main',
  '[class*="article-body"]',
  '[class*="article__body"]',

  // WordPress
  '.entry-content',
  '.post-content',
  '.post-body',
  '.post__content',

  // Medium / Ghost / generic
  '.story-body',
  '.content-body',
  'article .content',
  'article',
  '[role="article"]',

  // Generic fallbacks
  'main',
  '#content',
  '.content',
];

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

/**
 * Scrapes article content from a URL.
 *
 * Strategy:
 *  1. Validate & fetch the page (following redirects, realistic headers).
 *  2. Extract metadata from <meta> and Open Graph tags.
 *  3. Clean the DOM of noise elements.
 *  4. Try targeted Cheerio extraction using known article-container selectors.
 *  5. Fall back to Mozilla Readability for generic extraction.
 *  6. Last resort: extract all paragraph text from the page.
 *  7. Validate the extracted content meets minimum quality thresholds.
 */
export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  // ---- Step 1: Validate URL ----
  const parsedUrl = validateUrl(url);

  // ---- Step 2: Fetch HTML ----
  const html = await fetchPage(parsedUrl.href);

  // ---- Step 3: Extract metadata (before cleaning so meta tags are intact) ----
  const metadata = extractMetadata(html, parsedUrl.href);

  // ---- Step 4: Clean the HTML ----
  const cleanedHtml = cleanHtml(html);

  // ---- Step 5: Try targeted Cheerio extraction FIRST ----
  // This is more reliable than Readability for known site structures (Shopify, WordPress, etc.)
  let extracted = tryCheerioExtraction(cleanedHtml);

  // ---- Step 6: Fall back to Readability ----
  if (!extracted || extracted.content.length < MIN_CONTENT_LENGTH) {
    extracted = tryReadability(cleanedHtml, parsedUrl.href);
  }

  // ---- Step 7: Last resort – raw paragraph extraction ----
  if (!extracted || extracted.content.length < MIN_CONTENT_LENGTH) {
    extracted = tryRawTextExtraction(cleanedHtml);
  }

  // ---- Step 8: Validate we got something useful ----
  if (!extracted || extracted.content.length < MIN_CONTENT_LENGTH) {
    throw new Error(
      'Could not extract enough article content from this URL. ' +
        'The page may not contain a readable article, or it may require JavaScript to render. ' +
        'Please try a different URL.'
    );
  }

  // ---- Step 9: Build final result ----
  const title =
    extracted.title || metadata.ogTitle || metadata.metaTitle || parsedUrl.hostname;
  const siteName = metadata.ogSiteName || null;
  const content = truncateContent(extracted.content);
  const excerpt =
    metadata.ogDescription ||
    metadata.metaDescription ||
    content.substring(0, 250).replace(/\s+/g, ' ').trim();

  return { title, content, excerpt, siteName };
}

// =============================================================================
// URL VALIDATION
// =============================================================================

function validateUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Please enter a valid URL (e.g. https://example.com/article)');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('URL must use HTTP or HTTPS protocol');
  }

  // Block local/private IPs (basic SSRF protection)
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.') ||
    hostname === '0.0.0.0'
  ) {
    throw new Error('Cannot access local or private network addresses.');
  }

  return parsed;
}

// =============================================================================
// HTTP FETCH
// =============================================================================

async function fetchPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="125", "Not.A/Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error(
          'This page requires authentication or blocks automated access. Please try a different URL.'
        );
      }
      if (response.status === 404) {
        throw new Error('Page not found. Please check the URL and try again.');
      }
      if (response.status === 429) {
        throw new Error(
          "We're being rate-limited by this site. Please wait a moment and try again."
        );
      }
      throw new Error(
        `Unable to access the page (HTTP ${response.status}). Please try a different URL.`
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml')
    ) {
      throw new Error(
        'This URL does not point to a web page. Please provide a link to a blog post or article.'
      );
    }

    return await response.text();
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error(
          'The page took too long to load. Please try again or use a different URL.'
        );
      }
      // Re-throw our user-facing errors
      if (isUserFacingError(error)) {
        throw error;
      }
    }
    throw new Error(
      'Unable to read the content at this URL. Please check the URL and try again.'
    );
  }
}

// =============================================================================
// METADATA EXTRACTION
// =============================================================================

interface PageMetadata {
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogSiteName: string | null;
  canonicalUrl: string | null;
}

function extractMetadata(html: string, _url: string): PageMetadata {
  const $ = cheerio.load(html);

  return {
    metaTitle: $('title').first().text().trim() || null,
    metaDescription:
      $('meta[name="description"]').attr('content')?.trim() || null,
    ogTitle: $('meta[property="og:title"]').attr('content')?.trim() || null,
    ogDescription:
      $('meta[property="og:description"]').attr('content')?.trim() || null,
    ogSiteName:
      $('meta[property="og:site_name"]').attr('content')?.trim() || null,
    canonicalUrl:
      $('link[rel="canonical"]').attr('href')?.trim() || null,
  };
}

// =============================================================================
// HTML CLEANING
// =============================================================================

/**
 * Strips noise elements (nav, footer, ads, related posts, etc.) from HTML
 * before content extraction. This dramatically improves the accuracy of both
 * Readability and our manual Cheerio extraction.
 */
function cleanHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove noise selectors
  for (const selector of NOISE_SELECTORS) {
    try {
      $(selector).remove();
    } catch {
      // Some selectors may not be valid for all pages — skip silently
    }
  }

  // Remove hidden elements
  $(
    '[style*="display:none"], [style*="display: none"], [hidden], [aria-hidden="true"]'
  ).remove();

  // Remove empty elements that just add noise
  $('div:empty, span:empty, p:empty').remove();

  return $.html();
}

// =============================================================================
// STRATEGY 1: Cheerio-based targeted extraction (preferred)
// =============================================================================

interface ExtractedContent {
  title: string | null;
  content: string;
}

/**
 * Manually extracts article content by looking for known article containers.
 * This is more reliable than Readability for sites with non-standard layouts
 * like Shopify blogs, where Readability often picks up the wrong content.
 */
function tryCheerioExtraction(html: string): ExtractedContent | null {
  try {
    const $ = cheerio.load(html);

    // Title extraction (priority order)
    const title =
      $('h1').first().text().trim() ||
      $('[class*="article_title"], [class*="article-title"]')
        .first()
        .text()
        .trim() ||
      null;

    // Try each article container selector in priority order
    let bestContent = '';

    for (const selector of ARTICLE_CONTAINER_SELECTORS) {
      const elements = $(selector);
      if (!elements.length) continue;

      elements.each((_, el) => {
        const container = $(el);

        // Extract paragraph and heading text from within this container
        const textParts: string[] = [];
        container
          .find('p, h1, h2, h3, h4, h5, h6, li, blockquote')
          .each((_, child) => {
            const text = $(child).text().trim();
            if (text.length > 20) {
              // Skip tiny fragments (buttons, labels, etc.)
              textParts.push(text);
            }
          });

        const combined = textParts.join('\n\n');

        // Keep the longest extraction we find — in practice the article container
        // will have significantly more content than any sidebar or related-posts block
        if (combined.length > bestContent.length) {
          bestContent = combined;
        }
      });

      // If we found a good amount of content with this selector, stop looking
      if (bestContent.length >= MIN_CONTENT_LENGTH) {
        break;
      }
    }

    if (bestContent.length < MIN_CONTENT_LENGTH) {
      return null;
    }

    return {
      title,
      content: bestContent.replace(/\n{3,}/g, '\n\n').trim(),
    };
  } catch {
    return null;
  }
}

// =============================================================================
// STRATEGY 2: Mozilla Readability (fallback)
// =============================================================================

function tryReadability(html: string, url: string): ExtractedContent | null {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, {
      charThreshold: 100,
    });
    const article = reader.parse();

    if (!article || !article.textContent) {
      return null;
    }

    // Clean up whitespace: collapse multiple newlines and spaces
    const cleanedContent = article.textContent
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    if (cleanedContent.length < MIN_CONTENT_LENGTH) {
      return null;
    }

    return {
      title: article.title || null,
      content: cleanedContent,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// STRATEGY 3: Raw text extraction (last resort)
// =============================================================================

/**
 * Extracts all substantial paragraph text from the page body. Used as a last
 * resort when both targeted Cheerio extraction and Readability fail.
 */
function tryRawTextExtraction(html: string): ExtractedContent | null {
  try {
    const $ = cheerio.load(html);

    const paragraphs: string[] = [];
    $('body p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40) {
        // Only substantial paragraphs
        paragraphs.push(text);
      }
    });

    const combined = paragraphs.join('\n\n');
    if (combined.length < MIN_CONTENT_LENGTH) {
      return null;
    }

    const title = $('h1').first().text().trim() || null;

    return {
      title,
      content: combined.replace(/\n{3,}/g, '\n\n').trim(),
    };
  } catch {
    return null;
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Truncates content to MAX_CONTENT_LENGTH while trying to break at a
 * sentence boundary so we don't send half-sentences to Claude.
 */
function truncateContent(content: string): string {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return content;
  }

  // Try to break at a sentence boundary
  const truncated = content.substring(0, MAX_CONTENT_LENGTH);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('! ')
  );

  if (lastSentenceEnd > MAX_CONTENT_LENGTH * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1).trim();
  }

  return truncated.trim() + '...';
}

/**
 * Checks whether an error has a user-facing message we've crafted ourselves,
 * so we can re-throw it without wrapping.
 */
function isUserFacingError(error: Error): boolean {
  const msg = error.message;
  return (
    msg.startsWith('This ') ||
    msg.startsWith('Page ') ||
    msg.startsWith('Unable ') ||
    msg.startsWith('Please ') ||
    msg.startsWith('Could not') ||
    msg.startsWith('Cannot ') ||
    msg.startsWith("We're ")
  );
}
