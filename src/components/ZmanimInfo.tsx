import React from 'react';
import { ZmanimData, BoardSettings } from '../types';

interface ZmanimInfoProps {
    zmanimData: ZmanimData | null;
    loading: boolean;
    error: string | null;
    settings: BoardSettings;
}

const ZmanimInfo: React.FC<ZmanimInfoProps> = ({ zmanimData, loading, error, settings }) => {
    const formatTime = (date: Date | null): string => {
        if (!date) return '--:--';
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div className="inline-block text-right p-4 rounded-lg shadow-sm border border-black/5" style={{ backgroundColor: settings.zmanimBackgroundColor }}>
            {loading && <div className="text-md text-amber-800/80 text-right mt-1">טוען זמנים...</div>}
            {error && <div className="text-md text-red-600/80 text-right mt-1">{error}</div>}
            {zmanimData && (
                <>
                    {zmanimData.parsha && (
                        <p className="text-[2em] text-stone-600 leading-tight mt-1">{zmanimData.parsha}</p>
                    )}
                    {zmanimData.holidayEvents.length > 0 && (
                        <p className="text-[1.4em] text-amber-600 font-semibold leading-tight mt-1">{zmanimData.holidayEvents.join(', ')}</p>
                    )}
                    <div className="mt-3 flex flex-col">
                         {zmanimData.shabbatCandles && (
                            <div className="flex items-baseline gap-2">
                                 <span className="text-[1.3em] text-stone-600">כניסת שבת:</span>
                                 <span className="text-[1.5em] font-mono font-bold text-stone-800">{formatTime(zmanimData.shabbatCandles)}</span>
                            </div>
                        )}
                         {zmanimData.shabbatEnd && (
                            <div className="flex items-baseline gap-2">
                                 <span className="text-[1.3em] text-stone-600">צאת שבת:</span>
                                 <span className="text-[1.5em] font-mono font-bold text-stone-800">{formatTime(zmanimData.shabbatEnd)}</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ZmanimInfo;
