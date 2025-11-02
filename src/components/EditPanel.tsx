import React, { useImperativeHandle, useRef, useState, useEffect } from 'react';
import { BoardSettings, ZmanimData } from '../types';

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

const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const FontIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const ColorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const BackgroundIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const CancelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

interface EditPanelProps {
  settings: BoardSettings;
  onSave: (newSettings: BoardSettings) => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  zmanimData: ZmanimData | null;
  zmanimLoading: boolean;
  zmanimError: string | null;
  activeSection?: string;
}

const EditPanel: React.FC<EditPanelProps> = React.forwardRef<{
  scrollToSection: (section: string) => void;
}, EditPanelProps>(({ settings, onSave, onSaveChanges, onCancelChanges, zmanimData, zmanimLoading, zmanimError, activeSection }, ref) => {
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Temporary settings state - changes here until "Save Changes" is clicked
  const [tempSettings, setTempSettings] = useState<BoardSettings>(settings);
  
  // Store original settings to restore on close without save
  const [originalSettings, setOriginalSettings] = useState<BoardSettings>(settings);

  // Update temp settings when the prop changes (e.g., when panel opens)
  useEffect(() => {
    setTempSettings(settings);
    setOriginalSettings(settings);
  }, [settings]);

  useImperativeHandle(ref, () => ({
    scrollToSection: (section: string) => {
      const sectionElement = document.getElementById(section);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }));

  const handleSettingChange = (field: keyof BoardSettings, value: any) => {
    // Special handling for manualEventOrdering - ask for confirmation
    if (field === 'manualEventOrdering') {
      const isEnablingManual = value === true;
      const message = isEnablingManual
        ? 'האם אתה בטוח שברצונך לעבור למיון ידני?\n\nבמצב ידני, אירועים לא יסודרו אוטומטית לפי שעה. תוכל לגרור ולשנות את סדר האירועים באופן חופשי.'
        : 'האם אתה בטוח שברצונך לעבור למיון אוטומטי?\n\nבמצב אוטומטי, האירועים יסודרו אוטומטית לפי השעה שלהם בכל פעם שתערוך אירוע.';

      if (!window.confirm(message)) {
        return;
      }
    }

    // Update both temporary settings and call onSave to update the display
    const newSettings = { ...tempSettings, [field]: value };
    setTempSettings(newSettings);
    onSave(newSettings); // Update the display immediately (but not save to database)
  };

  const handleSave = () => {
    // Save to database
    onSaveChanges();
  };

  const handleClose = () => {
    // Check if there are unsaved changes
    const hasChanges = JSON.stringify(tempSettings) !== JSON.stringify(originalSettings);
    
    if (hasChanges) {
      const confirmClose = window.confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לסגור ללא שמירה?');
      if (!confirmClose) {
        return;
      }
      // Restore original settings before closing
      onSave(originalSettings);
    }
    
    onCancelChanges();
  };

  const inputClass = "w-full p-2 border rounded-md bg-white/50 text-sm";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  // Determine which sections to show
  const showGeneralSettings = !activeSection || activeSection === 'general-settings';
  const showFontSizes = !activeSection || activeSection === 'font-sizes';
  const showTextColors = !activeSection || activeSection === 'text-colors';
  const showBackgroundColors = !activeSection || activeSection === 'background-colors';
  const showLocation = !activeSection || activeSection === 'location';

  return (
      <div ref={panelRef} className="bg-stone-100/90 backdrop-blur-lg shadow-2xl flex flex-col">
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {showGeneralSettings && (
            <div id="general-settings" className="space-y-4">
              <div className="flex items-center gap-2 text-stone-700">
                <SettingsIcon />
                <h3 className="text-sm font-semibold">הגדרות כלליות</h3>
              </div>
              <div>
                <label className={labelClass}>כותרת הלוח</label>
                <input
                  type="text"
                  value={tempSettings.boardTitle || ''}
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
                    checked={tempSettings.manualEventOrdering || false}
                    onChange={(e) => handleSettingChange('manualEventOrdering', e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                </label>
                <div className="mt-1 text-xs text-stone-500 text-right">
                  {tempSettings.manualEventOrdering
                    ? '✓ מצב ידני: גרור אירועים כדי לשנות את הסדר'
                    : '○ מצב אוטומטי: אירועים מסודרים לפי שעה'}
                </div>
              </div>
            </div>
          )}

          {showFontSizes && (
            <div id="font-sizes" className="space-y-4">
              <div className="flex items-center gap-2 text-stone-700">
                <FontIcon />
                <h3 className="text-sm font-semibold">גודל גופנים</h3>
              </div>
              <div>
                <label className={labelClass}>גודל כללי: {Math.round(tempSettings.scale * 100)}%</label>
                <input type="range" min="0.5" max="2" step="0.05" value={tempSettings.scale} onChange={(e) => handleSettingChange('scale', parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className={labelClass}>כותרת ראשית: {tempSettings.mainTitleSize}%</label>
                <input type="range" min="50" max="200" step="5" value={tempSettings.mainTitleSize} onChange={(e) => handleSettingChange('mainTitleSize', parseInt(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className={labelClass}>כותרת עמודה: {tempSettings.columnTitleSize}%</label>
                <input type="range" min="50" max="200" step="5" value={tempSettings.columnTitleSize} onChange={(e) => handleSettingChange('columnTitleSize', parseInt(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className={labelClass}>טקסט אירועים: {tempSettings.eventTextScale}%</label>
                <input type="range" min="50" max="200" step="5" value={tempSettings.eventTextScale} onChange={(e) => handleSettingChange('eventTextScale', parseInt(e.target.value))} className="w-full" />
              </div>
            </div>
          )}

          {showTextColors && (
            <div id="text-colors" className="space-y-4">
              <div className="flex items-center gap-2 text-stone-700">
                <ColorIcon />
                <h3 className="text-sm font-semibold">צבעי טקסט</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>צבע תפילה</label>
                  <input type="color" value={tempSettings.prayerColor} onChange={(e) => handleSettingChange('prayerColor', e.target.value)} className="w-full h-10" />
                </div>
                <div>
                  <label className={labelClass}>צבע שיעור</label>
                  <input type="color" value={tempSettings.classColor} onChange={(e) => handleSettingChange('classColor', e.target.value)} className="w-full h-10" />
                </div>
                <div>
                  <label className={labelClass}>צבע טקסט חופשי</label>
                  <input type="color" value={tempSettings.freeTextColor} onChange={(e) => handleSettingChange('freeTextColor', e.target.value)} className="w-full h-10" />
                </div>
                <div>
                  <label className={labelClass}>צבע כותרת עמודה</label>
                  <input type="color" value={tempSettings.columnTitleColor} onChange={(e) => handleSettingChange('columnTitleColor', e.target.value)} className="w-full h-10" />
                </div>
                <div>
                  <label className={labelClass}>צבע כותרת ראשית</label>
                  <input type="color" value={tempSettings.mainTitleColor} onChange={(e) => handleSettingChange('mainTitleColor', e.target.value)} className="w-full h-10" />
                </div>
                <div>
                  <label className={labelClass}>צבע הדגשה</label>
                  <input type="color" value={tempSettings.highlightColor} onChange={(e) => handleSettingChange('highlightColor', e.target.value)} className="w-full h-10" />
                </div>
              </div>
            </div>
          )}

          {showBackgroundColors && (
            <div id="background-colors" className="space-y-4">
              <div className="flex items-center gap-2 text-stone-700">
                <BackgroundIcon />
                <h3 className="text-sm font-semibold">צבעי רקע</h3>
              </div>
              <div>
                <label className={labelClass}>רקע כללי</label>
                <input type="color" value={tempSettings.mainBackgroundColor} onChange={(e) => handleSettingChange('mainBackgroundColor', e.target.value)} className="w-full h-10" />
                <div className="mt-1 text-xs text-stone-500">צבע הרקע הכללי של המסך</div>
              </div>
              <div>
                <label className={labelClass}>רקע הלוח</label>
                <div className="flex gap-2">
                  <input type="color" value={rgbaToHex(tempSettings.boardBackgroundColor)} onChange={(e) => {
                    const opacity = tempSettings.boardBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.7';
                    handleSettingChange('boardBackgroundColor', `rgba(${hexToRgb(e.target.value).join(', ')}, ${opacity})`);
                  }} className="flex-grow h-10" />
                  <input type="range" min="0" max="100" 
                    value={parseFloat(tempSettings.boardBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.7') * 100} 
                    onChange={(e) => {
                      const color = tempSettings.boardBackgroundColor.match(/rgba\((.*?),/)?.[1] || '255, 255, 255';
                      handleSettingChange('boardBackgroundColor', `rgba(${color}, ${parseFloat(e.target.value) / 100})`);
                    }} 
                    className="w-24" />
                </div>
                <div className="mt-1 text-xs text-stone-500">צבע הרקע של הלוח המרכזי</div>
              </div>
              <div>
                <label className={labelClass}>רקע העמודות</label>
                <div className="flex gap-2">
                  <input type="color" value={rgbaToHex(tempSettings.columnBackgroundColor)} onChange={(e) => {
                    const opacity = tempSettings.columnBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.5';
                    handleSettingChange('columnBackgroundColor', `rgba(${hexToRgb(e.target.value).join(', ')}, ${opacity})`);
                  }} className="flex-grow h-10" />
                  <input type="range" min="0" max="100" 
                    value={parseFloat(tempSettings.columnBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.5') * 100} 
                    onChange={(e) => {
                      const color = tempSettings.columnBackgroundColor.match(/rgba\((.*?),/)?.[1] || '255, 255, 255';
                      handleSettingChange('columnBackgroundColor', `rgba(${color}, ${parseFloat(e.target.value) / 100})`);
                    }} 
                    className="w-24" />
                </div>
                <div className="mt-1 text-xs text-stone-500">צבע הרקע של העמודות</div>
              </div>
              <div>
                <label className={labelClass}>רקע השעון</label>
                <div className="flex gap-2">
                  <input type="color" value={rgbaToHex(tempSettings.clockBackgroundColor)} onChange={(e) => {
                    const opacity = tempSettings.clockBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.3';
                    handleSettingChange('clockBackgroundColor', `rgba(${hexToRgb(e.target.value).join(', ')}, ${opacity})`);
                  }} className="flex-grow h-10" />
                  <input type="range" min="0" max="100" 
                    value={parseFloat(tempSettings.clockBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.3') * 100} 
                    onChange={(e) => {
                      const color = tempSettings.clockBackgroundColor.match(/rgba\((.*?),/)?.[1] || '255, 255, 255';
                      handleSettingChange('clockBackgroundColor', `rgba(${color}, ${parseFloat(e.target.value) / 100})`);
                    }} 
                    className="w-24" />
                </div>
                <div className="mt-1 text-xs text-stone-500">צבע הרקע של השעון</div>
              </div>
              <div>
                <label className={labelClass}>רקע פאנל הזמנים</label>
                <div className="flex gap-2">
                  <input type="color" value={rgbaToHex(tempSettings.zmanimBackgroundColor)} onChange={(e) => {
                    const opacity = tempSettings.zmanimBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.3';
                    handleSettingChange('zmanimBackgroundColor', `rgba(${hexToRgb(e.target.value).join(', ')}, ${opacity})`);
                  }} className="flex-grow h-10" />
                  <input type="range" min="0" max="100" 
                    value={parseFloat(tempSettings.zmanimBackgroundColor.match(/[\d.]+\)$/)?.[0].replace(')', '') || '0.3') * 100} 
                    onChange={(e) => {
                      const color = tempSettings.zmanimBackgroundColor.match(/rgba\((.*?),/)?.[1] || '255, 255, 255';
                      handleSettingChange('zmanimBackgroundColor', `rgba(${color}, ${parseFloat(e.target.value) / 100})`);
                    }} 
                    className="w-24" />
                </div>
                <div className="mt-1 text-xs text-stone-500">צבע הרקע של פאנל הזמנים</div>
              </div>
            </div>
          )}

          {showLocation && (
            <div id="location" className="space-y-4">
              <div className="flex items-center gap-2 text-stone-700">
                <LocationIcon />
                <h3 className="text-sm font-semibold">מיקום (לחישוב זמנים)</h3>
              </div>
              <div>
                <label className={labelClass}>קו רוחב (Latitude)</label>
                <input type="number" step="0.001" value={tempSettings.latitude} onChange={(e) => handleSettingChange('latitude', parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>קו אורך (Longitude)</label>
                <input type="number" step="0.001" value={tempSettings.longitude} onChange={(e) => handleSettingChange('longitude', parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>גובה (מטרים)</label>
                <input type="number" value={tempSettings.elevation} onChange={(e) => handleSettingChange('elevation', parseInt(e.target.value, 10) || 0)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>דקות לפני השקיעה (הדלקת נרות)</label>
                <input type="number" value={tempSettings.shabbatCandleOffset} onChange={(e) => handleSettingChange('shabbatCandleOffset', parseInt(e.target.value, 10) || 0)} className={inputClass} />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-300 flex gap-2">
          <button onClick={handleClose} className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
            <CancelIcon />
            <span>סגור</span>
          </button>
          <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
            <SaveIcon />
            <span>שמור שינויים</span>
          </button>
        </div>
      </div>
  );
});

export default EditPanel;
