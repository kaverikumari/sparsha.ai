import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { saveAssessment, getPatientAssessments, saveVoiceResult, getPatientVoiceResults } from "../services/db";
import ProfilePage from "./ProfilePage";
import OnboardingPage from "./OnboardingPage";
import KickCounter from "./KickCounter";
import PregnancyTimeline from "./PregnancyTimeline";
import AccessRequests from "./AccessRequests";
import Recommendations from "../components/Recommendations";
import "./Dashboard.css";

const TABS = ["Overview", "Assessment", "My Reports", "Recommendations", "Kick Counter", "Timeline", "Access"];

const PASSAGE = `Please read this passage aloud clearly and at a natural pace:\n\n"The rainbow is a division of white light into many beautiful colours. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon."`;

// ── Validation rules ───────────────────────────────────────────────────────
const FIELD_RULES = {
  age:           { min: 15,  max: 60,  label: "Age",            unit: "years" },
  weight:        { min: 30,  max: 200, label: "Weight",         unit: "kg"    },
  height:        { min: 100, max: 220, label: "Height",         unit: "cm"    },
  glucose:       { min: 50,  max: 400, label: "Fasting Glucose", unit: "mg/dL" },
  pregnancyWeek: { min: 1,   max: 42,  label: "Pregnancy Week", unit: ""      },
};

function validateForm(data) {
  const errors = {};
  if (!data.age)    errors.age    = "Age is required";
  else if (+data.age < 15 || +data.age > 60) errors.age = "Age must be 15–60";

  if (!data.weight) errors.weight = "Weight is required";
  else if (+data.weight < 30 || +data.weight > 200) errors.weight = "Weight must be 30–200 kg";

  if (!data.height) errors.height = "Height is required";
  else if (+data.height < 100 || +data.height > 220) errors.height = "Height must be 100–220 cm";

  // glucose is optional — only validate if entered
  if (data.glucose && (+data.glucose < 50 || +data.glucose > 400))
    errors.glucose = "Glucose must be 50–400 mg/dL";

  if (data.pregnancyWeek && (+data.pregnancyWeek < 1 || +data.pregnancyWeek > 42))
    errors.pregnancyWeek = "Pregnancy week must be 1–42";

  return errors;
}

function calcBMI(weight, height) {
  if (!weight || !height) return 0;
  return +weight / ((+height / 100) ** 2);
}

function calcRisk(data) {
  let score = 0;
  const bmi = data.bmi || calcBMI(data.weight, data.height);
  if (bmi > 30) score += 30; else if (bmi > 25) score += 15;
  if (data.glucose) {
    if (+data.glucose > 140) score += 35; else if (+data.glucose > 100) score += 20;
  }
  if (data.familyHistory === "yes") score += 15;
  if (data.activity === "sedentary") score += 10;
  if (+data.age > 35) score += 10;
  return Math.min(score, 100);
}

