import React from 'react';
import { Column as IColumn, EventItem as IEventItem, BoardSettings } from '../../../shared/types/types';
import SortableEventItem from './SortableEventItem';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LAYOUT_CONSTANTS } from '../../../shared/constants/layout';
import AddEventDivider from './AddEventDivider';

interface ColumnProps {
    column: IColumn;
    events: IEventItem[];
    settings: BoardSettings;
    calculatedTimes: Map<string, string>;
    contentScale?: number;
    onColumnClick?: () => void;
    onEventClick?: (event: IEventItem) => void;
    onAddEvent?: (columnId: string, order: number) => void;
    onEditColumnSettings?: () => void;
    className?: string;
}

const Column: React.FC<ColumnProps> = ({ column, events, settings, calculatedTimes, contentScale = 1, onColumnClick, onEventClick, onAddEvent, onEditColumnSettings, className }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: settings.columnBackgroundColor,
        opacity: isDragging ? 0.5 : 1,
    };

    const isMessagesColumn = column.columnType === 'messages';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex flex-col h-full rounded-lg shadow-lg overflow-hidden border border-gray-200 transition-colors ${!isDragging ? 'hover:border-brand-accent' : ''} ${className || ''}`}
            onClick={onColumnClick}
        >
            {/* Column Header */}
            <div
                className={`bg-brand-accent text-white text-center relative group cursor-grab active:cursor-grabbing`}
                style={{ padding: `${LAYOUT_CONSTANTS.COLUMN.HEADER_PADDING_Y_PX * contentScale}px ${LAYOUT_CONSTANTS.COLUMN.HEADER_PADDING_X_PX * contentScale}px` }} // py-3 px-4 scaled
                {...attributes}
                {...listeners}
            >
                {/* Settings Button (visible on hover) */}
                <button
                    className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 rounded"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onEditColumnSettings) onEditColumnSettings();
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>

                <h2
                    className="truncate select-none"
                    style={{
                        fontSize: `${settings.columnTitleSize * LAYOUT_CONSTANTS.COLUMN.TITLE_SCALE_FACTOR * contentScale}px`,
                        color: settings.columnTitleColor
                    }}
                >
                    {column.title}
                </h2>
                {column.specificDate && (
                    <div
                        className="opacity-90 mt-1"
                        style={{ fontSize: `${LAYOUT_CONSTANTS.COLUMN.DATE_FONT_SIZE_REM * contentScale}rem` }} // text-sm scaled
                    >
                        {column.specificDate}
                    </div>
                )}
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                <SortableContext items={events.map(e => e.id)} strategy={verticalListSortingStrategy}>
                    {events.length > 0 ? (
                        <div className="flex flex-col">
                            {events.map((event, index) => (
                                <React.Fragment key={event.id}>
                                    <SortableEventItem
                                        event={event}
                                        time={!isMessagesColumn ? (calculatedTimes.get(event.id) ?? null) : null}
                                        settings={settings}
                                        isStriped={!isMessagesColumn && index % 2 === 0}
                                        scale={contentScale}
                                        onClick={onEventClick ? () => onEventClick(event) : undefined}
                                        className={isMessagesColumn ? 'text-center text-lg font-medium py-4' : ''}
                                    />

                                    {/* Divider after each item */}
                                    <AddEventDivider onClick={() => onAddEvent && onAddEvent(column.id, index + 1)} />
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400 italic">
                            אין אירועים
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

export default Column;
