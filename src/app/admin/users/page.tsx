'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { getUsers, saveUser, deleteUser } from '@/lib/userStorage';
import type { User, UserRole } from '@/lib/types';
import { getDepartments } from '@/lib/departmentStorage';
import { useAuth } from '@/lib/AuthContext';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Pencil, Trash2, Plus, Search, Shield, User as UserIcon, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROLE_CONFIG } from '@/lib/constants';

export default function UsersAdmin() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  
  const [formData, setFormData] = useState<Partial<User> & { newPassword?: string }>({
    id: '',
    username: '',
    newPassword: '',
    name: '',
    role: 'staff',
    department: '',
  });
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const refreshData = () => {
    setUsers(getUsers());
    setDepartments(getDepartments());
  };

  useEffect(() => {
    refreshData();
  }, []);

  useSupabaseSync(refreshData);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        ROLE_CONFIG[u.role]?.label.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-white min-h-screen flex flex-col items-center justify-center">
        <GlassCard className="p-6 max-w-md">
          <p className="text-red-400 font-bold mb-2">Không có quyền truy cập</p>
          <p className="text-xs text-slate-400 mb-4">Chỉ tài khoản Admin mới có thể quản lý người dùng.</p>
          <Link href="/" className="btn-primary inline-block text-xs py-2 px-4">Quay lại trang chủ</Link>
        </GlassCard>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username?.trim() || !formData.name?.trim()) {
      showToast('Vui lòng điền tên đăng nhập và họ tên', 'error');
      return;
    }

    if (!isEdit && !formData.newPassword?.trim()) {
      showToast('Vui lòng nhập mật khẩu cho tài khoản mới', 'error');
      return;
    }

    setSaving(true);
    try {
      // Save user info (without password) to localStorage + Supabase
      saveUser({
        id: formData.id || 'usr_' + Date.now(),
        username: formData.username.trim(),
        name: formData.name.trim(),
        role: (formData.role as UserRole) || 'staff',
        department: formData.department || '',
      } as User);

      // If password provided, set it via secure server-side API
      if (formData.newPassword?.trim()) {
        const pwRes = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username.trim(),
            newPassword: formData.newPassword.trim(),
            adminOverride: true,
          }),
        });
        if (!pwRes.ok) {
          const err = await pwRes.json().catch(() => ({}));
          showToast(err.error || 'Lỗi khi đặt mật khẩu', 'error');
          setSaving(false);
          return;
        }
      }

      showToast(isEdit ? 'Đã cập nhật người dùng!' : 'User đã được tạo thành công!', 'success');
      refreshData();
      setShowModal(false);
    } catch {
      showToast('Lỗi kết nối server', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u: User) => {
    setFormData({
      id: u.id,
      username: u.username,
      newPassword: '', // blank unless changing password
      name: u.name,
      role: u.role,
      department: u.department || '',
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.username === currentUser.username) {
      showToast('Không thể xóa tài khoản của chính bạn!', 'error');
      setDeleteTarget(null);
      return;
    }
    deleteUser(deleteTarget.id || deleteTarget.username);
    showToast(`Đã xóa tài khoản "${deleteTarget.name}"`, 'success');
    setDeleteTarget(null);
    refreshData();
  };

  const openAddModal = () => {
    setFormData({
      id: 'usr_' + Date.now(),
      username: '',
      newPassword: '123456',
      name: '',
      role: 'staff',
      department: departments[0] || 'Phòng Tổng hợp',
    });
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
            <h1 className="text-xl font-bold text-white tracking-tight">Quản lý Người dùng</h1>
            <p className="text-xs text-slate-400">{users.length} tài khoản trong hệ thống</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Thêm người dùng
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm theo họ tên, username, phòng ban..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input w-full pl-10 pr-4 py-2.5 text-xs"
        />
      </div>

      {/* User list */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <UserIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Không tìm thấy người dùng nào</p>
          </GlassCard>
        ) : (
          filteredUsers.map((u) => {
            const roleCfg = ROLE_CONFIG[u.role];
            return (
              <GlassCard key={u.id || u.username} className="p-4 flex justify-between items-center hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{u.name}</span>
                      {roleCfg && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${roleCfg.color} bg-white/[0.06]`}>
                          {roleCfg.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-cyan-400">@{u.username}</span> • {u.department || 'Không có phòng ban'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(u)}
                    className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-white/[0.06] rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(u)}
                    disabled={u.username === currentUser.username}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#090d16]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-4 border-cyan-500/30 shadow-2xl my-auto bg-[#121929] rounded-3xl">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-cyan-400" />
              {isEdit ? 'Cập nhật Người dùng' : 'Tạo Người dùng mới'}
            </h2>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên đăng nhập (username)</label>
                <input
                  type="text"
                  disabled={isEdit}
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="glass-input w-full text-xs disabled:opacity-50"
                  placeholder="Ví dụ: nv.nam"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isEdit ? 'Mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Mật khẩu'}
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  className="glass-input w-full text-xs"
                  placeholder="Nhập mật khẩu"
                  required={!isEdit}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Họ tên hiển thị</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="glass-input w-full text-xs"
                  placeholder="Ví dụ: Nguyễn Văn Nam"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vai trò hệ thống</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="glass-input w-full text-xs [&>option]:bg-slate-900"
                >
                  <option value="staff">Nhân viên (Tạo đề xuất)</option>
                  <option value="dept_head">Trưởng phòng (Duyệt cấp phòng)</option>
                  <option value="tcth">TC-TH (Điều xe & Tài xế)</option>
                  <option value="director">Giám đốc (Xem toàn hệ thống)</option>
                  <option value="driver">Tài xế (Nhiệm vụ chuyến đi)</option>
                  <option value="admin">Admin (Toàn quyền quản trị)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phòng ban</label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="glass-input w-full text-xs [&>option]:bg-slate-900"
                >
                  <option value="">(Không thuộc phòng ban)</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
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
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Xóa người dùng"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${deleteTarget?.name}" (@${deleteTarget?.username}) khỏi hệ thống?`}
        confirmLabel="Xóa tài khoản"
        cancelLabel="Giữ lại"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
