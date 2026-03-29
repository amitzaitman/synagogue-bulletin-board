export const MANUAL_OFFSET_KEY = 'manualTimeOffset';
export const TRUSTED_TIME_ANCHOR_KEY = 'trustedTimeAnchor';

const MIN_VALID_CLOCK_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0, 0);
const AUTO_RECOVERY_THRESHOLD_MS = 60 * 1000;

interface TrustedTimeAnchor {
    trustedTimeMs: number;
    deviceTimeMs: number;
}

let timeOffset = 0;
let isInitialized = false;

const parseStoredInteger = (value: string | null): number | null => {
    if (!value) return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const getStoredTrustedTimeAnchor = (): TrustedTimeAnchor | null => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        return null;
    }

    try {
        const stored = localStorage.getItem(TRUSTED_TIME_ANCHOR_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as Partial<TrustedTimeAnchor>;
        if (typeof parsed.trustedTimeMs !== 'number' || typeof parsed.deviceTimeMs !== 'number') {
            return null;
        }

        return {
            trustedTimeMs: parsed.trustedTimeMs,
            deviceTimeMs: parsed.deviceTimeMs,
        };
    } catch (e) {
        console.error('Failed to read trusted time anchor', e);
        return null;
    }
};

// Initializes the time offset from local storage.
// Manual correction wins; otherwise, reuse the last trusted clock if the device rebooted with an older time.
export const initializeTimeOffset = () => {
    if (isInitialized) return;

    try {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
            const manualOffset = parseStoredInteger(localStorage.getItem(MANUAL_OFFSET_KEY));
            if (manualOffset !== null) {
                timeOffset = manualOffset;
                console.info(`[TimeProvider] Loaded manual time offset of ${timeOffset}ms`);
            } else {
                const trustedAnchor = getStoredTrustedTimeAnchor();
                if (trustedAnchor) {
                    const deviceNow = Date.now();
                    if (deviceNow < trustedAnchor.trustedTimeMs - AUTO_RECOVERY_THRESHOLD_MS) {
                        timeOffset = trustedAnchor.trustedTimeMs - deviceNow;
                        console.info(`[TimeProvider] Applied trusted time recovery offset of ${timeOffset}ms`);
                    }
                }
            }
        }
    } catch (e) {
        console.error('Failed to initialize time offset', e);
    } finally {
        isInitialized = true;
    }
};

export const setManualTimeOffset = (userDate: Date) => {
    const offset = userDate.getTime() - Date.now();
    timeOffset = offset;
    try {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
            localStorage.setItem(MANUAL_OFFSET_KEY, offset.toString());
            console.info(`[TimeProvider] Saved manual time offset of ${offset}ms`);
        }
    } catch (e) {
        console.error('Failed to save time offset', e);
    }
};

export const recordTrustedCurrentTime = (trustedDate: Date = new Date()) => {
    const trustedTimeMs = trustedDate.getTime();
    const anchor: TrustedTimeAnchor = {
        trustedTimeMs,
        deviceTimeMs: Date.now(),
    };

    try {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
            localStorage.setItem(TRUSTED_TIME_ANCHOR_KEY, JSON.stringify(anchor));
        }
    } catch (e) {
        console.error('Failed to save trusted time anchor', e);
    }

    return new Date(trustedTimeMs);
};

export const getLastTrustedTime = (): Date | null => {
    const anchor = getStoredTrustedTimeAnchor();
    return anchor ? new Date(anchor.trustedTimeMs) : null;
};

export const isCurrentClockPlausible = (): boolean => getCurrentTime().getTime() >= MIN_VALID_CLOCK_TIMESTAMP;

export const getCurrentTime = (): Date => {
    if (!isInitialized) initializeTimeOffset();
    return new Date(Date.now() + timeOffset);
};
