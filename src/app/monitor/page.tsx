'use client';

import React, { useState, useEffect } from 'react';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity, Car, Clock, ShieldAlert, History } from 'lucide-react';
import { getFleetStats, getActivityLogs } from '@/lib/vehicleStorage';
import { getRequests } from '@/lib/storage';
import { FleetStats, ActivityLog, VehicleRequest } from '@/lib/types';
import { GlassCard } from '@/components/GlassCard';

export default function MonitorPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [requests, setRequests] = useState<VehicleRequest[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!['tcth', 'director'].includes(user.role)) {
      router.push('/');
      return;
    }

    setStats(getFleetStats());
    setLogs(getActivityLogs(10));
    setRequests(getRequests());
  }, [user, router]);

  useSupabaseSync(() => {
    setStats(getFleetStats());
    setLogs(getActivityLogs(10));
    setRequests(getRequests());
  });

  if (!user || !['tcth', 'director'].includes(user.role)) return null;

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const deptApprovedCount = requests.filter(r => r.status === 'dept_approved').length;
  const tcthApprovedCount = requests.filter(r => r.status === 'tcth_approved').length;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-cyan-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Giám sát hoạt động</h1>
      </div>

      <div className="space-y-6">
        {/* Section 1: Fleet Stats */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Car className="w-4 h-4" /> Tổng quan đoàn xe
          </h2>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <GlassCard className="p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.availableVehicles}</div>
                <div className="text-xs text-slate-400 mt-1">Xe trống</div>
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.inUseVehicles}</div>
                <div className="text-xs text-slate-400 mt-1">Xe đang dùng</div>
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.reservedVehicles}</div>
                <div className="text-xs text-slate-400 mt-1">Xe đang đợi</div>
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.maintenanceVehicles}</div>
                <div className="text-xs text-slate-400 mt-1">Xe bảo trì</div>
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.reservedDrivers ?? 0}</div>
                <div className="text-xs text-slate-400 mt-1">TX đang đợi</div>
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <div className="text-2xl font-bold text-slate-200">{stats.totalDrivers}</div>
                <div className="text-xs text-slate-400 mt-1">Tổng tài xế</div>
              </GlassCard>
            </div>
          )}
        </section>

        {/* Section 2: Pending Requests */}
        <section className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Đề xuất chờ xử lý
          </h2>
          <GlassCard className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Chờ TP duyệt:</span>
                <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">{pendingCount}</span>
              </div>
              <div className="h-px w-full bg-white/5"></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Chờ TCTH duyệt:</span>
                <span className="font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{deptApprovedCount}</span>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Section 3: Recent Activities */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Hoạt động gần đây
          </h2>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">Chưa có hoạt động nào</p>
            ) : (
              logs.map(log => {
                const dateObj = new Date(log.timestamp);
                const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                return (
                  <GlassCard key={log.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200">{log.description}</p>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                          <span>Bởi: <span className="text-slate-400">{log.userId === 'system' ? 'Hệ thống' : (log.userName || log.userId)}</span></span>
                          <span>{timeStr} {dateStr}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
