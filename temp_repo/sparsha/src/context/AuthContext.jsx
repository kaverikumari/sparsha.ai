import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup,
  signOut, updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { createUniquePatientId } from "../services/db";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) setProfile(snap.data());
      } else {
        setUser(null); setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // refresh profile from Firestore (call after profile updates)
  async function refreshProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid || user?.uid));
    if (snap.exists()) setProfile(snap.data());
    return snap.data();
  }

  async function signUp(email, password, name, role) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const profileData = {
      name, email, role,
      onboardingComplete: false,
      createdAt: serverTimestamp(),
    };
    // patients get a unique ID
    if (role === "patient") {
      profileData.patientId = await createUniquePatientId();
      profileData.approvedAccess = [];
    }
    await setDoc(doc(db, "users", cred.user.uid), profileData);
    setProfile(profileData);
    return cred.user;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) setProfile(snap.data());
    return cred.user;
  }

  async function loginWithGoogle(role) {
    const cred = await signInWithPopup(auth, googleProvider);
    const ref  = doc(db, "users", cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profileData = {
        name: cred.user.displayName, email: cred.user.email,
        role, onboardingComplete: false, createdAt: serverTimestamp(),
      };
      if (role === "patient") {
        profileData.patientId = await createUniquePatientId();
        profileData.approvedAccess = [];
      }
      await setDoc(ref, profileData);
      setProfile(profileData);
    } else {
      setProfile(snap.data());
    }
    return cred.user;
  }

  // family member login — enter patient ID to view their data
  async function loginAsFamily(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) setProfile(snap.data());
    return cred.user;
  }

  async function logout() { await signOut(auth); }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, login, loginWithGoogle, loginAsFamily, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }