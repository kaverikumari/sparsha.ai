import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getPatientByPatientId, sendAccessRequest, getPatientAssessments, getKickEntries } from "../services/db";
import KickCounter from "./KickCounter";
import PregnancyTimeline from "./PregnancyTimeline";
import "./Dashboard.css";

const TABS = ["Find Patient", "Health Reports", "Kick Counter", "Timeline"];

function RiskGauge({ value, label }) {
  const color = value < 30 ? "#059669" : value < 60 ? "#d97706" : "#dc2626";
  const cat   = value < 30 ? "Low" : value < 60 ? "Moderate" : "High";
  return (
    <div className="risk-gauge">
      <svg viewBox="0 0 120 70" width="150">
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round"/>
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(value/100)*157} 157`} style={{transition:"stroke-dasharray 0.8s ease"}}/>
        <text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="900" fill={color}>{value}%</text>
      </svg>
      <div className="gauge-label">{label}</div>
      <span className={`risk-badge risk-${cat.toLowerCase()}`}>{cat} Risk</span>
    </div>
  );
}

export default function FamilyDashboard({ onLogout, demo }) {
  const { user, profile, logout } = useAuth();
  const toast = useToast();

  const [tab, setTab]               = useState("Find Patient");
  const [pidInput, setPidInput]     = useState("");
  const [foundPatient, setFoundPatient] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null); // null | "pending" | "approved" | "no_access"
  const [searching, setSearching]   = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [kickEntries, setKickEntries] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // demo patient
  const demoPatient = {
    id: "demo-patient-1",
    name: "Priya Sharma",
    patientId: "SPDEMO01",
    age: 28,
    pregnancyWeek: 24,
    approvedAccess: ["demo-family-1"],
  };

  async function handleSearch(e) {
    e.preventDefault();
    if (!pidInput.trim()) return toast.warning("Please enter a Patient ID.");
    setSearching(true);
    setFoundPatient(null); setAccessStatus(null);
    try {
      if (demo) {
        setFoundPatient(demoPatient);
        setAccessStatus("approved");
        await loadPatientData(demoPatient.id);
        return;
      }
      const patient = await getPatientByPatientId(pidInput.trim().toUpperCase());
      if (!patient) { toast.error("No patient found with that ID. Check and try again."); return; }
      setFoundPatient(patient);
      // check if this family member has access
      const approved = patient.approvedAccess || [];
      if (approved.includes(user.uid)) {
        setAccessStatus("approved");
        await loadPatientData(patient.id);
      } else {
        setAccessStatus("no_access");
      }
    } catch (e) { toast.error("Search failed. Try again."); }
    finally { setSearching(false); }
  }

  async function loadPatientData(patientId) {
    setLoadingData(true);
    try {
      const [a, k] = await Promise.all([
        getPatientAssessments(patientId),
        getKickEntries(patientId),
      ]);
      setAssessments(a); setKickEntries(k);
    } catch (e) { toast.error("Couldn't load patient data."); }
    finally { setLoadingData(false); }
  }

  async function requestAccess() {
    if (!foundPatient || !user) return;
    setRequesting(true);
    try {
      await sendAccessRequest(user.uid, profile?.name || user.email, "family", foundPatient.patientId, foundPatient.id);
      setAccessStatus("pending");
      toast.success("Access request sent! The patient will approve it from their dashboard.");
    } catch (e) {
      if (e.message === "Request already pending.") toast.info("You already have a pending request for this patient.");
      else toast.error("Failed to send request.");
    } finally { setRequesting(false); }
  }

  async function handleLogout() { if (!demo) await logout(); onLogout(); }

  const latestAssessment = assessments[0];

  return (
    <div className="dashboard">
      <nav className="nav">
        <div className="nav-logo">SPARSHA<span>.AI</span></div>
        <div className="nav-links">
          {TABS.map(t => (
            <button key={t}
              className={`nav-btn ghost ${tab===t?"tab-active":""}`}
              disabled={t !== "Find Patient" && accessStatus !== "approved"}
              onClick={() => setTab(t)}>{t}</button>
          ))}
          {demo && <span className="demo-pill">Demo</span>}
          <button className="nav-btn solid" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div className="dash-body">

        {/* ── FIND PATIENT ── */}
        {tab === "Find Patient" && (
          <div className="dash-section">
            <h1 className="section-title">Find Your Family Member 👨‍👩‍👧</h1>
            <p className="section-sub" style={{marginBottom:"2rem"}}>
              Enter your family member's Patient ID to view their health updates.
              They need to approve your request first.
            </p>

            <div className="card" style={{maxWidth:480}}>
              <form onSubmit={handleSearch} noValidate>
                <div className="form-group">
                  <label>Patient ID</label>
                  <input
                    type="text" placeholder="e.g. SP4K9MX2"
                    value={pidInput}
                    onChange={e => setPidInput(e.target.value.toUpperCase())}
                    style={{letterSpacing:".12em",fontWeight:700,fontSize:"1.1rem",textAlign:"center"}}
                    maxLength={8}
                  />
                  <span style={{fontSize:".75rem",color:"var(--muted)"}}>
                    Ask your family member to share their Patient ID from their Profile page.
                  </span>
                </div>
                <button type="submit" className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} disabled={searching}>
                  {searching ? "Searching…" : "🔍 Find Patient"}
                </button>
              </form>

              {/* Found but no access */}
              {foundPatient && accessStatus === "no_access" && (
                <div className="found-patient-card">
                  <div className="fp-avatar">
                    {(foundPatient.name||"?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="fp-name">{foundPatient.name}</div>
                    <div className="fp-pid">ID: {foundPatient.patientId}</div>
                  </div>
                  <button className="btn btn-primary" style={{marginLeft:"auto",fontSize:".85rem"}}
                    onClick={requestAccess} disabled={requesting}>
                    {requesting ? "Sending…" : "📩 Request Access"}
                  </button>
                </div>
              )}

              {/* Pending */}
              {accessStatus === "pending" && (
                <div className="info-banner" style={{marginTop:"1rem"}}>
                  <div className="ib-icon">⏳</div>
                  <div>Request sent to <strong>{foundPatient?.name}</strong>. You'll get access once they approve it from their dashboard.</div>
                </div>
              )}

              {/* Approved */}
              {foundPatient && accessStatus === "approved" && (
                <div className="info-banner" style={{marginTop:"1rem",background:"#ecfdf5",borderColor:"#6ee7b7"}}>
                  <div className="ib-icon">✅</div>
                  <div>You have access to <strong>{foundPatient.name}</strong>'s health data. Use the tabs above to view reports.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HEALTH REPORTS ── */}
        {tab === "Health Reports" && accessStatus === "approved" && (
          <div className="dash-section">
            <h1 className="section-title">
              {foundPatient?.name || "Patient"}'s Health Reports
            </h1>
            <p className="section-sub" style={{marginBottom:"1.75rem"}}>
              Viewing as family member — read only.
            </p>

            {loadingData ? (
              <div className="empty-state"><div className="spinner" style={{width:32,height:32}}/></div>
            ) : !latestAssessment ? (
              <div className="empty-state">
                <div style={{fontSize:"3rem"}}>📋</div>
                <p>No assessments completed yet.</p>
              </div>
            ) : (
              <>
                <div className="gauges-row">
                  <div className="card"><RiskGauge value={latestAssessment.result.gdm}   label="GDM Risk"        /></div>
                  <div className="card"><RiskGauge value={latestAssessment.result.neuro} label="Child Neuro Risk"/></div>
                </div>

                <div className="card" style={{marginTop:"1.25rem"}}>
                  <h3 style={{marginBottom:"1rem"}}>📅 Assessment History</h3>
                  <table className="patient-table">
                    <thead><tr><th>Date</th><th>GDM Risk</th><th>Neuro Risk</th></tr></thead>
                    <tbody>
                      {assessments.map(a => {
                        const ts = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt||0);
                        const date = isNaN(ts) ? "—" : ts.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
                        const cat = a.result.gdm>=60?"high":a.result.gdm>=30?"medium":"low";
                        return (
                          <tr key={a.id}>
                            <td>{date}</td>
                            <td><span className={`risk-badge risk-${cat}`}>{a.result.gdm}%</span></td>
                            <td>{a.result.neuro}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── KICK COUNTER (read-only view) ── */}
        {tab === "Kick Counter" && accessStatus === "approved" && (
          <div className="dash-section">
            <h1 className="section-title">{foundPatient?.name}'s Kick Counter 👶</h1>
            <p className="section-sub" style={{marginBottom:"1.75rem"}}>Read-only view of kick sessions.</p>
            {loadingData ? (
              <div className="empty-state"><div className="spinner" style={{width:32,height:32}}/></div>
            ) : kickEntries.length === 0 ? (
              <div className="empty-state"><div style={{fontSize:"3rem"}}>👶</div><p>No kick sessions recorded yet.</p></div>
            ) : (
              <div className="card">
                <h3 style={{marginBottom:"1rem"}}>📅 Kick History</h3>
                <table className="patient-table">
                  <thead><tr><th>Date</th><th>Time</th><th>Kicks</th><th>Note</th><th>Status</th></tr></thead>
                  <tbody>
                    {kickEntries.map((e, i) => {
                      const ts = e.recordedAt?.toDate ? e.recordedAt.toDate() : new Date(e.recordedAt||0);
                      const cat = e.count>=10?"low":e.count>=6?"medium":"high";
                      const label = e.count>=10?"Normal":e.count>=6?"Monitor":"Low — alert doctor";
                      return (
                        <tr key={e.id||i}>
                          <td>{isNaN(ts)?"—":ts.toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</td>
                          <td>{isNaN(ts)?"—":ts.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</td>
                          <td style={{fontWeight:700,fontSize:"1.1rem"}}>{e.count}</td>
                          <td style={{color:"var(--muted)",fontSize:".82rem",fontStyle:"italic"}}>{e.note||"—"}</td>
                          <td><span className={`risk-badge risk-${cat}`}>{label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab === "Timeline" && accessStatus === "approved" && (
          <PregnancyTimeline demo={demo} />
        )}

      </div>
    </div>
  );
}