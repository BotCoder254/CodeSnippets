import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDo7VNF957GGOigX21RI8cr9gSPaK_-r0Y",
  authDomain: "community-hub-be1a3.firebaseapp.com",
  databaseURL: "https://community-hub-be1a3-default-rtdb.firebaseio.com",
  projectId: "community-hub-be1a3",
  storageBucket: "community-hub-be1a3.appspot.com",
  messagingSenderId: "140658585413",
  appId: "1:140658585413:web:0377c49b2dedd1b6b4d82c",
  measurementId: "G-HBPEQJBRL8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    console.error('Firestore persistence error:', err);
  });

export default app;
