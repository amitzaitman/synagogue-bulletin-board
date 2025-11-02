import { useState, useEffect, useCallback } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import isEqual from 'fast-deep-equal';
import { db } from '../firebase';

import { EventItem } from '../types';
import { createOfflineStorage } from '../utils/offlineStorage';

export const defaultEvents: EventItem[] = [
  { id: '1', name: 'מנחה וקבלת שבת', timeDefinition: { mode: 'absolute', absoluteTime: '18:00' }, type: 'prayer', columnId: 'col-erev-shabbat', order: 0 },
  { id: '2', name: 'ערבית (ליל שבת)', timeDefinition: { mode: 'relative', relativeEventId: '1', offsetMinutes: 60 }, type: 'prayer', columnId: 'col-erev-shabbat', order: 1 },
  { id: '3', name: 'שחרית (ותיקין)', timeDefinition: { mode: 'absolute', absoluteTime: '06:00' }, type: 'prayer', columnId: 'col-shabbat-day', order: 0 },
  { id: '4', name: 'שחרית', timeDefinition: { mode: 'absolute', absoluteTime: '08:30' }, type: 'prayer', columnId: 'col-shabbat-day', note: 'קידוש לאחר התפילה', order: 1 },
  { id: '5', name: 'שיעור דף יומי', timeDefinition: { mode: 'absolute', absoluteTime: '10:00' }, type: 'class', columnId: 'col-shabbat-day', order: 2 },
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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!synagogueId) {
      setEvents([]); // No synagogueId, so no specific events
      setLoading(false); // Nothing to load
      return;
    }

    setLoading(true); // Start loading for a valid synagogueId
    const unsubscribe = eventsStorage.setupFirebaseListener(synagogueId, (serverEvents) => {
      const sorted = serverEvents.sort((a, b) => a.order - b.order);
      setEvents(sorted);
      eventsStorage.saveToLocal(sorted);
      setLastRefresh(new Date());
      setLoading(false); // Finished loading
    });

    return () => unsubscribe();
  }, [synagogueId]);

  const saveEvents = useCallback(async (newEvents: EventItem[]) => {
    // Always save to local storage first
    eventsStorage.saveToLocal(newEvents);
    setEvents(newEvents);

    if (synagogueId) {
      // Now, try to sync to Firebase
      await eventsStorage.syncToFirebase(synagogueId, newEvents);
    }
  }, [synagogueId]);

  return { events, saveEvents, lastRefresh, loading };
};

