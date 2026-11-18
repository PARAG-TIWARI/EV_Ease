# EVEase architecture and prototype boundaries

This document describes what is present in the repository. It is a source-based project review, not a penetration test, external-provider verification or production-readiness certification.

## 1. Application components

EVEase contains three distinct application paths:

| Component | Location | Role |
| --- | --- | --- |
| React + Vite frontend | client/ | User-facing dashboard, planner, map and demonstration workflows |
| FastAPI + LangGraph recommendation service | services/ev-ai-agent/ | Route lookup, local charger filtering, deterministic ranking and LLM explanation |
| Legacy Flask + SQLite application | server/, templates/, static/ | Earlier station search, account and booking prototype |

The React frontend and FastAPI recommendation service are the main AI-planner path. The Flask application is a separate legacy implementation; it is not the authentication backend for the React application.

## 2. AI recommendation request flow

~~~mermaid
flowchart TD
    UI[React AI Planner] -->|POST /recommend| API[FastAPI]
    API --> FLOW[LangGraph workflow]
    FLOW --> MAPS[Google Maps Directions]
    MAPS -->|provider error| MOCK[Fixed mock route]
    MAPS --> ROUTE[Route distance, duration and geometry]
    MOCK --> ROUTE
    ROUTE --> FIXTURE[Local chargers.json]
    FIXTURE --> FILTER[Connector and active-status filter]
    FILTER --> RANK[Deterministic Python scoring]
    RANK --> LLM[OpenRouter explanation]
    LLM --> RESULT[Recommendation and score breakdown]
    RESULT --> UI
~~~

The route provider is Google Maps Directions. Candidate charger records are read from services/ev-ai-agent/data/chargers.json. If the Directions request fails, the Maps tool returns a fixed demonstration route and marks it with mock=true.

The ranking code uses the prefilled distance_from_route_km value in the fixture. Although the route tool returns a route path, the current charger tool does not compute geographic detour from each charger's coordinates. The LLM is called after the ranking and writes an explanation for the selected result; it does not determine or validate the numerical ranking.

## 3. Implemented versus simulated functionality

The following distinctions are important when describing this project:

| Feature area | Current implementation |
| --- | --- |
| Route lookup | Google Maps Directions API with a fixed mock-route fallback |
| Charger availability, price, ratings and wait time | Local JSON demonstration records |
| Charger-to-route detour | Precomputed fixture field, not computed from route geometry |
| Recommendation score | Deterministic Python formula with hand-selected coefficients |
| AI explanation | OpenRouter-generated text with a local fallback |
| React role selection | Client-side demo state, not secure authentication |
| Navigation progress and ETA | UI-level simulation/local state |
| Slot reservation | Local confirmation state; no charging-network reservation request |
| Charging-session values | Demonstration values; no charger-controller or vehicle telemetry integration |
| Subscription/payment | UI and access-tier demonstration; no payment gateway connection |

## 4. Recommendation API security and operations

The FastAPI API accepts only a request body and does not currently authenticate an end user. It therefore has no per-user access control, provider quota or per-user request limit. If exposed publicly, unauthenticated callers could consume Google Maps and OpenRouter quota.

The API should be protected by an authentication or gateway layer and usage controls before public exposure. Google Maps and OpenRouter credentials must remain in server-side environment variables. Do not place provider keys in Vite environment variables because Vite exposes them to browser code.

The API CORS allowlist is controlled by FRONTEND_URLS. Configure the actual Firebase frontend origin in the hosted service environment once the deployed domain has been confirmed.

## 5. Legacy Flask + SQLite security review

The legacy Flask application should be treated as local demonstration code only.

The current source contains the following concerns:

| Finding | Source evidence | Consequence |
| --- | --- | --- |
| Known fallback Flask session secret | server/app.py falls back to secret123 if SECRET_KEY is unset | Session cookies may be forgeable if the app is exposed with the default |
| Plaintext demonstration passwords | server/setup_db.py seeds admin/admin and user/user; login compares stored strings directly | No password hashing; never use real credentials |
| SQL assembled with string interpolation | Several Flask routes interpolate user IDs, city and form fields into query strings | SQL injection risk; parameterise every query |
| Admin route role enforcement | Some dashboard checks only whether a session user_type exists | A regular logged-in user may pass an admin route guard |
| Destructive database setup | server/setup_db.py removes server/ev_db.sqlite before recreating it | Running setup can delete existing local records |
| SQLite file tracked by Git | server/ev_db.sqlite exists in the repository tree | Inspect locally for personal or sensitive records before retaining it publicly |

The React AuthContext is also client-side demonstration state: the user can select a role locally, and ProtectedRoute only checks that local state. It is not server-side authentication or authorisation.

Do not expose the legacy Flask app as a real account/booking system until it has been refactored with password hashing, a required strong secret, server-enforced role checks, parameterised SQL, CSRF protection for form mutations and non-destructive database setup.

## 6. Firebase Hosting and backend deployment

The client contains:
- client/firebase.json — serves the dist folder and rewrites application routes to index.html.
- client/.firebaserc — selects the Firebase project ID ev-ease.
- .github/workflows/firebase-hosting-merge.yml — deploys the client to Firebase Hosting on a push to main.
- .github/workflows/firebase-hosting-pull-request.yml — builds and deploys preview channels for same-repository pull requests.

The expected default Firebase Hosting domain for the configured project is https://ev-ease.web.app. The repository does not include a deployment receipt or custom-domain record, and this URL was not independently reachable from the current review environment. Confirm it in Firebase Console before using it as a verified live demo link.

The recommendation service has a Render blueprint at services/ev-ai-agent/render.yaml. The actual public service URL is not hard-coded in the repository; copy it from the Render dashboard and set the corresponding frontend API environment variable and FRONTEND_URLS value.

A recent GitHub status on the EV_Ease main commit points to a Railway deployment context marked failed. The repository also contains a Render blueprint. Confirm which hosting service is currently intended to own the API before treating either configuration as an active production endpoint.

## 7. Review scope and recommended next steps

The review used repository files and configuration. It did not include access to Firebase, Render or Railway provider dashboards, secret stores, production logs, or a running charger-network integration.

Recommended order:

1. Confirm the current Firebase domain and API service URL from their provider dashboards.
2. Confirm the Firebase Hosting build and preview workflows are green.
3. Add the confirmed production frontend origin to the hosted API's FRONTEND_URLS.
4. Put authentication and per-user/API usage limits in front of the recommendation endpoint before public use.
5. Replace local charger fixtures with a documented, licensed current data source.
6. Calculate charger detour from station coordinates and route geometry.
7. Add unit tests for ranking, connector filtering, route fallback, and invalid request cases.
8. Keep the legacy Flask app local until the authentication, SQL and database issues are resolved.

No claim of production security, live charger availability or real reservation capability should be made from the current source alone.
