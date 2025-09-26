'use client';

import { useState, useEffect } from 'react';
import { ContactForm } from '@/components/ContactForm';
import { createClient } from '@/lib/supabase/client';

export function OnboardingStatus() {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

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
          .select('display_name, phone_number')
          .eq('id', user.id)
          .single();

        if (profile) {
          setDisplayName(profile.display_name);
          setPhoneNumber(profile.phone_number);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSaved = () => {
    // Reload profile after contact info is saved
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
    <ContactForm
      currentDisplayName={displayName}
      currentPhone={phoneNumber}
      onContactSaved={handleContactSaved}
    />
  );
}