# MAINPROMPT — Recreate CentralNetworkMonitorApp from Scratch

Copy the entire content of this file as your opening prompt in a new Claude Code session to build the CentralNetworkMonitorApp from scratch.

---

## System Prompt — CentralNetworkMonitorApp

Build a full-stack cloud-hosted network monitoring dashboard called **CentralNetworkMonitorApp**. The app reads venue health JSON blobs from an **Azure Blob Storage** container and displays them in a real-time dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 (`--experimental-sqlite` flag) |
| Backend | Express.js 4, JWT auth (jsonwebtoken + bcryptjs) |
| Database | SQLite via `node:sqlite` built-in (`DatabaseSync`) — no ORM |
| Frontend | React 18 + Vite 5, Tailwind CSS 3, lucide-react, recharts, date-fns |
| Storage | Azure Blob Storage (`@azure/storage-blob` v12) |
| Monorepo | npm workspaces — root → `backend/`, `frontend/` |
| Hosting | Azure App Service Linux B1, Node.js 22-lts |

---

## Repository & Azure Resources

- **GitHub repo**: `https://github.com/vatsansg/centralnetworkmonitor`
- **Azure App Service name**: `centralnetworkmonitor`
- **Resource group**: `rgnetworkmonitoringapp`
- **Region**: `southeastasia`
- **Storage account**: `sanetworkmonitoringapp`
- **Blob container**: `allvenuesource`

---

## Project Structure

```
centralazuremonitor/
├── package.json                  # root — npm workspaces
├── package-lock.json
├── .gitignore
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── data/                     # SQLite DB file (gitignored)
│   └── src/
│       ├── database/
│       │   ├── database.js       # DatabaseSync wrapper + all queries
│       │   ├── schema.js         # CREATE TABLE statements
│       │   └── seed.js           # Admin user + system_settings seed
│       ├── middleware/
│       │   └── auth.js           # verifyToken, requireRole
│       ├── routes/
│       │   ├── index.js          # registerRoutes()
│       │   ├── auth.js           # /api/auth/*
│       │   ├── users.js          # /api/users/* (admin only)
│       │   ├── venues.js         # /api/venues/*
│       │   └── favourites.js     # /api/favourites/*
│       ├── services/
│       │   ├── blobService.js    # listVenueBlobs, getVenueBlob, cache
│       │   ├── blobCleanup.js    # in-process cleanup scheduler
│       │   └── emailService.js   # nodemailer SMTP
│       └── utils/
│           └── logger.js         # winston + daily-rotate-file
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── client.js         # axios instance + api helpers
        ├── context/
        │   └── AppContext.jsx    # global state, auth, venues, theme
        ├── hooks/
        │   └── usePolling.js     # setInterval polling hook
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   └── Settings.jsx
        ├── components/
        │   ├── Layout/
        │   │   ├── Layout.jsx
        │   │   ├── Header.jsx
        │   │   └── Sidebar.jsx
        │   ├── Dashboard/
        │   │   ├── VenueDashboard.jsx
        │   │   ├── DeviceSummary.jsx
        │   │   ├── InternetStatusPanel.jsx
        │   │   ├── VlanPanel.jsx
        │   │   ├── DownDevicesPanel.jsx
        │   │   ├── TopLatencyPanel.jsx
        │   │   ├── TopCPUPanel.jsx
        │   │   ├── TopTemperaturePanel.jsx
        │   │   ├── RecentEventsPanel.jsx
        │   │   └── SnapshotButton.jsx
        │   └── common/
        │       ├── StatusBadge.jsx
        │       ├── Modal.jsx
        │       └── ThemeToggle.jsx
        └── services/
            └── snapshotService.js  # print snapshot popup
```

---

## Blob JSON Schema (v1.1)

Each `.json` file in the `allvenuesource` container represents one active venue:

```json
{
  "schema_version": "1.1",
  "venue_id": "3642",
  "event_name": "WTT US SMASH 2026",
  "generated_at": "2026-07-08T10:46:45.000Z",
  "app_version": "1.5.0",
  "internet": {
    "status": "up",
    "down_since": null,
    "speed_test": {
      "download_mbps": 96.98,
      "upload_mbps": 61.32,
      "tested_at": "2026-07-08T10:33:26.000Z",
      "status": "success"
    }
  },
  "summary": {
    "up": 45,
    "down": 3,
    "warning": 2,
    "unknown": 1,
    "total": 51
  },
  "vlans": [
    { "name": "Staff", "subnet": "192.168.10.0/24", "gateway": "192.168.10.1" }
  ],
  "down_devices": [
    {
      "id": 253,
      "name": "Switch-Floor1",
      "ip_address": "192.168.10.132",
      "status": "down",
      "last_seen": "2026-07-08T08:49:08.711Z",
      "device_type_name": "Linux OVR Server",
      "vlan_name": "Staff",
      "location_name": "Call Area"
    }
  ],
  "top_latency": [
    {
      "id": 12,
      "name": "AP-Floor2",
      "ip_address": "192.168.10.76",
      "last_ping_latency": 142,
      "last_ping_packet_loss": 0,
      "status": "warning",
      "location_name": "Media Tribune"
    }
  ],
  "top_cpu": [
    {
      "id": 5,
      "name": "Server-Main",
      "ip_address": "192.168.10.8",
      "cpu_usage": 87.3,
      "location_name": null
    }
  ],
  "top_temperature": [
    {
      "id": 7,
      "name": "Core-Switch",
      "ip_address": "192.168.10.10",
      "last_temperature": 72.4,
      "last_cpu": 45.2,
      "last_memory": 61.8,
      "location_name": null
    }
  ],
  "recent_events": [
    {
      "id": 1,
      "device_id": 253,
      "device_name": "Switch-Floor1",
      "event_type": "status_change",
      "severity": "critical",
      "message": "Device went offline",
      "timestamp": "2026-07-08T08:49:08.000Z",
      "acknowledged": false
    }
  ]
}
```

