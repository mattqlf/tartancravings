'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'new_request' | 'status_change' | 'accepted' | 'completed';
  title: string;
  message: string;
  timestamp: Date;
}

interface NotificationSystemProps {
  userId?: string;
}

export function NotificationSystem({ userId }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (userId) {
      setUser({ id: userId });
      setupNotifications(userId);
    } else {
      getCurrentUser();
    }
  }, [userId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setupNotifications(user.id);
    }
  };

  const setupNotifications = async (currentUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await supabase.realtime.setAuth(session.access_token);
    }

    // Subscribe to delivery request changes for notifications
    const channel = supabase
      .channel('delivery_requests_all', {
        config: { private: true },
      })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        console.log('🔔 Notification: INSERT received:', payload);
        // Extract data from broadcast payload structure
        const data = payload.payload?.new || payload.new || payload;
        console.log('🔔 INSERT data extracted:', data);

        if (data && data.buyer_id && data.buyer_id !== currentUserId) {
          console.log('🔔 Showing new request notification for:', data.description);
          // New request created by someone else
          addNotification({
            id: `new_${data.id}`,
            type: 'new_request',
            title: 'New Delivery Request',
            message: `Someone needs: ${data.description}`,
            timestamp: new Date()
          });
        }
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        console.log('🔔 Notification: UPDATE received:', payload);
        // Extract data from broadcast payload structure
        const data = payload.payload?.new || payload.new || payload;
        const oldData = payload.payload?.old || payload.old;
        console.log('🔔 UPDATE data extracted:', { data, oldData });

        if (data && oldData && data.status !== oldData.status) {
          console.log('🔔 Status changed:', oldData.status, '->', data.status, 'for user:', currentUserId);
          // Status changed
          if (data.buyer_id === currentUserId) {
            console.log('🔔 Showing buyer notification');
            // User is the buyer
            handleBuyerStatusChange(data, oldData);
          } else if (data.driver_id === currentUserId) {
            console.log('🔔 Showing deliverer notification');
            // User is the deliverer
            handleDelivererStatusChange(data, oldData);
          }
        }
      })
      .subscribe((status) => {
        console.log('🔔 Notification subscription status:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  };

  const handleBuyerStatusChange = (newData: any, oldData: any) => {
    switch (newData.status) {
      case 'accepted':
        addNotification({
          id: `accepted_${newData.id}`,
          type: 'accepted',
          title: 'Request Accepted!',
          message: `Your delivery request has been accepted by a deliverer`,
          timestamp: new Date()
        });
        break;
      case 'confirming':
        addNotification({
          id: `confirming_${newData.id}`,
          type: 'status_change',
          title: 'Confirmation Started',
          message: `Your deliverer is confirming delivery completion`,
          timestamp: new Date()
        });
        break;
      case 'completed':
        addNotification({
          id: `completed_${newData.id}`,
          type: 'completed',
          title: 'Delivery Completed!',
          message: `Your delivery has been completed successfully`,
          timestamp: new Date()
        });
        break;
    }
  };

  const handleDelivererStatusChange = (newData: any, oldData: any) => {
    switch (newData.status) {
      case 'confirming':
        addNotification({
          id: `confirming_${newData.id}`,
          type: 'status_change',
          title: 'Buyer Confirming',
          message: `The buyer is confirming they received their delivery`,
          timestamp: new Date()
        });
        break;
      case 'completed':
        addNotification({
          id: `completed_${newData.id}`,
          type: 'completed',
          title: 'Delivery Completed!',
          message: `Delivery completed successfully - great job!`,
          timestamp: new Date()
        });
        break;
    }
  };

  const addNotification = (notification: Notification) => {
    console.log('🔔 Adding notification:', notification);
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 5); // Keep only 5 most recent
      console.log('🔔 Updated notifications array:', updated);
      return updated;
    });

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_request':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'status_change':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_request':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'accepted':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'completed':
        return 'border-l-green-600 bg-green-50 dark:bg-green-900/20';
      case 'status_change':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">

      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`border-l-4 p-4 rounded-lg shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 ${getNotificationColor(notification.type)} transform transition-all duration-300 ease-in-out animate-pulse`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getNotificationIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDistanceToNow(notification.timestamp)} ago
                </p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}