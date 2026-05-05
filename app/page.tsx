"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, collection, query, orderBy, onSnapshot, setDoc, updateDoc, increment } from "firebase/firestore";

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const [view, setView] = useState<'dashboard' | 'leaderboard'>('dashboard');
  
  // Grouped States
  const [authData, setAuthData] = useState({ email: '', password: '', username: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [bio, setBio] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Helper: Determine Rank
  const getRank = (rp: number) => {
    if (rp >= 300) return "Gold";
    if (rp >= 100) return "Silver";
    return "Bronze";
  };

  // Listen for Global Rankings
  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, "users"), orderBy("rp", "desc")), (snap) => {
      setAllUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  // Listen for Current User Data
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setBio(data.bio || '');
        if (data.photoURL) setPreviewImage(data.photoURL);
      }
    });
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size < 800000) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file) alert("File too large (>800kb)");
  };

  const handleAuth = async () => {
    try {
      if (isRegistering) {
        const res = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
        await updateProfile(res.user, { displayName: authData.username });
      } else {
        await signInWithEmailAndPassword(auth, authData.email, authData.password);
      }
    } catch (err: any) { alert(err.message); }
  };

  const saveProfile = async () => {
    try {
      await updateDoc(doc(db, "users", user!.uid), { 
        bio, photoURL: previewImage || "", lastUpdated: new Date().toISOString() 
      });
      alert("Saved!");
    } catch { alert("Save failed (image might be too large)"); }
  };

  const clockIn = () => setDoc(doc(db, "users", user!.uid), { 
    rp: increment(20), username: user?.displayName 
  }, { merge: true });

  if (loading) return <div className="bg-gray-950 min-h-screen flex items-center justify-center text-white font-black">LOADING...</div>;

  if (!user) return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-950 text-white">
      <div className="w-full max-w-md p-8 rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl">
        <h1 className="text-3xl font-black text-blue-500 mb-2 text-center italic">RankUp</h1>
        <p className="text-gray-500 text-center mb-8 text-xs font-bold uppercase tracking-widest">Verify Your Reliability</p>
        <input type="email" placeholder="Email" className="w-full p-4 mb-4 rounded-xl bg-gray-800 border border-gray-700" onChange={e => setAuthData({...authData, email: e.target.value})} />
        <input type="password" placeholder="Password" className="w-full p-4 mb-4 rounded-xl bg-gray-800 border border-gray-700" onChange={e => setAuthData({...authData, password: e.target.value})} />
        {isRegistering && <input type="text" placeholder="Username" className="w-full p-4 mb-4 rounded-xl bg-gray-800 border border-gray-700" onChange={e => setAuthData({...authData, username: e.target.value})} />}
        <button onClick={handleAuth} className="w-full bg-blue-600 font-black py-4 rounded-xl mb-4 uppercase">{isRegistering ? "Register" : "Sign In"}</button>
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-gray-500 text-xs font-bold italic underline">{isRegistering ? "Back to Login" : "Create an Account"}</button>
      </div>
    </main>
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-950 text-white overflow-y-auto">
      {view === 'dashboard' ? (
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="p-8 rounded-3xl bg-gray-900 border border-gray-800 relative">
            <button onClick={() => signOut(auth)} className="absolute top-4 right-4 text-[10px] text-gray-600 font-bold hover:text-red-500">LOGOUT</button>
            <div className="flex justify-between items-center mb-10">
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-blue-500">RankUp</h1>
                <button onClick={() => setView('leaderboard')} className="text-[10px] font-bold text-blue-400 uppercase">Rankings →</button>
              </div>
              <span className="px-3 py-1 rounded-full bg-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{user.displayName}</span>
            </div>
            <div className="text-center mb-10">
              <p className="text-[10px] uppercase font-bold text-gray-500">Current Standing</p>
              <h2 className="text-6xl font-black mb-2">{getRank(userData?.rp || 0)}</h2>
              <p className="text-2xl font-mono font-bold text-blue-400">{userData?.rp || 0} RP</p>
            </div>
            <button onClick={clockIn} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase active:scale-95 transition-all shadow-lg shadow-white/5">Clock In</button>
          </div>

          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
            <h2 className="text-sm font-bold uppercase text-gray-400 mb-4">Profile Settings</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border-2 border-blue-500 flex-shrink-0">
                {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px]">N/A</div>}
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="text-[10px] text-zinc-500" />
            </div>
            <textarea placeholder="Bio..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm mb-4 h-20 outline-none focus:border-blue-500" onChange={e => setBio(e.target.value)} value={bio} />
            <button onClick={saveProfile} className="w-full bg-blue-600 font-black py-3 rounded-xl text-xs uppercase">Save Profile</button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button onClick={() => setView('dashboard')} className="text-blue-400 font-bold mb-8 text-sm">← DASHBOARD</button>
          <div className="space-y-3">
            {allUsers.map((u, i) => (
              <div key={u.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${u.id === user.uid ? 'bg-blue-600/10 border-blue-500' : 'bg-gray-900 border-gray-800'}`}>
                <span className={`font-black text-sm w-4 ${i < 3 ? 'text-blue-500' : 'text-gray-600'}`}>#{i + 1}</span>
                <img src={u.photoURL || ""} className="w-10 h-10 rounded-full bg-zinc-800 object-cover border border-zinc-700" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{u.username || "Anonymous"}</p>
                  <p className="text-[10px] text-gray-500 truncate">{u.bio}</p>
                </div>
                <p className="text-blue-400 font-black text-xs">{u.rp || 0} RP</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}