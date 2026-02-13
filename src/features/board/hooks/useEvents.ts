import { useState, useEffect, useCallback } from 'react';
import { EventItem } from '../../../shared/types/types';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '../../../shared/firebase';
import { useToast } from '../../../shared/context';
import isEqual from 'fast-deep-equal';

export const defaultEvents: EventItem[] = [
  { id: '1', name: 'מנחה וקבלת שבת', timeDefinition: { mode: 'absolute', absoluteTime: '18:00' }, type: 'prayer', columnId: 'col-erev-shabbat', order: 0 },
  { id: '2', name: 'ערבית (ליל שבת)', timeDefinition: { mode: 'relative', relativeEventId: '1', offsetMinutes: 60 }, type: 'prayer', columnId: 'col-erev-shabbat', order: 1 },
  { id: '3', name: 'שחרית (ותיקין)', timeDefinition: { mode: 'absolute', absoluteTime: '06:00' }, type: 'prayer', columnId: 'col-shabbat-day', order: 0 },
  { id: '4', name: 'שחרית', timeDefinition: { mode: 'absolute', absoluteTime: '08:30' }, type: 'prayer', columnId: 'col-shabbat-day', note: 'קידוש לאחר התפילה', order: 1 },
  { id: '5', name: 'דף יומי', timeDefinition: { mode: 'absolute', absoluteTime: '10:00' }, type: 'class', columnId: 'col-shabbat-day', order: 2 },
  { id: '6', name: 'מנחה', timeDefinition: { mode: 'absolute', absoluteTime: '13:30' }, type: 'prayer', columnId: 'col-shabbat-day', order: 3 },
];

const getLocalStorageKey = (synagogueId: string) => `syn_${synagogueId}_events`;

export const useEvents = (synagogueId: string | undefined) => {
  const { showToast } = useToast();

  // Track whether we initialized from localStorage (used to skip loading spinner)
  const [hasLocalCache, setHasLocalCache] = useState(false);

  // Initialize from local storage if available
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (!synagogueId) return defaultEvents;
    try {
      const stored = localStorage.getItem(getLocalStorageKey(synagogueId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasLocalCache(true);
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load events from local storage', e);
    }
    return [];
  });

  // Track if we have performed the initial load to avoid overwriting local data with empty server data momentarily
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Define the query
  const eventsCollectionRef = synagogueId
    ? collection(db, `synagogues/${synagogueId}/events`)
    : null;

  const [value, loading, error] = useCollectionData(eventsCollectionRef);

  // Update local state when data changes
  useEffect(() => {
    if (!synagogueId) {
      if (!initialLoadDone) {
        setEvents(defaultEvents);
        setInitialLoadDone(true);
      }
      return;
    }

    // If there's an error (e.g. offline, permissions), keep cached data
    if (error) {
      console.warn('[useEvents] Firestore error, using cached data:', error.message);
      setInitialLoadDone(true);
      return;
    }

    if (loading) return;

    if (value) {
      const sorted = (value as EventItem[]).sort((a, b) => a.order - b.order);

      // If server data is empty and we have no local data, use defaults
      if (sorted.length === 0 && events.length === 0 && !initialLoadDone) {
        setEvents(defaultEvents);
        setInitialLoadDone(true);
        return;
      }

      // Check if data actually changed to avoid unnecessary renders/toasts
      if (!isEqual(sorted, events)) {
        setEvents(sorted);
        setHasLocalCache(true);

        // Save to local storage
        try {
          localStorage.setItem(getLocalStorageKey(synagogueId), JSON.stringify(sorted));
        } catch (e) {
          console.error('Failed to save events to local storage', e);
        }

        // Verify if this is an update coming from "outside" (not our own immediate save)
        // For now, we just show a toast if it's not the initial load
        if (initialLoadDone) {
          showToast('המידע עודכן מהשרת', 'info', 2000);
        }
      }
      setInitialLoadDone(true);
    }
  }, [value, loading, error, synagogueId]);

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
      localStorage.setItem(getLocalStorageKey(synagogueId), JSON.stringify(newEvents));
    } catch (e) {
      console.error('Failed to save events to local storage', e);
    }

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
      showToast('השינויים נשמרו בהצלחה', 'success');
    } catch (error) {
      console.error('[useEvents] Error syncing to Firebase:', error);
      showToast('שגיאה בשמירת הנתונים', 'error');
    }
  }, [synagogueId, value, showToast]);

  return { events, saveEvents, lastRefresh: new Date(), loading: loading && events.length === 0 && !hasLocalCache };
};
