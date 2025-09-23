'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface PaymentRequest {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
  paid_by_email: string | null;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your payment request history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your payment request history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No transactions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your payment request history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <div className="font-medium">
                  ${(transaction.amount / 100).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {transaction.description || 'Payment Request'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status}
                </Badge>
                {transaction.paid_by_email && (
                  <span className="text-xs text-muted-foreground">
                    {transaction.paid_by_email}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}