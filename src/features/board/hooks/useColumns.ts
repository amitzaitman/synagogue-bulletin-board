import { useState, useEffect, useCallback } from 'react';
import { doc, writeBatch, collection } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '../../../shared/firebase';
import { Column } from '../../../shared/types/types';

export const defaultColumns: Column[] = [
  { id: 'col-erev-shabbat', title: 'ערב שבת', order: 0, columnType: 'shabbat' },
  { id: 'col-shabbat-day', title: 'יום השבת', order: 1, columnType: 'shabbat' },
];

export const useColumns = (synagogueId: string | undefined) => {
  const [columns, setColumns] = useState<Column[]>(synagogueId ? [] : defaultColumns);

  const columnsCollectionRef = synagogueId
    ? collection(db, `synagogues/${synagogueId}/columns`)
    : null;

  const [value, loading, error] = useCollectionData(columnsCollectionRef);

  useEffect(() => {
    if (value && value.length > 0) {
      const sorted = (value as Column[]).sort((a, b) => a.order - b.order);
      // Migration/Default handling: ensure columnType exists
      const withDefaults = sorted.map(col => ({
        ...col,
        columnType: col.columnType || 'shabbat'
      }));
      setColumns(withDefaults);
    } else if (value && value.length === 0) {
      // Server returned empty list, use defaults
      setColumns(defaultColumns);
    } else if (!synagogueId) {
      setColumns(defaultColumns);
    }
  }, [value, synagogueId]);

  const saveColumns = useCallback(async (newColumns: Column[]) => {
    if (!synagogueId) {
      console.warn('[useColumns] Cannot save columns: No synagogueId');
      setColumns(newColumns);
      return;
    }

    console.info(`[useColumns] Saving ${newColumns.length} columns`);
    setColumns(newColumns); // Optimistic update

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
    } catch (err) {
      console.error('[useColumns] Error syncing to Firebase:', err);
    }
  }, [synagogueId, value]);

  return { columns, saveColumns, loading };
};
