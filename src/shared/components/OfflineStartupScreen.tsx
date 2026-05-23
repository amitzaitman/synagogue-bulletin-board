import React from 'react';
import { useNetwork } from '../context/NetworkContext';

interface OfflineStartupScreenProps {
  lastSyncTime: Date | null;
}

const OfflineStartupScreen: React.FC<OfflineStartupScreenProps> = ({ lastSyncTime }) => {
  const { isManualOffline, toggleManualOffline } = useNetwork();

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-amber-50 text-amber-950 p-6 text-center" dir="rtl">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-amber-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5 5 0 117.778 0M5.636 13.93a9 9 0 1112.728 0M12 20h.01" />
      </svg>
      <h1 className="text-4xl font-bold mb-4">אין נתונים זמינים במצב אופליין</h1>
      <p className="text-xl mb-6 max-w-3xl leading-relaxed">
        הלוח נפתח ללא חיבור אינטרנט, ועדיין לא נשמר עותק מקומי של הנתונים במכשיר הזה.
        כדי שהלוח יוכל לעבוד גם בלי רשת, צריך לפתוח אותו לפחות פעם אחת כשהמכשיר מחובר.
      </p>
      <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200 max-w-2xl">
        <h2 className="font-semibold text-lg mb-4 text-gray-800">מה לעשות עכשיו?</h2>
        <ul className="text-right list-decimal list-inside space-y-2 text-gray-700">
          <li>חבר את הטלוויזיה או המכשיר לאינטרנט.</li>
          <li>פתח שוב את הלוח והמתן לטעינת הנתונים.</li>
          <li>לאחר הסנכרון הראשון, העותק המקומי יאפשר פתיחה טובה יותר גם בלי רשת.</li>
        </ul>
      </div>

      {isManualOffline && (
        <button
          onClick={toggleManualOffline}
          className="mt-8 bg-amber-700 hover:bg-amber-800 text-white font-medium px-6 py-3 rounded-lg shadow-md transition-all transform active:scale-95 cursor-pointer border border-amber-600/30 text-lg"
        >
          ביטול מצב אופליין ידני והתחברות
        </button>
      )}

      {lastSyncTime && (
        <div className="mt-8 text-sm text-gray-500 bg-gray-100 p-3 rounded-md border border-gray-200">
          <span className="font-semibold ml-2">סנכרון אחרון ידוע:</span>
          <span dir="ltr">{lastSyncTime.toLocaleString('he-IL')}</span>
        </div>
      )}
    </div>
  );
};

export default OfflineStartupScreen;
