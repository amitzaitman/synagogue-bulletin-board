import React from 'react';
import { BoardSettings } from '../../../shared/types/types';
import { LAYOUT_CONSTANTS } from '../../../shared/constants/layout';

interface BoardMessagesBoxProps {
    settings: BoardSettings;
    scale?: number;
    onClick?: () => void;
}

const BoardMessagesBox: React.FC<BoardMessagesBoxProps> = ({ settings, scale = 1, onClick }) => {
    if (!settings.boardMessages || settings.boardMessages.trim() === '') {
        return null;
    }

    const messages = settings.boardMessages.split('\n').filter(msg => msg.trim() !== '');

    if (messages.length === 0) {
        return null;
    }

    return (
        <div
            className={`w-full text-center py-2 px-4 shadow-sm border-b border-gray-200 ${onClick ? 'cursor-pointer hover:bg-white/80 transition-colors' : ''}`}
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                marginBottom: `${LAYOUT_CONSTANTS.GRID.GAP_PX * scale}px`
            }}
            onClick={onClick}
            title={onClick ? "לחץ לעריכת הודעות" : undefined}
        >
            {messages.map((message, index) => (
                <div
                    key={index}
                    className="font-medium text-stone-800"
                    style={{
                        fontSize: `${(settings.boardMessageFontSize || 1.1) * scale}rem`,
                        lineHeight: '1.4',
                        marginBottom: index < messages.length - 1 ? '0.25rem' : '0'
                    }}
                >
                    {message}
                </div>
            ))}
        </div>
    );
};

export default BoardMessagesBox;
