from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.main import app
from app.routers import health

def test_dependency_readiness_reports_required_and_optional_dependencies(monkeypatch) -> None:
    monkeypatch.setattr(
        health,
        "get_settings",
        lambda: SimpleNamespace(
            redis_url="redis://redis:6379/0",
        ),
    )
    monkeypatch.setattr(health, "_check_primary_database", lambda: None)
    monkeypatch.setattr(health, "_check_redis", lambda: None)

    result = health.dependency_readiness()

    assert result["status"] == "ready"
    assert result["checks"]["database"]["required"] is True
    assert result["checks"]["redis"]["required"] is False

def test_dependency_readiness_is_not_ready_when_required_dependency_fails(monkeypatch) -> None:
    def fail_primary_database() -> None:
        raise RuntimeError("synthetic failure")

    monkeypatch.setattr(health, "_check_primary_database", fail_primary_database)
    monkeypatch.setattr(health, "_check_redis", lambda: None)

    result = health.dependency_readiness()

    assert result["status"] == "not_ready"
    assert result["checks"]["database"]["status"] == "failed"

def test_readiness_endpoint_returns_503_without_dependency_details(monkeypatch) -> None:
    monkeypatch.setattr(
        health,
        "dependency_readiness",
        lambda: {
            "status": "not_ready",
            "checks": {
                "database": {"required": True, "status": "failed", "latency_ms": 1.0},
            },
        },
    )

    with TestClient(app) as client:
        response = client.get("/api/ready")

    assert response.status_code == 503
    assert response.json()["status"] == "not_ready"
    assert "DATABASE_URL" not in response.text
    assert "password" not in response.text.lower()

def test_health_endpoint_remains_a_lightweight_liveness_probe() -> None:
    # Load balancers should not be blocked by a temporary dependency outage.
    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
