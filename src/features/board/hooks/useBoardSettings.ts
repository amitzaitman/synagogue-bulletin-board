import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../shared/firebase';
import isEqual from 'fast-deep-equal';
import { BoardSettings } from '../../../shared/types/types';
import { createOfflineStorage } from '../../../shared/utils/offlineStorage';

export const defaultSettings: BoardSettings = {
  boardTitle: 'בית הכנסת - גבעת החי״ש',
  hasCompletedSetup: false, // User hasn't completed setup yet
  manualEventOrdering: false, // Auto-sort by default
  scale: 1.0,
  mainTitleSize: 100, // percentage
  columnTitleSize: 100, // percentage
  eventTextScale: 100, // percentage
  theme: 'light',
  // Colors for text elements
  prayerColor: '#78350f', // tailwind amber-900
  classColor: '#115e59', // tailwind teal-800
  freeTextColor: '#44403c', // tailwind stone-700
  columnTitleColor: '#78350f', // tailwind amber-900
  mainTitleColor: '#92400e', // tailwind amber-800
  highlightColor: '#fef3c7', // tailwind amber-100
  // Background colors with opacity for layered effect
  mainBackgroundColor: '#E6DFD4', // רקע כללי בגוון קרם חמים
  boardBackgroundColor: 'rgba(248, 244, 237, 0.85)', // רקע הלוח - קרם בהיר שקוף
  columnBackgroundColor: 'rgba(251, 247, 241, 0.75)', // רקע העמודות - קרם בהיר יותר
  clockBackgroundColor: 'rgba(244, 238, 228, 0.6)', // רקע השעון - גוון חמים שקוף
  zmanimBackgroundColor: 'rgba(244, 238, 228, 0.6)', // רקע פאנל הזמנים - גוון חמים שקוף
  shabbatCandleOffset: 30, // minutes before sunset
  elevation: 970, // Default to Gush Etzion
  latitude: 31.654,
  longitude: 35.132,
};

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
    if (!synagogueId) return defaultSettings;
    return settingsStorage.loadFromLocal();
  });

  useEffect(() => {
    if (!synagogueId) {
      setSettings(defaultSettings);
      return;
    }

    // Setup Firebase listener for real-time updates (when online)
    const unsubscribe = settingsStorage.setupFirebaseListener(synagogueId, (updatedSettings) => {
      setSettings(updatedSettings);
    });

    return () => {
      unsubscribe();
    };
  }, [synagogueId]);

  const saveSettings = useCallback(async (newSettings: BoardSettings) => {
    if (!synagogueId) return;

    setSettings(prev => {
      if (isEqual(prev, newSettings)) return prev;

      // 1. Save to localStorage immediately (instant, works offline)
      settingsStorage.saveToLocal(newSettings);

      // 2. Sync to Firebase in background (when online)
      settingsStorage.syncToFirebase(synagogueId, newSettings);

      return newSettings;
    });
  }, [synagogueId]);

  return { settings, saveSettings };
};
