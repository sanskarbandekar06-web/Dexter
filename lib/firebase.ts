
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc,
  deleteDoc,
  writeBatch,
  collection, 
  query, 
  getDocs,
  onSnapshot,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCv6rhzguphdYUrWFm7vpOnXznMStYQp24",
  authDomain: "day-score-f3947.firebaseapp.com",
  projectId: "day-score-f3947",
  storageBucket: "day-score-f3947.firebasestorage.app",
  messagingSenderId: "652140491951",
  appId: "1:652140491951:web:9553c15df01aa3dca9105a",
  measurementId: "G-0JCJBJD99V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Attempt to enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    }
  });
} catch (e) {
  console.error("Persistence setup failed", e);
}

// Re-export Auth functions
export { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
};

// Re-export Firestore functions
export { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc,
  deleteDoc,
  writeBatch,
  collection, 
  query, 
  getDocs,
  onSnapshot,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
};
