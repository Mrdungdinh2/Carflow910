'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Crown, Bell, Settings, Car } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_CONFIG } from '@/lib/constants';
import { LogoutModal } from '@/components/LogoutModal';

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Do not render on login page
  if (!user || pathname === '/login') return null;

  const roleCfg = user ? ROLE_CONFIG[user.role] : null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: VietinBank Premium Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1c263b] to-[#090d16] border border-[#f4c3af]/40 flex items-center justify-center text-[#f4c3af] shadow-md group-hover:scale-105 transition-transform">
              <Car className="w-4.5 h-4.5 text-[#f4c3af]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-[0.15em] text-white uppercase leading-none">
                VIETINBANK
              </span>
              <span className="text-[7.5px] font-extrabold uppercase tracking-[0.2em] text-[#f4c3af] mt-0.5">
                N A M  S À I  G Ò N
              </span>
            </div>
          </Link>

          {/* Right Header Icons */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Crown Premium Badge */}
            <div className="w-8 h-8 rounded-full bg-[#f4c3af]/10 border border-[#f4c3af]/30 flex items-center justify-center text-[#f4c3af]" title="VietinBank Nam Sài Gòn">
              <Crown className="w-4 h-4" />
            </div>

            {/* Notification Bell */}
            <Link href="/approve" className="relative w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-md">
                9+
              </span>
            </Link>

            {/* Admin Settings (if admin) */}
            {user.role === 'admin' && (
              <Link href="/admin" className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors" title="Quản trị hệ thống">
                <Settings className="w-4 h-4" />
              </Link>
            )}

            {/* User Chip */}
            <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
              <div className="w-6 h-6 rounded-full bg-[#f4c3af]/20 flex items-center justify-center text-[#f4c3af] font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[110px]">
                {user.name}
              </span>
              {roleCfg && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleCfg.color} bg-white/[0.06]`}>
                  {roleCfg.label}
                </span>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 transition-all text-xs font-medium cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Thoát</span>
            </button>
          </div>
        </div>
      </header>

      {/* Logout confirmation dialog */}
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
    </>
  );
}
