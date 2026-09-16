'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { ClipboardList, Search, Filter, Car, Trash2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { getRequests, deleteRequest as deleteReq } from '@/lib/storage';
import type { VehicleRequest, RequestStatus } from '@/lib/types';

type FilterTab = 'all' | 'draft' | 'in_progress' | 'completed' | 'rejected';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'draft', label: 'Nháp' },
  { key: 'in_progress', label: 'Đang xử lý' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'rejected', label: 'Từ chối' },
];

export default function HistoryPage() {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const { showToast } = useToast();
  const { user: authUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const loadRequests = useCallback(() => {
    const all = getRequests();
    if (authUser?.role === 'staff') {
      setRequests(all.filter(r => r.department === authUser.department));
    } else if (authUser?.role === 'dept_head') {
      setRequests(all.filter(r => r.department === authUser.department));
    } else if (authUser?.role === 'driver') {
      setRequests(all.filter(r => r.assignedDriverId === authUser.id));
    } else {
      setRequests(all);
    }
  }, [authUser]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useSupabaseSync(loadRequests);

  const deleteRequest = useCallback((id: string) => {
    deleteReq(id);
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    let result = requests;

    if (activeFilter !== 'all') {
      if (activeFilter === 'in_progress') {
        result = result.filter((r) => ['pending', 'dept_approved', 'tcth_approved', 'driver_accepted'].includes(r.status));
      } else if (activeFilter === 'completed') {
        result = result.filter((r) => r.status === 'completed');
      } else {
        result = result.filter((r) => r.status === activeFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.requesterName.toLowerCase().includes(q) ||
          r.destination.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.pickupLocation.toLowerCase().includes(q)
      );
    }

    return result;
  }, [requests, activeFilter, searchQuery]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    setDeleteTarget({ id, name });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteRequest(deleteTarget.id);
      showToast('Đã xóa đề xuất', 'success');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 animate-slide-up">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Lịch sử đề xuất</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            <span className="text-cyan-300 font-semibold">{authUser?.department || 'Chi nhánh Nam Sài Gòn'}</span> • {requests.length} đề xuất tổng cộng
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên, nơi đến, phòng ban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-10"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="mb-4 animate-slide-up overflow-x-auto no-scrollbar"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? requests.length
                : tab.key === 'in_progress'
                ? requests.filter((r) => ['pending', 'dept_approved', 'tcth_approved', 'driver_accepted'].includes(r.status)).length
                : tab.key === 'completed'
                ? requests.filter((r) => r.status === 'completed').length
                : requests.filter((r) => r.status === tab.key).length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeFilter === tab.key
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]'
                }`}
              >
                {tab.label}
                <span className="ml-1 text-[10px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        {filteredRequests.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="flex flex-col items-center">
              {searchQuery || activeFilter !== 'all' ? (
                <>
                  <Filter className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 mb-1">
                    Không tìm thấy đề xuất
                  </p>
                  <p className="text-xs text-slate-600">
                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                  </p>
                </>
              ) : (
                <>
                  <Car className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 mb-1">
                    Chưa có đề xuất nào
                  </p>
                  <p className="text-xs text-slate-600">
                    Tạo đề xuất đầu tiên bằng tab &quot;Tạo mới&quot; bên dưới
                  </p>
                </>
              )}
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3 stagger-in">
            {filteredRequests.map((req) => {
              const isOwnDraft = (req.status === 'draft' || req.status === 'rejected') && req.requesterId === authUser?.id;
              const href = isOwnDraft ? `/new?id=${req.id}` : `/preview?id=${req.id}`;
              return (
              <Link key={req.id} href={href}>
                <GlassCard hover className="p-4 mb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {req.destination || 'Chưa có nơi đến'}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {req.requesterName} • {req.department}
                      </p>
                      {req.startDateTime && req.endDateTime && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
                            {formatDate(req.startDateTime)} {formatTime(req.startDateTime)}
                          </span>
                          <span className="text-[10px] text-slate-600">→</span>
                          <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
                            {formatDate(req.endDateTime)} {formatTime(req.endDateTime)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={req.status} />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600">
                          {req.personnel.length} người
                        </span>
                        {(req.status === 'draft' || req.status === 'rejected') && req.requesterId === authUser?.id && (
                        <button
                          onClick={(e) => handleDelete(e, req.id, req.destination || req.requesterName)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          title="Xóa đề xuất"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Link>
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
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
