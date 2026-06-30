import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

function getRuntimeSupabaseConfig() {
  return window.__VARS__?.serverData?.supabase || {};
}

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const runtimeConfig = getRuntimeSupabaseConfig();
  const url = import.meta.env.VITE_SUPABASE_URL || runtimeConfig.url;
  const publishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || runtimeConfig.publishableKey;
  if (!url || !publishableKey) {
    client = null;
    return client;
  }

  client = createClient(url, publishableKey);
  return client;
}

export async function getSupabaseSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const session = await getSupabaseSession();
  return session?.access_token || null;
}
