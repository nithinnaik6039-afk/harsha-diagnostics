import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // Grab from Firebase Console
  authDomain: "harsha-project-fc45e.firebaseapp.com",
  projectId: "harsha-project-fc45e",
  storageBucket: "harsha-project-fc45e.firebasestorage.app",
  messagingSenderId: "615147190149",
  appId: "YOUR_APP_ID_HERE" // Grab from Firebase Console
};

export const isFirebaseConfigured = 
  firebaseConfig.apiKey !== 'YOUR_API_KEY_HERE' && 
  firebaseConfig.appId !== 'YOUR_APP_ID_HERE';

let app;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('[Firebase Admin] Initialized successfully.');
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error);
  }
} else {
  console.log('[Firebase Admin] Config has placeholders. Using local auth fallback.');
}

export { auth };
