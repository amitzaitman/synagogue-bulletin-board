import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../../shared/firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

interface Synagogue {
  id: string;
  name: string;
  slug?: string;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [synagogues, setSynagogues] = useState<Synagogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSynagogueName, setNewSynagogueName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchSynagogues = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'synagogues'));
      const synagoguesPromises = querySnapshot.docs.map(async (docSnap) => {
        const settingsDoc = await getDoc(doc(db, 'synagogues', docSnap.id, 'settings', 'board'));
        const settingsData = settingsDoc.exists() ? settingsDoc.data() : {};

        return {
          id: docSnap.id,
          name: settingsData.boardTitle || docSnap.data().name || docSnap.id,
          slug: settingsData.slug,
        };
      });

      const synagoguesData = await Promise.all(synagoguesPromises);
      setSynagogues(synagoguesData);
    } catch (error) {
      console.error("Error fetching synagogues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSynagogues();
  }, []);

  const handleCreateSynagogue = async () => {
    if (!newSynagogueName.trim()) return;

    setCreating(true);
    try {
      // Create a simple slug from the name
      const slug = newSynagogueName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-א-ת]/g, '');

      // Generate a unique ID
      const synagogueId = `syn_${Date.now()}`;

      // Create synagogue document
      await setDoc(doc(db, 'synagogues', synagogueId), {
        name: newSynagogueName.trim(),
        createdAt: new Date().toISOString()
      });

      // Create default settings
      await setDoc(doc(db, 'synagogues', synagogueId, 'settings', 'board'), {
        boardTitle: newSynagogueName.trim(),
        slug: slug,
        city: '',
        latitude: '',
        longitude: '',
        mainBackgroundColor: '#f0f4f8',
        boardBackgroundColor: '#ffffff',
        columnBackgroundColor: '#f8fafc80',
        eventBackgroundColor: '#ffffff',
        headerTextColor: '#1e3a8a',
        eventTextColor: '#1e293b',
        columnTitleColor: '#475569',
        theme: 'custom',
        fontFamily: 'Rubik',
        showZmanim: false,
        showGregorianDate: false,
        showHebrewDate: true,
        showParsha: true,
        showHoliday: true
      });

      // Navigate to the new synagogue
      navigate(`/${slug}`);
    } catch (error) {
      console.error('Error creating synagogue:', error);
      alert('שגיאה ביצירת הקהילה. נסה שוב.');
    } finally {
      setCreating(false);
      setShowCreateDialog(false);
      setNewSynagogueName('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-indigo-900">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 relative">
      {/* Create Synagogue button in bottom right corner */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="fixed bottom-6 right-6 p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition transform hover:scale-110 z-50"
        title="צור קהילה חדשה"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Create Synagogue Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-indigo-900 text-center">צור קהילה חדשה</h2>
            <input
              type="text"
              value={newSynagogueName}
              onChange={(e) => setNewSynagogueName(e.target.value)}
              placeholder="שם הקהילה"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-right"
              dir="rtl"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !creating) {
                  handleCreateSynagogue();
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateSynagogue}
                disabled={creating || !newSynagogueName.trim()}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {creating ? 'יוצר...' : 'צור'}
              </button>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewSynagogueName('');
                }}
                disabled={creating}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-4 text-indigo-900">ברוכים הבאים</h1>
          <h2 className="text-2xl mb-4 text-indigo-700">ללוח הקהילה</h2>
          <p className="text-lg text-gray-700">בחר לוח קהילה לצפייה</p>
        </div>

        {synagogues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-600 mb-6">אין קהילות רשומות כרגע</p>
            <p className="text-gray-500 mb-8">לחץ על כפתור + ליצירת קהילה חדשה</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {synagogues.map(synagogue => {
              const linkTo = synagogue.slug ? `/${synagogue.slug}` : `/${synagogue.id}`;

              return (
                <Link
                  to={linkTo}
                  key={synagogue.id}
                  className="block bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 hover:scale-105"
                >
                  <h2 className="text-2xl font-bold text-indigo-900 mb-3 text-center">
                    {synagogue.name}
                  </h2>
                  {synagogue.slug && (
                    <p className="text-sm text-gray-500 font-mono text-center" dir="ltr">
                      {synagogue.slug}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
