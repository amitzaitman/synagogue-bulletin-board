import React, { useState } from 'react';
import { setManualTimeOffset } from '../utils/timeProvider';

interface ClockErrorScreenProps {
    lastSyncTime: Date | null;
    onClockSet: () => void;
}

const ClockErrorScreen: React.FC<ClockErrorScreenProps> = ({ lastSyncTime, onClockSet }) => {
    // Default to the last sync time or current time
    const defaultDate = lastSyncTime ? new Date(lastSyncTime.getTime() + 60000) : new Date();

    // Format to YYYY-MM-DDThh:mm for the input
    const formatForInput = (date: Date) => {
        const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return d.toISOString().slice(0, 16);
    };

    const [userTime, setUserTime] = useState(formatForInput(defaultDate));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedDate = new Date(userTime);
        if (!isNaN(parsedDate.getTime())) {
            setManualTimeOffset(parsedDate);
            onClockSet();
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-50 text-red-900 p-6 text-center" dir="rtl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-4xl font-bold mb-4">שגיאת שעון מערכת</h1>
            <p className="text-xl mb-6 max-w-2xl leading-relaxed">
                התאריך והשעה במכשיר זה אינם נכונים ונמצאים בעבר.
                מערכת הלוח אינה יכולה לפעול כראוי מכיוון שזמני התפילות יחושבו באופן שגוי.
            </p>
            <div className="bg-white p-6 rounded-lg shadow-md border border-red-200">
                <h2 className="font-semibold text-lg mb-4 text-gray-800">כיצד לתקן?</h2>
                <ul className="text-right list-decimal list-inside space-y-2 text-gray-700">
                    <li>חבר את המכשיר ל<b>אינטרנט (Wi-Fi)</b> כדי שהשעון יתעדכן אוטומטית.</li>
                    <li>או – כנס ל<b>הגדרות המכשיר</b> ועדכן את התאריך והשעה ידנית.</li>
                </ul>
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-md mb-3 text-gray-800 text-right">או הגדר שעה באופן ידני בלוח:</h3>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <input
                            type="datetime-local"
                            value={userTime}
                            onChange={(e) => setUserTime(e.target.value)}
                            required
                            className="p-2 border rounded text-left bg-gray-50 border-gray-300 w-full"
                            dir="ltr"
                        />
                        <button type="submit" className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition w-full">
                            החל שעה ידנית והמשך
                        </button>
                    </form>
                </div>
            </div>

            {lastSyncTime && (
                <div className="mt-8 text-sm text-gray-500 bg-gray-100 p-3 rounded-md border border-gray-200">
                    <span className="font-semibold ml-2">טבלת זמנים אחרונה שסונכרנה:</span>
                    <span dir="ltr">{lastSyncTime.toLocaleString('he-IL')}</span>
                </div>
            )}
        </div>
    );
};

export default ClockErrorScreen;
