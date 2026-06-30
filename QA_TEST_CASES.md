# QA Test Cases — Central Network Monitor

## Authentication

- [ ] Login with `admin` / `Admin@1234` → success, redirected to Change Password
- [ ] Login with wrong password → 401 error shown inline
- [ ] Login with inactive user → 403 error
- [ ] Must-change-password gate: sidebar and dashboard inaccessible until password is changed
- [ ] Change password with wrong current password → error shown
- [ ] Change password with new password that doesn't meet complexity → error shown
- [ ] Change password success → must_change_password cleared, redirected to dashboard
- [ ] JWT expiry: after token expires, all API calls return 401 → auto-redirect to login
- [ ] Logout button → clears JWT, redirects to /login, back button doesn't re-enter app

## Dashboard — Empty State

- [ ] When container has no blobs → "No Active Events" state shown, tab bar hidden
- [ ] Refresh button in empty state → re-polls Azure and updates if blobs now present
- [ ] When last blob is deleted while dashboard is open → next 60s refresh shows empty state

## Dashboard — Venues

- [ ] Container with multiple blobs → one tab per blob, label = venue_id
- [ ] Tabs sorted alphabetically (except favourite pinned first)
- [ ] Clicking a tab → loads that venue's data
- [ ] Stale blob (generated_at > 30 min ago) → yellow warning dot on tab
- [ ] Very stale blob (> 48h) → WebJob would have deleted it (test separately)
- [ ] generated_at in tab tooltip shows "Last updated X minutes ago"
- [ ] Auto-refresh fires every 60s — "Last refreshed" time updates in header

## Dashboard Panels

- [ ] Device Summary: correct counts for up/down/warning/unknown/total
- [ ] Internet Status: shows ONLINE (green) or OFFLINE (red) with correct down-since time
- [ ] VLAN list: shows active VLANs with subnet
- [ ] Down Devices panel: hidden if down_devices is empty; shows table if not
- [ ] Top Latency: shows correct values, status colour matches
- [ ] Top CPU: hidden if all cpu_usage values are null
- [ ] Top Temperature: hidden if all last_temperature values are null
- [ ] Recent Events: 20 events, severity colour-coded correctly
- [ ] All panels correctly apply dark/light theme

## PDF Snapshot

- [ ] Snapshot button opens a new browser tab/window
- [ ] Print dialog auto-triggers in the new window
- [ ] Header shows Venue ID, Event Name, date, local time + TZ abbreviation + UTC time
- [ ] All panels appear in the print output
- [ ] Footer shows generation time
- [ ] Works correctly for both dark and light theme user (output is always light/printable)

## Favourites

- [ ] Star a venue → star fills, tab moves to first position
- [ ] Un-star → star unfills, tab moves back to alphabetical position
- [ ] On login → favourite tab is automatically the active tab
- [ ] Favourite blob deleted while logged in → next refresh clears favourite, switches to first tab
- [ ] Favourite blob deleted before login → after login, no favourite active, defaults to first tab
- [ ] Only one favourite per user (setting a new one replaces the old one)

## User Management (Admin)

- [ ] Admin can see all users in Settings → User Management
- [ ] Non-admin users cannot see User Management section
- [ ] Create user → credentials email sent (or logged if SMTP not set), user appears in list with must_change_password = 1
- [ ] New user logs in with temporary password → must change password gate
- [ ] Admin can reset any user's password → email sent, must_change_password = 1 reset
- [ ] Admin cannot delete own account → error shown
- [ ] Admin cannot delete the last admin → error shown
- [ ] Toggle user active/inactive → inactive user cannot login

## Theme

- [ ] Default theme is dark
- [ ] Toggle to light → all panels update immediately
- [ ] Theme preference persists on page reload
- [ ] Theme preference is per-user (two users with different themes each see their own)

## WebJob

- [ ] Run `node webjob/cleanup.js` locally
- [ ] Blobs with generated_at within 48h → logged as KEPT
- [ ] Blobs with generated_at older than 48h → logged as DELETED and removed from container
- [ ] After cleanup, `GET /api/venues` no longer returns deleted venue
- [ ] Non-JSON blobs in the container → logged as ERROR, not deleted (graceful)
- [ ] Missing `AZURE_STORAGE_CONNECTION_STRING` → exits with error message

## API Tests (Automated — `node qa/api-tests.js`)

- [ ] Health check `GET /health`
- [ ] Login (success, failure, inactive user)
- [ ] `GET /api/auth/me` (authenticated, unauthenticated)
- [ ] `POST /api/auth/change-password`
- [ ] `GET /api/venues` — returns array
- [ ] `GET /api/venues/:venueId` — returns blob JSON or 404
- [ ] `POST /api/venues/refresh` — busts cache
- [ ] `GET /api/favourites` — returns null or venue_id
- [ ] `PUT /api/favourites` — sets favourite
- [ ] `DELETE /api/favourites` — clears favourite
- [ ] `GET /api/users` — 200 for admin, 401 for unauthenticated
- [ ] `POST /api/users` — creates user (admin)
- [ ] `PUT /api/users/:id/reset-password` — admin only
- [ ] `DELETE /api/users/:id` — admin only, cannot self-delete
