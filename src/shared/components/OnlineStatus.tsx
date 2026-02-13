import React, { useState, useEffect, useRef } from 'react';
import { useNetworkState } from 'react-use';

/**
 * Component that shows online/offline status.
 * Shows a persistent banner when offline, and a brief "connected" toast when coming back online.
 */
const OnlineStatus: React.FC = () => {
  const networkState = useNetworkState();
  const isOnline = networkState.online ?? true;
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setShowOnlineToast(false);
    } else if (wasOffline.current) {
      // Just came back online — show brief toast
      wasOffline.current = false;
      setShowOnlineToast(true);
      const timer = setTimeout(() => {
        setShowOnlineToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Offline banner
  if (!isOnline) {
    return (
      <div
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg bg-red-600 text-white transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01"></path>
          </svg>
          <span className="font-medium">אין חיבור לרשת — מוצגים נתונים שמורים</span>
        </div>
      </div>
    );
  }

  // Online toast (briefly after reconnection)
  if (showOnlineToast) {
    return (
      <div
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg bg-green-600 text-white transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="font-medium">מחובר לרשת</span>
        </div>
      </div>
    );
  }

  return null;
};

export default OnlineStatus;
