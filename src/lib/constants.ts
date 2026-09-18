import type {
  User, Vehicle, Driver, RequestStatus, RejectionReason,
  UserRole, VehicleStatus, DriverStatus,
} from './types';

// ===== DEPARTMENTS =====
export const DEPARTMENTS = [
  'Phòng Khách hàng Doanh nghiệp',
  'Phòng Khách hàng Cá nhân',
  'Phòng Kế toán',
  'Phòng Tổ chức Tổng hợp',
  'Phòng Quản lý Rủi ro',
  'Phòng Giao dịch',
  'Phòng Tiền tệ Kho quỹ',
  'Phòng Công nghệ Thông tin',
  'Phòng Kiểm soát Nội bộ',
  'Ban Giám đốc',
  'Phòng Tín dụng',
  'Phòng Thanh toán Quốc tế',
  'Phòng Dịch vụ Khách hàng',
  'Tổ Xử lý Nợ',
  'Phòng Bán lẻ',
];

// ===== ROUTE SUGGESTIONS =====
export const ROUTE_SUGGESTIONS = [
  'Trụ sở NHNN TP.HCM',
  'Kho bạc Nhà nước Q.7',
  'Chi cục Thuế Q.7',
  'Sở Giao dịch VietinBank',
  'Trung tâm Đào tạo VietinBank',
  'Sân bay Tân Sơn Nhất',
  'UBND Quận 7',
  'Ngân hàng Nhà nước - CN TP.HCM',
  'VP đại diện VietinBank TP.HCM',
  'Trụ sở Chi nhánh - Nam Sài Gòn',
];

// ===== STATUS CONFIG =====
export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bgColor: string }> = {
  draft:           { label: 'Bản nháp',         color: 'text-slate-400',   bgColor: 'bg-slate-400/10' },
  pending:         { label: 'Chờ TP duyệt',     color: 'text-amber-400',   bgColor: 'bg-amber-400/10' },
  dept_approved:   { label: 'TP đã duyệt',      color: 'text-blue-400',    bgColor: 'bg-blue-400/10' },
  tcth_approved:   { label: 'Chờ tài xế nhận',  color: 'text-cyan-400',    bgColor: 'bg-cyan-400/10' },
  driver_accepted: { label: 'Đang thực hiện',   color: 'text-violet-400',  bgColor: 'bg-violet-400/10' },
  completed:       { label: 'Hoàn thành',       color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  bgd_approved:    { label: 'BGĐ đã duyệt',     color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  rejected:        { label: 'Từ chối',           color: 'text-red-400',     bgColor: 'bg-red-400/10' },
};

// ===== ROLE CONFIG =====
export const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  staff:     { label: 'Nhân viên',      color: 'text-slate-400' },
  dept_head: { label: 'Trưởng phòng',   color: 'text-blue-400' },
  tcth:      { label: 'Phòng TCTH',     color: 'text-cyan-400' },
  director:  { label: 'Ban Giám đốc',   color: 'text-amber-400' },
  driver:    { label: 'Tài xế',         color: 'text-orange-400' },
  admin:     { label: 'Quản trị viên', color: 'text-rose-400' },
};

// ===== REJECTION REASONS =====
export const REJECTION_REASONS: Record<RejectionReason, string> = {
  no_vehicle:        '🚫 Không còn xe trống',
  no_driver:         '🚫 Không có tài xế',
  schedule_conflict: '🚫 Trùng lịch với đề xuất khác',
  invalid_reason:    '🚫 Lý do không phù hợp',
  budget_exceeded:   '🚫 Vượt ngân sách cho phép',
  not_urgent:        '🚫 Không cấp bách, có thể dời lịch',
  other:             '🚫 Lý do khác',
};

// ===== VEHICLE STATUS CONFIG =====
export const VEHICLE_STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string }> = {
  available:   { label: 'Sẵn sàng',   color: 'text-emerald-400' },
  in_use:      { label: 'Đang dùng',  color: 'text-blue-400' },
  reserved:    { label: 'Đang đợi',   color: 'text-purple-400' },
  maintenance: { label: 'Bảo trì',    color: 'text-amber-400' },
  retired:     { label: 'Thanh lý',    color: 'text-slate-500' },
};

// ===== DRIVER STATUS CONFIG =====
export const DRIVER_STATUS_CONFIG: Record<DriverStatus, { label: string; color: string }> = {
  available:  { label: 'Sẵn sàng',   color: 'text-emerald-400' },
  on_duty:    { label: 'Đang chạy',  color: 'text-blue-400' },
  reserved:   { label: 'Đang đợi',   color: 'text-purple-400' },
  day_off:    { label: 'Nghỉ phép',  color: 'text-amber-400' },
  sick_leave: { label: 'Nghỉ ốm',   color: 'text-red-400' },
};

// ===== BRANCH INFO =====
export const BRANCH_INFO = {
  name: 'NGÂN HÀNG TMCP CÔNG THƯƠNG VIỆT NAM',
  branch: 'CHI NHÁNH NAM SÀI GÒN',
  shortName: 'CN – NAM SÀI GÒN',
  templateCode: 'Mẫu số 02/GĐNSDX',
};

// ===== SEED FALLBACK (Chỉ dùng khi Supabase hoàn toàn trống) =====
// Dữ liệu thực tế được đồng bộ 100% từ Supabase Database
export const SEED_USERS: User[] = [];
export const SEED_VEHICLES: Vehicle[] = [];
export const SEED_DRIVERS: Driver[] = [];

