import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Disable Next.js body parsing — Stripe needs the raw bytes to verify signature
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Only handle completed checkout sessions
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { user_id, credits, package_id } = session.metadata ?? {};

  if (!user_id || !credits) {
    console.error('[webhook] Missing metadata on session:', session.id);
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  const creditsToAdd = parseInt(credits, 10);

  try {
    const supabase = createAdminClient();

    // 1. Increment the user's credit balance
    const { error: rpcError } = await supabase.rpc('increment_credits', {
      p_user_id: user_id,
      p_amount: creditsToAdd,
    });

    if (rpcError) throw rpcError;

    // 2. Record the transaction in the audit trail
    const { error: txError } = await supabase.from('credit_transactions').insert({
      user_id,
      type: 'purchase',
      amount: creditsToAdd,
      stripe_session_id: session.id,
    });

    if (txError) throw txError;

    console.log(`[webhook] ✅ Added ${creditsToAdd} credits (pkg: ${package_id}) to user ${user_id}`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook] Failed to fulfil credits:', err);
    // Return 500 so Stripe will retry the webhook
    return NextResponse.json({ error: 'Failed to fulfil credits' }, { status: 500 });
  }
}
