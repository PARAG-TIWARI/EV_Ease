# EVEase recommendation service

This folder contains the Python recommendation component used by the EVEase React application. It combines Google Maps route lookup, local charger-record filtering, deterministic ranking and an LLM-generated explanation.

## Implemented request flow

1. The client submits origin, destination, battery percentage and connector type to POST /recommend.
2. FastAPI validates the request.
3. The LangGraph workflow asks Google Maps Directions for a driving route.
4. If the Maps request fails, the current Maps tool returns a fixed demonstration route with mock=true.
5. ChargerTool loads candidate records from data/chargers.json and filters them by connector type and operational_status.
6. RankingTool applies fixed, deterministic score factors to the local records.
7. OpenRouter generates a short explanation for the highest-ranked candidate. A local fallback explanation is returned if the provider request fails.

The numerical recommendation is produced by the Python scoring code. The LLM generates the prose explanation; it does not independently verify the source data.

## Important data boundary

The charger tool currently reads a local JSON fixture. Availability, port counts, prices, wait times, ratings and operational status are not retrieved from a live EV charging network. The records include a prefilled distance_from_route_km value; the current implementation does not calculate charger-to-route detours from route geometry.

## Run the FastAPI service

From this directory:

~~~bash
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt
~~~

Copy .env.example to .env and set:

~~~env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173
PORT=8000
~~~

Run:

~~~bash
python api.py
~~~

Endpoints:

- GET /health
- POST /recommend
- GET /docs

The service reads browser origins from FRONTEND_URLS. It does not currently require an authenticated user and does not implement per-user quotas. Do not expose it publicly without an access-control and usage-limit layer.

## Optional Streamlit interface

~~~bash
streamlit run app.py
~~~

This is a separate interface to the same recommendation workflow; it is not the React frontend.

## Scoring approach

RankingTool combines five positive factors:
- Availability ratio
- Charging speed
- Battery safety band
- Route compatibility based on a stored detour-distance field
- Station rating

It subtracts four penalties:
- Detour distance
- Stored wait time
- Stored price per kWh
- A second detour-related traffic penalty

The coefficients are hand-selected prototype values. They have not been trained or calibrated against actual driver outcomes. The same prefilled detour value contributes to both distance penalties.

## Main files

~~~text
agents/recommendation_agent.py   # Coordinates route, charger, ranking and LLM tools
workflow.py                     # LangGraph workflow
tools/maps_tool.py              # Google Maps Directions and mock fallback
tools/charger_tool.py            # Local JSON charger filtering
tools/ranking_tool.py            # Deterministic scoring
tools/llm_tool.py                # OpenRouter explanation and fallback
data/chargers.json               # Demonstration charger records
api.py                           # FastAPI service
app.py                           # Streamlit interface
utils/config.py                  # Environment settings
~~~

## Limitations

- No live EV charging operator data source is integrated.
- Route failure can switch to fixed mock route data.
- Charger-to-route distance is a local fixture field, not calculated from route coordinates.
- No comprehensive automated test suite is included for ranking edge cases or provider failures.
- The API has no user authentication or per-user rate limiting.
- Recommendation explanations are generated text and do not verify charger data.

Use this service as a portfolio demonstration, not as a live charging-availability authority.
