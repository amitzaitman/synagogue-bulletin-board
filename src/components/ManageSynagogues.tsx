import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, getDoc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import CreateSynagogueDialog from './CreateSynagogueDialog';

interface Synagogue {
  id: string;
  name: string;
  slug?: string;
}

interface EditingSynagogue {
  id: string;
  name: string;
  slug: string;
}

const ManageSynagogues: React.FC = () => {
  const [user, authLoading] = useAuthState(auth);
  const [synagogues, setSynagogues] = useState<Synagogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSynagogue, setEditingSynagogue] = useState<EditingSynagogue | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

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

  const handleCreateSuccess = (synagogueId: string) => {
    setShowCreateDialog(false);
    fetchSynagogues();
  };

  const handleEdit = (synagogue: Synagogue) => {
    setEditingSynagogue({
      id: synagogue.id,
      name: synagogue.name,
      slug: synagogue.slug || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSynagogue) return;

    try {
      // Update settings
      await updateDoc(doc(db, 'synagogues', editingSynagogue.id, 'settings', 'board'), {
        boardTitle: editingSynagogue.name,
        slug: editingSynagogue.slug,
      });

      // Update main document
      await updateDoc(doc(db, 'synagogues', editingSynagogue.id), {
        name: editingSynagogue.name,
      });

      setEditingSynagogue(null);
      fetchSynagogues();
    } catch (error) {
      console.error('Error updating synagogue:', error);
      alert('שגיאה בעדכון הקהילה');
    }
  };

  const handleDelete = async (synagogueId: string) => {
    if (deleteConfirm !== synagogueId) {
      setDeleteConfirm(synagogueId);
      return;
    }

    try {
      // Delete subcollections
      const eventsSnapshot = await getDocs(collection(db, 'synagogues', synagogueId, 'events'));
      for (const eventDoc of eventsSnapshot.docs) {
        await deleteDoc(doc(db, 'synagogues', synagogueId, 'events', eventDoc.id));
      }

      const columnsSnapshot = await getDocs(collection(db, 'synagogues', synagogueId, 'columns'));
      for (const columnDoc of columnsSnapshot.docs) {
        await deleteDoc(doc(db, 'synagogues', synagogueId, 'columns', columnDoc.id));
      }

      const settingsSnapshot = await getDocs(collection(db, 'synagogues', synagogueId, 'settings'));
      for (const settingDoc of settingsSnapshot.docs) {
        await deleteDoc(doc(db, 'synagogues', synagogueId, 'settings', settingDoc.id));
      }

      // Delete main document
      await deleteDoc(doc(db, 'synagogues', synagogueId));

      setDeleteConfirm(null);
      fetchSynagogues();
    } catch (error) {
      console.error('Error deleting synagogue:', error);
      alert('שגיאה במחיקת הקהילה');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <>
      <CreateSynagogueDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
      />

      {editingSynagogue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" style={{ direction: 'rtl' }}>
            <h2 className="text-2xl font-bold mb-4">עריכת קהילה</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם הקהילה</label>
                <input
                  type="text"
                  value={editingSynagogue.name}
                  onChange={(e) => setEditingSynagogue({ ...editingSynagogue, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">כתובת URL (אנגלית)</label>
                <input
                  type="text"
                  value={editingSynagogue.slug}
                  onChange={(e) => setEditingSynagogue({ ...editingSynagogue, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  dir="ltr"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>



              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
                >
                  שמור
                </button>
                <button
                  onClick={() => setEditingSynagogue(null)}
                  className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-indigo-900 mb-2">ניהול קהילות</h1>
            <p className="text-gray-600">מסך ניהול</p>

            <div className="mt-4">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg"
              >
                ➕ יצירת קהילה חדשה
              </button>
            </div>
          </div>

          {synagogues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">אין קהילות רשומות כרגע</p>
              <p className="text-gray-500">לחץ על "יצירת קהילה חדשה" כדי להתחיל</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full" style={{ direction: 'rtl' }}>
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-bold text-indigo-900">שם הקהילה</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-indigo-900">כתובת URL</th>

                    <th className="px-6 py-3 text-center text-sm font-bold text-indigo-900">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {synagogues.map((synagogue, index) => (
                    <tr key={synagogue.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{synagogue.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600" dir="ltr">
                        {synagogue.slug || synagogue.id}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            to={`/${synagogue.slug || synagogue.id}`}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                            title="צפה בלוח"
                          >
                            👁️ צפה
                          </Link>
                          <button
                            onClick={() => handleEdit(synagogue)}
                            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
                            title="ערוך"
                          >
                            ✏️ ערוך
                          </button>
                          <button
                            onClick={() => handleDelete(synagogue.id)}
                            className={`px-3 py-1 text-white text-sm rounded transition ${
                              deleteConfirm === synagogue.id
                                ? 'bg-red-700 hover:bg-red-800'
                                : 'bg-red-500 hover:bg-red-600'
                            }`}
                            title={deleteConfirm === synagogue.id ? 'לחץ שוב לאישור' : 'מחק'}
                          >
                            {deleteConfirm === synagogue.id ? '⚠️ אשר מחיקה' : '🗑️ מחק'}
                          </button>
                          {deleteConfirm === synagogue.id && (
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition"
                            >
                              ביטול
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 text-center space-x-4 space-x-reverse">
            <button
              onClick={async () => {
                await auth.signOut();
                navigate('/');
              }}
              className="inline-block px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
            >
              יציאה וחזרה לדף הבית
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageSynagogues;