**Rules:**
- `speed_test` is `null` when no test has been run. `status` is `"success"` or `"failed"`.
- On a failed speed test, `download_mbps` and `upload_mbps` are `null`.
- `location_name` on devices is `null` when not configured.
- Blobs older than **48 hours** (based on `generated_at`) are filtered from the API and deleted by the cleanup scheduler.

---

## SQLite Database Schema

```sql
CREATE TABLE users (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  username             TEXT UNIQUE NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  password_hash        TEXT NOT NULL,
  role                 TEXT DEFAULT 'viewer' CHECK(role IN ('admin', 'operator', 'viewer')),
  theme                TEXT DEFAULT 'dark' CHECK(theme IN ('dark', 'light')),
  is_active            INTEGER DEFAULT 1,
  must_change_password INTEGER DEFAULT 0,
  created_at           TEXT DEFAULT (datetime('now')),
  last_login           TEXT
);

CREATE TABLE user_favourites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id   TEXT NOT NULL,
  UNIQUE(user_id)
);

CREATE TABLE system_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TEXT DEFAULT (datetime('now'))
);
```

**Seed data**: Admin user `admin` / `Admin@1234` with `must_change_password = 1`.

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | — | Returns JWT token + user object |
| POST | `/logout` | — | Clears session (client drops token) |
| GET | `/me` | JWT | Current user info |
| POST | `/change-password` | JWT | Change own password |
| GET | `/preferences` | JWT | Get theme preference |
| PUT | `/preferences` | JWT | Update theme (`dark`/`light`) |

### Venues — `/api/venues`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List all non-stale venues (60s cache) |
| GET | `/:venueId` | JWT | Full venue blob data |
| POST | `/refresh` | JWT | Bust cache and re-list |

### Users — `/api/users` (admin only)
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all users |
| POST | `/` | Create user (auto-generates temp password, emails credentials) |
| PUT | `/:id` | Update role / active status |
| PUT | `/:id/reset-password` | Reset password, email new credentials |
| DELETE | `/:id` | Delete user (cannot delete self or last admin) |

### Favourites — `/api/favourites`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get favourite venue_id for current user |
| POST | `/` | Set favourite venue_id |
| DELETE | `/` | Clear favourite |

### System
| Method | Path | Description |
|---|---|---|
| GET | `/health` | `{"status":"ok","ts":"..."}` |
| GET | `/api/version` | App name + version |

---

## Environment Variables

