import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getIncomingRequests,
  getApprovedAccessors,
  respondToRequest,
  revokeAccess
} from "../services/db";
import "./AccessRequests.css";

export default function AccessRequests({ demo }) {
  const { user, profile } = useAuth();
  const toast = useToast();

  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    if (demo) {
      setPending([
        {
          id: "demo-req-1",
          fromUid: "doc-101",
          fromName: "Dr. Ananya Sen",
          fromRole: "doctor"
        }
      ]);

      setApproved([
        {
          id: "fam-202",
          name: "Vikram Sharma (Spouse)",
          role: "family"
        }
      ]);

      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    Promise.all([
      getIncomingRequests(user.uid),
      getApprovedAccessors(user.uid)
    ])
      .then(([p, a]) => {
        setPending(p);
        setApproved(a);
      })
      .catch(() => toast.error("Couldn't load access requests."))
      .finally(() => setLoading(false));
  }, [user, demo]);

  async function handleRespond(req, approved) {
    if (demo) {
      setPending(prev => prev.filter(r => r.id !== req.id));

      if (approved) {
        setApproved(prev => [
          ...prev,
          {
            id: req.fromUid,
            name: req.fromName,
            role: req.fromRole
          }
        ]);

        toast.success(`Access granted to ${req.fromName}`);
      } else {
        toast.info(`Request from ${req.fromName} rejected.`);
      }

      return;
    }

    setResponding(req.id);

    try {
      await respondToRequest(
        req.id,
        approved,
        req.fromUid,
        user.uid,
        req.fromRole
      );

      setPending(prev => prev.filter(r => r.id !== req.id));

      if (approved) {
        setApproved(prev => [
          ...prev,
          {
            id: req.fromUid,
            name: req.fromName,
            role: req.fromRole
          }
        ]);

        toast.success(`Access granted to ${req.fromName}`);
      } else {
        toast.info(`Request from ${req.fromName} rejected.`);
      }
    } catch (e) {
      toast.error("Failed to process request.");
    } finally {
      setResponding(null);
    }
  }

  async function handleRevoke(accessor) {
    if (demo) {
      setApproved(prev => prev.filter(a => a.id !== accessor.id));
      toast.success(`Access revoked for ${accessor.name}`);
      return;
    }

    try {
      await revokeAccess(user.uid, accessor.id);

      setApproved(prev => prev.filter(a => a.id !== accessor.id));

      toast.success(`Access revoked for ${accessor.name}`);
    } catch (e) {
      toast.error("Failed to revoke access.");
    }
  }

  return (
    <div className="dash-section">
      <h1 className="section-title">Access Management</h1>

      <p className="section-sub" style={{ marginBottom: "1.75rem" }}>
        Control who can view your health data. Your Patient ID is&nbsp;
        <strong
          style={{
            fontFamily: "var(--font-d)",
            fontSize: "1.1rem",
            color: "var(--teal-d)",
            letterSpacing: ".1em"
          }}
        >
          {demo ? "SP-DEMO1" : profile?.patientId || "—"}
        </strong>
        .
        Share it with doctors or family members who want to request access.
      </p>

      {loading ? (
        <div className="empty-state">
          <div
            className="spinner"
            style={{ width: 28, height: 28 }}
          />
          <p>Loading…</p>
        </div>
      ) : (
        <div className="ar-layout">

          {/* Pending requests */}
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>
              Pending Requests

              {pending.length > 0 && (
                <span className="ar-badge">
                  {pending.length}
                </span>
              )}
            </h3>

            {pending.length === 0 ? (
              <div className="ar-empty">
                No pending requests right now.
              </div>
            ) : (
              pending.map(req => (
                <div key={req.id} className="ar-request-card">
                  <div className="ar-req-info">
                    <div className="ar-req-icon">
                      {req.fromRole === "doctor"
                        ? "D"
                        : req.fromRole === "family"
                        ? "F"
                        : "U"}
                    </div>

                    <div>
                      <div className="ar-req-name">
                        {req.fromName}
                      </div>

                      <div className="ar-req-role">
                        {req.fromRole === "doctor"
                          ? "Doctor"
                          : "Family Member"}{" "}
                        · wants to view your data
                      </div>
                    </div>
                  </div>

                  <div className="ar-req-actions">
                    <button
                      className="btn btn-primary"
                      style={{
                        padding: ".4rem 1rem",
                        fontSize: ".82rem"
                      }}
                      disabled={responding === req.id}
                      onClick={() => handleRespond(req, true)}
                    >
                      Approve
                    </button>

                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: ".4rem 1rem",
                        fontSize: ".82rem",
                        borderColor: "var(--rose)",
                        color: "var(--rose)"
                      }}
                      disabled={responding === req.id}
                      onClick={() => handleRespond(req, false)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Approved access */}
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>
              Approved Access
            </h3>

            {approved.length === 0 ? (
              <div className="ar-empty">
                No one has access to your data yet.
              </div>
            ) : (
              approved.map(acc => (
                <div key={acc.id} className="ar-request-card">
                  <div className="ar-req-info">
                    <div className="ar-req-icon">
                      {acc.role === "doctor"
                        ? "D"
                        : acc.role === "family"
                        ? "F"
                        : "U"}
                    </div>

                    <div>
                      <div className="ar-req-name">
                        {acc.name}
                      </div>

                      <div className="ar-req-role">
                        {acc.role === "doctor"
                          ? "Doctor"
                          : "Family Member"}{" "}
                        · can view your reports
                      </div>
                    </div>
                  </div>

                  <button
                    className="ar-revoke-btn"
                    onClick={() => handleRevoke(acc)}
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}
