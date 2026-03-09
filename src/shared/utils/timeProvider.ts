// Using a manual offset cached by the user
export const MANUAL_OFFSET_KEY = 'manualTimeOffset';

let timeOffset = 0;
let isInitialized = false;

// Initializes the time offset from local storage
export const initializeTimeOffset = () => {
    if (isInitialized) return;

    try {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
            const stored = localStorage.getItem(MANUAL_OFFSET_KEY);
            if (stored) {
                const parsedOffset = parseInt(stored, 10);
                if (!isNaN(parsedOffset)) {
                    timeOffset = parsedOffset;
                    console.info(`[TimeProvider] Loaded manual time offset of ${timeOffset}ms`);
                }
            }
        }
    } catch (e) {
        console.error('Failed to initialize time offset', e);
    } finally {
        isInitialized = true;
    }
};

// Allows the user to manually set the device time from the UI
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

// Gets the current time, applying any manual offset configured by the user
export const getCurrentTime = (): Date => {
    if (!isInitialized) initializeTimeOffset();
    return new Date(Date.now() + timeOffset);
};
