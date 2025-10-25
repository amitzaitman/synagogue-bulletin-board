import React, { useState } from 'react';
import { EventItem, Column, BoardSettings, TimeDefinition, ZmanimKey, RoundingOptions } from '../types';

// --- Helper Components & Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const StarIcon = ({ filled = false }: { filled?: boolean }) => filled ? 
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> : 
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const DragHandleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400 group-hover:text-stone-600 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;

const zmanimLabels: Record<ZmanimKey, string> = {
    sunrise: "זריחה (שבת)",
    sunset: "שקיעה (שבת)",
    fridaySunrise: "זריחה (שישי)",
    fridaySunset: "שקיעה (שישי)",
    shabbatCandles: "כניסת שבת",
    shabbatEnd: "צאת שבת"
};
const roundingIncrements = [
    { value: 5, label: "5 דקות" }, { value: 10, label: "10 דקות" }, { value: 15, label: "רבע שעה" },
];
const roundingDirections = [
    { value: 'nearest', label: "הקרוב ביותר" }, { value: 'up', label: "למעלה" }, { value: 'down', label: "למטה" },
]


// Inline Edit/Add Form Component
interface InlineEventFormProps {
    columnId: string;
    columnEvents: EventItem[];
    event?: EventItem; // if present, it's an edit form
    onSave: (event: EventItem) => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
}
const InlineEventForm: React.FC<InlineEventFormProps> = ({ columnId, columnEvents, event, onSave, onCancel, onDelete }) => {
    const [formData, setFormData] = useState<Partial<EventItem>>(() => {
        if (event) return { ...event };
        const defaultTimeDef: TimeDefinition = { mode: 'absolute', absoluteTime: '12:00' };
        return { name: '', type: 'prayer', timeDefinition: defaultTimeDef, note: '', isHighlighted: false };
    });
    const [useRounding, setUseRounding] = useState(() => !!event?.timeDefinition?.rounding);

    const isTimedEvent = formData.type === 'prayer' || formData.type === 'class';
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => {
            const updatedData = { ...prev };
            const finalValue = type === 'checkbox' ? checked : value;

            const handleTimeDefChange = (changes: Partial<TimeDefinition>) => {
                updatedData.timeDefinition = { ...updatedData.timeDefinition!, ...changes } as TimeDefinition;
            };
            
            const handleRoundingChange = (changes: Partial<RoundingOptions>) => {
                if (updatedData.timeDefinition && (updatedData.timeDefinition.mode === 'relative' || updatedData.timeDefinition.mode === 'relativeToZman')) {
                    const currentRounding = updatedData.timeDefinition.rounding || { direction: 'nearest', increment: 5 };
                    updatedData.timeDefinition.rounding = { ...currentRounding, ...changes };
                }
            }

            const handleToggleRounding = (enabled: boolean) => {
                setUseRounding(enabled);
                const updated = { ...prev };
                if (updated.timeDefinition) {
                    if (enabled) {
                        updated.timeDefinition.rounding = { direction: 'nearest', increment: 5 };
                    } else {
                        delete updated.timeDefinition.rounding;
                    }
                }
                return updated;
            }

            switch (name) {
                case 'useRounding':
                    return handleToggleRounding(checked);
                case 'offsetMagnitude': {
                    const magnitude = Math.max(0, parseInt(value, 10) || 0);
                    // Only read offsetMinutes if the current timeDefinition supports it
                    let currentOffset = 0;
                    if (updatedData.timeDefinition && (updatedData.timeDefinition.mode === 'relative' || updatedData.timeDefinition.mode === 'relativeToZman')) {
                        currentOffset = (updatedData.timeDefinition as any).offsetMinutes ?? 0;
                    }
                    const currentSign = currentOffset < 0 ? -1 : 1;
                    handleTimeDefChange({ offsetMinutes: magnitude * currentSign });
                    break;
                }
                case 'offsetSign': {
                    const sign = value === 'before' ? -1 : 1;
                    let currentMagnitude = 0;
                    if (updatedData.timeDefinition && (updatedData.timeDefinition.mode === 'relative' || updatedData.timeDefinition.mode === 'relativeToZman')) {
                        currentMagnitude = Math.abs((updatedData.timeDefinition as any).offsetMinutes ?? 0);
                    }
                    handleTimeDefChange({ offsetMinutes: currentMagnitude * sign });
                    break;
                }
                case 'timeMode': {
                    const newMode = finalValue as TimeDefinition['mode'];
                    const otherTimedEvents = columnEvents.filter(e => e.id !== event?.id && e.type !== 'freeText');
                    
                    let newTimeDef: TimeDefinition;

                    // When creating a relative time definition default to rounding up in 5-minute increments
                    // to match common expectations (e.g. 8:12 -> 8:15 when rounding up by 5).
                    switch(newMode) {
                        case 'absolute': newTimeDef = { mode: 'absolute', absoluteTime: '12:00' }; break;
                        case 'relative': newTimeDef = { mode: 'relative', relativeEventId: otherTimedEvents[0]?.id || '', offsetMinutes: 0 }; break;
                        case 'relativeToZman': newTimeDef = { mode: 'relativeToZman', zman: 'sunset', offsetMinutes: 0 }; break;
                        default: newTimeDef = { mode: 'absolute', absoluteTime: '12:00' };
                    }
                    updatedData.timeDefinition = newTimeDef;
                    setUseRounding(false);
                    break;
                }
                case 'absoluteTime': case 'relativeEventId': case 'zman':
                    handleTimeDefChange({ [name]: finalValue });
                    break;
                case 'roundingIncrement':
                    handleRoundingChange({ increment: parseInt(value, 10) });
                    break;
                case 'roundingDirection':
                    handleRoundingChange({ direction: value as RoundingOptions['direction'] });
                    break;
                case 'type':
                    updatedData.type = finalValue as EventItem['type'];
                    if (finalValue === 'freeText') {
                        delete updatedData.timeDefinition; delete updatedData.note;
                    } else if (!updatedData.timeDefinition) {
                        updatedData.timeDefinition = { mode: 'absolute', absoluteTime: '12:00' };
                    }
                    break;
                default: (updatedData as any)[name] = finalValue; break;
            }

            return updatedData;
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleSave called', formData);
        if (!formData.name) {
            console.log('formData.name is empty, returning');
            return;
        }
        
        let newEventData = { ...formData, columnId } as EventItem;
        if (!event) {
            const maxOrder = columnEvents.length > 0 ? Math.max(...columnEvents.map(e => e.order)) : -1;
            newEventData.order = maxOrder + 1;
            newEventData.id = Date.now().toString();
        } else {
            newEventData.id = event.id;
            newEventData.order = event.order;
        }

        console.log('calling onSave with', newEventData);
        onSave(newEventData);
    };
    
    const otherTimedEventsInColumn = columnEvents.filter(e => e.id !== event?.id && e.type !== 'freeText');
    const timeDef = formData.timeDefinition;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] overflow-hidden flex flex-col">
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
                    <form onSubmit={handleSave} id="event-form">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-800 mb-1">סוג אירוע</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="w-full border-2 border-stone-300 rounded-lg p-2 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all">
                                    <option value="prayer">תפילה</option>
                                    <option value="class">שיעור</option>
                                    <option value="freeText">טקסט חופשי</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-800 mb-1">{isTimedEvent ? "שם האירוע" : "תוכן טקסט"}</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder={isTimedEvent ? "הזן שם אירוע..." : "הזן תוכן..."} required className="w-full border-2 border-stone-300 rounded-lg p-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"/>
                            </div>


                            {isTimedEvent && (
                                <fieldset className="col-span-2 space-y-3 p-4 bg-gradient-to-br from-stone-50 to-stone-100 border-2 border-stone-300 rounded-xl shadow-sm">
                                    <legend className="text-sm font-semibold text-stone-800 px-2 bg-white border border-stone-300 rounded-lg">הגדרת זמן</legend>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-stone-700 mb-1">אופן הגדרת זמן</label>
                                            <select name="timeMode" value={timeDef?.mode} onChange={handleChange} className="w-full border-2 border-stone-300 rounded-lg p-2 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white">
                                                <option value="absolute">זמן קבוע</option>
                                                <option value="relative">זמן יחסי לאירוע אחר</option>
                                                <option value="relativeToZman">זמן יחסי לזמן היום</option>
                                            </select>
                                        </div>

                                        {timeDef?.mode === 'absolute' && (
                                            <div>
                                                <label className="block text-xs font-medium text-stone-700 mb-1">שעה</label>
                                                <input type="time" name="absoluteTime" value={timeDef.absoluteTime || ''} onChange={handleChange} required className="w-full border-2 border-stone-300 rounded-lg p-2 text-base font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"/>
                                            </div>
                                        )}
                                        {(timeDef?.mode === 'relative' || timeDef?.mode === 'relativeToZman') && (
                                            <div className="col-span-2 space-y-2">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <input type="number" name="offsetMagnitude" min="0" value={Math.abs(timeDef.offsetMinutes ?? 0)} onChange={handleChange} className="border border-stone-300 rounded p-1 w-16 text-center text-sm" aria-label="Offset in minutes" />
                                                    <span className="text-stone-700">דקות</span>
                                                    <select name="offsetSign" value={(timeDef.offsetMinutes ?? 0) < 0 ? 'before' : 'after'} onChange={handleChange} className="border border-stone-300 rounded p-1 grow text-sm" aria-label="Timing relation">
                                                        <option value="after">אחרי</option>
                                                        <option value="before">לפני</option>
                                                    </select>
                                                </div>
                                                { timeDef.mode === 'relative' && (
                                                    <select name="relativeEventId" value={timeDef.relativeEventId || ''} onChange={handleChange} className="border border-stone-300 rounded p-1 w-full text-sm">
                                                        {otherTimedEventsInColumn.length === 0 && <option disabled>אין אירועים להצמדה</option>}
                                                        {otherTimedEventsInColumn.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                                    </select>
                                                )}
                                                { timeDef.mode === 'relativeToZman' && (
                                                    <select name="zman" value={timeDef.zman} onChange={handleChange} className="border border-stone-300 rounded p-1 w-full text-sm">
                                                        {Object.entries(zmanimLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                                                    </select>
                                                )}
                                                <div className="flex items-center gap-2 text-xs">
                                                    <input id={`useRounding-${event?.id || 'new'}`} type="checkbox" name="useRounding" checked={useRounding} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                                                    <label htmlFor={`useRounding-${event?.id || 'new'}`} className="font-medium text-stone-700 cursor-pointer">עיגול זמן</label>
                                                </div>
                                                {useRounding && (
                                                    <fieldset className="p-2 border border-stone-300 rounded-md bg-white">
                                                        <legend className="text-xs font-medium text-stone-500 px-1">אפשרויות עיגול</legend>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <label htmlFor={`roundingDirection-${event?.id || 'new'}`} className="sr-only">כיוון עיגול</label>
                                                            <select id={`roundingDirection-${event?.id || 'new'}`} name="roundingDirection" value={timeDef.rounding?.direction || 'up'} onChange={handleChange} className="border-stone-300 rounded p-1 grow text-sm">
                                                                {roundingDirections.map(d => <option key={d.value} value={d.value}>לעגל ל{d.label}</option>)}
                                                            </select>
                                                            <label htmlFor={`roundingIncrement-${event?.id || 'new'}`} className="sr-only">דיוק עיגול</label>
                                                            <select id={`roundingIncrement-${event?.id || 'new'}`} name="roundingIncrement" value={timeDef.rounding?.increment || 5} onChange={handleChange} className="border-stone-300 rounded p-1 grow text-sm">
                                                                {roundingIncrements.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                                                            </select>
                                                        </div>
                                                    </fieldset>
                                                )}
                                            </div>
                                        )}
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-stone-700 mb-1">הערה (אופציונלי)</label>
                                            <input type="text" name="note" value={formData.note || ''} onChange={handleChange} placeholder="הזן הערה..." className="w-full border-2 border-stone-300 rounded-lg p-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"/>
                                        </div>
                                    </div>
                                </fieldset>
                            )}

                            <div className="col-span-2 flex items-center gap-2 p-2 bg-amber-50 rounded-lg border-2 border-amber-300">
                                <input id={`highlight-${event?.id || 'new'}`} type="checkbox" name="isHighlighted" checked={!!formData.isHighlighted} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                                <label htmlFor={`highlight-${event?.id || 'new'}`} className="block text-sm font-medium text-stone-800 cursor-pointer">הדגש אירוע זה</label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="shrink-0 p-4 border-t-2 border-stone-200 bg-stone-50 flex justify-between items-center">
                    {event && (
                        <button type="button" onClick={() => onDelete(event.id)} className="text-red-600 hover:text-white bg-red-50 hover:bg-red-600 text-sm font-bold flex items-center gap-2 py-2 px-4 rounded-lg border-2 border-red-600 transition-all shadow-sm hover:shadow-md">
                            <TrashIcon /> מחק אירוע
                        </button>
                    )}
                    <div className={`flex gap-2 ${event ? '' : 'w-full justify-end'}`}>
                        <button type="button" onClick={onCancel} className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-sm font-bold py-2 px-5 rounded-lg border-2 border-stone-400 transition-all shadow-sm hover:shadow-md">ביטול</button>
                        <button type="submit" form="event-form" className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 px-5 rounded-lg border-2 border-amber-600 transition-all shadow-md hover:shadow-lg">שמור</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Event Row Component
interface EventRowProps {
    event: EventItem;
    displayTime: string | null;
    isLast: boolean;
    isEditMode: boolean;
    onEdit: (id: string) => void;
    onToggleHighlight: (id: string) => void;
    settings: BoardSettings;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, eventId: string) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, targetEvent: EventItem) => void;
    isDragging: boolean;
}
const EventRow: React.FC<EventRowProps> = ({ event, displayTime, isLast, isEditMode, onEdit, onToggleHighlight, settings, onDragStart, onDragOver, onDrop, isDragging }) => {
    const wrapperClasses = `relative transition-all duration-200 group flex items-center ${isDragging ? 'opacity-30' : ''} ${isEditMode ? 'border-2 border-dashed border-transparent hover:border-blue-400 hover:bg-blue-50/50 rounded-md p-1 -m-1 cursor-pointer' : ''}`;
    const highlightStyle = event.isHighlighted ? { backgroundColor: settings.highlightColor, borderRadius: '0.375rem' } : {};
    
    const getEventColor = () => {
        switch(event.type) {
            case 'prayer': return settings.prayerColor;
            case 'class': return settings.classColor;
            case 'freeText': return settings.freeTextColor;
            default: return '#000';
        }
    };
    const eventColor = getEventColor();
    const handleRowClick = () => isEditMode && onEdit(event.id);
    const handleButtonAction = (e: React.MouseEvent, action: () => void) => { e.stopPropagation(); action(); };

    const textScale = (settings.eventTextScale || 100) / 100;

    const content = event.type === 'freeText' ? (
        <div className="flex-grow">
            <div className="py-[0.6em] flex items-center justify-center">
                <h3 className="leading-normal font-title text-center" style={{ color: eventColor, fontSize: `${1.8 * textScale}em` }}>
                    {event.name}
                </h3>
            </div>
            {!isLast && <div className="h-[1px] bg-gradient-to-r from-amber-600/5 via-amber-600/20 to-amber-600/5" />}
        </div>
    ) : (
        <div className="flex-grow">
            <div className="py-[0.6em]">
                <div className="flex items-baseline justify-between">
                    <h3 className={`leading-normal font-title`} style={{ color: eventColor, fontSize: `${1.8 * textScale}em` }}>
                        {event.name}
                    </h3>
                    <p className={`leading-normal font-mono tracking-wider`} style={{ color: displayTime ? eventColor : '#f87171', fontSize: `${2 * textScale}em` }}>
                        {displayTime || '--:--'}
                    </p>
                </div>
                {event.note && (
                    <p className="leading-normal text-stone-600 mt-[0.1em] text-center w-full" style={{ fontSize: `${1.3 * textScale}em` }}>{event.note}</p>
                )}
            </div>
            {!isLast && <div className="h-[1px] bg-gradient-to-r from-amber-600/5 via-amber-600/20 to-amber-600/5" />}
        </div>
    );

    return (
        <div 
          className={wrapperClasses} 
          style={highlightStyle}
          draggable={isEditMode}
          onDragStart={(e) => onDragStart(e, event.id)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, event)}
          onClick={handleRowClick}
        >
            {isEditMode && <div className="px-2"><DragHandleIcon /></div>}
            {content}
            {isEditMode && (
                <div className="absolute top-1/2 -translate-y-1/2 -left-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => handleButtonAction(e, () => onToggleHighlight(event.id))} 
                        className={`p-1.5 rounded-full ${event.isHighlighted ? 'bg-amber-400 text-white' : 'bg-stone-200 text-stone-600'} hover:bg-amber-300`}
                        title={event.isHighlighted ? 'בטל הדגשה' : 'הדגש'}
                    >
                        <StarIcon filled={!!event.isHighlighted} />
                    </button>
                </div>
            )}
        </div>
    );
};


// --- Main Column View Component ---

interface ColumnViewProps {
    column: Column;
    events: EventItem[];
    settings: BoardSettings;
    isEditMode: boolean;
    editingItemId: string | null;
    inlineAddEvent: { columnId: string } | null;
    calculatedTimes: Map<string, string | null>;
    draggingItemId: string | null;
    onEditEvent: (id: string) => void;
    onCancelEdit: () => void;
    onSaveEvent: (event: EventItem) => void;
    onDeleteEvent: (id: string) => void;
    onToggleHighlight: (id: string) => void;
    onEventDragStart: (e: React.DragEvent<HTMLDivElement>, eventId: string) => void;
    onEventDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onEventDrop: (e: React.DragEvent<HTMLDivElement>, targetEvent: EventItem) => void;

    editingColumn?: { id: string, title: string, columnType: string, specificDate?: string } | null;
    onEditColumnTitleChange?: (title: string) => void;
    onEditColumnTypeChange?: (columnType: 'shabbat' | 'weekdays' | 'moed') => void;
    onEditSpecificDateChange?: (date: string) => void;
    onSaveColumnTitle?: () => void;
    onSetEditingColumn?: () => void;
    onDeleteColumn?: (id: string) => void;
    canDeleteColumn?: boolean;
    onAddNewEvent: () => void;

    onColumnDragStart?: (e: React.DragEvent, columnId: string) => void;
    onColumnDragEnd?: () => void;
    draggingColumnId?: string | null;
}

const ColumnView: React.FC<ColumnViewProps> = (props) => {
    const {
        column, events, settings, isEditMode, editingItemId, inlineAddEvent, calculatedTimes, draggingItemId,
        onEditEvent, onCancelEdit, onSaveEvent, onDeleteEvent, onToggleHighlight,
        onEventDragStart, onEventDragOver, onEventDrop,
        editingColumn, onEditColumnTitleChange, onEditColumnTypeChange, onEditSpecificDateChange, onSaveColumnTitle, onSetEditingColumn, onDeleteColumn, onAddNewEvent,
        onColumnDragStart, onColumnDragEnd
    } = props;
    
    const titleFontSize = `${2.8 * (settings.columnTitleSize / 100)}em`;

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSaveColumnTitle?.();
        } else if (e.key === 'Escape') {
             // Revert changes and exit edit mode for title. BoardView needs to handle revert logic.
             onSetEditingColumn?.();
        }
    };

    const getColumnTypeLabel = (type: string) => {
        switch(type) {
            case 'shabbat': return 'שבת';
            case 'weekdays': return 'ימות השבוע';
            case 'moed': return 'מועד';
            default: return type;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <header
                className={`text-center py-1 flex flex-col items-center justify-center gap-1`}
                draggable={isEditMode && !!onColumnDragStart && !editingColumn}
                onDragStart={isEditMode && onColumnDragStart && !editingColumn ? (e) => onColumnDragStart(e, column.id) : undefined}
                onDragEnd={isEditMode && onColumnDragEnd ? onColumnDragEnd : undefined}
            >
                {isEditMode && editingColumn?.id === column.id ? (
                    <div className="flex flex-col gap-2 w-full px-2">
                        <input
                            type="text"
                            value={editingColumn.title}
                            onChange={(e) => onEditColumnTitleChange?.(e.target.value)}
                            onKeyDown={handleTitleKeyDown}
                            placeholder="שם העמודה"
                            className="text-center bg-white/80 border-2 border-amber-500 rounded focus:outline-none p-2 font-title text-sm"
                            style={{ color: settings.columnTitleColor }}
                        />
                        <select
                            value={editingColumn.columnType}
                            onChange={(e) => onEditColumnTypeChange?.(e.target.value as 'shabbat' | 'weekdays' | 'moed')}
                            className="text-center bg-white/80 border-2 border-amber-400 rounded focus:outline-none p-1 text-xs"
                            dir="rtl"
                        >
                            <option value="shabbat">שבת (השבת הקרובה)</option>
                            <option value="weekdays">ימות השבוע (א׳-ה׳)</option>
                            <option value="moed">מועד (תאריך ספציפי)</option>
                        </select>
                        {editingColumn.columnType === 'moed' && (
                            <input
                                type="date"
                                value={editingColumn.specificDate || ''}
                                onChange={(e) => onEditSpecificDateChange?.(e.target.value)}
                                className="text-center bg-white/80 border-2 border-amber-400 rounded focus:outline-none p-1 text-xs"
                            />
                        )}
                        <div className="flex gap-1 justify-center">
                            <button
                                onClick={onSaveColumnTitle}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded"
                            >
                                שמור
                            </button>
                            <button
                                onClick={() => onSetEditingColumn?.()}
                                className="bg-stone-300 hover:bg-stone-400 text-stone-700 text-xs font-bold py-1 px-3 rounded"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2
                            className="font-title cursor-pointer hover:opacity-80"
                            style={{ fontSize: titleFontSize, color: settings.columnTitleColor }}
                            onClick={isEditMode && onSetEditingColumn ? (e) => { e.stopPropagation(); onSetEditingColumn(); } : undefined}
                        >
                            {column.title}
                        </h2>
                        {isEditMode && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-stone-500">
                                    {getColumnTypeLabel(column.columnType)}
                                    {column.columnType === 'moed' && column.specificDate && (
                                        <span className="mr-1">({new Date(column.specificDate).toLocaleDateString('he-IL')})</span>
                                    )}
                                </span>
                                <button onClick={(e) => { e.stopPropagation(); onSetEditingColumn?.(); }} className="text-stone-400 hover:text-stone-800 p-0.5" title="ערוך עמודה">
                                    <PencilIcon />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteColumn?.(column.id);}} className="text-red-500 hover:text-red-700 p-0.5" title="מחק עמודה">
                                    <TrashIcon />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </header>

            <div className={`events-list flex-grow ${isEditMode ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                {events.map((event, index) => (
                    editingItemId === event.id ? (
                        <InlineEventForm 
                            key={event.id}
                            columnId={column.id}
                            columnEvents={events}
                            event={event}
                            onSave={onSaveEvent}
                            onCancel={onCancelEdit}
                            onDelete={onDeleteEvent}
                        />
                    ) : (
                        <EventRow
                            key={event.id}
                            event={event}
                            displayTime={calculatedTimes.get(event.id) ?? null}
                            isLast={index === events.length - 1}
                            isEditMode={isEditMode}
                            onEdit={onEditEvent}
                            onToggleHighlight={onToggleHighlight}
                            settings={settings}
                            onDragStart={onEventDragStart}
                            onDragOver={onEventDragOver}
                            onDrop={onEventDrop}
                            isDragging={draggingItemId === event.id}
                        />
                    )
                ))}
                 {inlineAddEvent && inlineAddEvent.columnId === column.id && (
                    <InlineEventForm
                        columnId={column.id}
                        columnEvents={events}
                        onSave={onSaveEvent}
                        onCancel={onCancelEdit}
                        onDelete={onDeleteEvent} // Not used for new event
                    />
                )}
            </div>
            {isEditMode && (
                <div className="mt-2 pt-2 border-t border-amber-600/10">
                    <button 
                      onClick={onAddNewEvent}
                      className="flex items-center justify-center gap-2 w-full bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2 px-3 rounded-lg shadow-sm transition"
                    >
                      <PlusIcon />
                      <span>הוסף אירוע</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ColumnView;