import { useState, useEffect, useCallback } from 'react';

export interface UseInactivityOptions {
  timeoutMs?: number;
  events?: string[];
}

export const useInactivity = (options: UseInactivityOptions = {}) => {
  const {
    timeoutMs = 5000, // 5 seconds default
    events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
  } = options;

  const [isActive, setIsActive] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetInactivity = useCallback(() => {
    setIsActive(true);
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleActivity = () => {
      resetInactivity();
      
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set new timeout for inactivity
      timeoutId = setTimeout(() => {
        setIsActive(false);
      }, timeoutMs);
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timeout
    timeoutId = setTimeout(() => {
      setIsActive(false);
    }, timeoutMs);

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMs, events, resetInactivity]);

  return {
    isActive,
    lastActivity,
    resetInactivity
  };
};
