'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { RejectionReason } from '@/lib/types';
import { REJECTION_REASONS } from '@/lib/constants';

interface RejectionModalProps {
  isOpen: boolean;
  onReject: (reason: RejectionReason, detail?: string) => void;
  onCancel: () => void;
}

const REASONS: { key: RejectionReason; label: string }[] = Object.entries(REJECTION_REASONS).map(
  ([key, label]) => ({ key: key as RejectionReason, label })
);

export function RejectionModal({ isOpen, onReject, onCancel }: RejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState<RejectionReason | null>(null);
  const [detail, setDetail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedReason) return;
    onReject(selectedReason, detail.trim() || undefined);
    setSelectedReason(null);
    setDetail('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#090d16]/85 backdrop-blur-xl animate-fade-in" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-[#121929]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#D4A855]" />
            </div>
            <h3 className="text-base font-extrabold text-white">Từ chối đề xuất</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-full text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reasons */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-bold text-[#9CA3AF] mb-3">Chọn lý do từ chối:</p>
          {REASONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelectedReason(r.key)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                selectedReason === r.key
                  ? 'border-red-500/30 bg-red-500/[0.08] text-[#D4A855]'
                  : 'border-white/[0.06] bg-white/[0.02] text-white hover:bg-white/[0.04]'
              }`}
            >
              {r.label}
            </button>
          ))}

          {/* Detail input (shown for 'other' or always) */}
          <div className="mt-3">
            <label className="text-xs font-bold text-[#9CA3AF] mb-1 block">Ghi chú thêm (tùy chọn)</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Nhập chi tiết lý do..."
              className="glass-textarea w-full text-sm min-h-[60px]"
              rows={2}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/[0.06] flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 text-sm py-2.5">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason}
            className="btn-danger flex-1 text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
}
