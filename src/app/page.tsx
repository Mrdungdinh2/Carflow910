'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Car, Sparkles, ChevronRight, Calendar, LogOut, CheckSquare, PlusCircle,
  Clock, Activity, Truck, Settings, ShieldCheck, BarChart3, FileText,
  Eye, EyeOff, ArrowRight, MapPin, Compass, X, Info, Trash2, Pencil
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { getRequests, getPendingForRole, deleteRequest } from '@/lib/storage';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_CONFIG } from '@/lib/constants';
import type { VehicleRequest, DashboardStats as DashboardStatsType } from '@/lib/types';
import { LogoutModal } from '@/components/LogoutModal';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [allRequests, setAllRequests] = useState<VehicleRequest[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showStatsNumber, setShowStatsNumber] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Dashboard Modals
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showKmModal, setShowKmModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useSupabaseSync(() => {
    setAllRequests(getRequests());
  });

  useEffect(() => {
    setMounted(true);
    setAllRequests(getRequests());
  }, []);

  const userRequests = useMemo(() => {
    if (user?.role === 'staff') {
      return allRequests.filter(r => r.department === user.department);
    }
    if (user?.role === 'dept_head') {
      return allRequests.filter(r => r.department === user.department);
    }
    if (user?.role === 'driver') {
      return allRequests.filter(r => r.assignedDriverId === user.id);
    }
    return allRequests;
  }, [allRequests, user]);

  const recentRequests = useMemo(() => {
    return userRequests.slice(0, 4);
  }, [userRequests]);

  const stats: DashboardStatsType = useMemo(() => ({
    total: userRequests.length,
    pending: userRequests.filter(r => ['pending', 'dept_approved'].includes(r.status)).length,
    approved: userRequests.filter(r => ['tcth_approved', 'driver_accepted', 'completed'].includes(r.status)).length,
    rejected: userRequests.filter(r => r.status === 'rejected').length,
    completed: userRequests.filter(r => r.status === 'completed').length,
  }), [userRequests]);

  const pendingCount = useMemo(() => {
    if (!user) return 0;
    return getPendingForRole(user.role, user.id, user.department).length;
  }, [user]);

  const totalKm = useMemo(() => {
    return allRequests
      .filter(r => r.status === 'completed' && r.tripOdoStart && r.tripOdoEnd)
      .reduce((sum, r) => sum + ((r.tripOdoEnd || 0) - (r.tripOdoStart || 0)), 0);
  }, [allRequests]);

  if (!mounted) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="animate-pulse-soft"><Car className="w-12 h-12 text-[#f4c3af]" /></div>
      </div>
    );
  }

  const roleCfg = user ? ROLE_CONFIG[user.role] : null;

  return (
    <div className="page-container pb-28">
      
      {/* 1. User Header Bar */}
      <div className="mb-5 animate-slide-up flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f4c3af] to-[#e0a98b] p-0.5 shadow-lg shadow-[#f4c3af]/20">
              <div className="w-full h-full rounded-full bg-[#090d16] flex items-center justify-center text-[#f4c3af] font-bold text-base">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-wide text-white">
              {user?.name || 'DINH TUAN DUNG'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {roleCfg && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${roleCfg.color} bg-white/[0.06] border border-white/10`}>
                  {roleCfg.label}
                </span>
              )}
              <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                🏢 {user?.department || 'VietinBank Nam Sài Gòn'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
        >
          <span>Đăng xuất</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#f4c3af]" />
        </button>
      </div>

      {/* 2. Premium Metallic Rose-Gold Card */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#fce7f3] via-[#f4c3af] to-[#e0a98b] text-slate-950 shadow-2xl shadow-[#f4c3af]/15 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold tracking-widest text-slate-800 uppercase">
              **** **** 7002 • VIETINBANK
            </span>
            <button
              onClick={() => setShowStatsNumber(!showStatsNumber)}
              className="p-1 text-slate-800 hover:text-slate-950 transition-colors"
              title="Ẩn/Hiện số liệu"
            >
              {showStatsNumber ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
                Hệ thống Quản lý & Đăng ký Điều xe
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 mt-0.5">
                {showStatsNumber ? `${stats.total} Đề xuất • ${totalKm.toLocaleString()} km` : '*** *** ***'}
              </h2>
            </div>
            
            <Link href="/new" className="w-11 h-11 rounded-full bg-slate-950 text-[#f4c3af] flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Quick Nav Tabs */}
      <div className="mb-6 animate-slide-up overflow-x-auto no-scrollbar" style={{ animationDelay: '0.08s' }}>
        <div className="flex items-center gap-2.5" style={{ minWidth: 'max-content' }}>
          <Link href="/new" className="flex items-center gap-2 bg-white/[0.05] border border-white/10 hover:bg-white/10 px-4 py-2.5 rounded-full text-xs font-semibold text-slate-200 transition-all">
            <PlusCircle className="w-4 h-4 text-[#f4c3af]" />
            <span>Tạo đề xuất mới</span>
          </Link>
          <Link href="/fleet" className="flex items-center gap-2 bg-white/[0.05] border border-white/10 hover:bg-white/10 px-4 py-2.5 rounded-full text-xs font-semibold text-slate-200 transition-all">
            <Car className="w-4 h-4 text-purple-400" />
            <span>Xem tình hình xe</span>
          </Link>
          <Link href="/history" className="flex items-center gap-2 bg-white/[0.05] border border-white/10 hover:bg-white/10 px-4 py-2.5 rounded-full text-xs font-semibold text-slate-200 transition-all">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Lịch sử chuyến đi</span>
          </Link>
          {pendingCount > 0 && ['dept_head', 'tcth', 'director'].includes(user?.role || '') && (
            <Link href="/approve" className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 rounded-full text-xs font-semibold text-rose-300 transition-all animate-pulse">
              <CheckSquare className="w-4 h-4 text-rose-400" />
              <span>Phê duyệt ngay ({pendingCount})</span>
            </Link>
          )}
          {['admin', 'tcth'].includes(user?.role || '') && (
            <Link href="/admin/requests" className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 px-4 py-2.5 rounded-full text-xs font-semibold text-violet-300 transition-all">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span>Quản lý đề xuất</span>
            </Link>
          )}
        </div>
      </div>

      {/* 4. Highlight Ecosystem Banner */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative rounded-3xl p-5 bg-gradient-to-r from-[#0c182b] via-[#102340] to-[#0c182b] border border-cyan-500/20 shadow-xl overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Hệ sinh thái số VietinBank</p>
            <h3 className="text-sm font-bold text-white mt-0.5">Số hóa quy trình điều xe Nam Sài Gòn</h3>
            <div className="flex gap-2 mt-3">
              <Link href="/new" className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-1 rounded-full hover:bg-cyan-500/20">
                → Đăng ký nhanh
              </Link>
              <button onClick={() => setShowTemplateModal(true)} className="text-[10px] bg-white/5 text-slate-300 border border-white/10 px-2.5 py-1 rounded-full hover:bg-white/10">
                → Xuất Docx Mẫu 02
              </button>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Car className="w-7 h-7 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* 5. "Chức năng yêu thích" Grid Container (Role Customized) */}
      <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.12s' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-white tracking-tight">Chức năng yêu thích</h2>
          <span className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
            Phân quyền: <strong className="text-cyan-400">{roleCfg?.label}</strong>
          </span>
        </div>

        <div className="bg-[#121929]/90 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl grid grid-cols-3 gap-y-6 gap-x-2">
          
          {/* Item 1: Tạo đề xuất */}
          <Link href="/new" className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f4c3af]/20 to-[#e0a98b]/20 border border-[#f4c3af]/30 flex items-center justify-center text-[#f4c3af] group-hover:scale-110 transition-transform mb-2">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-200 leading-tight">Tạo đề xuất</span>
          </Link>

          {/* Item 2: Phê duyệt / Đề xuất của tôi (Role tailored) */}
          {user?.role === 'staff' ? (
            <Link href="/history" className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-200 leading-tight">Đề xuất của tôi</span>
            </Link>
          ) : (
            <Link href="/approve" className="flex flex-col items-center text-center group relative">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-2">
                <CheckSquare className="w-6 h-6" />
              </div>
              {pendingCount > 0 && (
                <span className="absolute top-0 right-3 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow animate-bounce">
                  {pendingCount}
                </span>
              )}
              <span className="text-[11px] font-medium text-slate-200 leading-tight">
                {user?.role === 'director' ? 'Giám sát duyệt' : 'Phê duyệt'}
              </span>
            </Link>
          )}

          {/* Item 3: Đội xe công tác */}
          <Link href="/fleet" className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform mb-2">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-200 leading-tight">Tình hình Đội xe</span>
          </Link>

          {/* Item 4: Giám sát GPS */}
          <Link href="/monitor" className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-2">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-200 leading-tight">Giám sát GPS</span>
          </Link>

          {/* Item 5: Lịch sử điều xe */}
          <Link href="/history" className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-2">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-200 leading-tight">Lịch sử điều xe</span>
          </Link>

          {/* Item 6: Admin / Driver Mission — chỉ hiện cho driver, admin, tcth */}
          {user?.role === 'admin' ? (
            <Link href="/admin" className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform mb-2">
                <Settings className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-200 leading-tight">Quản trị Admin</span>
            </Link>
          ) : ['driver', 'tcth'].includes(user?.role || '') ? (
            <Link href="/driver" className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-2">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-200 leading-tight">Nhiệm vụ tài xế</span>
            </Link>
          ) : null}

          {/* Item 7: Quy định an toàn (Interactive Modal) */}
          <button onClick={() => setShowSafetyModal(true)} className="flex flex-col items-center text-center group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-200 leading-tight">Quy định an toàn</span>
          </button>

          {/* Item 8: Thống kê km (Interactive Modal) */}
          <button onClick={() => setShowKmModal(true)} className="flex flex-col items-center text-center group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform mb-2">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-200 leading-tight">Thống kê km</span>
          </button>

          {/* Item 9: Mẫu 02/GĐNSDX (Interactive Modal) */}
          <button onClick={() => setShowTemplateModal(true)} className="flex flex-col items-center text-center group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-slate-200 leading-tight">Mẫu 02/GĐNSDX</span>
          </button>

        </div>
      </div>

      {/* 6. Recent Requests List */}
      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-white tracking-tight">Đề xuất gần đây</h2>
          {allRequests.length > 4 && (
            <Link href="/history" className="flex items-center gap-1 text-xs text-[#f4c3af] hover:underline">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentRequests.length === 0 ? (
          <GlassCard className="p-8 text-center bg-[#121929]/80 border-white/10 rounded-3xl">
            <Car className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Chưa có đề xuất nào</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((req) => {
              const isPending = req.status === 'pending';
              const isOwner = req.requesterId === user?.id;
              const canEdit = isPending && isOwner;
              return (
              <div key={req.id} className="relative">
                <Link href={canEdit ? `/new?id=${req.id}` : `/preview?id=${req.id}`}>
                  <GlassCard hover className="p-4 bg-[#121929]/80 border-white/10 rounded-2xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{req.destination}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{req.requesterName} • {req.department}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={req.status} />
                      </div>
                    </div>

                    {/* Edit/Delete Actions — chỉ hiện khi trạng thái Chờ phê duyệt */}
                    {canEdit && (
                      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-white/[0.06]">
                        <span
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/new?id=${req.id}`; }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-semibold hover:bg-cyan-500/20 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          Chỉnh sửa
                        </span>
                        <span
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget({ id: req.id, name: req.destination || req.requesterName }); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold hover:bg-red-500/20 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Xóa
                        </span>
                        <span className="flex-1" />
                        <span className="text-[9px] text-slate-600 italic">Đang chờ duyệt — có thể sửa/xóa</span>
                      </div>
                    )}
                  </GlassCard>
                </Link>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Xóa đề xuất?"
        message={`Bạn có chắc muốn xóa đề xuất "${deleteTarget?.name || ''}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Giữ lại"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) {
            deleteRequest(deleteTarget.id);
            setAllRequests(getRequests());
            showToast('Đã xóa đề xuất', 'success');
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Logout modal */}
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />

      {/* Item 7: Safety Regulations Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#090d16]/90 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-[#121929] border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in">
            <button onClick={() => setShowSafetyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Quy định Sử dụng Xe công tác</h3>
                <p className="text-xs text-slate-400">VietinBank Chi nhánh Nam Sài Gòn</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <strong className="text-white block mb-1">1. Đăng ký trước giờ đi:</strong>
                Đăng ký đề xuất tối thiểu **2 tiếng** trước giờ xuất phát (trừ trường hợp khẩn cấp).
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <strong className="text-white block mb-1">2. Trách nhiệm người đi xe:</strong>
                Giữ gìn vệ sinh chung, không mang chất dễ cháy nổ lên phương tiện.
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <strong className="text-white block mb-1">3. Phân công Phòng TCTH:</strong>
                Tài xế và phương tiện sẽ được Phòng TCTH gán căn cứ theo tính cấp bách và khả dụng.
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <strong className="text-white block mb-1">4. Ghi nhận ODO:</strong>
                Tài xế có trách nhiệm cập nhật số km (ODO) lúc xuất phát và khi hoàn thành chuyến đi.
              </div>
            </div>
            <button onClick={() => setShowSafetyModal(false)} className="btn-primary w-full mt-5 text-xs py-2.5">
              Đã hiểu & Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* Item 8: Km Statistics Modal */}
      {showKmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#090d16]/90 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-[#121929] border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in">
            <button onClick={() => setShowKmModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Thống kê Kilomet công tác</h3>
                <p className="text-xs text-slate-400">Chi nhánh Nam Sài Gòn</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 block">Tổng quãng đường</span>
                <strong className="text-xl font-bold text-teal-400">{totalKm.toLocaleString()} km</strong>
              </div>
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 block">Chuyến hoàn thành</span>
                <strong className="text-xl font-bold text-cyan-400">{stats.completed} chuyến</strong>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300">
              <p className="font-semibold text-white mb-1">💡 Báo cáo chi tiết:</p>
              Dữ liệu kilomet được ghi nhận trực tiếp từ chỉ số công tơ mét (ODO) do tài xế nhập sau mỗi chuyến đi hoàn thành.
            </div>
            <button onClick={() => setShowKmModal(false)} className="btn-primary w-full mt-5 text-xs py-2.5">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Item 9: Template 02 Info Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#090d16]/90 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-[#121929] border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in">
            <button onClick={() => setShowTemplateModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Mẫu 02/GĐNSDX VietinBank</h3>
                <p className="text-xs text-slate-400">Giấy đề nghị sử dụng xe ô tô công tác</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Biểu mẫu chuẩn hóa dành riêng cho VietinBank Chi nhánh Nam Sài Gòn. Hệ thống tự động điền các thông tin đề nghị, phòng ban, lộ trình và danh sách người đi kèm, xuất file **.docx** và **.xlsx** chuẩn 100%.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowTemplateModal(false)} className="btn-secondary flex-1 text-xs py-2.5">
                Đóng
              </button>
              <Link href="/new" onClick={() => setShowTemplateModal(false)} className="btn-primary flex-1 text-xs py-2.5 text-center">
                Tạo đề xuất mới
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
