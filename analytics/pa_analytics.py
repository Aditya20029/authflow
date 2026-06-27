"""AuthFlow analytics pipeline (Python / pandas).

Reads the seeded prior-authorization data straight from SQLite and computes the
same metrics the Analytics screen shows, as a standalone data-engineering
artifact: status mix, approval rate, turnaround statistics, denial drivers, drug
volume, deadline risk, and AI assistant telemetry. Writes JSON and Markdown
reports to analytics/output and prints a summary.

    python analytics/pa_analytics.py
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from db import DECIDED, connect, load_requests, now_utc_naive, read_table

OUTPUT_DIR = Path(__file__).resolve().parent / "output"


def build_report() -> dict:
    con = connect()
    try:
        reqs = load_requests(con)
        gens = read_table(con, "GenerationLog")
    finally:
        con.close()

    now = now_utc_naive()
    decided = reqs[reqs["status"].isin(DECIDED)]
    approved = int((reqs["status"] == "Approved").sum())
    denied = int((reqs["status"] == "Denied").sum())

    open_reqs = reqs[~reqs["status"].isin(DECIDED)]
    hours_left = (open_reqs["deadline"] - now).dt.total_seconds() / 3600.0
    overdue = int((hours_left < 0).sum())
    at_risk = int(((hours_left >= 0) & (hours_left <= 48)).sum())

    turnaround = decided["turnaroundHours"].dropna()
    by_payer = (
        decided.dropna(subset=["turnaroundHours"])
        .groupby("payerName")["turnaroundHours"]
        .mean()
        .round(1)
        .sort_values()
    )

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totals": {
            "requests": int(len(reqs)),
            "decided": int(len(decided)),
            "approvalRate": round(approved / (approved + denied) * 100, 1)
            if (approved + denied)
            else 0.0,
            "atRisk": at_risk,
            "overdue": overdue,
        },
        "turnaroundHours": {
            "mean": round(float(turnaround.mean()), 1) if len(turnaround) else None,
            "median": round(float(turnaround.median()), 1) if len(turnaround) else None,
            "p90": round(float(turnaround.quantile(0.9)), 1) if len(turnaround) else None,
        },
        "statusMix": reqs["status"].value_counts().to_dict(),
        "turnaroundByPayer": by_payer.to_dict(),
        "topDenialReasons": reqs["denialReason"].dropna().value_counts().head(6).to_dict(),
        "volumeByDrug": reqs["medicationName"].value_counts().head(8).to_dict(),
        "assistant": {
            "generations": int(len(gens)),
            "fallbackRatePct": round(float(gens["usedFallback"].mean()) * 100, 1)
            if len(gens)
            else 0.0,
            "avgLatencyMs": int(gens["latencyMs"].mean()) if len(gens) else None,
        },
    }


def to_markdown(r: dict) -> str:
    t = r["totals"]
    ta = r["turnaroundHours"]
    lines = [
        "# AuthFlow analytics report",
        "",
        f"Generated {r['generatedAt']}",
        "",
        "## Totals",
        f"- Requests: {t['requests']}",
        f"- Decided: {t['decided']}",
        f"- Approval rate: {t['approvalRate']}%",
        f"- At risk / overdue: {t['atRisk']} / {t['overdue']}",
        "",
        "## Turnaround (hours)",
        f"- Mean / median / p90: {ta['mean']} / {ta['median']} / {ta['p90']}",
        "",
        "## Top denial reasons",
    ]
    lines += [f"- {n}: {reason}" for reason, n in r["topDenialReasons"].items()]
    lines += ["", "## Volume by drug"]
    lines += [f"- {n}: {drug}" for drug, n in r["volumeByDrug"].items()]
    lines += [
        "",
        "## AI assistant",
        f"- Generations: {r['assistant']['generations']}",
        f"- Fallback rate: {r['assistant']['fallbackRatePct']}%",
        f"- Avg latency: {r['assistant']['avgLatencyMs']} ms",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    report = build_report()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "report.json").write_text(json.dumps(report, indent=2))
    (OUTPUT_DIR / "report.md").write_text(to_markdown(report))

    t = report["totals"]
    print("AuthFlow analytics")
    print("==================")
    print(f"Requests:         {t['requests']}")
    print(f"Decided:          {t['decided']}")
    print(f"Approval rate:    {t['approvalRate']}%")
    print(f"At risk/overdue:  {t['atRisk']} / {t['overdue']}")
    print(f"Turnaround median:{report['turnaroundHours']['median']} h")
    print(f"Assistant gens:   {report['assistant']['generations']} "
          f"(fallback {report['assistant']['fallbackRatePct']}%)")
    print("Reports written to analytics/output/")


if __name__ == "__main__":
    main()
