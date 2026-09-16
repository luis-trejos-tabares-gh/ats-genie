import hashlib
import sqlite3
import threading
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, Request

from app.config import settings

_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "rate_limit.sqlite"
_lock = threading.Lock()


class QuotaExceeded(HTTPException):
    def __init__(self, detail: str, retry_after: int, limit: int, remaining: int = 0):
        super().__init__(
            status_code=429,
            detail=detail,
            headers={
                "Retry-After": str(max(1, retry_after)),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": str(max(0, remaining)),
            },
        )


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _ip_hash(request: Request) -> str:
    raw = f"{settings.rate_limit_salt}:{client_ip(request)}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _connect() -> sqlite3.Connection:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            scope TEXT NOT NULL,
            key TEXT NOT NULL,
            ts REAL NOT NULL
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_events_scope_key_ts ON events(scope, key, ts)")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS locks (
            name TEXT PRIMARY KEY,
            until REAL NOT NULL
        )
        """
    )
    return conn


_conn = _connect()


def _prune(now: float) -> None:
    oldest = now - max(settings.session_window_seconds, 86_400)
    _conn.execute("DELETE FROM events WHERE ts < ?", (oldest,))
    _conn.execute("DELETE FROM locks WHERE until < ?", (now,))


def _count(scope: str, key: str, since: float) -> int:
    row = _conn.execute(
        "SELECT COUNT(*) FROM events WHERE scope = ? AND key = ? AND ts >= ?",
        (scope, key, since),
    ).fetchone()
    return int(row[0]) if row else 0


def _oldest(scope: str, key: str, since: float) -> float | None:
    row = _conn.execute(
        "SELECT MIN(ts) FROM events WHERE scope = ? AND key = ? AND ts >= ?",
        (scope, key, since),
    ).fetchone()
    return float(row[0]) if row and row[0] is not None else None


def _latest(scope: str, key: str) -> float | None:
    row = _conn.execute(
        "SELECT MAX(ts) FROM events WHERE scope = ? AND key = ?",
        (scope, key),
    ).fetchone()
    return float(row[0]) if row and row[0] is not None else None


def _add(scope: str, key: str, ts: float) -> None:
    _conn.execute("INSERT INTO events(scope, key, ts) VALUES (?, ?, ?)", (scope, key, ts))


def enforce_burst(request: Request) -> None:
    now = time.time()
    key = _ip_hash(request)
    window = 60.0
    with _lock:
        _prune(now)
        count = _count("burst", key, now - window)
        if count >= settings.rate_limit_per_minute:
            oldest = _oldest("burst", key, now - window) or now
            raise QuotaExceeded(
                "Too many requests. Try again in a minute.",
                retry_after=int(window - (now - oldest)) + 1,
                limit=settings.rate_limit_per_minute,
            )
        _add("burst", key, now)
        _conn.commit()


def _utc_day_start(now: float) -> float:
    moment = datetime.fromtimestamp(now, tz=timezone.utc)
    start = datetime(moment.year, moment.month, moment.day, tzinfo=timezone.utc)
    return start.timestamp()


@contextmanager
def groq_slot(request: Request):
    now = time.time()
    key = _ip_hash(request)
    day_start = _utc_day_start(now)

    with _lock:
        _prune(now)
        lock = _conn.execute("SELECT until FROM locks WHERE name = 'groq'").fetchone()
        if lock and float(lock[0]) > now:
            raise QuotaExceeded(
                "This free tool is busy. Try again in a minute.",
                retry_after=int(float(lock[0]) - now) + 1,
                limit=1,
            )

        last_global = _latest("global_groq", "global")
        if last_global is not None:
            wait = settings.global_min_interval - (now - last_global)
            if wait > 0:
                raise QuotaExceeded(
                    "This free tool is busy. Try again in a minute.",
                    retry_after=int(wait) + 1,
                    limit=settings.global_daily_limit,
                )

        daily = _count("global_groq", "global", day_start)
        if daily >= settings.global_daily_limit:
            tomorrow = day_start + 86_400
            raise QuotaExceeded(
                "This free tool has reached today's shared budget. Try again tomorrow.",
                retry_after=int(tomorrow - now) + 1,
                limit=settings.global_daily_limit,
            )

        hour_count = _count("session", key, now - settings.session_window_seconds)
        if hour_count >= settings.session_limit:
            oldest = _oldest("session", key, now - settings.session_window_seconds) or now
            raise QuotaExceeded(
                "You can run 3 AI checks per hour. Try again later.",
                retry_after=int(settings.session_window_seconds - (now - oldest)) + 1,
                limit=settings.session_limit,
            )

        _add("session", key, now)
        _add("global_groq", "global", now)
        _conn.execute(
            "INSERT INTO locks(name, until) VALUES('groq', ?) ON CONFLICT(name) DO UPDATE SET until = excluded.until",
            (now + settings.groq_timeout_seconds,),
        )
        _conn.commit()

    try:
        yield
    finally:
        with _lock:
            _conn.execute("DELETE FROM locks WHERE name = 'groq'")
            _conn.commit()
