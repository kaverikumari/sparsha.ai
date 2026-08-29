import "./LoadingScreen.css";

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="ls-wrap">
      <div className="ls-inner">
        <div className="ls-logo">
          SPARSHA<span>.AI</span>
        </div>
        <div className="ls-spinner">
          <div className="ls-ring" />
          <div className="ls-pulse" />
        </div>
        <p className="ls-msg">{message}</p>
      </div>
    </div>
  );
}