import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingStatus } from '@/components/OnboardingStatus';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Profile Setup</h1>
        <p className="text-muted-foreground">
          Complete your profile to use the delivery platform
        </p>
      </div>

      <OnboardingStatus />
    </div>
  );
}