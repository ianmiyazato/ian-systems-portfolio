import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  browserClient = url && publishableKey
    ? createClient(url, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        realtime: { params: { eventsPerSecond: 4 } }
      })
    : null;

  return browserClient;
}

export function isSupabaseDataMode() {
  return process.env.NEXT_PUBLIC_DATA_MODE === 'supabase' && getSupabaseBrowserClient() !== null;
}
