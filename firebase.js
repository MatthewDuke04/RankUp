// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // <--- Add this
import { getFirestore } from "firebase/firestore"; // <--- Add this
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCAYhbDnaR58CWH-3ahY_uLheJ9fpWiTFw",
  authDomain: "rankup-a95b2.firebaseapp.com",
  projectId: "rankup-a95b2",
  storageBucket: "rankup-a95b2.firebasestorage.app",
  messagingSenderId: "240505298953",
  appId: "1:240505298953:web:5e77f2ad879bb4098f18d8",
  measurementId: "G-J5LRC2GQ5M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);