# Architecture — CentralNetworkMonitorApp

---

## System Overview

```
 Venue Apps (Network Monitor v1.5.0)
         │
         │  Upload {venueId}.json to blob container (every N minutes)
         ▼
 Azure Blob Storage ─ Account: sanetworkmonitoringapp
         │             Container: allvenuesource
         │             Each file: {venueId}.json (schema v1.1)
         │
         │  @azure/storage-blob SDK v12 (read / delete)
         ▼
 ┌──────────────────────────────────────────────────────────┐
 │  Azure App Service Linux B1 — Node.js 22 LTS            │
 │  southeastasia — centralnetworkmonitor.azurewebsites.net │
 │                                                          │
 │  Express.js 4 API (backend/server.js)                    │
 │  ├── /api/auth         JWT login, password, prefs        │
 │  ├── /api/venues       Blob list + individual data       │
 │  ├── /api/users        Admin user management             │
 │  ├── /api/favourites   Per-user venue favourite          │
 │  ├── /health           Health check                      │
 │  └── static            Serves frontend/dist/ (prod)      │
 │                                                          │
 │  SQLite (node:sqlite built-in, DatabaseSync)             │
 │  └── backend/data/centralmonitor.db                      │
 │      ├── users                                           │
 │      ├── user_favourites                                 │
 │      └── system_settings                                 │
 │                                                          │
 │  In-process Blob Cleanup Scheduler                       │
 │  └── Runs at startup +5 min, then every 1 hour          │
 │      Deletes blobs where generated_at > 48h ago          │
 └──────────────────────────────────────────────────────────┘
         │
         │  HTTP/S — JWT Bearer auth
         ▼
 Browser SPA — React 18 + Vite 5
 ├── Polls GET /api/venues every 60s
 ├── Fetches GET /api/venues/:id on tab switch
 └── All state in AppContext (auth, venues, theme)
```

---

## Local Development Architecture

```
 backend/.env  ──→  Express (port 3001)
                     └── node:sqlite (./backend/data/centralmonitor.db)
                     └── @azure/storage-blob → Azure (same container)

 Vite dev server (port 5173)
 └── proxy /api → http://localhost:3001
 └── proxy /health → http://localhost:3001

 Browser → http://localhost:5173
```

---

## Components

| Component | Technology | Purpose |
|---|---|---|
| App Service | Node.js 22 LTS, Linux B1 | Express API + React SPA host |
| Blob Storage | `@azure/storage-blob` v12 | Source of all venue JSON data |
| SQLite | `node:sqlite` (Node 22 built-in) | Users, favourites, settings |
| In-process scheduler | `setTimeout` / `setInterval` | Stale blob cleanup (48h threshold) |
| Email | `nodemailer` + Gmail SMTP | User credential delivery |
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 | SPA dashboard |

> **Note**: Azure App Service on Linux does not support WebJobs. Blob cleanup is handled by an in-process Node.js scheduler that runs inside `server.js`.

---

## Data Flow

### Venue data path (read)
1. Venue app writes `{venueId}.json` to `allvenuesource` container
2. Browser polls `GET /api/venues` every 60 seconds
3. Backend iterates blobs, parses each JSON, filters out blobs older than 48h, returns sorted list (60s in-process cache)
4. User clicks a venue tab → browser fetches `GET /api/venues/{venueId}` → backend downloads that single blob

### Stale blob cleanup path (write)
1. Cleanup scheduler fires 5 minutes after server startup
2. Downloads each `.json` blob, checks `generated_at`
3. If older than `BLOB_STALE_HOURS` (default 48): deletes the blob
4. Repeats every 1 hour
5. `listVenueBlobs` also filters stale blobs from API responses immediately (dual protection — no UI wait for cleanup cycle)

---

## Blob JSON Schema (v1.1)

```
{venueId}.json
├── schema_version    "1.1"
├── venue_id          string
├── event_name        string
├── generated_at      ISO 8601 UTC (staleness reference)
├── app_version       string
├── internet
│   ├── status        "up" | "down"
│   ├── down_since    ISO 8601 | null
│   └── speed_test    { download_mbps, upload_mbps, tested_at, status } | null
├── summary           { up, down, warning, unknown, total }
├── vlans             [{ name, subnet, gateway }]
├── down_devices      [{ id, name, ip_address, status, last_seen, device_type_name, vlan_name, location_name }]
├── top_latency       [{ id, name, ip_address, last_ping_latency, last_ping_packet_loss, status, location_name }]
├── top_cpu           [{ id, name, ip_address, cpu_usage, location_name }]
├── top_temperature   [{ id, name, ip_address, last_temperature, last_cpu, last_memory, location_name }]
└── recent_events     [{ id, device_id, device_name, event_type, severity, message, timestamp, acknowledged }]
```

---

## Database Schema

