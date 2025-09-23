'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { DollarSign, Clock, User, TrendingUp, ArrowUpRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PaymentRequest {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
  paid_by_email: string | null;
  payout_status: string | null;
  payout_amount: number | null;
  platform_fee: number | null;
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  // Set up real-time subscription for payment updates
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to changes in payment_requests table for this user
    const subscription = supabase
      .channel('payment_updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'payment_requests',
        },
        async (payload) => {
          console.log('Real-time update received:', payload);

          // Get current user to filter updates
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (payload.eventType === 'UPDATE') {
            // Check if this update is for the current user's transactions
            if (payload.new && (payload.new as any).recipient_id === user.id) {
              setTransactions(prev =>
                prev.map(t =>
                  t.id === payload.new.id
                    ? { ...t, ...(payload.new as PaymentRequest) }
                    : t
                )
              );
            }
          } else if (payload.eventType === 'INSERT') {
            // New transaction created for this user
            if (payload.new && (payload.new as any).recipient_id === user.id) {
              setTransactions(prev => [payload.new as PaymentRequest, ...prev]);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadTransactions = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading transactions:', error);
    } else {
      setTransactions(data || []);
    }

    setLoading(false);
  };

  const getStatusInfo = (status: string, payoutStatus?: string | null) => {
    if (status === 'paid') {
      switch (payoutStatus) {
        case 'completed':
          return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, text: 'Paid Out' };
        case 'processing':
          return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: TrendingUp, text: 'Processing' };
        case 'failed':
          return { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Payout Failed' };
        default:
          return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Paid' };
      }
    }

    switch (status) {
      case 'pending':
        return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, text: 'Pending' };
      case 'expired':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, text: 'Expired' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, text: status };
    }
  };

  const getTotalEarnings = () => {
    return transactions
      .filter(t => t.status === 'paid' && t.payout_status === 'completed')
      .reduce((sum, t) => sum + (t.payout_amount || 0), 0);
  };

  const getPlatformFees = () => {
    return transactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + (t.platform_fee || 0), 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-100 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transactions List Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalEarnings = getTotalEarnings();
  const platformFees = getPlatformFees();
  const totalVolume = transactions.reduce((sum, t) => sum + (t.status === 'paid' ? t.amount : 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  ${(totalEarnings / 100).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-emerald-200 dark:bg-emerald-800 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Volume</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  ${(totalVolume / 100).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Platform Fees</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  ${(platformFees / 100).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-purple-700 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
              <CardDescription>Your latest payment requests and payouts</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {transactions.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Create your first payment request to start receiving payments
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto px-6 pb-6">
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const statusInfo = getStatusInfo(transaction.status, transaction.payout_status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={transaction.id}
                      className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                ${(transaction.amount / 100).toFixed(2)}
                              </span>
                              {transaction.payout_amount && transaction.payout_status === 'completed' && (
                                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                  → ${(transaction.payout_amount / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                              {transaction.description || 'Payment Request'}
                            </p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                              </span>
                              {transaction.paid_by_email && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {transaction.paid_by_email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={`${statusInfo.color} border font-medium flex items-center space-x-1`}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{statusInfo.text}</span>
                          </Badge>

                          {transaction.platform_fee && transaction.status === 'paid' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Fee: ${(transaction.platform_fee / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}