'use client';

import type { VehicleRequest, RequestStatus, UserRole, ApprovalEntry, ActivityLog } from './types';
import { updateVehicleStatus, updateDriverStatus, updateVehicleOdo, addActivityLog } from './vehicleStorage';
import { fixVietnameseUnicode } from './vietnameseUtils';
import { pushRequestToSupabase, deleteRequestFromSupabase } from './supabaseStorage';

const STORAGE_KEY = 'carflow_requests';
const ACTIVITY_KEY = 'carflow_activity';
const MAX_LOCAL_REQUESTS = 200;

/**
 * Lấy danh sách đề xuất tương lai (startDateTime > hôm nay) đã gán xe/tài xế
 * nhưng chưa hoàn thành. Dùng để hiển thị badge "Đã đặt trước" trên Fleet.
 */
export function getUpcomingReservations(): VehicleRequest[] {
  const requests = getRequests();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return requests.filter(r => {
    if (!['tcth_approved', 'driver_accepted'].includes(r.status)) return false;
    if (!r.assignedVehicleId && !r.assignedDriverId) return false;
    if (!r.startDateTime) return false;
    const tripDay = new Date(r.startDateTime);
    tripDay.setHours(0, 0, 0, 0);
    return tripDay > now; // Chỉ lấy đề xuất tương lai
  });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Ghi localStorage an toàn — bắt QuotaExceededError thay vì crash app.
 */
function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn(`[CarFlow Storage] localStorage đầy khi ghi key "${key}". Đang dọn dẹp...`);
      try {
        localStorage.removeItem(ACTIVITY_KEY);
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.error(`[CarFlow Storage] localStorage vẫn đầy. Key: "${key}", Size: ${(value.length / 1024).toFixed(1)}KB`);
        return false;
      }
    }
    throw err;
  }
}

export function getRequests(): VehicleRequest[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const requests: VehicleRequest[] = JSON.parse(raw);
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch { return []; }
}

export function getRequestById(id: string): VehicleRequest | null {
  const requests = getRequests();
  return requests.find(r => r.id === id) || null;
}

export function saveRequest(request: Partial<VehicleRequest>): VehicleRequest {
  if (typeof window === 'undefined') return request as VehicleRequest;
  
  const now = new Date().toISOString();
  const requests = getRequests();
  
  const existingIndex = request.id ? requests.findIndex(r => r.id === request.id) : -1;

  // Normalize Vietnamese text to precomposed NFC to prevent broken diacritics in exports
  const nfc = (s: string | undefined) => s ? fixVietnameseUnicode(s) : '';

  
  const saved: VehicleRequest = {
    id: request.id || generateId(),
    requesterName: nfc(request.requesterName),
    requesterId: request.requesterId || '',
    department: nfc(request.department),
    vehicleCount: request.vehicleCount || 1,
    personnel: (request.personnel || []).map(p => ({
      ...p,
      name: nfc(p.name),
      department: nfc(p.department),
    })),
    startDateTime: request.startDateTime || '',
    endDateTime: request.endDateTime || '',
    pickupLocation: nfc(request.pickupLocation),
    destination: nfc(request.destination),
    reason: nfc(request.reason),
    status: request.status || 'draft',
    createdAt: existingIndex >= 0 ? requests[existingIndex].createdAt : now,
    updatedAt: now,
    assignedVehicleId: request.assignedVehicleId,
    assignedDriverId: request.assignedDriverId,
    tripOdoStart: request.tripOdoStart,
    tripOdoEnd: request.tripOdoEnd,
    approvalHistory: request.approvalHistory || (existingIndex >= 0 ? requests[existingIndex].approvalHistory : []),
  };

  if (existingIndex >= 0) {
    requests[existingIndex] = saved;
  } else {
    requests.unshift(saved);
  }

  // Giới hạn số lượng requests trong localStorage để tránh vượt 5MB
  const trimmed = requests.slice(0, MAX_LOCAL_REQUESTS);
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(trimmed));
  pushRequestToSupabase(saved);
  return saved;
}

