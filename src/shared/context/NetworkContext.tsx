import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from '../firebase';

interface NetworkContextType {
    isOnline: boolean;
    isManualOffline: boolean;
    actualOnline: boolean;
    toggleManualOffline: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [actualOnline, setActualOnline] = useState(() => 
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [isManualOffline, setIsManualOffline] = useState(() => {
        try {
            return localStorage.getItem('force_offline') === 'true';
        } catch {
            return false;
        }
    });

    const isFirstRender = useRef(true);

    useEffect(() => {
        const handleOnline = () => setActualOnline(true);
        const handleOffline = () => setActualOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const isOnline = actualOnline && !isManualOffline;

    const toggleManualOffline = () => {
        setIsManualOffline(prev => {
            const next = !prev;
            try {
                localStorage.setItem('force_offline', String(next));
                console.info(`[NetworkContext] Manual offline mode toggled to: ${next}`);
            } catch (e) {
                console.error('Failed to save manual offline state', e);
            }
            return next;
        });
    };

    // Keep Firestore network in sync with the effective connection state
    useEffect(() => {
        const syncFirestore = async () => {
            // Avoid calling enableNetwork on the very first mount if the app is online,
            // as Firestore is online by default. This prevents a race condition (Target ID already exists)
            // with concurrent initial queries.
            if (isFirstRender.current) {
                isFirstRender.current = false;
                if (isOnline) {
                    console.info('[Firestore] App is online on startup. Skipping redundant enableNetwork.');
                    return;
                }
            }

            if (isOnline) {
                try {
                    console.info('[Firestore] Enabling Firestore network...');
                    await enableNetwork(db);
                    console.info('[Firestore] Firestore network enabled.');
                } catch (err) {
                    console.warn('[Firestore] Note: Attempt to enable network failed:', err);
                }
            } else {
                try {
                    console.info('[Firestore] Disabling Firestore network and using cache-only mode...');
                    await disableNetwork(db);
                    console.info('[Firestore] Firestore network disabled.');
                } catch (err) {
                    console.warn('[Firestore] Error disabling network:', err);
                }
            }
        };

        void syncFirestore();
    }, [isOnline]);

    return (
        <NetworkContext.Provider value={{ isOnline, isManualOffline, actualOnline, toggleManualOffline }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (!context) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
};
