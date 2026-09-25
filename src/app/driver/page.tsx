'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Truck, Clock, PlayCircle, CheckCircle2, Car, Phone, Pencil, Award } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/lib/AuthContext';
import { getRequests } from '@/lib/storage';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { getVehicles, getDriverById } from '@/lib/vehicleStorage';
import { DriverEditModal } from '@/components/DriverEditModal';
import type { VehicleRequest, Driver } from '@/lib/types';

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [editingSelf, setEditingSelf] = useState<Driver | null>(null);

  const vehicles = useMemo(() => {
    if (typeof window !== 'undefined') return getVehicles();
    return [];
  }, [mounted]);

  const currentDriver = useMemo(() => {
    if (!user) return null;
    return getDriverById(user.id) || {
      id: user.id,
      name: user.name,
      phone: '0901234567',
      licenseClass: 'B2',
      status: 'available' as const
    };
  }, [user, mounted]);

  useEffect(() => {
    setMounted(true);
    setRequests(getRequests());
  }, []);

  useSupabaseSync(() => {
    setRequests(getRequests());
  });

  const driverRequests = useMemo(() => {
    if (!user) return [];
    const uId = user.id.toLowerCase();
    const uName = user.name.toLowerCase();
    return requests.filter(r => {
      if (!r.assignedDriverId) return false;
      const assigned = r.assignedDriverId.toLowerCase();
      return assigned === uId || assigned === uName;
    });
  }, [requests, user]);

  const pendingRequests = useMemo(() => driverRequests.filter(r => r.status === 'tcth_approved'), [driverRequests]);
  const inProgressRequests = useMemo(() => driverRequests.filter(r => r.status === 'driver_accepted'), [driverRequests]);
  const completedRequests = useMemo(() => driverRequests.filter(r => r.status === 'completed'), [driverRequests]);

  if (!mounted || !user) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="animate-pulse-soft"><Truck className="w-12 h-12 text-[#D4A855]" /></div>
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
      <header className="mb-4 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white">Nhiệm vụ của tôi</h1>
              <p className="text-[10px] text-[#9CA3AF]">Tài xế: <span className="text-white font-bold">{user.name}</span></p>
            </div>
          </div>

          <button
            onClick={() => currentDriver && setEditingSelf(currentDriver)}
            className="flex items-center gap-1 text-xs text-white bg-white/[0.06] hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-all"
            title="Đổi số điện thoại cá nhân"
          >
            <Phone className="w-3.5 h-3.5 text-[#D4A855]" />
            <span className="font-mono">{currentDriver?.phone}</span>
            <Pencil className="w-3 h-3 text-[#9CA3AF] ml-1" />
          </button>
        </div>

        {/* Driver Personal Achievement Stats Banner */}
        <div className="grid grid-cols-3 gap-2 text-center my-4">
          <GlassCard className="p-3 bg-emerald-500/10 border-emerald-500/20">
            <div className="text-xl font-bold text-[#D4A855]">{completedRequests.length}</div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5 font-bold flex items-center justify-center gap-1">
              <Award className="w-3 h-3 text-[#D4A855]" />
              Đã hoàn thành
            </div>
          </GlassCard>
          <GlassCard className="p-3 bg-amber-500/10 border-amber-500/20">
            <div className="text-xl font-bold text-[#D4A855]">{inProgressRequests.length}</div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5 font-bold">Đang thực hiện</div>
          </GlassCard>
          <GlassCard className="p-3 bg-purple-500/10 border-purple-500/20">
            <div className="text-xl font-bold text-[#D4A855]">{pendingRequests.length}</div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5 font-bold">Chờ nhận việc</div>
          </GlassCard>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-white/[0.04] rounded-xl mb-6 animate-slide-up">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'pending' ? 'bg-white/10 text-white shadow-sm' : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Chờ nhận ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'in_progress' ? 'bg-white/10 text-white shadow-sm' : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Đang thực hiện ({inProgressRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'completed' ? 'bg-white/10 text-white shadow-sm' : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Đã xong ({completedRequests.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {activeList.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Truck className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
            <p className="text-sm text-[#9CA3AF]">Không có nhiệm vụ nào trong mục này</p>
          </GlassCard>
        ) : (
          activeList.map(req => {
            const vehicle = vehicles.find(v => v.id === req.assignedVehicleId);
            return (
            <Link key={req.id} href={`/preview?id=${req.id}`}>
              <GlassCard hover className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate">{req.destination || 'Chưa có nơi đến'}</p>
                    <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{req.requesterName} • {req.department}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="bg-white/[0.02] rounded-lg p-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#D4A855]" />
                    <div>
                      <p className="text-[#9CA3AF] text-[10px]">Thời gian</p>
                      <p className="text-white font-bold">
                        {req.startDateTime ? new Date(req.startDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'} - {req.startDateTime ? new Date(req.startDateTime).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/[0.02] rounded-lg p-2 flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-[#D4A855]" />
                    <div>
                      <p className="text-[#9CA3AF] text-[10px]">Đón tại</p>
                      <p className="text-white font-bold truncate">{req.pickupLocation}</p>
                    </div>
                  </div>
                  {vehicle && (
                    <div className="bg-white/[0.02] rounded-lg p-2 flex items-center gap-2 col-span-2 mt-2">
                      <Car className="w-3.5 h-3.5 text-[#D4A855]" />
                      <div>
                        <p className="text-[#9CA3AF] text-[10px]">Xe</p>
                        <p className="text-white font-bold">{vehicle.plateNumber} • {vehicle.model}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {req.status === 'tcth_approved' && (
                    <div className="flex-1 py-2 bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-purple-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-purple-500/20">
                      <PlayCircle className="w-4 h-4" /> Bấm để nhận
                    </div>
                  )}
                  {req.status === 'driver_accepted' && (
                    <div className="flex-1 py-2 bg-gradient-to-r from-emerald-600/20 to-green-600/20 text-[#D4A855] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-500/20">
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

      {/* Driver Self Edit Phone Modal */}
      <DriverEditModal
        driver={editingSelf}
        isOpen={!!editingSelf}
        onClose={() => setEditingSelf(null)}
        onSuccess={() => setMounted(prev => !prev)}
      />
    </div>
  );
}