export function updateRequestStatus(id: string, status: RequestStatus): void {
  if (typeof window === 'undefined') return;
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index === -1) return;
  requests[index].status = status;
  requests[index].updatedAt = new Date().toISOString();
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
  pushRequestToSupabase(requests[index]);
}

export function deleteRequest(id: string): void {
  if (typeof window === 'undefined') return;
  const requests = getRequests().filter(r => r.id !== id);
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
  deleteRequestFromSupabase(id);
}

export function addApprovalEntry(
  requestId: string,
  entry: Omit<ApprovalEntry, 'id' | 'timestamp'> | ApprovalEntry
): void {
  if (typeof window === 'undefined') return;
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index === -1) return;

  const fullEntry: ApprovalEntry = {
    id: ('id' in entry && entry.id) ? entry.id : generateId(),
    timestamp: ('timestamp' in entry && entry.timestamp) ? entry.timestamp : new Date().toISOString(),
    action: entry.action,
    by: entry.by,
    byName: entry.byName,
    byRole: entry.byRole,
    note: entry.note,
    rejectionReason: entry.rejectionReason,
    rejectionDetail: entry.rejectionDetail,
  };

  if (!requests[index].approvalHistory) {
    requests[index].approvalHistory = [];
  }
  requests[index].approvalHistory.push(fullEntry);

  // Determine new status based on action + role
  if (fullEntry.action === 'submit') {
    requests[index].status = 'pending';
  } else if (fullEntry.action === 'reject') {
    requests[index].status = 'rejected';
  } else if (fullEntry.action === 'approve') {
    if (fullEntry.byRole === 'dept_head') {
      requests[index].status = 'dept_approved';
    } else if (fullEntry.byRole === 'tcth') {
      requests[index].status = 'tcth_approved';
    } else if (fullEntry.byRole === 'director') {
      requests[index].status = 'bgd_approved';
    }
  } else if (fullEntry.action === 'driver_accept') {
    requests[index].status = 'driver_accepted';
    // Khi tài xế nhận nhiệm vụ → khóa xe & tài xế ngay lập tức
    if (requests[index].assignedVehicleId) {
      updateVehicleStatus(requests[index].assignedVehicleId!, 'in_use');
    }
    if (requests[index].assignedDriverId) {
      updateDriverStatus(requests[index].assignedDriverId!, 'on_duty');
    }
  } else if (fullEntry.action === 'driver_complete') {
    requests[index].status = 'completed';
  }

  requests[index].updatedAt = new Date().toISOString();
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
  pushRequestToSupabase(requests[index]);

  // Log activity
  const req = requests[index];
  if (fullEntry.action === 'approve' || fullEntry.action === 'reject') {
    addActivityLog({
      type: fullEntry.action === 'approve' ? 'request_approved' : 'request_rejected',
      description: `${fullEntry.byName} đã ${fullEntry.action === 'approve' ? 'duyệt' : 'từ chối'} đề xuất "${req.destination}"`,
      userId: fullEntry.by,
      userName: fullEntry.byName,
      relatedRequestId: requestId,
    });
  }
  if (fullEntry.action === 'driver_accept') {
    addActivityLog({
      type: 'trip_started',
      description: `Tài xế ${fullEntry.byName} đã nhận nhiệm vụ "${req.destination}"`,
      userId: fullEntry.by,
      userName: fullEntry.byName,
      relatedRequestId: requestId,
    });
  }
  if (fullEntry.action === 'driver_complete') {
    addActivityLog({
      type: 'trip_completed',
      description: `Tài xế ${fullEntry.byName} đã hoàn thành chuyến "${req.destination}"`,
      userId: fullEntry.by,
      userName: fullEntry.byName,
      relatedRequestId: requestId,
    });
  }
}

