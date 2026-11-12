// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (!firebaseApiKey) {
  throw new Error("VITE_FIREBASE_API_KEY is required to initialize Firebase Authentication.");
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  // In production the Firebase auth helper is reverse-proxied through the
  // app's own Vercel origin. This avoids cross-site storage restrictions in
  // normal browser profiles; local development keeps Firebase's default host.
  authDomain: import.meta.env.PROD ? "intervue-ai-lwxh.vercel.app" : "intervue-ai-003.firebaseapp.com",
  projectId: "intervue-ai-003",
  storageBucket: "intervue-ai-003.firebasestorage.app",
  messagingSenderId: "660497983995",
  appId: "1:660497983995:web:21ad58f6863b5b3faa435e"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })
export { auth, provider }
