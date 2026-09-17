'use client';

import { User } from './types';
import { SEED_USERS } from './constants';
import { pushUserToSupabase, deleteUserFromSupabase } from './supabaseStorage';

const USERS_KEY = 'carflow_users';

/**
 * Seed users ONLY if localStorage is completely empty AND no Supabase data exists.
 * This is called lazily, not on module import.
 */
export function seedUsersIfEmpty(): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw || raw === '[]') {
    // Only seed if truly empty - Supabase sync will overwrite this shortly
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  }
}

export function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as User[];
    } catch {
      return [];
    }
  }
  // No localStorage data — Supabase sync will populate shortly
  return [];
}

export function getUserById(id: string): User | null {
  return getUsers().find(u => u.id === id || u.username === id) || null;
}

export function saveUser(user: User): void {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  
  // Ensure user has an ID
  if (!user.id) {
    user.id = 'usr_' + Date.now();
  }

  const index = users.findIndex(u => u.id === user.id || u.username === user.username);
  if (index !== -1) {
    users[index] = { ...users[index], ...user };
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  pushUserToSupabase(users[index !== -1 ? index : users.length - 1]);
  window.dispatchEvent(new Event('carflow_data_changed'));
}

export function deleteUser(idOrUsername: string): void {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  const target = users.find(u => u.id === idOrUsername || u.username === idOrUsername);
  const filtered = users.filter(u => u.id !== idOrUsername && u.username !== idOrUsername);
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
  if (target) deleteUserFromSupabase(target.id);
  window.dispatchEvent(new Event('carflow_data_changed'));
}
