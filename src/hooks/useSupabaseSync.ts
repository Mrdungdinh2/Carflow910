'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook that forces component re-render whenever Supabase sync occurs.
 * 
 * HOW IT WORKS:
 * 1. ClientProviders receives Supabase realtime events
 * 2. fetchAndSyncAllFromSupabase() updates localStorage AND dispatches 'carflow_data_changed'
 * 3. This hook listens for that event and increments a version counter
 * 4. The version counter change triggers React re-render
 * 5. The refreshFn callback re-reads from localStorage, getting fresh data
 * 
 * Usage:
 *   const { syncVersion } = useSupabaseSync(() => {
 *     setMyData(getDataFromLocalStorage());
 *   });
 */
export function useSupabaseSync(refreshFn?: () => void) {
  const [syncVersion, setSyncVersion] = useState(0);
  const refreshFnRef = useRef(refreshFn);
  refreshFnRef.current = refreshFn;

  useEffect(() => {
    // Listen for Supabase sync events
    const handleDataChanged = () => {
      setSyncVersion(v => v + 1);
      if (refreshFnRef.current) {
        refreshFnRef.current();
      }
    };

    // Listen for localStorage changes from other tabs (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('carflow_')) {
        setSyncVersion(v => v + 1);
        if (refreshFnRef.current) {
          refreshFnRef.current();
        }
      }
    };

    window.addEventListener('carflow_data_changed', handleDataChanged);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('carflow_data_changed', handleDataChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const forceRefresh = useCallback(() => {
    setSyncVersion(v => v + 1);
    if (refreshFnRef.current) {
      refreshFnRef.current();
    }
  }, []);

  return { syncVersion, forceRefresh };
}