```sql
-- Users and authentication
CREATE TABLE users (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  username             TEXT UNIQUE NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  password_hash        TEXT NOT NULL,
  role                 TEXT DEFAULT 'viewer' CHECK(role IN ('admin','operator','viewer')),
  theme                TEXT DEFAULT 'dark'   CHECK(theme IN ('dark','light')),
  is_active            INTEGER DEFAULT 1,
  must_change_password INTEGER DEFAULT 0,
  created_at           TEXT DEFAULT (datetime('now')),
  last_login           TEXT
);

-- One favourite venue per user
CREATE TABLE user_favourites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id   TEXT NOT NULL,
  UNIQUE(user_id)
);

-- Key-value settings store
CREATE TABLE system_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  description TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

---

## API Surface

### Auth — `/api/auth`
| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/login` | — | Returns JWT + user object |
| POST | `/logout` | — | Stateless (client drops token) |
| GET | `/me` | JWT | Current user info |
| POST | `/change-password` | JWT | Change own password |
| GET | `/preferences` | JWT | Get theme |
| PUT | `/preferences` | JWT | Update theme (`dark`/`light`) |

### Venues — `/api/venues`
| Method | Path | Auth required | Description |
|---|---|---|---|
| GET | `/` | JWT | List non-stale venues (60s cache) |
| GET | `/:venueId` | JWT | Full blob data for one venue |
| POST | `/refresh` | JWT | Bust cache, re-list immediately |

### Users — `/api/users` (admin role only)
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all users |
| POST | `/` | Create user, email temp password |
| PUT | `/:id` | Update role / active status |
| PUT | `/:id/reset-password` | Reset password, email new temp |
| DELETE | `/:id` | Delete user (not self, not last admin) |

### Favourites — `/api/favourites`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get current user's favourite `venue_id` |
| POST | `/` | Set favourite |
| DELETE | `/` | Clear favourite |

### System
| Method | Path | Description |
|---|---|---|
| GET | `/health` | `{"status":"ok","ts":"..."}` |
| GET | `/api/version` | App name and version |

---

## Caching

| Layer | What is cached | TTL | Bust mechanism |
|---|---|---|---|
| Backend | Blob list (`listVenueBlobs`) | 60 seconds | `POST /api/venues/refresh` |
| Frontend | Full venue data per tab | Until next 60s poll | Tab switch always fetches fresh |

---

## Security

| Concern | Implementation |
|---|---|
| Passwords | bcrypt, cost factor 10 |
| Tokens | JWT HS256, signed with `JWT_SECRET`, 24h expiry |
| Connection string | Read from `process.env` at call time; never module-cached or committed |
| SQL | Parameterised queries throughout (`DatabaseSync.prepare`) |
| Rate limiting | 500 req / 15 min (`express-rate-limit`) |
| HTTP headers | `helmet` middleware |
| CORS | Restricted to same origin in production |
| Roles | `admin` > `operator` > `viewer`; admin routes use `requireRole('admin')` middleware |

---

## Frontend Architecture

```
AppContext (React Context)
├── auth: { user, token, login(), logout() }
├── venues: VenueListItem[]          — polled every 60s
├── venueData: Map<venueId, blob>    — fetched on demand
├── activeVenueId: string | null
├── favourite: string | null
└── theme: 'dark' | 'light'

Page components
├── Login.jsx          — unauthenticated entry
├── Dashboard.jsx      — venue tab bar + VenueDashboard
└── Settings.jsx       — password change + user management

Dashboard components
├── VenueDashboard.jsx           — orchestrates all panels
├── DeviceSummary.jsx            — up/down/warning/unknown/total tiles
├── InternetStatusPanel.jsx      — online/offline + speed test rows
├── VlanPanel.jsx                — VLAN table
├── DownDevicesPanel.jsx         — down devices table
├── TopLatencyPanel.jsx          — top latency list
├── TopCPUPanel.jsx              — top CPU list
├── TopTemperaturePanel.jsx      — top temperature list
├── RecentEventsPanel.jsx        — recent events list
└── SnapshotButton.jsx           — opens print popup
```

---

## Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `AZURE_STORAGE_CONNECTION_STRING` | **yes** | — | Never commit; use `.env` or App Setting |
| `AZURE_STORAGE_CONTAINER` | no | `allvenuesource` | Blob container name |
| `JWT_SECRET` | **yes** | — | Min 32 chars |
| `JWT_EXPIRES_IN` | no | `24h` | Token lifetime |
| `PORT` | no | `3001` (dev) / `8080` (Azure) | HTTP port |
| `NODE_ENV` | no | `development` | Set `production` in Azure |
| `BLOB_STALE_HOURS` | no | `48` | Hours before a blob is considered stale |
| `SMTP_HOST` | no | — | Leaving blank disables email |
| `SMTP_PORT` | no | `587` | |
| `SMTP_USER` | no | — | |
| `SMTP_PASS` | no | — | |
| `SMTP_FROM` | no | — | |
