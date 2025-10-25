import { useState, useEffect, useCallback } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import isEqual from 'fast-deep-equal';
import { Column } from '../types';
import { createOfflineStorage } from '../utils/offlineStorage';

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
    if (!synagogueId) return defaultColumns;
    return columnsStorage.loadFromLocal();
  });

  useEffect(() => {
    if (!synagogueId) {
      setColumns(defaultColumns);
      return;
    }

    // Setup Firebase listener for real-time updates (when online)
    const unsubscribe = columnsStorage.setupFirebaseListener(synagogueId, (updatedColumns) => {
      const sorted = updatedColumns.sort((a, b) => a.order - b.order);
      setColumns(sorted);
    });

    return () => unsubscribe();
  }, [synagogueId]);

  const saveColumns = useCallback(async (newColumns: Column[]) => {
    if (!synagogueId) return;

    setColumns(prev => {
      if (isEqual(prev, newColumns)) return prev;

      // 1. Save to localStorage immediately (instant, works offline)
      columnsStorage.saveToLocal(newColumns);

      // 2. Sync to Firebase in background (when online)
      columnsStorage.syncToFirebase(synagogueId, newColumns);

      return newColumns;
    });
  }, [synagogueId]);

  return { columns, saveColumns };
};
