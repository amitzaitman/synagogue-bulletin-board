import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { db } from '../../../shared/firebase';
import isEqual from 'fast-deep-equal';
import { BoardSettings } from '../../../shared/types/types';
import { DEFAULT_BOARD_SETTINGS } from '../../../shared/constants/layout';
import { useToast } from '../../../shared/context';

export const defaultSettings = DEFAULT_BOARD_SETTINGS;

const getLocalStorageKey = (synagogueId: string) => `syn_${synagogueId}_settings`;

export const useBoardSettings = (synagogueId: string | undefined, onSync?: () => void) => {
  const { showToast } = useToast();

  // Track whether we initialized from localStorage (used to skip loading spinner)
  const [hasLocalCache, setHasLocalCache] = useState(false);

  const [settings, setSettings] = useState<BoardSettings>(() => {
    if (!synagogueId) return defaultSettings;
    try {
      const stored = localStorage.getItem(getLocalStorageKey(synagogueId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          setHasLocalCache(true);
          return { ...defaultSettings, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to load settings from local storage', e);
    }
    return defaultSettings;
  });

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const settingsDocRef = synagogueId
    ? doc(db, `synagogues/${synagogueId}/settings/board`)
    : null;

  const [value, loading, error] = useDocumentData(settingsDocRef);

  useEffect(() => {
    if (!synagogueId) {
      if (!initialLoadDone) {
        setSettings(defaultSettings);
        setInitialLoadDone(true);
      }
      return;
    }

    // If there's an error (e.g. offline, permissions), keep cached data
    if (error) {
      console.warn('[useBoardSettings] Firestore error, using cached data:', error.message);
      setInitialLoadDone(true);
      return;
    }

    if (loading) return;

    if (value) {
      // Notify sync occurred
      if (onSync) onSync();

      const loaded = { ...defaultSettings, ...(value || {}) };
      // Validate location data, falling back to defaults if invalid
      if (typeof loaded.latitude !== 'number' || typeof loaded.longitude !== 'number' ||
        (loaded.latitude === 0 && loaded.longitude === 0)) {
        loaded.latitude = defaultSettings.latitude;
        loaded.longitude = defaultSettings.longitude;
      }

      const newSettings = loaded as BoardSettings;

      if (!isEqual(newSettings, settings)) {
        setSettings(newSettings);
        setHasLocalCache(true);
        try {
          localStorage.setItem(getLocalStorageKey(synagogueId), JSON.stringify(newSettings));
        } catch (e) {
          console.error('Failed to save settings to local storage', e);
        }

        if (initialLoadDone) {
          showToast('הגדרות הלוח עודכנו', 'info', 2000);
        }
      }
      setInitialLoadDone(true);
    } else if (!loading && !value && !hasLocalCache) {
      // Doc doesn't exist on server AND we have no local cache — use defaults
      if (!initialLoadDone) {
        setInitialLoadDone(true);
      }
    }
  }, [value, loading, error, synagogueId, onSync]);

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
      localStorage.setItem(getLocalStorageKey(synagogueId), JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings to local storage', e);
    }

    try {
      const docRef = doc(db, `synagogues/${synagogueId}/settings/board`);
      await setDoc(docRef, newSettings);
      console.info('[useBoardSettings] Successfully synced to Firebase');
      showToast('ההגדרות נשמרו בהצלחה', 'success');
    } catch (err) {
      console.error('[useBoardSettings] Error syncing to Firebase:', err);
      showToast('שגיאה בשמירת ההגדרות', 'error');
    }
  }, [synagogueId, settings, showToast]);

  return { settings, saveSettings, loading: loading && isEqual(settings, defaultSettings) && !hasLocalCache };
};
