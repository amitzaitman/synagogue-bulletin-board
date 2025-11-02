import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { getSelectedSynagogue, saveSelectedSynagogue } from '../utils/offlineStorage';

interface Synagogue {
  id: string;
  name: string;
  slug?: string;
}

const SynagogueList: React.FC = () => {
  const [synagogues, setSynagogues] = useState<Synagogue[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSynagogues = async () => {
      try {
        const selectedSynagogue = getSelectedSynagogue();
        if (selectedSynagogue) {
          navigate(`/${selectedSynagogue}`);
          return;
        }

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

    fetchSynagogues();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">טוען רשימת קהילות...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">רשימת קהילות</h1>
          <p className="text-gray-600">בחר קהילה לצפייה בלוח</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {synagogues.map(synagogue => {
            const linkTo = synagogue.slug ? `/${synagogue.slug}` : `/${synagogue.id}`;

            return (
              <Link
                to={linkTo}
                key={synagogue.id}
                className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                onClick={() => {
                  if (synagogue.slug) {
                    saveSelectedSynagogue(synagogue.slug);
                  }
                }}
              >
                <h2 className="text-2xl font-semibold text-indigo-900 mb-2">{synagogue.name}</h2>
                {synagogue.slug && (
                  <p className="text-sm text-gray-500 font-mono" dir="ltr">
                    {synagogue.slug}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {synagogues.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">אין קהילות רשומות כרגע</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SynagogueList;
