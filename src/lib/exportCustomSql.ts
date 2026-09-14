'use client';

import { getUsers } from './userStorage';
import { getVehicles, getDrivers } from './vehicleStorage';
import { getDepartments } from './departmentStorage';
import { getRequests } from './storage';
import { pushUserToSupabase, pushVehicleToSupabase, pushDriverToSupabase, pushRequestToSupabase } from './supabaseStorage';
import { supabase, isSupabaseConfigured } from './supabase';

function escapeSqlString(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function escapeJsonSql(obj: any): string {
  if (!obj) return `'[]'::jsonb`;
  const json = JSON.stringify(obj).replace(/'/g, "''");
  return `'${json}'::jsonb`;
}

export function generateCustomSqlFromCurrentData(): string {
  const users = getUsers();
  const vehicles = getVehicles();
  const departments = getDepartments();
  const drivers = getDrivers();
  const requests = getRequests();

  let sql = `-- ========================================================\n`;
  sql += `-- CARFLOW 910 - CUSTOM SUPABASE DATABASE MIGRATION SCRIPT\n`;
  sql += `-- Exported from Admin Dashboard on ${new Date().toLocaleString('vi-VN')}\n`;
  sql += `-- ========================================================\n\n`;

  sql += `create extension if not exists "uuid-ossp";\n\n`;

  // Drop tables cascade
  sql += `-- 1. RESET EXISTING TABLES\n`;
  sql += `drop table if exists activity_logs cascade;\n`;
  sql += `drop table if exists vehicle_requests cascade;\n`;
  sql += `drop table if exists drivers cascade;\n`;
  sql += `drop table if exists vehicles cascade;\n`;
  sql += `drop table if exists users cascade;\n`;
  sql += `drop table if exists departments cascade;\n\n`;

  // Create tables
  sql += `-- 2. CREATE TABLES\n`;
  sql += `create table users (\n`;
  sql += `  id text primary key default uuid_generate_v4()::text,\n`;
  sql += `  username text unique not null,\n`;
  sql += `  password text not null,\n`;
  sql += `  name text not null,\n`;
  sql += `  role text not null check (role in ('staff', 'dept_head', 'tcth', 'director', 'driver', 'admin')),\n`;
  sql += `  department text not null,\n`;
  sql += `  created_at timestamptz default now()\n`;
  sql += `);\n\n`;

  sql += `create table vehicles (\n`;
  sql += `  id text primary key default uuid_generate_v4()::text,\n`;
  sql += `  plate_number text unique not null,\n`;
  sql += `  model text not null,\n`;
  sql += `  seats integer not null default 4,\n`;
  sql += `  status text not null default 'available' check (status in ('available', 'in_use', 'maintenance', 'retired')),\n`;
  sql += `  current_odo integer not null default 0,\n`;
  sql += `  notes text,\n`;
  sql += `  created_at timestamptz default now()\n`;
  sql += `);\n\n`;

  sql += `create table drivers (\n`;
  sql += `  id text primary key default uuid_generate_v4()::text,\n`;
  sql += `  name text not null,\n`;
  sql += `  phone text not null,\n`;
  sql += `  license_class text not null default 'B2',\n`;
  sql += `  status text not null default 'available' check (status in ('available', 'on_duty', 'day_off', 'sick_leave')),\n`;
  sql += `  created_at timestamptz default now()\n`;
  sql += `);\n\n`;

  sql += `create table departments (\n`;
  sql += `  id text primary key default uuid_generate_v4()::text,\n`;
  sql += `  name text unique not null,\n`;
  sql += `  code text,\n`;
  sql += `  manager_name text,\n`;
  sql += `  created_at timestamptz default now()\n`;
  sql += `);\n\n`;

  sql += `create table vehicle_requests (\n`;
  sql += `  id text primary key default uuid_generate_v4()::text,\n`;
  sql += `  requester_name text not null,\n`;
  sql += `  requester_id text references users(id) on delete set null,\n`;
  sql += `  department text not null,\n`;
  sql += `  vehicle_count integer not null default 1,\n`;
  sql += `  personnel jsonb not null default '[]'::jsonb,\n`;
  sql += `  start_date_time timestamptz not null,\n`;
  sql += `  end_date_time timestamptz not null,\n`;
  sql += `  pickup_location text not null,\n`;
  sql += `  destination text not null,\n`;
  sql += `  reason text not null,\n`;
  sql += `  status text not null default 'draft' check (status in ('draft', 'pending', 'dept_approved', 'tcth_approved', 'driver_accepted', 'completed', 'bgd_approved', 'rejected')),\n`;
  sql += `  assigned_vehicle_id text references vehicles(id) on delete set null,\n`;
  sql += `  assigned_driver_id text references drivers(id) on delete set null,\n`;
  sql += `  trip_odo_start integer,\n`;
  sql += `  trip_odo_end integer,\n`;
  sql += `  approval_history jsonb not null default '[]'::jsonb,\n`;
  sql += `  created_at timestamptz default now(),\n`;
  sql += `  updated_at timestamptz default now()\n`;
  sql += `);\n\n`;

  sql += `create table activity_logs (\n`;
  sql += `  id text primary key default uuid_generate_v4()::text,\n`;
  sql += `  type text not null,\n`;
  sql += `  description text not null,\n`;
  sql += `  user_id text,\n`;
  sql += `  user_name text,\n`;
  sql += `  related_request_id text references vehicle_requests(id) on delete cascade,\n`;
  sql += `  metadata jsonb,\n`;
  sql += `  created_at timestamptz default now()\n`;
  sql += `);\n\n`;

  // RLS Policies
  sql += `-- 3. ENABLE RLS & POLICIES\n`;
  sql += `alter table users enable row level security;\n`;
  sql += `alter table vehicles enable row level security;\n`;
  sql += `alter table drivers enable row level security;\n`;
  sql += `alter table departments enable row level security;\n`;
  sql += `alter table vehicle_requests enable row level security;\n`;
  sql += `alter table activity_logs enable row level security;\n\n`;

  sql += `create policy "Allow full access" on users for all using (true);\n`;
  sql += `create policy "Allow full access" on vehicles for all using (true);\n`;
  sql += `create policy "Allow full access" on drivers for all using (true);\n`;
  sql += `create policy "Allow full access" on departments for all using (true);\n`;
  sql += `create policy "Allow full access" on vehicle_requests for all using (true);\n`;
  sql += `create policy "Allow full access" on activity_logs for all using (true);\n\n`;

  // 4. INSERTS FROM CURRENT LOCAL DATA
  sql += `-- ========================================================\n`;
  sql += `-- 4. EXPORTED CURRENT DATA (${users.length} Users, ${vehicles.length} Vehicles, ${departments.length} Departments, ${drivers.length} Drivers)\n`;
  sql += `-- ========================================================\n\n`;

  // Insert Users
  if (users.length > 0) {
    sql += `-- INSERT USERS\n`;
    sql += `insert into users (id, username, password, name, role, department) values\n`;
    const userRows = users.map(u => 
      `  (${escapeSqlString(u.id)}, ${escapeSqlString(u.username)}, ${escapeSqlString(u.password)}, ${escapeSqlString(u.name)}, ${escapeSqlString(u.role)}, ${escapeSqlString(u.department)})`
    );
    sql += userRows.join(',\n') + `\non conflict (username) do update set name = excluded.name, role = excluded.role, department = excluded.department;\n\n`;
  }

  // Insert Vehicles
  if (vehicles.length > 0) {
    sql += `-- INSERT VEHICLES\n`;
    sql += `insert into vehicles (id, plate_number, model, seats, status, current_odo, notes) values\n`;
    const vehRows = vehicles.map(v => 
      `  (${escapeSqlString(v.id)}, ${escapeSqlString(v.plateNumber)}, ${escapeSqlString(v.model)}, ${v.seats || 4}, ${escapeSqlString(v.status)}, ${v.currentOdo || 0}, ${escapeSqlString(v.notes)})`
    );
    sql += vehRows.join(',\n') + `\non conflict (plate_number) do update set model = excluded.model, seats = excluded.seats, status = excluded.status, current_odo = excluded.current_odo;\n\n`;
  }

  // Insert Departments
  if (departments.length > 0) {
    sql += `-- INSERT DEPARTMENTS\n`;
    sql += `insert into departments (name) values\n`;
    const deptRows = departments.map(d => `  (${escapeSqlString(d)})`);
    sql += deptRows.join(',\n') + `\non conflict (name) do nothing;\n\n`;
  }

  // Insert Drivers
  if (drivers.length > 0) {
    sql += `-- INSERT DRIVERS\n`;
    sql += `insert into drivers (id, name, phone, license_class, status) values\n`;
    const driverRows = drivers.map(d => 
      `  (${escapeSqlString(d.id)}, ${escapeSqlString(d.name)}, ${escapeSqlString(d.phone)}, ${escapeSqlString(d.licenseClass || 'B2')}, ${escapeSqlString(d.status)})`
    );
    sql += driverRows.join(',\n') + `\non conflict (id) do update set name = excluded.name, phone = excluded.phone, status = excluded.status;\n\n`;
  }

  // Insert Vehicle Requests
  if (requests.length > 0) {
    sql += `-- INSERT VEHICLE REQUESTS\n`;
    sql += `insert into vehicle_requests (id, requester_name, requester_id, department, vehicle_count, personnel, start_date_time, end_date_time, pickup_location, destination, reason, status, assigned_vehicle_id, assigned_driver_id, trip_odo_start, trip_odo_end, approval_history) values\n`;
    const reqRows = requests.map(r => 
      `  (${escapeSqlString(r.id)}, ${escapeSqlString(r.requesterName)}, ${escapeSqlString(r.requesterId)}, ${escapeSqlString(r.department)}, ${r.vehicleCount || 1}, ${escapeJsonSql(r.personnel)}, ${escapeSqlString(r.startDateTime)}, ${escapeSqlString(r.endDateTime)}, ${escapeSqlString(r.pickupLocation)}, ${escapeSqlString(r.destination)}, ${escapeSqlString(r.reason)}, ${escapeSqlString(r.status)}, ${escapeSqlString(r.assignedVehicleId)}, ${escapeSqlString(r.assignedDriverId)}, ${r.tripOdoStart ?? 'NULL'}, ${r.tripOdoEnd ?? 'NULL'}, ${escapeJsonSql(r.approvalHistory)})`
    );
    sql += reqRows.join(',\n') + `;\n\n`;
  }

  return sql;
}

export async function syncAllCurrentDataDirectlyToSupabase(): Promise<{ success: boolean; count: number; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, count: 0, message: 'Chưa cấu hình Supabase URL & Anon Key trong .env' };
  }

  try {
    const users = getUsers();
    const vehicles = getVehicles();
    const departments = getDepartments();
    const drivers = getDrivers();
    const requests = getRequests();

    let count = 0;

    // 1. Sync Departments
    if (departments.length > 0) {
      const deptRows = departments.map(name => ({ name }));
      const { error } = await supabase.from('departments').upsert(deptRows, { onConflict: 'name' });
      if (!error) count += departments.length;
    }

    // 2. Sync Users
    for (const u of users) {
      await pushUserToSupabase(u);
      count++;
    }

    // 3. Sync Vehicles
    for (const v of vehicles) {
      await pushVehicleToSupabase(v);
      count++;
    }

    // 4. Sync Drivers
    for (const d of drivers) {
      await pushDriverToSupabase(d);
      count++;
    }

    // 5. Sync Requests
    for (const r of requests) {
      await pushRequestToSupabase(r);
      count++;
    }

    return {
      success: true,
      count,
      message: `Đã đồng bộ thành công ${users.length} người dùng, ${vehicles.length} xe, ${departments.length} phòng ban, ${drivers.length} tài xế lên Supabase!`
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: `Lỗi đồng bộ: ${err?.message || 'Không thể kết nối Supabase'}`
    };
  }
}
