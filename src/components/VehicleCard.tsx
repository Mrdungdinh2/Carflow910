'use client';

import React from 'react';
import { Car, Users, Gauge } from 'lucide-react';
import type { Vehicle, VehicleRequest } from '@/lib/types';
import { VEHICLE_STATUS_CONFIG } from '@/lib/constants';
import { getVehicleCurrentStatus } from '@/lib/storage';

interface VehicleCardProps {
  vehicle: Vehicle;
  isAssigned?: boolean;
  requests?: VehicleRequest[];
  onSelect?: (vehicle: Vehicle) => void;
}

export function VehicleCard({ vehicle, isAssigned, requests, onSelect }: VehicleCardProps) {
  const runtimeStatus = getVehicleCurrentStatus(vehicle.id, requests);
  const statusCfg = VEHICLE_STATUS_CONFIG[runtimeStatus] || VEHICLE_STATUS_CONFIG[vehicle.status];

  return (
    <div
      onClick={() => onSelect?.(vehicle)}
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
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">{vehicle.plateNumber}</p>
            <p className="text-xs text-slate-400">{vehicle.model}</p>
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusCfg.color} bg-white/[0.04]`}>
          {statusCfg.label}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {vehicle.seats} chỗ
        </div>
        <div className="flex items-center gap-1">
          <Gauge className="w-3 h-3" />
          {vehicle.currentOdo.toLocaleString('vi-VN')} km
        </div>
      </div>

      {vehicle.notes && (
        <p className="text-[10px] text-amber-400/80 mt-2 italic">⚠ {vehicle.notes}</p>
      )}
    </div>
  );
}
