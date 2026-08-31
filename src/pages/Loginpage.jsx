import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import "./Loginpage.css";

const ROLES = [
  { id: "patient", label: "Patient" },
  { id: "doctor", label: "Doctor" },
  { id: "admin", label: "Admin" },
  { id: "family", label: "Family Member" },
];

export default function LoginPage({ navigate, onDemo }) {
  const { login, signUp, loginWithGoogle } = useAuth();

  const [role, setRole] = useState("patient");
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [patientIdInput, setPid] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const clearError = () => setError("");

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();

    if (!email.trim()) {
      return setError("Please enter your email.");
    }

    if (!password.trim()) {
      return setError("Please enter your password.");
    }

    if (mode === "signup" && !name.trim()) {
      return setError("Please enter your name.");
    }

    if (mode === "signup" && role === "family" && !patientIdInput.trim()) {
      return setError("Please enter the Patient ID of your family member.");
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        await signUp(
          email.trim(),
          password,
          name.trim(),
          role,
          patientIdInput.trim().toUpperCase()
        );
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(friendlyError(err.code, err.message));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    clearError();
    setBusy(true);

    try {
      await loginWithGoogle(role);
    } catch (err) {
      console.error("Google Auth error:", err);
      setError(friendlyError(err.code, err.message));
    } finally {
      setBusy(false);
    }
  }

  if (busy) {
    return <LoadingScreen message="Signing you in…" />;
  }

  return (
    <div className="login-page">

      {/* LEFT */}
      <div className="login-left">

        <button
          className="back-btn"
          onClick={() => navigate("landing")}
        >
          ← Back
        </button>

        <div
          className="nav-logo"
          style={{
            fontSize: "1.8rem",
            marginBottom: "2rem",
          }}
        >
          SPARSHA
          <span style={{ color: "var(--rose)" }}>. AI</span>
        </div>

        <h2 className="login-tagline">
          Smart Early Prediction of GDM &amp; Dysarthria
        </h2>

        <div className="login-features">
          {[
            "AI-powered GDM risk assessment",
            "Voice-based dysarthria screening",
            "Child neuro risk prediction",
            "Family member access with approval",
          ].map((feature, index) => (
            <div key={index} className="login-feature">
              <span className="lf-check">✓</span>
              {feature}
            </div>
          ))}
        </div>

        <div className="login-left-blob" />
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-box">

          <h2 className="login-title">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>

          <p className="login-sub">
            {mode === "login"
              ? "Log in to your SPARSHA.AI account"
              : "Get started with SPARSHA.AI"}
          </p>

          {/* ROLE SELECTOR */}
          <div className="role-selector role-grid-4">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`role-btn ${role === r.id ? "active" : ""}`}
                onClick={() => {
                  setRole(r.id);
                  clearError();
                }}
              >
                <span style={{ fontSize: ".75rem" }}>
                  {r.label}
                </span>
              </button>
            ))}
          </div>

          {/* ERROR */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* NAME */}
            {mode === "signup" && (
              <div className="form-group">
                <label>Full Name</label>

                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            {/* EMAIL */}
            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>

            {/* FAMILY MEMBER PATIENT ID */}
            {mode === "signup" && role === "family" && (
              <div className="form-group">

                <label>
                  Patient ID of your family member
                </label>

                <input
                  type="text"
                  placeholder="e.g. SP4K9MX2"
                  value={patientIdInput}
                  onChange={(e) =>
                    setPid(e.target.value.toUpperCase())
                  }
                  style={{
                    letterSpacing: ".1em",
                    fontWeight: 600,
                  }}
                  maxLength={8}
                />

                <span
                  style={{
                    fontSize: ".75rem",
                    color: "var(--muted)",
                  }}
                >
                  Ask your family member for their Patient ID
                  from their profile.
                </span>

              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: ".5rem",
              }}
            >
              {mode === "login"
                ? "Log In →"
                : "Create Account →"}
            </button>

          </form>

          {/* GOOGLE + DEMO */}
          {role !== "admin" && (
            <>
              <div className="login-divider">
                <span>or</span>
              </div>

              {/* GOOGLE LOGIN */}
              <button
                type="button"
                className="google-btn"
                onClick={handleGoogle}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                  />

                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                  />

                  <path
                    fill="#FBBC05"
                    d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  />

                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  />
                </svg>

                Continue with Google
              </button>

              <div className="login-divider">
                <span>or try without signing up</span>
              </div>

              {/* DEMO */}
              <button
                type="button"
                className="demo-btn"
                onClick={() => onDemo(role)}
              >
                Continue as Demo ·{" "}
                {ROLES.find((r) => r.id === role)?.label}
              </button>
            </>
          )}

          {/* LOGIN / SIGNUP SWITCH */}
          <p className="login-switch">

            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login"
                    ? "signup"
                    : "login"
                );

                clearError();
              }}
            >
              {mode === "login"
                ? "Sign Up"
                : "Log In"}
            </button>

          </p>

        </div>
      </div>
    </div>
  );
}

function friendlyError(code, rawMsg) {
  const map = {
    "auth/user-not-found":
      "No account found with this email. Please click 'Sign Up' below.",

    "auth/wrong-password":
      "Incorrect password. Please try again.",

    "auth/invalid-credential":
      "Incorrect email or password, or the account doesn't exist yet.",

    "auth/email-already-in-use":
      "An account with this email already exists. Please switch to 'Log In'.",

    "auth/weak-password":
      "Password must be at least 6 characters.",

    "auth/invalid-email":
      "Please enter a valid email address.",

    "auth/popup-closed-by-user":
      "Google sign-in popup was closed before completing.",

    "auth/popup-blocked":
      "Popup was blocked by your browser. Please allow popups for this site.",

    "auth/network-request-failed":
      "Network error. Please check your internet connection.",

    "auth/too-many-requests":
      "Too many unsuccessful attempts. Please wait a moment and try again.",

    "auth/unauthorized-domain":
      "This domain is being authorized with Firebase. You can also sign up with email and password.",
  };

  return (
    map[code] ||
    (rawMsg && typeof rawMsg === "string"
      ? rawMsg
      : `Authentication error (${code || "unknown"}).`)
  );
}
