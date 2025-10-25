import { useEffect, useRef, useState } from 'react';

interface RefreshOptions {
  interval: number; // Base interval in milliseconds
  smartRefresh?: boolean; // Enable smart refresh at logical boundaries
  activityDetection?: boolean; // Pause refreshes when user is active
  memoryCheck?: boolean; // Check memory usage
  onRefresh?: () => void; // Custom refresh callback
  onMemoryWarning?: () => void; // Callback for high memory usage
}

interface UseAutoRefreshReturn {
  lastRefresh: Date;
  isRefreshing: boolean;
  forceRefresh: () => void;
}

export const useAutoRefresh = (options: RefreshOptions): UseAutoRefreshReturn => {
  const {
    interval,
    smartRefresh = true,
    activityDetection = true,
    memoryCheck = false,
    onRefresh,
    onMemoryWarning,
  } = options;

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastActivityTime = useRef(Date.now());
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);
  const memoryCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef(options);
  const isMounted = useRef(true);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  });

  // Check for user activity
  useEffect(() => {
    if (!activityDetection) return;

    const handleActivity = () => {
      lastActivityTime.current = Date.now();
    };

    // Listen for various user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [activityDetection]);

  // Memory check interval
  useEffect(() => {
    if (!memoryCheck) return;

    const checkMemory = () => {
      if (window.performance && (window.performance as any).memory) {
        const memoryInfo = (window.performance as any).memory;
        const usedHeapSize = memoryInfo.usedJSHeapSize;
        const heapSizeLimit = memoryInfo.jsHeapSizeLimit;
        const usagePercent = (usedHeapSize / heapSizeLimit) * 100;

        if (usagePercent > 90) {
          console.warn(`High memory usage: ${usagePercent.toFixed(2)}%`);
          onMemoryWarning?.();
        }
      }
    };

    memoryCheckInterval.current = setInterval(checkMemory, 30 * 60 * 1000); // Every 30 minutes

    return () => {
      if (memoryCheckInterval.current) {
        clearInterval(memoryCheckInterval.current);
      }
    };
  }, [memoryCheck, onMemoryWarning]);

  // Calculate next refresh time with smart boundaries
  const calculateNextRefresh = (now: Date): number => {
    const currentOptions = optionsRef.current;
    if (!currentOptions.smartRefresh) {
      return currentOptions.interval;
    }

    // For zmanim-like data, refresh at minute boundaries
    const seconds = now.getSeconds();
    const millisecondsToNextMinute = (60 - seconds) * 1000;

    // For time-sensitive data, ensure refresh happens at logical boundaries
    if (currentOptions.interval < 5 * 60 * 1000) { // If interval is less than 5 minutes
      return millisecondsToNextMinute;
    }

    return currentOptions.interval;
  };

  // Check if user has been inactive
  const isUserInactive = (): boolean => {
    const currentOptions = optionsRef.current;
    if (!currentOptions.activityDetection) return false;
    const inactiveTime = Date.now() - lastActivityTime.current;
    return inactiveTime > 5 * 60 * 1000; // Consider inactive after 5 minutes
  };

  // Perform refresh
  const performRefresh = () => {
    if (isRefreshing || !isMounted.current) return;

    setIsRefreshing(true);
    setLastRefresh(new Date());
    
    // Call the refresh callback
    if (optionsRef.current.onRefresh) {
      try {
        optionsRef.current.onRefresh();
      } catch (error) {
        console.error('Error in onRefresh callback:', error);
      }
    }
    
    // Small delay to prevent rapid successive refreshes
    setTimeout(() => {
      if (isMounted.current) {
        setIsRefreshing(false);
        scheduleNextRefresh();
      }
    }, 100);
  };

  // Schedule next refresh
  const scheduleNextRefresh = () => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }

    const now = new Date();
    const nextRefreshDelay = calculateNextRefresh(now);
    
    refreshTimeout.current = setTimeout(() => {
      if (isMounted.current) {
        // Only refresh if user is inactive or it's critical
        if (!optionsRef.current.activityDetection || isUserInactive()) {
          performRefresh();
        } else {
          // User is active, reschedule
          scheduleNextRefresh();
        }
      }
    }, nextRefreshDelay);
  };

  // Force refresh
  const forceRefresh = () => {
    performRefresh();
  };

  // Initialize and cleanup
  useEffect(() => {
    if (isMounted.current) {
      scheduleNextRefresh();
    }

    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
      if (memoryCheckInterval.current) {
        clearInterval(memoryCheckInterval.current);
      }
    };
  }, []); // Empty dependency array to prevent re-runs

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
      if (memoryCheckInterval.current) {
        clearInterval(memoryCheckInterval.current);
      }
    };
  }, []);

  return {
    lastRefresh,
    isRefreshing,
    forceRefresh,
  };
};
