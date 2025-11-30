import React, { useState, useEffect } from 'react';
import { BoardSettings, ZmanimData } from '../../../shared/types/types';

interface HeaderProps {
    settings: BoardSettings;
    zmanimData: ZmanimData | null;
}

const Header: React.FC<HeaderProps> = ({ settings, zmanimData }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <header
            className="bg-brand-dark text-white shadow-md flex justify-between items-center"
            style={{ padding: '1.5vw' }}
        >
            {/* Clock Section (Left in RTL) */}
            <div className="flex flex-col items-start w-1/6">
                <div
                    className="font-mono tracking-wider bg-white/10 rounded-lg"
                    style={{
                        fontSize: '2.5vw',
                        padding: '0.25em 0.5em',
                        backgroundColor: settings.clockBackgroundColor,
                        color: settings.mainTitleColor
                    }}
                >
                    {formatTime(time)}
                </div>
            </div>

            {/* Title Section (Center) */}
            <div className="w-2/3 text-center">
                <h1
                    className="font-bold drop-shadow-lg"
                    style={{ fontSize: '5vw', color: settings.mainTitleColor }}
                >
                    {settings.boardTitle}
                </h1>
            </div>

            {/* Date Section (Right in RTL) */}
            <div className="flex flex-col items-end w-1/6 text-right">
                {zmanimData && (
                    <>
                        <div style={{ fontSize: '2vw', fontWeight: 'bold' }}>{zmanimData.currentHebrewDate}</div>
                        {zmanimData.parsha && (
                            <div style={{ fontSize: '1.5vw', opacity: 0.9 }}>{zmanimData.parsha}</div>
                        )}
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
