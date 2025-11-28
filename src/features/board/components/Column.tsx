import React from 'react';
import { Column as IColumn, EventItem as IEventItem, BoardSettings } from '../../../shared/types/types';
import SortableEventItem from './SortableEventItem';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LAYOUT_CONSTANTS } from '../../../shared/constants/layout';

interface ColumnProps {
    column: IColumn;
    events: IEventItem[];
    settings: BoardSettings;
    calculatedTimes: Map<string, string>;
    contentScale?: number;
    onColumnClick?: () => void;
    onEventClick?: (event: IEventItem) => void;
}

const Column: React.FC<ColumnProps> = ({ column, events, settings, calculatedTimes, contentScale = 1, onColumnClick, onEventClick }) => {
    return (
        <div
            className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-brand-accent transition-colors"
            onClick={onColumnClick}
        >
            {/* Column Header */}
            <div
                className="bg-brand-accent text-white text-center"
                style={{ padding: `${LAYOUT_CONSTANTS.COLUMN.HEADER_PADDING_Y_PX * contentScale}px ${LAYOUT_CONSTANTS.COLUMN.HEADER_PADDING_X_PX * contentScale}px` }} // py-3 px-4 scaled
            >
                <h2
                    className="font-bold truncate"
                    style={{ fontSize: `${settings.columnTitleSize * LAYOUT_CONSTANTS.COLUMN.TITLE_SCALE_FACTOR * contentScale}px` }}
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
                        events.map((event, index) => (
                            <SortableEventItem
                                key={event.id}
                                event={event}
                                time={calculatedTimes.get(event.id) ?? null}
                                settings={settings}
                                isStriped={index % 2 === 0}
                                scale={contentScale}
                                onClick={onEventClick ? () => onEventClick(event) : undefined}
                            />
                        ))
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
