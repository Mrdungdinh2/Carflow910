'use client';

import type { Vehicle, Driver, VehicleStatus, DriverStatus, FleetStats, ActivityLog } from './types';
import { SEED_VEHICLES, SEED_DRIVERS, SEED_USERS } from './constants';
import { pushVehicleToSupabase, pushDriverToSupabase, deleteVehicleFromSupabase, deleteDriverFromSupabase, pushActivityLogToSupabase } from './supabaseStorage';

const VEHICLES_KEY = 'carflow_vehicles';
const DRIVERS_KEY = 'carflow_drivers';
const ACTIVITY_KEY = 'carflow_activity';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ===== VEHICLES =====

function seedVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(VEHICLES_KEY);
  if (raw) return JSON.parse(raw);
  // No localStorage data — Supabase sync will populate shortly
  return [];
}

export function getVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return [];
  return seedVehicles();
}

export function getVehicleById(id: string): Vehicle | null {
  return getVehicles().find(v => v.id === id) || null;
}

export function updateVehicleStatus(id: string, status: VehicleStatus): void {
  if (typeof window === 'undefined') return;
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === id);
  if (index === -1) return;
  vehicles[index].status = status;
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  pushVehicleToSupabase(vehicles[index]);
  window.dispatchEvent(new Event('carflow_data_changed'));
}

export function updateVehicleOdo(id: string, odo: number): void {
  if (typeof window === 'undefined') return;
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === id);
  if (index === -1) return;
  vehicles[index].currentOdo = odo;
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  pushVehicleToSupabase(vehicles[index]);
  window.dispatchEvent(new Event('carflow_data_changed'));
}

export function updateDriverStatus(id: string, status: DriverStatus): void {
  if (typeof window === 'undefined') return;
  const drivers = getDrivers();
  const index = drivers.findIndex(d => d.id === id);
  if (index === -1) return;
  drivers[index].status = status;
  localStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers));
  pushDriverToSupabase(drivers[index]);
  window.dispatchEvent(new Event('carflow_data_changed'));
}

export function saveVehicle(vehicle: Vehicle): void {
  if (typeof window === 'undefined') return;
  const vehicles = getVehicles();
  if (!vehicle.id) {
    vehicle.id = 'veh_' + Date.now();
  }
  const index = vehicles.findIndex(v => v.id === vehicle.id || v.plateNumber === vehicle.plateNumber);
  if (index !== -1) {
    vehicles[index] = { ...vehicles[index], ...vehicle };
  } else {
    vehicles.push(vehicle);
  }
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  pushVehicleToSupabase(vehicles[index !== -1 ? index : vehicles.length - 1]);
  window.dispatchEvent(new Event('carflow_data_changed'));
}

export function deleteVehicle(idOrPlate: string): void {
  if (typeof window === 'undefined') return;
  const vehicles = getVehicles();
  const target = vehicles.find(v => v.id === idOrPlate || v.plateNumber === idOrPlate);
  const filtered = vehicles.filter(v => v.id !== idOrPlate && v.plateNumber !== idOrPlate);
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(filtered));
  if (target) deleteVehicleFromSupabase(target.id);
  window.dispatchEvent(new Event('carflow_data_changed'));
}

// ===== DRIVERS =====
const DEMO_DRIVER_NAMES = ['Nguyễn Văn Tâm', 'Trần Minh Đức', 'Lê Hoàng Phúc', 'Phạm Quốc Bảo'];
const DEMO_DRIVER_IDS = ['d1', 'd2', 'd3', 'd4'];

function isDemoDriver(d: { id: string; name?: string }): boolean {
  if (DEMO_DRIVER_IDS.includes(d.id)) return true;
  if (d.name && DEMO_DRIVER_NAMES.includes(d.name)) return true;
  return false;
}

function getDriverUsers(): { id: string; name: string; username: string; role: string; phone?: string; licenseClass?: string }[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('carflow_users');
  if (!raw) return [];
  try {
    const users: any[] = JSON.parse(raw);
    return users.filter(u => u.role === 'driver' && !DEMO_DRIVER_NAMES.includes(u.name));
  } catch {
    return [];
  }
}

