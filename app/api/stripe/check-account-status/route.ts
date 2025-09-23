import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile with Stripe account
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return NextResponse.json({
        hasAccount: false,
        onboardingComplete: false,
        message: 'No Stripe account found'
      });
    }

    // Check the actual status from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const isComplete = !!(account.charges_enabled && account.payouts_enabled);

    // Update database if status has changed
    if (isComplete !== profile.stripe_onboarding_complete) {
      await supabase
        .from('profiles')
        .update({ stripe_onboarding_complete: isComplete })
        .eq('id', user.id);
    }

    return NextResponse.json({
      hasAccount: true,
      onboardingComplete: isComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
      accountId: profile.stripe_account_id
    });
  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    );
  }
}