// Script to clear all data from Firestore
// Run with: node clear-firestore.js
// Make sure to set your Firebase config below

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase configuration - UPDATE THIS WITH YOUR CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Alternatively, you can manually set from .env.local:
// const firebaseConfig = {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...",
//   appId: "..."
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(collectionPath) {
  console.log(`Clearing collection: ${collectionPath}`);
  const querySnapshot = await getDocs(collection(db, collectionPath));

  const deletePromises = [];
  querySnapshot.forEach((document) => {
    deletePromises.push(deleteDoc(doc(db, collectionPath, document.id)));
  });

  await Promise.all(deletePromises);
  console.log(`Deleted ${deletePromises.length} documents from ${collectionPath}`);
}

async function clearSynagogues() {
  console.log('Fetching all synagogues...');
  const synagoguesSnapshot = await getDocs(collection(db, 'synagogues'));

  let totalDeleted = 0;

  for (const synagogueDoc of synagoguesSnapshot.docs) {
    const synagogueId = synagogueDoc.id;
    console.log(`\nProcessing synagogue: ${synagogueId}`);

    // Delete events
    const eventsSnapshot = await getDocs(collection(db, 'synagogues', synagogueId, 'events'));
    for (const eventDoc of eventsSnapshot.docs) {
      await deleteDoc(doc(db, 'synagogues', synagogueId, 'events', eventDoc.id));
      totalDeleted++;
    }
    console.log(`  - Deleted ${eventsSnapshot.size} events`);

    // Delete columns
    const columnsSnapshot = await getDocs(collection(db, 'synagogues', synagogueId, 'columns'));
    for (const columnDoc of columnsSnapshot.docs) {
      await deleteDoc(doc(db, 'synagogues', synagogueId, 'columns', columnDoc.id));
      totalDeleted++;
    }
    console.log(`  - Deleted ${columnsSnapshot.size} columns`);

    // Delete settings
    const settingsSnapshot = await getDocs(collection(db, 'synagogues', synagogueId, 'settings'));
    for (const settingDoc of settingsSnapshot.docs) {
      await deleteDoc(doc(db, 'synagogues', synagogueId, 'settings', settingDoc.id));
      totalDeleted++;
    }
    console.log(`  - Deleted ${settingsSnapshot.size} settings`);

    // Delete the synagogue document itself
    await deleteDoc(doc(db, 'synagogues', synagogueId));
    totalDeleted++;
    console.log(`  - Deleted synagogue document`);
  }

  console.log(`\n✅ Total documents deleted: ${totalDeleted}`);
  console.log('✅ Firestore cleared successfully!');
}

async function main() {
  console.log('⚠️  WARNING: This will delete ALL data from Firestore!');
  console.log('Starting in 3 seconds... Press Ctrl+C to cancel.\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    await clearSynagogues();
  } catch (error) {
    console.error('❌ Error clearing Firestore:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
