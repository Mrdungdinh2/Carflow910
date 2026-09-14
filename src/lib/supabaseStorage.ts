'use client';

import { supabase, isSupabaseConfigured } from './supabase';
import type { VehicleRequest, Vehicle, Driver, User, ActivityLog } from './types';

// Storage keys
const REQUESTS_KEY = 'carflow_requests';
const VEHICLES_KEY = 'carflow_vehicles';
const DRIVERS_KEY = 'carflow_drivers';
const USERS_KEY = 'carflow_users';
const ACTIVITY_KEY = 'carflow_activity';
const DEPARTMENTS_KEY = 'carflow_departments';

// Mapping helper functions between Supabase snake_case and Frontend camelCase
export function mapRequestFromDb(db: any): VehicleRequest {
  return {
    id: db.id,
    requesterName: db.requester_name || '',
    requesterId: db.requester_id || '',
    department: db.department || '',
    vehicleCount: db.vehicle_count || 1,
    personnel: Array.isArray(db.personnel) ? db.personnel : JSON.parse(db.personnel || '[]'),
    startDateTime: db.start_date_time || '',
    endDateTime: db.end_date_time || '',
    pickupLocation: db.pickup_location || '',
    destination: db.destination || '',
    reason: db.reason || '',
    status: db.status || 'draft',
    createdAt: db.created_at || new Date().toISOString(),
    updatedAt: db.updated_at || new Date().toISOString(),
    assignedVehicleId: db.assigned_vehicle_id || undefined,
    assignedDriverId: db.assigned_driver_id || undefined,
    tripOdoStart: db.trip_odo_start ?? undefined,
    tripOdoEnd: db.trip_odo_end ?? undefined,
    approvalHistory: Array.isArray(db.approval_history) ? db.approval_history : JSON.parse(db.approval_history || '[]'),
  };
}

export function mapRequestToDb(req: Partial<VehicleRequest>): any {
  return {
    id: req.id,
    requester_name: req.requesterName,
    requester_id: req.requesterId || null,
    department: req.department,
    vehicle_count: req.vehicleCount || 1,
    personnel: req.personnel || [],
    start_date_time: req.startDateTime,
    end_date_time: req.endDateTime,
    pickup_location: req.pickupLocation,
    destination: req.destination,
    reason: req.reason,
    status: req.status || 'draft',
    assigned_vehicle_id: req.assignedVehicleId || null,
    assigned_driver_id: req.assignedDriverId || null,
    trip_odo_start: req.tripOdoStart ?? null,
    trip_odo_end: req.tripOdoEnd ?? null,
    approval_history: req.approvalHistory || [],
    updated_at: new Date().toISOString(),
  };
}

export function mapVehicleFromDb(db: any): Vehicle {
  return {
    id: db.id,
    plateNumber: db.plate_number,
    model: db.model,
    seats: db.seats,
    status: db.status,
    currentOdo: db.current_odo,
    notes: db.notes || undefined,
  };
}

export function mapVehicleToDb(v: Vehicle): any {
  return {
    id: v.id,
    plate_number: v.plateNumber,
    model: v.model,
    seats: v.seats,
    status: v.status,
    current_odo: v.currentOdo,
    notes: v.notes || null,
  };
}

export function mapDriverFromDb(db: any): Driver {
  return {
    id: db.id,
    name: db.name,
    phone: db.phone,
    licenseClass: db.license_class || 'B2',
    status: db.status,
  };
}

export function mapDriverToDb(d: Driver): any {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    license_class: d.licenseClass || 'B2',
    status: d.status,
  };
}

export function mapUserFromDb(db: any): User {
  return {
    id: db.id,
    username: db.username,
    password: db.password,
    name: db.name,
    role: db.role,
    department: db.department,
  };
}

export function mapUserToDb(u: User): any {
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    name: u.name,
    role: u.role,
    department: u.department,
  };
}

