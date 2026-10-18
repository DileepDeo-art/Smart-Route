# SmartRoute AI — Backend

A Node.js + Express backend that provides **real India-wide geocoding and road routing**
for the SmartRoute AI frontend. It uses
[OpenRouteService (ORS)](https://openrouteservice.org/) as the geocoding and routing
provider, which is powered by OpenStreetMap data.

---

## Architecture overview

```
smartroute/
├── backend/          ← This folder (Node.js/Express API)
│   ├── server.js     ← Main application file
│   ├── package.json
│   ├── .env.example  ← Template for secrets
│   └── .gitignore
└── smartroute/       ← Existing Vite + React frontend (unchanged)
    ├── src/
    └── package.json
```

---

## Quick-start

### 1. Get a free ORS API key

1. Go to <https://openrouteservice.org/dev/#/signup> and create a free account.
2. After logging in, visit <https://openrouteservice.org/dev/#/home>.
3. Copy your **API token** from the dashboard.

The free tier allows **2,000 API requests per day** — more than enough for development.

### 2. Create your `.env` file

```powershell
# From inside the backend folder:
Copy-Item .env.example .env
```

Then open `.env` in a text editor and replace the placeholder with your real key:

```
ORS_API_KEY=<your_real_token_here>
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

### 3. Install dependencies

```powershell
cd C:\Users\dilee\OneDrive\Desktop\smartroute\backend
npm install
```

### 4. Start the backend

```powershell
# Production mode
npm start

# Development mode (auto-restarts on file changes, Node 18+)
npm run dev
```

The server starts on **http://localhost:5000** by default.

---

## API Endpoints

### `GET /api/health`

Liveness / readiness check. No API key required.

**Response example:**
```json
{
  "success": true,
  "status": "ok",
  "service": "SmartRoute AI Backend",
  "version": "1.0.0",
  "timestamp": "2026-10-18T10:15:30.000Z",
  "orsKeyConfigured": true
}
```

---

### `GET /api/search?q=<place name>`

India-wide place / address / landmark search.

**Query parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `q`       | ✅ Yes   | Free-text search term (max 200 chars) |
| `size`    | ❌ No    | Number of results (1–10, default 5) |

**Response example:**
```json
{
  "success": true,
  "count": 3,
  "results": [
    {
      "label": "Chennai Central, Chennai, Tamil Nadu, India",
      "name": "Chennai Central",
      "lat": 13.08156,
      "lng": 80.27539,
      "type": "venue",
      "region": "Tamil Nadu",
      "confidence": 0.9
    }
  ]
}
```

---

### `POST /api/route`

Calculate a real road route between two named places in India.
Both places are geocoded first, then routed via ORS driving directions.

**Request body (JSON):**
```json
{
  "origin": "SRM University, Kattankulathur",
  "destination": "Chennai Central Railway Station"
}
```

**Response example:**
```json
{
  "success": true,
  "origin": {
    "label": "SRM Institute of Science and Technology, ...",
    "lat": 12.82333,
    "lng": 80.04422
  },
  "destination": {
    "label": "Chennai Central, ...",
    "lat": 13.08156,
    "lng": 80.27539
  },
  "route": {
    "distanceKm": 38.4,
    "durationSeconds": 3420,
    "durationText": "57 min",
    "geometry": [[12.82333, 80.04422], [12.828, 80.049], "..."],
    "instructions": [
      {
        "instruction": "Head north on NH-48",
        "distanceM": 2400,
        "durationSeconds": 180,
        "type": 11
      }
    ]
  },
  "note": "Road distance and duration are free-flow estimates from OpenRouteService using OpenStreetMap data. No live traffic data is included."
}
```

---

## Testing all endpoints with PowerShell

> Run these commands after starting the backend with `npm start`.

### Health check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" | ConvertTo-Json -Depth 5
```

### Place search — city
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/search?q=Mumbai" | ConvertTo-Json -Depth 5
```

### Place search — landmark with size parameter
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/search?q=India+Gate,+Delhi&size=3" | ConvertTo-Json -Depth 5
```

### Place search — town
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/search?q=Coimbatore" | ConvertTo-Json -Depth 5
```

### Route — SRM University to Chennai Central
```powershell
$body = @{ origin = "SRM University Kattankulathur"; destination = "Chennai Central" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/route" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Route — Mumbai to Pune
```powershell
$body = @{ origin = "Mumbai"; destination = "Pune" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/route" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Route — Delhi to Agra (Taj Mahal)
```powershell
$body = @{ origin = "New Delhi Railway Station"; destination = "Taj Mahal, Agra" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/route" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

### Error case — missing destination
```powershell
$body = @{ origin = "Bengaluru" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/route" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json
```

### Error case — same origin and destination
```powershell
$body = @{ origin = "Chennai"; destination = "Chennai" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/route" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json
```

---

## Connecting the frontend

The frontend (`smartroute/smartroute/`) is **not modified** by this backend. To
wire the Route Planner to the real backend API, make a `POST /api/route` call
from `RoutePlanner.jsx` and replace the static route data with the live response.

Example fetch call (add to RoutePlanner.jsx when ready):
```js
const response = await fetch("http://localhost:5000/api/route", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ origin: start, destination }),
});
const data = await response.json();
// data.route.distanceKm, data.route.durationText, data.route.geometry, …
```

The `geometry` field is an array of `[lat, lng]` pairs ready for a Leaflet
`<Polyline positions={data.route.geometry} />`.

---

## Security features

| Feature | Implementation |
|---------|---------------|
| CORS | Only `ALLOWED_ORIGINS` from `.env` are permitted |
| Helmet | Strict HTTP security headers |
| Rate limiting | 120 requests / minute / IP |
| Input validation | All request parameters validated before any external call |
| API key isolation | Key never sent to the client, only used server-side |
| Timeout | All ORS requests time out after 10 seconds |
| Error transparency | No internal stack traces or secrets in error responses |

---

## Data sources and disclaimers

- **Geocoding**: ORS Pelias geocoder, backed by OpenStreetMap + OpenAddresses + Who's On First
- **Routing**: ORS OSRM engine using OpenStreetMap road network
- **Traffic**: ⚠️ **No live traffic data is used or claimed.** Durations are free-flow travel time estimates only.
- **Coverage**: OpenStreetMap has excellent India coverage including cities, towns, villages, major roads and highways.
