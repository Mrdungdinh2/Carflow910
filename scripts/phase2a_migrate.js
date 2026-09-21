/**
 * Phase 2A Database Migration Script
 * - Adds actual_start_time, actual_end_time to vehicle_requests
 * - Creates resource_blocks table
 * 
 * Uses Supabase Management API (requires project ref + service role key)
 */

const https = require('https');

const SUPABASE_URL = 'https://lupzvpxcuwwyhozeqlty.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cHp2cHhjdXd3eWhvemVxbHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2NzQ3MiwiZXhwIjoyMTA0OTQzNDcyfQ.70lovkOPMPtn_qShOqdXFpMfoA3zFwGVZAXor-tQR4k';

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    // Use the raw PostgreSQL endpoint instead
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'lupzvpxcuwwyhozeqlty.supabase.co',
      path: '/rest/v1/rpc/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
      }
    };

    // We can't run DDL via PostgREST directly.
    // We'll use the pg connection via Supabase SQL Editor approach
    reject(new Error('Need direct SQL execution'));
  });
}

async function main() {
  console.log('=== Phase 2A: Database Migration ===\n');
  
  console.log('SQL statements to execute in Supabase SQL Editor:\n');
  
  console.log('-- 1. Add actual times columns to vehicle_requests');
  console.log(`ALTER TABLE vehicle_requests
  ADD COLUMN IF NOT EXISTS actual_start_time timestamptz,
  ADD COLUMN IF NOT EXISTS actual_end_time timestamptz;`);
  
  console.log('\n-- 2. Create resource_blocks table');
  console.log(`CREATE TABLE IF NOT EXISTS resource_blocks (
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
);`);

  console.log('\n-- 3. Enable RLS');
  console.log(`ALTER TABLE resource_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access" ON resource_blocks FOR ALL USING (true);`);

  console.log('\n-- 4. Update vehicle status CHECK constraint to include reserved');
  console.log(`ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check CHECK (status IN ('available', 'in_use', 'reserved', 'maintenance', 'retired'));`);

  console.log('\n-- 5. Update driver status CHECK constraint to include reserved');
  console.log(`ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_status_check;
ALTER TABLE drivers ADD CONSTRAINT drivers_status_check CHECK (status IN ('available', 'on_duty', 'reserved', 'day_off', 'sick_leave'));`);

  console.log('\n=== Copy and paste ALL the above SQL into Supabase SQL Editor ===');
  console.log('=== Then enable Realtime for resource_blocks in Database > Replication ===');
}

main();
