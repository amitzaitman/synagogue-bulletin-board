// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { set } from 'date-fns';
import { roundTime, formatTime, calculateAllEventTimes } from '../timeCalculations';
import type { EventItem, Column, ZmanimData, BoardSettings } from '../../types/types';

// Mock hebcal to avoid real astronomy calculations
vi.mock('../hebcal', () => ({
    createHebcalLocation: vi.fn(),
}));

// ---------- helpers ----------

/** Create a Date today at the given HH:mm */
const timeAt = (hhmm: string): Date => {
    const [h, m] = hhmm.split(':').map(Number);
    return set(new Date(), { hours: h, minutes: m, seconds: 0, milliseconds: 0 });
};

/** Minimal board settings needed by calculateAllEventTimes */
const defaultSettings: BoardSettings = {
    scale: 1,
    mainTitleSize: 100,
    columnTitleSize: 100,
    eventTextScale: 100,
    theme: 'light',
    prayerColor: '#000',
    classColor: '#000',
    freeTextColor: '#000',
    columnTitleColor: '#000',
    mainTitleColor: '#000',
    highlightColor: '#000',
    mainBackgroundColor: '#fff',
    boardBackgroundColor: '#fff',
    columnBackgroundColor: '#fff',
    clockBackgroundColor: '#fff',
    zmanimBackgroundColor: '#fff',
    shabbatCandleOffset: 20,
    latitude: 31.77,
    longitude: 35.23,
};

const shabbatColumn: Column = { id: 'col-shabbat', title: 'שבת', order: 0, columnType: 'shabbat' };
const weekdaysColumn: Column = { id: 'col-weekdays', title: 'ימי חול', order: 1, columnType: 'weekdays' };


// ================================================================
//  roundTime
// ================================================================

describe('roundTime', () => {
    it('rounds down to the nearest 5 minutes', () => {
        const result = roundTime(timeAt('17:43'), { direction: 'down', increment: 5 });
        expect(formatTime(result)).toBe('17:40');
    });

    it('rounds up to the nearest 5 minutes', () => {
        const result = roundTime(timeAt('17:41'), { direction: 'up', increment: 5 });
        expect(formatTime(result)).toBe('17:45');
    });

    it('rounds to nearest 5 minutes (below midpoint)', () => {
        const result = roundTime(timeAt('17:42'), { direction: 'nearest', increment: 5 });
        expect(formatTime(result)).toBe('17:40');
    });

    it('rounds to nearest 5 minutes (above midpoint)', () => {
        const result = roundTime(timeAt('17:43'), { direction: 'nearest', increment: 5 });
        expect(formatTime(result)).toBe('17:45');
    });

    it('does not change a time already on the increment boundary', () => {
        const result = roundTime(timeAt('17:45'), { direction: 'up', increment: 5 });
        expect(formatTime(result)).toBe('17:45');
    });

    it('rounds to 15 minute increments', () => {
        const result = roundTime(timeAt('17:08'), { direction: 'up', increment: 15 });
        expect(formatTime(result)).toBe('17:15');
    });

    it('rounds to 10 minute increments (down)', () => {
        const result = roundTime(timeAt('17:49'), { direction: 'down', increment: 10 });
        expect(formatTime(result)).toBe('17:40');
    });

    it('throws on negative increment', () => {
        expect(() => roundTime(timeAt('12:00'), { direction: 'up', increment: -5 })).toThrow();
    });
});

// ================================================================
//  formatTime
// ================================================================

describe('formatTime', () => {
    it('formats without leading zero for single-digit hour', () => {
        expect(formatTime(timeAt('6:05'))).toBe('6:05');
    });

    it('formats double-digit hour correctly', () => {
        expect(formatTime(timeAt('18:00'))).toBe('18:00');
    });

    it('formats midnight', () => {
        expect(formatTime(timeAt('0:00'))).toBe('0:00');
    });
});

// ================================================================
//  calculateAllEventTimes
// ================================================================

