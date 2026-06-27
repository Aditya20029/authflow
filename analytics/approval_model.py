"""Approval-likelihood model for AuthFlow (scikit-learn).

Trains a gradient-boosted classifier to predict whether a prior authorization
will be approved, from request and chart features. The categorical vocabulary
(drug classes, payers) is read from the live SQLite database so the model speaks
the app's real domain; the approval label is generated from a realistic latent
function with noise, because the demo's recorded decisions are payer discretion
rather than feature driven, so they carry little learnable signal on their own.

Reports accuracy and ROC AUC, ranks features by permutation importance, writes a
metrics JSON, and saves matplotlib figures used in the README.

    python analytics/approval_model.py
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # headless / CI safe

import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from sklearn.compose import ColumnTransformer  # noqa: E402
from sklearn.ensemble import HistGradientBoostingClassifier  # noqa: E402
from sklearn.inspection import permutation_importance  # noqa: E402
from sklearn.metrics import (  # noqa: E402
    ConfusionMatrixDisplay,
    RocCurveDisplay,
    accuracy_score,
    classification_report,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split  # noqa: E402
from sklearn.pipeline import Pipeline  # noqa: E402
from sklearn.preprocessing import OneHotEncoder  # noqa: E402

from db import connect, load_requests  # noqa: E402

SEED = 20260627
N = 2400
BRAND = "#0D9488"

OUTPUT_DIR = Path(__file__).resolve().parent / "output"
FIG_DIR = Path(__file__).resolve().parent / "figures"

CATEGORICAL = ["drug_class", "payer", "priority"]
NUMERIC = ["prior_denials", "patient_age"]
BINARY = [
    "step_therapy_documented",
    "qualifying_dx_on_file",
    "recent_labs_on_file",
    "is_specialty",
]
FEATURES = CATEGORICAL + NUMERIC + BINARY


def domain_vocab() -> tuple[list[str], list[str]]:
    """Real drug classes and payers from the database, so features match the app."""
    con = connect()
    try:
        reqs = load_requests(con)
    finally:
        con.close()
    drug_classes = sorted(reqs["drugClass"].dropna().unique().tolist())
    payers = sorted(reqs["payerName"].dropna().unique().tolist())
    return drug_classes, payers


def synthesize(drug_classes: list[str], payers: list[str], rng) -> pd.DataFrame:
    priorities = ["Routine", "Urgent", "STAT"]
    step = rng.random(N) < 0.60
    dx = rng.random(N) < 0.70
    labs = rng.random(N) < 0.65
    specialty = rng.random(N) < 0.70
    prior_denials = rng.integers(0, 4, N)
    age = rng.integers(19, 87, N)
    priority = rng.choice(priorities, N, p=[0.55, 0.32, 0.13])
    drug_class = rng.choice(drug_classes, N)
    payer = rng.choice(payers, N)

    payer_offset = {p: rng.normal(0, 0.5) for p in payers}
    drug_offset = {d: rng.normal(0, 0.4) for d in drug_classes}

    # Latent approval propensity: documentation drives approval, prior denials
    # and stricter payers/drugs pull it down, with noise so it is not separable.
    score = (
        2.3 * step
        + 1.8 * dx
        + 1.1 * labs
        + 0.3 * specialty
        - 0.7 * prior_denials
        + np.array([payer_offset[p] for p in payer])
        + np.array([drug_offset[d] for d in drug_class])
        + rng.normal(0, 0.9, N)
    )
    # Deterministic threshold on the noisy latent score keeps a recoverable
    # signal (about 60% approved) rather than the extra noise of Bernoulli draws.
    approved = (score > np.quantile(score, 0.40)).astype(int)

    return pd.DataFrame(
        {
            "drug_class": drug_class,
            "payer": payer,
            "priority": priority,
            "prior_denials": prior_denials,
            "patient_age": age,
            "step_therapy_documented": step.astype(int),
            "qualifying_dx_on_file": dx.astype(int),
            "recent_labs_on_file": labs.astype(int),
            "is_specialty": specialty.astype(int),
            "approved": approved,
        }
    )


def build_pipeline() -> Pipeline:
    pre = ColumnTransformer(
        [("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL)],
        remainder="passthrough",
    )
    clf = HistGradientBoostingClassifier(
        random_state=SEED, max_iter=300, learning_rate=0.08
    )
    return Pipeline([("pre", pre), ("clf", clf)])


def save_figures(y_test, proba, perm) -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(5.5, 4))
    RocCurveDisplay.from_predictions(
        y_test, proba, ax=ax, name="Approval model", curve_kwargs={"color": BRAND}
    )
    ax.plot([0, 1], [0, 1], linestyle="--", color="#94a3b8", linewidth=1)
    ax.set_title("Approval model ROC")
    fig.tight_layout()
    fig.savefig(FIG_DIR / "roc.png", dpi=130)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(4.6, 4))
    ConfusionMatrixDisplay.from_predictions(
        y_test, (proba >= 0.5).astype(int), ax=ax, cmap="Greens",
        colorbar=False, display_labels=["Denied", "Approved"],
    )
    ax.set_title("Confusion matrix")
    fig.tight_layout()
    fig.savefig(FIG_DIR / "confusion_matrix.png", dpi=130)
    plt.close(fig)

    order = np.argsort(perm.importances_mean)
    fig, ax = plt.subplots(figsize=(6.4, 4))
    ax.barh([FEATURES[i] for i in order], perm.importances_mean[order], color=BRAND)
    ax.set_title("Permutation feature importance")
    ax.set_xlabel("Mean ROC AUC drop when shuffled")
    fig.tight_layout()
    fig.savefig(FIG_DIR / "feature_importance.png", dpi=130)
    plt.close(fig)


def main() -> None:
    rng = np.random.default_rng(SEED)
    drug_classes, payers = domain_vocab()
    df = synthesize(drug_classes, payers, rng)

    X = df[FEATURES]
    y = df["approved"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=SEED, stratify=y
    )

    pipe = build_pipeline().fit(X_train, y_train)
    proba = pipe.predict_proba(X_test)[:, 1]
    preds = (proba >= 0.5).astype(int)

    auc = roc_auc_score(y_test, proba)
    acc = accuracy_score(y_test, preds)
    report = classification_report(
        y_test, preds, target_names=["Denied", "Approved"], output_dict=True
    )
    perm = permutation_importance(
        pipe, X_test, y_test, n_repeats=10, random_state=SEED, scoring="roc_auc"
    )

    save_figures(y_test, proba, perm)

    ranked = np.argsort(perm.importances_mean)[::-1]
    metrics = {
        "model": "HistGradientBoostingClassifier",
        "samples": int(N),
        "approvalBaseRate": round(float(y.mean()), 3),
        "test": {"accuracy": round(float(acc), 3), "rocAuc": round(float(auc), 3)},
        "featureImportance": {
            FEATURES[i]: round(float(perm.importances_mean[i]), 4) for i in ranked
        },
        "classificationReport": report,
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "model_metrics.json").write_text(json.dumps(metrics, indent=2))

    print("AuthFlow approval-likelihood model")
    print("==================================")
    print(f"Samples:        {N}")
    print(f"Approval base:  {y.mean() * 100:.1f}%")
    print(f"Test accuracy:  {acc * 100:.1f}%")
    print(f"Test ROC AUC:   {auc:.3f}")
    print("Top features (permutation importance):")
    for i in ranked[:5]:
        print(f"  {FEATURES[i]:<26} {perm.importances_mean[i]:.4f}")
    print("Figures written to analytics/figures/, metrics to analytics/output/")


if __name__ == "__main__":
    main()
