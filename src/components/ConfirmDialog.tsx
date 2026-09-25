'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'btn-danger'
      : 'btn-primary';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#090d16]/85 backdrop-blur-xl animate-fade-in"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative w-full max-w-sm max-h-[85vh] overflow-y-auto my-auto bg-[#121929]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl animate-slide-up">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            variant === 'danger' ? 'bg-red-500/10' : 'bg-cyan-500/10'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              variant === 'danger' ? 'text-[#D4A855]' : 'text-[#D4A855]'
            }`} />
          </div>

          {/* Content */}
          <h3 className="text-lg font-extrabold text-white mb-2">{title}</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 pt-0">
          <button onClick={onCancel} className="btn-secondary flex-1 text-sm py-2.5">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`${confirmBtnClass} flex-1 text-sm py-2.5`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
