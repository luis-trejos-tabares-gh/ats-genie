import time
from collections import defaultdict

from fastapi import HTTPException, Request

from app.config import settings

_hits: dict[str, list[float]] = defaultdict(list)


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request) -> None:
    now = time.time()
    window = 60.0
    key = client_ip(request)
    recent = [stamp for stamp in _hits[key] if now - stamp < window]
    if len(recent) >= settings.rate_limit_per_minute:
        raise HTTPException(status_code=429, detail="Too many requests. Try again in a minute.")
    recent.append(now)
    _hits[key] = recent
