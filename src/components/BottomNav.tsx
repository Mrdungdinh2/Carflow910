'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, Clock, CheckSquare, Car, Activity, Truck, Settings, CreditCard, QrCode } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/lib/types';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  // Hidden on specific paths
  if (pathname === '/new' || pathname.startsWith('/preview') || pathname === '/login') {
    return null;
  }

  const getNavItems = (role: UserRole) => {
    const items = [
      { path: '/', label: 'Trang chủ', icon: Home },
    ];

    switch (role) {
      case 'admin':
        items.push({ path: '/fleet', label: 'Đoàn xe', icon: Car });
        items.push({ path: '/admin', label: 'Quản trị', icon: Settings });
        break;
      case 'staff':
        items.push({ path: '/fleet', label: 'Đoàn xe', icon: Car });
        items.push({ path: '/history', label: 'Lịch sử', icon: Clock });
        break;
      case 'dept_head':
        items.push({ path: '/approve', label: 'Phê duyệt', icon: CheckSquare });
        items.push({ path: '/fleet', label: 'Đoàn xe', icon: Car });
        items.push({ path: '/history', label: 'Lịch sử', icon: Clock });
        break;
      case 'tcth':
        items.push({ path: '/approve', label: 'Phê duyệt', icon: CheckSquare });
        items.push({ path: '/fleet', label: 'Đoàn xe', icon: Car });
        items.push({ path: '/history', label: 'Lịch sử', icon: Clock });
        break;
      case 'director':
        items.push({ path: '/fleet', label: 'Đoàn xe', icon: Car });
        items.push({ path: '/history', label: 'Lịch sử', icon: Clock });
        break;
      case 'driver':
        items.push({ path: '/driver', label: 'Nhiệm vụ', icon: Truck });
        items.push({ path: '/fleet', label: 'Đoàn xe', icon: Car });
        break;
    }
    return items;
  };

  const navItems = getNavItems(user.role);
  const leftItem = navItems[0];
  const rightItem = navItems[1] || navItems[0];

  const isHome = pathname === '/';

  return (
    <div className="fixed bottom-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto bg-[#121929]/95 backdrop-blur-2xl border border-[#D4A855]/15 px-6 py-2 rounded-full shadow-2xl flex items-center justify-between gap-8 max-w-sm w-full">
        
        {/* ══ HOME BUTTON — Nổi bật, dễ nhìn ══ */}
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 p-1 transition-all group relative"
        >
          <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isHome 
              ? 'bg-gradient-to-br from-[#D4A855] to-[#B8902E] shadow-lg shadow-[#D4A855]/30 scale-110' 
              : 'bg-[#D4A855]/10 border border-[#D4A855]/25 group-hover:bg-[#D4A855]/20 group-hover:scale-105'
          }`}>
            <Home className={`w-5 h-5 transition-colors ${isHome ? 'text-[#0c1322]' : 'text-[#D4A855]'}`} />
            {isHome && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D4A855] shadow-[0_0_6px_#D4A855]" />
            )}
          </div>
          <span className={`text-[9px] font-bold transition-colors ${isHome ? 'text-[#D4A855]' : 'text-[#9CA3AF]'}`}>Home</span>
        </Link>

        {/* ══ Center Glowing Action Button ══ */}
        <Link
          href="/new"
          className="relative -top-5 group"
          title="Tạo đề xuất xe mới"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4A855] via-[#B8902E] to-[#D4A855] p-0.5 shadow-2xl shadow-[#D4A855]/30 group-hover:scale-110 transition-transform">
            <div className="w-full h-full rounded-full bg-[#0c1322] flex items-center justify-center text-white">
              <QrCode className="w-6 h-6 text-[#D4A855]" />
            </div>
          </div>
        </Link>

        {/* ══ Right Nav Button ══ */}
        <Link
          href={rightItem.path}
          className={`flex flex-col items-center gap-0.5 p-1 transition-all ${
            pathname === rightItem.path ? 'text-[#D4A855]' : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          {React.createElement(rightItem.icon, { className: 'w-5 h-5' })}
          <span className="text-[9px] font-bold">{rightItem.label}</span>
        </Link>

      </div>
    </div>
  );
}
