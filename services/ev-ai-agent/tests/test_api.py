"""FastAPI recommendation API tests without provider network calls."""

import os

# The workflow imports the API module, which constructs provider clients at
# import time. Dummy credentials are sufficient because tests mock the workflow.
os.environ.setdefault("GOOGLE_MAPS_API_KEY", "test-google-maps-key")
os.environ.setdefault("OPENROUTER_API_KEY", "test-openrouter-key")

from fastapi.testclient import TestClient

import api


client = TestClient(api.app)


def valid_payload():
    return {
        "current_location": "Bhopal, Madhya Pradesh",
        "destination": "Indore, Madhya Pradesh",
        "battery_percentage": 30,
        "connector_type": "CCS2",
    }


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_recommend_rejects_invalid_battery_percentage():
    payload = valid_payload()
    payload["battery_percentage"] = 120

    response = client.post("/recommend", json=payload)

    assert response.status_code == 422


def test_recommend_rejects_empty_location():
    payload = valid_payload()
    payload["current_location"] = ""

    response = client.post("/recommend", json=payload)

    assert response.status_code == 422


def test_recommend_returns_workflow_result(monkeypatch):
    expected = {
        "best_charger": {"id": "fixture-1", "name": "Test Charger"},
        "route": {"distance": 25.0, "duration": 30.0, "mock": True},
    }
    monkeypatch.setattr(api, "run_workflow", lambda _: expected)

    response = client.post("/recommend", json=valid_payload())

    assert response.status_code == 200
    assert response.json() == expected


def test_recommend_returns_404_when_no_compatible_fixture(monkeypatch):
    monkeypatch.setattr(
        api,
        "run_workflow",
        lambda _: {"error": "No compatible chargers found for this connector"},
    )

    response = client.post("/recommend", json=valid_payload())

    assert response.status_code == 404
    assert "No compatible charger records" in response.json()["detail"]


def test_recommend_hides_unexpected_provider_exception(monkeypatch):
    def raise_provider_error(_):
        raise RuntimeError("private provider failure details")

    monkeypatch.setattr(api, "run_workflow", raise_provider_error)

    response = client.post("/recommend", json=valid_payload())

    assert response.status_code == 502
    assert "private provider failure details" not in response.text