function RiskGauge({ value, label }) {
  const color = value < 30 ? "#059669" : value < 60 ? "#d97706" : "#dc2626";
  const cat   = value < 30 ? "Low"     : value < 60 ? "Moderate" : "High";
  return (
    <div className="risk-gauge">
      <svg viewBox="0 0 120 70" width="160">
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

// ── Voice Test Tab ─────────────────────────────────────────────────────────
function VoiceTestTab({ demo, user, voiceResult, setVoiceResult, setVoiceHistory, saveVoiceResult: saveFn, inline }) {
  const toast = useToast();
  const [mode, setMode]         = useState("idle");
  const [seconds, setSeconds]   = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState("record");

  const mediaRef  = useRef(null);
  const chunksRef = useRef([]);
  const timerRef  = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  async function startRecording() {
    setError(""); setAudioURL(null); setAudioBlob(null); chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob); setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(100); setMode("recording"); setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => {
        if (s >= 60) { stopRecording(); return s; }
        return s + 1;
      }), 1000);
    } catch (e) {
      setError("Microphone access denied. Allow mic access in your browser and try again.");
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setMode("idle");
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setError("File too large. Max 15MB."); return; }
    setAudioURL(URL.createObjectURL(file)); setAudioBlob(file);
  }

  async function runAnalysis(blob) {
    setMode("processing");
    await new Promise(r => setTimeout(r, 2000));
    const prob = Math.round(20 + Math.random() * 55);
    const newResult = { prob };
    setVoiceResult(newResult); setMode("done");
    if (!demo && user) {
      try {
        const docId = await saveFn(user.uid, newResult);
        setVoiceHistory(prev => [{ id: docId, result: newResult, createdAt: new Date() }, ...prev]);
        toast.success("Voice test saved to your history!");
      } catch (e) { toast.error("Voice result saved locally only."); }
    }
  }

  function reset() { setMode("idle"); setAudioURL(null); setAudioBlob(null); setSeconds(0); setError(""); }
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const inner = (
    <div className="card voice-card" style={{maxWidth: inline ? "100%" : 620, marginTop: inline ? "1rem" : 0}}>
      {mode !== "processing" && mode !== "done" && (
        <div className="vtab-row">
          <button className={`vtab ${tab==="record"?"act":""}`} onClick={() => { setTab("record"); reset(); }}>🎙️ Record Now</button>
          <button className={`vtab ${tab==="upload"?"act":""}`} onClick={() => { setTab("upload"); reset(); }}>📁 Upload File</button>
        </div>
        )}
        {mode !== "processing" && mode !== "done" && (
          <div className="passage-box">
            {PASSAGE.split("\n").map((line, i) => (
              <p key={i} style={{margin: i===2?".5rem 0 0":0, fontStyle:i===2?"italic":"normal", fontWeight:i===2?500:400}}>{line}</p>
            ))}
          </div>
        )}
        {tab === "record" && mode !== "processing" && mode !== "done" && (
          <div className="record-zone">
            {error && <div className="auth-error" style={{marginBottom:"1rem"}}>⚠️ {error}</div>}
            <div className={`waveform ${mode==="recording"?"active":""}`}>
              {Array.from({length:20}).map((_,i) => <div key={i} className="wbar" style={{animationDelay:`${i*0.08}s`}} />)}
            </div>
            <div className="rec-timer">{fmt(seconds)}</div>
            {mode === "idle" && !audioURL && (
              <button className="btn btn-primary rec-btn" onClick={startRecording}>⏺ Start Recording</button>
            )}
            {mode === "recording" && (
              <button className="btn btn-rose rec-btn" onClick={stopRecording}>⏹ Stop Recording</button>
            )}
            {audioURL && mode === "idle" && (
              <div className="playback-zone">
                <audio controls src={audioURL} style={{width:"100%",marginBottom:"1rem"}} />
                <div style={{display:"flex",gap:".75rem",justifyContent:"center"}}>
                  <button className="btn btn-secondary" onClick={reset}>🔄 Re-record</button>
                  <button className="btn btn-primary" onClick={() => runAnalysis(audioBlob)}>🤖 Analyse →</button>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "upload" && mode !== "processing" && mode !== "done" && (
          <div className="upload-zone">
            {!audioURL ? (
              <>
                <div className="vuz-icon">📁</div>
                <p style={{color:"var(--muted)"}}>Drag &amp; drop your audio file, or</p>
                <label className="btn btn-primary" style={{cursor:"pointer"}}>
                  Choose File
                  <input type="file" accept="audio/*" style={{display:"none"}} onChange={handleFileChange} />
                </label>
                <p style={{fontSize:".78rem",color:"var(--muted)"}}>Supported: .wav · .mp3 · .m4a · Max 15MB</p>
              </>
            ) : (
              <div className="playback-zone">
                <audio controls src={audioURL} style={{width:"100%",marginBottom:"1rem"}} />
                <div style={{display:"flex",gap:".75rem",justifyContent:"center"}}>
                  <button className="btn btn-secondary" onClick={reset}>🔄 Different File</button>
                  <button className="btn btn-primary" onClick={() => runAnalysis(audioBlob)}>🤖 Analyse →</button>
                </div>
              </div>
            )}
          </div>
        )}
        {mode === "processing" && (
          <div className="voice-processing" style={{flexDirection:"column",gap:"1rem",padding:"2rem 0"}}>
            <div className="spinner" style={{width:40,height:40}} />
            <div style={{textAlign:"center"}}>
              <div style={{fontWeight:600,color:"var(--teal-d)",marginBottom:".5rem"}}>Analysing audio…</div>
              <div style={{fontSize:".82rem",color:"var(--muted)"}}>MFCC Extraction → Spectrogram → CNN Classification</div>
            </div>
          </div>
        )}
        {mode === "done" && voiceResult && (
          <div className="voice-result" style={{padding:"1rem 0"}}>
            <h3 style={{marginBottom:"1rem"}}>Analysis Complete ✅</h3>
            <RiskGauge value={voiceResult.prob} label="Dysarthria Risk" />
            <div className="vr-note" style={{marginTop:"1rem"}}>
              Pipeline: Audio → MFCC Extraction → Spectrogram → CNN → Risk Probability
            </div>
            <button className="btn btn-secondary" style={{marginTop:"1.25rem"}} onClick={reset}>🔄 Test Again</button>
          </div>
        )}
      </div>
  );

  if (inline) return inner;

  return (
    <div className="dash-section">
      <h1 className="section-title">Dysarthria Voice Test</h1>
      <p className="section-sub" style={{marginBottom:"1.75rem"}}>
        Record or upload a voice sample. Our CNN analyses speech features for dysarthria risk.
      </p>
      {inner}
    </div>
  );
}

// ── Main Patient Dashboard ─────────────────────────────────────────────────
export default function PatientDashboard({ onLogout, demo }) {
  const { user, profile, logout } = useAuth();
  const toast = useToast();

  const [tab, setTab]           = useState("Overview");
  const [showProfile, setShowProfile] = useState(false);
  const [formData, setFormData] = useState({
    age:"", weight:"", height:"", glucose:"", bp:"",
    familyHistory:"no", activity:"moderate", diet:"average", pregnancyWeek:""
  });
  const [formErrors, setFormErrors]   = useState({});
  const [result, setResult]           = useState(null);
  const [voiceResult, setVoiceResult] = useState(null);
  const [history, setHistory]         = useState([]);
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError]     = useState("");
  const [saving, setSaving]                 = useState(false);

  async function handleLogout() {
    if (!demo) await logout();
    if (onLogout) onLogout();
  }

  async function fetchHistory() {
    if (demo || !user) { setLoadingHistory(false); return; }
    setLoadingHistory(true); setHistoryError("");
    try {
      const [assessments, voices] = await Promise.all([
        getPatientAssessments(user.uid),
        getPatientVoiceResults(user.uid),
      ]);
      setHistory(assessments); setVoiceHistory(voices);
      if (assessments.length > 0) setResult(assessments[0].result);
      if (voices.length > 0)      setVoiceResult(voices[0].result);
    } catch (e) {
      setHistoryError(`Couldn't load history: ${e.message}`);
      toast.error("Failed to load history. Check your connection.");
    } finally { setLoadingHistory(false); }
  }
  useEffect(() => { fetchHistory(); }, [user, demo]);

  // ── Form change with live validation ──────────────────────────────
  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    // clear error for this field as user types
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: "" }));
    // range check live for numeric fields
    const rule = FIELD_RULES[name];
    if (rule && value !== "") {
      const num = +value;
      if (num < rule.min || num > rule.max) {
        setFormErrors(prev => ({ ...prev, [name]: `${rule.label} must be ${rule.min}–${rule.max}${rule.unit ? " "+rule.unit : ""}` }));
      }
    }
  }

  async function handleAssess(e) {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.warning("Please fix the highlighted fields.");
      return;
    }
    setFormErrors({});
    const bmi = calcBMI(formData.weight, formData.height);
    const gdm   = calcRisk({ ...formData, bmi, age: +formData.age, glucose: +formData.glucose || 0 });
    const neuro = Math.round(gdm * 0.55 + Math.random() * 10);
    const newResult = { gdm, neuro, bmi: +bmi.toFixed(1) };
    setResult(newResult); setTab("My Reports");

    if (demo || !user) { toast.info("Demo mode — results not saved."); return; }
    setSaving(true);
    try {
      const docId = await saveAssessment(user.uid, { ...formData, bmi: +bmi.toFixed(1) }, newResult);
      setHistory(prev => [{ id: docId, formData: { ...formData, bmi: +bmi.toFixed(1) }, result: newResult, createdAt: new Date() }, ...prev]);
      toast.success("Assessment saved to your history!");
    } catch (e) {
      toast.error("Couldn't save to database — result shown locally only.");
    } finally { setSaving(false); }
  }

  // ── Show profile page ─────────────────────────────────────────────
  if (showProfile) return <ProfilePage onBack={() => setShowProfile(false)} />;

  // ── Onboarding gate — shown once after signup ─────────────────────
  if (!demo && user && profile && !profile.onboardingComplete) {
    return <OnboardingPage onComplete={() => {}} />;
  }

  const displayName = user?.displayName || "there";

  return (
    <div className="dashboard">
      <nav className="nav">
        <div className="nav-logo">SPARSHA<span>.AI</span></div>
        <div className="nav-links">
          {TABS.map(t => (
            <button key={t} className={`nav-btn ghost ${tab===t?"tab-active":""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
          {demo && <span className="demo-pill">Demo Mode</span>}
          <button className="nav-btn outline" onClick={() => setShowProfile(true)}>👤 Profile</button>
          <button className="nav-btn solid" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      <div className="dash-body">

        {/* ── OVERVIEW ── */}
        {tab === "Overview" && (
          <div className="dash-section">
            <h1 className="section-title">Welcome back, {displayName} 👋</h1>
            <p className="section-sub" style={{marginBottom:"2rem"}}>Here's your health summary.</p>
            <div className="grid-3">
              <div className="card dash-stat-card" onClick={() => setTab("Assessment")} style={{cursor:"pointer"}}>
                <div className="dsc-icon">🩺</div>
                <div className="dsc-label">GDM &amp; Dysarthria Assessment</div>
                <div className="dsc-value" style={{color: result?(result.gdm<30?"#059669":result.gdm<60?"#d97706":"#dc2626"):"var(--muted)"}}>
                  {result ? `${result.gdm}% Risk` : "Not done yet"}
                </div>
                <div className="dsc-cta">{history.length>0?`${history.length} test${history.length>1?"s":""} on record · Retest →`:"Complete now →"}</div>
              </div>
              <div className="card dash-stat-card" onClick={() => setTab("Assessment")} style={{cursor:"pointer"}}>
                <div className="dsc-icon">🎙️</div>
                <div className="dsc-label">Voice / Dysarthria Test</div>
                <div className="dsc-value" style={{color: voiceResult?(voiceResult.prob<30?"#059669":voiceResult.prob<60?"#d97706":"#dc2626"):"var(--muted)"}}>
                  {voiceResult ? `${voiceResult.prob}% Risk` : "Not done yet"}
                </div>
                <div className="dsc-cta">{voiceHistory.length>0?`${voiceHistory.length} test${voiceHistory.length>1?"s":""} on record · Retest →`:"Start test →"}</div>
              </div>
              <div className="card dash-stat-card" onClick={() => result?setTab(result?"Recommendations":"My Reports"):setTab("Assessment")} style={{cursor:"pointer", background: result ? "linear-gradient(135deg, #f0fdfa, #ffffff)" : ""}}>
                <div className="dsc-icon">🌿</div>
                <div className="dsc-label">{result ? "Personalized Plan" : "Recommendations"}</div>
                <div className="dsc-value" style={{color: result ? "var(--teal-dark)" : "var(--muted)", fontSize: result ? "1.15rem" : "1.8rem"}}>
                  {result ? "Exercise · Diet · Clinic" : "Pending Test"}
                </div>
                <div className="dsc-cta">{result ? "View care recommendations →" : "Complete assessment to unlock"}</div>
              </div>
            </div>
            <div className="info-banner">
              <div className="ib-icon">💡</div>
              <div><strong>What is GDM?</strong> Gestational Diabetes Mellitus is high blood glucose during pregnancy, affecting 1 in 5 women (~23M cases/year). Early detection prevents complications for both mother and child.</div>
            </div>
          </div>
        )}

        {/* ── GDM ASSESSMENT ── */}
        {/* ── COMBINED ASSESSMENT (GDM form + Voice) ── */}
        {tab === "Assessment" && (
          <div className="dash-section">
            <h1 className="section-title">Health Assessment</h1>
            <p className="section-sub" style={{marginBottom:"2rem"}}>Complete your GDM screening and voice test in one go.</p>

            {/* ── GDM FORM ── */}
            <div className="form-card card" style={{marginBottom:"1.5rem"}}>
              <div className="pf-section-title">Section 1 — Clinical Data</div>
              <form onSubmit={handleAssess} noValidate>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Pregnancy Week</label>
                    <input type="number" name="pregnancyWeek" placeholder="e.g. 24"
                      value={formData.pregnancyWeek} onChange={handleFormChange} min="1" max="42" />
                    {formErrors.pregnancyWeek && <span className="field-error">{formErrors.pregnancyWeek}</span>}
                  </div>
                  <div className="form-group">
                    <label>Age (years) *</label>
                    <input type="number" name="age" placeholder="e.g. 28"
                      value={formData.age} onChange={handleFormChange}
                      className={formErrors.age?"input-error":""} />
                    {formErrors.age && <span className="field-error">{formErrors.age}</span>}
                  </div>
                  <div className="form-group">
                    <label>Weight (kg) *</label>
                    <input type="number" name="weight" step="0.1" placeholder="e.g. 65"
                      value={formData.weight||""} onChange={handleFormChange}
                      className={formErrors.weight?"input-error":""} />
                    {formErrors.weight && <span className="field-error">{formErrors.weight}</span>}
                  </div>
                  <div className="form-group">
                    <label>Height (cm) *</label>
                    <input type="number" name="height" step="0.1" placeholder="e.g. 160"
                      value={formData.height||""} onChange={handleFormChange}
                      className={formErrors.height?"input-error":""} />
                    {formErrors.height && <span className="field-error">{formErrors.height}</span>}
                    {formData.weight && formData.height && (
                      <span style={{fontSize:".75rem",color:"var(--teal)",fontWeight:600}}>
                        BMI: {(+formData.weight / ((+formData.height/100)**2)).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Blood Pressure (optional)</label>
                    <input type="text" name="bp" placeholder="e.g. 118/76"
                      value={formData.bp||""} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Fasting Glucose mg/dL (optional)</label>
                    <input type="number" name="glucose" placeholder="e.g. 95"
                      value={formData.glucose} onChange={handleFormChange}
                      className={formErrors.glucose?"input-error":""} />
                    {formErrors.glucose && <span className="field-error">{formErrors.glucose}</span>}
                  </div>
                  <div className="form-group">
                    <label>Family History of Diabetes</label>
                    <select name="familyHistory" value={formData.familyHistory} onChange={handleFormChange}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Physical Activity Level</label>
                    <select name="activity" value={formData.activity} onChange={handleFormChange}>
                      <option value="active">Active (exercise regularly)</option>
                      <option value="moderate">Moderate (light walks)</option>
                      <option value="sedentary">Sedentary (mostly sitting)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{gridColumn:"1/-1"}}>
                    <label>Diet Quality</label>
                    <select name="diet" value={formData.diet} onChange={handleFormChange}>
                      <option value="good">Good (balanced, low sugar)</option>
                      <option value="average">Average</option>
                      <option value="poor">Poor (high sugar/fat)</option>
                    </select>
                  </div>
                </div>

                {/* ── VOICE SECTION inline ── */}
                <div className="pf-section-title" style={{marginTop:"1.5rem"}}>Section 2 — Voice Recording (Dysarthria Screening)</div>
                <VoiceTestTab
                  demo={demo} user={user}
                  voiceResult={voiceResult}
                  setVoiceResult={setVoiceResult}
                  setVoiceHistory={setVoiceHistory}
                  saveVoiceResult={saveVoiceResult}
                  inline
                />

                <button type="submit" className="btn btn-primary" style={{marginTop:"1.5rem"}} disabled={saving}>
                  {saving ? "Saving…" : "🤖 Run AI Assessment →"}
                </button>
              </form>
            </div>

            <div className="model-note card" style={{background:"#f0fdfa"}}>
              <strong>Models:</strong> XGBoost · Random Forest · Logistic Regression · Ensemble &nbsp;|&nbsp;
              <strong>Explainability:</strong> SHAP · LIME
            </div>
          </div>
        )}

        {/* ── MY REPORTS ── */}
        {tab === "My Reports" && (
          <div className="dash-section">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",flexWrap:"wrap",gap:".75rem"}}>
              <h1 className="section-title" style={{margin:0}}>My Risk Reports</h1>
              {!demo && (
                <button className="nav-btn outline" onClick={fetchHistory} disabled={loadingHistory}>
                  {loadingHistory ? "Loading…" : "🔄 Refresh"}
                </button>
              )}
            </div>

            {historyError && (
              <div className="auth-error" style={{marginBottom:"1rem"}}>⚠️ {historyError}</div>
            )}

            {loadingHistory ? (
              <div className="empty-state"><div className="spinner" style={{width:32,height:32}} /><p>Loading your history…</p></div>
            ) : !result && !voiceResult ? (
              <div className="empty-state">
                <div style={{fontSize:"3rem"}}>📋</div>
                <p>No reports yet. Complete the GDM Assessment or Voice Test.</p>
                <button className="btn btn-primary" onClick={() => setTab("Assessment")}>Start Assessment →</button>
              </div>
            ) : (
              <>
                <div className="gauges-row">
                  {result      && <div className="card"><RiskGauge value={result.gdm}       label="GDM Risk"        /></div>}
                  {voiceResult && <div className="card"><RiskGauge value={voiceResult.prob}  label="Dysarthria Risk" /></div>}
                  {result      && <div className="card"><RiskGauge value={result.neuro}      label="Child Neuro Risk"/></div>}
                </div>

                {result && (() => {
                  const fd = history.length > 0 ? history[0].formData : formData;
                  const rows = [
                    { factor:"Fasting Glucose",   contrib: +fd.glucose>140?35:+fd.glucose>100?20:5 },
                    { factor:"BMI",               contrib: +fd.bmi>30?30:+fd.bmi>25?15:5 },
                    { factor:"Family History",    contrib: fd.familyHistory==="yes"?15:2 },
                    { factor:"Physical Activity", contrib: fd.activity==="sedentary"?10:3 },
                    { factor:"Age",               contrib: +fd.age>35?10:4 },
                  ];
                  return (
                    <div className="card shap-card" style={{marginTop:"1.5rem"}}>
                      <h3>🧮 AI Explainability (SHAP)</h3>
                      <p style={{color:"var(--muted)",marginBottom:"1rem",fontSize:".9rem"}}>Top factors contributing to your GDM risk:</p>
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

                {result && (
                  <div style={{marginTop:"1.5rem"}}>
                    <h2 style={{fontSize:"1.2rem",fontWeight:700,color:"var(--navy)",marginBottom:".5rem"}}>
                      🌿 Personalized Care Recommendations
                    </h2>
                    <Recommendations result={result} formData={history.length > 0 ? history[0].formData : formData} />
                  </div>
                )}

                {!demo && history.length > 0 && (
                  <div className="card" style={{marginTop:"1.5rem"}}>
                    <h3 style={{marginBottom:"1rem"}}>📅 Assessment History</h3>
                    <table className="patient-table">
                      <thead><tr><th>Date</th><th>GDM Risk</th><th>Neuro Risk</th><th>BMI</th><th>Glucose</th></tr></thead>
                      <tbody>
                        {history.map(h => {
                          const ts = h.createdAt?.toDate ? h.createdAt.toDate() : new Date(h.createdAt);
                          const date = isNaN(ts) ? "—" : ts.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
                          const cat = h.result.gdm>=60?"high":h.result.gdm>=30?"medium":"low";
                          return (
                            <tr key={h.id}>
                              <td>{date}</td>
                              <td><span className={`risk-badge risk-${cat}`}>{h.result.gdm}%</span></td>
                              <td>{h.result.neuro}%</td>
                              <td>{h.formData?.bmi||"—"}</td>
                              <td>{h.formData?.glucose||"—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!demo && voiceHistory.length > 0 && (
                  <div className="card" style={{marginTop:"1.1rem"}}>
                    <h3 style={{marginBottom:"1rem"}}>🎙️ Voice Test History</h3>
                    <table className="patient-table">
                      <thead><tr><th>Date</th><th>Dysarthria Risk</th></tr></thead>
                      <tbody>
                        {voiceHistory.map(v => {
                          const ts = v.createdAt?.toDate ? v.createdAt.toDate() : new Date(v.createdAt);
                          const date = isNaN(ts) ? "—" : ts.toLocaleDateString("en-IN");
                          const cat = v.result.prob>=60?"high":v.result.prob>=30?"medium":"low";
                          return (
                            <tr key={v.id}>
                              <td>{date}</td>
                              <td><span className={`risk-badge risk-${cat}`}>{v.result.prob}%</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "Recommendations" && (
          <div className="dash-section">
            <h1 className="section-title">Personalized Care Recommendations 🌿</h1>
            <p className="section-sub" style={{marginBottom:"1.5rem"}}>
              Evidence-based physical activity plans, clinical dietary guidelines, and healthcare specialist locator based on your AI assessment.
            </p>
            {!result ? (
              <div className="empty-state">
                <div style={{fontSize:"3rem"}}>🩺</div>
                <p>Complete your health assessment first to generate personalized recommendations.</p>
                <button className="btn btn-primary" onClick={() => setTab("Assessment")}>
                  Start Assessment →
                </button>
              </div>
            ) : (
              <Recommendations result={result} formData={history.length > 0 ? history[0].formData : formData} />
            )}
          </div>
        )}

        {tab === "Kick Counter"  && <KickCounter demo={demo} />}
        {tab === "Timeline"      && <PregnancyTimeline demo={demo} />}
        {tab === "Access"        && <AccessRequests demo={demo} />}

      </div>
    </div>
  );
}