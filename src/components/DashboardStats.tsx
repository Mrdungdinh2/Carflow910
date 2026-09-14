'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { DashboardStats } from '@/lib/types';

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statItems = [
    {
      id: 'total',
      label: 'Tổng yêu cầu',
      value: stats.total,
      icon: FileText,
      iconColor: 'text-cyan-400',
      glowColor: 'shadow-cyan-500/10',
    },
    {
      id: 'pending',
      label: 'Chờ duyệt',
      value: stats.pending,
      icon: Clock,
      iconColor: 'text-amber-400',
      glowColor: 'shadow-amber-500/10',
    },
    {
      id: 'approved',
      label: 'Đã duyệt',
      value: stats.approved,
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      glowColor: 'shadow-emerald-500/10',
    },
    {
      id: 'rejected',
      label: 'Từ chối',
      value: stats.rejected,
      icon: XCircle,
      iconColor: 'text-red-400',
      glowColor: 'shadow-red-500/10',
    },
    {
      id: 'completed',
      label: 'Hoàn thành',
      value: stats.completed,
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      glowColor: 'shadow-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <GlassCard key={item.id} className={`p-4 ${item.glowColor}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-slate-400 font-medium">{item.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
            </div>
            <div
              className={`text-2xl font-bold text-white transition-all duration-700 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {item.value}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

export default DashboardStats;