function seedDrivers(): Driver[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(DRIVERS_KEY);
  if (raw) {
    const parsed: Driver[] = JSON.parse(raw);
    // Filter out old demo drivers d1, d2, d3, d4 and demo names
    const cleaned = parsed.filter(d => !isDemoDriver(d));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(DRIVERS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  }
  localStorage.setItem(DRIVERS_KEY, JSON.stringify([]));
  return [];
}

export function getDrivers(): Driver[] {
  if (typeof window === 'undefined') return [];
  const drivers: Driver[] = seedDrivers();
  const driverUsers = getDriverUsers();

  if (driverUsers.length > 0) {
    let updated = false;
    const validIds = new Set(driverUsers.map(u => u.id));
    const validUsernames = new Set(driverUsers.map(u => u.username));

    // Ensure each user with role === 'driver' is in drivers list
    for (const u of driverUsers) {
      if (isDemoDriver(u)) continue;
      const existingIndex = drivers.findIndex(d => d.id === u.id || d.id === u.username || d.name === u.name);
      if (existingIndex !== -1) {
        // Sync name & id if changed in Admin Users
        if (drivers[existingIndex].name !== u.name || drivers[existingIndex].id !== u.id) {
          drivers[existingIndex].id = u.id;
          drivers[existingIndex].name = u.name;
          updated = true;
        }
      } else {
        // Create new driver entry synced from user account
        drivers.push({
          id: u.id,
          name: u.name,
          phone: u.phone || '0901234567',
          licenseClass: u.licenseClass || 'B2',
          status: 'available',
        });
        updated = true;
      }
    }

    // Filter out driver entries whose user account was deleted or old demo IDs/names
    const syncedDrivers = drivers.filter(d => 
      !isDemoDriver(d) && (validIds.has(d.id) || validUsernames.has(d.id))
    );

    if (syncedDrivers.length !== drivers.length) {
      updated = true;
    }

    if (updated && typeof window !== 'undefined') {
      localStorage.setItem(DRIVERS_KEY, JSON.stringify(syncedDrivers));
    }
    return syncedDrivers;
  }

  return drivers.filter(d => !isDemoDriver(d));
}


export function getDriverById(id: string): Driver | null {
  return getDrivers().find(d => d.id === id) || null;
}

export function saveDriver(driver: Driver): void {
  if (typeof window === 'undefined') return;
  const drivers = getDrivers();
  const index = drivers.findIndex(d => d.id === driver.id);
  if (index !== -1) {
    drivers[index] = driver;
  } else {
    drivers.push(driver);
  }
  localStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers));
  pushDriverToSupabase(driver);
}

export function deleteDriver(id: string): void {
  if (typeof window === 'undefined') return;
  const drivers = getDrivers();
  const filtered = drivers.filter(d => d.id !== id);
  localStorage.setItem(DRIVERS_KEY, JSON.stringify(filtered));
  deleteDriverFromSupabase(id);
}

// ===== FLEET STATS =====

export function getFleetStats(): FleetStats {
  const vehicles = getVehicles();
  const drivers = getDrivers();
  return {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter(v => v.status === 'available').length,
    inUseVehicles: vehicles.filter(v => v.status === 'in_use').length,
    maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
    totalDrivers: drivers.length,
    availableDrivers: drivers.filter(d => d.status === 'available').length,
  };
}

// ===== ACTIVITY LOG =====

export function addActivityLog(entry: Omit<ActivityLog, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  const logs = getActivityLogs(500);
  const log: ActivityLog = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  logs.unshift(log);
  // Keep max 500
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(logs.slice(0, 500)));
  pushActivityLogToSupabase(log);
}

export function getActivityLogs(limit: number = 20): ActivityLog[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(ACTIVITY_KEY);
  if (!raw) return [];
  try {
    const logs: ActivityLog[] = JSON.parse(raw);
    return logs.slice(0, limit);
  } catch { return []; }
}
