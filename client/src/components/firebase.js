import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDxQIyg1GyAIBNlNRFIyk0OyPC2LNVkSik",
  authDomain: "projetotop-6f6a9.firebaseapp.com",
  projectId: "projetotop-6f6a9",
  storageBucket: "projetotop-6f6a9.firebasestorage.app",
  messagingSenderId: "556215499599",
  appId: "1:556215499599:web:e38e4a352c9af6fdb4633a",
  measurementId: "G-FNW6R2QHEY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
