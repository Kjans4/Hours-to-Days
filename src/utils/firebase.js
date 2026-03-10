import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyB-Xz46Wf7sWb3dcmzqH8_dZgGII9Re3Sc",
  authDomain: "sampleapp-ed13d.firebaseapp.com",
  projectId: "sampleapp-ed13d",
  storageBucket: "sampleapp-ed13d.firebasestorage.app",
  messagingSenderId: "1005757539436",
  appId: "1:1005757539436:web:1740fcaf06f99ae0dfa449"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)