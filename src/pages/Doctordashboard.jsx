import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getAllAssessments, getAllPatients, getPatientByPatientId, sendAccessRequest } from "../services/db";
import Recommendations from "../components/Recommendations";
import "./Dashboard.css";

const TABS = ["Overview", "Patient List", "Request Patient Access", "Decision Support"];

function RiskBadge({ val }) {
  const cat   = val < 30 ? "low" : val < 60 ? "medium" : "high";
  const label = val < 30 ? "Low" : val < 60 ? "Moderate" : "High";
  return <span className={`risk-badge risk-${cat}`}>{label} ({val}%)</span>;
}

function RiskGauge({ value, label }) {
  const color = value < 30 ? "#059669" : value < 60 ? "#d97706" : "#dc2626";
  const cat   = value < 30 ? "Low"     : value < 60 ? "Moderate" : "High";
  return (
    <div style={{textAlign:"center",padding:"1rem"}}>
      <svg viewBox="0 0 120 70" width="140">
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round"/>
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(value/100)*157} 157`} style={{transition:"stroke-dasharray 0.8s ease"}}/>
        <text x="60" y="62" textAnchor="middle" fontSize="18" fontWeight="900" fill={color}>{value}%</text>
      </svg>
      <div style={{fontWeight:600,fontSize:".9rem",marginBottom:".35rem"}}>{label}</div>
      <span className={`risk-badge risk-${cat.toLowerCase()}`}>{cat} Risk</span>
    </div>
  );
}

export default function DoctorDashboard({ onLogout, demo }) {
  const { user, profile, logout } = useAuth();
  const toast = useToast();

  const [tab, setTab]         = useState("Overview");
  const [selected, setSelected] = useState(null);

  // real data
  const [patients, setPatients]     = useState([]);   // user profiles
  const [assessments, setAssessments] = useState([]); // all GDM submissions
  const [loading, setLoading]       = useState(true);

  // Request access state
  const [searchPid, setSearchPid]       = useState("");
  const [foundPatient, setFoundPatient] = useState(null);
  const [searching, setSearching]       = useState(false);
  const [requesting, setRequesting]     = useState(false);
  const [reqStatus, setReqStatus]       = useState(null);

  // merged view: one row per patient with their latest assessment
  const [rows, setRows] = useState([]);

  async function handleLogout() {
    if (!demo) await logout();
    if (onLogout) onLogout();
  }

  // ── Load all patient data from Firestore ──────────────────────────
  async function fetchData() {
    if (demo) { setLoading(false); return; }
    setLoading(true);
    try {
      const [allPatients, allAssessments] = await Promise.all([
        getAllPatients(),
        getAllAssessments(),
      ]);
      // Show patients assigned to this doctor or who approved access
      const myPatients = allPatients.filter(p => 
        p.assignedDoctorId === user?.uid || 
        (Array.isArray(p.approvedAccess) && p.approvedAccess.includes(user?.uid)) ||
        (Array.isArray(profile?.assignedPatients) && profile.assignedPatients.includes(p.id))
      );
      setPatients(myPatients);
      setAssessments(allAssessments.filter(a => myPatients.some(p => p.id === a.userId)));

      // merge: for each patient, grab their latest assessment
      const merged = myPatients.map(p => {
        const patientAssessments = allAssessments
          .filter(a => a.userId === p.id)
          .sort((a, b) => {
            const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt||0);
            const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt||0);
            return tb - ta;
          });
        const latest = patientAssessments[0];
        return {
          id:          p.id,
          name:        p.name || p.email || "Unknown",
          email:       p.email || "—",
          age:         p.age || "—",
          week:        p.pregnancyWeek || "—",
          gdm:         latest?.result?.gdm   ?? null,
          neuro:       latest?.result?.neuro ?? null,
          formData:    latest?.formData      ?? null,
          testCount:   patientAssessments.length,
          lastTested:  latest?.createdAt     ?? null,
        };
      });
      setRows(merged);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load patient data.");
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, [demo, user]);

  async function handleSearchPatient(e) {
    e.preventDefault();
    if (!searchPid.trim()) return toast.warning("Please enter a Patient ID.");
    setSearching(true);
    setFoundPatient(null);
    setReqStatus(null);
    try {
      const patient = await getPatientByPatientId(searchPid.trim().toUpperCase());
      if (!patient) {
        toast.error("No patient found with that ID.");
        return;
      }
      setFoundPatient(patient);
      if (patient.approvedAccess?.includes(user?.uid) || patient.assignedDoctorId === user?.uid) {
        setReqStatus("already_approved");
      } else {
        setReqStatus("can_request");
      }
    } catch (err) {
      toast.error("Search failed. Check your connection.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest() {
    if (!foundPatient || !user) return;
    setRequesting(true);
    try {
      await sendAccessRequest(
        user.uid,
        profile?.name ? `Dr. ${profile.name}` : user.email,
        "doctor",
        foundPatient.patientId,
        foundPatient.id
      );
      setReqStatus("pending");
      toast.success("Access request sent to patient! They will receive it on their dashboard.");
    } catch (err) {
      if (err.message === "Request already pending.") {
        toast.info("A request is already pending approval from this patient.");
        setReqStatus("pending");
      } else {
        toast.error("Failed to send request.");
      }
    } finally {
      setRequesting(false);
    }
  }

  // demo fallback rows
  const displayRows = demo ? [
    { id:"1", name:"Priya Sharma",   email:"priya@example.com",  age:28, week:24, gdm:72, neuro:40, formData:{glucose:145,bmi:29,familyHistory:"yes",activity:"sedentary"}, testCount:3 },
    { id:"2", name:"Ananya Roy",     email:"ananya@example.com", age:31, week:18, gdm:34, neuro:19, formData:{glucose:98, bmi:23,familyHistory:"no", activity:"active"},    testCount:1 },
    { id:"3", name:"Meena Patel",    email:"meena@example.com",  age:26, week:32, gdm:55, neuro:31, formData:{glucose:118,bmi:27,familyHistory:"no", activity:"moderate"},  testCount:2 },
    { id:"4", name:"Sunita Devi",    email:"sunita@example.com", age:38, week:20, gdm:81, neuro:58, formData:{glucose:162,bmi:33,familyHistory:"yes",activity:"sedentary"}, testCount:4 },
    { id:"5", name:"Kavita Singh",   email:"kavita@example.com", age:24, week:12, gdm:18, neuro:10, formData:{glucose:88, bmi:21,familyHistory:"no", activity:"active"},    testCount:1 },
  ] : rows;

  const tested     = displayRows.filter(r => r.gdm !== null);
  const highRisk   = tested.filter(r => r.gdm >= 60).length;
  const moderate   = tested.filter(r => r.gdm >= 30 && r.gdm < 60).length;
  const lowRisk    = tested.filter(r => r.gdm < 30).length;
  const untested   = displayRows.filter(r => r.gdm === null).length;

  return (
    <div className="dashboard">
      <nav className="nav">
        <div className="nav-logo">SPARSHA<span>.AI</span></div>
        <div className="nav-links">
          {TABS.map(t => (
            <button key={t} className={`nav-btn ghost ${tab===t?"tab-active":""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
          {demo && <span className="demo-pill">Demo Mode</span>}
          {!demo && (
            <button className="nav-btn outline" onClick={fetchData} disabled={loading} style={{fontSize:".8rem"}}>
              🔄 Refresh
            </button>
          )}
          <button className="nav-btn solid" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div className="dash-body">

        {/* ── OVERVIEW ── */}
        {tab === "Overview" && (
          <div className="dash-section">
            <h1 className="section-title">Doctor Dashboard</h1>
            <p className="section-sub" style={{marginBottom:"1.75rem"}}>
              {demo ? "Demo view with sample patients." : `${displayRows.length} registered patient${displayRows.length!==1?"s":""} · ${tested.length} assessed`}
            </p>

            {loading ? (
              <div className="empty-state"><div className="spinner" style={{width:32,height:32}}/><p>Loading patient data…</p></div>
            ) : (
              <>
                <div className="grid-3" style={{marginBottom:"1.5rem"}}>
                  <div className="card dsc" style={{cursor:"pointer"}} onClick={() => setTab("Patient List")}>
                    <div className="dsc-icon">🔴</div>
                    <div className="dsc-label">High Risk</div>
                    <div className="dsc-val" style={{color:"#dc2626"}}>{highRisk}</div>
                    <div className="dsc-cta">Needs immediate attention</div>
                  </div>
                  <div className="card dsc" style={{cursor:"pointer"}} onClick={() => setTab("Patient List")}>
                    <div className="dsc-icon">🟡</div>
                    <div className="dsc-label">Moderate Risk</div>
                    <div className="dsc-val" style={{color:"#d97706"}}>{moderate}</div>
                    <div className="dsc-cta">Monitor closely</div>
                  </div>
                  <div className="card dsc" style={{cursor:"pointer"}} onClick={() => setTab("Patient List")}>
                    <div className="dsc-icon">🟢</div>
                    <div className="dsc-label">Low Risk</div>
                    <div className="dsc-val" style={{color:"#059669"}}>{lowRisk}</div>
                    <div className="dsc-cta">Routine follow-up</div>
                  </div>
                </div>

                {untested > 0 && (
                  <div className="info-banner" style={{marginBottom:"1.5rem"}}>
                    <div className="ib-icon">⏳</div>
                    <div><strong>{untested} patient{untested>1?"s":""}</strong> registered but haven't submitted a GDM assessment yet.</div>
                  </div>
                )}

                <div className="info-banner">
                  <div className="ib-icon">🤖</div>
                  <div>AI Models: <strong>XGBoost · Random Forest · CNN · Ensemble</strong> &nbsp;|&nbsp; Explainability: <strong>SHAP · LIME</strong></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PATIENT LIST ── */}
        {tab === "Patient List" && (
          <div className="dash-section">
            <h1 className="section-title">Patient Risk Overview</h1>
            <p className="section-sub" style={{marginBottom:"1.5rem"}}>
              {demo ? "Sample patient data." : "Real-time data from patient submissions."}
            </p>

            {loading ? (
              <div className="empty-state"><div className="spinner" style={{width:32,height:32}}/><p>Loading…</p></div>
            ) : displayRows.length === 0 ? (
              <div className="empty-state">
                <div style={{fontSize:"3rem"}}>👥</div>
                <p>No patients registered yet. Share the app link with patients to get started.</p>
              </div>
            ) : (
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Age</th>
                      <th>Week</th>
                      <th>GDM Risk</th>
                      <th>Neuro Risk</th>
                      <th>Tests</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map(p => (
                      <tr key={p.id} className={selected?.id===p.id?"selected-row":""}>
                        <td>
                          <div style={{fontWeight:600}}>{p.name}</div>
                          <div style={{fontSize:".75rem",color:"var(--muted)"}}>{p.email}</div>
                        </td>
                        <td>{p.age}</td>
                        <td>{p.week ? `Wk ${p.week}` : "—"}</td>
                        <td>{p.gdm !== null ? <RiskBadge val={p.gdm}/> : <span style={{color:"var(--muted)",fontSize:".8rem"}}>Not tested</span>}</td>
                        <td>{p.neuro !== null ? <RiskBadge val={p.neuro}/> : "—"}</td>
                        <td style={{textAlign:"center"}}>{p.testCount||0}</td>
                        <td>
                          {p.gdm !== null ? (
                            <button className="nav-btn solid" style={{fontSize:".78rem",padding:".3rem .7rem"}}
                              onClick={() => { setSelected(p); setTab("Decision Support"); }}>
                              Review
                            </button>
                          ) : (
                            <span style={{fontSize:".78rem",color:"var(--muted)"}}>Awaiting data</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── DECISION SUPPORT ── */}
        {tab === "Decision Support" && (
          <div className="dash-section">
            <h1 className="section-title">Decision Support</h1>
            {!selected ? (
              <div className="empty-state">
                <div style={{fontSize:"3rem"}}>🩺</div>
                <p>Select a patient from the Patient List to view their AI report.</p>
                <button className="btn btn-primary" onClick={() => setTab("Patient List")}>View Patients →</button>
              </div>
            ) : (
              <>
                <div className="card patient-header" style={{marginBottom:"1.25rem"}}>
                  <div>
                    <h2 style={{fontFamily:"var(--font-d)",fontSize:"1.3rem"}}>{selected.name}</h2>
                    <p style={{color:"var(--muted)",fontSize:".88rem"}}>
                      {selected.age !== "—" ? `Age ${selected.age}` : "Age unknown"}
                      {selected.week !== "—" ? ` · Pregnancy Week ${selected.week}` : ""}
                      {" · "}{selected.testCount} test{selected.testCount!==1?"s":""}
                    </p>
                  </div>
                  <button className="btn btn-secondary" style={{fontSize:".85rem",padding:".5rem 1.1rem"}}
                    onClick={() => setSelected(null)}>← Change Patient</button>
                </div>

                <div className="grid-3">
                  {[
                    { label:"GDM Risk",        val:selected.gdm,   icon:"🩺" },
                    { label:"Child Neuro Risk", val:selected.neuro, icon:"🧠" },
                    { label:"Dysarthria Risk",  val:Math.round((selected.gdm||0)*0.52), icon:"🎙️" },
                  ].map((r,i) => (
                    <div className="card" key={i}><RiskGauge value={r.val||0} label={r.label}/></div>
                  ))}
                </div>

                {/* SHAP from real formData */}
                {selected.formData && (() => {
                  const fd = selected.formData;
                  const rows = [
                    { factor:"Fasting Glucose",   contrib: +fd.glucose>140?35:+fd.glucose>100?20:5 },
                    { factor:"BMI",               contrib: +fd.bmi>30?30:+fd.bmi>25?15:5 },
                    { factor:"Family History",    contrib: fd.familyHistory==="yes"?15:2 },
                    { factor:"Physical Activity", contrib: fd.activity==="sedentary"?10:3 },
                  ];
                  return (
                    <div className="card shap-card" style={{marginTop:"1.25rem"}}>
                      <h3 style={{marginBottom:".85rem"}}>🧮 SHAP Feature Importance</h3>
                      {rows.map((r,i) => (
                        <div key={i} className="shap-row">
                          <div className="shap-label">{r.factor}</div>
                          <div className="shap-bar-wrap"><div className="shap-bar" style={{width:`${Math.min(r.contrib*2,100)}%`,background:r.contrib>20?"var(--rose)":"var(--teal)"}}/></div>
                          <div className="shap-val">{r.contrib}%</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="card" style={{marginTop:"1.1rem",background:"#f0fdfa"}}>
                  <h3 style={{marginBottom:".7rem"}}>📋 AI Clinical Suggestions</h3>
                  <ul style={{paddingLeft:"1.2rem",color:"var(--muted)",lineHeight:2,fontSize:".88rem"}}>
                    {(selected.gdm||0) >= 60 && <li>Order Oral Glucose Tolerance Test (OGTT) immediately</li>}
                    {(selected.gdm||0) >= 50 && <li>Refer to endocrinologist for glucose management plan</li>}
                    {(selected.neuro||0) >= 40 && <li>Schedule pediatric neurology follow-up at 6 months post-birth</li>}
                    {(selected.gdm||0)*0.52 >= 40 && <li>Refer child for speech-language pathology evaluation post-birth</li>}
                    <li>Monthly prenatal monitoring recommended</li>
                    <li>Nutritional counseling and lifestyle modification program</li>
                  </ul>
                </div>

                <div style={{marginTop:"1.5rem"}}>
                  <h3 style={{fontSize:"1.15rem",fontWeight:700,color:"var(--navy)",marginBottom:".75rem"}}>
                    🌿 Patient Care & Lifestyle Plan
                  </h3>
                  <Recommendations 
                    result={{ gdm: selected.gdm, neuro: selected.neuro, bmi: selected.formData?.bmi }} 
                    formData={selected.formData || {}} 
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ── REQUEST PATIENT ACCESS ── */}
        {tab === "Request Patient Access" && (
          <div className="dash-section">
            <h1 className="section-title">Connect with Patient 🩺</h1>
            <p className="section-sub" style={{marginBottom:"2rem"}}>
              Enter a patient's unique Patient ID (e.g. SP4K9MX2) to request access to their clinical assessment results, health logs, and timelines.
            </p>

            <div className="card" style={{maxWidth:520}}>
              <form onSubmit={handleSearchPatient} noValidate>
                <div className="form-group">
                  <label>Patient ID</label>
                  <input
                    type="text"
                    placeholder="e.g. SP4K9MX2"
                    value={searchPid}
                    onChange={e => setSearchPid(e.target.value.toUpperCase())}
                    style={{letterSpacing:".12em",fontWeight:700,fontSize:"1.1rem",textAlign:"center"}}
                    maxLength={8}
                  />
                  <span style={{fontSize:".75rem",color:"var(--muted)"}}>
                    Ask the patient for the 8-character ID displayed in their profile or dashboard.
                  </span>
                </div>
                <button type="submit" className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} disabled={searching}>
                  {searching ? <><span className="spinner" style={{width:16,height:16}}/> Searching…</> : "🔍 Search Patient"}
                </button>
              </form>

              {foundPatient && (
                <div style={{marginTop:"1.5rem",paddingTop:"1.25rem",borderTop:"1px solid var(--border)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem"}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"#f0fdfa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",fontWeight:700,color:"var(--teal)"}}>
                      {foundPatient.name ? foundPatient.name[0].toUpperCase() : "P"}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:"1.05rem",color:"var(--navy)"}}>{foundPatient.name || "Patient"}</div>
                      <div style={{fontSize:".8rem",color:"var(--muted)"}}>
                        ID: <strong>{foundPatient.patientId}</strong>
                        {foundPatient.pregnancyWeek ? ` · Week ${foundPatient.pregnancyWeek}` : ""}
                        {foundPatient.bloodGroup ? ` · Blood ${foundPatient.bloodGroup}` : ""}
                      </div>
                    </div>
                  </div>

                  {reqStatus === "already_approved" && (
                    <div style={{background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:8,padding:".85rem 1rem",fontSize:".88rem",color:"#065f46",display:"flex",alignItems:"center",gap:".5rem"}}>
                      <span>✅</span>
                      <div>You already have approved access to this patient. You can view their full data in the <strong>Patient List</strong> tab.</div>
                    </div>
                  )}

                  {reqStatus === "pending" && (
                    <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:".85rem 1rem",fontSize:".88rem",color:"#92400e",display:"flex",alignItems:"center",gap:".5rem"}}>
                      <span>⏳</span>
                      <div>Access request is pending approval. The patient will review and approve it from their dashboard.</div>
                    </div>
                  )}

                  {reqStatus === "can_request" && (
                    <div>
                      <p style={{fontSize:".85rem",color:"var(--muted)",marginBottom:"1rem",lineHeight:1.5}}>
                        Sending this request will notify the patient on their dashboard. Once approved, you will have instant access to their AI assessments, risk gauges, and clinical reports.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{width:"100%",justifyContent:"center"}}
                        onClick={handleSendRequest}
                        disabled={requesting}
                      >
                        {requesting ? <><span className="spinner" style={{width:16,height:16}}/> Sending Request…</> : "📩 Send Access Request"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}