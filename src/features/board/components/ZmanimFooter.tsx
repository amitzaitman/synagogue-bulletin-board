import React, { useMemo } from 'react';
import { ZmanimData, BoardSettings } from '../../../shared/types/types';

interface ZmanimFooterProps {
    zmanim: ZmanimData | null;
    settings: BoardSettings;
}

const ZmanimFooter: React.FC<ZmanimFooterProps> = ({ zmanim, settings }) => {
    const footerItems = useMemo(() => {
        if (!zmanim) return [];

        const formatTime = (date: Date | null) => {
            if (!date) return '--:--';
            return date.toLocaleTimeString('he-IL', { hour: 'numeric', minute: '2-digit' });
        };

        const items = [
            { label: 'עלות השחר', time: formatTime(zmanim.alotHaShachar) },
            { label: 'נץ החמה', time: formatTime(zmanim.sunrise) },
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

    return (
        <div
            className="bg-brand-dark text-white py-1 px-2 border-t border-white/10 shadow-lg z-10"
            style={{ backgroundColor: settings.zmanimBackgroundColor }}
        >
            <div className="flex flex-nowrap justify-between items-center w-full">
                {footerItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-1 whitespace-nowrap">
                        <span className="text-blue-200 text-[min(14px,0.9vw)]">{item.label}:</span>
                        <span className="font-medium text-[min(14px,0.9vw)]">{item.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ZmanimFooter;
