import React from 'react';
import { EventItem, BoardSettings } from '../../../shared/types/types';

// --- Helper Icons ---
const StarIcon = ({ filled = false }: { filled?: boolean }) => filled ?
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> :
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;

const DragHandleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400 group-hover:text-stone-600 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;

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

const EventRow: React.FC<EventRowProps> = ({
    event,
    displayTime,
    isLast,
    isEditMode,
    onEdit,
    onToggleHighlight,
    settings,
    onDragStart,
    onDragOver,
    onDrop,
    isDragging
}) => {
    const wrapperClasses = `relative transition-all duration-200 group flex items-center ${isDragging ? 'opacity-30' : ''} ${isEditMode ? 'border-2 border-dashed border-transparent hover:border-blue-400 hover:bg-blue-50/50 rounded-md p-1 -m-1 cursor-pointer' : ''}`;
    const highlightStyle = event.isHighlighted ? { backgroundColor: settings.highlightColor, borderRadius: '0.375rem' } : {};

    const getEventColor = () => {
        switch (event.type) {
            case 'prayer': return settings.prayerColor;
            case 'class': return settings.classColor;
            case 'freeText': return settings.freeTextColor;
            default: return '#000';
        }
    };
    const eventColor = getEventColor();
    const handleRowClick = () => isEditMode && onEdit(event.id);
    const handleButtonAction = (e: React.MouseEvent, action: () => void) => { e.stopPropagation(); action(); };

    // All text scaling is now handled by the parent container's fontSize
    const content = event.type === 'freeText' ? (
        <div className="flex-grow">
            <div className="py-[0.6em] flex items-center justify-center">
                <h3 className="leading-normal font-title text-center" style={{ color: eventColor, fontSize: '1.8em' }}>
                    {event.name}
                </h3>
            </div>
            {!isLast && <div className="h-[1px] bg-gradient-to-r from-amber-600/5 via-amber-600/20 to-amber-600/5" />}
        </div>
    ) : (
        <div className="flex-grow">
            <div className="py-[0.6em]">
                <div className="flex items-baseline justify-between">
                    <h3 className={`leading-normal font-title`} style={{ color: eventColor, fontSize: '1.8em' }}>
                        {event.name}
                    </h3>
                    <p className={`leading-normal font-mono tracking-wider`} style={{ color: displayTime ? eventColor : '#f87171', fontSize: '2em' }}>
                        {displayTime || '--:--'}
                    </p>
                </div>
                {event.note && (
                    <p className="leading-normal text-stone-600 mt-[0.1em] text-center w-full" style={{ fontSize: '1.3em' }}>{event.note}</p>
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
            {isEditMode && <div style={{ paddingLeft: '0.5em', paddingRight: '0.5em' }}><DragHandleIcon /></div>}
            {content}
            {isEditMode && (
                <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2" style={{ left: '-0.75em' }}>
                    <button
                        onClick={(e) => handleButtonAction(e, () => onToggleHighlight(event.id))}
                        className={`rounded-full ${event.isHighlighted ? 'bg-amber-400 text-white' : 'bg-stone-200 text-stone-600'} hover:bg-amber-300`}
                        style={{ padding: '0.375em' }}
                        title={event.isHighlighted ? 'בטל הדגשה' : 'הדגש'}
                    >
                        <StarIcon filled={!!event.isHighlighted} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default EventRow;
