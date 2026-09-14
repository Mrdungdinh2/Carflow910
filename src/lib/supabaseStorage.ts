'use client';

import { supabase, isSupabaseConfigured } from './supabase';
import type { VehicleRequest, Vehicle, Driver, User, ActivityLog } from './types';

// Storage keys
const REQUESTS_KEY = 'carflow_requests';
const VEHICLES_KEY = 'carflow_vehicles';
const DRIVERS_KEY = 'carflow_drivers';
const USERS_KEY = 'carflow_users';
const ACTIVITY_KEY = 'carflow_activity';

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
    personnel: JSON.stringify(req.personnel || []),
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
    approval_history: JSON.stringify(req.approvalHistory || []),
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

// ===== REALTIME & SYNC ENGINE =====

export async function fetchAndSyncAllFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    // 1. Fetch Users
    const { data: usersData } = await supabase.from('users').select('*');
    if (usersData) {
      const users = usersData.map(mapUserFromDb);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // 2. Fetch Vehicles
    const { data: vehiclesData } = await supabase.from('vehicles').select('*');
    if (vehiclesData) {
      const vehicles = vehiclesData.map(mapVehicleFromDb);
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
    }

    // 3. Fetch Drivers
    const { data: driversData } = await supabase.from('drivers').select('*');
    if (driversData) {
      const drivers = driversData.map(mapDriverFromDb);
      localStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers));
    }

    // 4. Fetch Vehicle Requests
    const { data: requestsData } = await supabase.from('vehicle_requests').select('*');
    if (requestsData) {
      const requests = requestsData.map(mapRequestFromDb);
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    }

    // Dispatch custom event for UI re-render
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('carflow_data_changed'));
    }

    return true;
  } catch (err) {
    console.warn('Supabase sync error:', err);
    return false;
  }
}

// Write-through to Supabase
export async function pushRequestToSupabase(req: VehicleRequest): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const payload = mapRequestToDb(req);
    await supabase.from('vehicle_requests').upsert(payload);
  } catch (err) {
    console.error('Error pushing request to Supabase:', err);
  }
}

export async function pushVehicleToSupabase(v: Vehicle): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('vehicles').upsert(mapVehicleToDb(v));
  } catch (err) {
    console.error('Error pushing vehicle to Supabase:', err);
  }
}

export async function pushDriverToSupabase(d: Driver): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('drivers').upsert(mapDriverToDb(d));
  } catch (err) {
    console.error('Error pushing driver to Supabase:', err);
  }
}

export async function pushUserToSupabase(u: User): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('users').upsert(mapUserToDb(u));
  } catch (err) {
    console.error('Error pushing user to Supabase:', err);
  }
}

export async function deleteRequestFromSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('vehicle_requests').delete().eq('id', id);
  } catch (err) {
    console.error('Error deleting request from Supabase:', err);
  }
}
