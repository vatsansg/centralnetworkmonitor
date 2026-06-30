# Architecture — Central Network Monitor

## System Overview

```
Venue Apps (Network Monitor v1.5.0)
        |
        | Upload {venueId}.json every N minutes
        v
 Azure Blob Storage (sanetworkmonitoringapp)
        |  Container: allvenuesource
        |
        | @azure/storage-blob SDK (read)
        v
 Azure App Service (Linux, Node.js 22)
  ┌─────────────────────────────────┐
  │  Express.js API (backend/)      │
  │  ├── /api/auth                  │
  │  ├── /api/venues  ──────────────┼──→  Blob cache (60s TTL)
  │  ├── /api/users                 │
  │  ├── /api/favourites            │
  │  └── static (frontend/dist/)    │
  │                                 │
  │  SQLite (node:sqlite built-in)  │
  │  └── users, favourites, settings│
  └─────────────────────────────────┘
        |
        | HTTP (JWT auth)
        v
  Browser (React 18 + Vite)
  └── Polls every 60s

 Azure WebJob (webjob/cleanup.js)
  └── Daily CRON: delete blobs older than 48h
```

## Components

| Component | Technology | Purpose |
|---|---|---|
| App Service | Node.js 22, Linux B1 | Hosts Express API + React SPA |
| Blob Storage | @azure/storage-blob v12 | Source of venue JSON data |
| SQLite | node:sqlite (built-in) | Users, sessions, favourites |
| WebJob | Node.js standalone | Cleanup stale blobs daily |

## Data Flow

1. Venue app uploads `{venueId}.json` to `allvenuesource` container
2. Frontend polls `GET /api/venues` every 60 seconds
3. Backend reads all blobs, parses JSON, returns sorted list (60s cache)
4. Frontend fetches full blob on tab switch via `GET /api/venues/:venueId`
5. WebJob runs at 02:00 UTC, deletes blobs with `generated_at` older than 48h

## API Endpoints

### Auth `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /login | none | Returns JWT + user info |
| POST | /logout | any | Stateless 200 OK |
| GET | /me | any | Current user from JWT |
| POST | /change-password | any | Change own password |
| GET | /preferences | any | Get theme |
| PUT | /preferences | any | Update theme |

### Venues `/api/venues`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | any | List all venue blobs (60s cache) |
| GET | /:venueId | any | Full JSON blob for a venue |
| POST | /refresh | any | Bust cache, re-list |

### Users `/api/users` (admin only)
| Method | Path | Description |
|---|---|---|
| GET | / | List all users |
| POST | / | Create user, send credentials by email |
| PUT | /:id | Update role/active status |
| PUT | /:id/reset-password | Generate new password, email it |
| DELETE | /:id | Delete user |

### Favourites `/api/favourites`
| Method | Path | Description |
|---|---|---|
| GET | / | Get current user's favourite venue |
| PUT | / | Set favourite (validates blob exists) |
| DELETE | / | Clear favourite |

## Database Schema

```sql
users (id, username, email, password_hash, role, theme, is_active, must_change_password, created_at, last_login)
user_favourites (id, user_id, venue_id, created_at) -- UNIQUE(user_id)
system_settings (key, value, description, updated_at)
```

## Caching Strategy

- Blob list: in-process, 60-second TTL, busted by `POST /api/venues/refresh`
- Venue data: client-side per-tab cache in AppContext (`venueData` map)
- Auth: stateless JWT, 24h expiry, no server-side session

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `AZURE_STORAGE_CONNECTION_STRING` | `.env` / App Settings | Never in source control |
| `AZURE_STORAGE_CONTAINER` | `.env` / App Settings | Default: `allvenuesource` |
| `JWT_SECRET` | `.env` / App Settings | 64-char random string |
| `JWT_EXPIRES_IN` | `.env` / App Settings | Default: `24h` |
| `DB_PATH` | `.env` / App Settings | SQLite file path |
| `PORT` | `.env` / App Settings | Default: `3001` |
| `SMTP_*` | `.env` / App Settings | Optional email config |

## Security Model

- JWT signed with `JWT_SECRET`; verified on every protected request
- Passwords hashed with bcrypt (rounds=10)
- Connection string read from `process.env` at call time — never module-cached
- `.env` in `.gitignore` from commit 1
- Role-based access: admin > operator > viewer
- SQL uses parameterised queries throughout
- Helmet + rate-limiting on all routes
