-- =============================================
-- CARFLOW 910 — MIGRATION: Hash Passwords
-- Chạy script này trên Supabase SQL Editor
-- SAU KHI deploy code mới lên Vercel
-- =============================================
-- ⚠️ LƯU Ý: Backup bảng users trước khi chạy!

-- Bước 1: Bật extension pgcrypto (Supabase thường đã có sẵn)
create extension if not exists pgcrypto;

-- Bước 2: Thêm cột password_hash (nếu chưa có)
alter table users add column if not exists password_hash text;

-- Bước 3: Hash tất cả mật khẩu plaintext hiện có → bcrypt
-- Chỉ hash những record chưa có password_hash
update users 
set password_hash = crypt(password, gen_salt('bf', 10)) 
where password_hash is null 
  and password is not null;

-- Bước 4: Xác nhận kết quả
-- Chạy query kiểm tra: tất cả users phải có password_hash
select id, username, name, 
  case when password_hash is not null then '✅ Đã hash' else '❌ Chưa hash' end as status
from users;

-- ===== CHỈ CHẠY BƯỚC 5 SAU KHI XÁC NHẬN TẤT CẢ ĐỀU ĐÃ HASH =====

-- Bước 5: Xóa cột password plaintext (KHÔNG THỂ HOÀN TÁC)
-- UNCOMMENT dòng dưới khi đã xác nhận tất cả đều "✅ Đã hash"
-- alter table users drop column if exists password;

-- Bước 6: Đặt password_hash NOT NULL
-- UNCOMMENT sau khi chạy Bước 5
-- alter table users alter column password_hash set not null;
