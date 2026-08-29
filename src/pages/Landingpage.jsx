import "./Landingpage.css";

const stats = [
  { value: "23M+", label: "GDM cases globally per year" },
  { value: "1 in 5", label: "Pregnant women affected" },
  { value: "5-8M", label: "GDM pregnancies in India/year" },
  { value: "Early", label: "Detection saves lives" },
];

const steps = [
  { icon: "", title: "Input Data", desc: "Enter maternal health data: age, BMI, glucose, lifestyle, and family history." },
  { icon: "", title: "Voice Sample", desc: "Record or upload a short voice sample for dysarthria screening." },
  { icon: "", title: "AI Analysis", desc: "Our ML/DL engine processes data in real-time using XGBoost, CNN & Ensemble models." },
  { icon: "", title: "Risk Report", desc: "Receive a clear risk score for GDM and child neuro risk with explainability (SHAP/LIME)." },
];

const team = [
  { name: "Rekharani Mahanta", role: "Team Leader", dept: "PhD Scholar, Mathematics", inst: "IIEST Shibpur", emoji: "👩‍🔬" },
  { name: "Subhoshri Pal", role: "Deputy Team Leader", dept: "B.Tech 4th Year, IT", inst: "IIEST Shibpur", emoji: "👩‍💻" },
  { name: "Avik Kumar Das", role: "Teammate", dept: "PhD Scholar, ETC", inst: "IIEST Shibpur", emoji: "👨‍🔬" },
];

export default function LandingPage({ navigate }) {
  return (
    <div className="landing">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">SPARSHA<span>.AI</span></div>
        <div className="nav-links">
          <button className="nav-btn ghost" onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })}>How it Works</button>
          <button className="nav-btn ghost" onClick={() => document.getElementById("team").scrollIntoView({ behavior: "smooth" })}>Team</button>
          <button className="nav-btn outline" onClick={() => navigate("login")}>Log In</button>
          <button className="nav-btn solid" onClick={() => navigate("login")}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-blobs">
          <div className="blob blob1" />
          <div className="blob blob2" />
          <div className="blob blob3" />
        </div>
        <div className="hero-content">
          <span className="section-tag">AI-Powered Maternal Healthcare</span>
          <h1 className="hero-title">
            From First Touch<br />
            <span className="hero-accent">to First Smile</span>
          </h1>
          <p className="hero-sub">
            SPARSHA.AI predicts Gestational Diabetes Mellitus and child Dysarthria risk early — 
            so every mother and child gets the care they deserve, before symptoms appear.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary" onClick={() => navigate("login")}>
              Start Your Assessment →
            </button>
            <button className="btn btn-secondary" onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })}>
              See How It Works
            </button>
          </div>
          <div className="hero-badges">
            <span className="badge">✓ GDM Prediction</span>
            <span className="badge">✓ Dysarthria Screening</span>
            <span className="badge">✓ Neuro Risk Score</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-float">
            <div className="float-card fc1">
              <div className="fc-icon"></div>
              <div>
                <div className="fc-label">GDM Risk Score</div>
                <div className="fc-value low">Low Risk: 18%</div>
              </div>
            </div>
            <div className="float-card fc2">
              <div className="fc-icon"></div>
              <div>
                <div className="fc-label">Dysarthria Detection</div>
                <div className="fc-value med">Moderate: 42%</div>
              </div>
            </div>
            <div className="float-card fc3">
              <div className="fc-icon"></div>
              <div>
                <div className="fc-label">Child Neuro Risk</div>
                <div className="fc-value low">Low: 12%</div>
              </div>
            </div>
            <div className="hero-orb" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-strip">
        {stats.map((s, i) => (
          <div className="stat-item" key={i}>
            <div className="stat-val">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how">
        <div className="section-header">
          <span className="section-tag">The Process</span>
          <h2 className="section-title">How SPARSHA.AI Works</h2>
          <p className="section-sub">Four simple steps: from your health data to a clear, actionable risk report.</p>
        </div>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-num">0{i + 1}</div>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCIENTIFIC CONNECTION */}
      <section className="science-section">
        <div className="science-inner">
          <div className="science-text">
            <span className="section-tag">Research Basis</span>
            <h2 className="section-title">Why GDM &amp; Dysarthria?</h2>
            <p className="section-sub" style={{marginTop:"0.75rem"}}>
              Gestational Diabetes creates maternal hyperglycemia, which induces fetal neural stress 
              and disrupts brain development, increasing the child's risk of motor coordination 
              impairment and speech disorders like Dysarthria.
            </p>
            <p className="section-sub" style={{marginTop:"0.5rem"}}>
              SPARSHA.AI is the first platform to link these two domains in a unified predictive system.
            </p>
          </div>
          <div className="science-chain">
            {["GDM", "Maternal Hyperglycemia", "Fetal Neural Stress", "Brain Development Disruption", "Motor Coordination Impairment", "Dysarthria Risk"].map((item, i, arr) => (
              <div key={i} className="chain-item">
                <div className="chain-node">{item}</div>
                {i < arr.length - 1 && <div className="chain-arrow">↓</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section className="section impact-section">
        <div className="section-header">
          <span className="section-tag">Impact</span>
          <h2 className="section-title">Why It Matters</h2>
        </div>
        <div className="grid-3">
          {[
            { icon: "", title: "For Mothers", points: ["Early GDM detection", "Personalized risk reports", "Preventive care guidance"] },
            { icon: "", title: "For Children", points: ["Neuro risk prediction", "Early speech disorder screening", "Better developmental outcomes"] },
            { icon: "", title: "For Doctors", points: ["AI-powered decision support", "Patient risk dashboard", "Explainable AI (SHAP/LIME)"] },
          ].map((item, i) => (
            <div className="card impact-card" key={i}>
              <div className="impact-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <ul>
                {item.points.map((p, j) => <li key={j}>✓ {p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="section" id="team">
        <div className="section-header">
          <span className="section-tag">The Team</span>
          <h2 className="section-title">Meet the Researchers</h2>
          <p className="section-sub">From IIEST Shibpur, bridging the gap in maternal healthcare with AI.</p>
        </div>
        <div className="team-grid">
          {team.map((m, i) => (
            <div className="card team-card" key={i}>
              {/* <div className="team-avatar">{m.emoji}</div> */}
              <h3>{m.name}</h3>
              <div className="team-role">{m.role}</div>
              <div className="team-dept">{m.dept}</div>
              <div className="team-inst">{m.inst}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="nav-logo">SPARSHA<span>.AI</span></div>
        <p>Predict • Prevent • Protect</p>
        <p style={{color:"var(--muted)", fontSize:"0.85rem"}}>subhoshripal@gmail.com · IIEST Shibpur, India</p>
      </footer>
    </div>
  );
}