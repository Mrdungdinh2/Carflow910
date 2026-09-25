'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { CheckSquare, MapPin, Clock, Building, User, ArrowLeft, Send } from 'lucide-react';
import { getPendingForRole } from '@/lib/storage';
import { VehicleRequest } from '@/lib/types';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { DirectTaskModal } from '@/components/DirectTaskModal';

export default function ApprovePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [showDirectModal, setShowDirectModal] = useState(false);

  const refreshRequests = () => {
    if (!user) return;
    const pending = getPendingForRole(user.role, user.id, user.department);
    pending.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    setRequests(pending);
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!['dept_head', 'tcth', 'director', 'admin'].includes(user.role)) {
      router.push('/');
      return;
    }
    refreshRequests();
  }, [user, router]);

  useSupabaseSync(refreshRequests);

  if (!user) return null;

  const isOversightRole = ['director', 'admin'].includes(user.role);
  const canDirectAssign = ['tcth', 'admin'].includes(user.role);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-28 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-[#9CA3AF] hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-[#D4A855]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">
              {isOversightRole ? 'Giám sát tiến độ phê duyệt' : 'Phê duyệt đề xuất'}
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              <span className="text-[#D4A855] font-bold">{user?.department}</span> • {requests.length} đề xuất đang xử lý
            </p>
          </div>
        </div>

        {/* TCTH Direct Assignment Action Button */}
        {canDirectAssign && (
          <button
            onClick={() => setShowDirectModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Giao việc trực tiếp</span>
          </button>
        )}
      </div>

      {/* Oversight Banner */}
      {isOversightRole && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-[#D4A855] font-bold">
          <span className="text-base">👁️</span>
          <span>
            {user.role === 'director' ? 'Ban Giám đốc' : 'Quản trị viên'} — Quyền giám sát tiến độ phê duyệt toàn chi nhánh.
          </span>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <GlassCard className="p-8 text-center bg-[#121929]/80 border-white/10 rounded-3xl">
            <CheckSquare className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-sm text-[#9CA3AF]">Không có đề xuất nào đang chờ duyệt</p>
          </GlassCard>
        ) : (
          requests.map((req, i) => {
            const dateObj = new Date(req.startDateTime);
            const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={req.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                <GlassCard
                  hover
                  onClick={() => router.push(`/preview?id=${req.id}`)}
                  className="p-4 bg-[#121929]/80 border-white/10 rounded-2xl"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <MapPin className="w-4 h-4 text-[#D4A855]" />
                      <span className="line-clamp-1">{req.destination}</span>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-[#9CA3AF] mb-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{req.requesterName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      <span className="truncate">{req.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Clock className="w-3.5 h-3.5 text-[#D4A855]" />
                      <span>{timeStr} - {dateStr}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="text-[#9CA3AF]">Số lượng: <strong className="text-white">{req.vehicleCount} xe</strong> • <strong className="text-white">{req.personnel?.length || 0} người</strong></span>
                    <span className="text-[#D4A855] font-bold flex items-center gap-0.5">
                      Xem & Xử lý →
                    </span>
                  </div>
                </GlassCard>
              </div>
            );
          })
        )}
      </div>

      {/* Direct Task Modal */}
      <DirectTaskModal
        isOpen={showDirectModal}
        onClose={() => setShowDirectModal(false)}
        onSuccess={refreshRequests}
      />
    </div>
  );
}
