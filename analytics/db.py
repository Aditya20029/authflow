"""Shared SQLite access for the AuthFlow Python analytics layer.

Reads the same prisma/dev.db the Next.js app writes. Prisma stores DateTime as
Unix epoch milliseconds and Boolean as 0/1 integers, both handled here so the
rest of the Python code works with real datetimes and bools.
"""

from __future__ import annotations

import sqlite3
import warnings
from pathlib import Path

import pandas as pd

# pandas nudges toward SQLAlchemy, but a raw sqlite3 connection is fine for reads.
warnings.filterwarnings("ignore", message=".*only supports SQLAlchemy.*")

DB_PATH = Path(__file__).resolve().parent.parent / "prisma" / "dev.db"

DATETIME_COLUMNS = ("createdAt", "submittedAt", "decisionAt", "deadline")

DECIDED = ("Approved", "Denied")


def connect() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise SystemExit(
            f"Database not found at {DB_PATH}.\n"
            "Run `npm run db:push && npm run db:seed` first."
        )
    return sqlite3.connect(str(DB_PATH))


def read_table(con: sqlite3.Connection, name: str) -> pd.DataFrame:
    df = pd.read_sql_query(f"SELECT * FROM {name}", con)
    for col in DATETIME_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], unit="ms")
    return df


def load_requests(con: sqlite3.Connection) -> pd.DataFrame:
    """Prior authorizations joined with payer and medication, dates parsed."""
    df = pd.read_sql_query(
        """
        SELECT r.*,
               p.name        AS payerName,
               p.planType    AS planType,
               m.name        AS medicationName,
               m.drugClass   AS drugClass,
               m.isSpecialty AS isSpecialty
        FROM PriorAuthRequest r
        JOIN Payer p      ON p.id = r.payerId
        JOIN Medication m ON m.id = r.medicationId
        """,
        con,
    )
    for col in DATETIME_COLUMNS:
        df[col] = pd.to_datetime(df[col], unit="ms")
    df["isSpecialty"] = df["isSpecialty"].astype(bool)
    return df


def now_utc_naive() -> pd.Timestamp:
    """Current time as naive UTC, matching the epoch-ms columns above."""
    return pd.Timestamp.now(tz="UTC").tz_localize(None)
