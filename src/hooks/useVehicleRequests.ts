'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRequests, deleteRequest as deleteReq } from '@/lib/storage';
import type { VehicleRequest, DashboardStats } from '@/lib/types';

export function useVehicleRequests() {
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 });

  const refresh = useCallback(() => {
    const allRequests = getRequests();
    setRequests(allRequests);
    setStats({
      total: allRequests.length,
      pending: allRequests.filter(r => ['pending', 'dept_approved'].includes(r.status)).length,
      approved: allRequests.filter(r => ['tcth_approved', 'driver_accepted', 'completed'].includes(r.status)).length,
      rejected: allRequests.filter(r => r.status === 'rejected').length,
      completed: allRequests.filter(r => r.status === 'completed').length,
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteRequest = useCallback((id: string) => {
    deleteReq(id);
    refresh();
  }, [refresh]);

  return { requests, stats, refresh, deleteRequest };
}
