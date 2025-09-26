'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugRealtimePage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const supabase = createClient();

  const addMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, `${timestamp}: ${msg}`]);
  };

  useEffect(() => {
    addMessage('Starting real-time debug test...');

    // Test 1: Simple broadcast channel
    const broadcastChannel = supabase
      .channel('debug-broadcast')
      .on('broadcast', { event: 'test' }, (payload) => {
        addMessage('✅ Broadcast received: ' + JSON.stringify(payload));
      })
      .subscribe((status) => {
        addMessage('Broadcast channel status: ' + status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Send a test message
          broadcastChannel.send({
            type: 'broadcast',
            event: 'test',
            payload: { message: 'Hello from broadcast!' }
          });
        }
      });

    // Test 2: Database changes subscription using broadcast - all delivery requests
    const dbChannelAll = supabase
      .channel('delivery_requests_all', {
        config: { private: true },
      })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        addMessage('✅ Broadcast INSERT (all) received: ' + JSON.stringify(payload));
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        addMessage('✅ Broadcast UPDATE (all) received: ' + JSON.stringify(payload));
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        addMessage('✅ Broadcast DELETE (all) received: ' + JSON.stringify(payload));
      })
      .subscribe(async (status) => {
        addMessage('Broadcast DB channel (all) status: ' + status);
        if (status === 'SUBSCRIBED') {
          // Set auth for private channel
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await supabase.realtime.setAuth(session.access_token);
            addMessage('🔐 Authentication set for private channels');
          }
        }
      });

    // Test 3: Specific delivery request subscription
    const dbChannelSpecific = supabase
      .channel('delivery_request:test-id', {
        config: { private: true },
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        addMessage('✅ Broadcast UPDATE (specific) received: ' + JSON.stringify(payload));
      })
      .subscribe((status) => {
        addMessage('Broadcast DB channel (specific) status: ' + status);
      });

    return () => {
      broadcastChannel.unsubscribe();
      dbChannelAll.unsubscribe();
      dbChannelSpecific.unsubscribe();
    };
  }, []);

  const testCreateRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addMessage('❌ Not logged in');
        return;
      }

      addMessage('Creating test delivery request...');
      const { data, error } = await supabase
        .from('delivery_requests')
        .insert({
          buyer_id: user.id,
          description: 'Test request for real-time debugging',
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        addMessage('❌ Error creating request: ' + error.message);
      } else {
        addMessage('✅ Request created: ' + data.id);
      }
    } catch (err) {
      addMessage('❌ Exception: ' + (err as Error).message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Real-time Debug Tool</h1>

      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded text-white ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <button
        onClick={testCreateRequest}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Create Test Request (Should trigger real-time update)
      </button>

      <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Debug Messages:</h2>
        {messages.map((msg, index) => (
          <div key={index} className="text-sm mb-1 font-mono">
            {msg}
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal ml-4">
          <li>Watch the debug messages above</li>
          <li>Click "Create Test Request" to trigger a database change</li>
          <li>You should see real-time updates if everything is working</li>
          <li>Open this page in two tabs to test cross-user updates</li>
        </ol>
      </div>
    </div>
  );
}