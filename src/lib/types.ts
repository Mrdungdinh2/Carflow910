// ===== USER & AUTH =====
export type UserRole = 'staff' | 'dept_head' | 'tcth' | 'director' | 'driver' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department: string;
  phone?: string;
}

// ===== VEHICLE =====
export type VehicleStatus = 'available' | 'in_use' | 'reserved' | 'maintenance' | 'retired';

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  seats: number;
  status: VehicleStatus;
  currentOdo: number;
  notes?: string;
}

// ===== DRIVER =====
export type DriverStatus = 'available' | 'on_duty' | 'reserved' | 'day_off' | 'sick_leave';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseClass: string;
  status: DriverStatus;
}

// ===== PERSONNEL =====
export interface PersonnelEntry {
  id: string;
  name: string;
  department?: string;
}

// ===== REQUEST STATUS =====
export type RequestStatus =
  | 'draft'
  | 'pending'
  | 'dept_approved'
  | 'tcth_approved'    // TCTH đã duyệt + gán xe → chờ tài xế nhận
  | 'driver_accepted'  // Tài xế đã nhận nhiệm vụ → đang thực hiện
  | 'completed'        // Tài xế xác nhận hoàn thành
  | 'bgd_approved'
  | 'rejected';

// ===== REJECTION =====
export type RejectionReason =
  | 'no_vehicle'
  | 'no_driver'
  | 'schedule_conflict'
  | 'invalid_reason'
  | 'budget_exceeded'
  | 'not_urgent'
  | 'other';

// ===== APPROVAL HISTORY =====
export interface ApprovalEntry {
  id: string;
  action: 'submit' | 'approve' | 'reject' | 'assign_vehicle' | 'return' | 'driver_accept' | 'driver_complete';
  by: string;
  byName: string;
  byRole: UserRole;
  timestamp: string;
  note?: string;
  rejectionReason?: RejectionReason;
  rejectionDetail?: string;
}

// ===== VEHICLE REQUEST =====
export interface VehicleRequest {
  id: string;
  requesterName: string;
  requesterId?: string;
  department: string;
  vehicleCount: number;
  personnel: PersonnelEntry[];
  startDateTime: string;
  endDateTime: string;
  pickupLocation: string;
  destination: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;

  // Assignment (filled by TCTH)
  assignedVehicleId?: string;
  assignedDriverId?: string;
  tripOdoStart?: number;
  tripOdoEnd?: number;

  // Approval trail
  approvalHistory: ApprovalEntry[];
}

// ===== DASHBOARD STATS =====
export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

// ===== ACTIVITY LOG =====
export type ActivityType =
  | 'request_created'
  | 'request_submitted'
  | 'request_approved'
  | 'request_rejected'
  | 'vehicle_assigned'
  | 'trip_started'
  | 'trip_completed'
  | 'vehicle_maintenance'
  | 'driver_status_change';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  relatedRequestId?: string;
  metadata?: Record<string, string>;
}

// ===== FLEET STATS =====
export interface FleetStats {
  totalVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  reservedVehicles: number;
  maintenanceVehicles: number;
  totalDrivers: number;
  availableDrivers: number;
  onDutyDrivers: number;
  reservedDrivers: number;
}

// ===== DRIVER STATS =====
export interface DriverStats {
  driverId: string;
  completedTrips: number;
  activeTrips: number;
  totalTrips: number;
}

// ===== TIME FILTER TYPES =====
export type TimeFilterPreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';
export type TimeFilterTarget = 'startDateTime' | 'createdAt';

