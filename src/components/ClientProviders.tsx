'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/Toast';
import AuthGuard from '@/components/AuthGuard';
import { AuroraBackground } from '@/components/AuroraBackground';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { fetchAndSyncAllFromSupabase } from '@/lib/supabaseStorage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSyncDone = useRef(false);

  // Debounced sync: wait 300ms after the last change event before refetching
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      fetchAndSyncAllFromSupabase();
    }, 300);
  }, []);

  useEffect(() => {
    // CRITICAL: Initial sync on mount - fetch from Supabase FIRST before anything else
    // This ensures Supabase data always takes priority over local seed data
    const doInitialSync = async () => {
      if (!initialSyncDone.current) {
        initialSyncDone.current = true;
        const success = await fetchAndSyncAllFromSupabase();
        if (success) {
          console.log('[CarFlow] Initial sync from Supabase completed successfully');
          // Always dispatch event after first sync to force all pages to re-read data
          window.dispatchEvent(new Event('carflow_data_changed'));
        } else {
          console.warn('[CarFlow] Initial sync failed or Supabase not configured - using local data');
        }
      }
    };
    doInitialSync();

    // Supabase Realtime: listen for INSERT/UPDATE/DELETE across all tables
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('carflow-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => debouncedSync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => debouncedSync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => debouncedSync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicle_requests' }, () => debouncedSync())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => debouncedSync())
      .subscribe((status) => {
        console.log('[CarFlow Realtime] Subscription status:', status);
      });

    // Also sync when user returns to tab (visibility change)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchAndSyncAllFromSupabase();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic sync every 15 seconds as fallback (reduced from 30s for faster sync)
    const intervalId = setInterval(() => {
      fetchAndSyncAllFromSupabase();
    }, 15_000);

    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [debouncedSync]);

  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGuard>
          <AuroraBackground />
          <Header />
          <main className="relative z-10">{children}</main>
          <BottomNav />
        </AuthGuard>
      </ToastProvider>
    </AuthProvider>
  );
}