export function assignVehicleToRequest(requestId: string, vehicleId: string, driverId: string): void {
  if (typeof window === 'undefined') return;
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index === -1) return;

  requests[index].assignedVehicleId = vehicleId;
  requests[index].assignedDriverId = driverId;
  requests[index].updatedAt = new Date().toISOString();
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
  pushRequestToSupabase(requests[index]);

  // Update vehicle & driver status — CHỈ khóa nếu ngày đi là hôm nay hoặc đã qua
  // Đề xuất tương lai → giữ available, hệ thống conflict-check time-range xử lý chống trùng
  const tripStart = new Date(requests[index].startDateTime);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripDay = new Date(tripStart);
  tripDay.setHours(0, 0, 0, 0);

  if (tripDay <= today) {
    // Ngày đi là hôm nay hoặc đã qua → khóa ngay
    updateVehicleStatus(vehicleId, 'in_use');
    updateDriverStatus(driverId, 'on_duty');
  }
  // else: Đề xuất tương lai → xe & tài xế giữ available, conflict-check sẽ ngăn trùng lịch

  addActivityLog({
    type: 'vehicle_assigned',
    description: `Đã gán xe cho đề xuất "${requests[index].destination}"`,
    userId: 'system',
    userName: 'Hệ thống',
    relatedRequestId: requestId,
    metadata: { vehicleId, driverId },
  });
}

export function completeTrip(requestId: string, endOdo: number): void {
  if (typeof window === 'undefined') return;
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index === -1) return;

  const req = requests[index];
  req.tripOdoEnd = endOdo;
  req.updatedAt = new Date().toISOString();
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
  pushRequestToSupabase(req);

  // Release vehicle & driver
  if (req.assignedVehicleId) {
    updateVehicleStatus(req.assignedVehicleId, 'available');
    updateVehicleOdo(req.assignedVehicleId, endOdo);
  }
  if (req.assignedDriverId) {
    updateDriverStatus(req.assignedDriverId, 'available');
  }

  addActivityLog({
    type: 'trip_completed',
    description: `Hoàn thành chuyến công tác "${req.destination}" - ODO: ${endOdo.toLocaleString()} km`,
    userId: 'system',
    userName: 'Hệ thống',
    relatedRequestId: requestId,
  });
}

export function getRequestsByDepartment(department: string): VehicleRequest[] {
  return getRequests().filter(r => r.department === department);
}

export function getPendingForRole(role: UserRole, userId?: string, department?: string): VehicleRequest[] {
  const requests = getRequests();
  switch (role) {
    case 'dept_head': return requests.filter(r => r.status === 'pending' && (!department || r.department === department));
    case 'tcth': return requests.filter(r => r.status === 'dept_approved');
    case 'director':
    case 'admin': return requests.filter(r => ['pending', 'dept_approved'].includes(r.status));
    case 'driver': return requests.filter(r =>
      (r.status === 'tcth_approved' || r.status === 'driver_accepted') &&
      r.assignedDriverId === userId
    );
    default: return [];
  }
}

export function createDirectTask(data: {
  driverId: string;
  driverName: string;
  vehicleId: string;
  destination: string;
  reason: string;
  startDateTime: string;
  endDateTime: string;
  createdById: string;
  createdByName: string;
}): VehicleRequest {
  const now = new Date().toISOString();
  const newRequest: VehicleRequest = {
    id: 'dt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    requesterName: data.createdByName,
    requesterId: data.createdById,
    department: 'Phòng Tổ chức Tổng hợp',
    vehicleCount: 1,
    personnel: [{ id: 'p1', name: data.createdByName, department: 'Phòng Tổ chức Tổng hợp' }],
    startDateTime: data.startDateTime,
    endDateTime: data.endDateTime,
    pickupLocation: 'Trụ sở CN Nam Sài Gòn',
    destination: fixVietnameseUnicode(data.destination),
    reason: fixVietnameseUnicode(data.reason),
    status: 'tcth_approved', // Direct assignment -> ready for driver
    createdAt: now,
    updatedAt: now,
    assignedVehicleId: data.vehicleId,
    assignedDriverId: data.driverId,
    approvalHistory: [
      {
        id: Date.now().toString(36),
        action: 'assign_vehicle',
        by: data.createdById,
        byName: data.createdByName,
        byRole: 'tcth',
        timestamp: now,
        note: `Phòng TCTH giao nhiệm vụ trực tiếp. Xe & tài xế: ${data.driverName}`,
      }
    ]
  };

  const requests = getRequests();
  requests.unshift(newRequest);
  if (typeof window !== 'undefined') {
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
    pushRequestToSupabase(newRequest);
  }

  // Update vehicle & driver status — CHỈ khóa nếu ngày đi là hôm nay hoặc đã qua
  const dtTripStart = new Date(data.startDateTime);
  const dtToday = new Date();
  dtToday.setHours(0, 0, 0, 0);
  const dtTripDay = new Date(dtTripStart);
  dtTripDay.setHours(0, 0, 0, 0);

  if (dtTripDay <= dtToday) {
    if (data.vehicleId) updateVehicleStatus(data.vehicleId, 'in_use');
    if (data.driverId) updateDriverStatus(data.driverId, 'on_duty');
  }

  addActivityLog({
    type: 'vehicle_assigned',
    description: `Phòng TCTH giao nhiệm vụ trực tiếp "${data.destination}" cho tài xế ${data.driverName}`,
    userId: data.createdById,
    userName: data.createdByName,
    relatedRequestId: newRequest.id,
  });

  return newRequest;
}

