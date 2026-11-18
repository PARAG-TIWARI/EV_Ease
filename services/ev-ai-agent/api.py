import logging
import os

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from workflow import run_workflow

logger = logging.getLogger("evease.api")

app = FastAPI(
    title="EVEase Recommendation API",
    description=(
        "Route-aware EV charging recommendations using Google Maps route data, "
        "a local charger fixture, deterministic ranking and an LLM explanation."
    ),
    version="0.2.0",
)

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_URLS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class RecommendationRequest(BaseModel):
    current_location: str = Field(min_length=2, max_length=200)
    destination: str = Field(min_length=2, max_length=200)
    battery_percentage: float = Field(ge=0, le=100)
    connector_type: str = Field(min_length=2, max_length=40)


@app.get("/health")
def health():
    """Process health check; it does not verify Maps or OpenRouter connectivity."""
    return {"status": "ok", "service": "evease-recommendation-api"}


@app.post("/recommend")
def recommend(request: RecommendationRequest):
    """Create route-aware recommendations from the configured charger data."""
    try:
        result = run_workflow(request.model_dump())
    except Exception:
        logger.exception("Recommendation workflow failed unexpectedly")
        raise HTTPException(
            status_code=502,
            detail=(
                "The recommendation workflow could not be completed. "
                "Check the API configuration and provider availability."
            ),
        ) from None

    workflow_error = result.get("error")
    if workflow_error:
        logger.warning("Recommendation workflow returned an error: %s", workflow_error)
        if workflow_error.startswith("No compatible chargers found"):
            raise HTTPException(
                status_code=404,
                detail="No compatible charger records were found in the configured local dataset.",
            )
        raise HTTPException(
            status_code=502,
            detail="A route or recommendation provider step failed. Check service configuration.",
        )

    if not result.get("best_charger"):
        raise HTTPException(
            status_code=404,
            detail="No compatible charger records were found in the configured local dataset.",
        )

    return result


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
