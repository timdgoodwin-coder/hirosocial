import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
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

    // Create user via admin API (bypasses email confirmation)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so they can start immediately
      user_metadata: { full_name: null },
    });

    if (authError) {
      // Handle duplicate email
      if (authError.message?.toLowerCase().includes('already') || 
          authError.message?.toLowerCase().includes('exists') ||
          authError.message?.toLowerCase().includes('duplicate')) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists. Please log in instead.' },
          { status: 409 }
        );
      }
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

    // Wait a moment for the trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Give them 1 free credit
    const { error: creditError } = await adminClient
      .from('profiles')
      .update({ credits: 1 })
      .eq('id', userId);

    if (creditError) {
      console.error('Trial credit update error:', creditError);
      // Account was created but credit failed — still okay, they can log in
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

    return NextResponse.json({
      success: true,
      message: 'Account created! You have 1 free credit to try HiroSocial.',
    });
  } catch (error) {
    console.error('Trial API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
