"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Make sure this path is correct!
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc,onSnapshot, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  useEffect(() => {
  if (user) {
    // This creates a "live link" to this user's document
    const userRef = doc(db, "users", user.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const savedRp = data.rp || 0;
        
        // Update the screen with the number from the cloud
        setRp(savedRp);
        
        // Update the rank based on that number
        if (savedRp >= 300) setRank("Gold");
        else if (savedRp >= 100) setRank("Silver");
        else setRank("Bronze");
      }
    });

    // This cleans up the listener if the user logs out
    return () => unsubscribe();
  }
}, [user]); // This only runs when the "user" object changes (login/logout)
  // Dashboard States
  const [rp, setRp] = useState(0);
  const [rank, setRank] = useState("Bronze");

  const handleAuth = async () => {
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert("Auth Error: " + message);
    }
  };

 const handleClockIn = async () => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);

  try {
    await setDoc(userRef, { 
      rp: increment(20),
      username: user.displayName,
    }, { merge: true });
    // Note: No need to setRp() here anymore, onSnapshot does it for us!
  } catch (error) {
    console.error("Error:", error);
  }
};

  if (loading) return <div className="bg-gray-950 min-h-screen flex items-center justify-center text-white">Loading...</div>;

  // --- LOGIN VIEW ---
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-950 text-white">
        <div className="w-full max-w-md p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl">
          <h1 className="text-3xl font-black tracking-tighter text-blue-500 mb-2 text-center">RankUp</h1>
          <p className="text-gray-500 text-center mb-8 font-bold text-sm uppercase tracking-widest">Verify Your Reliability</p>
          
          <input 
            type="email" placeholder="Email" 
            className="w-full p-4 mb-4 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 transition-all"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" 
            className="w-full p-4 mb-6 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 transition-all"
            onChange={(e) => setPassword(e.target.value)}
          />
          {isRegistering && (
          <input 
            type="text" 
            placeholder="Username" 
            className="w-full p-4 mb-4 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 transition-all"
            onChange={(e) => setUsername(e.target.value)}
          />
          )}
          <button 
            onClick={handleAuth}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all active:scale-95 mb-4"
          >
            {isRegistering ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>

          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-gray-500 text-sm font-bold hover:text-gray-300 transition-all"
          >
            {isRegistering ? "ALREADY HAVE AN ACCOUNT? SIGN IN" : "NEED AN ACCOUNT? REGISTER HERE"}
          </button>
          
        </div>
      </main>
    );
  }

  // --- DASHBOARD VIEW (Shown only if logged in) ---
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-950 text-white">
      <div className="w-full max-w-md p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl relative">
        <button 
          onClick={() => signOut(auth)}
          className="absolute top-4 right-4 text-xs text-gray-600 hover:text-red-400 font-bold"
        >
          LOGOUT
        </button>
        
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-xl font-black tracking-tighter text-blue-500">RankUp</h1>
          <span className="px-3 py-1 rounded-full bg-gray-800 text-xs font-bold text-gray-400 tracking-widest uppercase">
            {user.displayName}
          </span>
        </div>

        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-1">Current Standing</p>
          <h2 className="text-6xl font-black mb-2 text-white">{rank}</h2>
          <p className="text-2xl font-mono font-bold">{rp} RP</p>
        </div>

        <button 
          onClick={handleClockIn}
          className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-xl uppercase"
        >
          Clock In for Shift
        </button>
      </div>
    </main>
  );
}