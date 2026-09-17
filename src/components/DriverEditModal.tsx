'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, CreditCard, X, Save } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useToast } from '@/components/Toast';
import { saveDriver } from '@/lib/vehicleStorage';
import type { Driver } from '@/lib/types';

interface DriverEditModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DriverEditModal({ driver, isOpen, onClose, onSuccess }: DriverEditModalProps) {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Driver>({
    id: '',
    name: '',
    phone: '',
    licenseClass: 'B2',
    status: 'available',
  });

  useEffect(() => {
    if (driver) {
      setFormData({ ...driver });
    }
  }, [driver]);

  if (!isOpen || !driver) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPhone = formData.phone.trim();
    const trimmedName = formData.name.trim();

    if (!trimmedPhone) {
      showToast('Vui lòng nhập số điện thoại của tài xế', 'error');
      return;
    }

    if (!trimmedName) {
      showToast('Vui lòng nhập họ tên tài xế', 'error');
      return;
    }

    saveDriver({
      ...formData,
      name: trimmedName,
      phone: trimmedPhone,
    });

    showToast(`Đã cập nhật thông tin tài xế ${trimmedName}!`, 'success');
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#090d16]/85 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <GlassCard className="w-full max-w-md p-6 space-y-5 border-cyan-500/30 shadow-2xl bg-[#121929] rounded-3xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Chỉnh sửa thông tin Tài xế</h2>
              <p className="text-[11px] text-slate-400">Cập nhật Số điện thoại & Hạng bằng lái</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Họ và tên Tài xế
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập họ tên..."
              className="glass-input w-full text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Số điện thoại liên hệ
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ví dụ: 0901234567"
              className="glass-input w-full text-xs font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                Hạng bằng lái
              </label>
              <select
                value={formData.licenseClass}
                onChange={(e) => setFormData({ ...formData, licenseClass: e.target.value })}
                className="glass-input w-full text-xs [&>option]:bg-slate-900"
              >
                <option value="B1">Hạng B1</option>
                <option value="B2">Hạng B2</option>
                <option value="C">Hạng C</option>
                <option value="D">Hạng D</option>
                <option value="E">Hạng E</option>
                <option value="FC">Hạng FC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Trạng thái làm việc
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="glass-input w-full text-xs [&>option]:bg-slate-900"
              >
                <option value="available">Sẵn sàng</option>
                <option value="on_duty">Đang chạy</option>
                <option value="day_off">Nghỉ phép</option>
                <option value="sick_leave">Nghỉ ốm</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
