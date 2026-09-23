import type { VehicleRequest, Vehicle, Driver } from './types';

export interface ConflictResult {
  hasConflict: boolean;
  type?: 'vehicle' | 'driver' | 'no_vehicle' | 'no_driver';
  conflictWith?: VehicleRequest;
  message?: string;
  suggestion?: string;
}

/**
 * Check if two time ranges overlap
 */
function parseTime(timeStr: string): number {
  if (!timeStr) return 0;
  const t = new Date(timeStr).getTime();
  return isNaN(t) ? 0 : t;
}

function timeRangesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  if (!s1 || !e1 || !s2 || !e2) return false;
  return s1 < e2 && s2 < e1;
}

/**
 * Check if a vehicle is available in a given time range
 */
export function isVehicleAvailable(
  vehicleId: string,
  startTime: string,
  endTime: string,
  allRequests: VehicleRequest[],
  excludeRequestId?: string,
  plateNumber?: string
): { available: boolean; conflictWith?: VehicleRequest } {
  const activeStatuses = ['tcth_approved', 'bgd_approved', 'driver_accepted'];
  const targetId = vehicleId.toLowerCase();
  const targetPlate = plateNumber ? plateNumber.toLowerCase() : '';

  for (const req of allRequests) {
    if (req.id === excludeRequestId) continue;
    if (!activeStatuses.includes(req.status)) continue;
    if (!req.assignedVehicleId) continue;

    const assigned = req.assignedVehicleId.toLowerCase();
    const isMatch = assigned === targetId || (targetPlate && assigned === targetPlate);
    if (!isMatch) continue;

    if (timeRangesOverlap(startTime, endTime, req.startDateTime, req.endDateTime)) {
      return { available: false, conflictWith: req };
    }
  }

  return { available: true };
}

/**
 * Check if a driver is available in a given time range
 */
export function isDriverAvailable(
  driverId: string,
  startTime: string,
  endTime: string,
  allRequests: VehicleRequest[],
  excludeRequestId?: string,
  driverName?: string
): { available: boolean; conflictWith?: VehicleRequest } {
  const activeStatuses = ['tcth_approved', 'bgd_approved', 'driver_accepted'];
  const targetId = driverId.toLowerCase();
  const targetName = driverName ? driverName.toLowerCase() : '';

  for (const req of allRequests) {
    if (req.id === excludeRequestId) continue;
    if (!activeStatuses.includes(req.status)) continue;
    if (!req.assignedDriverId) continue;

    const assigned = req.assignedDriverId.toLowerCase();
    const isMatch = assigned === targetId || (targetName && assigned === targetName);
    if (!isMatch) continue;

    if (timeRangesOverlap(startTime, endTime, req.startDateTime, req.endDateTime)) {
      return { available: false, conflictWith: req };
    }
  }

  return { available: true };
}

/**
 * Get all available vehicles for a time range.
 * - Xe maintenance/retired: LUÔN bị loại.
 * - Xe available: OK nếu không trùng lịch.
 * - Xe in_use: Cho phép gán cho chuyến TƯƠNG LAI nếu không trùng lịch
 *   (khi chuyến hiện tại hoàn thành, xe sẽ tự về available).
 */
export function getAvailableVehiclesForTimeRange(
  vehicles: Vehicle[],
  allRequests: VehicleRequest[],
  startTime: string,
  endTime: string,
  excludeRequestId?: string
): Vehicle[] {
  return vehicles.filter(v => {
    // Xe bảo trì / thanh lý → luôn loại
    if (v.status === 'maintenance' || v.status === 'retired') return false;

    // Kiểm tra trùng lịch thời gian cụ thể với các đề xuất khác
    const { available } = isVehicleAvailable(v.id, startTime, endTime, allRequests, excludeRequestId, v.plateNumber);
    return available;
  });
}

/**
 * Get all available drivers for a time range.
 * - TX day_off/sick_leave: LUÔN bị loại.
 * - TX available/on_duty/reserved: OK nếu không trùng lịch theo khung giờ.
 */
export function getAvailableDriversForTimeRange(
  drivers: Driver[],
  allRequests: VehicleRequest[],
  startTime: string,
  endTime: string,
  excludeRequestId?: string
): Driver[] {
  return drivers.filter(d => {
    // TX nghỉ phép / nghỉ ốm → luôn loại
    if (d.status === 'day_off' || d.status === 'sick_leave') return false;

    // Kiểm tra trùng lịch thời gian cụ thể với các đề xuất khác
    const { available } = isDriverAvailable(d.id, startTime, endTime, allRequests, excludeRequestId, d.name);
    return available;
  });
}

/**
 * Full conflict check for a request
 */
export function checkRequestConflicts(
  request: VehicleRequest,
  vehicles: Vehicle[],
  drivers: Driver[],
  allRequests: VehicleRequest[]
): ConflictResult {
  const availableVehicles = getAvailableVehiclesForTimeRange(
    vehicles, allRequests, request.startDateTime, request.endDateTime, request.id
  );

  const availableDrivers = getAvailableDriversForTimeRange(
    drivers, allRequests, request.startDateTime, request.endDateTime, request.id
  );

  if (availableVehicles.length === 0) {
    return {
      hasConflict: true,
      type: 'no_vehicle',
      message: 'Không còn xe trống trong khung giờ này',
      suggestion: 'Đề nghị điều chỉnh thời gian hoặc từ chối đề xuất',
    };
  }

  if (availableDrivers.length === 0) {
    return {
      hasConflict: true,
      type: 'no_driver',
      message: 'Không có tài xế trống trong khung giờ này',
      suggestion: 'Đề nghị điều chỉnh thời gian hoặc liên hệ tài xế dự bị',
    };
  }

  // Warning if running low
  if (availableVehicles.length === 1) {
    return {
      hasConflict: false,
      message: `⚠️ Chỉ còn 1 xe trống (${availableVehicles[0].plateNumber})`,
      suggestion: 'Cần ưu tiên sắp xếp',
    };
  }

  return { hasConflict: false };
}
