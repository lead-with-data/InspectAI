import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig: any = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.replace(/"/g, ''),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.replace(/"/g, ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.replace(/"/g, ''),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.replace(/"/g, ''),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.replace(/"/g, ''),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.replace(/"/g, ''),
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID?.replace(/"/g, '')
};

const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.replace(/"/g, '');
if (measurementId && measurementId.trim() !== '') {
  firebaseConfig.measurementId = measurementId;
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL
export const auth = getAuth(app);
export const storage = getStorage(app);
