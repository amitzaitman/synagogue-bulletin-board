
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
    className?: string;
    fontSize?: number;
}

const EventItem: React.FC<EventItemProps> = ({ event, time, settings, isStriped, scale = 1, onClick, className, fontSize }) => {
    const getEventColor = () => {
        switch (event.type) {
            case 'prayer': return settings.prayerColor;
            case 'class': return settings.classColor;
            case 'freeText': return settings.freeTextColor;
            default: return 'inherit';
        }
    };

    // Calculate font size: use override if provided (as percentage), otherwise use settings
    const calculatedFontSize = fontSize
        ? `${(fontSize / 100) * LAYOUT_CONSTANTS.EVENT.TEXT_SCALE_FACTOR * scale}rem`
        : `${settings.eventTextScale * LAYOUT_CONSTANTS.EVENT.TEXT_SCALE_FACTOR * scale}px`;

    return (
        <div
            className={`flex flex-col border-b border-gray-100 last:border-0 ${isStriped ? 'bg-gray-50' : 'bg-white'} ${onClick ? 'cursor-pointer hover:bg-blue-50' : ''} ${className || ''}`}
            style={{
                fontSize: calculatedFontSize,
                padding: `${(settings.eventPaddingY ?? LAYOUT_CONSTANTS.EVENT.PADDING_Y_PX) * scale}px ${(settings.eventPaddingX ?? LAYOUT_CONSTANTS.EVENT.PADDING_X_PX) * scale}px`,
            }}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick();
                }
            }}
        >
            <div className="flex justify-between items-start gap-3 w-full">
                <span
                    className={`min-w-0 flex-1 whitespace-normal break-words leading-tight ${event.isHighlighted ? 'font-bold' : 'font-medium'} ${event.type === 'freeText' ? 'text-center w-full' : 'ml-4'}`}
                    style={{ color: getEventColor() }}
                    title={event.name}
                >
                    {event.name}
                </span>
                {time && (
                    <span
                        className={`shrink-0 whitespace-nowrap text-left font-mono tracking-wider ${event.isHighlighted ? 'font-bold text-brand-dark' : 'font-medium text-brand-dark'}`}
                        dir="ltr"
                        style={{
                            minWidth: `${LAYOUT_CONSTANTS.EVENT.TIME_MIN_WIDTH_PX * scale}px`,
                            color: getEventColor()
                        }}
                    >
                        {time}
                    </span>
                )}
            </div>
            {event.note && (
                <div
                    className="text-center w-full mt-1 opacity-80 whitespace-normal break-words leading-tight"
                    style={{ fontSize: '0.85em', color: getEventColor() }}
                >
                    {event.note}
                </div>
            )}
        </div>
    );
};

export default React.memo(EventItem);
