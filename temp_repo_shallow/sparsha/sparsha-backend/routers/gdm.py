from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import os, joblib

router = APIRouter()

# ── Input schema ──────────────────────────────────────────────────────────────
class GDMInput(BaseModel):
    age:             float = Field(..., ge=10, le=60,  description="Age in years")
    bmi:             float = Field(..., ge=10, le=60,  description="Body Mass Index")
    glucose:         float = Field(..., ge=50, le=400, description="Fasting glucose mg/dL")
    family_history:  int   = Field(..., ge=0,  le=1,   description="1=yes, 0=no")
    activity:        str   = Field(..., description="active | moderate | sedentary")
    diet:            str   = Field(..., description="good | average | poor")
    pregnancy_week:  float = Field(0,   ge=0,  le=42)

# ── Output schema ─────────────────────────────────────────────────────────────
class GDMResult(BaseModel):
    gdm_risk:    float          # 0.0–1.0
    neuro_risk:  float          # 0.0–1.0
    risk_label:  str            # "Low" | "Moderate" | "High"
    shap_values: dict[str, float]
    confidence:  float

# ── Load model (lazy, on first request) ──────────────────────────────────────
_model = None

def get_model():
    global _model
    if _model is None:
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "gdm_model.pkl")
        if os.path.exists(model_path):
            _model = joblib.load(model_path)
        else:
            # Fallback: rule-based until real model is trained
            _model = "rule_based"
    return _model

# ── Feature engineering ───────────────────────────────────────────────────────
ACTIVITY_MAP = {"active": 0, "moderate": 1, "sedentary": 2}
DIET_MAP     = {"good": 0, "average": 1, "poor": 2}

def build_features(inp: GDMInput) -> np.ndarray:
    return np.array([[
        inp.age,
        inp.bmi,
        inp.glucose,
        inp.family_history,
        ACTIVITY_MAP.get(inp.activity, 1),
        DIET_MAP.get(inp.diet, 1),
        inp.pregnancy_week,
    ]])

# ── Rule-based fallback (until you train the real model) ─────────────────────
def rule_based_predict(inp: GDMInput) -> dict:
    score = 0.0
    shap  = {}

    glucose_contrib = 0.35 if inp.glucose > 140 else 0.20 if inp.glucose > 100 else 0.05
    shap["glucose"] = round(glucose_contrib, 3)
    score += glucose_contrib

    bmi_contrib = 0.30 if inp.bmi > 30 else 0.15 if inp.bmi > 25 else 0.05
    shap["bmi"] = round(bmi_contrib, 3)
    score += bmi_contrib

    fh_contrib = 0.15 if inp.family_history else 0.02
    shap["family_history"] = round(fh_contrib, 3)
    score += fh_contrib

    act_contrib = {"sedentary": 0.10, "moderate": 0.04, "active": 0.01}[inp.activity]
    shap["activity"] = round(act_contrib, 3)
    score += act_contrib

    age_contrib = 0.10 if inp.age > 35 else 0.04
    shap["age"] = round(age_contrib, 3)
    score += age_contrib

    gdm_risk   = min(round(score, 3), 1.0)
    neuro_risk = min(round(gdm_risk * 0.55 + 0.05, 3), 1.0)
    label      = "High" if gdm_risk >= 0.60 else "Moderate" if gdm_risk >= 0.30 else "Low"

    return {"gdm_risk": gdm_risk, "neuro_risk": neuro_risk, "risk_label": label,
            "shap_values": shap, "confidence": 0.78}

# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.post("/gdm", response_model=GDMResult)
def predict_gdm(inp: GDMInput):
    model = get_model()
    try:
        if model == "rule_based":
            return rule_based_predict(inp)

        # Real XGBoost path
        X   = build_features(inp)
        prob = float(model.predict_proba(X)[0][1])
        neuro = min(prob * 0.55 + 0.05, 1.0)
        label = "High" if prob >= 0.60 else "Moderate" if prob >= 0.30 else "Low"

        # Approximate SHAP (replace with real shap library if installed)
        shap_vals = {
            "glucose":        round(inp.glucose / 400 * 0.40, 3),
            "bmi":            round(inp.bmi / 60 * 0.30, 3),
            "family_history": round(inp.family_history * 0.15, 3),
            "activity":       round(ACTIVITY_MAP.get(inp.activity, 1) / 2 * 0.10, 3),
            "age":            round(min(inp.age / 60, 1) * 0.10, 3),
        }
        return GDMResult(gdm_risk=round(prob, 3), neuro_risk=round(neuro, 3),
                         risk_label=label, shap_values=shap_vals, confidence=0.91)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))