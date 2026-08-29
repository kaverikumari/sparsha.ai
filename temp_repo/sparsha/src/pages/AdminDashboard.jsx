import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getAllPatients, getAllDoctors, getAllAssessments, updateUserProfile } from "../services/db";
import "./Dashboard.css";

const TABS = ["Overview", "Patients", "Doctors", "Assignments"];

function RiskBadge({ val }) {
  if (val === null || val === undefined) return <span style={{color:"var(--muted)",fontSize:".8rem"}}>Not tested</span>;
  const cat = val < 30 ? "low" : val < 60 ? "medium" : "high";
  const label = val < 30 ? "Low" : val < 60 ? "Mod" : "High";
  return <span className={`risk-badge risk-${cat}`}>{label} ({val}%)</span>;
}

export default function AdminDashboard({ onLogout, demo }) {
  const { logout } = useAuth();
  const toast = useToast();

  const [tab, setTab]           = useState("Overview");
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors]   = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [assigning, setAssigning] = useState(null); // patientId being assigned

  const demoPatients = [
    { id:"1", name:"Priya Sharma",  patientId:"SPABC123", age:28, pregnancyWeek:24, assignedDoctorId:"d1" },
    { id:"2", name:"Meena Patel",   patientId:"SPDEF456", age:26, pregnancyWeek:32, assignedDoctorId:null },
    { id:"3", name:"Sunita Devi",   patientId:"SPGHI789", age:38, pregnancyWeek:20, assignedDoctorId:"d1" },
    { id:"4", name:"Ananya Roy",    patientId:"SPJKL012", age:31, pregnancyWeek:18, assignedDoctorId:null },
    { id:"5", name:"Kavita Singh",  patientId:"SPMNO345", age:24, pregnancyWeek:12, assignedDoctorId:"d2" },
  ];
  const demoDoctors = [
    { id:"d1", name:"Dr. Rekha Sharma",  email:"rekha@hospital.com", speciality:"OB-GYN" },
    { id:"d2", name:"Dr. Avik Das",      email:"avik@hospital.com",  speciality:"Endocrinology" },
  ];
  const demoAssessments = [
    { userId:"1", result:{ gdm:72 } }, { userId:"2", result:{ gdm:55 } },
    { userId:"3", result:{ gdm:81 } }, { userId:"5", result:{ gdm:18 } },
  ];

  async function fetchAll() {
    if (demo) { setLoading(false); return; }
    setLoading(true);
    try {
      const [p, d, a] = await Promise.all([getAllPatients(), getAllDoctors(), getAllAssessments()]);
      setPatients(p); setDoctors(d); setAssessments(a);
    } catch (e) { toast.error("Failed to load data."); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, [demo]);

  const displayPatients    = demo ? demoPatients    : patients;
  const displayDoctors     = demo ? demoDoctors     : doctors;
  const displayAssessments = demo ? demoAssessments : assessments;

  // latest gdm per patient
  const gdmByPatient = {};
  displayAssessments.forEach(a => {
    if (!gdmByPatient[a.userId]) gdmByPatient[a.userId] = a.result?.gdm;
  });

  const highRisk = displayPatients.filter(p => (gdmByPatient[p.id] || 0) >= 60).length;
  const unassigned = displayPatients.filter(p => !p.assignedDoctorId).length;

  async function assignDoctor(patientId, doctorId) {
    setAssigning(patientId);
    try {
      if (!demo) await updateUserProfile(patientId, { assignedDoctorId: doctorId || null });
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, assignedDoctorId: doctorId || null } : p));
      toast.success(doctorId ? "Doctor assigned!" : "Assignment removed.");
    } catch (e) { toast.error("Failed to assign doctor."); }
    finally { setAssigning(null); }
  }

  async function handleLogout() { if (!demo) await logout(); onLogout(); }

  return (
    <div className="dashboard">
      <nav className="nav">
        <div className="nav-logo">SPARSHA<span>.AI</span></div>
        <div className="nav-links">
          {TABS.map(t => (
            <button key={t} className={`nav-btn ghost ${tab===t?"tab-active":""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
          {demo && <span className="demo-pill">Demo</span>}
          {!demo && <button className="nav-btn outline" onClick={fetchAll} style={{fontSize:".8rem"}}>🔄</button>}
          <button className="nav-btn solid" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>
      <div className="dash-body">

        {tab === "Overview" && (
          <div className="dash-section">
            <h1 className="section-title">Admin Dashboard 🛡️</h1>
            <p className="section-sub" style={{marginBottom:"1.75rem"}}>Platform-wide overview.</p>
            {loading ? <div className="empty-state"><div className="spinner" style={{width:32,height:32}}/></div> : (
              <>
                <div className="grid-3" style={{marginBottom:"1.5rem"}}>
                  <div className="card dsc"><div className="dsc-icon">🤱</div><div className="dsc-label">Total Patients</div><div className="dsc-val" style={{color:"var(--teal-d)"}}>{displayPatients.length}</div><div className="dsc-cta">{unassigned} unassigned</div></div>
                  <div className="card dsc"><div className="dsc-icon">👨‍⚕️</div><div className="dsc-label">Doctors</div><div className="dsc-val" style={{color:"var(--teal-d)"}}>{displayDoctors.length}</div><div className="dsc-cta">Active</div></div>
                  <div className="card dsc"><div className="dsc-icon">🔴</div><div className="dsc-label">High Risk</div><div className="dsc-val" style={{color:"#dc2626"}}>{highRisk}</div><div className="dsc-cta">Need attention</div></div>
                </div>
                {unassigned > 0 && (
                  <div className="info-banner">
                    <div className="ib-icon">⚠️</div>
                    <div><strong>{unassigned} patient{unassigned>1?"s":""}</strong> don't have a doctor assigned. Go to Assignments to fix this.</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "Patients" && (
          <div className="dash-section">
            <h1 className="section-title">All Patients</h1>
            {loading ? <div className="empty-state"><div className="spinner" style={{width:32,height:32}}/></div> : (
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <table className="patient-table">
                  <thead><tr><th>Patient</th><th>Patient ID</th><th>Age</th><th>Week</th><th>GDM Risk</th><th>Assigned Doctor</th></tr></thead>
                  <tbody>
                    {displayPatients.map(p => {
                      const dr = displayDoctors.find(d => d.id === p.assignedDoctorId);
                      return (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td><span style={{fontFamily:"var(--font-d)",letterSpacing:".08em",fontSize:".85rem",color:"var(--teal-d)"}}>{p.patientId}</span></td>
                          <td>{p.age||"—"}</td>
                          <td>{p.pregnancyWeek ? `Wk ${p.pregnancyWeek}` : "—"}</td>
                          <td><RiskBadge val={gdmByPatient[p.id]} /></td>
                          <td>{dr ? dr.name : <span style={{color:"var(--muted)",fontSize:".8rem"}}>Unassigned</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "Doctors" && (
          <div className="dash-section">
            <h1 className="section-title">Doctors</h1>
            {loading ? <div className="empty-state"><div className="spinner" style={{width:32,height:32}}/></div> : (
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <table className="patient-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Speciality</th><th>Patients Assigned</th></tr></thead>
                  <tbody>
                    {displayDoctors.map(d => {
                      const count = displayPatients.filter(p => p.assignedDoctorId === d.id).length;
                      return (
                        <tr key={d.id}>
                          <td><strong>{d.name}</strong></td>
                          <td style={{color:"var(--muted)",fontSize:".85rem"}}>{d.email}</td>
                          <td>{d.speciality||"—"}</td>
                          <td style={{textAlign:"center"}}>{count}</td>
                        </tr>
                      );
                    })}
                    {displayDoctors.length === 0 && (
                      <tr><td colSpan={4} style={{textAlign:"center",color:"var(--muted)",padding:"2rem"}}>No doctors registered yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "Assignments" && (
          <div className="dash-section">
            <h1 className="section-title">Assign Doctors to Patients</h1>
            <p className="section-sub" style={{marginBottom:"1.5rem"}}>
              Select a doctor for each patient. Doctors only see their assigned patients.
            </p>
            {loading ? <div className="empty-state"><div className="spinner" style={{width:32,height:32}}/></div> : (
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <table className="patient-table">
                  <thead><tr><th>Patient</th><th>Patient ID</th><th>GDM Risk</th><th>Assigned Doctor</th><th>Action</th></tr></thead>
                  <tbody>
                    {displayPatients.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong><div style={{fontSize:".75rem",color:"var(--muted)"}}>{p.age ? `Age ${p.age}` : ""}{p.pregnancyWeek ? ` · Wk ${p.pregnancyWeek}` : ""}</div></td>
                        <td><span style={{fontFamily:"var(--font-d)",letterSpacing:".08em",fontSize:".82rem",color:"var(--teal-d)"}}>{p.patientId}</span></td>
                        <td><RiskBadge val={gdmByPatient[p.id]} /></td>
                        <td>
                          <select
                            value={p.assignedDoctorId || ""}
                            onChange={e => assignDoctor(p.id, e.target.value)}
                            disabled={assigning === p.id}
                            style={{padding:".4rem .6rem",borderRadius:8,border:"1.5px solid #e2e8f0",fontFamily:"var(--font-b)",fontSize:".85rem"}}>
                            <option value="">— Unassigned —</option>
                            {displayDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </td>
                        <td>
                          {assigning === p.id
                            ? <span style={{fontSize:".8rem",color:"var(--muted)"}}>Saving…</span>
                            : p.assignedDoctorId
                              ? <span className="risk-badge risk-low">Assigned</span>
                              : <span className="risk-badge risk-high">Unassigned</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}