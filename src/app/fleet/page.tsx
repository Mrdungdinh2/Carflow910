'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Car, Users, ArrowLeft, Send, PlusCircle, CalendarClock } from 'lucide-react';
import { getVehicles, getDrivers, getFleetStats } from '@/lib/vehicleStorage';
import { getRequests, getResourceSchedule } from '@/lib/storage';
import { fetchAndSyncAllFromSupabase } from '@/lib/supabaseStorage';
import { Vehicle, Driver, FleetStats, VehicleRequest } from '@/lib/types';
import { VehicleCard } from '@/components/VehicleCard';
import { DriverCard } from '@/components/DriverCard';
import { DirectTaskModal } from '@/components/DirectTaskModal';
import { DriverEditModal } from '@/components/DriverEditModal';
import { DriverTripHistoryModal } from '@/components/DriverTripHistoryModal';

export default function FleetPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'xe' | 'taixe'>('xe');
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [showDirectModal, setShowDirectModal] = useState(false);

  // Driver modals state
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [historyDriver, setHistoryDriver] = useState<Driver | null>(null);

  const canManage = user && ['tcth', 'admin'].includes(user.role);

  const refreshData = () => {
    setRequests(getRequests());
    setVehicles(getVehicles());
    setDrivers(getDrivers());
    setStats(getFleetStats());
  };

  // Phase 2C: Schedule lấy trực tiếp trong mỗi card qua getResourceSchedule()

  const handleVehicleStatusChange = (vehicleId: string, newStatus: any) => {
    if (!canManage) return;
    // [Fix F] Cảnh báo khi đổi xe đang in_use về available
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle && vehicle.status === 'in_use' && newStatus === 'available') {
      const activeReq = getRequests().find(r =>
        ['driver_accepted', 'tcth_approved'].includes(r.status) &&
        r.assignedVehicleId === vehicleId
      );
      if (activeReq) {
        const ok = window.confirm(
          `⚠️ Xe ${vehicle.plateNumber} đang được gán cho đề xuất "${activeReq.destination}".\n\nBạn chắc chắn muốn đổi về Sẵn sàng?`
        );
        if (!ok) return;
      }
    }
    import('@/lib/vehicleStorage').then(({ updateVehicleStatus }) => {
      updateVehicleStatus(vehicleId, newStatus);
      refreshData();
    });
  };

  const handleDriverStatusChange = (driverId: string, newStatus: any) => {
    if (!canManage) return;
    // [Fix F] Cảnh báo khi đổi TX đang on_duty về available
    const driver = drivers.find(d => d.id === driverId);
    if (driver && driver.status === 'on_duty' && newStatus === 'available') {
      const activeReq = getRequests().find(r =>
        ['driver_accepted', 'tcth_approved'].includes(r.status) &&
        r.assignedDriverId === driverId
      );
      if (activeReq) {
        const ok = window.confirm(
          `⚠️ Tài xế ${driver.name} đang thực hiện nhiệm vụ "${activeReq.destination}".\n\nBạn chắc chắn muốn đổi về Sẵn sàng?`
        );
        if (!ok) return;
      }
    }
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
    // Fetch fresh data from Supabase on page load
    fetchAndSyncAllFromSupabase().then(() => {
      refreshData();
    });
  }, [user, router]);

  useSupabaseSync(refreshData);

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
              <div className="flex-1 bg-purple-500/10 border border-purple-500/20 rounded-xl p-2.5 text-center">
                <div className="text-purple-400 font-bold text-xl">{stats.scheduledTripsToday}</div>
                <div className="text-slate-400 text-[10px]">Lịch hôm nay</div>
              </div>
              <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center">
                <div className="text-amber-400 font-bold text-xl">{stats.maintenanceVehicles}</div>
                <div className="text-slate-400 text-[10px]">Bảo trì</div>
              </div>
            </div>
          )}
          
          <div className="grid gap-3">
            {vehicles.map((v, i) => {
              const schedule = getResourceSchedule('vehicle', v.id);
              const nextTrip = schedule[0];
              return (
              <div key={v.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                <VehicleCard vehicle={v} requests={requests} />
                {/* Mini Schedule: lịch tiếp theo */}
                {nextTrip && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <CalendarClock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-[10px] text-purple-300 font-medium">
                      📅 Tiếp theo: <strong>{new Date(nextTrip.startDateTime).toLocaleDateString('vi-VN')}</strong>{' '}
                      {new Date(nextTrip.startDateTime).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}
                      &ndash;{new Date(nextTrip.endDateTime).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}
                      {' '}&bull; {nextTrip.destination}
                    </span>
                    {schedule.length > 1 && (
                      <span className="text-[9px] text-purple-400/60 ml-auto">+{schedule.length - 1} lịch khác</span>
                    )}
                  </div>
                )}
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
                      <option value="retired">Ngưng sử dụng</option>
                    </select>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Drivers */}
      {activeTab === 'taixe' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex gap-2 text-xs mb-4">
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                <div className="text-emerald-400 font-bold text-xl">{stats?.availableDrivers ?? drivers.filter(d => d.status === 'available').length}</div>
                <div className="text-slate-400 text-[10px]">Sẵn sàng</div>
              </div>
              <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-center">
                <div className="text-blue-400 font-bold text-xl">{stats?.onDutyDrivers ?? drivers.filter(d => d.status === 'on_duty').length}</div>
                <div className="text-slate-400 text-[10px]">Đang chạy</div>
              </div>
              <div className="flex-1 bg-purple-500/10 border border-purple-500/20 rounded-xl p-2.5 text-center">
                <div className="text-purple-400 font-bold text-xl">{stats?.scheduledTripsTomorrow ?? 0}</div>
                <div className="text-slate-400 text-[10px]">Lịch ngày mai</div>
              </div>
              <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center">
                <div className="text-amber-400 font-bold text-xl">{drivers.filter(d => d.status === 'day_off' || d.status === 'sick_leave').length}</div>
                <div className="text-slate-400 text-[10px]">Nghỉ phép/ốm</div>
              </div>
            </div>

          <div className="grid gap-3">
            {drivers.map((d, i) => {
              const schedule = getResourceSchedule('driver', d.id);
              const nextTrip = schedule[0];
              return (
              <div key={d.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
                <DriverCard
                  driver={d}
                  requests={requests}
                  onEditPhone={canManage ? (driverToEdit) => setEditingDriver(driverToEdit) : undefined}
                  onViewHistory={(driverToView) => setHistoryDriver(driverToView)}
                />
                {/* Mini Schedule: lịch tiếp theo */}
                {nextTrip && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <CalendarClock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-[10px] text-purple-300 font-medium">
                      📅 Tiếp theo: <strong>{new Date(nextTrip.startDateTime).toLocaleDateString('vi-VN')}</strong>{' '}
                      {new Date(nextTrip.startDateTime).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}
                      &ndash;{new Date(nextTrip.endDateTime).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}
                      {' '}&bull; {nextTrip.destination}
                    </span>
                    {schedule.length > 1 && (
                      <span className="text-[9px] text-purple-400/60 ml-auto">+{schedule.length - 1} lịch khác</span>
                    )}
                  </div>
                )}
                {canManage && (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <span className="text-[10px] text-slate-400">Đổi trạng thái:</span>
                    <select
                      value={d.status}
                      onChange={(e) => handleDriverStatusChange(d.id, e.target.value)}
                      className="text-xs bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="available">Sẵn sàng</option>
                      <option value="day_off">Nghỉ phép</option>
                      <option value="sick_leave">Nghỉ ốm</option>
                    </select>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Direct Task Modal for TCTH */}
      <DirectTaskModal
        isOpen={showDirectModal}
        onClose={() => setShowDirectModal(false)}
        onSuccess={refreshData}
      />

      {/* Driver Edit Phone & Details Modal */}
      <DriverEditModal
        driver={editingDriver}
        isOpen={!!editingDriver}
        onClose={() => setEditingDriver(null)}
        onSuccess={refreshData}
      />

      {/* Driver Trip History Modal */}
      <DriverTripHistoryModal
        driver={historyDriver}
        isOpen={!!historyDriver}
        onClose={() => setHistoryDriver(null)}
      />
    </div>
  );
}
