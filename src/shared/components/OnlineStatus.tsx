import React, { useState, useEffect, useRef } from 'react';
import { useNetwork } from '../context/NetworkContext';

/**
 * Component that shows online/offline status.
 * Shows a brief banner when going offline (auto-dismisses after 5 seconds to keep the screen clean),
 * and a brief "connected" toast when coming back online.
 */
const OnlineStatus: React.FC = () => {
  const { isOnline, isManualOffline, toggleManualOffline } = useNetwork();
  const [showOfflineBanner, setShowOfflineBanner] = useState(!isOnline);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const wasOffline = useRef(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setShowOnlineToast(false);
      setShowOfflineBanner(true);
      const timer = setTimeout(() => {
        setShowOfflineBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (wasOffline.current) {
      // Just came back online — show brief toast
      wasOffline.current = false;
      setShowOfflineBanner(false);
      setShowOnlineToast(true);
      const timer = setTimeout(() => {
        setShowOnlineToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleOfflineBannerClick = () => {
    setShowOfflineBanner(false);
    if (isManualOffline) {
      toggleManualOffline();
    }
  };

  if (!isOnline && showOfflineBanner) {
    return (
      <button
        onClick={handleOfflineBannerClick}
        className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg bg-amber-600 hover:bg-amber-700 text-white transition-all duration-300 transform active:scale-95 cursor-pointer border border-amber-500/20 text-right animate-fade-in flex items-center gap-2"
        dir="rtl"
        title={isManualOffline ? 'לחץ לביטול מצב אופליין ידני והתחברות' : 'לחץ להסרת ההודעה'}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01"></path>
          </svg>
          <span className="font-medium text-sm">
            {isManualOffline ? (
              <>
                אין חיבור לרשת <span className="bg-amber-800 text-amber-200 text-xs px-1.5 py-0.5 rounded font-bold mr-1.5 select-none">מצב ידני</span> (לחץ כאן לביטול)
              </>
            ) : (
              'אין חיבור לרשת, הלוח עובד מהעותק המקומי (לחץ להסרה)'
            )}
          </span>
        </div>
      </button>
    );
  }

  // Online toast (briefly after reconnection)
  if (showOnlineToast) {
    return (
      <div
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg bg-green-600 text-white transition-all duration-300 animate-fade-in"
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="font-medium text-sm">מחובר לרשת</span>
        </div>
      </div>
    );
  }

  return null;
};

export default OnlineStatus;
