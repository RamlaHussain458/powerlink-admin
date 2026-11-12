import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Session persistence: the admin is signed out when the tab/browser is closed
// (the default "local" persistence keeps you signed in forever).
setPersistence(auth, browserSessionPersistence).catch((err) =>
  console.error("Could not set auth persistence:", err),
);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Cloud Functions (region must match where the functions are deployed; default us-central1)
export const functions = getFunctions(app);
