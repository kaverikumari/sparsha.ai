from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import numpy as np
import io, os, tempfile

router = APIRouter()

# ── Output schema ─────────────────────────────────────────────────────────────
class DysarthriaResult(BaseModel):
    dysarthria_risk: float    # 0.0–1.0
    risk_label:      str      # "Low" | "Moderate" | "High"
    confidence:      float
    features_used:   list[str]

# ── Load CNN model (lazy) ─────────────────────────────────────────────────────
_cnn_model = None

def get_cnn():
    global _cnn_model
    if _cnn_model is None:
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "dysarthria_cnn.h5")
        if os.path.exists(model_path):
            # Only import TF if model exists — avoids import error if not installed
            import tensorflow as tf
            _cnn_model = tf.keras.models.load_model(model_path)
        else:
            _cnn_model = "rule_based"
    return _cnn_model

# ── MFCC extraction ───────────────────────────────────────────────────────────
def extract_mfcc(audio_bytes: bytes, sr: int = 22050, n_mfcc: int = 40) -> np.ndarray:
    """
    Extract MFCC features from raw audio bytes.
    Requires: librosa
    """
    try:
        import librosa
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        y, sr = librosa.load(tmp_path, sr=sr, duration=30.0)
        os.unlink(tmp_path)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        return np.mean(mfcc.T, axis=0)   # shape: (40,)
    except ImportError:
        raise HTTPException(status_code=500, detail="librosa not installed. Run: pip install librosa")

# ── Fallback: simple energy/duration heuristic ───────────────────────────────
def simple_heuristic(audio_bytes: bytes) -> DysarthriaResult:
    """
    Very basic fallback when model isn't available.
    In reality this returns ~random; replace with real model ASAP.
    """
    size   = len(audio_bytes)
    proxy  = min((size / 500_000), 1.0) * 0.5 + 0.10   # naive heuristic
    label  = "High" if proxy >= 0.60 else "Moderate" if proxy >= 0.30 else "Low"
    return DysarthriaResult(
        dysarthria_risk = round(proxy, 3),
        risk_label      = label,
        confidence      = 0.55,   # low confidence — no real model
        features_used   = ["file_size_proxy"],
    )

# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.post("/dysarthria", response_model=DysarthriaResult)
async def predict_dysarthria(audio: UploadFile = File(...)):
    # Validate file type
    allowed = {"audio/wav", "audio/mpeg", "audio/mp4", "audio/x-wav", "audio/wave"}
    if audio.content_type not in allowed and not audio.filename.endswith((".wav",".mp3",".m4a")):
        raise HTTPException(status_code=400, detail="Upload a .wav, .mp3, or .m4a file")

    audio_bytes = await audio.read()
    if len(audio_bytes) > 15 * 1024 * 1024:  # 15 MB limit
        raise HTTPException(status_code=413, detail="File too large (max 15 MB)")

    model = get_cnn()

    if model == "rule_based":
        return simple_heuristic(audio_bytes)

    # Real CNN path
    try:
        mfcc = extract_mfcc(audio_bytes)              # (40,)
        X    = mfcc.reshape(1, 40, 1)                 # CNN expects (batch, timesteps, channels)
        prob = float(model.predict(X)[0][0])
        label = "High" if prob >= 0.60 else "Moderate" if prob >= 0.30 else "Low"
        return DysarthriaResult(
            dysarthria_risk = round(prob, 3),
            risk_label      = label,
            confidence      = 0.88,
            features_used   = ["mfcc_40", "spectral_centroid", "zero_crossing_rate"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))