'use client';

import React from 'react';
import { Phone, CreditCard, User, Pencil, History, Award } from 'lucide-react';
import type { Driver, DriverStats, VehicleRequest } from '@/lib/types';
import { DRIVER_STATUS_CONFIG } from '@/lib/constants';
import { getDriverStats } from '@/lib/vehicleStorage';
import { getDriverCurrentStatus } from '@/lib/storage';

interface DriverCardProps {
  driver: Driver;
  isAssigned?: boolean;
  stats?: DriverStats;
  requests?: VehicleRequest[];
  onSelect?: (driver: Driver) => void;
  onEditPhone?: (driver: Driver) => void;
  onViewHistory?: (driver: Driver) => void;
}

export function DriverCard({
  driver,
  isAssigned,
  stats: propStats,
  requests,
  onSelect,
  onEditPhone,
  onViewHistory,
}: DriverCardProps) {
  const runtimeStatus = getDriverCurrentStatus(driver.id, requests);
  const statusCfg = DRIVER_STATUS_CONFIG[runtimeStatus] || DRIVER_STATUS_CONFIG[driver.status] || { label: 'Sẵn sàng', color: 'text-emerald-400' };

  // If stats prop not provided, fetch live stats
  const driverStats = propStats || getDriverStats(driver.id);

  return (
    <div
      onClick={() => onSelect?.(driver)}
      className={`p-3.5 rounded-2xl border transition-all duration-200 ${
        onSelect ? 'cursor-pointer hover:border-cyan-500/30 hover:bg-cyan-500/[0.03]' : ''
      } ${
        isAssigned
          ? 'border-cyan-500/30 bg-cyan-500/[0.06]'
          : 'border-white/[0.06] bg-white/[0.02]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-white truncate">{driver.name}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.color} bg-white/[0.04]`}>
                {statusCfg.label}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-slate-300 font-mono">
                <Phone className="w-3 h-3 text-emerald-400" />
                {driver.phone}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <CreditCard className="w-3 h-3 text-purple-400" />
                Hạng {driver.licenseClass}
              </span>
            </div>

            {/* Trip Stats Badge */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.05]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory?.(driver);
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-xl hover:bg-cyan-500/20 transition-all"
                title="Bấm để xem lịch sử chuyến đi"
              >
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>{driverStats.completedTrips} chuyến xong</span>
                {driverStats.activeTrips > 0 && (
                  <span className="text-[10px] text-amber-400 font-normal">({driverStats.activeTrips} đang chạy)</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        {onEditPhone && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditPhone(driver);
            }}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all shrink-0"
            title="Sửa số điện thoại / thông tin tài xế"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

