import React, { useState, useEffect } from 'react';
import { db } from './shared/firebase';
import { HashRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
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
import { saveSelectedSynagogue } from './shared/utils/offlineStorage';

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

  const { settings, saveSettings } = useBoardSettings(slugOrId);
  const { events, saveEvents, lastRefresh } = useEvents(slugOrId);
  const { columns, saveColumns } = useColumns(slugOrId);
  const { zmanimData, loading: zmanimLoading, error: zmanimError } = useZmanim(settings);
  const { lastSyncTime, isOnline } = useLastSync();

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

const App: React.FC = () => {
  useFirestoreNetwork();
  const [isDebugOpen, setIsDebugOpen] = useState(false);

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
