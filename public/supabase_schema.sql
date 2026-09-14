-- ========================================================
-- CARFLOW 910 - SUPABASE DATABASE RESET & RE-INITIALIZATION SCRIPT
-- VietinBank Chi nhánh Nam Sài Gòn
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. DROP EXISTING TABLES IF RE-INITIALIZING (XÓA SẠCH DỮ LIỆU THỬ NGHIỆM CŨ)
drop table if exists activity_logs cascade;
drop table if exists vehicle_requests cascade;
drop table if exists drivers cascade;
drop table if exists vehicles cascade;
drop table if exists users cascade;
drop table if exists departments cascade;

-- 2. CREATE USERS TABLE (TÀI KHOẢN NGƯỜI DÙNG)
create table users (
  id text primary key default uuid_generate_v4()::text,
  username text unique not null,
  password text not null,
  name text not null,
  role text not null check (role in ('staff', 'dept_head', 'tcth', 'director', 'driver', 'admin')),
  department text not null,
  created_at timestamptz default now()
);

-- 3. CREATE VEHICLES TABLE (DANH MỤC XE Ô TÔ)
create table vehicles (
  id text primary key default uuid_generate_v4()::text,
  plate_number text unique not null,
  model text not null,
  seats integer not null default 4,
  status text not null default 'available' check (status in ('available', 'in_use', 'maintenance', 'retired')),
  current_odo integer not null default 0,
  notes text,
  created_at timestamptz default now()
);

-- 4. CREATE DRIVERS TABLE (DANH SÁCH TÀI XẾ)
create table drivers (
  id text primary key default uuid_generate_v4()::text,
  name text not null,
  phone text not null,
  license_class text not null default 'B2',
  status text not null default 'available' check (status in ('available', 'on_duty', 'day_off', 'sick_leave')),
  created_at timestamptz default now()
);

-- 5. CREATE DEPARTMENTS TABLE (DANH SÁCH PHÒNG BAN)
create table departments (
  id text primary key default uuid_generate_v4()::text,
  name text unique not null,
  code text,
  manager_name text,
  created_at timestamptz default now()
);

-- 6. CREATE VEHICLE REQUESTS TABLE (ĐỀ XUẤT / LỊCH TRÌNH XE)
create table vehicle_requests (
  id text primary key default uuid_generate_v4()::text,
  requester_name text not null,
  requester_id text references users(id) on delete set null,
  department text not null,
  vehicle_count integer not null default 1,
  personnel jsonb not null default '[]'::jsonb,
  start_date_time timestamptz not null,
  end_date_time timestamptz not null,
  pickup_location text not null,
  destination text not null,
  reason text not null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'dept_approved', 'tcth_approved', 'driver_accepted', 'completed', 'bgd_approved', 'rejected')),
  assigned_vehicle_id text references vehicles(id) on delete set null,
  assigned_driver_id text references drivers(id) on delete set null,
  trip_odo_start integer,
  trip_odo_end integer,
  approval_history jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. CREATE ACTIVITY LOGS TABLE (NHẬT KÝ HOẠT ĐỘNG)
create table activity_logs (
  id text primary key default uuid_generate_v4()::text,
  type text not null,
  description text not null,
  user_id text,
  user_name text,
  related_request_id text references vehicle_requests(id) on delete cascade,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ========================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- CRITICAL: Policies must allow BOTH 'anon' and 'authenticated' roles
-- CarFlow uses anon key (no Supabase Auth), so anon role MUST have full access
-- ========================================================
alter table users enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table departments enable row level security;
alter table vehicle_requests enable row level security;
alter table activity_logs enable row level security;

-- Policies: Allow ALL operations for ALL roles (anon + authenticated)
-- using (true) = allow SELECT
-- with check (true) = allow INSERT/UPDATE/DELETE
create policy "Allow all access" on users for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on vehicles for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on drivers for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on departments for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on vehicle_requests for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on activity_logs for all to anon, authenticated using (true) with check (true);

-- ========================================================
-- 9. INSERT CHUẨN HÓA DỮ LIỆU MỚI BAN ĐẦU (SEED DATA)
-- ========================================================

-- Danh sách tài khoản người dùng chuẩn (7 tài khoản)
insert into users (id, username, password, name, role, department) values
  ('u0', 'admin', '123456', 'System Admin', 'admin', 'Phòng Công nghệ Thông tin'),
  ('u1', 'nhanvien1', '123456', 'Nguyễn Thị Mai', 'staff', 'Phòng Kế toán'),
  ('u2', 'nhanvien2', '123456', 'Trần Văn Hùng', 'staff', 'Phòng Khách hàng Doanh nghiệp'),
  ('u3', 'truongphong', '123456', 'Lê Minh Tuấn', 'dept_head', 'Phòng Kế toán'),
  ('u4', 'tcth', '123456', 'Phạm Hoàng Anh', 'tcth', 'Phòng Tổ chức Tổng hợp'),
  ('u5', 'phogiamdoc', '123456', 'Võ Thanh Bình', 'director', 'Ban Giám đốc'),
  ('u6', 'giamdoc', '123456', 'Đặng Quốc Việt', 'director', 'Ban Giám đốc');

-- Danh sách xe ô tô chuẩn (5 xe)
insert into vehicles (id, plate_number, model, seats, status, current_odo, notes) values
  ('v1', '51A-123.45', 'Toyota Camry 2.5Q', 4, 'available', 45230, null),
  ('v2', '51A-234.56', 'Toyota Fortuner 2.7V', 7, 'available', 32100, null),
  ('v3', '51A-345.67', 'Ford Transit 16 chỗ', 16, 'available', 67800, null),
  ('v4', '51A-456.78', 'Toyota Innova 2.0E', 7, 'available', 51450, null),
  ('v5', '51A-567.89', 'Hyundai Accent 1.4AT', 4, 'maintenance', 28900, 'Bảo dưỡng định kỳ 30.000km');

-- Danh sách phòng ban chuẩn (15 phòng ban)
insert into departments (name) values
  ('Phòng Khách hàng Doanh nghiệp'),
  ('Phòng Khách hàng Cá nhân'),
  ('Phòng Kế toán'),
  ('Phòng Tổ chức Tổng hợp'),
  ('Phòng Quản lý Rủi ro'),
  ('Phòng Giao dịch'),
  ('Phòng Tiền tệ Kho quỹ'),
  ('Phòng Công nghệ Thông tin'),
  ('Phòng Kiểm soát Nội bộ'),
  ('Ban Giám đốc'),
  ('Phòng Tín dụng'),
  ('Phòng Thanh toán Quốc tế'),
  ('Phòng Dịch vụ Khách hàng'),
  ('Tổ Xử lý Nợ'),
  ('Phòng Bán lẻ');

-- ========================================================
-- 10. ENABLE SUPABASE REALTIME FOR ALL TABLES
-- Cho phép đồng bộ thời gian thực giữa tất cả các thiết bị
-- ========================================================
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table vehicles;
alter publication supabase_realtime add table drivers;
alter publication supabase_realtime add table departments;
alter publication supabase_realtime add table vehicle_requests;
alter publication supabase_realtime add table activity_logs;
