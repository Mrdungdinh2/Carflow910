import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Clean URL format if user included /rest/v1
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = rawKey.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Log connection status for debugging (client-side only)
if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.log('[CarFlow] Supabase connected:', supabaseUrl);
  } else {
    console.warn('[CarFlow] Supabase NOT configured. URL:', rawUrl ? '✓' : '✗', 'Key:', rawKey ? '✓' : '✗');
  }
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Disable Supabase Auth session management - CarFlow uses its own auth system
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
