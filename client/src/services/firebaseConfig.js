import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBpzaKTCZdT-f-iOkXBPi5sU-yERXllsfs",
  authDomain: "crud-pcr.firebaseapp.com",
  projectId: "crud-pcr",
  storageBucket: "crud-pcr.firebasestorage.app",
  messagingSenderId: "383068518120",
  appId: "1:383068518120:web:7ec4c5530230f689bafb5d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
