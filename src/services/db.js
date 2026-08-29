import {
  collection, doc, addDoc, getDocs, getDoc, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp, limit, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../firebase";

function toMs(val) {
  if (!val) return 0;
  if (typeof val.toDate === "function") return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  return new Date(val).getTime();
}

/**
 * Enhanced Firestore error handler that logs diagnostic info and throws a structured error.
 */
function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
    },
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw error;
}

// ── Generate unique 8-digit patient ID ────────────────────────────
export function generatePatientId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let id = "SP"; // prefix so it's recognizable
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id; // e.g. SP4K9MX2
}

// Check uniqueness — retry if clash (extremely rare)
export async function createUniquePatientId() {
  let id = generatePatientId();
  try {
    const checkQuery = async () => {
      const q = query(collection(db, "users"), where("patientId", "==", id), limit(1));
      const snap = await getDocs(q);
      return snap.empty;
    };
    // 1.5s timeout safety so user auth never hangs
    const isAvailable = await Promise.race([
      checkQuery(),
      new Promise(res => setTimeout(() => res(true), 1500))
    ]);
    if (!isAvailable) {
      id = generatePatientId();
    }
  } catch (e) {
    // If permission or network issue, proceed with generated ID
  }
  return id;
}

// ── USERS / PROFILES ───────────────────────────────────────────────
export async function getUserProfile(userId) {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    handleFirestoreError(e, "get", `users/${userId}`);
    return null;
  }
}

export async function updateUserProfile(userId, data) {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    handleFirestoreError(e, "update", `users/${userId}`);
  }
}

