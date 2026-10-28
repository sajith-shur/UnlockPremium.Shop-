import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  setPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
} from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD5LrBcbdGlzwuQBCqqCavxiG5QSYm7XI4',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'unlockshop.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'unlockshop',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'unlockshop.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1007883130618',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1007883130618:web:1b30e95480984485e6db43',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-M42YBTS6FF',
};

// Singleton App Initialization
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth Instance
export const auth: Auth = getAuth(app);

// Firestore Instance
export const db: Firestore = getFirestore(app);

// Client-side initialization: configure session persistence and optional emulator connection
if (typeof window !== 'undefined') {
  // Set session persistence (cleared when browser/tab session closes)
  setPersistence(auth, browserSessionPersistence).catch((err) => {
    // Graceful fallback if session storage is disabled in restricted browser modes
    console.warn('Session persistence setup fallback:', err?.message || err);
  });

  // Connect to local emulators ONLY when:
  // 1. NODE_ENV is strictly NOT production
  // 2. Browser hostname is localhost or 127.0.0.1
  // 3. Emulator mode is explicitly requested via NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
  // The presence of NEXT_PUBLIC_USE_FIREBASE_EMULATOR must never override the production restriction.
  const isNonProduction = process.env.NODE_ENV !== 'production';
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const isExplicitlyEnabled = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

  const useEmulator = isNonProduction && isLocalHost && isExplicitlyEnabled;
  const emulatorHost = process.env.NEXT_PUBLIC_EMULATOR_HOST || '127.0.0.1';

  // Only connect once if running against local emulators
  const win = window as unknown as { _firebaseEmulatorsConnected?: boolean };
  if (useEmulator && !win._firebaseEmulatorsConnected) {
    try {
      connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(db, emulatorHost, 8080);
      win._firebaseEmulatorsConnected = true;
    } catch {
      // Ignore if already connected in hot-reload environment
    }
  }
}
