'use client';

import { useState, useEffect } from 'react';
import { PayPalEmailForm } from '@/components/PayPalEmailForm';
import { createClient } from '@/lib/supabase/client';

export function OnboardingStatus() {
  const [loading, setLoading] = useState(true);
  const [paypalEmail, setPaypalEmail] = useState<string | null>(null);
  const [paypalVerified, setPaypalVerified] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('paypal_email, paypal_verified')
          .eq('id', user.id)
          .single();

        if (profile) {
          setPaypalEmail(profile.paypal_email);
          setPaypalVerified(profile.paypal_verified || false);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSaved = () => {
    // Reload profile after email is saved
    loadProfile();
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <PayPalEmailForm
      currentEmail={paypalEmail}
      isVerified={paypalVerified}
      onEmailSaved={handleEmailSaved}
    />
  );
}