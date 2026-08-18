import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // Grab this from your Firebase Console Settings
  authDomain: "harsha-project-fc45e.firebaseapp.com",
  projectId: "harsha-project-fc45e",
  storageBucket: "harsha-project-fc45e.firebasestorage.app",
  messagingSenderId: "615147190149",
  appId: "YOUR_APP_ID_HERE" // Grab this from your Firebase Console Settings
};

// Check if Firebase is configured with real credentials (not placeholders)
export const isFirebaseConfigured = 
  firebaseConfig.apiKey !== 'YOUR_API_KEY_HERE' && 
  firebaseConfig.appId !== 'YOUR_APP_ID_HERE';

let app;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('[Firebase] Initialized successfully.');
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
  }
} else {
  console.log('[Firebase] Config has placeholders. Using local auth fallback.');
}

export { auth };
