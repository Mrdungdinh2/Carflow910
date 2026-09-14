'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, FileSpreadsheet, Pencil, Loader2, PlayCircle, CheckCircle2 } from 'lucide-react';
import PreviewDocument from '@/components/PreviewDocument';
import { ApprovalTimeline } from '@/components/ApprovalTimeline';
import { RejectionModal } from '@/components/RejectionModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { VehicleCard } from '@/components/VehicleCard';
import { DriverCard } from '@/components/DriverCard';
import { GlassCard } from '@/components/GlassCard';
import { exportDocx } from '@/lib/exportDocx';
import { exportXlsx } from '@/lib/exportXlsx';
import { getRequestById, addApprovalEntry, assignVehicleToRequest, completeTrip } from '@/lib/storage';
import { getVehicles, getDrivers, updateVehicleStatus, updateDriverStatus } from '@/lib/vehicleStorage';
import { getAvailableVehiclesForTimeRange, getAvailableDriversForTimeRange } from '@/lib/conflictCheck';
import { getRequests } from '@/lib/storage';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { ROLE_CONFIG } from '@/lib/constants';
import type { VehicleRequest, Vehicle, Driver, RejectionReason, ApprovalEntry as ApprovalEntryType } from '@/lib/types';

function PreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const id = searchParams.get('id');

  const [request, setRequest] = useState<VehicleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'docx' | 'xlsx' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showOdoModal, setShowOdoModal] = useState(false);
  const [odoStart, setOdoStart] = useState('');
  const [odoEnd, setOdoEnd] = useState('');

  // For TCTH vehicle/driver assignment
  const [showAssignment, setShowAssignment] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);

  const refreshRequest = () => {
    if (id) {
      const data = getRequestById(id);
      setRequest(data);
    }
  };

  useEffect(() => {
    refreshRequest();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy đề xuất</h2>
          <p className="text-sm text-slate-400 mb-6">Đề xuất có thể đã bị xóa hoặc không tồn tại.</p>
          <button onClick={() => router.push('/')} className="btn-primary">Quay lại trang chủ</button>
        </div>
      </div>
    );
  }

  // Strict department access control check
  const canViewRequest = () => {
    if (!user || !request) return false;
    if (['tcth', 'director', 'admin'].includes(user.role)) return true;
    if (user.role === 'dept_head') return request.department === user.department;
    if (user.role === 'staff') return request.requesterId === user.id;
    if (user.role === 'driver') return request.assignedDriverId === user.id;
    return false;
  };

  if (!canViewRequest()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400 font-bold text-2xl">
            🔒
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Không có quyền truy cập</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Bạn không có quyền xem đề xuất của phòng ban khác ({request.department}). Chỉ Lãnh đạo {request.department}, Phòng TCTH và Ban Giám đốc mới có quyền xem.
          </p>
          <button onClick={() => router.push('/')} className="btn-primary w-full text-xs py-2.5">Quay lại trang chủ</button>
        </div>
      </div>
    );
  }

  // Determine what actions this user can perform
  const isOwner = user?.id === request.requesterId;

  const canApprove = () => {
    if (!user) return false;
    // Dept head can approve pending requests (or draft from their staff — auto-submit)
    if (user.role === 'dept_head' && user.department === request.department && (request.status === 'pending' || (request.status === 'draft' && !isOwner))) return true;
    if (user.role === 'tcth' && request.status === 'dept_approved') return true;
    return false;
  };

  const canEdit = () => {
    if (!user) return false;
    // Only the requester can edit their own draft/rejected requests
    return (request.status === 'draft' || request.status === 'rejected') && isOwner;
  };

  const canSubmit = () => {
    if (!user) return false;
    // Only the requester can submit their own draft/rejected requests
    return (request.status === 'draft' || request.status === 'rejected') && isOwner;
  };

  const canDriverAccept = () => {
    if (!user) return false;
    return user.role === 'driver' && request.status === 'tcth_approved' && request.assignedDriverId === user.id;
  };

  const canDriverComplete = () => {
    if (!user) return false;
    return user.role === 'driver' && request.status === 'driver_accepted' && request.assignedDriverId === user.id;
  };

  const handleApprove = () => {
    if (!user) return;

    // TCTH needs to assign vehicle first
    if (user.role === 'tcth') {
      const allRequests = getRequests();
      const vehicles = getVehicles();
      const drivers = getDrivers();
      const avVehicles = getAvailableVehiclesForTimeRange(vehicles, allRequests, request.startDateTime, request.endDateTime, request.id);
      const avDrivers = getAvailableDriversForTimeRange(drivers, allRequests, request.startDateTime, request.endDateTime, request.id);
      setAvailableVehicles(avVehicles);
      setAvailableDrivers(avDrivers);
      setSelectedVehicle(null);
      setSelectedDriver(null);
      setShowAssignment(true);
      return;
    }

    setShowApproveConfirm(true);
  };

  const confirmApprove = () => {
    if (!user || !request) return;

    // If request is still draft, auto-submit first
    if (request.status === 'draft') {
      const submitEntry: Omit<ApprovalEntryType, 'id' | 'timestamp'> = {
        action: 'submit',
        by: request.requesterId || 'unknown',
        byName: request.requesterName,
        byRole: 'staff',
        note: 'Tự động gửi duyệt',
      };
      addApprovalEntry(request.id, submitEntry as ApprovalEntryType);
    }

    const entry: Omit<ApprovalEntryType, 'id' | 'timestamp'> = {
      action: 'approve',
      by: user.id,
      byName: user.name,
      byRole: user.role,
      note: `${ROLE_CONFIG[user.role].label} đã duyệt`,
    };
    addApprovalEntry(request.id, entry as ApprovalEntryType);
    showToast('Đã phê duyệt đề xuất', 'success');
    setShowApproveConfirm(false);
    refreshRequest();
  };

  const handleTCTHAssign = () => {
    if (!user || !selectedVehicle || !selectedDriver) return;
    
    // First approve
    const approveEntry: Omit<ApprovalEntryType, 'id' | 'timestamp'> = {
      action: 'approve',
      by: user.id,
      byName: user.name,
      byRole: user.role,
      note: `TCTH duyệt`,
    };
    addApprovalEntry(request.id, approveEntry as ApprovalEntryType);

    // Then assign vehicle
    assignVehicleToRequest(request.id, selectedVehicle.id, selectedDriver.id);
    
    const assignEntry: Omit<ApprovalEntryType, 'id' | 'timestamp'> = {
      action: 'assign_vehicle',
      by: user.id,
      byName: user.name,
      byRole: user.role,
      note: `Xe: ${selectedVehicle.plateNumber} (${selectedVehicle.model}) - TX: ${selectedDriver.name}`,
    };
    addApprovalEntry(request.id, assignEntry as ApprovalEntryType);

    showToast(`Đã gán xe ${selectedVehicle.plateNumber} và tài xế ${selectedDriver.name}`, 'success');
    setShowAssignment(false);
    refreshRequest();
  };

  const handleReject = (reason: RejectionReason, detail?: string) => {
    if (!user) return;
    const entry: Omit<ApprovalEntryType, 'id' | 'timestamp'> = {
      action: 'reject',
      by: user.id,
      byName: user.name,
      byRole: user.role,
      rejectionReason: reason,
      rejectionDetail: detail,
    };
    addApprovalEntry(request.id, entry as ApprovalEntryType);
    showToast('Đã từ chối đề xuất', 'info');
    setShowRejectModal(false);
    refreshRequest();
  };

  const handleSubmit = () => {
    if (!user) return;
    const entry: Omit<ApprovalEntryType, 'id' | 'timestamp'> = {
      action: 'submit',
      by: user.id,
      byName: user.name,
      byRole: user.role,
      note: 'Gửi duyệt',
    };
    addApprovalEntry(request.id, entry as ApprovalEntryType);
    showToast('Đã gửi đề xuất chờ duyệt', 'success');
    refreshRequest();
  };

  const handleDriverAccept = () => {
    if (!user) return;
    const entry = {
      action: 'driver_accept' as const,
      by: user.id,
      byName: user.name,
      byRole: user.role,
      note: 'Tài xế đã nhận nhiệm vụ',
    };
    addApprovalEntry(request.id, entry as any);
    showToast('Đã nhận nhiệm vụ thành công!', 'success');
    router.push('/driver');
  };

  const handleDriverComplete = () => {
    setShowOdoModal(true);
  };

  const confirmDriverComplete = () => {
    if (!user) return;
    const endOdo = parseInt(odoEnd);
    if (!endOdo || endOdo <= 0) {
      showToast('Vui lòng nhập chỉ số ODO cuối hợp lệ', 'error');
      return;
    }

    // Save ODO start if provided
    if (odoStart) {
      const startOdo = parseInt(odoStart);
      if (startOdo > 0) {
        const requests = getRequests();
        const idx = requests.findIndex(r => r.id === request.id);
        if (idx >= 0) {
          requests[idx].tripOdoStart = startOdo;
          localStorage.setItem('carflow_requests', JSON.stringify(requests));
        }
      }
    }

    const entry = {
      action: 'driver_complete' as const,
      by: user.id,
      byName: user.name,
      byRole: user.role,
      note: `Tài xế xác nhận hoàn thành. ODO: ${odoEnd} km`,
    };
    addApprovalEntry(request.id, entry as any);

    // Use completeTrip to release vehicle/driver and update ODO
    completeTrip(request.id, endOdo);

    showToast('Đã xác nhận hoàn thành chuyến công tác!', 'success');
    setShowOdoModal(false);
    router.push('/driver');
  };

  const handleExportDocx = async () => {
    setExporting('docx');
    try {
      await exportDocx(request);
      showToast('Đã xuất file .docx', 'success');
    } catch { showToast('Xuất file thất bại', 'error'); }
    setExporting(null);
  };

  const handleExportXlsx = async () => {
    setExporting('xlsx');
    try {
      await exportXlsx(request);
      showToast('Đã xuất file .xlsx', 'success');
    } catch { showToast('Xuất file thất bại', 'error'); }
    setExporting(null);
  };

  return (
    <div className="min-h-screen pb-44">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Xem trước biểu mẫu</h1>
        </div>
      </header>

      {/* Preview Document */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="overflow-x-auto rounded-xl shadow-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-2 md:p-3">
          <PreviewDocument request={request} />
        </div>
      </div>

      {/* Approval Timeline */}
      {request.approvalHistory && request.approvalHistory.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Lịch sử phê duyệt</h3>
            <ApprovalTimeline history={request.approvalHistory} currentStatus={request.status} />
          </GlassCard>
        </div>
      )}

      {/* Vehicle Assignment Modal */}
      {showAssignment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-[#090d16]/90 backdrop-blur-xl" onClick={() => setShowAssignment(false)} />
          <div className="relative w-full sm:max-w-lg bg-[#121929]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl animate-slide-up max-h-[85vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white">Gán xe & tài xế</h3>
              <p className="text-xs text-slate-400 mt-1">Chọn xe và tài xế cho chuyến công tác</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Xe trống ({availableVehicles.length})</p>
                {availableVehicles.length === 0 ? (
                  <p className="text-xs text-red-400">⚠ Không còn xe trống trong khung giờ này!</p>
                ) : (
                  <div className="space-y-2">
                    {availableVehicles.map(v => (
                      <VehicleCard key={v.id} vehicle={v} isAssigned={selectedVehicle?.id === v.id} onSelect={setSelectedVehicle} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Tài xế trống ({availableDrivers.length})</p>
                {availableDrivers.length === 0 ? (
                  <p className="text-xs text-red-400">⚠ Không có tài xế trống!</p>
                ) : (
                  <div className="space-y-2">
                    {availableDrivers.map(d => (
                      <DriverCard key={d.id} driver={d} isAssigned={selectedDriver?.id === d.id} onSelect={setSelectedDriver} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-white/[0.06] flex gap-3">
              <button onClick={() => setShowAssignment(false)} className="btn-secondary flex-1 text-sm py-2.5">Hủy</button>
              <button
                onClick={handleTCTHAssign}
                disabled={!selectedVehicle || !selectedDriver}
                className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Duyệt & Gán xe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-slate-900/90 backdrop-blur-xl border-t border-white/[0.08]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div className="max-w-4xl mx-auto space-y-2">
          {user?.role === 'director' && (
            <div className="text-center text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-xl font-medium mb-1">
              👁️ Ban Giám đốc — Quyền giám sát (Chỉ xem)
            </div>
          )}
          {/* Row 1: Export */}
          <div className="flex gap-2">
            {canEdit() && (
              <button onClick={() => router.push(`/new?id=${request.id}`)} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                <Pencil className="w-4 h-4" /> Sửa
              </button>
            )}
            <button onClick={handleExportDocx} disabled={!!exporting} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
              {exporting === 'docx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              .docx
            </button>
            <button onClick={handleExportXlsx} disabled={!!exporting} className="btn-success flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
              {exporting === 'xlsx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              .xlsx
            </button>
          </div>

          {/* Row 2: Submit / Approve / Reject */}
          {canSubmit() && (
            <button onClick={handleSubmit} className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-3 bg-gradient-to-r from-emerald-500 to-cyan-600">
              Gửi duyệt
            </button>
          )}
          {canApprove() && (
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(true)} className="btn-danger flex-1 flex items-center justify-center gap-2 text-sm py-3">
                Từ chối
              </button>
              <button onClick={handleApprove} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-3 bg-gradient-to-r from-emerald-500 to-cyan-600">
                {user?.role === 'tcth' ? 'Duyệt & Gán xe' : 'Phê duyệt'}
              </button>
            </div>
          )}
          {canDriverAccept() && (
            <button onClick={handleDriverAccept} className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2">
              <PlayCircle className="w-5 h-5" />
              Nhận nhiệm vụ
            </button>
          )}

          {canDriverComplete() && (
            <button onClick={handleDriverComplete} className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 transition-all flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Xác nhận hoàn thành
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <RejectionModal isOpen={showRejectModal} onReject={handleReject} onCancel={() => setShowRejectModal(false)} />
      <ConfirmDialog
        isOpen={showApproveConfirm}
        title="Phê duyệt đề xuất?"
        message="Xác nhận phê duyệt đề xuất điều xe này?"
        confirmLabel="Phê duyệt"
        onConfirm={confirmApprove}
        onCancel={() => setShowApproveConfirm(false)}
      />

      {/* ODO Modal */}
      {showOdoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#090d16]/90 backdrop-blur-xl p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-sm max-h-[85vh] overflow-y-auto p-6 animate-scale-in my-auto bg-[#121929] rounded-3xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-1">Xác nhận hoàn thành chuyến</h3>
            <p className="text-xs text-slate-400 mb-5">Nhập chỉ số công tơ mét (ODO) để hoàn tất</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">ODO lúc xuất phát (km)</label>
                <input
                  type="number"
                  value={odoStart}
                  onChange={e => setOdoStart(e.target.value)}
                  placeholder="VD: 45230"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">ODO lúc về (km) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  value={odoEnd}
                  onChange={e => setOdoEnd(e.target.value)}
                  placeholder="VD: 45280"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              {odoStart && odoEnd && parseInt(odoEnd) > parseInt(odoStart) && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">Quãng đường</p>
                  <p className="text-lg font-bold text-emerald-400">{(parseInt(odoEnd) - parseInt(odoStart)).toLocaleString()} km</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOdoModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all text-sm"
              >
                Hủy
              </button>
              <button
                onClick={confirmDriverComplete}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold hover:from-emerald-500 hover:to-green-500 transition-all text-sm"
              >
                Hoàn thành
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}
