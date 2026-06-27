# AuthFlow Python data layer

A small Python data-engineering layer that runs over the **same SQLite database**
the Next.js app uses (`prisma/dev.db`). It treats the prior-authorization data as
a dataset: it analyzes it and validates it, independent of the web app.

Three entry points:

- **`pa_analytics.py`** loads the data into pandas and computes practice metrics
  (status mix, approval rate, turnaround mean / median / p90, turnaround by
  payer, top denial reasons, drug volume, deadline risk, and AI assistant
  telemetry). It writes `output/report.json` and `output/report.md` and prints a
  summary. This is the data-engineering view of the same numbers the Analytics
  screen renders.
- **`data_quality.py`** runs a suite of Great Expectations / Pydeequ style
  expectations: enum domains, uniqueness, completeness, decision integrity,
  temporal ordering, referential integrity, JSON column validity, and telemetry
  sanity. Critical failures exit non-zero, so it doubles as a data-quality gate
  in CI.
- **`approval_model.py`** trains a scikit-learn `HistGradientBoostingClassifier`
  to predict approval from request and chart features. It reads the real drug and
  payer vocabulary from the database, reports accuracy and ROC AUC (about 0.91),
  ranks features by permutation importance, writes `output/model_metrics.json`,
  and saves the `figures/*.png` used in the top-level README. The fixed seed makes
  the metrics and figures reproducible.

## Run

```bash
# from the repo root, after the database is seeded
npm run db:push && npm run db:seed

python -m pip install -r analytics/requirements.txt
python analytics/data_quality.py      # data-quality gate (exits non-zero on failure)
python analytics/pa_analytics.py      # writes analytics/output/report.{json,md}
python analytics/approval_model.py    # trains the model, writes figures + metrics
```

Prisma stores DateTime as Unix epoch milliseconds and Boolean as 0/1 in SQLite;
`db.py` normalizes both so the rest of the code works with real datetimes and
booleans.
