# EVEase — EV Charging Planner Prototype

EVEase is a portfolio project exploring how route information, battery level, connector compatibility and station data can be combined to help an EV driver compare charging options.

The repository contains a React + Vite frontend, a FastAPI/LangGraph recommendation service and an older Flask/SQLite web prototype. The recommendation service uses Google Maps Directions for route information, local JSON records for charger candidates, a deterministic Python scoring function to rank those records, and OpenRouter to generate a short explanation.

> **Project status:** Academic / portfolio prototype. It is not currently connected to a live charging-network availability feed, vehicle telemetry provider, charging hardware, reservation provider or payment gateway. Several navigation, reservation, charging and account screens are demonstrative UI workflows. The README intentionally separates implemented integrations from prototype behaviour.

## Project links

- **GitHub repository:** [PARAG-TIWARI/EV_Ease](https://github.com/PARAG-TIWARI/EV_Ease)
- **Firebase project configured in the repository:** \`ev-ease\`
- **Expected default Firebase Hosting address:** [https://ev-ease.web.app](https://ev-ease.web.app) (the repository does not contain a deployment receipt or custom-domain record; verify the URL in Firebase Console before treating it as the current live demo)
- **AI recommendation API:** configured through the Render blueprint at \`services/ev-ai-agent/render.yaml\`; the actual public service URL is not stored in this repository and must be copied from the Render dashboard.

## What the recommendation service currently does

1. Accepts origin, destination, current battery percentage and connector type.
2. Calls Google Maps Directions for route distance, duration and route geometry.
3. Uses a fixed demonstration route if the Google Maps request fails; the result is marked as mock data.
4. Reads charger candidates from \`services/ev-ai-agent/data/chargers.json\`.
5. Filters records by connector compatibility and operational status.
6. Calculates a deterministic score using the values in the local charger records.
7. Uses OpenRouter to generate a natural-language explanation for the highest-scoring recommendation.

The charger availability, port counts, wait times, ratings, prices and precomputed detour distances come from a local JSON file. The service does not query an EV charging operator for live port availability or queues. The scoring tool uses the stored \`distance_from_route_km\` value; it does not calculate each station's geographic detour from the Google route geometry.

## Main application areas

- **Charging planner:** origin, destination, battery level and connector input.
- **AI recommendation:** route lookup, local charger filtering, deterministic ranking and LLM explanation.
- **Manual station search:** browsing and map-based exploration using the current application data/integrations.
- **Navigation-style screens:** route and progress presentation; some values and interactions are simulated.
- **Legacy Flask prototype:** older station search and SQLite booking flows, separate from the React/FastAPI recommendation path.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router |
| Recommendation API | Python, FastAPI, Pydantic, Uvicorn |
| Workflow | LangGraph, LangChain |
| Route lookup | Google Maps Directions API |
| Candidate charger data | Local JSON fixture |
| Ranking | Deterministic Python scoring |
| AI explanation | OpenRouter API |
| Legacy application | Flask, SQLite |
| Map display | Google Maps embed |

## Architecture

~~~text
EV_Ease/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── components/
│       ├── context/
│       └── pages/
├── services/
│   └── ev-ai-agent/
│       ├── agents/             # Recommendation workflow
│       ├── tools/              # Maps, charger fixture, ranking, LLM
│       ├── data/chargers.json  # Demonstration charger records
│       ├── api.py              # FastAPI service
│       ├── workflow.py         # LangGraph workflow
│       └── render.yaml         # Render service definition
├── server/                    # Legacy Flask + SQLite prototype
├── static/                    # Legacy Flask static assets
├── templates/                 # Legacy Flask templates
├── .github/workflows/         # Firebase Hosting workflows
├── README.md
├── SETUP.md
└── run_app.bat
~~~

## Run locally

See [SETUP.md](SETUP.md) for prerequisites and step-by-step commands.

### FastAPI recommendation service

The FastAPI API is under \`services/ev-ai-agent/\`. It exposes:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | \`/health\` | Basic API process health |
| POST | \`/recommend\` | Route-aware charging recommendations |
| GET | \`/docs\` | Interactive API documentation |

The API requires Google Maps and OpenRouter credentials in a server-side \`.env\` file. Do not place these values in the Vite client environment or commit them to Git.

### Firebase Hosting

The Firebase Hosting configuration is in \`client/firebase.json\`; the Firebase project alias is in \`client/.firebaserc\`. The React build output is \`client/dist\`.

GitHub Actions is configured to build the app from the \`client/\` directory and deploy it to Firebase Hosting. See the Firebase workflow files in \`.github/workflows/\`.

## Important implementation and security notes

### Recommendation service
- The recommendation API currently has no user authentication or per-user quota. Do not expose it publicly without an authentication or gateway layer and usage limits for paid provider APIs.
- Route-provider errors can fall back to a fixed demonstration route.
- Charger data is local fixture data, not live operator data.
- The score weights are hand-selected prototype coefficients, not a learned or calibrated model.
- OpenRouter generates the explanation; it does not verify the local station data.

### Legacy Flask application
The Flask/SQLite prototype is separate from the AI recommendation service and should be treated as local demonstration code only. Source review found:
- Seeded plaintext demo credentials.
- A hard-coded fallback session secret.
- SQL queries assembled with user-provided values in some routes.
- The admin dashboard route does not consistently enforce the admin role.
- \`server/setup_db.py\` deletes and recreates the SQLite database when run.

Do not expose this Flask application publicly or use real user credentials/data without a dedicated security refactor. The repository also contains a tracked SQLite database file; its binary contents have not been audited in this documentation pass. Check it locally for sensitive records before deciding whether to keep it in a public repository.

## Current engineering priorities

1. Connect the recommendation workflow to a documented, licensed, genuinely current charger data source.
2. Calculate station detour distance from coordinates and route geometry.
3. Display whether route data is live or mock, and show data freshness.
4. Add authentication and provider usage limits to the recommendation API.
5. Add unit/integration tests for connector filtering, ranking, provider fallback and malformed inputs.
6. Replace simulated booking, charging and payment behaviours only when real integrations are available.
7. Retire or secure the legacy Flask application before any public deployment.

## Author

**Parag Tiwari** · B.Tech Computer Science and Engineering student (2027)

[GitHub profile](https://github.com/PARAG-TIWARI)
