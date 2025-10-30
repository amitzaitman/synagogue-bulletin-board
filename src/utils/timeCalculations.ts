import { EventItem, Column, ZmanimData, BoardSettings, DateSpecificZmanim } from '../types';
import { Location, Zmanim } from '@hebcal/core';

export const roundTime = (date: Date, rounding: { direction: 'up' | 'down' | 'nearest'; increment: number; }): Date => {
    const { direction = 'nearest', increment } = rounding || { direction: 'nearest', increment: 1 };
    if (typeof increment !== 'number' || increment < 0) {
        throw new Error('roundTime: increment must be a positive number');
    }

    // work in seconds so we account for seconds fraction when rounding
    const totalSeconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    const factor = increment * 60;

    let roundedSeconds: number;
    switch (direction) {
        case 'up':
            roundedSeconds = Math.ceil(totalSeconds / factor) * factor;
            break;
        case 'down':
            roundedSeconds = Math.floor(totalSeconds / factor) * factor;
            break;
        case 'nearest':
        default:
            roundedSeconds = Math.round(totalSeconds / factor) * factor;
            break;
    }

    const newDate = new Date(date);
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    newDate.setHours(hours, minutes, 0, 0); // seconds reset to 0
    return newDate;
};

export const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Function to calculate zmanim for a specific date
export const calculateZmanimForDate = (dateStr: string, settings: BoardSettings): DateSpecificZmanim | null => {
    const { latitude, longitude, elevation } = settings;
    if (!latitude || !longitude) return null;

    try {
        const date = new Date(dateStr + 'T12:00:00'); // Parse as noon local time
        const isIsrael = latitude > 29.45 && latitude < 33.34 && longitude > 34.20 && longitude < 35.90;
        const timezone = isIsrael ? 'Asia/Jerusalem' : Intl.DateTimeFormat().resolvedOptions().timeZone;
        const location = new Location(latitude, longitude, isIsrael, timezone);
        if (elevation) {
            location.setElevation(elevation);
        }

        const zmanim = new Zmanim(location, date, true);
        return {
            date: date,
            sunrise: zmanim.sunrise() || null,
            sunset: zmanim.sunset() || null,
        };
    } catch (error) {
        console.error('Error calculating zmanim for date:', dateStr, error);
        return null;
    }
};

export const calculateAllEventTimes = (
    events: EventItem[],
    columns: Column[],
    zmanimData: ZmanimData | null,
    settings: BoardSettings
): Map<string, string | null> => {
    const eventsById = new Map(events.map(e => [e.id, e]));
    const columnsById = new Map(columns.map(c => [c.id, c]));
    const calculatedTimes = new Map<string, string | null>();

    // Cache for date-specific zmanim calculations
    const dateZmanimCache = new Map<string, DateSpecificZmanim | null>();

    const calculateTime = (eventId: string, visited: Set<string> = new Set()): Date | null => {
        if (calculatedTimes.has(eventId)) {
            const timeStr = calculatedTimes.get(eventId);
            if (!timeStr) return null;
            const [hours, minutes] = timeStr.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        }
        if (visited.has(eventId)) return null; // Circular dependency

        visited.add(eventId);

        const event = eventsById.get(eventId);
        if (!event || !event.timeDefinition) {
            calculatedTimes.set(eventId, null);
            return null;
        }

        const column = columnsById.get(event.columnId);
        if (!column) {
            calculatedTimes.set(eventId, null);
            return null;
        }

        let resultDate: Date | null = null;
        const { mode, rounding } = event.timeDefinition;

        if (mode === 'absolute') {
            const { absoluteTime } = event.timeDefinition;
            if (absoluteTime) {
                const [hours, minutes] = absoluteTime.split(':').map(Number);
                resultDate = new Date();
                resultDate.setHours(hours, minutes, 0, 0);
            }
        } else if (mode === 'relative') {
            const { relativeEventId, offsetMinutes } = event.timeDefinition;
            const targetTime = calculateTime(relativeEventId, new Set(visited));
            if (targetTime) {
                resultDate = new Date(targetTime.getTime() + offsetMinutes * 60000);
            }
        } else if (mode === 'relativeToZman') {
            const { zman, offsetMinutes } = event.timeDefinition;
            let zmanTime: Date | null = null;

            // Determine which zman to use based on column type
            if (column.columnType === 'shabbat') {
                // Use Shabbat zmanim
                zmanTime = zmanimData?.[zman] || null;
            } else if (column.columnType === 'weekdays') {
                // Use weekdays earliest sunset for sunset, otherwise use shabbat zmanim as fallback
                if (zman === 'sunset') {
                    zmanTime = zmanimData?.weekdaysEarliestSunset || null;
                } else {
                    zmanTime = zmanimData?.[zman] || null;
                }
            } else if (column.columnType === 'moed' && column.specificDate) {
                // Calculate zmanim for the specific date
                if (!dateZmanimCache.has(column.specificDate)) {
                    dateZmanimCache.set(column.specificDate, calculateZmanimForDate(column.specificDate, settings));
                }
                const dateZmanim = dateZmanimCache.get(column.specificDate);
                if (dateZmanim) {
                    if (zman === 'sunset') {
                        zmanTime = dateZmanim.sunset;
                    } else if (zman === 'sunrise') {
                        zmanTime = dateZmanim.sunrise;
                    }
                    // For other zmanim types (shabbatCandles, shabbatEnd), we don't have specific calculations
                    // Fall back to the main zmanimData
                    if (!zmanTime) {
                        zmanTime = zmanimData?.[zman] || null;
                    }
                }
            }

            if (zmanTime) {
                resultDate = new Date(zmanTime.getTime() + offsetMinutes * 60000);
            }
        }
        
        if (resultDate && rounding) {
            resultDate = roundTime(resultDate, rounding);
        }

        const finalTimeStr = resultDate ? formatTime(resultDate) : null;
        calculatedTimes.set(eventId, finalTimeStr);
        return resultDate;
    };

    for (const event of events) {
        if (!calculatedTimes.has(event.id)) {
            calculateTime(event.id);
        }
    }
    
    // Return a map of string times, not Date objects
    const finalTimes = new Map<string, string | null>();
    for (const event of events) {
        finalTimes.set(event.id, calculatedTimes.get(event.id) ?? null);
    }
    return finalTimes;
};