### Backend `.env` (local only — never commit)
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=allvenuesource
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=CentralMonitor <your@email.com>
BLOB_STALE_HOURS=48
```

**Security rule**: `AZURE_STORAGE_CONNECTION_STRING` must only be stored in `.env` (local) or as an Azure App Service Application Setting (production). Never commit it to source control. Add `.env` to `.gitignore`.

---

## Frontend Configuration

`vite.config.js` — proxy `/api` and `/health` to backend in dev:
```js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/health': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
});
```

---

## Key Features to Implement

### 1. Dashboard
- Tab bar per venue (sorted alphabetically, favourite pinned first)
- Stale indicator (⚠ triangle) on tabs where `age_minutes > 30`
- Generated timestamp with blinking animation + elapsed time ("5h 12m ago")
- Auto-refresh every 60 seconds

### 2. Internet Status Panel
- ONLINE (green) / OFFLINE (red) with down-since time
- Speed test section (when `internet.speed_test` is not null):
  - ↓ Download and ↑ Upload in Mbps with lucide icons
  - "Last tested: X minutes ago (HH:MM GMT±HH:MM)" — relative time refreshing every 30s using `date-fns formatDistanceToNow`
  - Amber warning row when `status === "failed"`, no speeds shown

### 3. Device Summary Tiles
- Up (green) / Down (red) / Warning (amber) / Unknown (grey) / Total (blue)

### 4. Down Devices Panel
- Table: Name (fallback to IP), IP, Type, Location, Last Seen
- Name in red, location_name shown when present

### 5. Top Latency / CPU / Temperature Panels
- Show `location_name` as grey sub-line under device name (always rendered, `—` if null)
- Name falls back to `ip_address` when null

### 6. Recent Events Panel
- Severity badges: critical (red), warning (amber), info (blue)

### 7. Dashboard Snapshot
- Print-friendly popup via `window.open` + `window.print()`
- Includes: venue meta, summary tiles, internet status + speed test, VLANs, down devices, top latency, top CPU, top temperature, recent events

### 8. User Management (Admin)
- Create user → auto-generate temp password (`Cm` + 8 random alphanum + `!`), email via SMTP
- Show temp password in UI after creation
- Reset password, toggle active/inactive, change role, delete user
- Cannot delete self or last admin

### 9. Blob Cleanup Scheduler (in-process)
- Runs 5 minutes after server startup, then every 1 hour
- Deletes blobs where `generated_at` < `now - BLOB_STALE_HOURS`
- `listVenueBlobs` also filters stale blobs from API results immediately (no UI wait for cleanup)

### 10. Auth
- JWT, 24h expiry, stored in localStorage
- `must_change_password` flag → redirect to Settings on login
- Password policy: min 8 chars, uppercase + lowercase + digit + special char
- Rate limiting: 500 req / 15 min

### 11. Theme
- Dark (default) / Light toggle, persisted to DB per user
- Tailwind dark class on `<html>`

---

## Tailwind Dark Theme Color Palette

```js
// tailwind.config.js
colors: {
  dark: {
    900: '#0f1117', 800: '#161b27', 700: '#1e2535',
    600: '#252d3d', 500: '#2e3748', 400: '#3d4a5c'
  },
  accent: {
    blue: '#3b82f6', green: '#22c55e', red: '#ef4444',
    yellow: '#eab308', orange: '#f97316',
    cyan: '#06b6d4', purple: '#a855f7'
  }
}
```

---

## Azure App Service Application Settings (Production)

Set these in the Azure portal or via `az webapp config appsettings set`:

```
AZURE_STORAGE_CONNECTION_STRING = <connection string>
AZURE_STORAGE_CONTAINER         = allvenuesource
JWT_SECRET                      = <min 32 char secret>
JWT_EXPIRES_IN                  = 24h
PORT                            = 8080
NODE_ENV                        = production
SMTP_HOST                       = smtp.gmail.com
SMTP_PORT                       = 587
SMTP_USER                       = <email>
SMTP_PASS                       = <app password>
SMTP_FROM                       = CentralMonitor <email>
BLOB_STALE_HOURS                = 48
SCM_DO_BUILD_DURING_DEPLOYMENT  = false
```

**Startup command** (set in Configuration → General Settings):
```
bash /home/site/wwwroot/startup.sh
```

---

## startup.sh (deployed with the app)

```bash
#!/bin/bash
set -e
cd /home/site/wwwroot/backend
if [ ! -d node_modules ]; then
  echo "[startup] Installing backend dependencies..."
  npm install --omit=dev --no-fund --loglevel=error
  echo "[startup] Dependencies installed."
fi
cd /home/site/wwwroot
exec node --experimental-sqlite backend/server.js
```

---

## Deployment (Azure Zip Deploy)

Because `Compress-Archive` on Windows stores backslash paths that Linux rsync rejects, use the .NET `ZipArchive` API to build the zip:

```powershell
Add-Type -AssemblyName "System.IO.Compression"
Add-Type -AssemblyName "System.IO.Compression.FileSystem"

$stage = "C:\path\to\deploy-stage"   # staging dir with source + frontend/dist
$zipPath = "deploy.zip"

$fs  = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::ReadWrite)
$zip = [System.IO.Compression.ZipArchive]::new($fs, [System.IO.Compression.ZipArchiveMode]::Create)
Get-ChildItem $stage -Recurse -File | ForEach-Object {
  $entry = $_.FullName.Substring($stage.Length + 1).Replace("\", "/")
  $e = $zip.CreateEntry($entry, [System.IO.Compression.CompressionLevel]::Optimal)
  $es = $e.Open(); $ss = [System.IO.File]::OpenRead($_.FullName)
  $ss.CopyTo($es); $ss.Close(); $es.Close()
}
$zip.Dispose(); $fs.Close()

az webapp deployment source config-zip `
  --resource-group rgnetworkmonitoringapp `
  --name centralnetworkmonitor `
  --src deploy.zip --timeout 600
```

The staging directory must **not** contain `node_modules` — `startup.sh` installs them on first container start.

---

## npm workspace scripts (root package.json)

```json
{
  "scripts": {
    "dev:backend":  "npm run dev --workspace=backend",
    "dev:frontend": "npm run dev --workspace=frontend",
    "build":        "npm run build --workspace=frontend",
    "start":        "npm run start --workspace=backend"
  }
}
```
