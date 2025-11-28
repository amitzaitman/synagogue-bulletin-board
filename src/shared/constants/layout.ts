import { BoardSettings } from '../types/types';

export const DEFAULT_BOARD_SETTINGS: BoardSettings = {
    boardTitle: 'בית הכנסת - גבעת החי״ש',
    hasCompletedSetup: false, // User hasn't completed setup yet
    manualEventOrdering: false, // Auto-sort by default
    scale: 1.0,
    mainTitleSize: 100, // percentage
    columnTitleSize: 100, // percentage
    eventTextScale: 100, // percentage
    theme: 'light',
    // Colors for text elements
    prayerColor: '#78350f', // tailwind amber-900
    classColor: '#115e59', // tailwind teal-800
    freeTextColor: '#44403c', // tailwind stone-700
    columnTitleColor: '#78350f', // tailwind amber-900
    mainTitleColor: '#92400e', // tailwind amber-800
    highlightColor: '#fef3c7', // tailwind amber-100
    // Background colors with opacity for layered effect
    mainBackgroundColor: '#E6DFD4', // רקע כללי בגוון קרם חמים
    boardBackgroundColor: 'rgba(248, 244, 237, 0.85)', // רקע הלוח - קרם בהיר שקוף
    columnBackgroundColor: 'rgba(251, 247, 241, 0.75)', // רקע העמודות - קרם בהיר יותר
    clockBackgroundColor: 'rgba(244, 238, 228, 0.6)', // רקע השעון - גוון חמים שקוף
    zmanimBackgroundColor: 'rgba(244, 238, 228, 0.6)', // רקע פאנל הזמנים - גוון חמים שקוף
    shabbatCandleOffset: 30, // minutes before sunset
    elevation: 970, // Default to Gush Etzion
    latitude: 31.654,
    longitude: 35.132,
};

export const LAYOUT_CONSTANTS = {
    COLUMN: {
        // Padding for the column header
        HEADER_PADDING_Y_PX: 12,
        HEADER_PADDING_X_PX: 16,

        // Scaling factor for the column title font size relative to settings.columnTitleSize
        TITLE_SCALE_FACTOR: 0.25,

        // Base font size for the specific date in the column header (in rem)
        DATE_FONT_SIZE_REM: 0.875,

        // Base font size for the column title in the standalone ColumnHeader component (in em)
        HEADER_TITLE_BASE_EM: 2.8,
    },
    EVENT: {
        // Scaling factor for event text size relative to settings.eventTextScale
        TEXT_SCALE_FACTOR: 0.16,

        // Minimum width for the time display in an event item (in px)
        TIME_MIN_WIDTH_PX: 60,

        // Padding for event item
        PADDING_Y_PX: 12,
        PADDING_X_PX: 16,
    },
    HEADER: {
        PADDING_PX: 16,
        CLOCK_FONT_SIZE_REM: 2.25,
        CLOCK_PADDING_Y_PX: 8,
        CLOCK_PADDING_X_PX: 16,
        TITLE_SCALE_FACTOR: 0.5,
        DATE_FONT_SIZE_REM: 1.5,
        PARSHA_FONT_SIZE_REM: 1.25,
    },
    GRID: {
        PADDING_PX: 16,
        GAP_PX: 16,
    }
};
