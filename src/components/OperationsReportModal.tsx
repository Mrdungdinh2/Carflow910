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

/* ====================================================================
   BẢNG MÀU CHỦ ĐẠO (chỉ 3 màu):
   ● Trắng:      #FFFFFF  — tiêu đề, số liệu nổi bật
   ● Vàng đồng:  #D4A855  — accent, highlight, giá trị quan trọng
   ● Xám nhạt:   #9CA3AF  — text phụ, mô tả, nhãn
   ==================================================================== */

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#090d16]/95 backdrop-blur-xl">
      <div
        className="w-full max-w-md max-h-[95vh] bg-[#121929] border border-[#D4A855]/20 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl shadow-[#D4A855]/5 animate-modal-slide-up"
      >
        
        {/* ═══════ Header ═══════ */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4A855]/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4A855]/15 flex items-center justify-center border border-[#D4A855]/25">
              <Activity className="w-5 h-5 text-[#D4A855]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">Báo cáo Vận hành</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#D4A855]" /> {formatDateTimeFull(new Date())}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
            <X className="w-5 h-5 text-[#9CA3AF]" />
          </button>
        </div>

        {/* ═══════ Scrollable Content ═══════ */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* ──── Section 1: Đội xe ──── */}
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-3 uppercase tracking-wide">
              <Car className="w-4 h-4 text-[#D4A855]" />
              Tổng quan Đội xe
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.03] border border-[#D4A855]/20 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-[#9CA3AF] font-bold block uppercase tracking-wider">Sẵn sàng</span>
                <div className="mt-1.5">
                  <span className="text-2xl font-black text-[#D4A855]">{readyVehicles}</span>
                  <span className="text-xs text-[#9CA3AF] font-bold ml-1">/ {totalVehicles}</span>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-[#9CA3AF] font-bold block uppercase tracking-wider">Hoạt động</span>
                <div className="mt-1.5">
                  <span className="text-2xl font-black text-white">{activeVehicles}</span>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-[#9CA3AF] font-bold block uppercase tracking-wider">Bảo trì</span>
                <div className="mt-1.5">
                  <span className="text-2xl font-black text-[#9CA3AF]">{maintenanceVehicles}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ──── Section 2: Tài xế ──── */}
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-3 uppercase tracking-wide">
              <Users className="w-4 h-4 text-[#D4A855]" />
              Tổng quan Tài xế
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/[0.03] border border-[#D4A855]/20 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-[#9CA3AF] font-bold block uppercase tracking-wider">Sẵn sàng</span>
                <div className="mt-1.5">
                  <span className="text-2xl font-black text-[#D4A855]">{readyDrivers}</span>
                  <span className="text-xs text-[#9CA3AF] font-bold ml-1">/ {totalDrivers}</span>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-[#9CA3AF] font-bold block uppercase tracking-wider">Công tác</span>
                <div className="mt-1.5">
                  <span className="text-2xl font-black text-white">{activeDrivers}</span>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-[#9CA3AF] font-bold block uppercase tracking-wider">Nghỉ phép</span>
                <div className="mt-1.5">
                  <span className="text-2xl font-black text-[#9CA3AF]">{leaveDrivers}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ──── Divider ──── */}
          <div className="border-t border-[#D4A855]/10" />

          {/* ──── Section 3: Lịch trình hôm nay (Card-based mobile layout) ──── */}
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-3 uppercase tracking-wide">
              <Clock className="w-4 h-4 text-[#D4A855]" />
              Lịch trình hôm nay
              <span className="text-[10px] text-[#D4A855] font-bold bg-[#D4A855]/10 px-2 py-0.5 rounded-full border border-[#D4A855]/20 ml-auto normal-case tracking-normal">
                {todayRequests.length} chuyến
              </span>
            </h3>

            {todayRequests.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-8 text-center">
                <p className="text-sm text-[#9CA3AF] font-bold">Hôm nay không có lịch trình</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayRequests.map(req => {
                  const reqDate = new Date(req.startDateTime);
                  const vehicle = vehicles.find(v => v.id === req.assignedVehicleId);
                  const driver = drivers.find(d => d.id === req.assignedDriverId);
                  return (
                    <div key={req.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3.5 hover:border-[#D4A855]/20 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{req.destination}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-bold text-[#D4A855]">{formatTime(reqDate)}</span>
                            <span className="text-[10px] text-[#9CA3AF] font-bold">• Hôm nay</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-[#D4A855]/10 text-[#D4A855] border border-[#D4A855]/20 shrink-0">
                          {req.status === 'driver_accepted' ? 'Đã nhận' : 'Đã duyệt'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-white/[0.05]">
                        <span className="text-xs font-bold text-white">{vehicle?.plateNumber || '—'}</span>
                        <span className="text-xs font-bold text-[#9CA3AF]">{driver?.name || '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ──── Section 4: Lịch trình tương lai (Card-based mobile layout) ──── */}
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-3 uppercase tracking-wide">
              <Calendar className="w-4 h-4 text-[#D4A855]" />
              Lịch trình sắp tới
              <span className="text-[10px] text-[#9CA3AF] font-bold bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/10 ml-auto normal-case tracking-normal">
                {futureRequests.length} chuyến
              </span>
            </h3>

            {futureRequests.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-8 text-center">
                <p className="text-sm text-[#9CA3AF] font-bold">Chưa có lịch trình sắp tới</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {futureRequests.map(req => {
                  const reqDate = new Date(req.startDateTime);
                  let dateLabel = formatDateShort(reqDate);
                  if (isNextDay(reqDate, now)) dateLabel = 'Ngày mai';

                  const vehicle = vehicles.find(v => v.id === req.assignedVehicleId);
                  const driver = drivers.find(d => d.id === req.assignedDriverId);
                  return (
                    <div key={req.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3.5 hover:border-[#D4A855]/20 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{req.destination}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-bold text-[#D4A855]">{formatTime(reqDate)}</span>
                            <span className="text-[10px] text-[#9CA3AF] font-bold">• {dateLabel}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-white/[0.04] text-white border border-white/10 shrink-0">
                          {req.status === 'driver_accepted' ? 'Đã nhận' : 'Đã duyệt'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-white/[0.05]">
                        <span className="text-xs font-bold text-white">{vehicle?.plateNumber || '—'}</span>
                        <span className="text-xs font-bold text-[#9CA3AF]">{driver?.name || '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom padding for safe area */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
