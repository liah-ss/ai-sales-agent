from fastapi.testclient import TestClient

from app.main import app


def test_request_id_is_preserved_for_valid_correlation_id() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health", headers={"X-Request-ID": "seo-audit-12345"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "seo-audit-12345"


def test_request_id_is_replaced_when_header_is_invalid() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health", headers={"X-Request-ID": "bad header value"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] != "bad header value"
    assert len(response.headers["X-Request-ID"]) >= 8
