import { useEffect, useRef, useState, useCallback } from 'react';

export const useWakeLock = () => {
    const wakeLock = useRef<WakeLockSentinel | null>(null);
    const [isLocked, setIsLocked] = useState(false);

    const requestWakeLock = useCallback(async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLock.current = await navigator.wakeLock.request('screen');
                setIsLocked(true);

                wakeLock.current.addEventListener('release', () => {
                    setIsLocked(false);
                    console.log('Wake Lock released');
                });
                console.log('Wake Lock active');
            } catch (err: any) {
                console.error(`Wake Lock error: ${err.name}, ${err.message}`);
            }
        } else {
            console.warn('Wake Lock API not supported.');
        }
    }, []);

    useEffect(() => {
        requestWakeLock();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock.current) {
                wakeLock.current.release();
                wakeLock.current = null;
            }
        };
    }, [requestWakeLock]);

    return { isLocked };
};