/**
 * Rà soát đề xuất quá hạn: những đề xuất có endDateTime đã qua
 * mà trạng thái vẫn là tcth_approved hoặc driver_accepted.
 * Xe và tài xế bị khóa (in_use / on_duty) do chưa được xác nhận hoàn thành.
 * @param withinDays - Số ngày quá hạn tối đa (mặc định 3 ngày gần đây)
 */
export function getStaleRequests(withinDays: number = 3): VehicleRequest[] {
  const requests = getRequests();
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - withinDays);
  cutoffDate.setHours(0, 0, 0, 0);

  return requests.filter(r => {
    if (r.status !== 'tcth_approved' && r.status !== 'driver_accepted') return false;
    if (!r.endDateTime) return false;
    const endDate = new Date(r.endDateTime);
    // endDateTime đã qua (trước thời điểm hiện tại) và trong vòng N ngày gần đây
    return endDate < now && endDate >= cutoffDate;
  });
}

/**
 * Force-complete: Đánh dấu đề xuất quá hạn là hoàn thành,
 * giải phóng xe & tài xế (chuyển về available).
 */
export function forceCompleteRequest(
  requestId: string,
  byUserId: string,
  byUserName: string,
  byUserRole: 'admin' | 'tcth'
): void {
  if (typeof window === 'undefined') return;
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index === -1) return;

  const req = requests[index];

  // Thêm approval entry: force complete
  const entry: ApprovalEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    action: 'driver_complete',
    by: byUserId,
    byName: byUserName,
    byRole: byUserRole,
    timestamp: new Date().toISOString(),
    note: `Rà soát quá hạn — ${byUserRole === 'admin' ? 'Admin' : 'Phòng TCTH'} xác nhận hoàn thành (tự động giải phóng xe & tài xế)`,
  };
  if (!req.approvalHistory) req.approvalHistory = [];
  req.approvalHistory.push(entry);

  // Cập nhật trạng thái
  req.status = 'completed';
  req.updatedAt = new Date().toISOString();
  requests[index] = req;

  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
  pushRequestToSupabase(req);

  // Giải phóng xe & tài xế
  if (req.assignedVehicleId) {
    updateVehicleStatus(req.assignedVehicleId, 'available');
  }
  if (req.assignedDriverId) {
    updateDriverStatus(req.assignedDriverId, 'available');
  }

  // Ghi activity log
  addActivityLog({
    type: 'trip_completed',
    description: `${byUserName} rà soát quá hạn — Hoàn thành đề xuất "${req.destination}" & giải phóng xe/tài xế`,
    userId: byUserId,
    userName: byUserName,
    relatedRequestId: requestId,
  });
}

export function clearAllDemoData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('carflow_vehicles');
  localStorage.removeItem('carflow_drivers');
  localStorage.removeItem('carflow_activity_logs');
  localStorage.removeItem('carflow_users');
  localStorage.removeItem('carflow_departments');
}


