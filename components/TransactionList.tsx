'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Package, Clock, User, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DeliveryRequest {
  id: string;
  description: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  buyer?: {
    display_name: string;
    email: string;
  };
  deliverer?: {
    display_name: string;
    email: string;
  };
}

export function TransactionList() {
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'buyer' | 'deliverer' | 'both'>('both');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Load deliveries where user is either buyer or deliverer
    const { data: buyerDeliveries } = await supabase
      .from('delivery_requests')
      .select(`
        *,
        deliverer:driver_id (display_name, email)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: delivererDeliveries } = await supabase
      .from('delivery_requests')
      .select(`
        *,
        buyer:buyer_id (display_name, email)
      `)
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const allDeliveries = [
      ...(buyerDeliveries || []),
      ...(delivererDeliveries || [])
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Remove duplicates
    const uniqueDeliveries = allDeliveries.filter((delivery, index, arr) =>
      arr.findIndex(d => d.id === delivery.id) === index
    );

    setDeliveries(uniqueDeliveries);
    setLoading(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, text: 'Pending' };
      case 'accepted':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package, text: 'In Progress' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Completed' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, text: status };
    }
  };

  const getCompletedCount = () => {
    return deliveries.filter(d => d.status === 'completed').length;
  };

  const getPendingCount = () => {
    return deliveries.filter(d => d.status === 'pending').length;
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

        {/* Deliveries List Skeleton */}
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

  const completedCount = getCompletedCount();
  const pendingCount = getPendingCount();
  const totalCount = deliveries.length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {completedCount}
                </p>
              </div>
              <div className="p-3 bg-emerald-200 dark:bg-emerald-800 rounded-full">
                <CheckCircle className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Deliveries</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {totalCount}
                </p>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                <Package className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {pendingCount}
                </p>
              </div>
              <div className="p-3 bg-amber-200 dark:bg-amber-800 rounded-full">
                <Clock className="h-6 w-6 text-amber-700 dark:text-amber-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries List */}
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Recent Deliveries</CardTitle>
              <CardDescription>Your latest delivery requests and completions</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {deliveries.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {deliveries.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No deliveries yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Create your first delivery request or start driving to see activity here
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto px-6 pb-6">
              <div className="space-y-3">
                {deliveries.map((delivery) => {
                  const statusInfo = getStatusInfo(delivery.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={delivery.id}
                      className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {delivery.description}
                            </p>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                              </span>
                              {delivery.buyer && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  Buyer: {delivery.buyer.display_name || delivery.buyer.email}
                                </span>
                              )}
                              {delivery.deliverer && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  Deliverer: {delivery.deliverer.display_name || delivery.deliverer.email}
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