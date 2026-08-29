import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { addKickEntry, getKickEntries } from "../services/db";
import "./KickCounter.css";

export default function KickCounter({ demo }) {
  const { user } = useAuth();
  const toast = useToast();

  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [count, setCount]       = useState(0);
  const [note, setNote]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [elapsed, setElapsed]   = useState(0);

  // load history
  useEffect(() => {
    if (demo || !user) { setLoading(false); return; }
    getKickEntries(user.uid)
      .then(setEntries)
      .catch(() => toast.error("Couldn't load kick history."))
      .finally(() => setLoading(false));
  }, [user, demo]);

  // live timer when session active
  useEffect(() => {
    if (!sessionStart) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [sessionStart]);

  function startSession() { setSessionStart(Date.now()); setCount(0); setElapsed(0); }
  function endSession()   { setSessionStart(null); }

  function recordKick() {
    if (!sessionStart) startSession();
    setCount(c => c + 1);
  }

  async function saveSession() {
    if (count === 0) return toast.warning("No kicks recorded yet.");
    setSaving(true);
    const entry = { count, note, recordedAt: new Date() };
    try {
      if (!demo && user) {
        const id = await addKickEntry(user.uid, entry);
        setEntries(prev => [{ id, ...entry, createdAt: new Date() }, ...prev]);
      }
      toast.success(`Session saved — ${count} kicks recorded!`);
      setCount(0); setNote(""); endSession();
    } catch (e) {
      toast.error("Couldn't save session.");
    } finally { setSaving(false); }
  }

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // warning logic: < 10 kicks in 2 hours is a yellow flag
  function kickWarning(count, durationSec) {
    if (durationSec < 1800) return null; // less than 30 min — too early
    if (count < 10) return "⚠️ Fewer than 10 kicks in this session. Consider contacting your doctor.";
    return null;
  }

  const warn = kickWarning(count, elapsed);

  return (
    <div className="dash-section">
      <h1 className="section-title">Kick Counter 👶</h1>
      <p className="section-sub" style={{marginBottom:"1.75rem"}}>
        Track your baby's movements. Doctors recommend counting at least 10 kicks in 2 hours daily after week 28.
      </p>

      <div className="kc-layout">
        {/* ── Active session card ── */}
        <div className="card kc-session">
          <div className="kc-count">{count}</div>
          <div className="kc-count-label">kicks this session</div>

          {sessionStart && (
            <div className="kc-timer">⏱ {fmt(elapsed)}</div>
          )}

          {warn && <div className="kc-warn">{warn}</div>}

          <button className="kc-kick-btn" onClick={recordKick}>
            👶 Record Kick
          </button>

          <div className="kc-actions">
            {!sessionStart ? (
              <button className="btn btn-secondary" onClick={startSession}>▶ Start Session</button>
            ) : (
              <button className="btn btn-secondary" onClick={endSession}>⏹ End Session</button>
            )}
            <button className="btn btn-primary" onClick={saveSession} disabled={saving || count === 0}>
              {saving ? "Saving…" : "💾 Save"}
            </button>
          </div>

          <div className="form-group" style={{marginTop:"1rem",width:"100%"}}>
            <label style={{fontSize:".8rem"}}>Note (optional)</label>
            <input type="text" placeholder="e.g. After lunch, baby very active"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        {/* ── History ── */}
        <div className="card kc-history">
          <h3 style={{marginBottom:"1rem"}}>📅 Session History</h3>
          {loading ? (
            <div style={{color:"var(--muted)",textAlign:"center",padding:"2rem"}}>Loading…</div>
          ) : entries.length === 0 ? (
            <div style={{color:"var(--muted)",textAlign:"center",padding:"2rem"}}>
              No sessions recorded yet. Start counting!
            </div>
          ) : (
            <div className="kc-entry-list">
              {entries.map((e, i) => {
                const ts = e.recordedAt?.toDate ? e.recordedAt.toDate()
                  : e.recordedAt instanceof Date ? e.recordedAt
                  : new Date(e.recordedAt);
                const date = isNaN(ts) ? "—" : ts.toLocaleDateString("en-IN", {day:"2-digit",month:"short"});
                const time = isNaN(ts) ? "—" : ts.toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit"});
                const status = e.count >= 10 ? "good" : e.count >= 6 ? "ok" : "low";
                return (
                  <div key={e.id||i} className={`kc-entry kc-${status}`}>
                    <div className="kce-left">
                      <div className="kce-count">{e.count}</div>
                      <div className="kce-label">kicks</div>
                    </div>
                    <div className="kce-right">
                      <div className="kce-date">{date} · {time}</div>
                      {e.note && <div className="kce-note">"{e.note}"</div>}
                      <span className={`risk-badge ${status==="good"?"risk-low":status==="ok"?"risk-medium":"risk-high"}`}>
                        {status==="good"?"Normal":status==="ok"?"Monitor":"Low — check with doctor"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* chart — simple bar visualization */}
      {entries.length > 1 && (
        <div className="card" style={{marginTop:"1.25rem"}}>
          <h3 style={{marginBottom:"1rem"}}>📊 Kick Trend (last 7 sessions)</h3>
          <div className="kc-chart">
            {entries.slice(0,7).reverse().map((e,i) => {
              const h = Math.min((e.count / 20) * 100, 100);
              const color = e.count >= 10 ? "var(--teal)" : e.count >= 6 ? "var(--amber)" : "var(--rose)";
              return (
                <div key={i} className="kc-bar-wrap">
                  <div className="kc-bar" style={{height:`${h}%`, background:color}} title={`${e.count} kicks`} />
                  <div className="kc-bar-val">{e.count}</div>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:".75rem",color:"var(--muted)",marginTop:".5rem",textAlign:"center"}}>
            🟢 ≥10 normal &nbsp; 🟡 6–9 monitor &nbsp; 🔴 &lt;6 contact doctor
          </div>
        </div>
      )}
    </div>
  );
}