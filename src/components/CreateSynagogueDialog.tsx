import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { BoardSettings } from '../types';

interface CreateSynagogueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (synagogueId: string) => void;
}

const CreateSynagogueDialog: React.FC<CreateSynagogueDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [synagogueName, setSynagogueName] = useState('');
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create new synagogue ID
      const synagogueId = doc(collection(db, 'synagogues')).id;

      // Default settings
      const defaultSettings: BoardSettings = {
        boardTitle: synagogueName,
        slug: slug || synagogueId,
        password: password || '',
        hasCompletedSetup: false,
        manualEventOrdering: false,
        scale: 1,
        mainTitleSize: 100,
        columnTitleSize: 100,
        eventTextScale: 100,
        prayerColor: '#1e40af',
        classColor: '#16a34a',
        freeTextColor: '#64748b',
        columnTitleColor: '#0f172a',
        mainTitleColor: '#0f172a',
        highlightColor: '#dc2626',
        mainBackgroundColor: '#fef3c7',
        boardBackgroundColor: 'rgba(254, 252, 232, 0.7)',
        columnBackgroundColor: 'rgba(255, 255, 255, 0.5)',
        clockBackgroundColor: 'rgba(254, 243, 199, 0.3)',
        zmanimBackgroundColor: 'rgba(254, 243, 199, 0.3)',
        shabbatCandleOffset: 18,
        elevation: 0,
        latitude: 31.7683,
        longitude: 35.2137,
      };

      // Create synagogue document
      await setDoc(doc(db, 'synagogues', synagogueId), {
        name: synagogueName,
        createdAt: Date.now(),
      });

      // Create settings
      await setDoc(
        doc(db, 'synagogues', synagogueId, 'settings', 'board'),
        defaultSettings
      );

      // Create default columns
      const shabbatColumn = {
        id: 'shabbat-1',
        title: 'שבת',
        order: 0,
        columnType: 'shabbat',
      };

      const weekdaysColumn = {
        id: 'weekdays-1',
        title: 'ימים רגילים',
        order: 1,
        columnType: 'weekdays',
      };

      await setDoc(
        doc(db, 'synagogues', synagogueId, 'columns', 'shabbat-1'),
        shabbatColumn
      );

      await setDoc(
        doc(db, 'synagogues', synagogueId, 'columns', 'weekdays-1'),
        weekdaysColumn
      );

      // Reset form
      setSynagogueName('');
      setSlug('');
      setPassword('');

      onSuccess(synagogueId);
    } catch (err: any) {
      console.error('Error creating synagogue:', err);
      setError('שגיאה ביצירת קהילה: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSynagogueName('');
    setSlug('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl" style={{ direction: 'rtl' }}>
        <h2 className="text-2xl font-bold mb-4 text-center">יצירת קהילה חדשה</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              שם הקהילה <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={synagogueName}
              onChange={(e) => setSynagogueName(e.target.value)}
              placeholder="קהילת בני תורה"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              כתובת URL (אנגלית)
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="kehilat-bnei-torah"
              dir="ltr"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              אופציונלי - אם לא מוזן, יווצר אוטומטית
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              סיסמת עריכה
            </label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="הזן סיסמה לבעל הקהילה"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              אופציונלי - ניתן להגדיר מאוחר יותר
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !synagogueName}
              className="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {loading ? 'יוצר...' : 'צור קהילה'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 disabled:bg-gray-200 transition"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSynagogueDialog;
