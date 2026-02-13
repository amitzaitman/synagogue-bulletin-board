import { useState, useEffect, useCallback } from 'react';
import { doc, writeBatch, collection } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '../../../shared/firebase';
import { Column } from '../../../shared/types/types';
import { useToast } from '../../../shared/context';
import isEqual from 'fast-deep-equal';

export const defaultColumns: Column[] = [
  { id: 'col-erev-shabbat', title: 'ערב שבת', order: 0, columnType: 'shabbat' },
  { id: 'col-shabbat-day', title: 'יום השבת', order: 1, columnType: 'shabbat' },
];

const getLocalStorageKey = (synagogueId: string) => `syn_${synagogueId}_columns`;

export const useColumns = (synagogueId: string | undefined, onSync?: () => void) => {
  const { showToast } = useToast();

  // Track whether we initialized from localStorage (used to skip loading spinner)
  const [hasLocalCache, setHasLocalCache] = useState(false);

  // Initialize from local storage if available
  const [columns, setColumns] = useState<Column[]>(() => {
    if (!synagogueId) return defaultColumns;
    try {
      const stored = localStorage.getItem(getLocalStorageKey(synagogueId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasLocalCache(true);
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load columns from local storage', e);
    }
    return [];
  });

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const columnsCollectionRef = synagogueId
    ? collection(db, `synagogues/${synagogueId}/columns`)
    : null;

  const [value, loading, error] = useCollectionData(columnsCollectionRef);

  useEffect(() => {
    if (!synagogueId) {
      if (!initialLoadDone) {
        setColumns(defaultColumns);
        setInitialLoadDone(true);
      }
      return;
    }

    // If there's an error (e.g. offline, permissions), keep cached data
    if (error) {
      console.warn('[useColumns] Firestore error, using cached data:', error.message);
      setInitialLoadDone(true);
      return;
    }

    if (loading) return;

    if (value) {
      // Notify sync occurred
      if (onSync) onSync();

      const sorted = (value as Column[]).sort((a, b) => a.order - b.order);
      // Migration/Default handling: ensure columnType exists
      const withDefaults = sorted.map(col => ({
        ...col,
        columnType: col.columnType || 'shabbat'
      }));

      // If server data is empty and we have no local data, use defaults
      if (withDefaults.length === 0 && columns.length === 0 && !initialLoadDone) {
        setColumns(defaultColumns);
        setInitialLoadDone(true);
        return;
      }

      if (!isEqual(withDefaults, columns)) {
        setColumns(withDefaults);
        setHasLocalCache(true);
        try {
          localStorage.setItem(getLocalStorageKey(synagogueId), JSON.stringify(withDefaults));
        } catch (e) {
          console.error('Failed to save columns to local storage', e);
        }

        if (initialLoadDone) {
          showToast('מבנה הלוח עודכן מהשרת', 'info', 2000);
        }
      }
      setInitialLoadDone(true);
    }
  }, [value, loading, error, synagogueId, onSync]);

  const saveColumns = useCallback(async (newColumns: Column[]) => {
    if (!synagogueId) {
      console.warn('[useColumns] Cannot save columns: No synagogueId');
      setColumns(newColumns);
      return;
    }

    console.info(`[useColumns] Saving ${newColumns.length} columns`);
    setColumns(newColumns); // Optimistic update

    try {
      localStorage.setItem(getLocalStorageKey(synagogueId), JSON.stringify(newColumns));
    } catch (e) {
      console.error('Failed to save columns to local storage', e);
    }

    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, `synagogues/${synagogueId}/columns`);

      const currentServerIds = new Set(value?.map(c => (c as Column).id) || []);
      const newIds = new Set(newColumns.map(c => c.id));

      // Updates & Inserts
      newColumns.forEach(col => {
        const docRef = doc(collectionRef, col.id);
        batch.set(docRef, col);
      });

      // Deletions
      currentServerIds.forEach(id => {
        if (!newIds.has(id)) {
          batch.delete(doc(collectionRef, id));
        }
      });

      await batch.commit();
      console.info('[useColumns] Successfully synced to Firebase');
      showToast('השינויים נשמרו בהצלחה', 'success');
    } catch (err) {
      console.error('[useColumns] Error syncing to Firebase:', err);
      showToast('שגיאה בשמירת הנתונים', 'error');
    }
  }, [synagogueId, value, showToast]);

  return { columns, saveColumns, loading: loading && columns.length === 0 && !hasLocalCache };
};
