import React, { useImperativeHandle, useRef } from 'react';
import { BoardSettings, ZmanimData } from '../types';

// Helper functions for color conversion
const rgbaToHex = (rgba: string): string => {
  // Extract RGB values from rgba(r, g, b, a) format
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/);
  if (!match) return '#ffffff';
  
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  
  const toHex = (n: number): string => {
    const hex = n.toString(16).padStart(2, '0');
    return hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Reusable Color+Opacity Control Component
interface ColorOpacityControlProps {
  label: string;
  description: string;
  value: string; // rgba string
  onChange: (newValue: string) => void;
  defaultOpacity?: number; // 0-1 range
}

const ColorOpacityControl: React.FC<ColorOpacityControlProps> = ({
  label,
  description,
  value,
  onChange,
  defaultOpacity = 0.7
}) => {
  const labelClass = "block text-sm font-medium text-stone-700 mb-1";
  
  // Extract RGB and opacity from rgba string
  const getColorParts = (rgba: string): { rgb: string; opacity: number } => {
    // Extract RGB and alpha values from rgba(r, g, b, a) format
    const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      const a = match[4] ? parseFloat(match[4]) : 1;
      
      return {
        rgb: `${r}, ${g}, ${b}`,
        opacity: a
      };
    }
    return { rgb: '255, 255, 255', opacity: defaultOpacity };
  };

  const { rgb, opacity } = getColorParts(value);
  const hexColor = rgbaToHex(value);

  const handleColorChange = (newHex: string) => {
    // Convert hex color to RGB and preserve current opacity
    const hexMatch = newHex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      const r = parseInt(hexMatch[1], 16);
      const g = parseInt(hexMatch[2], 16);
      const b = parseInt(hexMatch[3], 16);
      onChange(`rgba(${r}, ${g}, ${b}, ${opacity})`);
    } else {
      // Fallback to current RGB values if hex parsing fails
      onChange(`rgba(${rgb}, ${opacity})`);
    }
  };

  const handleOpacityChange = (newOpacity: number) => {
    onChange(`rgba(${rgb}, ${newOpacity})`);
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex gap-2">
        <div className="flex-1">
          <input 
            type="color" 
            value={hexColor} 
            onChange={(e) => handleColorChange(e.target.value)} 
            className="w-full h-10"
          />
        </div>
        <div className="w-20 flex flex-col items-center">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={Math.round(opacity * 100)} 
            onChange={(e) => handleOpacityChange(parseInt(e.target.value) / 100)}
            className="w-full"
          />
          <span className="text-xs text-stone-500 mt-1">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>
      <div className="mt-1 text-xs text-stone-500">{description}</div>
    </div>
  );
};

const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const FontIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const ColorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const BackgroundIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

interface EditPanelProps {
  settings: BoardSettings;
  onSave: (newSettings: BoardSettings) => void;
  zmanimData: ZmanimData | null;
  zmanimLoading: boolean;
  zmanimError: string | null;
  activeSection?: string;
}

const themes = {
  light: {
    prayerColor: '#78350f',
    classColor: '#115e59',
    freeTextColor: '#44403c',
    columnTitleColor: '#78350f',
    mainTitleColor: '#92400e',
    highlightColor: '#fef3c7',
    mainBackgroundColor: '#E6DFD4',
    boardBackgroundColor: 'rgba(248, 244, 237, 0.85)',
    columnBackgroundColor: 'rgba(251, 247, 241, 0.75)',
    clockBackgroundColor: 'rgba(244, 238, 228, 0.6)',
    zmanimBackgroundColor: 'rgba(244, 238, 228, 0.6)',
  },
  dark: {
    prayerColor: '#fde68a', // amber-200
    classColor: '#99f6e4', // teal-200
    freeTextColor: '#d6d3d1', // stone-300
    columnTitleColor: '#fde68a', // amber-200
    mainTitleColor: '#fed7aa', // amber-300
    highlightColor: '#451a03', // amber-950
    mainBackgroundColor: '#292524', // stone-800
    boardBackgroundColor: 'rgba(41, 37, 36, 0.85)',
    columnBackgroundColor: 'rgba(68, 64, 60, 0.75)',
    clockBackgroundColor: 'rgba(87, 83, 78, 0.6)',
    zmanimBackgroundColor: 'rgba(87, 83, 78, 0.6)',
  },
  brightBlue: {
    prayerColor: '#075985', // cyan-800
    classColor: '#0e7490', // cyan-700
    freeTextColor: '#334155', // slate-700
    columnTitleColor: '#075985', // cyan-800
    mainTitleColor: '#082f49', // cyan-950
    highlightColor: '#e0f2fe', // light blue-100
    mainBackgroundColor: '#f0f9ff', // light blue-50
    boardBackgroundColor: 'rgba(224, 242, 254, 0.85)', // light blue-100
    columnBackgroundColor: 'rgba(186, 230, 253, 0.75)', // light blue-200
    clockBackgroundColor: 'rgba(125, 211, 252, 0.6)', // light blue-300
    zmanimBackgroundColor: 'rgba(125, 211, 252, 0.6)', // light blue-300
  }
};

