import React from 'react';
import { BoardSettings, ZmanimData } from '../../../shared/types/types';
import Clock from './Clock';
import ZmanimInfo from './ZmanimInfo';

interface BoardHeaderProps {
    settings: BoardSettings;
    zmanimData: ZmanimData | null;
    zmanimLoading: boolean;
    zmanimError: string | null;
    headerScale: number;
    headerRef?: React.RefObject<HTMLElement>;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({
    settings,
    zmanimData,
    zmanimLoading,
    zmanimError,
    headerScale,
    headerRef
}) => {
    return (
        <header
            ref={headerRef}
            className="flex-shrink-0 flex justify-between items-start"
            style={{
                fontSize: `${headerScale * 16}px`,
                padding: `${headerScale * 24}px ${headerScale * 32}px ${headerScale * 8}px ${headerScale * 32}px`
            }}
        >
            <div className="flex-1 text-right flex flex-col items-start" style={{ gap: `${headerScale * 8}px` }}>
                <ZmanimInfo zmanimData={zmanimData} loading={zmanimLoading} error={zmanimError} settings={settings} scale={headerScale} />
            </div>
            <div className="flex-1 text-center">
                <h1 className="font-title leading-tight whitespace-nowrap drop-shadow-md" style={{ color: settings.mainTitleColor, fontSize: `${8.0 * headerScale * 16 * (settings.mainTitleSize / 100)}px` }}>
                    {settings.boardTitle}
                </h1>
            </div>
            <div className="flex-1 text-left flex flex-col items-end" style={{ gap: `${headerScale * 8}px` }}>
                <Clock settings={settings} scale={headerScale} />
            </div>
        </header>
    );
};

export default BoardHeader;
