// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "intervue-ai-003.firebaseapp.com",
  projectId: "intervue-ai-003",
  storageBucket: "intervue-ai-003.firebasestorage.app",
  messagingSenderId: "660497983995",
  appId: "1:660497983995:web:21ad58f6863b5b3faa435e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })
export { auth, provider }
