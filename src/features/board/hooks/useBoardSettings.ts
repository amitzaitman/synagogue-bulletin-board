import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../shared/firebase';
import isEqual from 'fast-deep-equal';
import { BoardSettings } from '../../../shared/types/types';
import { createOfflineStorage } from '../../../shared/utils/offlineStorage';

import { DEFAULT_BOARD_SETTINGS } from '../../../shared/constants/layout';

export const defaultSettings = DEFAULT_BOARD_SETTINGS;

// Create offline storage for settings
const settingsStorage = createOfflineStorage<BoardSettings>({
  localStorageKey: 'boardSettings',
  firebasePath: (synagogueId) => `synagogues/${synagogueId}/settings/board`,
  defaultValue: defaultSettings,
  deserialize: (data) => {
    const loaded = { ...defaultSettings, ...(data || {}) };

    // Validate location data, falling back to defaults if invalid
    if (typeof loaded.latitude !== 'number' || typeof loaded.longitude !== 'number' ||
      (loaded.latitude === 0 && loaded.longitude === 0)) {
      loaded.latitude = defaultSettings.latitude;
      loaded.longitude = defaultSettings.longitude;
    }

    return loaded as BoardSettings;
  }
});

export const useBoardSettings = (synagogueId: string | undefined) => {
  // Load from localStorage immediately (fast, works offline)
  const [settings, setSettings] = useState<BoardSettings>(() => {
    if (!synagogueId) {
      console.info('[useBoardSettings] No synagogueId, using default settings');
      return defaultSettings;
    }
    console.info('[useBoardSettings] Loading initial settings from local storage');
    return settingsStorage.loadFromLocal();
  });

  useEffect(() => {
    if (!synagogueId) {
      setSettings(defaultSettings);
      return;
    }

    console.info(`[useBoardSettings] Setting up listener for synagogue: ${synagogueId}`);
    // Setup Firebase listener for real-time updates (when online)
    const unsubscribe = settingsStorage.setupFirebaseListener(synagogueId, (updatedSettings) => {
      console.info('[useBoardSettings] Received updated settings from Firebase');
      setSettings(updatedSettings);
    });

    return () => {
      console.info('[useBoardSettings] Cleaning up listener');
      unsubscribe();
    };
  }, [synagogueId]);

  const saveSettings = useCallback(async (newSettings: BoardSettings) => {
    if (!synagogueId) {
      console.warn('[useBoardSettings] Cannot save settings: No synagogueId');
      return;
    }

    setSettings(prev => {
      if (isEqual(prev, newSettings)) {
        console.info('[useBoardSettings] Settings unchanged, skipping save');
        return prev;
      }

      console.info('[useBoardSettings] Saving new settings');
      // 1. Save to localStorage immediately (instant, works offline)
      settingsStorage.saveToLocal(newSettings);

      // 2. Sync to Firebase in background (when online)
      settingsStorage.syncToFirebase(synagogueId, newSettings)
        .then(() => console.info('[useBoardSettings] Successfully synced to Firebase'))
        .catch(err => console.error('[useBoardSettings] Error syncing to Firebase:', err));

      return newSettings;
    });
  }, [synagogueId]);

  return { settings, saveSettings };
};
