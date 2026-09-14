-- ========================================================
-- CARFLOW 910 - FIX RLS POLICIES (KHÔNG XÓA DỮ LIỆU)
-- Chạy đoạn SQL này trên Supabase SQL Editor
-- ========================================================

-- Xóa policies cũ (có thể không tồn tại - dùng IF EXISTS)
drop policy if exists "Allow full access for authenticated clients" on users;
drop policy if exists "Allow full access for authenticated clients" on vehicles;
drop policy if exists "Allow full access for authenticated clients" on drivers;
drop policy if exists "Allow full access for authenticated clients" on departments;
drop policy if exists "Allow full access for authenticated clients" on vehicle_requests;
drop policy if exists "Allow full access for authenticated clients" on activity_logs;

drop policy if exists "Allow full access" on users;
drop policy if exists "Allow full access" on vehicles;
drop policy if exists "Allow full access" on drivers;
drop policy if exists "Allow full access" on departments;
drop policy if exists "Allow full access" on vehicle_requests;
drop policy if exists "Allow full access" on activity_logs;

drop policy if exists "Allow all access" on users;
drop policy if exists "Allow all access" on vehicles;
drop policy if exists "Allow all access" on drivers;
drop policy if exists "Allow all access" on departments;
drop policy if exists "Allow all access" on vehicle_requests;
drop policy if exists "Allow all access" on activity_logs;

-- Tạo policies mới cho cả anon + authenticated
create policy "Allow all access" on users for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on vehicles for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on drivers for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on departments for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on vehicle_requests for all to anon, authenticated using (true) with check (true);
create policy "Allow all access" on activity_logs for all to anon, authenticated using (true) with check (true);

-- Gợi ý: Nếu muốn đảm bảo Realtime, không cần chạy ALTER PUBLICATION nếu đã có sẵn.
