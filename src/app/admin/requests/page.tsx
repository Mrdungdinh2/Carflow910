'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Filter, Trash2, Eye, BarChart3,
  Calendar, Building, User, Clock, MapPin, ChevronDown,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  Car, Users, FileText, Download, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { getRequests, deleteRequest, getStaleRequests, forceCompleteRequest, assignVehicleToRequest } from '@/lib/storage';
import { getAvailableVehiclesForTimeRange, getAvailableDriversForTimeRange } from '@/lib/conflictCheck';
import { getDepartments } from '@/lib/departmentStorage';
import { getVehicles, getDrivers } from '@/lib/vehicleStorage';
import type { VehicleRequest, RequestStatus, TimeFilterPreset, TimeFilterTarget } from '@/lib/types';

type ViewMode = 'stats' | 'list';
type StatusFilter = 'all' | RequestStatus;
type SortKey = 'newest' | 'oldest' | 'department' | 'status';

const STATUS_OPTIONS: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'all', label: 'Tất cả', color: 'slate' },
  { key: 'draft', label: 'Nháp', color: 'slate' },
  { key: 'pending', label: 'Chờ TP duyệt', color: 'amber' },
  { key: 'dept_approved', label: 'Chờ TCTH', color: 'blue' },
  { key: 'tcth_approved', label: 'Đã gán xe', color: 'violet' },
  { key: 'driver_accepted', label: 'Đang thực hiện', color: 'cyan' },
  { key: 'completed', label: 'Hoàn thành', color: 'emerald' },
  { key: 'rejected', label: 'Từ chối', color: 'red' },
];

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('stats');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showStaleReview, setShowStaleReview] = useState(false);
  const [forceCompleteTarget, setForceCompleteTarget] = useState<VehicleRequest | null>(null);

  // Reassign state
  const [reassignTarget, setReassignTarget] = useState<VehicleRequest | null>(null);
  const [reassignVehicleId, setReassignVehicleId] = useState<string>('');
  const [reassignDriverId, setReassignDriverId] = useState<string>('');

  // Time Filter State
  const [timePreset, setTimePreset] = useState<TimeFilterPreset>('all');
  const [timeTarget, setTimeTarget] = useState<TimeFilterTarget>('startDateTime');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const departments = useMemo(() => getDepartments(), []);
  const vehicles = useMemo(() => getVehicles(), []);
  const drivers = useMemo(() => getDrivers(), []);

  const loadRequests = useCallback(() => {
    setRequests(getRequests());
  }, []);

  // Stale / overdue requests
  const staleRequests = useMemo(() => getStaleRequests(3), [requests]);

  useEffect(() => {
    if (!user || !['admin', 'tcth'].includes(user.role)) {
      router.push('/');
      return;
    }
    loadRequests();
  }, [user, router, loadRequests]);

  useSupabaseSync(loadRequests);

  // Time Filter Matching Function
  const matchTimeFilter = useCallback((r: VehicleRequest) => {
    if (timePreset === 'all' && !startDate && !endDate) return true;

    const rawDateStr = timeTarget === 'startDateTime' ? (r.startDateTime || r.createdAt) : r.createdAt;
    if (!rawDateStr) return false;
    const date = new Date(rawDateStr);
    if (isNaN(date.getTime())) return false;

    const now = new Date();

    if (timePreset === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (timePreset === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return date >= startOfWeek;
    }
    if (timePreset === 'this_month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (timePreset === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    }
    if (timePreset === 'custom' || startDate || endDate) {
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        if (date < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (date > e) return false;
      }
      return true;
    }

    return true;
  }, [timePreset, timeTarget, startDate, endDate]);

  // ===== COMPUTED STATS =====
  const stats = useMemo(() => {
    const timeFiltered = requests.filter(matchTimeFilter);

    const total = timeFiltered.length;
    const draft = timeFiltered.filter(r => r.status === 'draft').length;
    const pending = timeFiltered.filter(r => r.status === 'pending').length;
    const deptApproved = timeFiltered.filter(r => r.status === 'dept_approved').length;
    const tcthApproved = timeFiltered.filter(r => r.status === 'tcth_approved').length;
    const driverAccepted = timeFiltered.filter(r => r.status === 'driver_accepted').length;
    const completed = timeFiltered.filter(r => r.status === 'completed').length;
    const rejected = timeFiltered.filter(r => r.status === 'rejected').length;
    const inProgress = pending + deptApproved + tcthApproved + driverAccepted;

    // Department breakdown
    const byDepartment = departments.map(dept => ({
      name: dept,
      total: timeFiltered.filter(r => r.department === dept).length,
      pending: timeFiltered.filter(r => r.department === dept && ['pending', 'dept_approved'].includes(r.status)).length,
      completed: timeFiltered.filter(r => r.department === dept && r.status === 'completed').length,
    })).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

    // Time-based stats (this month vs last month)
    const now = new Date();
    const thisMonth = requests.filter(r => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lastMonth = requests.filter(r => {
      const d = new Date(r.createdAt);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    }).length;

    // Today
    const today = requests.filter(r => {
      const d = new Date(r.startDateTime);
      return d.toDateString() === now.toDateString();
    }).length;

    return {
      total, draft, pending, deptApproved, tcthApproved, driverAccepted,
      completed, rejected, inProgress, byDepartment, thisMonth, lastMonth, today,
    };
  }, [requests, departments, matchTimeFilter]);

  // ===== FILTERED & SORTED REQUESTS =====
  const filteredRequests = useMemo(() => {
    let result = requests.filter(matchTimeFilter);

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    // Department filter
    if (deptFilter !== 'all') {
      result = result.filter(r => r.department === deptFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r =>
        r.requesterName.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.pickupLocation.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortKey) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'department':
        result.sort((a, b) => a.department.localeCompare(b.department));
        break;
      case 'status':
        const statusOrder: Record<string, number> = {
          pending: 0, dept_approved: 1, tcth_approved: 2, driver_accepted: 3,
          draft: 4, completed: 5, rejected: 6
        };
        result.sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));
        break;
    }

    return result;
  }, [requests, statusFilter, deptFilter, searchQuery, sortKey, matchTimeFilter]);

  // ===== HANDLERS =====
  const handleDelete = (id: string) => {
    deleteRequest(id);
    loadRequests();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast('Đã xóa đề xuất', 'success');
  };

  const handleForceComplete = (req: VehicleRequest) => {
    if (!user) return;
    forceCompleteRequest(req.id, user.id, user.name, user.role as 'admin' | 'tcth');
    loadRequests();
    setForceCompleteTarget(null);
    showToast(`Đã hoàn thành đề xuất "${req.destination}" & giải phóng xe/tài xế`, 'success');
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteRequest(id));
    loadRequests();
    setSelectedIds(new Set());
    setShowBulkDelete(false);
    showToast(`Đã xóa ${selectedIds.size} đề xuất`, 'success');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getVehiclePlate = (vid?: string) => {
    if (!vid) return null;
    return vehicles.find(v => v.id === vid)?.plateNumber || vid;
  };

  const getDriverName = (did?: string) => {
    if (!did) return null;
    return drivers.find(d => d.id === did)?.name || did;
  };

  if (!user || !['admin', 'tcth'].includes(user.role)) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Quản lý Đề xuất</h1>
              <p className="text-[10px] text-slate-400">
                <span className="text-cyan-300 font-semibold">{stats.total}</span> đề xuất tổng cộng
                {stats.today > 0 && <> • <span className="text-emerald-300">{stats.today} hôm nay</span></>}
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-white/[0.06] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'stats' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Time Filter Control Bar */}
        <GlassCard className="p-3.5 border-cyan-500/20 bg-cyan-950/10 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Lọc & Thống kê theo Thời gian</span>
            </div>

            {/* Time Target Select */}
            <div className="flex items-center gap-1 text-[11px] bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
              <span className="text-slate-400 pl-1 pr-0.5 text-[10px]">Tiêu chí:</span>
              <button
                onClick={() => setTimeTarget('startDateTime')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                  timeTarget === 'startDateTime' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lịch công tác
              </button>
              <button
                onClick={() => setTimeTarget('createdAt')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                  timeTarget === 'createdAt' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ngày tạo đề xuất
              </button>
            </div>
          </div>

          {/* Presets Row */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'today', label: 'Hôm nay' },
              { key: 'this_week', label: 'Tuần này' },
              { key: 'this_month', label: 'Tháng này' },
              { key: 'last_month', label: 'Tháng trước' },
              { key: 'custom', label: 'Tùy chọn khoảng ngày' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setTimePreset(opt.key as TimeFilterPreset)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  timePreset === opt.key
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {(timePreset === 'custom' || startDate || endDate) && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] animate-slide-up">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setTimePreset('custom');
                  }}
                  className="glass-input w-full text-xs font-mono py-1.5 px-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setTimePreset('custom');
                  }}
                  className="glass-input w-full text-xs font-mono py-1.5 px-2 text-slate-200"
                />
              </div>
            </div>
          )}
        </GlassCard>

        {/* ==================== STALE REVIEW BANNER ==================== */}
        {staleRequests.length > 0 && (
          <GlassCard className="p-3.5 border-orange-500/30 bg-orange-950/20 animate-slide-up">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-orange-300">
                    ⚠️ {staleRequests.length} đề xuất quá hạn cần rà soát
                  </p>
                  <p className="text-[10px] text-orange-300/60 mt-0.5">
                    Xe & tài xế đang bị khóa do chưa xác nhận hoàn thành
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStaleReview(!showStaleReview)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-all whitespace-nowrap"
              >
                {showStaleReview ? 'Ẩn' : 'Rà soát'}
              </button>
            </div>

            {/* Stale Review Panel */}
            {showStaleReview && (
              <div className="mt-3 pt-3 border-t border-orange-500/20 space-y-2 animate-slide-up">
                {staleRequests.map(req => {
                  const vehicle = vehicles.find(v => v.id === req.assignedVehicleId);
                  const driver = drivers.find(d => d.id === req.assignedDriverId);
                  const endDate = new Date(req.endDateTime);
                  const now = new Date();
                  const daysOverdue = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={req.id} className="p-3 rounded-xl bg-white/[0.04] border border-orange-500/15 hover:bg-white/[0.06] transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{req.destination || 'Chưa rõ nơi đến'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {req.requesterName} • {req.department}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/20 font-bold whitespace-nowrap">
                          Quá hạn {daysOverdue} ngày
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3 text-orange-400" />
                          <span>Kết thúc: {endDate.toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <StatusBadge status={req.status} compact />
                        </div>
                      </div>

                      {/* Locked resources */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {vehicle && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                            🔒 Xe: {vehicle.plateNumber} ({vehicle.status === 'in_use' ? 'Đang bị khóa' : vehicle.status})
                          </span>
                        )}
                        {driver && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                            🔒 TX: {driver.name} ({driver.status === 'on_duty' ? 'Đang bị khóa' : driver.status})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/preview?id=${req.id}`}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-center text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
                        >
                          Xem chi tiết
                        </Link>
                        <button
                          onClick={() => setForceCompleteTarget(req)}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-bold text-center text-emerald-300 bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Hoàn thành & Giải phóng
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Batch force complete all */}
                {staleRequests.length > 1 && (
                  <button
                    onClick={() => {
                      if (!user) return;
                      staleRequests.forEach(req => {
                        forceCompleteRequest(req.id, user.id, user.name, user.role as 'admin' | 'tcth');
                      });
                      loadRequests();
                      setShowStaleReview(false);
                      showToast(`Đã hoàn thành ${staleRequests.length} đề xuất quá hạn & giải phóng tất cả xe/tài xế`, 'success');
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold text-orange-300 bg-orange-500/15 border border-orange-500/25 hover:bg-orange-500/25 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hoàn thành tất cả ({staleRequests.length} đề xuất) & Giải phóng xe/tài xế
                  </button>
                )}
              </div>
            )}
          </GlassCard>
        )}

        {/* ==================== STATS VIEW ==================== */}
        {viewMode === 'stats' && (
          <div className="space-y-4 animate-slide-up">
            {/* Overview Cards */}
            {/* Status Detail Cards - Click to filter */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <GlassCard className="p-3 text-center cursor-pointer hover:bg-white/[0.04] transition-all" onClick={() => { setStatusFilter('all'); setViewMode('list'); }}>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Tổng đề xuất</div>
              </GlassCard>
              <GlassCard className="p-3 text-center cursor-pointer hover:bg-amber-500/5 transition-all border-amber-500/10" onClick={() => { setStatusFilter('pending'); setViewMode('list'); }}>
                <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
                <div className="text-[10px] text-amber-300/70 mt-0.5 font-medium">Chờ TP duyệt</div>
              </GlassCard>
              <GlassCard className="p-3 text-center cursor-pointer hover:bg-blue-500/5 transition-all border-blue-500/10" onClick={() => { setStatusFilter('dept_approved'); setViewMode('list'); }}>
                <div className="text-2xl font-bold text-blue-400">{stats.deptApproved}</div>
                <div className="text-[10px] text-blue-300/70 mt-0.5 font-medium">Chờ TCTH duyệt</div>
              </GlassCard>
              <GlassCard className="p-3 text-center cursor-pointer hover:bg-violet-500/5 transition-all border-violet-500/10" onClick={() => { setStatusFilter('tcth_approved'); setViewMode('list'); }}>
                <div className="text-2xl font-bold text-violet-400">{stats.tcthApproved}</div>
                <div className="text-[10px] text-violet-300/70 mt-0.5 font-medium">Đã gán xe (Chờ TX)</div>
              </GlassCard>
              <GlassCard className="p-3 text-center cursor-pointer hover:bg-cyan-500/5 transition-all border-cyan-500/10" onClick={() => { setStatusFilter('driver_accepted'); setViewMode('list'); }}>
                <div className="text-2xl font-bold text-cyan-400">{stats.driverAccepted}</div>
                <div className="text-[10px] text-cyan-300/70 mt-0.5 font-medium">Đang thực hiện</div>
              </GlassCard>
              <GlassCard className="p-3 text-center cursor-pointer hover:bg-emerald-500/5 transition-all border-emerald-500/10" onClick={() => { setStatusFilter('completed'); setViewMode('list'); }}>
                <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
                <div className="text-[10px] text-emerald-300/70 mt-0.5 font-medium">Hoàn thành</div>
              </GlassCard>
              <GlassCard className="p-3 text-center cursor-pointer hover:bg-red-500/5 transition-all border-red-500/10" onClick={() => { setStatusFilter('rejected'); setViewMode('list'); }}>
                <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
                <div className="text-[10px] text-red-300/70 mt-0.5 font-medium">Từ chối</div>
              </GlassCard>
              <GlassCard className="p-3 text-center cursor-pointer hover:bg-slate-500/5 transition-all border-slate-500/10" onClick={() => { setStatusFilter('draft'); setViewMode('list'); }}>
                <div className="text-2xl font-bold text-slate-400">{stats.draft}</div>
                <div className="text-[10px] text-slate-400/70 mt-0.5 font-medium">Nháp</div>
              </GlassCard>
            </div>
            {staleRequests.length > 0 && (
              <GlassCard className="p-3 text-center border-orange-500/30 cursor-pointer hover:bg-orange-500/5 transition-all" onClick={() => setShowStaleReview(true)}>
                <div className="text-2xl font-bold text-orange-400">{staleRequests.length}</div>
                <div className="text-[10px] text-orange-300/70 mt-0.5 font-medium">⚠️ Quá hạn</div>
              </GlassCard>
            )}

            {/* Status Pipeline */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Luồng xử lý đề xuất
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Nháp', count: stats.draft, color: 'bg-slate-500', pct: stats.total ? (stats.draft / stats.total) * 100 : 0 },
                  { label: 'Chờ TP duyệt', count: stats.pending, color: 'bg-amber-500', pct: stats.total ? (stats.pending / stats.total) * 100 : 0 },
                  { label: 'Chờ TCTH duyệt', count: stats.deptApproved, color: 'bg-blue-500', pct: stats.total ? (stats.deptApproved / stats.total) * 100 : 0 },
                  { label: 'Đã gán xe (Chờ TX)', count: stats.tcthApproved, color: 'bg-violet-500', pct: stats.total ? (stats.tcthApproved / stats.total) * 100 : 0 },
                  { label: 'Đang thực hiện', count: stats.driverAccepted, color: 'bg-cyan-500', pct: stats.total ? (stats.driverAccepted / stats.total) * 100 : 0 },
                  { label: 'Hoàn thành', count: stats.completed, color: 'bg-emerald-500', pct: stats.total ? (stats.completed / stats.total) * 100 : 0 },
                  { label: 'Từ chối', count: stats.rejected, color: 'bg-red-500', pct: stats.total ? (stats.rejected / stats.total) * 100 : 0 },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 w-32 truncate shrink-0">{item.label}</span>
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-700`}
                        style={{ width: `${Math.max(item.pct, item.count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white w-6 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Month Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-300">Tháng này</span>
                </div>
                <div className="text-3xl font-bold text-white">{stats.thisMonth}</div>
                <div className="text-[10px] text-slate-500 mt-1">đề xuất được tạo</div>
              </GlassCard>
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-300">Tháng trước</span>
                </div>
                <div className="text-3xl font-bold text-slate-400">{stats.lastMonth}</div>
                <div className="text-[10px] text-slate-500 mt-1">đề xuất được tạo</div>
              </GlassCard>
            </div>

            {/* Department Breakdown */}
            {stats.byDepartment.length > 0 && (
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  Thống kê theo Phòng ban
                </h3>
                <div className="space-y-2">
                  {stats.byDepartment.map(dept => (
                    <div key={dept.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{dept.name}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-amber-400">⏳ {dept.pending} chờ</span>
                          <span className="text-[10px] text-emerald-400">✅ {dept.completed} xong</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold text-white">{dept.total}</span>
                        <span className="text-[10px] text-slate-500 block">đề xuất</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Quick Action - Switch to List */}
            <button
              onClick={() => setViewMode('list')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-sm hover:from-cyan-500/30 hover:to-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Xem danh sách chi tiết ({stats.total} đề xuất)
            </button>
          </div>
        )}

        {/* ==================== LIST VIEW ==================== */}
        {viewMode === 'list' && (
          <div className="space-y-3 animate-slide-up">

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm theo tên, nơi đến, phòng ban, lý do..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-10 w-full"
              />
            </div>

            {/* Filters Row */}
            <div className="flex gap-2 items-center flex-wrap">
              {/* Department Filter */}
              <div className="relative">
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="glass-select text-xs pr-8 py-1.5 rounded-xl appearance-none bg-white/[0.06] border border-white/[0.1] text-slate-300 pl-3 cursor-pointer"
                >
                  <option value="all">Tất cả phòng ban</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <Building className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="glass-select text-xs pr-8 py-1.5 rounded-xl appearance-none bg-white/[0.06] border border-white/[0.1] text-slate-300 pl-3 cursor-pointer"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="department">Theo phòng ban</option>
                  <option value="status">Theo trạng thái</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>

              {/* Refresh */}
              <button
                onClick={loadRequests}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/[0.06] transition-all"
                title="Tải lại"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-1.5 pb-1" style={{ minWidth: 'max-content' }}>
                {STATUS_OPTIONS.map(opt => {
                  const count = opt.key === 'all'
                    ? requests.length
                    : requests.filter(r => r.status === opt.key).length;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setStatusFilter(opt.key)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                        statusFilter === opt.key
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]'
                      }`}
                    >
                      {opt.label}
                      <span className="ml-1 text-[9px] opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 animate-slide-up">
                <span className="text-xs text-red-300 font-semibold">
                  Đã chọn {selectedIds.size} đề xuất
                </span>
                <div className="flex-1" />
                <button
                  onClick={() => setShowBulkDelete(true)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa ({selectedIds.size})
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-slate-400 text-xs font-medium hover:bg-white/[0.1] transition-all"
                >
                  Bỏ chọn
                </button>
              </div>
            )}

            {/* Select All */}
            {filteredRequests.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <button
                  onClick={toggleSelectAll}
                  className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                    selectedIds.size === filteredRequests.length && filteredRequests.length > 0
                      ? 'bg-cyan-500 border-cyan-400'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  {selectedIds.size === filteredRequests.length && filteredRequests.length > 0 && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </button>
                <span className="text-[10px] text-slate-500">
                  Chọn tất cả ({filteredRequests.length} kết quả)
                </span>
              </div>
            )}

            {/* Results Count */}
            <p className="text-[10px] text-slate-500 px-1">
              Hiển thị {filteredRequests.length} / {requests.length} đề xuất
              {searchQuery && <> • Tìm kiếm: &ldquo;{searchQuery}&rdquo;</>}
            </p>

            {/* Request Cards */}
            {filteredRequests.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Không tìm thấy đề xuất nào</p>
                <p className="text-xs text-slate-600 mt-1">Thử thay đổi bộ lọc hoặc từ khóa</p>
              </GlassCard>
            ) : (
              <div className="space-y-2">
                {filteredRequests.map((req) => {
                  const isSelected = selectedIds.has(req.id);
                  const isFuture = new Date(req.startDateTime).getTime() > Date.now();
                  const canReassign = isFuture && ['tcth_approved', 'driver_accepted'].includes(req.status) && (req.assignedVehicleId || req.assignedDriverId);
                  return (
                    <GlassCard
                      key={req.id}
                      className={`p-3.5 transition-all ${
                        isSelected ? 'ring-1 ring-cyan-500/40 bg-cyan-500/[0.04]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(req.id)}
                          className={`mt-0.5 w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-cyan-500 border-cyan-400' : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-white truncate">
                              {req.destination || 'Chưa có nơi đến'}
                            </p>
                            <StatusBadge status={req.status} />
                          </div>

                          <div className="grid grid-cols-2 gap-1 mt-1.5 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1 truncate">
                              <User className="w-3 h-3 shrink-0" />
                              {req.requesterName}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <Building className="w-3 h-3 shrink-0" />
                              {req.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 shrink-0" />
                              {formatDate(req.startDateTime)} {formatTime(req.startDateTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {req.pickupLocation || '—'}
                            </span>
                          </div>

                          {/* Vehicle & Driver */}
                          {(req.assignedVehicleId || req.assignedDriverId) && (
                            <div className="flex gap-3 mt-1.5 text-[10px]">
                              {req.assignedVehicleId && (
                                <span className="text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                                  🚗 {getVehiclePlate(req.assignedVehicleId)}
                                </span>
                              )}
                              {req.assignedDriverId && (
                                <span className="text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                                  👨‍✈️ {getDriverName(req.assignedDriverId)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.06]">
                            <Link
                              href={`/preview?id=${req.id}`}
                              className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Xem chi tiết
                            </Link>
                            {canReassign ? (
                              <button
                                onClick={() => {
                                  setReassignTarget(req);
                                  setReassignVehicleId(req.assignedVehicleId || '');
                                  setReassignDriverId(req.assignedDriverId || '');
                                }}
                                className="ml-2 px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-1"
                              >
                                🔄 Gán lại xe/TX
                              </button>
                            ) : null}
                            <div className="flex-1" />
                            <span className="text-[9px] text-slate-600">
                              {formatDate(req.createdAt)}
                            </span>
                            <button
                              onClick={() => setDeleteTarget({ id: req.id, name: req.destination || req.requesterName })}
                              className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                              title="Xóa đề xuất"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {reassignTarget?.id === req.id && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-800/50 border border-cyan-500/30 animate-slide-up">
                              <p className="text-xs font-semibold text-cyan-300 mb-2">Gán lại Xe & Tài xế</p>
                              
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-1">Chọn Xe</label>
                                  <select 
                                    value={reassignVehicleId}
                                    onChange={e => setReassignVehicleId(e.target.value)}
                                    className="w-full glass-select text-xs py-1.5 px-2 rounded-lg bg-slate-900 border border-white/10 text-white"
                                  >
                                    <option value="">-- Không gán xe --</option>
                                    {(() => {
                                      const available = getAvailableVehiclesForTimeRange(vehicles, requests, req.startDateTime, req.endDateTime, req.id);
                                      const isCurrentInAvailable = req.assignedVehicleId && available.some(v => v.id === req.assignedVehicleId);
                                      
                                      return (
                                        <>
                                          {req.assignedVehicleId && !isCurrentInAvailable && vehicles.find(v => v.id === req.assignedVehicleId) && (
                                            <option value={req.assignedVehicleId}>
                                              {vehicles.find(v => v.id === req.assignedVehicleId)?.plateNumber} (Đang gán)
                                            </option>
                                          )}
                                          {available.map(v => (
                                            <option key={v.id} value={v.id}>
                                              {v.plateNumber} ({v.seats} chỗ) - {v.model}
                                            </option>
                                          ))}
                                        </>
                                      );
                                    })()}
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-1">Chọn Tài xế</label>
                                  <select 
                                    value={reassignDriverId}
                                    onChange={e => setReassignDriverId(e.target.value)}
                                    className="w-full glass-select text-xs py-1.5 px-2 rounded-lg bg-slate-900 border border-white/10 text-white"
                                  >
                                    <option value="">-- Không gán tài xế --</option>
                                    {(() => {
                                      const available = getAvailableDriversForTimeRange(drivers, requests, req.startDateTime, req.endDateTime, req.id);
                                      const isCurrentInAvailable = req.assignedDriverId && available.some(d => d.id === req.assignedDriverId);
                                      
                                      return (
                                        <>
                                          {req.assignedDriverId && !isCurrentInAvailable && drivers.find(d => d.id === req.assignedDriverId) && (
                                            <option value={req.assignedDriverId}>
                                              {drivers.find(d => d.id === req.assignedDriverId)?.name} (Đang gán)
                                            </option>
                                          )}
                                          {available.map(d => (
                                            <option key={d.id} value={d.id}>
                                              {d.name} ({d.phone})
                                            </option>
                                          ))}
                                        </>
                                      );
                                    })()}
                                  </select>
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => {
                                      assignVehicleToRequest(req.id, reassignVehicleId || req.assignedVehicleId || '', reassignDriverId || req.assignedDriverId || '');
                                      showToast('Đã gán lại xe/tài xế thành công', 'success');
                                      setReassignTarget(null);
                                      loadRequests();
                                    }}
                                    className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                                  >
                                    ✅ Xác nhận gán lại
                                  </button>
                                  <button
                                    onClick={() => setReassignTarget(null)}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs font-semibold border border-white/10 hover:bg-white/10 transition-all"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Single Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Xóa đề xuất?"
        message={`Bạn có chắc muốn xóa đề xuất "${deleteTarget?.name || ''}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Giữ lại"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={showBulkDelete}
        title={`Xóa ${selectedIds.size} đề xuất?`}
        message={`Bạn sắp xóa ${selectedIds.size} đề xuất đã chọn. Hành động này không thể hoàn tác.`}
        confirmLabel={`Xóa ${selectedIds.size} đề xuất`}
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDelete(false)}
      />

      {/* Force Complete Stale Confirm */}
      <ConfirmDialog
        isOpen={!!forceCompleteTarget}
        title="Xác nhận hoàn thành đề xuất quá hạn?"
        message={`Đề xuất "${forceCompleteTarget?.destination || ''}" đã quá hạn. Xác nhận hoàn thành sẽ giải phóng xe & tài xế để có thể gán cho đề xuất khác.`}
        confirmLabel="Hoàn thành & Giải phóng"
        cancelLabel="Hủy"
        onConfirm={() => {
          if (forceCompleteTarget) {
            handleForceComplete(forceCompleteTarget);
          }
        }}
        onCancel={() => setForceCompleteTarget(null)}
      />
    </div>
  );
}
