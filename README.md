# Sentinel AI Control Center — Frontend

A standalone React frontend for the existing Sentinel AI FastAPI backend. It uses React, Vite, Tailwind CSS, Three.js (React Three Fiber), Recharts and Lucide icons.

**The backend is not modified.** This folder contains only frontend code. It does not add database tables, migrations, API routes or background services.

## 1. Requirements

- Node.js 20 or later (Node 22 is supported)
- npm
- The existing Sentinel AI FastAPI backend running
- A Sentinel AI administrator account for the full console

## 2. Install and run on Windows

Open Command Prompt in this folder:

```cmd
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:5173`.

By default, Vite proxies `/api` requests to `http://127.0.0.1:8000`, which is the existing backend address. Start the backend before signing in.

If your backend runs at another address, edit `.env.local`:

```env
VITE_DEV_PROXY_TARGET=http://127.0.0.1:8000
VITE_API_BASE_URL=
```

For a separately hosted backend, use the HTTPS origin:

```env
VITE_API_BASE_URL=https://your-sentinel-api.example.com
```

When using `VITE_API_BASE_URL` directly from the browser, add the frontend origin to the backend's `CORS_ORIGINS` setting and restart FastAPI. The backend's default CORS list is for localhost port 3000; Vite runs on port 5173. The development proxy avoids this CORS issue for local development.

## 3. Production build

```cmd
npm run build
npm run preview
```

The production files are created in `dist/`. Deploy `dist/` to a static web host. Set `VITE_API_BASE_URL` at build time to the backend HTTPS origin. Configure FastAPI `CORS_ORIGINS` to include the exact production frontend origin.

Do not expose the API over plain HTTP outside localhost. Use HTTPS for remote deployments.

## 4. Pages included

| Page | Purpose | Existing backend routes used |
|---|---|---|
| Overview | Dashboard metrics, recent events, event trend and endpoint summary | `GET /api/v1/dashboard/summary`, `/events`, `/agents`, `/incidents` |
| 3D agent fleet | Interactive Three.js endpoint topology with detailed workstation models, central Sentinel command rack and animated telemetry paths | `GET /api/v1/agents` |
| Endpoint agents | Enrolment token creation, endpoint inventory, pause/revoke permission requests and paused-agent reactivation | `GET /api/v1/agents`, `POST /api/v1/agents/enrollments`, `PATCH /api/v1/agents/{id}/status`, `POST /api/v1/permissions` |
| Security events | Severity filtering, search, event detail and selected-event AI investigation with explicit consent | `GET /api/v1/events`, `POST /api/v1/investigations` |
| Process monitor | Backend host information, process inventory, deterministic process detections and event ingestion | `GET /api/v1/system/info`, `/processes`, `/processes/detections`, `POST /api/v1/processes/detections/ingest` |
| Incidents | Correlation run, incident evidence and status updates | `GET /api/v1/incidents`, `POST /api/v1/incidents/correlate`, `PATCH /api/v1/incidents/{id}/status` |
| Network security | Network observations, asset registration and explicitly confirmed authorised Nmap scan | `GET /api/v1/network/summary`, `/network/observations`, `/assets`, `POST /api/v1/assets`, `/assets/{id}/scan` |
| Threat intelligence | Add, import, search, enable and disable IP/domain/SHA-256/URL indicators | `GET /api/v1/threat-intel/indicators`, `POST /api/v1/threat-intel/indicators`, `/import`, `PATCH /api/v1/threat-intel/indicators/{id}/status` |
| AI investigations | Investigation history and analysis reports | `GET /api/v1/investigations` |
| Response & approvals | Response recommendations, permission requests, approval/rejection and execution records | `GET /api/v1/response/recommendations`, `/permissions`, `POST /api/v1/permissions`, `/permissions/{id}/decision`, `GET /api/v1/permissions/{id}/execution` |
| System status | Health, database connection and API integration details | `GET /api/v1/health`, `/dashboard/summary` |

## 5. 3D agent fleet — what is real and what is visual

The 3D scene uses real records returned by `GET /api/v1/agents`:

