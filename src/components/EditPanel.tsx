import React from 'react';
import { BoardSettings } from '../types';

// Helper functions for color conversion
const hexToRgb = (hex: string): number[] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255]; // Default to white if invalid hex
};

const rgbaToHex = (rgba: string): string => {
  const match = rgba.match(/rgba?(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#ffffff';
  const [, r, g, b] = match;
  const toHex = (n: string) => {
    const hex = parseInt(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Icons
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;

interface EditPanelProps {
  settings: BoardSettings;
  onSave: (newSettings: BoardSettings) => void;
  onAddColumn: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  lastSyncTime: Date;
  isOnline: boolean;
}

const EditPanel: React.FC<EditPanelProps> = ({ settings, onSave, onAddColumn, onSaveChanges, onCancelChanges, lastSyncTime, isOnline }) => {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [, setTick] = React.useState(0);

  // Update the time display every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleSettingChange = (field: keyof BoardSettings, value: any) => {
    // Special handling for manualEventOrdering - ask for confirmation
    if (field === 'manualEventOrdering') {
      const isEnablingManual = value === true;
      const message = isEnablingManual
        ? 'האם אתה בטוח שברצונך לעבור למיון ידני?\n\nבמצב ידני, אירועים לא יסודרו אוטומטית לפי שעה. תוכל לגרור ולשנות את סדר האירועים באופן חופשי.'
        : 'האם אתה בטוח שברצונך לעבור למיון אוטומטי?\n\nבמצב אוטומטי, האירועים יסודרו אוטומטית לפי השעה שלהם בכל פעם שתערוך אירוע.';

      if (window.confirm(message)) {
        const newSettings = { ...settings, [field]: value };
        onSave(newSettings);
      }
      return;
    }

    const newSettings = { ...settings, [field]: value };
    onSave(newSettings);
  };

  const formatLastSync = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'כרגע';
    if (diffMins === 1) return 'לפני דקה';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'לפני שעה';
    if (diffHours < 24) return `לפני ${diffHours} שעות`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;

    return date.toLocaleString('he-IL', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const inputClass = "w-full p-2 border rounded-md bg-white/50 text-sm";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  const panelWidth = 384; // w-96

  return (
    <div 
      className="absolute top-0 bottom-0 right-0 z-30 transition-transform duration-300 ease-in-out"
      style={{ transform: isMinimized ? `translateX(${panelWidth}px)` : 'translateX(0px)' }}
    >
      {/* Minimize/Expand Tab */}
      <button 
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute top-1/2 -translate-y-1/2 -left-8 w-8 h-16 bg-stone-200/90 hover:bg-stone-300/90 backdrop-blur-lg rounded-l-lg flex items-center justify-center shadow-lg"
      >
        {isMinimized ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </button>

      {/* Panel Content */}
      <div className="w-96 h-full bg-stone-100/90 backdrop-blur-lg shadow-2xl flex flex-col">
        <div className="p-4 border-b border-stone-300">
          <h2 className="text-xl font-bold text-stone-800 mb-2">עריכת לוח</h2>
          <div className="space-y-1 text-sm text-stone-600">
            <div className="flex items-center justify-between">
              <span className="font-medium">סנכרון אחרון:</span>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="מחובר לרשת"></span>
                ) : (
                  <span className="w-2 h-2 bg-red-500 rounded-full" title="לא מחובר לרשת"></span>
                )}
                <span className="text-stone-700">{formatLastSync(lastSyncTime)}</span>
              </div>
            </div>
            {!isOnline && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mt-1">
                ⚠️ אין חיבור לרשת - השינויים נשמרים מקומית
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow p-4 overflow-y-auto space-y-6">
          {/* General Settings */}
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-3">הגדרות כלליות</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>כותרת הלוח</label>
                <input
                  type="text"
                  value={settings.boardTitle || ''}
                  onChange={(e) => handleSettingChange('boardTitle', e.target.value)}
                  className={inputClass}
                  placeholder="בית הכנסת - גבעת החי״ש"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className={labelClass + " mb-0"}>מיון ידני של אירועים</span>
                  <input
                    type="checkbox"
                    checked={settings.manualEventOrdering || false}
                    onChange={(e) => handleSettingChange('manualEventOrdering', e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                </label>
                <div className="mt-1 text-xs text-stone-500 text-right">
                  {settings.manualEventOrdering
                    ? '✓ מצב ידני: גרור אירועים כדי לשנות את הסדר'
                    : '○ מצב אוטומטי: אירועים מסודרים לפי שעה'}
                </div>
              </div>
              <button onClick={onAddColumn} className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-transform hover:scale-105">
                הוסף עמודה
              </button>
            </div>
          </div>

          {/* Font Sizes */}
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-3">גודל גופנים</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>גודל כללי: {Math.round(settings.scale * 100)}%</label>
                <input type="range" min="0.5" max="2" step="0.05" value={settings.scale} onChange={(e) => handleSettingChange('scale', parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className={labelClass}>כותרת ראשית: {settings.mainTitleSize}%</label>
                <input type="range" min="50" max="200" step="5" value={settings.mainTitleSize} onChange={(e) => handleSettingChange('mainTitleSize', parseInt(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className={labelClass}>כותרת עמודה: {settings.columnTitleSize}%</label>
                <input type="range" min="50" max="200" step="5" value={settings.columnTitleSize} onChange={(e) => handleSettingChange('columnTitleSize', parseInt(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className={labelClass}>טקסט אירועים: {settings.eventTextScale}%</label>
                <input type="range" min="50" max="150" step="5" value={settings.eventTextScale} onChange={(e) => handleSettingChange('eventTextScale', parseInt(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>

          {/* Text Colors */}
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-3">צבעי טקסט</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>צבע תפילה</label>
                <input type="color" value={settings.prayerColor} onChange={(e) => handleSettingChange('prayerColor', e.target.value)} className="w-full h-10" />
              </div>
              <div>
                <label className={labelClass}>צבע שיעור</label>
                <input type="color" value={settings.classColor} onChange={(e) => handleSettingChange('classColor', e.target.value)} className="w-full h-10" />
              </div>
              <div>
                <label className={labelClass}>צבע טקסט חופשי</label>
                <input type="color" value={settings.freeTextColor} onChange={(e) => handleSettingChange('freeTextColor', e.target.value)} className="w-full h-10" />
              </div>
              <div>
                <label className={labelClass}>צבע כותרת עמודה</label>
                <input type="color" value={settings.columnTitleColor} onChange={(e) => handleSettingChange('columnTitleColor', e.target.value)} className="w-full h-10" />
              </div>
              <div>
                <label className={labelClass}>צבע כותרת ראשית</label>
                <input type="color" value={settings.mainTitleColor} onChange={(e) => handleSettingChange('mainTitleColor', e.target.value)} className="w-full h-10" />
              </div>
              <div>
                <label className={labelClass}>צבע הדגשה</label>
                <input type="color" value={settings.highlightColor} onChange={(e) => handleSettingChange('highlightColor', e.target.value)} className="w-full h-10" />
              </div>
            </div>
          </div>

          {/* Background Colors */}
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-3">צבעי רקע</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>רקע כללי</label>
                <input type="color" value={settings.mainBackgroundColor} onChange={(e) => handleSettingChange('mainBackgroundColor', e.target.value)} className="w-full h-10" />
                <div className="mt-1 text-xs text-stone-500">צבע הרקע הכללי של המסך</div>
              </div>
              <div>
                <label className={labelClass}>רקע הלוח</label>
                <div className="flex gap-2">
                  <input type="color" value={rgbaToHex(settings.boardBackgroundColor)} onChange={(e) => {
                    const opacity = settings.boardBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.7';
                    handleSettingChange('boardBackgroundColor', `rgba(${hexToRgb(e.target.value).join(', ')}, ${opacity})`);
                  }} className="flex-grow h-10" />
                  <input type="range" min="0" max="100" 
                    value={parseFloat(settings.boardBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.7') * 100} 
                    onChange={(e) => {
                      const color = settings.boardBackgroundColor.match(/rgba\((.*?),/)?.[1] || '255, 255, 255';
                      handleSettingChange('boardBackgroundColor', `rgba(${color}, ${parseFloat(e.target.value) / 100})`);
                    }} 
                    className="w-24" />
                </div>
                <div className="mt-1 text-xs text-stone-500">צבע הרקע של הלוח המרכזי</div>
              </div>
              <div>
                <label className={labelClass}>רקע העמודות</label>
                <div className="flex gap-2">
                  <input type="color" value={rgbaToHex(settings.columnBackgroundColor)} onChange={(e) => {
                    const opacity = settings.columnBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.5';
                    handleSettingChange('columnBackgroundColor', `rgba(${hexToRgb(e.target.value).join(', ')}, ${opacity})`);
                  }} className="flex-grow h-10" />
                  <input type="range" min="0" max="100" 
                    value={parseFloat(settings.columnBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.5') * 100} 
                    onChange={(e) => {
                      const color = settings.columnBackgroundColor.match(/rgba\((.*?),/)?.[1] || '255, 255, 255';
                      handleSettingChange('columnBackgroundColor', `rgba(${color}, ${parseFloat(e.target.value) / 100})`);
                    }} 
                    className="w-24" />
                </div>
                <div className="mt-1 text-xs text-stone-500">צבע הרקע של העמודות</div>
              </div>
              <div>
                <label className={labelClass}>רקע השעון</label>
                <div className="flex gap-2">
                  <input type="color" value={rgbaToHex(settings.clockBackgroundColor)} onChange={(e) => {
                    const opacity = settings.clockBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.3';
                    handleSettingChange('clockBackgroundColor', `rgba(${hexToRgb(e.target.value).join(', ')}, ${opacity})`);
                  }} className="flex-grow h-10" />
                  <input type="range" min="0" max="100" 
                    value={parseFloat(settings.clockBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.3') * 100} 
                    onChange={(e) => {
                      const color = settings.clockBackgroundColor.match(/rgba\((.*?),/)?.[1] || '255, 255, 255';
                      handleSettingChange('clockBackgroundColor', `rgba(${color}, ${parseFloat(e.target.value) / 100})`);
                    }} 
                    className="w-24" />
                </div>
                <div className="mt-1 text-xs text-stone-500">צבע הרקע של השעון</div>
              </div>
              <div>
                <label className={labelClass}>רקע פאנל הזמנים</label>
                <div className="flex gap-2">
                  <input type="color" value={rgbaToHex(settings.zmanimBackgroundColor)} onChange={(e) => {
                    const opacity = settings.zmanimBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.3';
                    handleSettingChange('zmanimBackgroundColor', `rgba(${hexToRgb(e.target.value).join(', ')}, ${opacity})`);
                  }} className="flex-grow h-10" />
                  <input type="range" min="0" max="100" 
                    value={parseFloat(settings.zmanimBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.3') * 100} 
                    onChange={(e) => {
                      const color = settings.zmanimBackgroundColor.match(/rgba\((.*?),/)?.[1] || '255, 255, 255';
                      handleSettingChange('zmanimBackgroundColor', `rgba(${color}, ${parseFloat(e.target.value) / 100})`);
                    }} 
                    className="w-24" />
                </div>
                <div className="mt-1 text-xs text-stone-500">צבע הרקע של פאנל הזמנים</div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-3">מיקום (לחישוב זמנים)</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>קו רוחב (Latitude)</label>
                <input type="number" step="0.001" value={settings.latitude} onChange={(e) => handleSettingChange('latitude', parseFloat(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>קו אורך (Longitude)</label>
                <input type="number" step="0.001" value={settings.longitude} onChange={(e) => handleSettingChange('longitude', parseFloat(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>גובה (מטרים)</label>
                <input type="number" value={settings.elevation} onChange={(e) => handleSettingChange('elevation', parseInt(e.target.value))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>דקות לפני השקיעה (הדלקת נרות)</label>
                <input type="number" value={settings.shabbatCandleOffset} onChange={(e) => handleSettingChange('shabbatCandleOffset', parseInt(e.target.value, 10))} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-stone-300 flex gap-2">
          <button onClick={onCancelChanges} className="w-full flex items-center justify-center gap-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold py-2 px-4 rounded-lg">
            ביטול
          </button>
          <button onClick={onSaveChanges} className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
            שמור שינויים
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPanel;