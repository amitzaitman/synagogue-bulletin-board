import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { HashRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import BoardView from './components/BoardView';
import OnlineStatus from './components/OnlineStatus';
import { useEvents } from './hooks/useEvents';
import { useColumns } from './hooks/useColumns';
import { useBoardSettings } from './hooks/useBoardSettings';
import { useZmanim } from './hooks/useZmanim';
import { useLastSync } from './hooks/useLastSync';
import LandingPage from './components/LandingPage';
import { EventItem, Column, BoardSettings } from './types';
import { saveSelectedSynagogue } from './utils/offlineStorage';

const BoardPage: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();

  const [synagogueId, setSynagogueId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Single source of truth from hooks
  const { events, saveEvents, lastRefresh, loading: eventsLoading } = useEvents(synagogueId || undefined);
  const { columns, saveColumns } = useColumns(synagogueId || undefined);
  const { settings, saveSettings } = useBoardSettings(synagogueId || undefined);

  const { zmanimData, loading: zmanimLoading, error: zmanimError } = useZmanim(settings);
  const { lastSyncTime, isOnline } = useLastSync();

  // Resolve slug to synagogue ID
  useEffect(() => {
    const resolveSynagogue = async () => {
      if (!slugOrId) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'synagogues', slugOrId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSynagogueId(slugOrId);
        } else {
          const synagoguesSnapshot = await getDocs(collection(db, 'synagogues'));
          for (const synagogueDoc of synagoguesSnapshot.docs) {
            const settingsDoc = await getDoc(doc(db, 'synagogues', synagogueDoc.id, 'settings', 'board'));
            if (settingsDoc.exists() && settingsDoc.data().slug === slugOrId) {
              setSynagogueId(synagogueDoc.id);
              return;
            }
          }
          console.error('Synagogue not found');
          navigate('/');
        }
      } catch (error) {
        console.error('Error resolving synagogue:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    resolveSynagogue();
  }, [slugOrId, navigate]);

  const handleEnterEditMode = () => {
    // Entering edit mode - allow anyone to access
    setIsEditMode(true);
  };

  const handleSaveChanges = () => {
    // Exit edit mode (changes are already saved via hooks)
    setIsEditMode(false);
  };

  const handleBackToHome = () => {
    saveSelectedSynagogue('');
    navigate('/');
  };

  if (loading || !synagogueId || eventsLoading || !settings) {
    return <div className="flex items-center justify-center h-screen">טוען...</div>;
  }

  return (
    <>

      <div className="h-screen w-screen overflow-hidden flex items-center justify-center" style={{ backgroundColor: settings.mainBackgroundColor }}>
        <div 
          id="board-container"
          className="rounded-2xl shadow-[inset_0_6px_12px_rgba(80,50,20,0.12)] backdrop-blur-lg relative" 
          style={{ 
            backgroundColor: settings.boardBackgroundColor, 
            aspectRatio: '16/9',
            width: '100vw',
            height: 'calc(100vw * 9 / 16)',
            maxWidth: 'calc(100vh * 16 / 9)',
            maxHeight: '100vh',
            transformOrigin: 'center center'
          }}
        >
          <div className="w-full h-full" style={{ padding: '2%' }}>
            <BoardView
              events={events}
              columns={columns}
              settings={settings}
              saveEvents={saveEvents}
              saveColumns={saveColumns}
              saveSettings={saveSettings}
              onEnterEditMode={handleEnterEditMode}
              onSaveChanges={handleSaveChanges}
              onBackToHome={handleBackToHome}
              isEditMode={isEditMode}
              zmanimData={zmanimData}
              zmanimLoading={zmanimLoading}
              zmanimError={zmanimError}
              lastRefresh={lastRefresh}
              lastSyncTime={lastSyncTime}
              isOnline={isOnline}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <OnlineStatus />
      <Routes>
        <Route path="/:slugOrId" element={<BoardPage />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
};

export default App;
