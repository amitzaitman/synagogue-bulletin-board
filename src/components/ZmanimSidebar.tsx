import React from 'react';
import { ZmanimData } from '../types';

interface ZmanimSidebarProps {
    zmanimData: ZmanimData | null;
    loading: boolean;
}

const ZmanimSidebar: React.FC<ZmanimSidebarProps> = ({ zmanimData, loading }) => {
    const formatTime = (date?: Date | null): string => {
        if (!date) return '--:--';
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const zmanimList = [
        { label: 'עלות השחר', time: zmanimData?.alotHaShachar },
        { label: 'סוף זמן ק"ש (גר"א)', time: zmanimData?.sofZmanShmaGRA },
        { label: 'סוף זמן תפילה (גר"א)', time: zmanimData?.sofZmanTfillaGRA },
        { label: 'חצות היום', time: zmanimData?.chatzot },
        { label: 'מנחה גדולה', time: zmanimData?.minchaGedola },
        { label: 'שקיעה', time: zmanimData?.sunset },
        { label: 'צאת הכוכבים', time: zmanimData?.tzeit },
    ];

    return (
        <div className="bg-white/40 rounded-2xl shadow-[inset_0_4px_10px_rgba(80,50,20,0.08)] backdrop-blur-lg p-4 flex flex-col w-64">
            <h2 className="text-2xl font-bold text-stone-700 text-center mb-4">זמני היום</h2>
            {loading ? (
                <div className="text-center text-stone-500">טוען זמנים...</div>
            ) : (
                <ul className="space-y-3">
                    {zmanimList.map((zman, index) => (
                        <li key={index} className="flex justify-between items-baseline">
                            <span className="text-lg text-stone-600">{zman.label}</span>
                            <span className="font-mono text-xl font-bold text-stone-800">{formatTime(zman.time)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ZmanimSidebar;
