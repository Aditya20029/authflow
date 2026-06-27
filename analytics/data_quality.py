"""AuthFlow data-quality gate (Python).

Great-Expectations / Pydeequ style expectations over the seeded SQLite data.
Each expectation returns pass or fail with detail. Critical (error) failures
exit non-zero so the suite can gate CI; advisory (warn) failures are reported
but do not fail the build.

    python analytics/data_quality.py
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass

import pandas as pd

from db import DECIDED, connect, now_utc_naive, read_table

STATUSES = {
    "Draft", "NeedsDocumentation", "ReadyToSubmit", "Submitted",
    "InReview", "Approved", "Denied", "Appealed",
}
PRIORITIES = {"Routine", "Urgent", "STAT"}
GEN_STATUSES = {"ok", "error", "rate_limited", "capped"}


@dataclass
class Result:
    name: str
    passed: bool
    severity: str  # "error" or "warn"
    detail: str = ""


def load() -> dict:
    con = connect()
    try:
        names = [
            "PriorAuthRequest", "Patient", "Provider", "Payer", "Medication",
            "PayerRule", "RequiredDocument", "StatusEvent", "GenerationLog",
        ]
        return {n: read_table(con, n) for n in names}
    finally:
        con.close()


def _all_json_arrays(series) -> bool:
    for value in series:
        try:
            if not isinstance(json.loads(value), list):
                return False
        except (TypeError, ValueError):
            return False
    return True


def run_checks(t: dict) -> list:
    r = t["PriorAuthRequest"]
    results: list = []

    def check(name: str, severity: str, condition, detail: str = "") -> None:
        results.append(Result(name, bool(condition), severity, detail))

    check("requests present", "error", len(r) > 0, f"{len(r)} rows")

    # Enum domains (status/priority are String-backed unions in the schema)
    check("status in domain", "error", not (set(r["status"]) - STATUSES),
          f"unexpected {set(r['status']) - STATUSES}")
    check("priority in domain", "error", not (set(r["priority"]) - PRIORITIES),
          f"unexpected {set(r['priority']) - PRIORITIES}")

    # Identity
    check("referenceId unique", "error", r["referenceId"].is_unique)
    bad_ref = r.loc[~r["referenceId"].astype(str).str.match(r"^PA-[A-Z0-9]+$"), "referenceId"].tolist()
    check("referenceId format PA-*", "warn", not bad_ref, f"{bad_ref[:3]}")

    # Completeness
    check("deadline not null", "error", r["deadline"].notna().all())
    check("diagnosis not null", "error",
          r["diagnosisCode"].notna().all() and r["diagnosisLabel"].notna().all())

    # Decision integrity
    decided = r[r["status"].isin(DECIDED)]
    check("decided have decisionAt", "error", decided["decisionAt"].notna().all(),
          f"{int(decided['decisionAt'].isna().sum())} missing")
    check("decided have turnaround", "error", decided["turnaroundHours"].notna().all())
    ta = r["turnaroundHours"].dropna()
    check("turnaround non-negative", "error", bool((ta >= 0).all()),
          f"min={ta.min() if len(ta) else 'n/a'}")

    # Temporal ordering
    both = r.dropna(subset=["submittedAt", "decisionAt"])
    check("submittedAt <= decisionAt", "error", bool((both["submittedAt"] <= both["decisionAt"]).all()))
    sub = r.dropna(subset=["submittedAt"])
    check("createdAt <= submittedAt", "error", bool((sub["createdAt"] <= sub["submittedAt"]).all()))
    check("createdAt not in future", "error", bool((r["createdAt"] <= now_utc_naive()).all()))

    # Referential integrity
    check("patient FK resolves", "error", r["patientId"].isin(t["Patient"]["id"]).all())
    check("provider FK resolves", "error", r["providerId"].isin(t["Provider"]["id"]).all())
    check("medication FK resolves", "error", r["medicationId"].isin(t["Medication"]["id"]).all())
    check("payer FK resolves", "error", r["payerId"].isin(t["Payer"]["id"]).all())
    check("document FK resolves", "error",
          t["RequiredDocument"]["requestId"].isin(r["id"]).all())

    # JSON chart columns
    pat = t["Patient"]
    check("patient.diagnoses is JSON array", "error", _all_json_arrays(pat["diagnoses"]))
    check("patient.priorTherapies is JSON array", "error", _all_json_arrays(pat["priorTherapies"]))
    check("patient.labs is JSON array", "error", _all_json_arrays(pat["labs"]))

    # Telemetry sanity
    g = t["GenerationLog"]
    if len(g):
        check("generation status in domain", "warn", not (set(g["status"]) - GEN_STATUSES),
              f"{set(g['status']) - GEN_STATUSES}")
        check("generation latency non-negative", "error", bool((g["latencyMs"] >= 0).all()))

    return results


def main() -> None:
    results = run_checks(load())
    width = max(len(x.name) for x in results)

    print("AuthFlow data quality")
    print("=====================")
    critical_failures = 0
    for x in results:
        mark = "PASS" if x.passed else ("FAIL" if x.severity == "error" else "WARN")
        line = f"[{mark}] {x.name.ljust(width)}"
        if not x.passed and x.detail:
            line += f"   {x.detail}"
        print(line)
        if not x.passed and x.severity == "error":
            critical_failures += 1

    passed = sum(1 for x in results if x.passed)
    print(f"\n{passed}/{len(results)} expectations passed, {critical_failures} critical failures")
    sys.exit(1 if critical_failures else 0)


if __name__ == "__main__":
    main()
