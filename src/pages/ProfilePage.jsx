import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../firebase";
import "./ProfilePage.css";
import "./Dashboard.css";

export default function ProfilePage({ onBack }) {
  const { user, profile } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name:           profile?.name           || user?.displayName || "",
    pregnancyWeek:  profile?.pregnancyWeek  || "",
    age:            profile?.age            || "",
    bloodGroup:     profile?.bloodGroup     || "",
    city:           profile?.city           || "",
    state:          profile?.state          || "",
    doctor:         profile?.doctor         || "",
    hospital:       profile?.hospital       || "",
    emergencyContact: profile?.emergencyContact || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      // update Firestore profile doc
      await updateDoc(doc(db, "users", user.uid), {
        name:             form.name,
        pregnancyWeek:    form.pregnancyWeek,
        age:              form.age,
        bloodGroup:       form.bloodGroup,
        city:             form.city,
        state:            form.state,
        doctor:           form.doctor,
        hospital:         form.hospital,
        emergencyContact: form.emergencyContact,
      });
      // update Firebase Auth display name
      await updateProfile(user, { displayName: form.name });
      toast.success("Profile saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const initials = (form.name || "?")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="profile-wrap">
      {/* header */}
      <div className="profile-header">
        <button className="back-link" onClick={onBack}>← Back to Dashboard</button>
        <h1 className="section-title" style={{ marginTop: ".5rem" }}>My Profile</h1>
        <p className="section-sub">Your personal and pregnancy information.</p>
      </div>

      <div className="profile-body">
        {/* avatar card */}
        <div className="card avatar-card">
          <div className="avatar-circle">{initials}</div>
          <div className="avatar-name">{form.name || "Your Name"}</div>
          <div className="avatar-role">
            {profile?.role === "doctor" ? "👨‍⚕️ Doctor" : "🤱 Patient"}
          </div>
          <div className="avatar-email">{user?.email}</div>
          {!profile && (
            <div className="demo-pill" style={{ marginTop: ".75rem" }}>Demo Mode</div>
          )}
        </div>

        {/* form card */}
        <div className="card profile-form-card">
          <form onSubmit={handleSave} noValidate>

            <div className="pf-section-title">Personal Information</div>
            <div className="grid-2">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text" name="name"
                  value={form.name} onChange={handleChange}
                  placeholder="e.g. Priya Sharma"
                />
              </div>
              <div className="form-group">
                <label>Age (years)</label>
                <input
                  type="number" name="age"
                  value={form.age} onChange={handleChange}
                  placeholder="e.g. 28" min="15" max="60"
                />
              </div>
              <div className="form-group">
                <label>Blood Group</label>
                <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                  <option value="">Select…</option>
                  {["A+","A−","B+","B−","AB+","AB−","O+","O−"].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Emergency Contact (phone)</label>
                <input
                  type="tel" name="emergencyContact"
                  value={form.emergencyContact} onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text" name="city"
                  value={form.city} onChange={handleChange}
                  placeholder="e.g. Kolkata"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text" name="state"
                  value={form.state} onChange={handleChange}
                  placeholder="e.g. West Bengal"
                />
              </div>
            </div>

            {profile?.role !== "doctor" && (
              <>
                <div className="pf-section-title" style={{ marginTop: "1.5rem" }}>
                  Pregnancy Information
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Current Pregnancy Week</label>
                    <input
                      type="number" name="pregnancyWeek"
                      value={form.pregnancyWeek} onChange={handleChange}
                      placeholder="e.g. 24" min="1" max="42"
                    />
                  </div>
                  <div className="form-group">
                    <label>Assigned Doctor</label>
                    <input
                      type="text" name="doctor"
                      value={form.doctor} onChange={handleChange}
                      placeholder="e.g. Dr. Sharma"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hospital / Clinic</label>
                    <input
                      type="text" name="hospital"
                      value={form.hospital} onChange={handleChange}
                      placeholder="e.g. Apollo Hospital, Kolkata"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: "1.5rem" }}
              disabled={saving || !user}
            >
              {saving ? "Saving…" : "💾 Save Profile"}
            </button>
            {!user && (
              <p style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: ".5rem" }}>
                Profile saving is disabled in demo mode.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}