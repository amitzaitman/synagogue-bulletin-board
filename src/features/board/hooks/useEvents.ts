import { useState, useEffect, useCallback } from 'react';
import { EventItem } from '../../../shared/types/types';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '../../../shared/firebase';

export const defaultEvents: EventItem[] = [
  { id: '1', name: 'מנחה וקבלת שבת', timeDefinition: { mode: 'absolute', absoluteTime: '18:00' }, type: 'prayer', columnId: 'col-erev-shabbat', order: 0 },
  { id: '2', name: 'ערבית (ליל שבת)', timeDefinition: { mode: 'relative', relativeEventId: '1', offsetMinutes: 60 }, type: 'prayer', columnId: 'col-erev-shabbat', order: 1 },
  { id: '3', name: 'שחרית (ותיקין)', timeDefinition: { mode: 'absolute', absoluteTime: '06:00' }, type: 'prayer', columnId: 'col-shabbat-day', order: 0 },
  { id: '4', name: 'שחרית', timeDefinition: { mode: 'absolute', absoluteTime: '08:30' }, type: 'prayer', columnId: 'col-shabbat-day', note: 'קידוש לאחר התפילה', order: 1 },
  { id: '5', name: 'דף יומי', timeDefinition: { mode: 'absolute', absoluteTime: '10:00' }, type: 'class', columnId: 'col-shabbat-day', order: 2 },
  { id: '6', name: 'מנחה', timeDefinition: { mode: 'absolute', absoluteTime: '13:30' }, type: 'prayer', columnId: 'col-shabbat-day', order: 3 },
];

export const useEvents = (synagogueId: string | undefined) => {
  const [events, setEvents] = useState<EventItem[]>(synagogueId ? [] : defaultEvents);

  // Define the query
  const eventsCollectionRef = synagogueId
    ? collection(db, `synagogues/${synagogueId}/events`)
    : null;

  const [value, loading] = useCollectionData(eventsCollectionRef);

  // Update local state when data changes
  useEffect(() => {
    if (value && value.length > 0) {
      const sorted = (value as EventItem[]).sort((a, b) => a.order - b.order);
      setEvents(sorted);
    } else if (value && value.length === 0) {
      // Server returned empty list, use defaults
      setEvents(defaultEvents);
    } else if (!synagogueId) {
      setEvents(defaultEvents);
    }
  }, [value, synagogueId]);

  const saveEvents = useCallback(async (newEvents: EventItem[]) => {
    if (!synagogueId) {
      console.warn('[useEvents] Cannot sync to Firebase: No synagogueId');
      setEvents(newEvents); // Optimistic update for non-synagogue mode
      return;
    }

    console.info(`[useEvents] Saving ${newEvents.length} events`);

    // Optimistic update
    setEvents(newEvents);

    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, `synagogues/${synagogueId}/events`);

      const currentServerIds = new Set(value?.map(e => (e as EventItem).id) || []);
      const newIds = new Set(newEvents.map(e => e.id));

      // Updates & Inserts
      newEvents.forEach(event => {
        const docRef = doc(collectionRef, event.id);
        batch.set(docRef, event);
      });

      // Deletions
      currentServerIds.forEach(id => {
        if (!newIds.has(id)) {
          batch.delete(doc(collectionRef, id));
        }
      });

      await batch.commit();
      console.info('[useEvents] Successfully synced to Firebase');
    } catch (error) {
      console.error('[useEvents] Error syncing to Firebase:', error);
    }
  }, [synagogueId, value]);

  return { events, saveEvents, lastRefresh: new Date(), loading };
};
