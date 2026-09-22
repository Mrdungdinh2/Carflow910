'use client';

import type { VehicleRequest, RequestStatus, UserRole, ApprovalEntry, ActivityLog, VehicleStatus, DriverStatus } from './types';
import { updateVehicleStatus, updateDriverStatus, updateVehicleOdo, addActivityLog, getVehicles, getDrivers } from './vehicleStorage';
import { fixVietnameseUnicode } from './vietnameseUtils';
import { pushRequestToSupabase, deleteRequestFromSupabase } from './supabaseStorage';
import { isTCTHDepartment, isSameDepartment } from './constants';

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

/**
 * [DEPRECATED — Phase 2B] No-op stub giữ lại cho backward compat.
 * Status xe/tài xế giờ được tính toán (computed) tại thời điểm đọc,
 * KHÔNG còn ghi đè vào vehicle.status / driver.status.
 * @returns Luôn trả 0
 */
export function syncTodayTripStatuses(): number {
  return 0;
}

/**
 * Tính trạng thái HIỆN TẠI (computed) của vehicle dựa trên trips đang diễn ra.
 * KHÔNG ghi đè vehicle.status — chỉ trả về giá trị tính toán.
 */
export function getVehicleCurrentStatus(vehicleId: string, customRequests?: VehicleRequest[]): VehicleStatus {
  const vehicles = getVehicles();
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return 'available';
  
  // 1. Master status ưu tiên (admin set thủ công)
  if (vehicle.status === 'maintenance' || vehicle.status === 'retired') {
    return vehicle.status;
  }
  
  // 2. Resource Block (bảo trì / tạm khóa đặt trước theo khoảng thời gian)
  const nowIso = new Date().toISOString();
  try {
    const { getResourceBlocks } = require('./supabaseStorage');
    const blocks = getResourceBlocks();
    const activeBlock = blocks.find((b: any) =>
      b.resourceType === 'vehicle' &&
      b.resourceId === vehicleId &&
      b.startTime <= nowIso &&
      b.endTime >= nowIso
    );
    if (activeBlock) return 'maintenance';
  } catch {}
  
  const requests = customRequests || getRequests();
  
  // 3. Chuyến xe có trạng thái driver_accepted là chuyến ĐANG THỰC HIỆN (Đang công tác)
  const activeReq = requests.find(r =>
    r.assignedVehicleId === vehicleId &&
    r.status === 'driver_accepted'
  );
  
  return activeReq ? 'in_use' : 'available';
}

/**
 * Tính trạng thái HIỆN TẠI (computed) của driver dựa trên trips đang diễn ra.
 */
export function getDriverCurrentStatus(driverId: string, customRequests?: VehicleRequest[]): DriverStatus {
  const drivers = getDrivers();
  const driver = drivers.find(d => d.id === driverId);
  if (!driver) return 'available';
  
  // 1. Master status ưu tiên (nghỉ phép / nghỉ ốm do admin set)
  if (driver.status === 'day_off' || driver.status === 'sick_leave') {
    return driver.status;
  }
  
  // 2. Resource Block (nghỉ phép theo khoảng thời gian)
  const nowIso = new Date().toISOString();
  try {
    const { getResourceBlocks } = require('./supabaseStorage');
    const blocks = getResourceBlocks();
    const activeBlock = blocks.find((b: any) =>
      b.resourceType === 'driver' &&
      b.resourceId === driverId &&
      b.startTime <= nowIso &&
      b.endTime >= nowIso
    );
    if (activeBlock) return 'day_off';
  } catch {}
  
  const driverName = driver.name ? driver.name.toLowerCase() : '';
  const targetId = driverId.toLowerCase();
  const requests = customRequests || getRequests();
  
  // 3. Chuyến xe có trạng thái driver_accepted là chuyến ĐANG THỰC HIỆN (Đang chạy)
  const activeReq = requests.find(r => {
    if (r.status !== 'driver_accepted') return false;
    if (!r.assignedDriverId) return false;
    const assigned = r.assignedDriverId.toLowerCase();
    return assigned === targetId || (driverName && assigned === driverName);
  });
  
  return activeReq ? 'on_duty' : 'available';
}

/**
 * Lấy lịch tương lai của resource (TÁCH BIỆT khỏi current status)
 */
