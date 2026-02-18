import { initializeApp } from 'firebase/app';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const db = getFirestore(app);

// Connect to emulators if VITE_USE_FIREBASE_EMULATOR is set
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log('Using Firebase Emulators...');
  try {
    // Note: Ensure your local emulators are running on these ports!
    // Firestore default: 8080 or 8081 if 8080 taken
    connectFirestoreEmulator(db, 'localhost', 8080);
    // Storage default: 9199
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Connected to Firestore and Storage emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators (they might not be running):', error);
  }
}

export default app;
