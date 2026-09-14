'use client';

import React from 'react';
import { Phone, CreditCard, User } from 'lucide-react';
import type { Driver } from '@/lib/types';
import { DRIVER_STATUS_CONFIG } from '@/lib/constants';

interface DriverCardProps {
  driver: Driver;
  isAssigned?: boolean;
  onSelect?: (driver: Driver) => void;
}

export function DriverCard({ driver, isAssigned, onSelect }: DriverCardProps) {
  const statusCfg = DRIVER_STATUS_CONFIG[driver.status];

  return (
    <div
      onClick={() => onSelect?.(driver)}
      className={`p-3.5 rounded-xl border transition-all duration-200 ${
        onSelect ? 'cursor-pointer hover:border-cyan-500/30 hover:bg-cyan-500/[0.03]' : ''
      } ${
        isAssigned
          ? 'border-cyan-500/30 bg-cyan-500/[0.06]'
          : 'border-white/[0.06] bg-white/[0.02]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{driver.name}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Phone className="w-3 h-3" />
                {driver.phone}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <CreditCard className="w-3 h-3" />
                Hạng {driver.licenseClass}
              </span>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusCfg.color} bg-white/[0.04]`}>
          {statusCfg.label}
        </span>
      </div>
    </div>
  );
}
