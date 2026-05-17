To host your application on Vercel while keeping your Firebase secrets secure, you should move away from the firebase-applet-config.json file and instead use Vercel Environment Variables.
Here are the steps to securely deploy to Vercel:
1. Prepare Your Environment Variables
Do not commit firebase-applet-config.json to your public repository if it contains sensitive keys.
On your Vercel Dashboard, navigate to your project:
Go to Settings -> Environment Variables.
Add all the values from your firebase-applet-config.json as individual variables, using the VITE_ prefix to make them accessible to your frontend code:
Vercel Key
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_FIRESTORE_DATABASE_ID
2. Update Firebase Initialization
Modify src/lib/firebase.ts to read these variables instead of importing the JSON file.
code
TypeScript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID);
export const auth = getAuth(app);
export const storage = getStorage(app);
3. Deploy to Vercel
Push your code to your repository (GitHub/GitLab/Bitbucket).
Import the project in Vercel.
Vercel will automatically detect the Vite configuration. Ensure the build command is npm run build and the output directory is dist.
Once deployed, Vercel will inject the environment variables you set in step 1, and your app will be securely connected to Firebase.
This method ensures your secrets are never exposed in your public code repository.