import { useState, useEffect, useCallback } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../../shared/firebase';
import { Column } from '../../../shared/types/types';
import { createOfflineStorage } from '../../../shared/utils/offlineStorage';

export const defaultColumns: Column[] = [
  { id: 'col-erev-shabbat', title: 'ערב שבת', order: 0, columnType: 'shabbat' },
  { id: 'col-shabbat-day', title: 'יום השבת', order: 1, columnType: 'shabbat' },
];

// Create offline storage for columns
const columnsStorage = createOfflineStorage<Column[]>({
  localStorageKey: 'boardColumns',
  firebaseCollectionPath: (synagogueId) => `synagogues/${synagogueId}/columns`,
  defaultValue: defaultColumns,
  deserialize: (data) => {
    // Migration: add columnType if missing (default to 'shabbat' for backward compatibility)
    if (Array.isArray(data)) {
      return data.map(col => ({
        ...col,
        columnType: col.columnType || 'shabbat'
      }));
    }
    return data;
  }
});

export const useColumns = (synagogueId: string | undefined) => {
  // Load from localStorage immediately (fast, works offline)
  const [columns, setColumns] = useState<Column[]>(() => {
    if (!synagogueId) {
      console.info('[useColumns] No synagogueId, using default columns');
      return defaultColumns;
    }
    console.info('[useColumns] Loading initial columns from local storage');
    return columnsStorage.loadFromLocal();
  });

  useEffect(() => {
    if (!synagogueId) {
      setColumns(defaultColumns);
      return;
    }

    console.info(`[useColumns] Setting up listener for synagogue: ${synagogueId}`);
    // Setup Firebase listener for real-time updates (when online)
    const unsubscribe = columnsStorage.setupFirebaseListener(synagogueId, (updatedColumns) => {
      console.info(`[useColumns] Received ${updatedColumns.length} columns from Firebase`);
      const sorted = updatedColumns.sort((a, b) => a.order - b.order);
      setColumns(sorted);
    });

    return () => {
      console.info('[useColumns] Cleaning up listener');
      unsubscribe();
    };
  }, [synagogueId]);

  const saveColumns = useCallback(async (newColumns: Column[]) => {
    if (!synagogueId) {
      console.warn('[useColumns] Cannot save columns: No synagogueId');
      return;
    }

    console.info(`[useColumns] Saving ${newColumns.length} columns`);
    setColumns(prev => {
      // 1. Save to localStorage immediately (instant, works offline)
      columnsStorage.saveToLocal(newColumns);

      // 2. Sync to Firebase in background (when online)
      columnsStorage.syncToFirebase(synagogueId, newColumns)
        .then(() => console.info('[useColumns] Successfully synced to Firebase'))
        .catch(err => console.error('[useColumns] Error syncing to Firebase:', err));

      return newColumns;
    });
  }, [synagogueId]);

  return { columns, saveColumns };
};
