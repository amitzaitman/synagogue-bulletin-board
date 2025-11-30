import React, { useImperativeHandle, useRef } from 'react';
import { BoardSettings, ZmanimData } from '../../../shared/types/types';

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
    prayerColor: '#1e3a5f', // brand-dark
    classColor: '#2c5282', // brand-accent
    freeTextColor: '#4a5568', // gray-700
    columnTitleColor: '#ffffff',
    mainTitleColor: '#ffffff',
    highlightColor: '#fef3c7',
    mainBackgroundColor: '#f0f2f5', // brand-bg
    boardBackgroundColor: 'rgba(240, 242, 245, 0)', // transparent
    columnBackgroundColor: '#ffffff',
    clockBackgroundColor: 'rgba(255, 255, 255, 0.1)',
    zmanimBackgroundColor: '#1e3a5f', // brand-dark
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
  const [activeTab, setActiveTab] = React.useState('general');
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync external activeSection prop with internal state if provided
  React.useEffect(() => {
    if (activeSection) {
      if (activeSection === 'general-settings') setActiveTab('general');
      else if (activeSection === 'font-sizes') setActiveTab('fonts');
      else if (activeSection === 'text-colors') setActiveTab('colors');
      else if (activeSection === 'background-colors') setActiveTab('background');
      else if (activeSection === 'location') setActiveTab('location');
    }
  }, [activeSection]);

  useImperativeHandle(ref, () => ({
    scrollToSection: (section: string) => {
      // Map legacy section names to tabs
      if (section === 'general-settings') setActiveTab('general');
      else if (section === 'font-sizes') setActiveTab('fonts');
      else if (section === 'text-colors') setActiveTab('colors');
      else if (section === 'background-colors') setActiveTab('background');
      else if (section === 'location') setActiveTab('location');
    }
  }));

  const handleSettingChange = (field: keyof BoardSettings, value: any) => {


    let newSettings = { ...settings, [field]: value };

    if (field === 'theme' && (value === 'light' || value === 'dark' || value === 'brightBlue')) {
      newSettings = { ...newSettings, ...themes[value as keyof typeof themes] };
    } else if (field.includes('Color')) {
      newSettings.theme = 'custom';
    }

    onSave(newSettings);
  };

  const inputClass = "w-full p-2 border rounded-md bg-white/50 text-sm";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  const tabs = [
    { id: 'general', label: 'כללי', icon: <SettingsIcon /> },
    { id: 'fonts', label: 'גופנים וריווח', icon: <FontIcon /> },
    { id: 'colors', label: 'צבעי טקסט', icon: <ColorIcon /> },
    { id: 'background', label: 'רקעים', icon: <BackgroundIcon /> },
    { id: 'location', label: 'מיקום וזמנים', icon: <LocationIcon /> },
  ];

  return (
    <div ref={panelRef} className="flex flex-col h-full bg-stone-50">
      {/* Tabs Header */}
      <div className="flex border-b bg-white overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
              ? 'text-brand-dark border-b-2 border-brand-dark bg-brand-bg/10'
              : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
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
                <option value="light">רגיל (כחול)</option>
                <option value="dark">כהה</option>
                <option value="brightBlue">כחול בהיר</option>
                <option value="custom" disabled>מותאם אישית</option>
              </select>
            </div>

          </div>
        )}

        {activeTab === 'fonts' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm mb-6">
              <p><strong>שים לב:</strong> גודל הטקסט של האירועים מותאם אוטומטית כדי למלא את המסך. ההגדרות כאן משפיעות על היחס בין האלמנטים.</p>
            </div>
            <div>
              <label className={labelClass}>גודל כותרת ראשית: {settings.mainTitleSize}%</label>
              <input type="range" min="50" max="200" step="5" value={settings.mainTitleSize} onChange={(e) => handleSettingChange('mainTitleSize', parseInt(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className={labelClass}>גודל כותרת עמודה: {settings.columnTitleSize}%</label>
              <input type="range" min="50" max="200" step="5" value={settings.columnTitleSize} onChange={(e) => handleSettingChange('columnTitleSize', parseInt(e.target.value))} className="w-full" />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-stone-900 mb-4">ריווח אירועים</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>מרווח אנכי (מעל/מתחת): {settings.eventPaddingY ?? 6}px</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={settings.eventPaddingY ?? 6}
                    onChange={(e) => handleSettingChange('eventPaddingY', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className={labelClass}>מרווח אופקי (צדדים): {settings.eventPaddingX ?? 12}px</label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={settings.eventPaddingX ?? 12}
                    onChange={(e) => handleSettingChange('eventPaddingX', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto animate-fade-in">
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900 border-b pb-2">טקסטים</h3>
              <div>
                <label className={labelClass}>צבע תפילה</label>
                <input type="color" value={settings.prayerColor} onChange={(e) => handleSettingChange('prayerColor', e.target.value)} className="w-full h-10 rounded cursor-pointer" />
              </div>
              <div>
                <label className={labelClass}>צבע אירוע</label>
                <input type="color" value={settings.classColor} onChange={(e) => handleSettingChange('classColor', e.target.value)} className="w-full h-10 rounded cursor-pointer" />
              </div>
              <div>
                <label className={labelClass}>צבע טקסט חופשי</label>
                <input type="color" value={settings.freeTextColor} onChange={(e) => handleSettingChange('freeTextColor', e.target.value)} className="w-full h-10 rounded cursor-pointer" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900 border-b pb-2">כותרות והדגשות</h3>
              <div>
                <label className={labelClass}>צבע כותרת עמודה</label>
                <input type="color" value={settings.columnTitleColor} onChange={(e) => handleSettingChange('columnTitleColor', e.target.value)} className="w-full h-10 rounded cursor-pointer" />
              </div>
              <div>
                <label className={labelClass}>צבע כותרת ראשית</label>
                <input type="color" value={settings.mainTitleColor} onChange={(e) => handleSettingChange('mainTitleColor', e.target.value)} className="w-full h-10 rounded cursor-pointer" />
              </div>
              <label className={labelClass}>צבע הדגשה</label>
              <div className="flex gap-2">
                <input type="color" value={settings.highlightColor || '#ffffff'} onChange={(e) => handleSettingChange('highlightColor', e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                <button
                  onClick={() => handleSettingChange('highlightColor', '')}
                  className="px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                  title="ללא צבע הדגשה"
                >
                  ללא
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'background' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorOpacityControl
                label="רקע הלוח"
                description="הרקע של אזור התוכן המרכזי"
                value={settings.boardBackgroundColor}
                onChange={(value) => handleSettingChange('boardBackgroundColor', value)}
                defaultOpacity={0.7}
              />
              <ColorOpacityControl
                label="רקע העמודות"
                description="הרקע של כל עמודה בנפרד"
                value={settings.columnBackgroundColor}
                onChange={(value) => handleSettingChange('columnBackgroundColor', value)}
                defaultOpacity={0.5}
              />
              <ColorOpacityControl
                label="רקע השעון"
                description="הרקע של אזור השעון"
                value={settings.clockBackgroundColor}
                onChange={(value) => handleSettingChange('clockBackgroundColor', value)}
                defaultOpacity={0.3}
              />
              <ColorOpacityControl
                label="רקע פאנל הזמנים"
                description="הרקע של אזור זמני היום"
                value={settings.zmanimBackgroundColor}
                onChange={(value) => handleSettingChange('zmanimBackgroundColor', value)}
                defaultOpacity={0.3}
              />
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
              <h4 className="font-semibold mb-2">מיקום נוכחי</h4>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
              <h4 className="font-semibold mb-2">הגדרות זמנים</h4>
              <div>
                <label className={labelClass}>דקות לפני השקיעה (הדלקת נרות)</label>
                <input type="number" value={settings.shabbatCandleOffset} onChange={(e) => handleSettingChange('shabbatCandleOffset', parseInt(e.target.value, 10) || 0)} className={inputClass} />
                <div className="mt-1 text-xs text-stone-500">ברירת מחדל: 20 דקות (כמנהג רוב הארץ)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default EditPanel;
