// Base URL — change to your deployed backend URL later
// Local dev: http://localhost:8000
// Deployed:  https://sparsha-api.onrender.com  (or wherever you deploy)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Predict GDM risk from form data.
 * Returns { gdm_risk: 0.72, neuro_risk: 0.40, shap_values: {...} }
 */
export async function predictGDM(formData) {
  const res = await fetch(`${BASE_URL}/predict/gdm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      age: Number(formData.age),
      bmi: Number(formData.bmi),
      glucose: Number(formData.glucose),
      family_history: formData.familyHistory === "yes" ? 1 : 0,
      activity: formData.activity,          // "active" | "moderate" | "sedentary"
      diet: formData.diet,                  // "good" | "average" | "poor"
      pregnancy_week: Number(formData.pregnancyWeek) || 0,
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Upload audio file for dysarthria prediction.
 * Returns { dysarthria_risk: 0.42, confidence: 0.87 }
 */
export async function predictDysarthria(audioFile) {
  const form = new FormData();
  form.append("audio", audioFile);
  const res = await fetch(`${BASE_URL}/predict/dysarthria`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Health check — used by frontend to show "Backend: connected" status.
 */
export async function pingBackend() {
  const res = await fetch(`${BASE_URL}/health`);
  return res.ok;
}