const EditPanel: React.FC<EditPanelProps> = React.forwardRef<{
  scrollToSection: (section: string) => void;
}, EditPanelProps>(({ settings, onSave, activeSection }, ref) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToSection: (section: string) => {
      const sectionElement = document.getElementById(section);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }));

  const handleSettingChange = (field: keyof BoardSettings, value: any) => {
    if (field === 'manualEventOrdering') {
      const isEnablingManual = value === true;
      const message = isEnablingManual
        ? 'האם אתה בטוח שברצונך לעבור למיון ידני?\n\nבמצב ידני, אירועים לא יסודרו אוטומטית לפי שעה. תוכל לגרור ולשנות את סדר האירועים באופן חופשי.'
        : 'האם אתה בטוח שברצונך לעבור למיון אוטומטי?\n\nבמצב אוטומטי, האירועים יסודרו אוטומטית לפי השעה שלהם בכל פעם שתערוך אירוע.';

      if (!window.confirm(message)) {
        return;
      }
    }

    let newSettings = { ...settings, [field]: value };

    if (field === 'theme' && (value === 'light' || value === 'dark' || value === 'brightBlue')) {
      newSettings = { ...newSettings, ...themes[value] };
    } else if (field.includes('Color')) {
      newSettings.theme = 'custom';
    }

    onSave(newSettings);
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
                value={settings.boardTitle || ''}
                onChange={(e) => handleSettingChange('boardTitle', e.target.value)}
                className={inputClass}
                placeholder="בית הכנסת - גבעת החי״ש"
                dir="rtl"
              />
            </div>
            <div>
              <label className={labelClass}>ערכת נושא</label>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className={inputClass}
              >
                <option value="light">בהיר</option>
                <option value="dark">כהה</option>
                <option value="brightBlue">כחול בהיר</option>
                <option value="custom" disabled>מותאם אישית</option>
              </select>
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
          </div>
        )}

        {showFontSizes && (
          <div id="font-sizes" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <FontIcon />
              <h3 className="text-sm font-semibold">גודל גופנים</h3>
            </div>
            <div>
              <label className={labelClass}>כותרת ראשית: {settings.mainTitleSize}%</label>
              <input type="range" min="50" max="200" step="5" value={settings.mainTitleSize} onChange={(e) => handleSettingChange('mainTitleSize', parseInt(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className={labelClass}>כותרת עמודה: {settings.columnTitleSize}%</label>
              <input type="range" min="50" max="200" step="5" value={settings.columnTitleSize} onChange={(e) => handleSettingChange('columnTitleSize', parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="text-sm text-stone-500 italic">
              גודל הטקסט הכללי מותאם אוטומטית כדי למנוע הסתרת תוכן
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
        )}

        {showBackgroundColors && (
          <div id="background-colors" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <BackgroundIcon />
              <h3 className="text-sm font-semibold">צבעי רקע</h3>
            </div>
            <div>
              <label className={labelClass}>רקע כללי</label>
              <input type="color" value={settings.mainBackgroundColor} onChange={(e) => handleSettingChange('mainBackgroundColor', e.target.value)} className="w-full h-10" />
              <div className="mt-1 text-xs text-stone-500">צבע הרקע הכללי של המסך</div>
            </div>
            <ColorOpacityControl
              label="רקע הלוח"
              description="צבע הרקע של הלוח המרכזי"
              value={settings.boardBackgroundColor}
              onChange={(value) => handleSettingChange('boardBackgroundColor', value)}
              defaultOpacity={0.7}
            />
            <ColorOpacityControl
              label="רקע העמודות"
              description="צבע הרקע של העמודות"
              value={settings.columnBackgroundColor}
              onChange={(value) => handleSettingChange('columnBackgroundColor', value)}
              defaultOpacity={0.5}
            />
            <ColorOpacityControl
              label="רקע השעון"
              description="צבע הרקע של השעון"
              value={settings.clockBackgroundColor}
              onChange={(value) => handleSettingChange('clockBackgroundColor', value)}
              defaultOpacity={0.3}
            />
            <ColorOpacityControl
              label="רקע פאנל הזמנים"
              description="צבע הרקע של פאנל הזמנים"
              value={settings.zmanimBackgroundColor}
              onChange={(value) => handleSettingChange('zmanimBackgroundColor', value)}
              defaultOpacity={0.3}
            />
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
              <input type="number" step="0.001" value={settings.latitude} onChange={(e) => handleSettingChange('latitude', parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>קו אורך (Longitude)</label>
              <input type="number" step="0.001" value={settings.longitude} onChange={(e) => handleSettingChange('longitude', parseFloat(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>גובה (מטרים)</label>
              <input type="number" value={settings.elevation} onChange={(e) => handleSettingChange('elevation', parseInt(e.target.value, 10) || 0)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>דקות לפני השקיעה (הדלקת נרות)</label>
              <input type="number" value={settings.shabbatCandleOffset} onChange={(e) => handleSettingChange('shabbatCandleOffset', parseInt(e.target.value, 10) || 0)} className={inputClass} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default EditPanel;
