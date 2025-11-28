
import React from 'react';
import { EventItem as IEventItem, BoardSettings } from '../../../shared/types/types';
import { LAYOUT_CONSTANTS } from '../../../shared/constants/layout';

interface EventItemProps {
    event: IEventItem;
    time: string | null;
    settings: BoardSettings;
    isStriped: boolean;
    scale?: number;
    onClick?: () => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, time, settings, isStriped, scale = 1, onClick }) => {
    const getEventColor = () => {
        switch (event.type) {
            case 'prayer': return settings.prayerColor;
            case 'class': return settings.classColor;
            case 'freeText': return settings.freeTextColor;
            default: return 'inherit';
        }
    };

    return (
        <div
            className={`flex flex-col border-b border-gray-100 last:border-0 ${isStriped ? 'bg-gray-50' : 'bg-white'} ${onClick ? 'cursor-pointer hover:bg-blue-50' : ''}`}
            style={{
                fontSize: `${settings.eventTextScale * LAYOUT_CONSTANTS.EVENT.TEXT_SCALE_FACTOR * scale}px`,
                padding: `${LAYOUT_CONSTANTS.EVENT.PADDING_Y_PX * scale}px ${LAYOUT_CONSTANTS.EVENT.PADDING_X_PX * scale}px`
            }}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick();
                }
            }}
        >
            <div className="flex justify-between items-center w-full">
                <span
                    className={`truncate flex-1 ml-4 ${event.isHighlighted ? 'font-bold' : 'font-medium'} ${event.type === 'freeText' ? 'text-center w-full' : ''}`}
                    style={{ color: getEventColor() }}
                    title={event.name}
                >
                    {event.name}
                </span>
                {time && (
                    <span
                        className={`whitespace-nowrap text-left font-mono tracking-wider ${event.isHighlighted ? 'font-bold text-brand-dark' : 'font-medium text-brand-dark'}`}
                        dir="ltr"
                        style={{
                            minWidth: `${LAYOUT_CONSTANTS.EVENT.TIME_MIN_WIDTH_PX}px`,
                            color: getEventColor()
                        }}
                    >
                        {time}
                    </span>
                )}
            </div>
            {event.note && (
                <div
                    className="text-center w-full mt-1 opacity-80 truncate"
                    style={{ fontSize: '0.85em', color: getEventColor() }}
                >
                    {event.note}
                </div>
            )}
        </div>
    );
};

export default EventItem;
