import Anthropic from '@anthropic-ai/sdk';
import { Platform, Tone, Language, PostVariant, PLATFORM_CONFIG, PLATFORMS } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface GeneratePostsInput {
  title: string;
  content: string;
  tone: Tone;
  language: Language;
}

interface GeneratedPosts {
  posts: Record<Platform, PostVariant[]>;
}

// ─── Tone Definitions ───────────────────────────────────────────────
// Concrete descriptions so the model knows exactly what each tone means.
const TONE_DEFINITIONS: Record<Tone, string> = {
  professional:
    'Clean, polished, and business-appropriate. Use precise language, avoid slang, and maintain a confident yet approachable voice. Think senior marketer presenting to a board.',
  casual:
    'Relaxed, friendly, and conversational — like texting a clever friend. Use everyday language, contractions, and natural rhythm. Feels human, not corporate.',
  witty:
    'Clever wordplay, light humour, and unexpected angles. Playful but never try-hard. Think of a sharp copywriter who makes people smile and stop scrolling.',
  authoritative:
    'Expert, confident, and commanding. Speak from a position of deep knowledge. Use data and strong assertions. Think industry thought leader who backs up every claim.',
  inspirational:
    'Motivating, uplifting, and empowering. Paint a vision people want to be part of. Use aspirational language and emotional resonance without being cheesy.',
};

// ─── System Prompt ──────────────────────────────────────────────────
// Stays constant across all requests — sets the persona and ground rules.
const SYSTEM_PROMPT = `You are a world-class social media strategist and copywriter. You turn article content into high-performing, native social media posts.

YOUR PRIMARY GOAL IS ENGAGEMENT.
Every post you write must be optimised to make someone stop scrolling, read the full post, and then like, share, or comment. A post that gets ignored is a failed post.

CORE PRINCIPLES:
1. SELF-CONTAINED VALUE — Every post must deliver complete value on its own. The reader should never need to click a link or read the original article to understand or appreciate the post. The post IS the content.
2. SOURCE-FAITHFUL — Only use information, facts, claims, and data that appear in the provided article. Never fabricate, infer beyond what's stated, or add external information.
3. NO CLICKBAIT — Never use sensationalist, misleading, or exaggerated language. Earn attention with substance, not tricks.
4. HOOK DIVERSITY — Each of the 3 variations per platform must use a DIFFERENT hook strategy. Choose from:
   • Stat/data-led — Open with a surprising number or finding from the article
   • Question-led — Open with a thought-provoking question the article answers
   • Story/anecdote-led — Open with a relatable scenario or narrative moment
   • Bold-claim-led — Open with a strong, defensible statement that creates curiosity
   • Quote-led — Open with a compelling quote or key phrase from the article
   • Myth-busting — Challenge a common assumption that the article addresses
5. NO FILLER — Cut every word that doesn't earn its place. No generic intros like "In today's world..." or "Did you know...". Get to the point.
6. ENGAGEMENT TRIGGERS — Where natural, include elements that invite interaction:
   • Pose a genuine question to the audience
   • Share a perspective people might agree/disagree with
   • Highlight a surprising insight worth discussing
   • Use "you" to speak directly to the reader

IMPORTANT: Never include a URL or "link in bio" in any post. These posts must stand entirely on their own.`;

/**
 * Builds the user-facing prompt with the article content and specific
 * instructions for tone, language, and platform formatting.
 */
