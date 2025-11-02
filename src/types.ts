// types used across the app
export type EventType = 'prayer' | 'class' | 'freeText';

export type ColumnType = 'shabbat' | 'weekdays' | 'moed';

export interface Column {
  id: string;
  title: string;
  order: number;
  columnType: ColumnType; // shabbat = upcoming Shabbat, weekdays = Sun-Thu, moed = specific date
  specificDate?: string; // ISO date string (YYYY-MM-DD) - only used when columnType is 'moed'
}

// --- Time Definition Interfaces ---

export type ZmanimKey = 'shabbatCandles' | 'shabbatEnd' | 'sunrise' | 'sunset' | 'fridaySunrise' | 'fridaySunset';

export interface RoundingOptions {
  direction: 'up' | 'down' | 'nearest';
  increment: number; // in minutes
}

interface AbsoluteTime {
  mode: 'absolute';
  absoluteTime: string;
  // No rounding for absolute time
  rounding?: never;
}

interface RelativeToEventTime {
  mode: 'relative';
  relativeEventId: string;
  offsetMinutes: number;
  rounding?: RoundingOptions;
}

interface RelativeToZmanTime {
  mode: 'relativeToZman';
  zman: ZmanimKey;
  offsetMinutes: number;
  rounding?: RoundingOptions;
}

export type TimeDefinition = AbsoluteTime | RelativeToEventTime | RelativeToZmanTime;

// --- Main Interfaces ---

export interface EventItem {
  id:string;
  name: string;
  type: EventType;
  columnId: string;
  order: number;
  timeDefinition?: TimeDefinition;
  note?: string;
  isHighlighted?: boolean;
}

export interface ZmanimData {
    hebrewDate: string | null;
    parsha: string | null;
    holidayEvents: string[];
    // Shabbat day (Saturday) zmanim
    sunrise: Date | null;
    sunset: Date | null;
    // Friday zmanim (for candle lighting)
    fridaySunrise: Date | null;
    fridaySunset: Date | null;
    shabbatCandles: Date | null;
    shabbatEnd: Date | null;
    sofZmanShmaMGA: Date | null;
    sofZmanShmaGRA: Date | null;
    sofZmanTfillaMGA: Date | null;
    sofZmanTfillaGRA: Date | null;
    alotHaShachar: Date | null;
    chatzot: Date | null;
    minchaGedola: Date | null;
    minchaKetana: Date | null;
    plagHaMincha: Date | null;
    tzeit: Date | null;
    // For weekdays (Sun-Thu or next week if we're on Fri/Sat)
    weekdaysEarliestSunset: Date | null; // The earliest sunset in the weekday range
}

// Helper type for calculating zmanim for a specific date
export interface DateSpecificZmanim {
    date: Date;
    sunrise: Date | null;
    sunset: Date | null;
}

export interface BoardSettings {
  boardTitle?: string; // Title of the board
  slug?: string; // URL-friendly slug for the synagogue (e.g., "beit-knesset-hagadol")
  hasCompletedSetup?: boolean; // True if user has completed initial setup (seen welcome dialog)
  manualEventOrdering?: boolean; // If true, events are ordered manually; if false, auto-sorted by time
  scale: number;
  mainTitleSize: number; // as a percentage of base size
  columnTitleSize: number; // as a percentage of base size
  eventTextScale: number; // as a percentage of base size
  // Colors for text elements
  prayerColor: string;
  classColor: string;
  freeTextColor: string;
  columnTitleColor: string;
  mainTitleColor: string;
  highlightColor: string;
  // Background colors
  mainBackgroundColor: string; // צבע הרקע הכללי
  boardBackgroundColor: string; // צבע הרקע של הלוח
  columnBackgroundColor: string; // צבע הרקע של העמודות
  clockBackgroundColor: string; // צבע הרקע של השעון
  zmanimBackgroundColor: string; // צבע הרקע של פאנל הזמנים
  // Location and time settings
  shabbatCandleOffset: number; // minutes before sunset
  elevation?: number;
  latitude?: number;
  longitude?: number;
}