export async function getAllPatients() {
  try {
    const q = query(collection(db, "users"), where("role", "==", "patient"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    handleFirestoreError(e, "list", "users");
    return [];
  }
}

export async function getAllDoctors() {
  try {
    const q = query(collection(db, "users"), where("role", "==", "doctor"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    handleFirestoreError(e, "list", "users");
    return [];
  }
}

// find patient by patientId string (for doctor & family member lookup)
export async function getPatientByPatientId(patientId) {
  try {
    const q = query(collection(db, "users"), where("patientId", "==", patientId.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (e) {
    handleFirestoreError(e, "get", "users");
    return null;
  }
}

// ── ACCESS REQUESTS (doctor / family → patient) ────────────────────
// status: "pending" | "approved" | "rejected" | "revoked"
export async function sendAccessRequest(fromUid, fromName, fromRole, toPatientId, toUid) {
  try {
    // check if there is an active pending request
    const q = query(
      collection(db, "accessRequests"),
      where("fromUid", "==", fromUid),
      where("toUid", "==", toUid),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error("Request already pending.");

    await addDoc(collection(db, "accessRequests"), {
      fromUid,
      fromName: fromName || "Healthcare Provider / Family",
      fromRole: fromRole || "family",
      toUid,
      toPatientId: (toPatientId || "").toUpperCase(),
      status: "pending",
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    if (e.message === "Request already pending.") throw e;
    handleFirestoreError(e, "create", "accessRequests");
  }
}

export async function getIncomingRequests(patientUid) {
  try {
    const q = query(
      collection(db, "accessRequests"),
      where("toUid", "==", patientUid),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    handleFirestoreError(e, "list", "accessRequests");
    return [];
  }
}

export async function respondToRequest(requestId, approved, fromUid, toUid, fromRole) {
  try {
    // 1. Update the accessRequest status
    await updateDoc(doc(db, "accessRequests", requestId), {
      status: approved ? "approved" : "rejected",
      respondedAt: serverTimestamp(),
    });

    if (approved) {
      // 2. Atomically add requester UID to patient's approvedAccess
      const patRef = doc(db, "users", toUid);
      await updateDoc(patRef, {
        approvedAccess: arrayUnion(fromUid),
      });

      // 3. If doctor, also store patient in doctor's assignedPatients
      if (fromRole === "doctor") {
        const docRef = doc(db, "users", fromUid);
        await updateDoc(docRef, {
          assignedPatients: arrayUnion(toUid),
        });
      }
    }
  } catch (e) {
    handleFirestoreError(e, "update", `accessRequests/${requestId}`);
  }
}

export async function getApprovedAccessors(patientUid) {
  try {
    const snap = await getDoc(doc(db, "users", patientUid));
    const ids = snap.data()?.approvedAccess || [];
    if (ids.length === 0) return [];
    const profiles = await Promise.all(ids.map(uid => getUserProfile(uid)));
    return profiles.filter(Boolean);
  } catch (e) {
    handleFirestoreError(e, "get", `users/${patientUid}`);
    return [];
  }
}

export async function revokeAccess(patientUid, accessorUid) {
  try {
    // 1. Atomically remove accessor from patient's approvedAccess
    const patRef = doc(db, "users", patientUid);
    await updateDoc(patRef, {
      approvedAccess: arrayRemove(accessorUid),
    });

    // 2. Atomically remove patient from doctor's assignedPatients
    try {
      const accRef = doc(db, "users", accessorUid);
      await updateDoc(accRef, {
        assignedPatients: arrayRemove(patientUid),
      });
    } catch (_) {}

    // 3. Update any access request doc to revoked
    const q = query(
      collection(db, "accessRequests"),
      where("fromUid", "==", accessorUid),
      where("toUid", "==", patientUid)
    );
    const snap = await getDocs(q);
    snap.docs.forEach(async (d) => {
      try {
        await updateDoc(doc(db, "accessRequests", d.id), {
          status: "revoked",
          revokedAt: serverTimestamp(),
        });
      } catch (_) {}
    });
  } catch (e) {
    handleFirestoreError(e, "update", `users/${patientUid}`);
  }
}

// ── ASSESSMENTS ───────────────────────────────────────────────────
export async function saveAssessment(userId, formData, result) {
  try {
    const ref = await addDoc(collection(db, "assessments"), {
      userId,
      formData,
      result,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) {
    handleFirestoreError(e, "create", "assessments");
    throw e;
  }
}

async function safeQuery(q, fallbackQ, sortKey = "createdAt") {
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    if (e.code === "failed-precondition" || e.message?.includes("index")) {
      const snap2 = await getDocs(fallbackQ);
      const docs = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
      return docs.sort((a, b) => toMs(b[sortKey]) - toMs(a[sortKey]));
    }
    throw e;
  }
}

export async function getPatientAssessments(userId) {
  try {
    return await safeQuery(
      query(collection(db, "assessments"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50)),
      query(collection(db, "assessments"), where("userId", "==", userId), limit(50))
    );
  } catch (e) {
    handleFirestoreError(e, "list", "assessments");
    return [];
  }
}

export async function getAllAssessments() {
  try {
    return await safeQuery(
      query(collection(db, "assessments"), orderBy("createdAt", "desc"), limit(200)),
      query(collection(db, "assessments"), limit(200))
    );
  } catch (e) {
    handleFirestoreError(e, "list", "assessments");
    return [];
  }
}

// ── VOICE RESULTS ─────────────────────────────────────────────────
export async function saveVoiceResult(userId, result) {
  try {
    const ref = await addDoc(collection(db, "voiceResults"), {
      userId,
      result,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) {
    handleFirestoreError(e, "create", "voiceResults");
    throw e;
  }
}

export async function getPatientVoiceResults(userId) {
  try {
    return await safeQuery(
      query(collection(db, "voiceResults"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50)),
      query(collection(db, "voiceResults"), where("userId", "==", userId), limit(50))
    );
  } catch (e) {
    handleFirestoreError(e, "list", "voiceResults");
    return [];
  }
}

// ── KICK COUNTER ──────────────────────────────────────────────────
export async function addKickEntry(userId, entry) {
  try {
    const ref = await addDoc(collection(db, "kickCounter"), {
      userId,
      count: entry.count,
      note: entry.note || "",
      recordedAt: entry.recordedAt || serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) {
    handleFirestoreError(e, "create", "kickCounter");
    throw e;
  }
}

export async function getKickEntries(userId) {
  try {
    return await safeQuery(
      query(collection(db, "kickCounter"), where("userId", "==", userId), orderBy("recordedAt", "desc"), limit(100)),
      query(collection(db, "kickCounter"), where("userId", "==", userId), limit(100)),
      "recordedAt"
    );
  } catch (e) {
    handleFirestoreError(e, "list", "kickCounter");
    return [];
  }
}