export async function fetchAndSyncAllFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[CarFlow Sync] Supabase not configured, skipping sync');
    return false;
  }

  try {
    let hasChanges = false;

    // 1. Fetch Users - ALWAYS overwrite localStorage with Supabase data
    const { data: usersData, error: usersError } = await supabase.from('users').select('*').order('username');
    if (usersError) {
      console.error('[CarFlow Sync] Error fetching users:', usersError.message);
    } else if (usersData && usersData.length > 0) {
      const users = usersData.map(mapUserFromDb);
      const incoming = JSON.stringify(users);
      const current = localStorage.getItem(USERS_KEY);
      if (current !== incoming) {
        hasChanges = true;
      }
      // ALWAYS write - Supabase is the source of truth
      localStorage.setItem(USERS_KEY, incoming);
    }

    // 2. Fetch Vehicles
    const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*').order('plate_number');
    if (vehiclesError) {
      console.error('[CarFlow Sync] Error fetching vehicles:', vehiclesError.message);
    } else if (vehiclesData && vehiclesData.length > 0) {
      const vehicles = vehiclesData.map(mapVehicleFromDb);
      const incoming = JSON.stringify(vehicles);
      const current = localStorage.getItem(VEHICLES_KEY);
      if (current !== incoming) {
        hasChanges = true;
      }
      localStorage.setItem(VEHICLES_KEY, incoming);
    }

    // 3. Fetch Drivers
    const { data: driversData, error: driversError } = await supabase.from('drivers').select('*').order('name');
    if (driversError) {
      console.error('[CarFlow Sync] Error fetching drivers:', driversError.message);
    } else if (driversData) {
      const drivers = driversData.map(mapDriverFromDb);
      const incoming = JSON.stringify(drivers);
      const current = localStorage.getItem(DRIVERS_KEY);
      if (current !== incoming) {
        hasChanges = true;
      }
      localStorage.setItem(DRIVERS_KEY, incoming);
    }

    // 4. Fetch Vehicle Requests
    const { data: requestsData, error: requestsError } = await supabase.from('vehicle_requests').select('*').order('created_at', { ascending: false });
    if (requestsError) {
      console.error('[CarFlow Sync] Error fetching requests:', requestsError.message);
    } else if (requestsData) {
      const requests = requestsData.map(mapRequestFromDb);
      const incoming = JSON.stringify(requests);
      const current = localStorage.getItem(REQUESTS_KEY);
      if (current !== incoming) {
        hasChanges = true;
      }
      localStorage.setItem(REQUESTS_KEY, incoming);
    }

    // 5. Fetch Departments
    const { data: deptsData, error: deptsError } = await supabase.from('departments').select('*').order('name');
    if (deptsError) {
      console.error('[CarFlow Sync] Error fetching departments:', deptsError.message);
    } else if (deptsData) {
      const deptNames = deptsData.map((d: any) => d.name);
      const incoming = JSON.stringify(deptNames);
      const current = localStorage.getItem(DEPARTMENTS_KEY);
      if (current !== incoming) {
        hasChanges = true;
      }
      localStorage.setItem(DEPARTMENTS_KEY, incoming);
    }

    // Dispatch custom event for UI re-render if data changed
    if (hasChanges && typeof window !== 'undefined') {
      console.log('[CarFlow Sync] Data changed from Supabase, dispatching carflow_data_changed event');
      window.dispatchEvent(new Event('carflow_data_changed'));
    }

    return true;
  } catch (err) {
    console.error('[CarFlow Sync] Critical sync error:', err);
    return false;
  }
}

// Write-through to Supabase
export async function pushRequestToSupabase(req: VehicleRequest): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const payload = mapRequestToDb(req);
    const { error } = await supabase.from('vehicle_requests').upsert(payload);
    if (error) console.error('[CarFlow Push] Request upsert error:', error.message, error.details);
  } catch (err) {
    console.error('[CarFlow Push] Request exception:', err);
  }
}

export async function pushVehicleToSupabase(v: Vehicle): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('vehicles').upsert(mapVehicleToDb(v), { onConflict: 'plate_number' });
    if (error) console.error('[CarFlow Push] Vehicle upsert error:', error.message, error.details);
  } catch (err) {
    console.error('[CarFlow Push] Vehicle exception:', err);
  }
}

export async function pushDriverToSupabase(d: Driver): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('drivers').upsert(mapDriverToDb(d));
    if (error) console.error('[CarFlow Push] Driver upsert error:', error.message, error.details);
  } catch (err) {
    console.error('[CarFlow Push] Driver exception:', err);
  }
}

export async function pushUserToSupabase(u: User): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const payload = mapUserToDb(u);
    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'username' });
    if (error) console.error('[CarFlow Push] User upsert error:', error.message, error.details);
  } catch (err) {
    console.error('[CarFlow Push] User exception:', err);
  }
}

export async function deleteRequestFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('vehicle_requests').delete().eq('id', id);
    if (error) console.error('[CarFlow Delete] Request delete error:', error.message);
  } catch (err) {
    console.error('Error deleting request from Supabase:', err);
  }
}

export async function deleteVehicleFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) console.error('[CarFlow Delete] Vehicle delete error:', error.message);
  } catch (err) {
    console.error('Error deleting vehicle from Supabase:', err);
  }
}

export async function deleteDriverFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) console.error('[CarFlow Delete] Driver delete error:', error.message);
  } catch (err) {
    console.error('Error deleting driver from Supabase:', err);
  }
}

export async function deleteUserFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error('[CarFlow Delete] User delete error:', error.message);
  } catch (err) {
    console.error('Error deleting user from Supabase:', err);
  }
}

export async function pushDepartmentToSupabase(name: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('departments').upsert({ name }, { onConflict: 'name' });
    if (error) console.error('[CarFlow Push] Department upsert error:', error.message);
  } catch (err) {
    console.error('Error pushing department to Supabase:', err);
  }
}

export async function deleteDepartmentFromSupabase(name: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('departments').delete().eq('name', name);
    if (error) console.error('[CarFlow Delete] Department delete error:', error.message);
  } catch (err) {
    console.error('Error deleting department from Supabase:', err);
  }
}

export async function updateDepartmentInSupabase(oldName: string, newName: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error, count } = await supabase.from('departments').update({ name: newName }).eq('name', oldName);
    if (error) {
      console.error('[CarFlow Push] Department update error:', error.message);
    }
    // If update affected 0 rows (e.g., oldName wasn't in Supabase yet), upsert the new department name
    if (!error && (count === 0 || count === null)) {
      await supabase.from('departments').upsert({ name: newName }, { onConflict: 'name' });
    }
  } catch (err) {
    console.error('Error updating department in Supabase:', err);
  }
}

export async function pushActivityLogToSupabase(log: ActivityLog & { timestamp: string }): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('activity_logs').upsert({
      id: log.id,
      type: log.type,
      description: log.description,
      user_id: log.userId || null,
      user_name: log.userName || null,
      related_request_id: log.relatedRequestId || null,
      metadata: log.metadata ? JSON.stringify(log.metadata) : null,
      created_at: log.timestamp,
    });
    if (error) console.error('[CarFlow Push] Activity log upsert error:', error.message);
  } catch (err) {
    console.error('Error pushing activity log to Supabase:', err);
  }
}

