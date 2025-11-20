import { useState, useEffect } from 'react';
import { onOnlineStatusChange } from '../utils/offlineStorage';

const LAST_SYNC_KEY = 'lastSuccessfulSync';

/**
 * Hook to track the last successful sync time with Firebase
 */
export const useLastSync = () => {
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    return stored ? new Date(stored) : new Date();
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen to online status changes
  useEffect(() => {
    const unsubscribe = onOnlineStatusChange((online) => {
      setIsOnline(online);

      // When we come back online, update the last sync time
      if (online) {
        const now = new Date();
        setLastSyncTime(now);
        localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      }
    });

    return unsubscribe;
  }, []);

  // Update sync time when data changes (called manually)
  const updateSyncTime = () => {
    if (navigator.onLine) {
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
