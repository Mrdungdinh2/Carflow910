'use client';

import { User } from '@/lib/types';
import { getUsers } from '@/lib/userStorage';

const AUTH_KEY = 'carflow_user';

export const login = (username: string, password: string): User | null => {
  const user = getUsers().find((u: User) => u.username === username && u.password === password);
  if (user) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }
    return user;
  }
  return null;
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_KEY);
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
};

export const hasPermission = (role: string, action: string): boolean => {
  switch (role) {
    case 'admin':
      return true;
    case 'staff':
      return ['create_request', 'edit_own_request', 'view_own_requests'].includes(action);
    case 'dept_head':
      return ['approve_pending', 'view_dept_requests'].includes(action);
    case 'tcth':
      return ['approve_dept_approved', 'assign_vehicle', 'assign_driver', 'view_all_requests'].includes(action);
    case 'director':
      return ['approve_tcth_approved', 'view_all_requests'].includes(action);
    case 'driver':
      return ['view_assigned', 'accept_trip', 'complete_trip'].includes(action);
    default:
      return false;
  }
};
