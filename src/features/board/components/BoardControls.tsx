import React from 'react';
import { BoardSettings } from '../../../shared/types/types';

interface BoardControlsProps {
    isEditMode: boolean;
    isActive: boolean;
    contentScale: number;
    settings: BoardSettings;
    onBackToHome: () => void;
    onEnterEditMode: () => void;
    saveSettings: (settings: BoardSettings) => void;
}

const SettingsIcon = ({ size = 24 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const HomeIcon = ({ size = 24 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const BoardControls: React.FC<BoardControlsProps> = ({
    isEditMode,
    isActive,
    contentScale,
    settings,
    onBackToHome,
    onEnterEditMode,
    saveSettings
}) => {
    if (isEditMode || !isActive) return null;

    return (
        <>
            {/* Floating buttons */}
            <div className="fixed z-40 opacity-50 hover:opacity-100 transition-opacity duration-300" style={{ bottom: `${contentScale * 16}px`, left: `${contentScale * 16}px` }}>
                <div className="flex flex-col" style={{ gap: `${contentScale * 8}px` }}>
                    <button onClick={onBackToHome} className="bg-white/90 rounded-full shadow-lg hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2" style={{ padding: `${contentScale * 12}px` }} title="חזרה לדף הבית">
                        <HomeIcon size={contentScale * 24} />
                    </button>
                    <button onClick={onEnterEditMode} className="bg-white/90 rounded-full shadow-lg hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2" style={{ padding: `${contentScale * 12}px` }} title="כניסה למצב עריכה">
                        <SettingsIcon size={contentScale * 24} />
                    </button>
                </div>
            </div>

            {/* Zoom controls */}
            <div className="fixed z-40 bg-white/90 rounded-lg shadow-lg opacity-50 hover:opacity-100 transition-opacity duration-300" style={{ bottom: `${contentScale * 16}px`, right: `${contentScale * 16}px`, padding: `${contentScale * 8}px` }}>
                <div className="flex flex-col items-center" style={{ gap: `${contentScale * 8}px` }}>
                    <button
                        onClick={() => {
                            const newZoom = Math.min((settings.zoomLevel || 1.0) + 0.1, 2.0);
                            saveSettings({ ...settings, zoomLevel: newZoom });
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-md transition font-bold"
                        style={{ padding: `${contentScale * 6}px ${contentScale * 12}px`, fontSize: `${contentScale * 16}px` }}
                        title="הגדל (Zoom In)"
                    >
                        +
                    </button>
                    <div className="text-xs text-gray-700 font-mono" style={{ fontSize: `${contentScale * 10}px` }}>
                        {Math.round((settings.zoomLevel || 1.0) * 100)}%
                    </div>
                    <button
                        onClick={() => {
                            const newZoom = Math.max((settings.zoomLevel || 1.0) - 0.1, 0.5);
                            saveSettings({ ...settings, zoomLevel: newZoom });
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-md transition font-bold"
                        style={{ padding: `${contentScale * 6}px ${contentScale * 12}px`, fontSize: `${contentScale * 16}px` }}
                        title="הקטן (Zoom Out)"
                    >
                        −
                    </button>
                    <button
                        onClick={() => {
                            saveSettings({ ...settings, zoomLevel: 1.0 });
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white rounded-md transition text-xs"
                        style={{ padding: `${contentScale * 4}px ${contentScale * 8}px`, fontSize: `${contentScale * 10}px` }}
                        title="איפוס (Reset)"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </>
    );
};

export default BoardControls;