export function getResourceSchedule(
  resourceType: 'vehicle' | 'driver',
  resourceId: string,
  fromDate?: string,
  toDate?: string
): VehicleRequest[] {
  const now = fromDate || new Date().toISOString();
  const end = toDate || new Date(Date.now() + 7 * 86400000).toISOString();
  const requests = getRequests();
  
  const driverObj = resourceType === 'driver' ? getDrivers().find(d => d.id === resourceId) : null;
  const driverName = driverObj?.name?.toLowerCase() || '';
  const targetId = resourceId.toLowerCase();
  
  return requests.filter(r => {
    const isTarget = resourceType === 'vehicle'
      ? r.assignedVehicleId === resourceId
      : (r.assignedDriverId?.toLowerCase() === targetId || (driverName && r.assignedDriverId?.toLowerCase() === driverName));
    
    if (!isTarget) return false;
    // Lịch tiếp theo CHỈ bao gồm các chuyến tcth_approved (chưa nhận/chưa bắt đầu)
    // TUYỆT ĐỐI KHÔNG bao gồm chuyến driver_accepted (đã là chuyến đang thực hiện)
    if (r.status !== 'tcth_approved') return false;
    if (!r.endDateTime) return false;
    return r.endDateTime >= now && r.startDateTime <= end;
  }).sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
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
  // Phase 2B: Status là computed — không cần gọi syncTodayTripStatuses
  window.dispatchEvent(new Event('carflow_data_changed'));
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
    // [Fix A] Giải phóng xe/TX khi reject đề xuất đã gán → sync lại toàn bộ
  } else if (fullEntry.action === 'approve') {
    if (fullEntry.byRole === 'dept_head') {
      requests[index].status = 'dept_approved';
    } else if (fullEntry.byRole === 'tcth') {
      // TCTH duyệt pending của phòng mình → dept_approved (duyệt cấp phòng)
      // TCTH duyệt dept_approved → tcth_approved (gán xe/TX)
      if (requests[index].status === 'pending') {
        requests[index].status = 'dept_approved';
      } else {
        requests[index].status = 'tcth_approved';
      }
    } else if (fullEntry.byRole === 'director') {
      requests[index].status = 'bgd_approved';
    }
  } else if (fullEntry.action === 'driver_accept') {
    requests[index].status = 'driver_accepted';
    // Phase 2B: Ghi actual start time khi tài xế nhận nhiệm vụ
    requests[index].actualStartTime = new Date().toISOString();
  } else if (fullEntry.action === 'driver_complete') {
    requests[index].status = 'completed';
    // Phase 2B: Ghi actual end time khi hoàn thành
    requests[index].actualEndTime = new Date().toISOString();
  }

  requests[index].updatedAt = new Date().toISOString();
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
  pushRequestToSupabase(requests[index]);

  // Phase 2B: Status là computed — không cần sync trạng thái xe/TX thủ công

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
  // Đảm bảo sau khi TCTH gán xe/TX, status chuyển thành 'tcth_approved' (chờ TX nhận)
  if (!['driver_accepted', 'completed'].includes(requests[index].status)) {
    requests[index].status = 'tcth_approved';
  }
  requests[index].updatedAt = new Date().toISOString();
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
  pushRequestToSupabase(requests[index]);

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
  req.status = 'completed';
  req.actualEndTime = new Date().toISOString();
  req.updatedAt = new Date().toISOString();
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(requests));
  pushRequestToSupabase(req);

  // Cập nhật ODO cho xe
  if (req.assignedVehicleId) {
    updateVehicleOdo(req.assignedVehicleId, endOdo);
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
  return getRequests().filter(r => isSameDepartment(r.department, department));
}

export function getPendingForRole(role: UserRole, userId?: string, department?: string): VehicleRequest[] {
  const requests = getRequests();
  switch (role) {
    case 'dept_head': return requests.filter(r => r.status === 'pending' && (!department || isSameDepartment(r.department, department)));
    case 'tcth': return requests.filter(r =>
      r.status === 'dept_approved' ||
      // TCTH cũng thấy đề xuất 'pending' của phòng TCTH (vì TCTH duyệt cấp phòng cho chính phòng mình)
      (r.status === 'pending' && isTCTHDepartment(r.department))
    );
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

  // Phase 2B: Status là computed — không cần sync thủ công

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
// [Fix G] Mở rộng phạm vi rà soát quá hạn từ 3 → 30 ngày
export function getStaleRequests(withinDays: number = 30): VehicleRequest[] {
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

  // Phase 2B: Status là computed — không cần sync thủ công

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


