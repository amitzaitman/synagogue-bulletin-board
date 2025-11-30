import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { db } from '../../../shared/firebase';
import isEqual from 'fast-deep-equal';
import { BoardSettings } from '../../../shared/types/types';
import { DEFAULT_BOARD_SETTINGS } from '../../../shared/constants/layout';

export const defaultSettings = DEFAULT_BOARD_SETTINGS;

export const useBoardSettings = (synagogueId: string | undefined) => {
  const [settings, setSettings] = useState<BoardSettings>(defaultSettings);

  const settingsDocRef = synagogueId
    ? doc(db, `synagogues/${synagogueId}/settings/board`)
    : null;

  const [value, loading] = useDocumentData(settingsDocRef);

  useEffect(() => {
    if (value) {
      const loaded = { ...defaultSettings, ...(value || {}) };
      // Validate location data, falling back to defaults if invalid
      if (typeof loaded.latitude !== 'number' || typeof loaded.longitude !== 'number' ||
        (loaded.latitude === 0 && loaded.longitude === 0)) {
        loaded.latitude = defaultSettings.latitude;
        loaded.longitude = defaultSettings.longitude;
      }
      setSettings(loaded as BoardSettings);
    } else if (!loading && synagogueId) {
      // Document doesn't exist or is empty, use defaults
      setSettings(defaultSettings);
    } else if (!synagogueId) {
      setSettings(defaultSettings);
    }
  }, [value, loading, synagogueId]);

  const saveSettings = useCallback(async (newSettings: BoardSettings) => {
    if (!synagogueId) {
      console.warn('[useBoardSettings] Cannot save settings: No synagogueId');
      return;
    }

    if (isEqual(settings, newSettings)) {
      console.info('[useBoardSettings] Settings unchanged, skipping save');
      return;
    }

    console.info('[useBoardSettings] Saving new settings');
    setSettings(newSettings); // Optimistic update

    try {
      const docRef = doc(db, `synagogues/${synagogueId}/settings/board`);
      await setDoc(docRef, newSettings);
      console.info('[useBoardSettings] Successfully synced to Firebase');
    } catch (err) {
      console.error('[useBoardSettings] Error syncing to Firebase:', err);
    }
  }, [synagogueId, settings]);

  return { settings, saveSettings, loading };
};
