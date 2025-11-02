import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

interface Synagogue {
  id: string;
  name: string;
  slug?: string;
}

const LandingPage: React.FC = () => {
  const [synagogues, setSynagogues] = useState<Synagogue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchSynagogues();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-indigo-900">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 relative">
      {/* Management button in bottom right corner */}
      <Link
        to="/super-login"
        className="fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-110 z-50"
        title="ניהול קהילות"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Link>

      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-4 text-indigo-900">ברוכים הבאים</h1>
          <h2 className="text-2xl mb-4 text-indigo-700">ללוח הקהילה</h2>
          <p className="text-lg text-gray-700">בחר לוח קהילה לצפייה</p>
        </div>

        {synagogues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-600 mb-6">אין קהילות רשומות כרגע</p>
            <p className="text-gray-500 mb-8">צור קשר עם המנהל להוספת קהילה</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
