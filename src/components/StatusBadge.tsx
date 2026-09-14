'use client';

import React from 'react';
import { FileEdit, Clock, CheckCircle, ShieldCheck, XCircle, Building2, PlayCircle, CircleCheckBig } from 'lucide-react';
import type { RequestStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/constants';

interface StatusBadgeProps {
  status: RequestStatus;
  compact?: boolean;
}

const STATUS_ICONS: Record<RequestStatus, React.ReactNode> = {
  draft: <FileEdit className="w-3 h-3" />,
  pending: <Clock className="w-3 h-3" />,
  dept_approved: <Building2 className="w-3 h-3" />,
  tcth_approved: <Clock className="w-3 h-3" />,
  driver_accepted: <PlayCircle className="w-3 h-3" />,
  completed: <CircleCheckBig className="w-3 h-3" />,
  bgd_approved: <ShieldCheck className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
};

export function StatusBadge({ status, compact }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${config.color} ${config.bgColor} ${
        compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
      }`}
    >
      {STATUS_ICONS[status]}
      {config.label}
    </span>
  );
}

export default StatusBadge;