function buildUserPrompt(
  title: string,
  content: string,
  tone: Tone,
  language: Language,
): string {
  const spellingNote =
    language === 'UK'
      ? 'Use British English spelling throughout (e.g., colour, organise, behaviour, centre, programme).'
      : 'Use American English spelling throughout (e.g., color, organize, behavior, center, program).';

  const toneDescription = TONE_DEFINITIONS[tone];

  return `ARTICLE TO REPURPOSE:

Title: ${title}

Content:
${content}

───────────────────────────────────────────────

STEP 1 — ANALYSE THE ARTICLE (do this internally, do NOT include in your output):
Before writing any posts, identify:
• The 3-5 most compelling or surprising points in the article
• Any statistics, data points, or specific numbers mentioned
• Any quotes or memorable phrases
• The core argument or thesis
• Who would care about this content and why
• What emotions this content could trigger (curiosity, surprise, agreement, debate)

STEP 2 — WRITE THE POSTS:

TONE: "${tone}" — ${toneDescription}
SPELLING: ${spellingNote}

PLATFORM-SPECIFIC GUIDELINES:

TWITTER/X (max 280 characters per post):
• Every character counts — be ruthlessly concise
• Lead with the strongest hook; frontload value in the first line
• Hashtags: 0-2 max, only if genuinely relevant (not forced)
• Use line breaks sparingly for impact
• End with a question or bold statement when natural
• Emojis: 0-1 max, only if it adds personality

LINKEDIN (up to 3000 characters):
• Structure: Hook line → blank line → 2-3 insight paragraphs → key takeaway → conversation starter
• The first line MUST stop the scroll — this is the only line visible before "see more"
• Use short paragraphs (1-3 sentences each) with line breaks between them
• Professional tone overlay regardless of selected tone
• End with a genuine question that invites discussion — not a generic "What do you think?"
• Emojis: Use sparingly as bullet points or to break up text (✅, 💡, 📊) — never decorative

FACEBOOK (up to 2000 characters):
• Conversational and relatable — write like a smart friend sharing something interesting
• Medium length — long enough to deliver value, short enough to hold attention
• Can use emojis where they feel natural to the tone (don't force them)
• Encourage sharing by making the reader feel smarter for having read it
• End with a question or call for opinions to drive comments

INSTAGRAM (up to 2200 characters):
• Caption-style with personality — this needs to feel native to Instagram
• Use line breaks generously for readability
• First line is the hook (visible before "more") — make it count
• Include 5-10 relevant hashtags grouped at the end after a line break
• Emojis: Use naturally throughout to match the platform's visual culture
• End the main text (before hashtags) with a question or CTA to drive engagement

THREADS (max 500 characters):
• Casual and conversational — slightly more relaxed than Twitter
• Think "smart take from someone you follow" energy
• Can be opinion-forward or insight-driven
• Hashtags: 0-1 max
• Emojis: 0-2, only if natural
• End with something that makes people want to reply

RESPOND WITH VALID JSON ONLY (no markdown, no code fences, no commentary):
{
  "facebook": [
    {"variant": 1, "content": "post text here"},
    {"variant": 2, "content": "post text here"},
    {"variant": 3, "content": "post text here"}
  ],
  "twitter": [
    {"variant": 1, "content": "post text here"},
    {"variant": 2, "content": "post text here"},
    {"variant": 3, "content": "post text here"}
  ],
  "threads": [
    {"variant": 1, "content": "post text here"},
    {"variant": 2, "content": "post text here"},
    {"variant": 3, "content": "post text here"}
  ],
  "instagram": [
    {"variant": 1, "content": "post text here"},
    {"variant": 2, "content": "post text here"},
    {"variant": 3, "content": "post text here"}
  ],
  "linkedin": [
    {"variant": 1, "content": "post text here"},
    {"variant": 2, "content": "post text here"},
    {"variant": 3, "content": "post text here"}
  ]
}`;
}

/**
 * Generates social media posts from article content using Claude.
 * Returns 3 variations for each of the 5 platforms (15 total).
 *
 * Uses a system prompt for persona/rules and a user prompt for the
 * article content + specific instructions. Temperature is set to 0.7
 * for a balance of creativity and consistency.
 */
export async function generatePosts(input: GeneratePostsInput): Promise<GeneratedPosts> {
  const { title, content, tone, language } = input;

  const userPrompt = buildUserPrompt(title, content, tone, language);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // Extract text content from response
  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  // Parse JSON response
  let parsed: Record<Platform, { variant: number; content: string }[]>;
  try {
    // Clean up potential markdown code fences
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Failed to parse Claude response as JSON');
  }

  // Validate and transform response
  const posts: Record<Platform, PostVariant[]> = {} as Record<Platform, PostVariant[]>;

  for (const platform of PLATFORMS) {
    const platformPosts = parsed[platform];
    if (!Array.isArray(platformPosts) || platformPosts.length < 3) {
      throw new Error(`Invalid response: missing or incomplete posts for ${platform}`);
    }

    posts[platform] = platformPosts.slice(0, 3).map((post, index) => {
      const content = post.content || '';
      const maxLen = PLATFORM_CONFIG[platform].maxLength;

      // Enforce character limits
      const trimmedContent = content.length > maxLen
        ? content.substring(0, maxLen - 3) + '...'
        : content;

      return {
        variant: index + 1,
        content: trimmedContent,
        character_count: trimmedContent.length,
      };
    });
  }

  return { posts };
}

