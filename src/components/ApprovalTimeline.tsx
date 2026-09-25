'use client';

import React from 'react';
import { CheckCircle, XCircle, Clock, Send, Truck, ArrowRight } from 'lucide-react';
import type { ApprovalEntry, UserRole } from '@/lib/types';
import { ROLE_CONFIG, REJECTION_REASONS } from '@/lib/constants';
import type { RejectionReason } from '@/lib/types';

interface ApprovalTimelineProps {
  history: ApprovalEntry[];
  currentStatus: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  submit: <Send className="w-3.5 h-3.5" />,
  approve: <CheckCircle className="w-3.5 h-3.5" />,
  reject: <XCircle className="w-3.5 h-3.5" />,
  assign_vehicle: <Truck className="w-3.5 h-3.5" />,
  return: <ArrowRight className="w-3.5 h-3.5" />,
};

const ACTION_COLORS: Record<string, string> = {
  submit: 'text-[#D4A855] bg-blue-400/10 border-blue-400/20',
  approve: 'text-[#D4A855] bg-emerald-400/10 border-emerald-400/20',
  reject: 'text-[#D4A855] bg-red-400/10 border-red-400/20',
  assign_vehicle: 'text-[#D4A855] bg-cyan-400/10 border-cyan-400/20',
  return: 'text-[#D4A855] bg-amber-400/10 border-amber-400/20',
};

const ACTION_LABELS: Record<string, string> = {
  submit: 'Gửi duyệt',
  approve: 'Đã duyệt',
  reject: 'Từ chối',
  assign_vehicle: 'Gán xe & tài xế',
  return: 'Trả xe',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ApprovalTimeline({ history, currentStatus }: ApprovalTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
        <p className="text-xs text-[#9CA3AF]">Chưa có lịch sử duyệt</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/[0.06]" />

      <div className="space-y-4">
        {history.map((entry, i) => {
          const colorClass = ACTION_COLORS[entry.action] || ACTION_COLORS.submit;
          const roleLabel = ROLE_CONFIG[entry.byRole]?.label || entry.byRole;
          const isLast = i === history.length - 1;

          return (
            <div key={entry.id} className="relative">
              {/* Dot */}
              <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${colorClass}`}>
                {ACTION_ICONS[entry.action]}
              </div>

              {/* Content */}
              <div className={`ml-2 ${isLast ? '' : 'pb-1'}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-white">
                    {ACTION_LABELS[entry.action] || entry.action}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] bg-white/[0.04] px-1.5 py-0.5 rounded">
                    {roleLabel}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  {entry.byName} • {formatDateTime(entry.timestamp)}
                </p>
                {entry.note && (
                  <p className="text-xs text-[#9CA3AF] mt-1 italic">&quot;{entry.note}&quot;</p>
                )}
                {entry.rejectionReason && (
                  <p className="text-xs text-[#D4A855] mt-1">
                    {REJECTION_REASONS[entry.rejectionReason as RejectionReason] || entry.rejectionReason}
                    {entry.rejectionDetail && `: ${entry.rejectionDetail}`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