- Device name and hostname
- Operating system and version
- Agent version and architecture
- Server-side credential status (`active`, `paused`, `revoked`)
- Last heartbeat (`last_seen`)
- Last reported IP address

Each endpoint is rendered as a detailed desktop workstation: monitor, display panel, keyboard, mouse, tower chassis, front cooling fans, visible motherboard, GPU and memory modules. The central rack represents the Sentinel AI API/command core.

The animated paths and moving data markers are a visual explanation of the telemetry connection. They are **not** live packet capture, network traffic measurements or a map of physical network links. The backend currently exposes heartbeat timestamps and agent records, not a WebSocket event stream or network topology API.

The fleet view refreshes its agent records every 30 seconds. Heartbeat labels are calculated from `last_seen`:

- Recently seen: heartbeat within 3 minutes
- Delayed heartbeat: heartbeat within 15 minutes
- Stale heartbeat: older than 15 minutes
- Awaiting heartbeat: no `last_seen` value

These are frontend display thresholds, not server-side agent states. The 3D page does not invent endpoint records; when no agent is enrolled, it shows the central command core and a waiting state.

## 6. Authentication and token handling

- Sign in uses `POST /api/v1/auth/login`.
- The profile is checked using `GET /api/v1/auth/me`.
- The access token is kept in React memory only. It is not written to localStorage or sessionStorage.
- Refreshing the browser clears the token and requires sign-in again, matching the existing backend dashboard's memory-only token behaviour.
- The browser uses the user JWT in the `Authorization: Bearer` header.
- The endpoint agent token is never requested by this frontend and is never shown in the browser.

## 7. Important safety behaviour preserved

- AI investigation requires a separate checkbox and explicit consent before the request is sent. The backend still checks `confirm_external_ai=true`, provider configuration, cooldown and daily budgets.
- Nmap scanning is disabled until an asset is registered as authorised and the user confirms the scan in a second step.
- Pause/revoke requests are sent to the permission workflow. The frontend does not call the agent status endpoint to pause or revoke directly.
- The approval screen asks for explicit confirmation for actions that require it.
- Only `pause_agent` and `revoke_agent` have automatic backend executors. These only change the Sentinel AI agent credential status; they do not modify Windows.
- Other approved actions remain manual and are shown as such.
- No local AI model, Redis, automatic port scanning, process termination, file deletion, firewall modification or Windows account disabling is added.

## 8. Backend API integration notes

The frontend uses the exact routes and request field names exposed by the supplied Sentinel AI backend. The API client is centralised in `src/lib/api.js` so future backend changes can be mapped in one place.

If a backend route is unavailable or returns an error, the page displays the API error instead of silently replacing it with fake data. Empty states are shown when the backend returns an empty list.

## 9. Folder structure

```text
sentinel-ai-frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── README.md
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── components/
    │   ├── Agent3DScene.jsx
    │   ├── AppShell.jsx
    │   └── ui.jsx
    ├── context/
    │   ├── AuthContext.jsx
    │   └── ToastContext.jsx
    ├── lib/
    │   ├── api.js
    │   └── format.js
    └── pages/
        ├── LoginPage.jsx
        ├── OverviewPage.jsx
        ├── FleetPage.jsx
        ├── AgentsPage.jsx
        ├── EventsPage.jsx
        ├── ProcessesPage.jsx
        ├── IncidentsPage.jsx
        ├── NetworkPage.jsx
        ├── ThreatIntelPage.jsx
        ├── InvestigationsPage.jsx
        ├── ResponsePage.jsx
        └── SystemPage.jsx
```

## 10. Notes

- The Process Monitor page reads the computer running the FastAPI backend because `/api/v1/system/info` and `/api/v1/processes` are backend-host collectors. It is not a remote endpoint process browser.
- Endpoint telemetry events can identify their agent in the `source` field, but the current backend does not expose per-agent event counts or a streaming feed. The frontend does not fabricate those values.
- The backend dashboard summary is an aggregate response. Some pages are administrator-only because the backend routes enforce administrator access.
- This frontend is a control interface for the existing defensive monitoring prototype, not a replacement for Windows Defender or a certified EDR product.
