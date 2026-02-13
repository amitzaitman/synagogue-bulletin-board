import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import NewBoardLayout from './features/board/components/NewBoardLayout';
import OnlineStatus from './shared/components/OnlineStatus';
import DebugConsole from './shared/components/DebugConsole';
import { useEvents } from './features/board/hooks/useEvents';
import { useColumns } from './features/board/hooks/useColumns';
import { useBoardSettings } from './features/board/hooks/useBoardSettings';
import { useZmanim } from './features/board/hooks/useZmanim';
import { useLastSync } from './shared/hooks/useLastSync';
import { useFirestoreNetwork } from './shared/hooks/useFirestoreNetwork';
import LandingPage from './features/landing/components/LandingPage';
import { saveSelectedSynagogue } from './shared/utils/storage';

const BoardPage: React.FC<{ onOpenDebug: () => void }> = ({ onOpenDebug }) => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);

  // Save selected synagogue to local storage for "last visited" functionality
  useEffect(() => {
    if (slugOrId) {
      saveSelectedSynagogue(slugOrId);
    }
  }, [slugOrId]);

  const { lastSyncTime, isOnline, updateSyncTime } = useLastSync();
  const { settings, saveSettings, loading: settingsLoading } = useBoardSettings(slugOrId, updateSyncTime);
  const { events, saveEvents, lastRefresh, loading: eventsLoading } = useEvents(slugOrId, updateSyncTime);
  const { columns, saveColumns, loading: columnsLoading } = useColumns(slugOrId, updateSyncTime);
  const { zmanimData, loading: zmanimLoading, error: zmanimError } = useZmanim(settings);

  const isLoading = slugOrId && (settingsLoading || eventsLoading || columnsLoading);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#E6DFD4] text-[#78350f]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xl font-medium">טוען נתונים...</span>
        </div>
      </div>
    );
  }

  return (
    <NewBoardLayout
      events={events}
      columns={columns}
      settings={settings}
      zmanimData={zmanimData}
      saveEvents={saveEvents}
      saveColumns={saveColumns}
      saveSettings={saveSettings}
      onEnterEditMode={() => setIsEditMode(true)}
      onSaveChanges={() => setIsEditMode(false)}
      onBackToHome={() => navigate('/')}
      isEditMode={isEditMode}
      zmanimLoading={zmanimLoading}
      zmanimError={zmanimError}
      lastRefresh={lastRefresh}
      lastSyncTime={lastSyncTime}
      isOnline={isOnline}
      onOpenDebug={onOpenDebug}
    />
  );
};

import { logVersion } from './utils/version';

const App: React.FC = () => {
  useFirestoreNetwork();
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  useEffect(() => {
    logVersion();
  }, []);

  return (
    <Router>
      <OnlineStatus />
      <DebugConsole isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
      <Routes>
        <Route path="/:slugOrId" element={<BoardPage onOpenDebug={() => setIsDebugOpen(true)} />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
};

export default App;
