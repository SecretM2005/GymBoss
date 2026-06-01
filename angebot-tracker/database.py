import sqlite3
from datetime import datetime
from typing import Optional

DB_PATH = "angebote.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS offers (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                client_name     TEXT NOT NULL,
                client_email    TEXT,
                project_desc    TEXT,
                amount          REAL,
                created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
                followup_days   INTEGER DEFAULT 3,
                status          TEXT DEFAULT 'offen',
                last_followup   DATETIME,
                notes           TEXT
            )
        """)
        conn.commit()


def add_offer(
    client_name: str,
    client_email: str,
    project_desc: str,
    amount: float,
    followup_days: int,
    notes: str,
) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO offers
                (client_name, client_email, project_desc, amount, followup_days, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (client_name, client_email, project_desc, amount, followup_days, notes),
        )
        conn.commit()
        return cursor.lastrowid


def get_all_offers() -> list[sqlite3.Row]:
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM offers ORDER BY created_at DESC"
        ).fetchall()


def get_offer_by_id(offer_id: int) -> Optional[sqlite3.Row]:
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM offers WHERE id = ?", (offer_id,)
        ).fetchone()


def update_status(offer_id: int, status: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE offers SET status = ? WHERE id = ?",
            (status, offer_id),
        )
        conn.commit()


def update_last_followup(offer_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE offers SET last_followup = ? WHERE id = ?",
            (datetime.now().isoformat(), offer_id),
        )
        conn.commit()


def delete_offer(offer_id: int) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM offers WHERE id = ?", (offer_id,))
        conn.commit()


def get_overdue_offers() -> list[sqlite3.Row]:
    """Alle offenen Angebote, bei denen followup_days überschritten wurde."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM offers WHERE status = 'offen'"
        ).fetchall()

    overdue = []
    now = datetime.now()
    for row in rows:
        created = datetime.fromisoformat(row["created_at"])
        days_open = (now - created).days
        if days_open >= row["followup_days"]:
            overdue.append(row)
    return overdue


def get_metrics() -> dict:
    with get_connection() as conn:
        total_open = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM offers WHERE status = 'offen'"
        ).fetchone()[0]

        won = conn.execute(
            "SELECT COUNT(*) FROM offers WHERE status = 'gewonnen'"
        ).fetchone()[0]

        lost = conn.execute(
            "SELECT COUNT(*) FROM offers WHERE status = 'verloren'"
        ).fetchone()[0]

    overdue_count = len(get_overdue_offers())
    close_rate = (won / (won + lost) * 100) if (won + lost) > 0 else 0.0

    return {
        "total_open_volume": total_open,
        "overdue_count": overdue_count,
        "close_rate": close_rate,
    }
