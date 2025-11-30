import { useState, useEffect } from 'react';
import { useNetworkState } from 'react-use';

const LAST_SYNC_KEY = 'lastSuccessfulSync';

/**
 * Hook to track the last successful sync time with Firebase
 */
export const useLastSync = () => {
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    return stored ? new Date(stored) : new Date();
  });

  const networkState = useNetworkState();
  const isOnline = networkState.online ?? true;

  // Update sync time when coming back online
  useEffect(() => {
    if (isOnline) {
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
    }
  }, [isOnline]);

  // Update sync time when data changes (called manually)
  const updateSyncTime = () => {
    if (isOnline) {
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
    }
  };

  return {
    lastSyncTime,
    isOnline,
    updateSyncTime,
  };
};
