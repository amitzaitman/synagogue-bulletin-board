import { z } from 'zod';


// Enums
const EventTypeEnum = z.enum(['prayer', 'class', 'freeText']);
const ZmanimKeyEnum = z.enum(['shabbatCandles', 'shabbatEnd', 'sunrise', 'sunset', 'fridaySunrise', 'fridaySunset']);
const RoundingDirectionEnum = z.enum(['up', 'down', 'nearest']);

// Rounding Schema
const RoundingOptionsSchema = z.object({
    direction: RoundingDirectionEnum,
    increment: z.number().positive(),
});

// Time Definition Schemas
const AbsoluteTimeSchema = z.object({
    mode: z.literal('absolute'),
    absoluteTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

const RelativeToEventTimeSchema = z.object({
    mode: z.literal('relative'),
    relativeEventId: z.string().min(1, "Must select an event"),
    offsetMinutes: z.number(),
    rounding: RoundingOptionsSchema.optional(),
});

const RelativeToZmanTimeSchema = z.object({
    mode: z.literal('relativeToZman'),
    zman: ZmanimKeyEnum,
    offsetMinutes: z.number(),
    rounding: RoundingOptionsSchema.optional(),
});

const TimeDefinitionSchema = z.discriminatedUnion('mode', [
    AbsoluteTimeSchema,
    RelativeToEventTimeSchema,
    RelativeToZmanTimeSchema,
]);

// Main Event Item Schema
export const EventItemSchema = z.object({
    id: z.string().optional(), // Optional because it might be new
    name: z.string().min(1, "Name is required"),
    type: EventTypeEnum,
    columnId: z.string(),
    order: z.number().optional(), // Optional for form, set on save
    timeDefinition: TimeDefinitionSchema.optional(),
    note: z.string().optional(),
    isHighlighted: z.boolean().optional(),
}).refine((data) => {
    if (data.type !== 'freeText' && !data.timeDefinition) {
        return false;
    }
    return true;
}, {
    message: "Time definition is required for this event type",
    path: ["timeDefinition"],
});

export type EventItemFormData = z.infer<typeof EventItemSchema>;
