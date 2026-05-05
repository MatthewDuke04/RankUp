"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, setDoc, updateDoc, increment } from "firebase/firestore";

export default function Home() {
  const [user, loading] = useAuthState(auth);
  
  // --- STATE VARIABLES ---
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [rp, setRp] = useState(0);
  const [rank, setRank] = useState("Bronze");
  
  // Profile specific states
  const [userData, setUserData] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');

  // --- 1. HANDLE IMAGE SELECTION ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("File is too big! Please pick a photo under 800kb.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- 2. DATA LISTENER (RP & PROFILE INFO) ---
  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data); // This fixes the "Cannot find userData" error
          setRp(data.rp || 0);
          setBio(data.bio || '');

          // Update rank
          if (data.rp >= 300) setRank("Gold");
          else if (data.rp >= 100) setRank("Silver");
          else setRank("Bronze");
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // --- 3. SAVE PROFILE FUNCTION ---
  const saveProfile = async () => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);

    try {
      await updateDoc(userRef, {
        bio: bio,
        photoURL: previewImage || userData?.photoURL || "", 
        lastUpdated: new Date().toISOString()
      });
      alert("Profile saved successfully!");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert("Save failed. Make sure your image isn't too large!");
    }
  };

  // --- 4. AUTH & CLOCK-IN LOGIC ---
  const handleAuth = async () => {
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      alert("Auth Error: " + error.message);
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
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) return <div className="bg-gray-950 min-h-screen flex items-center justify-center text-white font-black">LOADING...</div>;

  // --- LOGIN VIEW ---
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-950 text-white">
        <div className="w-full max-w-md p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl">
          <h1 className="text-3xl font-black tracking-tighter text-blue-500 mb-2 text-center">RankUp</h1>
          <p className="text-gray-500 text-center mb-8 font-bold text-sm uppercase tracking-widest">Verify Your Reliability</p>
          
          <input type="email" placeholder="Email" className="w-full p-4 mb-4 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 transition-all" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-4 mb-6 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 transition-all" onChange={(e) => setPassword(e.target.value)} />
          
          {isRegistering && (
            <input type="text" placeholder="Username" className="w-full p-4 mb-4 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 transition-all" onChange={(e) => setUsername(e.target.value)} />
          )}

          <button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all active:scale-95 mb-4">
            {isRegistering ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>

          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-gray-500 text-sm font-bold hover:text-gray-300 transition-all">
            {isRegistering ? "ALREADY HAVE AN ACCOUNT? SIGN IN" : "NEED AN ACCOUNT? REGISTER HERE"}
          </button>
        </div>
      </main>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-950 text-white overflow-y-auto">
      <div className="w-full max-w-md p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl relative mb-8">
        <button onClick={() => signOut(auth)} className="absolute top-4 right-4 text-xs text-gray-600 hover:text-red-400 font-bold">LOGOUT</button>
        
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-xl font-black tracking-tighter text-blue-500">RankUp</h1>
          <span className="px-3 py-1 rounded-full bg-gray-800 text-xs font-bold text-gray-400 tracking-widest uppercase">{user.displayName}</span>
        </div>

        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-1">Current Standing</p>
          <h2 className="text-6xl font-black mb-2 text-white">{rank}</h2>
          <p className="text-2xl font-mono font-bold">{rp} RP</p>
        </div>

        <button onClick={handleClockIn} className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-xl uppercase active:scale-95 transition-all">
          Clock In for Shift
        </button>
      </div>

      {/* --- PROFILE SECTION --- */}
      <div className="w-full max-w-md p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Profile Settings</h2>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden border-2 border-blue-500 flex-shrink-0">
            {(previewImage || userData?.photoURL) ? (
              <img src={previewImage || userData?.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[10px] text-center p-2">No Photo</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400 font-semibold uppercase">Profile Picture</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs text-zinc-400 cursor-pointer" />
          </div>
        </div>

        <label className="text-xs text-zinc-400 font-semibold uppercase block mb-2">About You</label>
        <textarea 
          placeholder="Write a short bio..." 
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white mb-4 h-24 focus:outline-none focus:border-blue-500 text-sm" 
          onChange={(e) => setBio(e.target.value)} 
          value={bio} 
        />

        <button onClick={saveProfile} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition shadow-lg">
          SAVE PROFILE
        </button>
      </div>
    </main>
  );
}