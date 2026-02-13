import { BoardSettings } from '../types/types';

export const DEFAULT_BOARD_SETTINGS: BoardSettings = {
    boardTitle: 'בית הכנסת',
    hasCompletedSetup: false, // User hasn't completed setup yet
    manualEventOrdering: false, // Auto-sort by default
    scale: 1.0,
    mainTitleSize: 100, // percentage
    columnTitleSize: 100, // percentage
    eventTextScale: 100, // percentage
    eventPaddingY: 6,
    eventPaddingX: 12,
    theme: 'light',
    // Colors for text elements
    prayerColor: '#1e3a5f', // brand-dark
    classColor: '#2c5282', // brand-accent
    freeTextColor: '#4a5568', // gray-700
    columnTitleColor: '#ffffff',
    mainTitleColor: '#ffffff',
    highlightColor: '#fef3c7', // tailwind amber-100
    // Background colors with opacity for layered effect
    mainBackgroundColor: '#f0f2f5', // brand-bg
    boardBackgroundColor: 'rgba(240, 242, 245, 0)', // transparent
    columnBackgroundColor: '#ffffff',
    clockBackgroundColor: 'rgba(255, 255, 255, 0.1)',
    zmanimBackgroundColor: '#1e3a5f', // brand-dark
    shabbatCandleOffset: 30, // minutes before sunset
    elevation: 970, // Default to Gush Etzion
    latitude: 31.654,
    longitude: 35.132,
    boardMessageFontSize: 1.1,
};

export interface ColumnLayoutConstants {
    HEADER_PADDING_Y_PX: number;
    HEADER_PADDING_X_PX: number;
    TITLE_SCALE_FACTOR: number;
    DATE_FONT_SIZE_REM: number;
    HEADER_TITLE_BASE_EM: number;
}

export interface EventLayoutConstants {
    TEXT_SCALE_FACTOR: number;
    TIME_MIN_WIDTH_PX: number;
    PADDING_Y_PX: number;
    PADDING_X_PX: number;
    TIME_FONT_SIZE_REM: number;
}

export interface GridLayoutConstants {
    PADDING_PX: number;
    GAP_PX: number;
}

export const LAYOUT_CONSTANTS: {
    COLUMN: ColumnLayoutConstants;
    EVENT: EventLayoutConstants;
    GRID: GridLayoutConstants;
} = {
    COLUMN: {
        // Padding for the column header
        HEADER_PADDING_Y_PX: 4,
        HEADER_PADDING_X_PX: 8,

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
        PADDING_Y_PX: 6,
        PADDING_X_PX: 12,

        // Base font size for the time in the event item (in rem)
        TIME_FONT_SIZE_REM: 0.875,
    },
    GRID: {
        PADDING_PX: 8,
        GAP_PX: 8,
    }
};
