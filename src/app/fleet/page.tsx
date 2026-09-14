'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Car, Users, ArrowLeft, Send, PlusCircle } from 'lucide-react';
import { getVehicles, getDrivers, getFleetStats } from '@/lib/vehicleStorage';
import { Vehicle, Driver, FleetStats } from '@/lib/types';
import { VehicleCard } from '@/components/VehicleCard';
import { DriverCard } from '@/components/DriverCard';
import { DirectTaskModal } from '@/components/DirectTaskModal';

export default function FleetPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'xe' | 'taixe'>('xe');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [showDirectModal, setShowDirectModal] = useState(false);

  const canManage = user && ['tcth', 'admin'].includes(user.role);

  const refreshData = () => {
    setVehicles(getVehicles());
    setDrivers(getDrivers());
    setStats(getFleetStats());
  };

  const handleVehicleStatusChange = (vehicleId: string, newStatus: any) => {
    if (!canManage) return;
    import('@/lib/vehicleStorage').then(({ updateVehicleStatus }) => {
      updateVehicleStatus(vehicleId, newStatus);
      refreshData();
    });
  };

  const handleDriverStatusChange = (driverId: string, newStatus: any) => {
    if (!canManage) return;
    import('@/lib/vehicleStorage').then(({ updateDriverStatus }) => {
      updateDriverStatus(driverId, newStatus);
      refreshData();
    });
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    refreshData();
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-28 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Car className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Tình hình Đội xe & Tài xế</h1>
            <p className="text-xs text-slate-400">VietinBank Chi nhánh Nam Sài Gòn</p>
          </div>
        </div>

        {/* TCTH Direct Task Action Button */}
        {canManage && (
          <button
            onClick={() => setShowDirectModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Giao việc ngay</span>
          </button>
        )}
      </div>

      {/* Permission Notice Banner */}
      {!canManage && (
        <div className="mb-4 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-2.5 text-xs text-cyan-300">
          <span className="text-base">👁️</span>
          <span>
            Bạn đang xem trạng thái khả dụng để phục vụ đăng ký điều xe. Chỉ **Phòng TCTH** mới có quyền thay đổi trạng thái xe/tài xế.
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-slate-800/60 border border-white/10 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('xe')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'xe' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🚗 Danh sách xe ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('taixe')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'taixe' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          👨‍✈️ Danh sách Tài xế ({drivers.length})
        </button>
      </div>

      {/* Tab 1: Vehicles */}
      {activeTab === 'xe' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {stats && (
            <div className="flex gap-2 text-xs mb-4">
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                <div className="text-emerald-400 font-bold text-xl">{stats.availableVehicles}</div>
                <div className="text-slate-400 text-[10px]">Sẵn sàng</div>
              </div>
              <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-center">
                <div className="text-blue-400 font-bold text-xl">{stats.inUseVehicles}</div>
                <div className="text-slate-400 text-[10px]">Đang công tác</div>
              </div>
              <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center">
                <div className="text-amber-400 font-bold text-xl">{stats.maintenanceVehicles}</div>
                <div className="text-slate-400 text-[10px]">Bảo trì</div>
              </div>
            </div>
          )}
          
          <div className="grid gap-3">
            {vehicles.map((v, i) => (
              <div key={v.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                <VehicleCard vehicle={v} />
                {canManage && (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <span className="text-[10px] text-slate-400">Đổi trạng thái:</span>
                    <select
                      value={v.status}
                      onChange={(e) => handleVehicleStatusChange(v.id, e.target.value)}
                      className="text-xs bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="available">Sẵn sàng</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="in_use">Đang sử dụng</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Drivers */}
      {activeTab === 'taixe' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex gap-2 text-xs mb-4">
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                <div className="text-emerald-400 font-bold text-xl">{drivers.filter(d => d.status === 'available').length}</div>
                <div className="text-slate-400 text-[10px]">Sẵn sàng</div>
              </div>
              <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-center">
                <div className="text-blue-400 font-bold text-xl">{drivers.filter(d => d.status === 'on_duty').length}</div>
                <div className="text-slate-400 text-[10px]">Đang chạy</div>
              </div>
              <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center">
                <div className="text-amber-400 font-bold text-xl">{drivers.filter(d => d.status === 'day_off' || d.status === 'sick_leave').length}</div>
                <div className="text-slate-400 text-[10px]">Nghỉ phép/ốm</div>
              </div>
            </div>

          <div className="grid gap-3">
            {drivers.map((d, i) => (
              <div key={d.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                <DriverCard driver={d} />
                {canManage && (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <span className="text-[10px] text-slate-400">Đổi trạng thái:</span>
                    <select
                      value={d.status}
                      onChange={(e) => handleDriverStatusChange(d.id, e.target.value)}
                      className="text-xs bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="available">Sẵn sàng</option>
                      <option value="on_duty">Đang lái</option>
                      <option value="day_off">Nghỉ phép</option>
                      <option value="sick_leave">Nghỉ ốm</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Task Modal for TCTH */}
      <DirectTaskModal
        isOpen={showDirectModal}
        onClose={() => setShowDirectModal(false)}
        onSuccess={refreshData}
      />
    </div>
  );
}
