
import React from 'react';

interface EditModePanelProps {
  onSave: () => void;
  onOpenSettings: (section?: string) => void;
  onAddColumn: () => void;
  onExit: () => void;
  isOpen: boolean;
  onClose: () => void;
}

// Icons
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const FontIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10M12 3v18M8.5 8h7M10 12h4" /></svg>;
const ColorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const BackgroundIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const AddColumnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ExitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const EditModePanel: React.FC<EditModePanelProps> = ({ onOpenSettings, onAddColumn, onExit, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-3 flex flex-col gap-2">
        <button 
          onClick={() => onOpenSettings('general-settings')} 
          title="הגדרות כלליות"
          className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl shadow-sm transition-all hover:scale-110"
        >
          <SettingsIcon />
        </button>
        <button 
          onClick={() => onOpenSettings('font-sizes')} 
          title="גודל גופנים"
          className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl shadow-sm transition-all hover:scale-110"
        >
          <FontIcon />
        </button>
        <button 
          onClick={() => onOpenSettings('text-colors')} 
          title="צבעי טקסט"
          className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl shadow-sm transition-all hover:scale-110"
        >
          <ColorIcon />
        </button>
        <button 
          onClick={() => onOpenSettings('background-colors')} 
          title="צבעי רקע"
          className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl shadow-sm transition-all hover:scale-110"
        >
          <BackgroundIcon />
        </button>
        <button 
          onClick={() => onOpenSettings('location')} 
          title="מיקום"
          className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl shadow-sm transition-all hover:scale-110"
        >
          <LocationIcon />
        </button>
        <button 
          onClick={onAddColumn} 
          title="הוסף עמודה"
          className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl shadow-sm transition-all hover:scale-110"
        >
          <AddColumnIcon />
        </button>
        <button 
          onClick={onExit} 
          title="יציאה ממצב עריכה"
          className="p-3 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl shadow-sm transition-all hover:scale-110"
        >
          <ExitIcon />
        </button>
      </div>
    </div>
  );
};

export default EditModePanel;
