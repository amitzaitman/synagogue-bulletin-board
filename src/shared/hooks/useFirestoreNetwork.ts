import { useEffect } from 'react';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from '../firebase';

export const useFirestoreNetwork = () => {
    useEffect(() => {
        const handleOnline = async () => {
            try {
                // Only enable if currently disabled or just to be safe
                console.info('[Firestore] Network detected online. Enabling Firestore network...');
                await enableNetwork(db);
                console.info('[Firestore] Firestore network enabled.');
            } catch (err) {
                // enableNetwork can fail if already enabled or other issues, usually safe to ignore or log as warn
                console.warn('[Firestore] Note: Attempt to enable network failed (might already be enabled):', err);
            }
        };

        const handleOffline = async () => {
            try {
                console.info('[Firestore] Network detected offline. Disabling Firestore network to prevent connection errors...');
                await disableNetwork(db);
                console.info('[Firestore] Firestore network disabled.');
            } catch (err) {
                console.warn('[Firestore] Error disabling network:', err);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if (navigator.onLine) {
            // We don't strictly need to call enableNetwork on init as it's default, 
            // but if we previously disabled it and it persisted (unlikely without persistence enabled, but possible), 
            // it's good practice. However, calling it immediately might race with initialization.
            // Let's just log.
            console.info('[Firestore] Initial status: Online');
        } else {
            handleOffline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
};
