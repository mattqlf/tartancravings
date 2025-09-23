import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingStatus } from '@/components/OnboardingStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Stripe Connect Onboarding</h1>
        <p className="text-muted-foreground">
          Complete your Stripe account setup to start receiving payments
        </p>
      </div>

      <OnboardingStatus />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Mode Information</CardTitle>
          <CardDescription>
            You&apos;re currently in Stripe test mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Use these test values:</h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Test SSN: 000-00-0000</li>
              <li>Test Phone: Any valid format</li>
              <li>Test Bank Routing: 110000000</li>
              <li>Test Bank Account: 000123456789</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">For identity verification:</h4>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>First name: Jenny</li>
              <li>Last name: Rosen</li>
              <li>Date of birth: 01/01/1901</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> In test mode, the onboarding process is instant and
              doesn&apos;t require real verification. All test data is accepted automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}