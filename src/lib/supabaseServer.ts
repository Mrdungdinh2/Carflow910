/**
 * Supabase Server Client — CHỈ DÙNG TRONG API ROUTES (server-side)
 * Sử dụng Service Role Key để bypass RLS policies
 * KHÔNG BAO GIỜ import file này trong code client-side ('use client')
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('[CarFlow Server] Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
