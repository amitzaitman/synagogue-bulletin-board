import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EventItem, ZmanimKey, TimeDefinition } from '../../../shared/types/types';
import { EventItemSchema, EventItemFormData } from './eventSchema';

// --- Helper Icons ---
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const zmanimLabels: Record<ZmanimKey, string> = {
    sunrise: "זריחה (שבת)",
    sunset: "שקיעה (שבת)",
    fridaySunrise: "זריחה (שישי)",
    fridaySunset: "שקיעה (שישי)",
    shabbatCandles: "כניסת שבת",
    shabbatEnd: "צאת שבת"
};

const roundingIncrements = [
    { value: 5, label: "5 דקות" },
    { value: 10, label: "10 דקות" },
    { value: 15, label: "רבע שעה" },
];

const roundingDirections = [
    { value: 'nearest', label: "הקרוב ביותר" },
    { value: 'up', label: "למעלה" },
    { value: 'down', label: "למטה" },
];

interface EventFormProps {
    columnId: string;
    columnEvents: EventItem[];
    event?: EventItem;
    initialOrder?: number;
    onSave: (event: EventItem) => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
}

const EventForm: React.FC<EventFormProps> = ({ columnId, columnEvents, event, initialOrder, onSave, onCancel, onDelete }) => {
    const defaultTimeDef: TimeDefinition = { mode: 'absolute', absoluteTime: '12:00' };

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<EventItemFormData>({
        resolver: zodResolver(EventItemSchema),
        defaultValues: event ? {
            ...event,
            // Ensure timeDefinition exists if it's a timed event, or provide default
            timeDefinition: event.timeDefinition || defaultTimeDef
        } : {
            name: '',
            type: 'prayer',
            columnId,
            timeDefinition: defaultTimeDef,
            note: '',
            isHighlighted: false
        }
    });

    const eventType = watch('type');
    const timeMode = watch('timeDefinition.mode');
    const isTimedEvent = eventType === 'prayer' || eventType === 'class';
    const otherTimedEventsInColumn = columnEvents.filter(e => e.id !== event?.id && e.type !== 'freeText');

    // Watch for changes in type to reset/set timeDefinition
    useEffect(() => {
        if (eventType === 'freeText') {
            setValue('timeDefinition', undefined);
        } else {
            // If switching back to timed event and no timeDefinition, set default
            const currentObj = watch('timeDefinition');
            if (!currentObj) {
                setValue('timeDefinition', defaultTimeDef);
            }
        }
    }, [eventType, setValue, watch]);

    const onSubmit = (data: EventItemFormData) => {
        let newEventData = { ...data, columnId } as EventItem;

        if (!event) {
            // New event logic
            if (initialOrder !== undefined) {
                newEventData.order = initialOrder;
            } else {
                const maxOrder = columnEvents.length > 0 ? Math.max(...columnEvents.map(e => e.order)) : -1;
                newEventData.order = maxOrder + 1;
            }
            newEventData.id = Date.now().toString();
        } else {
            // Edit existing logic
            newEventData.id = event.id;
            newEventData.order = event.order;
        }

        onSave(newEventData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold">{event ? 'עריכת אירוע' : 'הוספת אירוע חדש'}</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        aria-label="סגור"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5">
                    <form onSubmit={handleSubmit(onSubmit)} id="event-form">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Event Type */}
                            <div>
                                <label className="block text-sm font-medium text-stone-800 mb-1">סוג אירוע</label>
                                <select
                                    {...register('type')}
                                    className="w-full border-2 border-stone-300 rounded-lg p-2 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                                >
                                    <option value="prayer">תפילה</option>
                                    <option value="class">אירוע</option>
                                    <option value="freeText">טקסט חופשי</option>
                                </select>
                            </div>

                            {/* Name / Content */}
                            <div>
                                <label className="block text-sm font-medium text-stone-800 mb-1">{isTimedEvent ? "שם האירוע" : "תוכן טקסט"}</label>
                                <input
                                    type="text"
                                    {...register('name')}
                                    placeholder={isTimedEvent ? "הזן שם אירוע..." : "הזן תוכן..."}
                                    className={`w-full border-2 rounded-lg p-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all ${errors.name ? 'border-red-500' : 'border-stone-300'}`}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            {/* Time Definition Section */}
                            {isTimedEvent && (
                                <fieldset className="col-span-1 md:col-span-2 space-y-3 p-4 bg-gradient-to-br from-stone-50 to-stone-100 border-2 border-stone-300 rounded-xl shadow-sm">
                                    <legend className="text-sm font-semibold text-stone-800 px-2 bg-white border border-stone-300 rounded-lg">הגדרת זמן</legend>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Time Mode Selection */}
                                        <div>
                                            <label className="block text-xs font-medium text-stone-700 mb-1">אופן הגדרת זמן</label>
                                            <Controller
                                                control={control}
                                                name="timeDefinition.mode"
                                                render={({ field }) => (
                                                    <select
                                                        {...field}
                                                        onChange={(e) => {
                                                            const newMode = e.target.value as TimeDefinition['mode'];
                                                            // Reset to default for the new mode
                                                            let newDef: TimeDefinition;
                                                            if (newMode === 'absolute') newDef = { mode: 'absolute', absoluteTime: '12:00' };
                                                            else if (newMode === 'relative') newDef = { mode: 'relative', relativeEventId: otherTimedEventsInColumn[0]?.id || '', offsetMinutes: 0 };
                                                            else newDef = { mode: 'relativeToZman', zman: 'sunset', offsetMinutes: 0 };
                                                            setValue('timeDefinition', newDef);
                                                        }}
                                                        className="w-full border-2 border-stone-300 rounded-lg p-2 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white"
                                                    >
                                                        <option value="absolute">זמן קבוע</option>
                                                        <option value="relative">זמן יחסי לאירוע אחר</option>
                                                        <option value="relativeToZman">זמן יחסי לזמן היום</option>
                                                    </select>
                                                )}
                                            />
                                        </div>

                                        {/* Absolute Time Input */}
                                        {timeMode === 'absolute' && (
                                            <div>
                                                <label className="block text-xs font-medium text-stone-700 mb-1">שעה</label>
                                                <input
                                                    type="time"
                                                    {...register('timeDefinition.absoluteTime')}
                                                    className="w-full border-2 border-stone-300 rounded-lg p-2 text-base font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                                                />
                                                {errors.timeDefinition && 'absoluteTime' in (errors.timeDefinition as any) && (
                                                    <p className="text-red-500 text-xs mt-1">{(errors.timeDefinition as any).absoluteTime.message}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Relative / Zman Inputs */}
                                        {(timeMode === 'relative' || timeMode === 'relativeToZman') && (
                                            <div className="col-span-1 sm:col-span-2 space-y-2">
                                                <div className="flex items-center gap-2 text-xs">
                                                    {/* Offset Magnitude & Sign Logic */}
                                                    <Controller
                                                        control={control}
                                                        name="timeDefinition.offsetMinutes"
                                                        render={({ field: { value, onChange } }) => {
                                                            const magnitude = Math.abs(value || 0);
                                                            const sign = (value || 0) < 0 ? -1 : 1;
                                                            return (
                                                                <>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={magnitude}
                                                                        onChange={(e) => onChange(parseInt(e.target.value || '0', 10) * sign)}
                                                                        className="border border-stone-300 rounded p-1 w-16 text-center text-sm"
                                                                        aria-label="Offset in minutes"
                                                                    />
                                                                    <span className="text-stone-700">דקות</span>
                                                                    <select
                                                                        value={sign === -1 ? 'before' : 'after'}
                                                                        onChange={(e) => onChange(magnitude * (e.target.value === 'before' ? -1 : 1))}
                                                                        className="border border-stone-300 rounded p-1 grow text-sm"
                                                                        aria-label="יחס תזמון"
                                                                    >
                                                                        <option value="after">אחרי</option>
                                                                        <option value="before">לפני</option>
                                                                    </select>
                                                                </>
                                                            );
                                                        }}
                                                    />
                                                </div>

                                                {/* Relative Event Selector */}
                                                {timeMode === 'relative' && (
                                                    <select
                                                        {...register('timeDefinition.relativeEventId')}
                                                        className="border border-stone-300 rounded p-1 w-full text-sm"
                                                    >
                                                        {otherTimedEventsInColumn.length === 0 && <option disabled value="">אין אירועים להצמדה</option>}
                                                        {otherTimedEventsInColumn.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                                    </select>
                                                )}

                                                {/* Zman Selector */}
                                                {timeMode === 'relativeToZman' && (
                                                    <select
                                                        {...register('timeDefinition.zman')}
                                                        className="border border-stone-300 rounded p-1 w-full text-sm"
                                                    >
                                                        {Object.entries(zmanimLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                                                    </select>
                                                )}

                                                {/* Rounding Options */}
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Controller
                                                        control={control}
                                                        name="timeDefinition.rounding"
                                                        render={({ field: { value, onChange } }) => (
                                                            <>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!value}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            onChange({ direction: 'nearest', increment: 5 });
                                                                        } else {
                                                                            onChange(undefined);
                                                                        }
                                                                    }}
                                                                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                                                    id="useRounding"
                                                                />
                                                                <label htmlFor="useRounding" className="font-medium text-stone-700 cursor-pointer">עיגול זמן</label>
                                                            </>
                                                        )}
                                                    />
                                                </div>

                                                {/* Rounding Details */}
                                                {watch('timeDefinition.rounding') && (
                                                    <fieldset className="p-2 border border-stone-300 rounded-md bg-white">
                                                        <legend className="text-xs font-medium text-stone-500 px-1">אפשרויות עיגול</legend>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <select
                                                                {...register('timeDefinition.rounding.direction')}
                                                                className="border-stone-300 rounded p-1 grow text-sm"
                                                            >
                                                                {roundingDirections.map(d => <option key={d.value} value={d.value}>לעגל ל{d.label}</option>)}
                                                            </select>
                                                            <select
                                                                {...register('timeDefinition.rounding.increment', { valueAsNumber: true })}
                                                                className="border-stone-300 rounded p-1 grow text-sm"
                                                            >
                                                                {roundingIncrements.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                                                            </select>
                                                        </div>
                                                    </fieldset>
                                                )}
                                            </div>
                                        )}

                                        {/* Note */}
                                        <div className="col-span-1 sm:col-span-2">
                                            <label className="block text-xs font-medium text-stone-700 mb-1">הערה (אופציונלי)</label>
                                            <input
                                                type="text"
                                                {...register('note')}
                                                placeholder="הזן הערה..."
                                                className="w-full border-2 border-stone-300 rounded-lg p-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                                            />
                                        </div>
                                    </div>
                                </fieldset>
                            )}

                            {/* Highlight Checkbox */}
                            <div className="col-span-1 md:col-span-2 flex items-center gap-2 p-2 bg-amber-50 rounded-lg border-2 border-amber-300">
                                <input
                                    type="checkbox"
                                    {...register('isHighlighted')}
                                    id="isHighlighted"
                                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                                <label htmlFor="isHighlighted" className="block text-sm font-medium text-stone-800 cursor-pointer">הדגש אירוע זה</label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="shrink-0 p-4 border-t-2 border-stone-200 bg-stone-50 flex justify-between items-center">
                    {event && (
                        <button
                            type="button"
                            onClick={() => onDelete(event.id)}
                            className="text-red-600 hover:text-white bg-red-50 hover:bg-red-600 text-sm font-bold flex items-center gap-2 py-2 px-4 rounded-lg border-2 border-red-600 transition-all shadow-sm hover:shadow-md"
                        >
                            <TrashIcon /> מחק אירוע
                        </button>
                    )}
                    <div className={`flex gap-2 ${event ? '' : 'w-full justify-end'}`}>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-sm font-bold py-2 px-5 rounded-lg border-2 border-stone-400 transition-all shadow-sm hover:shadow-md"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            form="event-form"
                            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 px-5 rounded-lg border-2 border-amber-600 transition-all shadow-md hover:shadow-lg"
                        >
                            שמור
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventForm;