describe('calculateAllEventTimes', () => {
    const zmanimData: ZmanimData = {
        hebrewDate: null,
        parsha: null,
        holidayEvents: [],
        sunrise: timeAt('5:30'),
        sunset: timeAt('17:42'),
        fridaySunrise: timeAt('5:32'),
        fridaySunset: timeAt('17:40'),
        shabbatCandles: timeAt('17:20'),
        shabbatEnd: timeAt('18:10'),
        sofZmanShmaMGA: null,
        sofZmanShmaGRA: null,
        sofZmanTfillaMGA: null,
        sofZmanTfillaGRA: null,
        alotHaShachar: null,
        chatzot: null,
        minchaGedola: null,
        minchaKetana: null,
        plagHaMincha: null,
        tzeit: null,
        weekdaysEarliestSunset: timeAt('17:35'),
        currentHebrewDate: null,
    };

    // --- absolute mode ---

    it('resolves an absolute time event', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'שחרית', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'absolute', absoluteTime: '08:30' } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        expect(times.get('e1')).toBe('8:30');
    });

    // --- relative mode ---

    it('resolves an event relative to another event', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'מנחה', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'absolute', absoluteTime: '18:00' } },
            { id: 'e2', name: 'ערבית', type: 'prayer', columnId: 'col-shabbat', order: 1, timeDefinition: { mode: 'relative', relativeEventId: 'e1', offsetMinutes: 60 } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        expect(times.get('e2')).toBe('19:00');
    });

    it('resolves a chain of relative events', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'A', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'absolute', absoluteTime: '10:00' } },
            { id: 'e2', name: 'B', type: 'prayer', columnId: 'col-shabbat', order: 1, timeDefinition: { mode: 'relative', relativeEventId: 'e1', offsetMinutes: 30 } },
            { id: 'e3', name: 'C', type: 'prayer', columnId: 'col-shabbat', order: 2, timeDefinition: { mode: 'relative', relativeEventId: 'e2', offsetMinutes: 15 } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        expect(times.get('e2')).toBe('10:30');
        expect(times.get('e3')).toBe('10:45');
    });

    it('resolves a negative offset (before)', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'מנחה', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'absolute', absoluteTime: '18:00' } },
            { id: 'e2', name: 'שיעור', type: 'class', columnId: 'col-shabbat', order: 1, timeDefinition: { mode: 'relative', relativeEventId: 'e1', offsetMinutes: -30 } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        expect(times.get('e2')).toBe('17:30');
    });

    // --- relativeToZman mode ---

    it('resolves event relative to shabbatEnd in a shabbat column', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'ערבית', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'relativeToZman', zman: 'shabbatEnd', offsetMinutes: 5 } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        // shabbatEnd = 18:10, +5 = 18:15
        expect(times.get('e1')).toBe('18:15');
    });

    it('resolves event relative to sunset in a weekdays column (uses weekdaysEarliestSunset)', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'מנחה', type: 'prayer', columnId: 'col-weekdays', order: 0, timeDefinition: { mode: 'relativeToZman', zman: 'sunset', offsetMinutes: -20 } },
        ];
        const times = calculateAllEventTimes(events, [weekdaysColumn], zmanimData, defaultSettings);
        // weekdaysEarliestSunset = 17:35, -20 = 17:15
        expect(times.get('e1')).toBe('17:15');
    });

    it('resolves non-sunset zman in weekdays column (falls back to zmanimData)', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'שחרית', type: 'prayer', columnId: 'col-weekdays', order: 0, timeDefinition: { mode: 'relativeToZman', zman: 'sunrise', offsetMinutes: 0 } },
        ];
        const times = calculateAllEventTimes(events, [weekdaysColumn], zmanimData, defaultSettings);
        // sunrise = 5:30
        expect(times.get('e1')).toBe('5:30');
    });

    // --- rounding with relativeToZman ---

    it('applies rounding to relativeToZman result (arvit 5-9 min after shabbat end)', () => {
        // This is the user's exact use case: Arvit should be 5-9 minutes after shabbat end
        const events: EventItem[] = [
            {
                id: 'e1', name: 'ערבית', type: 'prayer', columnId: 'col-shabbat', order: 0,
                timeDefinition: { mode: 'relativeToZman', zman: 'shabbatEnd', offsetMinutes: 5, rounding: { direction: 'up', increment: 5 } }
            },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        // shabbatEnd=18:10, +5=18:15, round up 5 → 18:15 (already on boundary)
        expect(times.get('e1')).toBe('18:15');
    });

    it('rounding up pushes to next boundary when not exactly on it', () => {
        // Use a zmanimData where shabbatEnd is not on a 5-minute boundary
        const customZmanim = { ...zmanimData, shabbatEnd: timeAt('18:12') };
        const events: EventItem[] = [
            {
                id: 'e1', name: 'ערבית', type: 'prayer', columnId: 'col-shabbat', order: 0,
                timeDefinition: { mode: 'relativeToZman', zman: 'shabbatEnd', offsetMinutes: 5, rounding: { direction: 'up', increment: 5 } }
            },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], customZmanim, defaultSettings);
        // shabbatEnd=18:12, +5=18:17, round up 5 → 18:20
        expect(times.get('e1')).toBe('18:20');
    });

    it('applies rounding to relative-to-event result', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'מנחה', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'absolute', absoluteTime: '17:43' } },
            { id: 'e2', name: 'ערבית', type: 'prayer', columnId: 'col-shabbat', order: 1, timeDefinition: { mode: 'relative', relativeEventId: 'e1', offsetMinutes: 30, rounding: { direction: 'down', increment: 5 } } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        // 17:43+30=18:13, round down 5 → 18:10
        expect(times.get('e2')).toBe('18:10');
    });

    // --- circular dependency ---

    it('returns null for circular dependency between events', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'A', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'relative', relativeEventId: 'e2', offsetMinutes: 10 } },
            { id: 'e2', name: 'B', type: 'prayer', columnId: 'col-shabbat', order: 1, timeDefinition: { mode: 'relative', relativeEventId: 'e1', offsetMinutes: 10 } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        expect(times.get('e1')).toBeNull();
        expect(times.get('e2')).toBeNull();
    });

    // --- edge cases ---

    it('returns null for event with no timeDefinition', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'הודעה', type: 'freeText', columnId: 'col-shabbat', order: 0 },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        expect(times.get('e1')).toBeNull();
    });

    it('returns null for event referencing a missing column', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'X', type: 'prayer', columnId: 'col-nonexistent', order: 0, timeDefinition: { mode: 'absolute', absoluteTime: '10:00' } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        expect(times.get('e1')).toBeNull();
    });

    it('returns null for relative event referencing a nonexistent event', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'A', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'relative', relativeEventId: 'ghost', offsetMinutes: 10 } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], zmanimData, defaultSettings);
        expect(times.get('e1')).toBeNull();
    });

    it('returns null when zmanimData is null for relativeToZman', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'ערבית', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'relativeToZman', zman: 'shabbatEnd', offsetMinutes: 5 } },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn], null, defaultSettings);
        expect(times.get('e1')).toBeNull();
    });

    it('handles an empty events array', () => {
        const times = calculateAllEventTimes([], [shabbatColumn], zmanimData, defaultSettings);
        expect(times.size).toBe(0);
    });

    it('processes multiple events across different columns', () => {
        const events: EventItem[] = [
            { id: 'e1', name: 'שחרית', type: 'prayer', columnId: 'col-shabbat', order: 0, timeDefinition: { mode: 'absolute', absoluteTime: '08:30' } },
            { id: 'e2', name: 'מנחה', type: 'prayer', columnId: 'col-weekdays', order: 0, timeDefinition: { mode: 'relativeToZman', zman: 'sunset', offsetMinutes: -15 } },
            { id: 'e3', name: 'הודעה', type: 'freeText', columnId: 'col-shabbat', order: 1 },
        ];
        const times = calculateAllEventTimes(events, [shabbatColumn, weekdaysColumn], zmanimData, defaultSettings);
        expect(times.get('e1')).toBe('8:30');
        expect(times.get('e2')).toBe('17:20'); // weekdaysEarliestSunset 17:35 - 15
        expect(times.get('e3')).toBeNull();
    });
});
