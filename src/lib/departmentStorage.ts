'use client';

import { DEPARTMENTS } from './constants';

const DEPARTMENTS_KEY = 'carflow_departments';

export function seedDepartments(): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(DEPARTMENTS_KEY);
  if (!raw || JSON.parse(raw).length === 0) {
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
  return Array.from(new Set(DEPARTMENTS));
}

export function addDepartment(name: string): void {
  if (typeof window === 'undefined') return;
  const deps = getDepartments();
  if (!deps.includes(name)) {
    deps.push(name);
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(deps));
  }
}

export function updateDepartment(oldName: string, newName: string): void {
  if (typeof window === 'undefined') return;
  const deps = getDepartments();
  const index = deps.indexOf(oldName);
  if (index !== -1) {
    deps[index] = newName;
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(deps));
  }
}

export function deleteDepartment(name: string): void {
  if (typeof window === 'undefined') return;
  const deps = getDepartments();
  const filtered = deps.filter(d => d !== name);
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(filtered));
}

if (typeof window !== 'undefined') {
  seedDepartments();
}
