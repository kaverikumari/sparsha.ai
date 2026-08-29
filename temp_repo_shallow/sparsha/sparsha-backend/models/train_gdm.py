"""
Train GDM XGBoost model on PIMA Indians Diabetes Dataset.

Steps:
1. Download dataset:  https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database
   or: wget https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.csv

2. Run: python models/train_gdm.py
   This saves gdm_model.pkl in this folder.
   FastAPI auto-loads it on next start.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import joblib
import os

# ── Load dataset ──────────────────────────────────────────────────────────────
CSV_PATH = os.path.join(os.path.dirname(__file__), "pima-indians-diabetes.csv")

# PIMA columns (original dataset has no header)
COLS = ["pregnancies","glucose","blood_pressure","skin_thickness",
        "insulin","bmi","diabetes_pedigree","age","outcome"]

def load_data():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(
            f"Dataset not found at {CSV_PATH}\n"
            "Download from Kaggle: https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database"
        )
    df = pd.read_csv(CSV_PATH, names=COLS, header=0)
    # Replace 0s in medical cols with NaN, then fill median
    zero_invalid = ["glucose","blood_pressure","skin_thickness","insulin","bmi"]
    df[zero_invalid] = df[zero_invalid].replace(0, np.nan)
    df[zero_invalid] = df[zero_invalid].fillna(df[zero_invalid].median())
    return df

# ── Feature selection (must match API input order) ───────────────────────────
FEATURES = ["age","bmi","glucose","diabetes_pedigree","pregnancies"]

def train():
    df = load_data()
    X  = df[FEATURES]
    y  = df["outcome"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = xgb.XGBClassifier(
        n_estimators    = 200,
        max_depth       = 5,
        learning_rate   = 0.05,
        subsample       = 0.8,
        colsample_bytree= 0.8,
        use_label_encoder = False,
        eval_metric     = "logloss",
        random_state    = 42,
    )
    model.fit(X_train, y_train,
              eval_set=[(X_test, y_test)],
              verbose=False)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("── GDM Model Results ─────────────────")
    print(classification_report(y_test, y_pred))
    print(f"AUC-ROC: {roc_auc_score(y_test, y_prob):.4f}")
    print("──────────────────────────────────────")

    out_path = os.path.join(os.path.dirname(__file__), "gdm_model.pkl")
    joblib.dump(model, out_path)
    print(f"Model saved to {out_path}")

if __name__ == "__main__":
    train()