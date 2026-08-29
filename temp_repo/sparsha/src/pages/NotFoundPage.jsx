import "./NotFoundPage.css";

export default function NotFoundPage({ navigate }) {
  return (
    <div className="nf-wrap">
      <div className="nf-inner">
        <div className="nf-logo">SPARSHA<span>.AI</span></div>
        <div className="nf-code">404</div>
        <h1 className="nf-title">Page not found</h1>
        <p className="nf-sub">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="nf-actions">
          <button className="btn btn-primary" onClick={() => navigate("landing")}>
            ← Back to Home
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("login")}>
            Log In
          </button>
        </div>
        {/* decorative blobs */}
        <div className="nf-blob nf-b1" />
        <div className="nf-blob nf-b2" />
      </div>
    </div>
  );
}