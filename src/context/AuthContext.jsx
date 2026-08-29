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
        
        // Immediate baseline profile to unblock UI instantly
        const baseProfile = {
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Patient"),
          email: firebaseUser.email || "",
          role: "patient",
          patientId: "SP" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          approvedAccess: [],
          onboardingComplete: false,
        };
        setProfile(prev => prev || baseProfile);
        setLoading(false);

        // Fetch or create profile in Firestore with timeout safety
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const fetchDoc = async () => {
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              return snap.data();
            } else {
              const newPatientId = await createUniquePatientId();
              const newProfile = {
                ...baseProfile,
                patientId: newPatientId,
                createdAt: serverTimestamp(),
              };
              await setDoc(userRef, newProfile);
              return newProfile;
            }
          };

          const result = await Promise.race([
            fetchDoc(),
            new Promise(res => setTimeout(() => res(null), 3000))
          ]);

          if (result) {
            setProfile(result);
          }
        } catch (e) {
          console.warn("Firestore profile sync warning:", e);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // refresh profile from Firestore (call after profile updates)
  async function refreshProfile(uid) {
    const targetUid = uid || user?.uid;
    if (!targetUid) return null;
    try {
      const snap = await Promise.race([
        getDoc(doc(db, "users", targetUid)),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
      ]);
      if (snap && snap.exists()) {
        setProfile(snap.data());
        return snap.data();
      }
    } catch (e) {
      console.warn("Profile refresh timeout or error:", e);
    }
    return profile;
  }

  async function signUp(email, password, name, role = "patient") {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (name) {
      try {
        await updateProfile(cred.user, { displayName: name.trim() });
      } catch (e) {
        console.warn("Could not update displayName:", e);
      }
    }
    const profileData = {
      name: name?.trim() || (cleanEmail ? cleanEmail.split("@")[0] : "Patient"),
      email: cleanEmail,
      role: role || "patient",
      onboardingComplete: false,
      createdAt: serverTimestamp(),
    };
    // patients get a unique ID
    if (role === "patient") {
      profileData.patientId = await createUniquePatientId();
      profileData.approvedAccess = [];
    }
    
    // Set local state immediately
    setUser(cred.user);
    setProfile(profileData);

    // Persist to firestore with non-blocking error handling
    try {
      await Promise.race([
        setDoc(doc(db, "users", cred.user.uid), profileData),
        new Promise(res => setTimeout(res, 2500))
      ]);
    } catch (e) {
      console.warn("Firestore setDoc warning:", e);
    }
    return cred.user;
  }

  async function login(email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    setUser(cred.user);
    
    const fallbackProfile = {
      name: cred.user.displayName || (cleanEmail ? cleanEmail.split("@")[0] : "Patient"),
      email: cleanEmail,
      role: "patient",
      patientId: "SP" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      approvedAccess: [],
      onboardingComplete: false,
    };
    setProfile(prev => prev || fallbackProfile);

    try {
      const userRef = doc(db, "users", cred.user.uid);
      const snap = await Promise.race([
        getDoc(userRef),
        new Promise(res => setTimeout(() => res(null), 2500))
      ]);
      if (snap && snap.exists()) {
        setProfile(snap.data());
      } else {
        await setDoc(userRef, { ...fallbackProfile, createdAt: serverTimestamp() });
      }
    } catch (e) {
      console.warn("Firestore login fetch warning:", e);
    }
    return cred.user;
  }

  async function loginWithGoogle(selectedRole = "patient") {
    const cred = await signInWithPopup(auth, googleProvider);
    setUser(cred.user);

    const initialProfile = {
      name: cred.user.displayName || "Patient",
      email: cred.user.email || "",
      role: selectedRole || "patient",
      onboardingComplete: false,
      patientId: "SP" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      approvedAccess: [],
    };
    setProfile(initialProfile);

    try {
      const ref = doc(db, "users", cred.user.uid);
      const snap = await Promise.race([
        getDoc(ref),
        new Promise(res => setTimeout(() => res(null), 2500))
      ]);
      if (snap && snap.exists()) {
        setProfile(snap.data());
      } else {
        const fullPatientId = (selectedRole || "patient") === "patient" ? await createUniquePatientId() : undefined;
        const profileData = {
          ...initialProfile,
          ...(fullPatientId ? { patientId: fullPatientId } : {}),
          createdAt: serverTimestamp(),
        };
        await setDoc(ref, profileData);
        setProfile(profileData);
      }
    } catch (e) {
      console.warn("Firestore Google sign-in profile warning:", e);
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