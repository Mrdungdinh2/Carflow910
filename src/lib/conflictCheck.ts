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
function timeRangesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
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
  excludeRequestId?: string
): { available: boolean; conflictWith?: VehicleRequest } {
  const activeStatuses = ['tcth_approved', 'bgd_approved', 'driver_accepted'];

  for (const req of allRequests) {
    if (req.id === excludeRequestId) continue;
    if (!activeStatuses.includes(req.status)) continue;
    if (req.assignedVehicleId !== vehicleId) continue;

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
  excludeRequestId?: string
): { available: boolean; conflictWith?: VehicleRequest } {
  const activeStatuses = ['tcth_approved', 'bgd_approved', 'driver_accepted'];

  for (const req of allRequests) {
    if (req.id === excludeRequestId) continue;
    if (!activeStatuses.includes(req.status)) continue;
    if (req.assignedDriverId !== driverId) continue;

    if (timeRangesOverlap(startTime, endTime, req.startDateTime, req.endDateTime)) {
      return { available: false, conflictWith: req };
    }
  }

  return { available: true };
}

/**
 * Get all available vehicles for a time range
 */
export function getAvailableVehiclesForTimeRange(
  vehicles: Vehicle[],
  allRequests: VehicleRequest[],
  startTime: string,
  endTime: string,
  excludeRequestId?: string
): Vehicle[] {
  return vehicles.filter(v => {
    if (v.status === 'maintenance' || v.status === 'retired') return false;
    const { available } = isVehicleAvailable(v.id, startTime, endTime, allRequests, excludeRequestId);
    return available;
  });
}

/**
 * Get all available drivers for a time range
 */
export function getAvailableDriversForTimeRange(
  drivers: Driver[],
  allRequests: VehicleRequest[],
  startTime: string,
  endTime: string,
  excludeRequestId?: string
): Driver[] {
  return drivers.filter(d => {
    if (d.status === 'day_off' || d.status === 'sick_leave') return false;
    const { available } = isDriverAvailable(d.id, startTime, endTime, allRequests, excludeRequestId);
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
