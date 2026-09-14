'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/lib/AuthContext';
import LoginScreen from '@/components/LoginScreen';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-cyan-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <div className="text-center space-y-4 max-w-md p-8 bg-red-900/20 border border-red-500/30 rounded-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold text-red-400">Không có quyền truy cập</h2>
          <p className="text-slate-300">
            Tài khoản của bạn ({user.role}) không có quyền xem trang này.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
