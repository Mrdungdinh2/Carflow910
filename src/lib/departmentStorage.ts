'use client';

import { DEPARTMENTS } from './constants';
import { pushDepartmentToSupabase, deleteDepartmentFromSupabase, updateDepartmentInSupabase } from './supabaseStorage';

const DEPARTMENTS_KEY = 'carflow_departments';

/**
 * Seed departments ONLY if localStorage is completely empty.
 * Called lazily, not on module import.
 */
export function seedDepartmentsIfEmpty(): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(DEPARTMENTS_KEY);
  if (!raw || raw === '[]') {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(DEPARTMENTS));
  }
}

export function getDepartments(): string[] {
  if (typeof window === 'undefined') return Array.from(new Set(DEPARTMENTS));
  const raw = localStorage.getItem(DEPARTMENTS_KEY);
  if (raw) {
    try {
      const list: string[] = JSON.parse(raw);
      return Array.from(new Set(list));
    } catch {
      return Array.from(new Set(DEPARTMENTS));
    }
  }
  // If no localStorage data at all, seed and return
  seedDepartmentsIfEmpty();
  return Array.from(new Set(DEPARTMENTS));
}

export function addDepartment(name: string): void {
  if (typeof window === 'undefined') return;
  const deps = getDepartments();
  if (!deps.includes(name)) {
    deps.push(name);
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(deps));
    pushDepartmentToSupabase(name);
    window.dispatchEvent(new Event('carflow_data_changed'));
  }
}

export function updateDepartment(oldName: string, newName: string): void {
  if (typeof window === 'undefined') return;
  const deps = getDepartments();
  const index = deps.indexOf(oldName);
  if (index !== -1) {
    deps[index] = newName;
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(deps));
    updateDepartmentInSupabase(oldName, newName);
    window.dispatchEvent(new Event('carflow_data_changed'));
  }
}

export function deleteDepartment(name: string): void {
  if (typeof window === 'undefined') return;
  const deps = getDepartments();
  const filtered = deps.filter(d => d !== name);
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(filtered));
  deleteDepartmentFromSupabase(name);
  window.dispatchEvent(new Event('carflow_data_changed'));
}
