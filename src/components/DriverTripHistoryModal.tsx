'use client';

import React, { useState, useMemo } from 'react';
import { User, Phone, CheckCircle2, Clock, Calendar, MapPin, X, Car, Filter } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { getRequests } from '@/lib/storage';
import { getVehicles } from '@/lib/vehicleStorage';
import type { Driver, VehicleRequest, TimeFilterPreset } from '@/lib/types';

interface DriverTripHistoryModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DriverTripHistoryModal({ driver, isOpen, onClose }: DriverTripHistoryModalProps) {
  const [timePreset, setTimePreset] = useState<TimeFilterPreset>('all');

  const requests = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return getRequests();
  }, [isOpen]);

  const vehicles = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return getVehicles();
  }, [isOpen]);

  const driverRequests = useMemo(() => {
    if (!driver) return [];
    const dId = driver.id.toLowerCase();
    const dName = driver.name.toLowerCase();

    return requests.filter(r => {
      if (!r.assignedDriverId) return false;
      const assigned = r.assignedDriverId.toLowerCase();
      return assigned === dId || assigned === dName;
    });
  }, [driver, requests]);

  const filteredRequests = useMemo(() => {
    if (timePreset === 'all') return driverRequests;

    const now = new Date();
    return driverRequests.filter(r => {
      const date = new Date(r.startDateTime || r.createdAt);
      if (isNaN(date.getTime())) return false;

      if (timePreset === 'today') {
        return date.toDateString() === now.toDateString();
      }
      if (timePreset === 'this_week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return date >= startOfWeek;
      }
      if (timePreset === 'this_month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (timePreset === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      }
      return true;
    });
  }, [driverRequests, timePreset]);

  const stats = useMemo(() => {
    const total = driverRequests.length;
    const completed = driverRequests.filter(r => r.status === 'completed').length;
    const active = driverRequests.filter(r => ['tcth_approved', 'driver_accepted'].includes(r.status)).length;
    return { total, completed, active };
  }, [driverRequests]);

  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 bg-[#090d16]/85 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <GlassCard className="w-full max-w-xl max-h-[85vh] flex flex-col p-6 border-cyan-500/30 shadow-2xl bg-[#121929] rounded-3xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {driver.name}
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Hạng {driver.licenseClass}
                </span>
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-emerald-400" />
                {driver.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Chips */}
        <div className="grid grid-cols-3 gap-2.5 py-4 shrink-0">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-400">{stats.completed}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Đã hoàn thành</div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-cyan-400">{stats.active}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Đang chạy / chờ nhận</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-purple-400">{stats.total}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Tổng số chuyến</div>
          </div>
        </div>

        {/* Time Preset Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 shrink-0 no-scrollbar border-b border-white/[0.06]">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'today', label: 'Hôm nay' },
            { key: 'this_week', label: 'Tuần này' },
            { key: 'this_month', label: 'Tháng này' },
            { key: 'last_month', label: 'Tháng trước' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setTimePreset(opt.key as TimeFilterPreset)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                timePreset === opt.key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Trip List */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Không có chuyến đi nào trong khoảng thời gian này</p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const vehicle = vehicles.find(v => v.id === req.assignedVehicleId);
              return (
                <div
                  key={req.id}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="text-xs font-bold text-white">{req.destination || 'Chưa có điểm đến'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{req.requesterName} • {req.department}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {req.startDateTime ? new Date(req.startDateTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      {req.pickupLocation || 'Trụ sở CN'}
                    </span>
                    {vehicle && (
                      <span className="flex items-center gap-1 col-span-2 text-violet-300">
                        <Car className="w-3 h-3 text-violet-400" />
                        Xe: {vehicle.plateNumber} ({vehicle.model})
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
}
