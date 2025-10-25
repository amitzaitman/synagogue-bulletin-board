import React, { useState, useEffect } from 'react';
import { onOnlineStatusChange } from '../utils/offlineStorage';

/**
 * Component that shows online/offline status
 * Only appears when offline or during transitions
 */
const OnlineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(!navigator.onLine);

  useEffect(() => {
    // Listen to online/offline changes
    const unsubscribe = onOnlineStatusChange((online) => {
      setIsOnline(online);

      // Show status indicator
      setShowStatus(true);

      // Auto-hide after 3 seconds if online
      if (online) {
        setTimeout(() => {
          setShowStatus(false);
        }, 3000);
      }
    });

    return unsubscribe;
  }, []);

  // Don't show anything if online and we've hidden it
  if (isOnline && !showStatus) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white animate-pulse'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
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
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
            </svg>
            <span className="font-medium">אין חיבור לרשת - מצב Offline</span>
          </>
        )}
      </div>
      {!isOnline && (
        <p className="text-xs mt-1 opacity-90">
          השינויים נשמרים מקומית ויסתנכרנו כשהחיבור יחזור
        </p>
      )}
    </div>
  );
};

export default OnlineStatus;
