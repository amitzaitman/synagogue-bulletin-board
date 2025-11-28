import React, { useState, useEffect } from 'react';
import { BoardSettings, ZmanimData } from '../../../shared/types/types';
import { LAYOUT_CONSTANTS } from '../../../shared/constants/layout';

interface HeaderProps {
    settings: BoardSettings;
    zmanimData: ZmanimData | null;
    scale?: number;
}

const Header: React.FC<HeaderProps> = ({ settings, zmanimData, scale = 1 }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const padding = LAYOUT_CONSTANTS.HEADER.PADDING_PX * scale; // p-4 = 16px

    return (
        <header
            className="bg-brand-dark text-white shadow-md flex justify-between items-center"
            style={{ padding: `${padding}px` }}
        >
            {/* Clock Section (Left in RTL) */}
            <div className="flex flex-col items-start w-1/4">
                <div
                    className="font-bold font-mono tracking-wider bg-white/10 rounded-lg"
                    style={{
                        fontSize: `${LAYOUT_CONSTANTS.HEADER.CLOCK_FONT_SIZE_REM * scale}rem`, // text-4xl = 2.25rem
                        padding: `${LAYOUT_CONSTANTS.HEADER.CLOCK_PADDING_Y_PX * scale}px ${LAYOUT_CONSTANTS.HEADER.CLOCK_PADDING_X_PX * scale}px` // px-4 py-2
                    }}
                >
                    {formatTime(time)}
                </div>
            </div>

            {/* Title Section (Center) */}
            <div className="w-1/2 text-center">
                <h1
                    className="font-title font-bold drop-shadow-lg"
                    style={{ fontSize: `${settings.mainTitleSize * LAYOUT_CONSTANTS.HEADER.TITLE_SCALE_FACTOR * scale}px` }}
                >
                    {settings.boardTitle}
                </h1>
            </div>

            {/* Date Section (Right in RTL) */}
            <div className="flex flex-col items-end w-1/4 text-right">
                {zmanimData && (
                    <>
                        <div style={{ fontSize: `${LAYOUT_CONSTANTS.HEADER.DATE_FONT_SIZE_REM * scale}rem`, fontWeight: 'bold' }}>{zmanimData.hebrewDate}</div>
                        {zmanimData.parsha && (
                            <div style={{ fontSize: `${LAYOUT_CONSTANTS.HEADER.PARSHA_FONT_SIZE_REM * scale}rem`, opacity: 0.9 }}>{zmanimData.parsha}</div>
                        )}
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
