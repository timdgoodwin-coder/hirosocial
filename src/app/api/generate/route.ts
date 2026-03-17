import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { scrapeUrl } from '@/lib/scraper';
import { generatePosts } from '@/lib/claude';
import { GenerateRequest, GenerateResponse, GenerateErrorResponse, PLATFORMS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to generate posts.', credits_deducted: false },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: GenerateRequest = await request.json();
    const { url, tone, language } = body;

    if (!url || !tone || !language) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: url, tone, language.', credits_deducted: false },
        { status: 400 }
      );
    }

    // 3. Check credit balance
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Unable to verify your account. Please try again.', credits_deducted: false },
        { status: 500 }
      );
    }

    if (profile.credits < 1) {
      return NextResponse.json(
        { success: false, error: 'You don\'t have enough credits. Please purchase more to continue.', credits_deducted: false },
        { status: 403 }
      );
    }

    // 4. Create generation record (status: pending)
    const { data: generation, error: genError } = await adminClient
      .from('generations')
      .insert({
        user_id: user.id,
        source_url: url,
        tone,
        language,
        status: 'pending',
      })
      .select()
      .single();

    if (genError || !generation) {
      return NextResponse.json(
        { success: false, error: 'Failed to create generation record.', credits_deducted: false },
        { status: 500 }
      );
    }

    // 5. Scrape the URL
    let scrapedContent;
    try {
      scrapedContent = await scrapeUrl(url);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to read the content at this URL.';

      // Mark generation as failed — no credit deducted
      await adminClient
        .from('generations')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', generation.id);

      return NextResponse.json(
        { success: false, error: errorMessage, credits_deducted: false } as GenerateErrorResponse,
        { status: 422 }
      );
    }

    // 6. Generate posts with Claude
    let generatedPosts;
    try {
      generatedPosts = await generatePosts({
        title: scrapedContent.title,
        content: scrapedContent.content,
        tone,
        language,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate posts.';

      await adminClient
        .from('generations')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', generation.id);

      // AI failure — no credit deducted
      return NextResponse.json(
        { success: false, error: 'Something went wrong while generating your posts. Please try again.', credits_deducted: false } as GenerateErrorResponse,
        { status: 500 }
      );
    }

    // 7. Save generated posts to database
    const postsToInsert = PLATFORMS.flatMap((platform) =>
      generatedPosts.posts[platform].map((post) => ({
        generation_id: generation.id,
        platform,
        variant: post.variant,
        content: post.content,
        character_count: post.character_count,
      }))
    );

    const { error: postsError } = await adminClient
      .from('generated_posts')
      .insert(postsToInsert);

    if (postsError) {
      await adminClient
        .from('generations')
        .update({ status: 'failed', error_message: 'Failed to save generated posts.' })
        .eq('id', generation.id);

      return NextResponse.json(
        { success: false, error: 'Failed to save your posts. Please try again.', credits_deducted: false },
        { status: 500 }
      );
    }

    // 8. Deduct credit and log transaction
    await adminClient
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    await adminClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        type: 'usage',
        amount: -1,
        generation_id: generation.id,
      });

    // 9. Mark generation as completed
    await adminClient
      .from('generations')
      .update({ status: 'completed', source_title: scrapedContent.title })
      .eq('id', generation.id);

    // 10. Return response
    const response: GenerateResponse = {
      success: true,
      generation_id: generation.id,
      source_title: scrapedContent.title,
      posts: generatedPosts.posts,
      credits_remaining: profile.credits - 1,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.', credits_deducted: false },
      { status: 500 }
    );
  }
}
