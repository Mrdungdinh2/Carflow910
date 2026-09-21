-- =============================================
-- PHASE 2A: DATABASE MIGRATION
-- CarFlow 910 VOMS Refactor
-- 
-- HƯỚNG DẪN: Copy toàn bộ nội dung file này
-- vào Supabase Dashboard → SQL Editor → Run
-- =============================================

-- Step 1: Thêm actual_start_time, actual_end_time vào vehicle_requests
-- (Nullable → dữ liệu cũ KHÔNG bị ảnh hưởng)
ALTER TABLE vehicle_requests
  ADD COLUMN IF NOT EXISTS actual_start_time timestamptz,
  ADD COLUMN IF NOT EXISTS actual_end_time timestamptz;

-- Step 2: Tạo bảng resource_blocks (maintenance windows, driver leave, etc.)
CREATE TABLE IF NOT EXISTS resource_blocks (
  id text PRIMARY KEY DEFAULT ('blk_' || extract(epoch from now())::bigint::text || '_' || substr(md5(random()::text), 1, 6)),
  resource_type text NOT NULL CHECK (resource_type IN ('vehicle', 'driver')),
  resource_id text NOT NULL,
  block_type text NOT NULL CHECK (block_type IN ('maintenance', 'leave', 'block')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  reason text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  CHECK (end_time > start_time)
);

-- Step 3: Enable RLS cho resource_blocks (matching existing pattern)
ALTER TABLE resource_blocks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow full access" ON resource_blocks FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 4: Verify kết quả
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicle_requests' 
  AND column_name IN ('actual_start_time', 'actual_end_time');

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'resource_blocks';
