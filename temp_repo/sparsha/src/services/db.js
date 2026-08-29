import {
  collection, doc, addDoc, getDocs, getDoc, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp, limit, deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

function toMs(val) {
  if (!val) return 0;
  if (typeof val.toDate === "function") return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  return new Date(val).getTime();
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
  let id, exists = true;
  while (exists) {
    id = generatePatientId();
    const q = query(collection(db, "users"), where("patientId", "==", id));
    const snap = await getDocs(q);
    exists = !snap.empty;
  }
  return id;
}

// ── USERS / PROFILES ───────────────────────────────────────────────
export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(userId, data) {
  await updateDoc(doc(db, "users", userId), data);
}

export async function getAllPatients() {
  const q = query(collection(db, "users"), where("role", "==", "patient"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllDoctors() {
  const q = query(collection(db, "users"), where("role", "==", "doctor"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// find patient by patientId string (for family member lookup)
export async function getPatientByPatientId(patientId) {
  const q = query(collection(db, "users"), where("patientId", "==", patientId.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// ── ACCESS REQUESTS (doctor / family → patient) ────────────────────
// status: "pending" | "approved" | "rejected"
export async function sendAccessRequest(fromUid, fromName, fromRole, toPatientId, toUid) {
  // check no duplicate pending
  const q = query(
    collection(db, "accessRequests"),
    where("fromUid", "==", fromUid),
    where("toUid", "==", toUid),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  if (!snap.empty) throw new Error("Request already pending.");
  await addDoc(collection(db, "accessRequests"), {
    fromUid, fromName, fromRole,
    toUid, toPatientId,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getIncomingRequests(patientUid) {
  const q = query(
    collection(db, "accessRequests"),
    where("toUid", "==", patientUid),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function respondToRequest(requestId, approved, fromUid, toUid, fromRole) {
  await updateDoc(doc(db, "accessRequests", requestId), {
    status: approved ? "approved" : "rejected",
    respondedAt: serverTimestamp(),
  });
  if (approved) {
    // add to patient's approvedAccess list
    const patRef = doc(db, "users", toUid);
    const patSnap = await getDoc(patRef);
    const current = patSnap.data()?.approvedAccess || [];
    if (!current.includes(fromUid)) {
      await updateDoc(patRef, { approvedAccess: [...current, fromUid] });
    }
    // if doctor, also store in doctor's doc
    if (fromRole === "doctor") {
      const docRef = doc(db, "users", fromUid);
      const docSnap = await getDoc(docRef);
      const pts = docSnap.data()?.assignedPatients || [];
      if (!pts.includes(toUid)) {
        await updateDoc(docRef, { assignedPatients: [...pts, toUid] });
      }
    }
  }
}

export async function getApprovedAccessors(patientUid) {
  const snap = await getDoc(doc(db, "users", patientUid));
  const ids = snap.data()?.approvedAccess || [];
  if (ids.length === 0) return [];
  const profiles = await Promise.all(ids.map(uid => getUserProfile(uid)));
  return profiles.filter(Boolean);
}

export async function revokeAccess(patientUid, accessorUid) {
  const patRef = doc(db, "users", patientUid);
  const patSnap = await getDoc(patRef);
  const current = patSnap.data()?.approvedAccess || [];
  await updateDoc(patRef, { approvedAccess: current.filter(id => id !== accessorUid) });
}

// ── ASSESSMENTS ───────────────────────────────────────────────────
export async function saveAssessment(userId, formData, result) {
  const ref = await addDoc(collection(db, "assessments"), {
    userId, formData, result, createdAt: serverTimestamp(),
  });
  return ref.id;
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
  return safeQuery(
    query(collection(db, "assessments"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50)),
    query(collection(db, "assessments"), where("userId", "==", userId), limit(50))
  );
}

export async function getAllAssessments() {
  return safeQuery(
    query(collection(db, "assessments"), orderBy("createdAt", "desc"), limit(200)),
    query(collection(db, "assessments"), limit(200))
  );
}

// ── VOICE RESULTS ─────────────────────────────────────────────────
export async function saveVoiceResult(userId, result) {
  const ref = await addDoc(collection(db, "voiceResults"), {
    userId, result, createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPatientVoiceResults(userId) {
  return safeQuery(
    query(collection(db, "voiceResults"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50)),
    query(collection(db, "voiceResults"), where("userId", "==", userId), limit(50))
  );
}

// ── KICK COUNTER ──────────────────────────────────────────────────
export async function addKickEntry(userId, entry) {
  // entry: { count, note, recordedAt (Date) }
  const ref = await addDoc(collection(db, "kickCounter"), {
    userId,
    count:      entry.count,
    note:       entry.note || "",
    recordedAt: entry.recordedAt || serverTimestamp(),
    createdAt:  serverTimestamp(),
  });
  return ref.id;
}

export async function getKickEntries(userId) {
  return safeQuery(
    query(collection(db, "kickCounter"), where("userId", "==", userId), orderBy("recordedAt", "desc"), limit(100)),
    query(collection(db, "kickCounter"), where("userId", "==", userId), limit(100)),
    "recordedAt"
  );
}