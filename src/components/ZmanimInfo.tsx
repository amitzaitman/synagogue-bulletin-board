import React from 'react';
import { ZmanimData, BoardSettings } from '../types';

interface ZmanimInfoProps {
    zmanimData: ZmanimData | null;
    loading: boolean;
    error: string | null;
    settings: BoardSettings;
    scale?: number; // Scale factor for proportional sizing
}

const ZmanimInfo: React.FC<ZmanimInfoProps> = ({ zmanimData, loading, error, settings, scale = 1 }) => {
    const formatTime = (date: Date | null): string => {
        if (!date) return '--:--';
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const baseFontSize = 16; // Base font size in pixels
    const scaledFontSize = baseFontSize * scale;

    return (
        <div 
            className="inline-block text-right rounded-lg shadow-sm border border-black/5" 
            style={{ 
                backgroundColor: settings.zmanimBackgroundColor,
                padding: `${scale * 16}px`,
                fontSize: `${scaledFontSize}px`
            }}
        >
            {loading && <div className="text-amber-800/80 text-right" style={{ marginTop: `${scale * 4}px`, fontSize: `${scaledFontSize}px` }}>טוען זמנים...</div>}
            {error && <div className="text-red-600/80 text-right" style={{ marginTop: `${scale * 4}px`, fontSize: `${scaledFontSize}px` }}>{error}</div>}
            {zmanimData && (
                <>
                    {zmanimData.parsha && (
                        <p className="text-stone-600 leading-tight" style={{ marginTop: `${scale * 4}px`, fontSize: `${2 * scaledFontSize}px` }}>{zmanimData.parsha}</p>
                    )}
                    {zmanimData.holidayEvents.length > 0 && (
                        <p className="text-amber-600 font-semibold leading-tight" style={{ marginTop: `${scale * 4}px`, fontSize: `${1.4 * scaledFontSize}px` }}>{zmanimData.holidayEvents.join(', ')}</p>
                    )}
                    <div className="flex flex-col" style={{ marginTop: `${scale * 12}px` }}>
                         {zmanimData.shabbatCandles && (
                            <div className="flex items-baseline" style={{ gap: `${scale * 8}px` }}>
                                 <span className="text-stone-600" style={{ fontSize: `${1.3 * scaledFontSize}px` }}>כניסת שבת:</span>
                                 <span className="font-mono font-bold text-stone-800" style={{ fontSize: `${1.5 * scaledFontSize}px` }}>{formatTime(zmanimData.shabbatCandles)}</span>
                            </div>
                        )}
                         {zmanimData.shabbatEnd && (
                            <div className="flex items-baseline" style={{ gap: `${scale * 8}px` }}>
                                 <span className="text-stone-600" style={{ fontSize: `${1.3 * scaledFontSize}px` }}>צאת שבת:</span>
                                 <span className="font-mono font-bold text-stone-800" style={{ fontSize: `${1.5 * scaledFontSize}px` }}>{formatTime(zmanimData.shabbatEnd)}</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ZmanimInfo;
