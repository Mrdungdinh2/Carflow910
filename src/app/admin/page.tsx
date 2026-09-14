'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Car, Building, Database, Trash2, Download, RefreshCw, UploadCloud, FileCode } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/lib/AuthContext';
import { clearAllDemoData } from '@/lib/storage';
import { useToast } from '@/components/Toast';
import { generateCustomSqlFromCurrentData, syncAllCurrentDataDirectlyToSupabase } from '@/lib/exportCustomSql';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cleared, setCleared] = useState(false);
  const [syncing, setSyncing] = useState(false);

  if (user?.role !== 'admin') {
    return <div className="p-4 text-center pb-24 text-white">Bạn không có quyền truy cập trang này.</div>;
  }

  const handleClearDemoData = () => {
    if (confirm('Bạn có chắc chắn muốn XÓA SẠCH toàn bộ dữ liệu demo local để chuẩn bị kết nối Supabase?')) {
      clearAllDemoData();
      setCleared(true);
      showToast('Đã xóa sạch toàn bộ dữ liệu demo! Sẵn sàng kết nối Supabase.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
  };

  const handleDownloadCustomSql = () => {
    try {
      const sqlContent = generateCustomSqlFromCurrentData();
      const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `custom_supabase_schema_${new Date().toISOString().slice(0, 10)}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Đã tải xuống file SQL trích xuất từ dữ liệu thực tế của bạn!', 'success');
    } catch (err: any) {
      showToast('Lỗi khi xuất file SQL: ' + err.message, 'error');
    }
  };

  const handleDirectSyncToSupabase = async () => {
    setSyncing(true);
    showToast('Đang tiến hành đẩy toàn bộ Người dùng, Xe, Phòng ban lên Supabase...', 'info');
    const res = await syncAllCurrentDataDirectlyToSupabase();
    setSyncing(false);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="p-4 pb-28 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold mb-6 text-white text-center">Quản trị Hệ thống CarFlow 910</h1>
      
      <div className="grid grid-cols-1 gap-4">
        <Link href="/admin/users">
          <GlassCard className="p-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Quản lý Người dùng</h2>
              <p className="text-xs text-gray-400">Thêm, sửa, xóa tài khoản & phân quyền</p>
            </div>
          </GlassCard>
        </Link>

        <Link href="/admin/vehicles">
          <GlassCard className="p-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Quản lý Phương tiện</h2>
              <p className="text-xs text-gray-400">Danh sách xe, sức chứa & biển số</p>
            </div>
          </GlassCard>
        </Link>

        <Link href="/admin/departments">
          <GlassCard className="p-5 flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Quản lý Phòng ban</h2>
              <p className="text-xs text-gray-400">Danh sách các đơn vị phòng ban</p>
            </div>
          </GlassCard>
        </Link>

        {/* Supabase Dynamic Data Sync & Export Card */}
        <GlassCard className="p-5 border-cyan-500/30 bg-cyan-950/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Đồng bộ Dữ liệu thực tế lên Supabase</h2>
              <p className="text-xs text-cyan-300">Xuất SQL & Đẩy Người dùng, Phương tiện, Phòng ban thực tế</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Công cụ trích xuất chính xác toàn bộ danh sách **Người dùng**, **Phương tiện** và **Phòng ban** mà bạn đã tạo/sửa đổi trong ứng dụng để đồng bộ lên Supabase Database.
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {/* Button 1: Export Custom SQL */}
            <button
              onClick={handleDownloadCustomSql}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <FileCode className="w-4 h-4" /> Tải file SQL từ Dữ liệu thực tế của tôi
            </button>

            {/* Button 2: Direct Supabase Push API */}
            <button
              onClick={handleDirectSyncToSupabase}
              disabled={syncing}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 opacity-80'
              }`}
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Đang đẩy dữ liệu lên Supabase...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-emerald-400" /> Đẩy dữ liệu trực tiếp lên Supabase API
                </>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px] text-slate-400">
            <span>Trạng thái kết nối Supabase:</span>
            <span className={isSupabaseConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {isSupabaseConfigured ? '🟢 Đã cấu hình (.env)' : '🟡 Chưa điền API Key (.env)'}
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
