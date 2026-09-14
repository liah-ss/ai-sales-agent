from __future__ import annotations

import logging
import time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import engine

try:
    from redis import Redis as SyncRedis
except ModuleNotFoundError:  # pragma: no cover - dependency is present in production.
    SyncRedis = None  # type: ignore[assignment,misc]

router = APIRouter(tags=["health"])
logger = logging.getLogger(__name__)

def _check_primary_database() -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

def _check_redis() -> None:
    settings = get_settings()
    if not settings.redis_url:
        raise RuntimeError("not_configured")
    if SyncRedis is None:
        raise RuntimeError("dependency_missing")
    client = SyncRedis.from_url(
        settings.redis_url,
        socket_connect_timeout=1.0,
        socket_timeout=1.0,
    )
    try:
        client.ping()
    finally:
        client.close()

def _run_check(check: Callable[[], None]) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        check()
    except Exception as exc:  # noqa: BLE001 - health must never break the API.
        logger.warning(
            "Readiness check failed: %s (%s)",
            getattr(check, "__name__", "dependency"),
            type(exc).__name__,
        )
        return {
            "status": "failed",
            "latency_ms": round((time.perf_counter() - started) * 1000, 2),
        }
    return {
        "status": "ok",
        "latency_ms": round((time.perf_counter() - started) * 1000, 2),
    }

def dependency_readiness() -> dict[str, Any]:
    """Return dependency status without exposing URLs, credentials, or errors."""
    check_definitions = {
        "database": (True, _check_primary_database),
        # Redis has a safe in-process fallback.
        "redis": (False, _check_redis),
    }
    # Independent network checks run concurrently so a slow optional
    # dependency cannot make the readiness probe wait behind every other check.
    with ThreadPoolExecutor(max_workers=len(check_definitions)) as executor:
        futures = {
            name: executor.submit(_run_check, check)
            for name, (_required, check) in check_definitions.items()
        }
        checks = {
            name: {
                "required": required,
                **futures[name].result(),
            }
            for name, (required, _check) in check_definitions.items()
        }

    required_failed = any(
        item["required"] and item["status"] != "ok"
        for item in checks.values()
    )
    degraded = any(
        not item["required"] and item["status"] != "ok"
        for item in checks.values()
    )
    return {
        "status": "not_ready" if required_failed else "degraded" if degraded else "ready",
        "checks": checks,
    }

@router.get("/health")
def health_check() -> dict[str, str]:
    """Liveness probe: the process is running and can accept requests."""
    return {"status": "ok"}

@router.get("/ready")
def readiness_check(response: Response) -> dict[str, Any]:
    """Readiness probe used by Docker and load balancers."""
    result = dependency_readiness()
    if result["status"] == "not_ready":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return result

