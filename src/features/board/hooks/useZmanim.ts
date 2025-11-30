import { useState, useEffect } from 'react';
import { Zmanim, HebrewCalendar, HDate, flags, Event } from '@hebcal/core';
import { BoardSettings, ZmanimData } from '../../../shared/types/types';
import { createHebcalLocation } from '../../../shared/utils/hebcal';

// Helper function to remove Hebrew vowel points and cantillation marks
const removeNikud = (text: string): string => text.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '');

export const useZmanim = (settings: BoardSettings) => {
    const [zmanimData, setZmanimData] = useState<ZmanimData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { elevation, latitude, longitude, shabbatCandleOffset } = settings;

    useEffect(() => {
        const fetchZmanim = (lat: number, lon: number) => {
            console.info(`[useZmanim] Calculating zmanim for location: ${lat}, ${lon}`);
            setLoading(true);
            try {
                const location = createHebcalLocation(lat, lon, elevation);

                const now = new Date();
                const today = now.getDay(); // Sunday=0, ..., Saturday=6

                // --- Shabbat-specific calculations ---

                // Consistently find the upcoming Shabbat. If today is Saturday, it's today.
                const daysUntilSaturday = (6 - today + 7) % 7;
                const saturday = new Date(now);
                saturday.setDate(now.getDate() + daysUntilSaturday);
                saturday.setHours(12, 0, 0, 0); // Normalize to noon for reliable day calculation

                // Derive Friday from that Saturday to ensure they belong to the same Shabbat week.
                const friday = new Date(saturday);
                friday.setDate(saturday.getDate() - 1);


                // Get all zmanim for Shabbat day
                const zmanimShabbat = new Zmanim(location, saturday, true);

                // Get zmanim for TODAY (for the footer display)
                const zmanimToday = new Zmanim(location, now, true);

                const isIsrael = location.getIsrael();
                const calendarOptions = { location, il: isIsrael, sedrot: true };

                // Get candle lighting time directly from Zmanim object for Friday
                const zmanimFriday = new Zmanim(location, friday, true);
                // Calculate candle lighting as 30 minutes before sunset, per user request
                const sunset = zmanimFriday.sunset();
                const shabbatCandles = sunset ? new Date(sunset.getTime() - shabbatCandleOffset * 60 * 1000) : null;

                // Get events for Friday & Saturday to get Parsha and other events
                const fridayEvents: Event[] = HebrewCalendar.calendar({ ...calendarOptions, start: friday, end: friday });
                const saturdayEvents: Event[] = HebrewCalendar.calendar({ ...calendarOptions, start: saturday, end: saturday });
                const shabbatEnd = zmanimShabbat.tzeit(); // Use tzeit() for a reliable Shabbat end time
                const parshaEvent = saturdayEvents.find((ev) => ev.getFlags() & flags.PARSHA_HASHAVUA);

                // Get Hebrew date for Shabbat
                const shabbatHebrewDate = new HDate(saturday);

                // Get Hebrew date for today (current)
                const currentHebrewDate = new HDate(now);

                // Get special events for Shabbat (holidays, fasts, etc.)
                const allShabbatEvents = [...fridayEvents, ...saturdayEvents];
                const specialEvents = allShabbatEvents
                    .filter(ev => {
                        const desc = ev.getDesc();
                        // Filter out standard weekly events that are displayed elsewhere
                        return desc !== 'Candle lighting' &&
                            desc !== 'Havdalah' &&
                            !(ev.getFlags() & flags.PARSHA_HASHAVUA);
                    })
                    .map(ev => removeNikud(ev.render('he')));

                const uniqueSpecialEvents = [...new Set(specialEvents)];

                // --- Weekdays calculations (Sun-Thu, or next week's Sun-Thu if today is Fri/Sat) ---
                let weekdaysEarliestSunset: Date | null = null;

                // Determine the Sunday-Thursday range
                const currentDay = now.getDay();
                const isWeekend = currentDay === 5 || currentDay === 6; // Friday or Saturday

                let weekdaysStart: Date;
                if (isWeekend) {
                    // If it's Friday or Saturday, use next week's Sunday-Thursday
                    const daysUntilNextSunday = currentDay === 5 ? 2 : 1; // Fri->Sun=2, Sat->Sun=1
                    weekdaysStart = new Date(now);
                    weekdaysStart.setDate(now.getDate() + daysUntilNextSunday);
                    weekdaysStart.setHours(12, 0, 0, 0);
                } else {
                    // Otherwise, use this week's Sunday (going back if necessary)
                    weekdaysStart = new Date(now);
                    weekdaysStart.setDate(now.getDate() - currentDay); // Go back to Sunday (day 0)
                    weekdaysStart.setHours(12, 0, 0, 0);
                }

                // Calculate sunset for Sunday through Thursday and find the earliest
                const sunsets: Date[] = [];
                for (let i = 0; i <= 4; i++) { // Days 0-4 (Sun-Thu)
                    const day = new Date(weekdaysStart);
                    day.setDate(weekdaysStart.getDate() + i);
                    const zmanimDay = new Zmanim(location, day, true);
                    const daySunset = zmanimDay.sunset();
                    if (daySunset) {
                        sunsets.push(daySunset);
                    }
                }

                if (sunsets.length > 0) {
                    weekdaysEarliestSunset = sunsets.reduce((earliest, current) =>
                        current < earliest ? current : earliest
                    );
                }

                const newZmanimData: ZmanimData = {
                    hebrewDate: removeNikud(shabbatHebrewDate.renderGematriya(true)),
                    parsha: parshaEvent ? removeNikud(parshaEvent.render('he')) : null,
                    holidayEvents: uniqueSpecialEvents,
                    // Current day zmanim (from zmanimToday)
                    sunrise: zmanimToday.sunrise() || null,
                    sunset: zmanimToday.sunset() || null,
                    // Friday zmanim
                    fridaySunrise: zmanimFriday.sunrise() || null,
                    fridaySunset: zmanimFriday.sunset() || null,
                    shabbatCandles: shabbatCandles,
                    shabbatEnd: shabbatEnd,
                    sofZmanShmaMGA: zmanimToday.sofZmanShmaMGA() || null,
                    sofZmanShmaGRA: zmanimToday.sofZmanShma() || null,
                    sofZmanTfillaMGA: zmanimToday.sofZmanTfillaMGA() || null,
                    sofZmanTfillaGRA: zmanimToday.sofZmanTfilla() || null,
                    alotHaShachar: zmanimToday.alotHaShachar() || null,
                    chatzot: zmanimToday.chatzot() || null,
                    minchaGedola: zmanimToday.minchaGedola() || null,
                    minchaKetana: zmanimToday.minchaKetana() || null,
                    plagHaMincha: zmanimToday.plagHaMincha() || null,
                    tzeit: zmanimToday.dusk() || null,
                    weekdaysEarliestSunset: weekdaysEarliestSunset,
                    currentHebrewDate: removeNikud(currentHebrewDate.renderGematriya(true)),
                };

                if (!newZmanimData.sunrise || !newZmanimData.sunset) {
                    throw new Error("Could not calculate sunrise/sunset from Hebcal library");
                }

                console.info('[useZmanim] Successfully calculated zmanim data', newZmanimData);
                setZmanimData(newZmanimData);
                setError(null);

            } catch (e: any) {
                console.error("[useZmanim] Error calculating Zmanim with @hebcal/core:", e);
                setError('לא ניתן היה לחשב את זמני היום');
            } finally {
                setLoading(false);
            }
        };

        if (latitude && longitude) {
            fetchZmanim(latitude, longitude);
            // Refresh every 10 minutes to keep zmanim up to date, and on day change
            const intervalId = setInterval(() => {
                console.info('[useZmanim] Refreshing zmanim data (interval)');
                fetchZmanim(latitude, longitude);
            }, 10 * 60 * 1000);
            return () => clearInterval(intervalId);
        } else {
            console.warn('[useZmanim] Missing latitude/longitude, skipping calculation');
        }

    }, [elevation, latitude, longitude, shabbatCandleOffset]);

    return { zmanimData, loading, error };
};