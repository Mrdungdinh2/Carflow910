-- =============================================
-- CARFLOW 910 — SECURE RLS POLICIES
-- Chạy script này trên Supabase SQL Editor
-- TRƯỚC khi deploy code mới lên Vercel
-- =============================================

-- ===== 1. BẢO VỆ BẢNG USERS =====
-- Xóa policies cũ (Allow all)
drop policy if exists "Allow all access" on users;

-- Chỉ cho phép SELECT (đọc) — CHẶN ghi từ anon/authenticated client
-- Ghi vào bảng users chỉ thông qua Service Role Key (server-side API Routes)
create policy "Users: Read only for clients"
  on users for select to anon, authenticated
  using (true);

-- Chặn INSERT/UPDATE/DELETE từ anon & authenticated role
-- Chỉ service_role (server-side) bypass được RLS
create policy "Users: Block insert from client"
  on users for insert to anon, authenticated
  with check (false);

create policy "Users: Block update from client"
  on users for update to anon, authenticated
  using (false) with check (false);

create policy "Users: Block delete from client"
  on users for delete to anon, authenticated
  using (false);

-- ===== 2. GIỮ NGUYÊN CÁC BẢNG KHÁC =====
-- vehicles, drivers, departments, vehicle_requests, activity_logs
-- vẫn giữ policy "Allow all access" vì:
-- - App dùng anon key + custom auth (không phải Supabase Auth)
-- - Phân quyền ghi được kiểm soát ở application layer (role check)
-- - Siết quá chặt sẽ break tính năng quản lý xe/tài xế/đề xuất

-- ===== 3. TẠO VIEW KHÔNG CHỨA PASSWORD =====
-- View này dùng cho client-side sync (không bao giờ trả về password)
create or replace view users_public as
  select id, username, name, role, department, created_at
  from users;

-- Cho phép anon & authenticated đọc view
grant select on users_public to anon, authenticated;
