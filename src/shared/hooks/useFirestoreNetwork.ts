import { useEffect } from 'react';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from '../firebase';

export const useFirestoreNetwork = () => {
    useEffect(() => {
        const enableFirestoreNetwork = async () => {
            try {
                console.info('[Firestore] Enabling Firestore network...');
                await enableNetwork(db);
                console.info('[Firestore] Firestore network enabled.');
            } catch (err) {
                console.warn('[Firestore] Note: Attempt to enable network failed (might already be enabled):', err);
            }
        };

        const disableFirestoreNetwork = async () => {
            try {
                console.info('[Firestore] Disabling Firestore network and using cache-only mode...');
                await disableNetwork(db);
                console.info('[Firestore] Firestore network disabled.');
            } catch (err) {
                console.warn('[Firestore] Error disabling network:', err);
            }
        };

        const syncFirestoreNetwork = async () => {
            if (navigator.onLine) {
                await enableFirestoreNetwork();
            } else {
                await disableFirestoreNetwork();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void syncFirestoreNetwork();
            }
        };

        window.addEventListener('online', syncFirestoreNetwork);
        window.addEventListener('offline', syncFirestoreNetwork);
        window.addEventListener('focus', syncFirestoreNetwork);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        void syncFirestoreNetwork();

        return () => {
            window.removeEventListener('online', syncFirestoreNetwork);
            window.removeEventListener('offline', syncFirestoreNetwork);
            window.removeEventListener('focus', syncFirestoreNetwork);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
};
