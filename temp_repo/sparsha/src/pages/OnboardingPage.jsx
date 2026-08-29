import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../services/db";
import { useToast } from "../context/ToastContext";
import "./OnboardingPage.css";

const STEPS = ["Welcome", "Basic Info", "Health Background", "Done"];

export default function OnboardingPage({ onComplete }) {
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    // step 1 — basic info
    age: "", state: "", city: "", pin: "",
    workingLady: "", familyDiabetes: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleFinish() {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        ...form,
        onboardingComplete: true,
      });
      await refreshProfile(user.uid);
      toast.success("Profile saved! Welcome to SPARSHA.AI 🎉");
      onComplete();
    } catch (e) {
      toast.error("Couldn't save profile. Try again.");
    } finally { setSaving(false); }
  }

  return (
    <div className="ob-wrap">
      {/* progress bar */}
      <div className="ob-progress">
        {STEPS.map((s, i) => (
          <div key={i} className={`ob-step ${i <= step ? "done" : ""}`}>
            <div className="ob-dot">{i < step ? "✓" : i + 1}</div>
            <div className="ob-step-label">{s}</div>
          </div>
        ))}
      </div>

      <div className="ob-card">

        {/* STEP 0 — Welcome */}
        {step === 0 && (
          <div className="ob-content">
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>👋</div>
            <h2 className="ob-title">Welcome to SPARSHA.AI</h2>
            <p className="ob-sub">
              Your unique Patient ID is:
            </p>
            <div className="patient-id-display">
              {profile?.patientId || "SP------"}
            </div>
            <p className="ob-sub" style={{fontSize:".85rem",color:"var(--muted)"}}>
              Share this ID with your doctor or family members so they can request access to your health data.
              You'll approve or reject each request.
            </p>
            <button className="btn btn-primary" style={{marginTop:"1.5rem"}} onClick={() => setStep(1)}>
              Set Up My Profile →
            </button>
          </div>
        )}

        {/* STEP 1 — Basic Info */}
        {step === 1 && (
          <div className="ob-content">
            <h2 className="ob-title">Tell us about yourself</h2>
            <p className="ob-sub">This helps personalise your experience. Address fields are optional.</p>

            <div className="form-group">
              <label>Your Age *</label>
              <input type="number" placeholder="e.g. 28" min="15" max="60"
                value={form.age} onChange={e => set("age", e.target.value)} />
            </div>

            <div className="ob-working-row">
              <label>Are you a working professional?</label>
              <div className="ob-radio-row">
                {["Yes", "No"].map(opt => (
                  <button key={opt} type="button"
                    className={`ob-radio-btn ${form.workingLady === opt ? "act" : ""}`}
                    onClick={() => set("workingLady", opt)}>{opt}</button>
                ))}
              </div>
            </div>

            <div className="ob-working-row" style={{marginTop:"1rem"}}>
              <label>Does anyone in your family have diabetes?</label>
              <div className="ob-radio-row">
                {["Yes", "No", "Not sure"].map(opt => (
                  <button key={opt} type="button"
                    className={`ob-radio-btn ${form.familyDiabetes === opt ? "act" : ""}`}
                    onClick={() => set("familyDiabetes", opt)}>{opt}</button>
                ))}
              </div>
            </div>

            <div className="ob-divider">Address (optional)</div>
            <div className="grid-2" style={{gap:".85rem"}}>
              <div className="form-group" style={{marginBottom:0}}>
                <label>State</label>
                <input type="text" placeholder="e.g. West Bengal"
                  value={form.state} onChange={e => set("state", e.target.value)} />
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label>City</label>
                <input type="text" placeholder="e.g. Kolkata"
                  value={form.city} onChange={e => set("city", e.target.value)} />
              </div>
              <div className="form-group" style={{marginBottom:0,gridColumn:"1/-1"}}>
                <label>PIN Code</label>
                <input type="text" placeholder="e.g. 700001" maxLength={6}
                  value={form.pin} onChange={e => set("pin", e.target.value)} />
              </div>
            </div>

            <div className="ob-nav">
              <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" onClick={() => {
                if (!form.age) return toast.warning("Please enter your age.");
                setStep(2);
              }}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 2 — Done / summary */}
        {step === 2 && (
          <div className="ob-content">
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>✅</div>
            <h2 className="ob-title">You're all set!</h2>
            <p className="ob-sub">Here's a summary of what you've entered:</p>

            <div className="ob-summary">
              <div className="ob-summary-row"><span>Patient ID</span><strong>{profile?.patientId}</strong></div>
              <div className="ob-summary-row"><span>Age</span><strong>{form.age || "—"} years</strong></div>
              <div className="ob-summary-row"><span>Working professional</span><strong>{form.workingLady || "—"}</strong></div>
              <div className="ob-summary-row"><span>Family diabetes history</span><strong>{form.familyDiabetes || "—"}</strong></div>
              {form.city && <div className="ob-summary-row"><span>Location</span><strong>{form.city}{form.state?`, ${form.state}`:""}</strong></div>}
            </div>

            <p className="ob-sub" style={{marginTop:"1rem",fontSize:".85rem"}}>
              You can update these anytime from your Profile page.
            </p>

            <div className="ob-nav">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Edit</button>
              <button className="btn btn-primary" onClick={handleFinish} disabled={saving}>
                {saving ? "Saving…" : "Go to Dashboard →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}