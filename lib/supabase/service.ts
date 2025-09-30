import { createClient } from '@supabase/supabase-js';

/**
 * Service role client for server-side operations that need to bypass RLS
 * Use ONLY for trusted server-side operations like webhooks
 */
export function createServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}