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
            { label: 'הנץ החמה', time: formatTime(zmanim.sunrise) },
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

    return (
        <div
            className="text-white py-2.5 px-6 border-t border-white/10 shadow-lg z-10 w-full select-none"
            style={{ backgroundColor: settings.zmanimBackgroundColor || '#1e3a5f' }}
        >
            <div
                className="flex justify-between items-center w-full flex-nowrap gap-2"
                data-board-footer-items
            >
                {footerItems.map((item, index) => (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <div className="h-4 w-[1px] bg-white/15 self-center shrink-0" />
                        )}
                        <div className="flex items-center gap-1.5 whitespace-nowrap justify-center flex-1 min-w-0">
                            <span className="text-white/70 font-semibold text-[clamp(11px,0.85vw,16px)]">{item.label}:</span>
                            <span className="text-white font-extrabold font-mono tracking-wider text-[clamp(13px,1vw,20px)]">{item.time}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default React.memo(ZmanimFooter);
