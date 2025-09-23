import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingStatus } from '@/components/OnboardingStatus';
import { TransactionList } from '@/components/TransactionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { QrCode, Plus, History, Settings } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user.email}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Test Mode
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/request" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">New Payment</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Generate QR code</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/history" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <History className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">History</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View all transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/onboarding" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Settings</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">PayPal/Venmo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Status & Actions */}
          <div className="lg:col-span-1">
            <OnboardingStatus />
          </div>

          {/* Right Column - Transactions */}
          <div className="lg:col-span-2">
            <TransactionList />
          </div>
        </div>
      </div>
    </div>
  );
}