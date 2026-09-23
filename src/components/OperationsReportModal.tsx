import React, { useState, useEffect, useMemo } from 'react';
import { X, Car, Users, Activity, Calendar, Clock } from 'lucide-react';
import { getRequests } from '@/lib/storage';
import { getVehicles, getDrivers, getFleetStats } from '@/lib/vehicleStorage';
import type { VehicleRequest, Vehicle, Driver, FleetStats } from '@/lib/types';

// Simple date helpers to avoid date-fns dependency
function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}
function isNextDay(d: Date, base: Date) {
  const next = new Date(base);
  next.setDate(next.getDate() + 1);
  return isSameDay(d, next);
}
function formatTime(d: Date) {
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function formatDateShort(d: Date) {
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
function formatDateTimeFull(d: Date) {
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString('vi-VN')}`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function OperationsReportModal({ isOpen, onClose }: Props) {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setRequests(getRequests());
    setVehicles(getVehicles());
    setDrivers(getDrivers());
    setFleetStats(getFleetStats());
  };

  if (!isOpen) return null;

  // Process data for display
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Vehicles — status from types.ts: 'available' | 'in_use' | 'reserved' | 'maintenance' | 'retired'
  const totalVehicles = vehicles.length;
  const readyVehicles = fleetStats?.availableVehicles ?? vehicles.filter(v => v.status === 'available').length;
  const activeVehicles = fleetStats?.inUseVehicles ?? vehicles.filter(v => v.status === 'in_use').length;
  const maintenanceVehicles = fleetStats?.maintenanceVehicles ?? vehicles.filter(v => v.status === 'maintenance').length;

  // Drivers — status from types.ts: 'available' | 'on_duty' | 'reserved' | 'day_off' | 'sick_leave'
  const totalDrivers = drivers.length;
  const readyDrivers = fleetStats?.availableDrivers ?? drivers.filter(d => d.status === 'available').length;
  const activeDrivers = fleetStats?.onDutyDrivers ?? drivers.filter(d => d.status === 'on_duty').length;
  const leaveDrivers = drivers.filter(d => d.status === 'day_off' || d.status === 'sick_leave').length;

  // Schedule requests
  const upcomingRequests = requests
    .filter(r => 
      (r.status === 'tcth_approved' || r.status === 'driver_accepted') && 
      r.startDateTime && new Date(r.startDateTime).getTime() >= todayStart.getTime()
    )
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  // Split: today vs future
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const todayRequests = upcomingRequests.filter(r => {
    const t = new Date(r.startDateTime).getTime();
    return t >= todayStart.getTime() && t < todayEnd.getTime();
  });
  const futureRequests = upcomingRequests.filter(r => {
    return new Date(r.startDateTime).getTime() >= todayEnd.getTime();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#090d16]/90 backdrop-blur-xl">
      <div className="w-full max-w-6xl max-h-[90vh] bg-[#121929] border border-white/10 rounded-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Báo cáo Vận hành</h2>
              <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Cập nhật lúc: {formatDateTimeFull(new Date())}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Section 1: Fleet & Driver Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Stats */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-400" />
                Tổng quan Đội xe
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/[0.03] border border-emerald-500/20 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs text-gray-400 font-medium mb-1">Sẵn sàng</span>
                  <div className="flex items-end gap-2 mt-auto">
                    <span className="text-3xl font-bold text-emerald-400">{readyVehicles}</span>
                    <span className="text-sm text-gray-500 pb-1">/ {totalVehicles}</span>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-cyan-500/20 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs text-gray-400 font-medium mb-1">Đang hoạt động</span>
                  <div className="flex items-end gap-2 mt-auto">
                    <span className="text-3xl font-bold text-cyan-400">{activeVehicles}</span>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-amber-500/20 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs text-gray-400 font-medium mb-1">Đang bảo trì</span>
                  <div className="flex items-end gap-2 mt-auto">
                    <span className="text-3xl font-bold text-amber-400">{maintenanceVehicles}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Stats */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Tổng quan Tài xế
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/[0.03] border border-emerald-500/20 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs text-gray-400 font-medium mb-1">Sẵn sàng</span>
                  <div className="flex items-end gap-2 mt-auto">
                    <span className="text-3xl font-bold text-emerald-400">{readyDrivers}</span>
                    <span className="text-sm text-gray-500 pb-1">/ {totalDrivers}</span>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-cyan-500/20 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs text-gray-400 font-medium mb-1">Đang công tác</span>
                  <div className="flex items-end gap-2 mt-auto">
                    <span className="text-3xl font-bold text-cyan-400">{activeDrivers}</span>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-amber-500/20 rounded-2xl p-4 flex flex-col">
                  <span className="text-xs text-gray-400 font-medium mb-1">Nghỉ phép</span>
                  <div className="flex items-end gap-2 mt-auto">
                    <span className="text-3xl font-bold text-amber-400">{leaveDrivers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Lịch trình hiện tại (Hôm nay) */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Lịch trình hiện tại
                <span className="text-xs text-gray-500 font-normal">({todayRequests.length} chuyến)</span>
              </h3>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-[45vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                        <th className="px-4 py-3 font-medium">Thời gian</th>
                        <th className="px-4 py-3 font-medium">Nơi đến</th>
                        <th className="px-4 py-3 font-medium">Xe & Tài xế</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/5">
                      {todayRequests.length === 0 ? (
                         <tr>
                           <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                             Hôm nay không có lịch trình
                           </td>
                         </tr>
                      ) : (
                        todayRequests.map(req => {
                          const reqDate = new Date(req.startDateTime);
                          const vehicle = vehicles.find(v => v.id === req.assignedVehicleId);
                          const driver = drivers.find(d => d.id === req.assignedDriverId);
                          return (
                            <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3">
                                <div className="text-white font-medium">{formatTime(reqDate)}</div>
                                <div className="text-xs text-emerald-400">Hôm nay</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-gray-300 max-w-[150px] truncate" title={req.destination}>
                                  {req.destination}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-cyan-400 text-xs font-medium">{vehicle?.plateNumber || '-'}</div>
                                <div className="text-gray-400 text-xs">{driver?.name || '-'}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {req.status === 'driver_accepted' ? 'Đã nhận' : 'Đã duyệt'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Lịch trình tương lai */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Lịch trình tương lai
                <span className="text-xs text-gray-500 font-normal">({futureRequests.length} chuyến)</span>
              </h3>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-[45vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                        <th className="px-4 py-3 font-medium">Thời gian</th>
                        <th className="px-4 py-3 font-medium">Nơi đến</th>
                        <th className="px-4 py-3 font-medium">Xe & Tài xế</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/5">
                      {futureRequests.length === 0 ? (
                         <tr>
                           <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                             Chưa có lịch trình tương lai
                           </td>
                         </tr>
                      ) : (
                        futureRequests.map(req => {
                          const reqDate = new Date(req.startDateTime);
                          let dateLabel = formatDateShort(reqDate);
                          if (isNextDay(reqDate, now)) dateLabel = 'Ngày mai';

                          const vehicle = vehicles.find(v => v.id === req.assignedVehicleId);
                          const driver = drivers.find(d => d.id === req.assignedDriverId);
                          return (
                            <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3">
                                <div className="text-white font-medium">{formatTime(reqDate)}</div>
                                <div className="text-xs text-gray-500">{dateLabel}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-gray-300 max-w-[150px] truncate" title={req.destination}>
                                  {req.destination}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-cyan-400 text-xs font-medium">{vehicle?.plateNumber || '-'}</div>
                                <div className="text-gray-400 text-xs">{driver?.name || '-'}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  {req.status === 'driver_accepted' ? 'Đã nhận' : 'Đã duyệt'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
