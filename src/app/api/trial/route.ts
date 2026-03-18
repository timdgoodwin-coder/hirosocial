import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required.' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: User) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // User already exists — just send them a magic link to log in
      const supabase = await createClient();
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hirosocial.com'}/auth/callback`,
        },
      });
      return NextResponse.json({
        success: true,
        existing: true,
        message: 'A magic link has been sent to your email.',
      });
    }

    // Create user via admin API (sets email as confirmed so they can sign in immediately)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: null },
    });

    if (authError) {
      console.error('Trial signup auth error:', authError);
      return NextResponse.json(
        { success: false, error: authError.message || 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    if (!authData?.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Wait a moment for the DB trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Give them 1 free credit
    const { error: creditError } = await adminClient
      .from('profiles')
      .update({ credits: 1 })
      .eq('id', userId);

    if (creditError) {
      console.error('Trial credit update error:', creditError);
      // Account was created but credit failed — still okay
    }

    // Log the credit transaction
    await adminClient
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'purchase',
        amount: 1,
        stripe_session_id: 'free_trial',
      });

    // Send magic link so they can sign in (no password needed)
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hirosocial.com';
    const supabase = await createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        shouldCreateUser: false, // User already created above
      },
    });

    if (otpError) {
      console.error('Magic link send error:', otpError);
      // Account + credit created — user can still go to /login to request a link themselves
    }

    return NextResponse.json({
      success: true,
      message: 'Account created! Check your email for a magic sign-in link.',
    });
  } catch (error) {
    console.error('Trial API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
