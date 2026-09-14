'use client';

import { User } from './types';
import { SEED_USERS } from './constants';
import { pushUserToSupabase } from './supabaseStorage';

const USERS_KEY = 'carflow_users';

const DEMO_DRIVER_NAMES = ['Nguyễn Văn Tâm', 'Trần Minh Đức', 'Lê Hoàng Phúc', 'Phạm Quốc Bảo'];

export function seedUsers(): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw || JSON.parse(raw).length === 0) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  } else {
    // Clean out demo drivers from existing storage
    try {
      const parsed: User[] = JSON.parse(raw);
      const cleaned = parsed.filter(u => !DEMO_DRIVER_NAMES.includes(u.name));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
      }
    } catch {}
  }
}

export function getUsers(): User[] {
  if (typeof window === 'undefined') return SEED_USERS;
  const raw = localStorage.getItem(USERS_KEY);
  if (raw) {
    try {
      const parsed: User[] = JSON.parse(raw);
      return parsed.filter(u => !DEMO_DRIVER_NAMES.includes(u.name));
    } catch {
      return SEED_USERS;
    }
  }
  return SEED_USERS;
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
    // Preserve existing password if new password is empty
    if (!user.password && users[index].password) {
      user.password = users[index].password;
    }
    users[index] = { ...users[index], ...user };
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  pushUserToSupabase(users[index !== -1 ? index : users.length - 1]);
}

export function deleteUser(idOrUsername: string): void {
  if (typeof window === 'undefined') return;
  const users = getUsers();
  const filtered = users.filter(u => u.id !== idOrUsername && u.username !== idOrUsername);
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
}

if (typeof window !== 'undefined') {
  seedUsers();
}
