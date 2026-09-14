'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { getDepartments, addDepartment, updateDepartment, deleteDepartment } from '@/lib/departmentStorage';
import { useAuth } from '@/lib/AuthContext';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Pencil, Trash2, Plus, Search, Building, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DepartmentsAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [oldDeptName, setOldDeptName] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const refreshData = () => {
    setDepartments(getDepartments());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useSupabaseSync(refreshData);

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase().trim();
    return departments.filter(d => d.toLowerCase().includes(q));
  }, [departments, searchQuery]);

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-white min-h-screen flex flex-col items-center justify-center">
        <GlassCard className="p-6 max-w-md">
          <p className="text-red-400 font-bold mb-2">Không có quyền truy cập</p>
          <p className="text-xs text-slate-400 mb-4">Chỉ tài khoản Admin mới có thể quản lý phòng ban.</p>
          <Link href="/" className="btn-primary inline-block text-xs py-2 px-4">Quay lại trang chủ</Link>
        </GlassCard>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) {
      showToast('Vui lòng nhập tên phòng ban', 'error');
      return;
    }

    if (isEdit) {
      updateDepartment(oldDeptName, deptName.trim());
      showToast(`Đã cập nhật phòng ban "${deptName.trim()}"`, 'success');
    } else {
      addDepartment(deptName.trim());
      showToast(`Đã thêm phòng ban mới "${deptName.trim()}"`, 'success');
    }
    refreshData();
    setShowModal(false);
  };

  const handleEdit = (dept: string) => {
    setDeptName(dept);
    setOldDeptName(dept);
    setIsEdit(true);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteDepartment(deleteTarget);
    showToast(`Đã xóa phòng ban "${deleteTarget}"`, 'success');
    setDeleteTarget(null);
    refreshData();
  };

  const openAddModal = () => {
    setDeptName('');
    setIsEdit(false);
    setShowModal(true);
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
            <h1 className="text-xl font-bold text-white tracking-tight">Quản lý Phòng ban</h1>
            <p className="text-xs text-slate-400">{departments.length} phòng ban tại chi nhánh</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Thêm phòng ban
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm tên phòng ban..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input w-full pl-10 pr-4 py-2.5 text-xs"
        />
      </div>

      {/* Department List */}
      <div className="space-y-3">
        {filteredDepartments.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Building className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Không tìm thấy phòng ban nào</p>
          </GlassCard>
        ) : (
          filteredDepartments.map((dept) => (
            <GlassCard key={dept} className="p-4 flex justify-between items-center hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">{dept}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">VietinBank CN Nam Sài Gòn</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(dept)}
                  className="p-2 text-slate-400 hover:text-purple-300 hover:bg-white/[0.06] rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(dept)}
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
          <GlassCard className="w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-4 border-purple-500/30 shadow-2xl my-auto bg-[#121929] rounded-3xl">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-400" />
              {isEdit ? 'Cập nhật Phòng ban' : 'Thêm Phòng ban mới'}
            </h2>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên phòng ban</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  className="glass-input w-full text-xs"
                  placeholder="Ví dụ: Phòng Khách hàng Doanh nghiệp"
                  required
                  autoFocus
                />
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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all"
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
        title="Xóa phòng ban"
        message={`Bạn có chắc chắn muốn xóa phòng ban "${deleteTarget}" khỏi danh sách?`}
        confirmLabel="Xóa phòng ban"
        cancelLabel="Giữ lại"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
