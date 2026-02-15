import React, { useMemo } from 'react';
import { ReactFitty } from 'react-fitty';
import { ZmanimData, BoardSettings } from '../../../shared/types/types';

interface ZmanimFooterProps {
    zmanim: ZmanimData | null;
    settings: BoardSettings;
    lastSyncTime?: Date;
}

const ZmanimFooter: React.FC<ZmanimFooterProps> = ({ zmanim, settings, lastSyncTime }) => {
    const footerItems = useMemo(() => {
        if (!zmanim) return [];

        const formatTime = (date: Date | null) => {
            if (!date) return '--:--';
            return date.toLocaleTimeString('he-IL', { hour: 'numeric', minute: '2-digit' });
        };

        const items = [
            { label: 'עלות השחר', time: formatTime(zmanim.alotHaShachar) },
            { label: 'נץ החמהה', time: formatTime(zmanim.sunrise) },
            { label: 'ס"ז ק"ש (מג"א)', time: formatTime(zmanim.sofZmanShmaMGA) },
            { label: 'ס"ז ק"ש (גר"א)', time: formatTime(zmanim.sofZmanShmaGRA) },
            { label: 'ס"ז תפילה (מג"א)', time: formatTime(zmanim.sofZmanTfillaMGA) },
            { label: 'ס"ז תפילה (גר"א)', time: formatTime(zmanim.sofZmanTfillaGRA) },
            { label: 'חצות', time: formatTime(zmanim.chatzot) },
            { label: 'מנחה גדולה', time: formatTime(zmanim.minchaGedola) },
            { label: 'מנחה קטנה', time: formatTime(zmanim.minchaKetana) },
            { label: 'פלג המנחה', time: formatTime(zmanim.plagHaMincha) },
            { label: 'שקיעה', time: formatTime(zmanim.sunset) },
            { label: 'צה"כ', time: formatTime(zmanim.tzeit) },
        ];

        return items.filter(item => item.time !== '--:--');
    }, [zmanim]);

    if (!zmanim || footerItems.length === 0) return null;

    const formatSyncTime = (date: Date) => {
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            className="bg-brand-dark text-white py-1 px-2 border-t border-white/10 shadow-lg z-10 w-full overflow-hidden"
            style={{ backgroundColor: settings.zmanimBackgroundColor }}
        >
            <div className="w-full text-center">
                <ReactFitty maxSize={24} minSize={8} wrapText={false}>
                    <div className="flex flex-nowrap justify-center items-center gap-4 px-2">
                        {footerItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-1 whitespace-nowrap">
                                <span className="text-blue-200">{item.label}:</span>
                                <span className="font-medium">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </ReactFitty>
            </div>
            <div className="fixed top-0 left-0 p-1 text-[10px] opacity-20 hover:opacity-100 select-none z-50 text-stone-500 pointer-events-auto" title="Build Version">
                v{import.meta.env.APP_VERSION}
            </div>
            {lastSyncTime && (
                <div className="fixed top-0 right-0 p-1 flex items-center gap-1 opacity-30 hover:opacity-100 transition-opacity duration-300 select-none z-50 text-stone-500 pointer-events-auto" title={`סונכרן לאחרונה: ${lastSyncTime.toLocaleString('he-IL')}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
                    <span className="text-[10px] font-mono">{formatSyncTime(lastSyncTime)}</span>
                </div>
            )}
        </div>
    );
};

export default ZmanimFooter;
