# EVEase local setup

This repository contains three separate components:

1. React + Vite frontend
2. FastAPI + LangGraph charging recommendation service
3. Optional legacy Flask + SQLite application

Run the components you need. The React/FastAPI combination is the current AI-planner path; the Flask application is a separate legacy prototype.

## Prerequisites

- Node.js 20 or newer and npm
- Python 3.10 or newer
- Google Maps API key with Directions API enabled
- OpenRouter API key
- Git

## 1. Start the FastAPI recommendation service

From the repository root:

~~~powershell
cd services/ev-ai-agent
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
~~~

Edit services/ev-ai-agent/.env:

~~~env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173
PORT=8000
~~~

Run the API from services/ev-ai-agent:

~~~powershell
python api.py
~~~

Endpoints:

- Health: http://localhost:8000/health
- Interactive API docs: http://localhost:8000/docs
- Recommendation: POST http://localhost:8000/recommend

The API uses a local charger JSON fixture. Google Maps provides route information; when that call fails, the code can return a fixed mock route. OpenRouter generates the explanation for the selected candidate.

The recommendation API currently has no user authentication or per-user rate limiting. Keep it local or put it behind an appropriate access-control and usage-limit layer before public exposure.

## 2. Start the React + Vite frontend

Open a second terminal from the repository root:

~~~powershell
cd client
npm ci
Copy-Item .env.example .env.local
~~~

The local example sets:

~~~env
VITE_API_BASE_URL=http://localhost:8000
~~~

Start the frontend:

~~~powershell
npm run dev
~~~

Open http://localhost:5173.

Vite environment values are bundled into the browser application. Do not put Google Maps or OpenRouter secrets in client/.env.local; those credentials belong in the FastAPI service environment.

Frontend checks:

~~~powershell
npm run lint
npm run build
~~~

## 3. Optional legacy Flask + SQLite prototype

The Flask application is separate from the React/FastAPI AI planner. Use only disposable local data.

From the repository root:

~~~powershell
py -3 -m venv server\.venv
server\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r server/requirements.txt
cd server
python app.py
~~~

The Flask prototype listens on http://localhost:5000.

**Database warning:** server/setup_db.py deletes and recreates server/ev_db.sqlite when executed. Do not run it if you need the existing database file. The legacy app also contains demo-grade authentication and security weaknesses; do not expose it publicly or use real credentials.

## 4. One-click Windows launcher

After installing dependencies for the components you intend to run, execute run_app.bat from the repository root. It starts the FastAPI service, the legacy Flask app and the React frontend in separate terminal windows.

The launcher does not install packages, provision API credentials or reset the SQLite database.

## 5. Firebase Hosting

The Firebase configuration is stored in client/firebase.json, and the project alias is in client/.firebaserc.

The Firebase Hosting build must run from the client directory:

~~~powershell
cd client
npm ci
npm run build
~~~

The resulting static files are in client/dist. The repository's GitHub Actions workflow uses this directory as the Firebase Hosting entry point.

The configured Firebase project ID is ev-ease. Check the Firebase Console for the current deployed domain, release and hosting status before sharing the public demo URL.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| AI Planner cannot reach the API | Ensure FastAPI is running and VITE_API_BASE_URL points to it |
| Browser reports CORS error | Add the exact frontend origin to FRONTEND_URLS, then restart FastAPI |
| Google Maps route fails | Check the Directions API key, API enablement and quota; the code may fall back to mock route data |
| AI explanation falls back | Check the OpenRouter key, model access and provider quota |
| Frontend build fails | Run npm ci from client/ and inspect the Node.js version |
| Flask database appears missing | Check the server/ working directory; do not run setup_db.py against data you need |
