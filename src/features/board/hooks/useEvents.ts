import { useState, useEffect, useCallback } from 'react';
import { EventItem } from '../../../shared/types/types';
import { createOfflineStorage } from '../../../shared/utils/offlineStorage';

export const defaultEvents: EventItem[] = [
  { id: '1', name: 'מנחה וקבלת שבת', timeDefinition: { mode: 'absolute', absoluteTime: '18:00' }, type: 'prayer', columnId: 'col-erev-shabbat', order: 0 },
  { id: '2', name: 'ערבית (ליל שבת)', timeDefinition: { mode: 'relative', relativeEventId: '1', offsetMinutes: 60 }, type: 'prayer', columnId: 'col-erev-shabbat', order: 1 },
  { id: '3', name: 'שחרית (ותיקין)', timeDefinition: { mode: 'absolute', absoluteTime: '06:00' }, type: 'prayer', columnId: 'col-shabbat-day', order: 0 },
  { id: '4', name: 'שחרית', timeDefinition: { mode: 'absolute', absoluteTime: '08:30' }, type: 'prayer', columnId: 'col-shabbat-day', note: 'קידוש לאחר התפילה', order: 1 },
  { id: '5', name: 'אירוע דף יומי', timeDefinition: { mode: 'absolute', absoluteTime: '10:00' }, type: 'class', columnId: 'col-shabbat-day', order: 2 },
  { id: '6', name: 'מנחה', timeDefinition: { mode: 'absolute', absoluteTime: '13:30' }, type: 'prayer', columnId: 'col-shabbat-day', order: 3 },
  { id: '7', name: 'לימוד אבות ובנים', timeDefinition: { mode: 'absolute', absoluteTime: '17:00' }, type: 'class', columnId: 'col-shabbat-day', order: 4 },
  { id: '8', name: 'ערבית (מוצ"ש)', timeDefinition: { mode: 'absolute', absoluteTime: '20:30' }, type: 'prayer', columnId: 'col-shabbat-day', order: 5 },
];

// Create offline storage for events
const eventsStorage = createOfflineStorage<EventItem[]>({
  localStorageKey: 'boardEvents',
  firebaseCollectionPath: (synagogueId) => `synagogues/${synagogueId}/events`,
  defaultValue: defaultEvents,
});

export const useEvents = (synagogueId: string | undefined) => {
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (!synagogueId) {
      return [];
    }
    console.info('[useEvents] Loading initial events from local storage');
    return eventsStorage.loadFromLocal();
  });

  const [loading, setLoading] = useState(() => {
    if (!synagogueId) return false;
    // If we have data in local storage, we are not "loading" in the blocking sense
    const localData = eventsStorage.loadFromLocal();
    return localData.length === 0;
  });

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!synagogueId) {
      console.info('[useEvents] No synagogueId provided, clearing events');
      setEvents([]); // No synagogueId, so no specific events
      setLoading(false); // Nothing to load
      return;
    }

    console.info(`[useEvents] Initializing for synagogue: ${synagogueId}`);
    // We don't set loading to true here because we want to show cached data immediately

    const unsubscribe = eventsStorage.setupFirebaseListener(synagogueId, (serverEvents) => {
      console.info(`[useEvents] Received ${serverEvents.length} events from Firebase`);
      const sorted = serverEvents.sort((a, b) => a.order - b.order);
      setEvents(sorted);
      // eventsStorage.saveToLocal(sorted); // Handled by setupFirebaseListener
      setLastRefresh(new Date());
      setLoading(false); // Finished loading (or updating)
    });

    return () => {
      console.info('[useEvents] Cleaning up listener');
      unsubscribe();
    };
  }, [synagogueId]);

  const saveEvents = useCallback(async (newEvents: EventItem[]) => {
    console.info(`[useEvents] Saving ${newEvents.length} events`);
    // Always save to local storage first
    eventsStorage.saveToLocal(newEvents);
    setEvents(newEvents);

    if (synagogueId) {
      // Now, try to sync to Firebase
      try {
        await eventsStorage.syncToFirebase(synagogueId, newEvents);
        console.info('[useEvents] Successfully synced to Firebase');
      } catch (error) {
        console.error('[useEvents] Error syncing to Firebase:', error);
      }
    } else {
      console.warn('[useEvents] Cannot sync to Firebase: No synagogueId');
    }
  }, [synagogueId]);

  return { events, saveEvents, lastRefresh, loading };
};
