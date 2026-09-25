'use client';

import React from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_CONFIG } from '@/lib/constants';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const { user, logout } = useAuth();

  if (!isOpen || !user) return null;

  const roleCfg = ROLE_CONFIG[user.role];

  const handleConfirmLogout = () => {
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#090d16]/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto my-auto">
        <GlassCard className="p-6 border-white/10 shadow-2xl relative overflow-hidden bg-[#121929] rounded-3xl">
          {/* Top glow accent */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#f4c3af]/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-lg">
              <LogOut className="w-6 h-6 text-[#D4A855]" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Xác nhận đăng xuất</h3>
              <p className="text-xs text-[#D4A855] mt-0.5 font-bold">VietinBank Chi nhánh Nam Sài Gòn</p>
            </div>
          </div>

          {/* User info summary box */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f4c3af]/20 border border-[#f4c3af]/30 flex items-center justify-center text-[#D4A855] font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-[#9CA3AF]">{user.department || 'Ban điều hành'}</p>
              </div>
            </div>
            {roleCfg && (
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${roleCfg.color} bg-white/[0.06] border border-white/10`}>
                {roleCfg.label}
              </span>
            )}
          </div>

          <p className="text-xs text-white mb-6 leading-relaxed">
            Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại trên hệ thống CarFlow910?
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmLogout}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất ngay
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
