'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Truck, Clock, PlayCircle, CheckCircle2, Car } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/lib/AuthContext';
import { getRequests } from '@/lib/storage';
import { getVehicles } from '@/lib/vehicleStorage';
import type { VehicleRequest } from '@/lib/types';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  const vehicles = useMemo(() => {
    if (typeof window !== 'undefined') return getVehicles();
    return [];
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    setRequests(getRequests());
  }, []);

  const driverRequests = useMemo(() => {
    if (!user) return [];
    return requests.filter(r => r.assignedDriverId === user.id);
  }, [requests, user]);

  const pendingRequests = useMemo(() => driverRequests.filter(r => r.status === 'tcth_approved'), [driverRequests]);
  const inProgressRequests = useMemo(() => driverRequests.filter(r => r.status === 'driver_accepted'), [driverRequests]);
  const completedRequests = useMemo(() => driverRequests.filter(r => r.status === 'completed'), [driverRequests]);

  if (!mounted || !user) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="animate-pulse-soft"><Truck className="w-12 h-12 text-cyan-400" /></div>
      </div>
    );
  }

  const getActiveList = () => {
    if (activeTab === 'pending') return pendingRequests;
    if (activeTab === 'in_progress') return inProgressRequests;
    return completedRequests;
  };

  const activeList = getActiveList();

  return (
    <div className="page-container pb-24">
      <header className="mb-6 animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Nhiệm vụ của tôi</h1>
            <p className="text-[10px] text-slate-400">Quản lý các chuyến đi được phân công</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-white/[0.04] rounded-xl mb-6 animate-slide-up">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'pending' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Chờ nhận ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'in_progress' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Đang thực hiện ({inProgressRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'completed' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Đã xong ({completedRequests.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {activeList.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Không có nhiệm vụ nào trong mục này</p>
          </GlassCard>
        ) : (
          activeList.map(req => {
            const vehicle = vehicles.find(v => v.id === req.assignedVehicleId);
            return (
            <Link key={req.id} href={`/preview?id=${req.id}`}>
              <GlassCard hover className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-white truncate">{req.destination || 'Chưa có nơi đến'}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{req.requesterName} • {req.department}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="bg-white/[0.02] rounded-lg p-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <div>
                      <p className="text-slate-500 text-[10px]">Thời gian</p>
                      <p className="text-slate-300 font-medium">
                        {req.startDateTime ? new Date(req.startDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'} - {req.startDateTime ? new Date(req.startDateTime).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/[0.02] rounded-lg p-2 flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-purple-400" />
                    <div>
                      <p className="text-slate-500 text-[10px]">Đón tại</p>
                      <p className="text-slate-300 font-medium truncate">{req.pickupLocation}</p>
                    </div>
                  </div>
                  {vehicle && (
                    <div className="bg-white/[0.02] rounded-lg p-2 flex items-center gap-2 col-span-2 mt-2">
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                      <div>
                        <p className="text-slate-500 text-[10px]">Xe</p>
                        <p className="text-slate-300 font-medium">{vehicle.plateNumber} • {vehicle.model}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {req.status === 'tcth_approved' && (
                    <div className="flex-1 py-2 bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-purple-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-purple-500/20">
                      <PlayCircle className="w-4 h-4" /> Bấm để nhận
                    </div>
                  )}
                  {req.status === 'driver_accepted' && (
                    <div className="flex-1 py-2 bg-gradient-to-r from-emerald-600/20 to-green-600/20 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" /> Bấm để hoàn thành
                    </div>
                  )}
                </div>
              </GlassCard>
            </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
