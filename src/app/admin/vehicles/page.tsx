'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { getVehicles, saveVehicle, deleteVehicle } from '@/lib/vehicleStorage';
import type { Vehicle, VehicleStatus } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Pencil, Trash2, Plus, Search, Car, ArrowLeft, Gauge, Activity } from 'lucide-react';
import Link from 'next/link';

export default function VehiclesAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState<Vehicle>({
    id: '',
    plateNumber: '',
    model: '',
    seats: 4,
    status: 'available',
    currentOdo: 0,
  });
  const [isEdit, setIsEdit] = useState(false);

  const refreshData = () => {
    setVehicles(getVehicles());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const q = searchQuery.toLowerCase().trim();
    return vehicles.filter(
      v =>
        v.plateNumber.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.status.toLowerCase().includes(q)
    );
  }, [vehicles, searchQuery]);

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-white min-h-screen flex flex-col items-center justify-center">
        <GlassCard className="p-6 max-w-md">
          <p className="text-red-400 font-bold mb-2">Không có quyền truy cập</p>
          <p className="text-xs text-slate-400 mb-4">Chỉ tài khoản Admin mới có thể quản lý phương tiện.</p>
          <Link href="/" className="btn-primary inline-block text-xs py-2 px-4">Quay lại trang chủ</Link>
        </GlassCard>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plateNumber.trim() || !formData.model.trim()) {
      showToast('Vui lòng nhập đầy đủ Biển số và Dòng xe', 'error');
      return;
    }

    saveVehicle({
      ...formData,
      id: formData.id || 'veh_' + Date.now(),
      plateNumber: formData.plateNumber.trim().toUpperCase(),
      model: formData.model.trim(),
      seats: formData.seats || 4,
      currentOdo: formData.currentOdo || 0,
    });

    showToast(isEdit ? 'Đã cập nhật phương tiện!' : 'Đã thêm phương tiện mới!', 'success');
    refreshData();
    setShowModal(false);
  };

  const handleEdit = (v: Vehicle) => {
    setFormData(v);
    setIsEdit(true);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteVehicle(deleteTarget.id || deleteTarget.plateNumber);
    showToast(`Đã xóa xe biển số "${deleteTarget.plateNumber}"`, 'success');
    setDeleteTarget(null);
    refreshData();
  };

  const openAddModal = () => {
    setFormData({
      id: 'veh_' + Date.now(),
      plateNumber: '',
      model: '',
      seats: 5,
      status: 'available',
      currentOdo: 0,
    });
    setIsEdit(false);
    setShowModal(true);
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'available':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">Sẵn sàng</span>;
      case 'in_use':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-amber-400 bg-amber-500/10 border border-amber-500/20">Đang đi công tác</span>;
      case 'maintenance':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-rose-400 bg-rose-500/10 border border-rose-500/20">Bảo dưỡng</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Quản lý Phương tiện</h1>
            <p className="text-xs text-slate-400">{vehicles.length} xe ô tô trong đội xe</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Thêm phương tiện
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm theo biển số, dòng xe, trạng thái..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input w-full pl-10 pr-4 py-2.5 text-xs"
        />
      </div>

      {/* Vehicle list */}
      <div className="space-y-3">
        {filteredVehicles.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Car className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Không tìm thấy phương tiện nào</p>
          </GlassCard>
        ) : (
          filteredVehicles.map((v) => (
            <GlassCard key={v.id || v.plateNumber} className="p-4 flex justify-between items-center hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white tracking-wide font-mono">{v.plateNumber}</span>
                    {getStatusBadge(v.status)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{v.model}</span> • <span>{v.seats} chỗ</span>
                    <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      <Gauge className="w-3 h-3" /> {v.currentOdo.toLocaleString()} km
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(v)}
                  className="p-2 text-slate-400 hover:text-emerald-300 hover:bg-white/[0.06] rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(v)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#090d16]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-4 border-emerald-500/30 shadow-2xl my-auto bg-[#121929] rounded-3xl">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-400" />
              {isEdit ? 'Cập nhật Phương tiện' : 'Thêm Phương tiện mới'}
            </h2>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Biển kiểm soát xe</label>
                <input
                  type="text"
                  disabled={isEdit}
                  value={formData.plateNumber}
                  onChange={e => setFormData({ ...formData, plateNumber: e.target.value })}
                  className="glass-input w-full text-xs font-mono disabled:opacity-50"
                  placeholder="Ví dụ: 51G-123.45"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dòng xe / Nhãn hiệu</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  className="glass-input w-full text-xs"
                  placeholder="Ví dụ: Toyota Camry 2.5Q"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Số chỗ ngồi</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={formData.seats}
                    onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 4 })}
                    className="glass-input w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Chỉ số ODO hiện tại (km)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.currentOdo}
                    onChange={e => setFormData({ ...formData, currentOdo: parseInt(e.target.value) || 0 })}
                    className="glass-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Trạng thái vận hành</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                  className="glass-input w-full text-xs [&>option]:bg-slate-900"
                >
                  <option value="available">Sẵn sàng (Available)</option>
                  <option value="in_use">Đang đi công tác (In Use)</option>
                  <option value="maintenance">Đang bảo dưỡng (Maintenance)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Xóa phương tiện"
        message={`Bạn có chắc chắn muốn xóa xe biển số "${deleteTarget?.plateNumber}" (${deleteTarget?.model}) khỏi đội xe?`}
        confirmLabel="Xóa xe"
        cancelLabel="Giữ lại"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
