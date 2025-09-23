'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function OnboardingStatus() {
  const [loading, setLoading] = useState(true);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('Loading profile...');

      // Check account status via API (this will check with Stripe directly)
      const response = await fetch('/api/stripe/check-account-status', {
        method: 'GET',
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);

        if (data.hasAccount) {
          setStripeAccountId(data.accountId);
          setOnboardingComplete(data.onboardingComplete || false);
          console.log('Account found:', data.accountId, 'Onboarding complete:', data.onboardingComplete);
        } else {
          setStripeAccountId(null);
          setOnboardingComplete(false);
          console.log('No account found in API response');
        }
      } else {
        console.log('API call failed, falling back to Supabase');
        // Fallback to checking Supabase directly if API fails
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_account_id, stripe_onboarding_complete')
            .eq('id', user.id)
            .single();

          console.log('Supabase profile:', profile, 'Error:', profileError);

          if (profile) {
            setStripeAccountId(profile.stripe_account_id);
            setOnboardingComplete(profile.stripe_onboarding_complete || false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStripeAccount = async () => {
    setCreatingAccount(true);

    try {
      console.log('Creating Stripe account...');
      const response = await fetch('/api/stripe/create-account', {
        method: 'POST',
      });

      const data = await response.json();
      console.log('Create account response:', data);

      if (!response.ok) {
        if (data.accountId) {
          // Account already exists
          console.log('Account already exists:', data.accountId);
          setStripeAccountId(data.accountId);
          startOnboarding(data.accountId);
        } else {
          throw new Error(data.error || 'Failed to create Stripe account');
        }
      } else {
        console.log('New account created:', data.accountId);
        setStripeAccountId(data.accountId);
        startOnboarding(data.accountId);
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      alert('Failed to create Stripe account. Please try again.');
    } finally {
      setCreatingAccount(false);
    }
  };

  const startOnboarding = async (accountId?: string) => {
    try {
      const response = await fetch('/api/stripe/onboarding-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: accountId || stripeAccountId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create onboarding link');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (error) {
      console.error('Error starting onboarding:', error);
      alert('Failed to start onboarding. Please try again.');
    }
  };

  // Refresh status when component gains focus (user returns from Stripe)
  useEffect(() => {
    const handleFocus = () => {
      if (stripeAccountId && !onboardingComplete) {
        loadProfile();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [stripeAccountId, onboardingComplete]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Connect Status</CardTitle>
        <CardDescription>
          Connect your Stripe account to receive payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!stripeAccountId ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span>No Stripe account connected</span>
            </div>
            <Button
              onClick={createStripeAccount}
              disabled={creatingAccount}
            >
              {creatingAccount ? 'Creating account...' : 'Connect Stripe Account'}
            </Button>
          </div>
        ) : onboardingComplete ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Stripe account connected</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              You can now receive payments through QR codes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span>Onboarding incomplete</span>
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
            </div>
            <Button onClick={() => startOnboarding()}>
              Complete Onboarding
            </Button>
            <p className="text-sm text-muted-foreground">
              Complete your Stripe onboarding to start receiving payments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}