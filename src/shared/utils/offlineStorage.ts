/**
 * Offline-first storage utility that syncs with Firebase when online
 *
 * Strategy:
 * 1. All reads come from localStorage first (fast, always available)
 * 2. All writes go to localStorage immediately (instant feedback)
 * 3. When online, sync with Firebase in background
 * 4. When Firebase updates, update localStorage
 */

import { collection, query, onSnapshot, doc, writeBatch, setDoc, DocumentData, getDocs } from 'firebase/firestore';
import isEqual from 'fast-deep-equal';
import { db } from '../firebase';

export interface OfflineStorageOptions<T> {
  localStorageKey: string;
  firebasePath?: (entityId: string) => string;
  firebaseCollectionPath?: (entityId: string) => string;
  defaultValue: T;
  serialize?: (data: T) => any;
  deserialize?: (data: any) => T;
}

/**
 * Create a hybrid localStorage + Firebase storage hook
 */
export function createOfflineStorage<T>(options: OfflineStorageOptions<T>) {
  const {
    localStorageKey,
    firebasePath,
    firebaseCollectionPath,
    defaultValue,
    serialize = (data) => data,
    deserialize = (data) => data,
  } = options;

  /**
   * Load data from localStorage
   */
  function loadFromLocal(): T {
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        return deserialize(JSON.parse(stored));
      }
    } catch (error) {
      console.error(`Error loading ${localStorageKey} from localStorage:`, error);
    }
    return defaultValue;
  }

  /**
   * Save data to localStorage
   */
  function saveToLocal(data: T): void {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(serialize(data)));
    } catch (error) {
      console.error(`Error saving ${localStorageKey} to localStorage:`, error);
    }
  }

  /**
   * Sync to Firebase (when online)
   */
  async function syncToFirebase(entityId: string, data: T): Promise<boolean> {
    if (!navigator.onLine) {
      console.log("Offline, skipping Firebase sync.");
      return false;
    }

    try {
      const path = Array.isArray(data) && firebaseCollectionPath ? firebaseCollectionPath(entityId) : (firebasePath ? firebasePath(entityId) : null);
      if (!path) {
        console.warn(`Firebase path not defined for ${localStorageKey}, skipping sync.`);
        return false;
      }
      console.log(`Syncing ${localStorageKey} to Firebase path: ${path}`);

      if (Array.isArray(data)) {
        if (!firebaseCollectionPath) {
          console.warn(`firebaseCollectionPath is not defined for ${localStorageKey}, skipping array sync.`);
          return false;
        }
        const batch = writeBatch(db);
        const collectionRef = collection(db, path);

        // 1. Get all document IDs from the server
        const serverSnapshot = await getDocs(query(collectionRef));
        const serverIds = new Set(serverSnapshot.docs.map(doc => doc.id));

        // 2. Go through local data: add or update
        (data as any[]).forEach(item => {
          const docRef = doc(collectionRef, item.id);
          batch.set(docRef, serialize(item));
          serverIds.delete(item.id); // Remove from set, remaining are deletions
        });

        // 3. Delete documents that are on the server but not locally
        serverIds.forEach(idToDelete => {
          batch.delete(doc(collectionRef, idToDelete));
        });

        await batch.commit();
      } else {
        const docRef = doc(db, path);
        await setDoc(docRef, serialize(data), { merge: true });
      }

      localStorage.setItem('lastSuccessfulSync', new Date().toISOString());
      console.log(`${localStorageKey} successfully synced to Firebase.`);
      return true;
    } catch (error) {
      console.warn(`Failed to sync ${localStorageKey} to Firebase:`, error);
      return false;
    }
  }

  /**
   * Setup Firebase listener to sync changes from server
   */
  function setupFirebaseListener(
    entityId: string,
    onUpdate: (data: T) => void
  ): () => void {
    try {
      const path = Array.isArray(defaultValue) && firebaseCollectionPath ? firebaseCollectionPath(entityId) : (firebasePath ? firebasePath(entityId) : null);
      if (!path) {
        console.warn(`Firebase path not defined for ${localStorageKey}, skipping listener.`);
        return () => { };
      }

      // Check if this is a collection or document
      if (Array.isArray(defaultValue)) {
        if (!firebaseCollectionPath) {
          console.warn(`firebaseCollectionPath is not defined for ${localStorageKey}, skipping array listener.`);
          return () => { };
        }
        // Listen to collection
        const q = query(collection(db, path));
        return onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const items = snapshot.docs.map(doc =>
                deserialize({ id: doc.id, ...doc.data() })
              );
              const data = items as any as T;
              saveToLocal(data);
              onUpdate(data);

              // Update last sync time when we receive data from Firebase
              const now = new Date();
              localStorage.setItem('lastSuccessfulSync', now.toISOString());
            } else {
              // Collection is empty, so revert to default
              saveToLocal(defaultValue);
              onUpdate(defaultValue);
            }
          },
          (error) => {
            console.warn(`Firebase listener error for ${localStorageKey}:`, error);
          }
        );
      } else {
        // Listen to document
        const docRef = doc(db, path);
        return onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = deserialize(docSnap.data() as DocumentData) as T;
              saveToLocal(data);
              onUpdate(data);

              // Update last sync time when we receive data from Firebase
              const now = new Date();
              localStorage.setItem('lastSuccessfulSync', now.toISOString());
            } else {
              // Document doesn't exist, so revert to default
              saveToLocal(defaultValue);
              onUpdate(defaultValue);
            }
          },
          (error) => {
            console.warn(`Firebase listener error for ${localStorageKey}:`, error);
          }
        );
      }
    } catch (error) {
      console.warn(`Failed to setup Firebase listener for ${localStorageKey}:`, error);
      // Return empty cleanup function
      return () => { };
    }
  }

  return {
    loadFromLocal,
    saveToLocal,
    syncToFirebase,
    setupFirebaseListener,
  };
}

/**
 * Detect if we're online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen to online/offline events
 */
export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {

    window.removeEventListener('online', handleOnline);

    window.removeEventListener('offline', handleOffline);

  };

}



const SELECTED_SYNAGOGUE_KEY = 'selectedSynagogue';



export function saveSelectedSynagogue(slug: string): void {

  try {

    localStorage.setItem(SELECTED_SYNAGOGUE_KEY, slug);

  } catch (error) {

    console.error('Error saving selected synagogue to localStorage:', error);

  }

}



export function getSelectedSynagogue(): string | null {

  try {

    return localStorage.getItem(SELECTED_SYNAGOGUE_KEY);

  } catch (error) {

    console.error('Error getting selected synagogue from localStorage:', error);

    return null;

  }

}









