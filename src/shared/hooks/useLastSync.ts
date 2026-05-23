import { useState, useCallback } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { getLastTrustedTime, recordTrustedCurrentTime } from '../utils/timeProvider';

const LAST_SYNC_KEY = 'lastSuccessfulSync';

/**
 * Hook to track the last successful sync time with Firebase.
 * Sync time is only updated when updateSyncTime() is called explicitly
 * (i.e. when data actually arrives from the server), not on browser online events.
 */
export const useLastSync = () => {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) {
      return new Date(stored);
    }

    return getLastTrustedTime();
  });

  const { isOnline } = useNetwork();

  // Called by data hooks when they receive fresh data from Firestore
  const updateSyncTime = useCallback(() => {
    const now = recordTrustedCurrentTime();
    setLastSyncTime(now);
    try {
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
    } catch (e) {
      console.error('Failed to save sync time to localStorage', e);
    }
  }, []);

  return {
    lastSyncTime,
    isOnline,
    updateSyncTime,
  };
};
