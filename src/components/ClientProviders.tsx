'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/Toast';
import AuthGuard from '@/components/AuthGuard';
import { AuroraBackground } from '@/components/AuroraBackground';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { fetchAndSyncAllFromSupabase } from '@/lib/supabaseStorage';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    fetchAndSyncAllFromSupabase();
  }, []);

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
