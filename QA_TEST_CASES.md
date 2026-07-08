# QA Test Cases — CentralNetworkMonitorApp

---

## Authentication

| # | Test | Expected result |
|---|---|---|
| A-01 | Login with `admin` / `Admin@1234` on fresh DB | Success — redirected to Settings → Change Password |
| A-02 | Login with correct username but wrong password | 401 "Invalid credentials" shown inline |
| A-03 | Login with unknown username | 401 "Invalid credentials" (no username hint) |
| A-04 | Login with inactive user account | 403 "Account is inactive" |
| A-05 | `must_change_password` gate: navigate to `/` directly | Sidebar and dashboard inaccessible until password changed |
| A-06 | Change password with wrong current password | Error "Current password is incorrect" |
| A-07 | Change password with new password not meeting complexity (< 8 chars, or no uppercase, no digit, no special) | Error "Password must be at least 8 characters..." |
| A-08 | Change password successfully | `must_change_password` cleared; redirected to dashboard |
| A-09 | Expired JWT (set a very short `JWT_EXPIRES_IN` like `1s` in dev) | All API calls return 401; auto-redirect to `/login` |
| A-10 | Logout button | JWT cleared from localStorage; redirect to `/login`; back button does not re-enter |

---

## Dashboard — Empty State

| # | Test | Expected result |
|---|---|---|
| E-01 | Container has no `.json` blobs | "No Active Events" message shown; tab bar hidden |
| E-02 | Click Refresh in empty state | Re-polls Azure; tab bar appears if blobs now exist |
| E-03 | Last blob deleted while dashboard is open | Next 60s auto-refresh shows empty state |

---

## Dashboard — Venue Tabs

| # | Test | Expected result |
|---|---|---|
| V-01 | Container has multiple blobs | One tab per blob, label = `venue_id` |
| V-02 | Tabs default order | Alphabetical by `venue_id` |
| V-03 | Click a tab | That venue's data loads; all panels update |
| V-04 | Blob with `generated_at` > 30 min ago | Yellow ⚠ icon on that tab |
| V-05 | Blob with `generated_at` > 48 hours | Blob NOT returned by `GET /api/venues` (filtered at API layer); tab not visible |
| V-06 | Auto-refresh | Header "Last refreshed" timestamp updates every 60s |
| V-07 | Stale time on tab hover / meta bar | Shows e.g. "5h 12m ago"; updates each minute |

---

## Device Summary Tiles

| # | Test | Expected result |
|---|---|---|
| DS-01 | Blob with known summary counts | Tiles show correct up / down / warning / unknown / total |
| DS-02 | Blob where all devices are up | Down tile shows 0 (red tile still visible) |

---

## Internet Status Panel

| # | Test | Expected result |
|---|---|---|
| IS-01 | `internet.status = "up"` | ONLINE badge (green) |
| IS-02 | `internet.status = "down"` with `down_since` set | OFFLINE badge (red) + "Down since HH:MM" row |
| IS-03 | `internet.speed_test = null` | Speed test section not rendered |
| IS-04 | `internet.speed_test.status = "success"` | ↓ Download (blue) and ↑ Upload (green) rows shown in Mbps |
| IS-05 | `internet.speed_test.status = "failed"` | Amber warning row shown; no speed values |
| IS-06 | Speed test "Last tested" relative time | Shows "X minutes ago"; updates every 30 seconds without page reload |
| IS-07 | Speed test "Last tested" includes local time | Shows `(HH:MM GMT±HH:MM)` in correct local timezone |

---

## VLAN Panel

| # | Test | Expected result |
|---|---|---|
| VL-01 | Blob with multiple VLANs | Each VLAN appears as a row with name, subnet, gateway |
| VL-02 | Blob with no VLANs | VLAN panel hidden or shows empty state |

---

## Down Devices Panel

| # | Test | Expected result |
|---|---|---|
| DD-01 | `down_devices` is empty | Panel hidden |
| DD-02 | `down_devices` has entries | Table shown with Name, IP, Type, Location, Last Seen |
| DD-03 | Device with `name: null` | Name column shows IP address |
| DD-04 | Device with `location_name` set | Location column shows the location string |
| DD-05 | Device with `location_name: null` | Location column empty or `—` |
| DD-06 | Device name | Shown in red colour |

---

## Top Latency Panel

| # | Test | Expected result |
|---|---|---|
| TL-01 | Devices with latency data | Sorted highest latency first; up to 8 devices |
| TL-02 | Device with `name: null` | Falls back to `ip_address` |
| TL-03 | Device with `location_name` set | Grey sub-line shows location below device name |
| TL-04 | Device with `location_name: null` | Sub-line shows `—` |
| TL-05 | Status colours | Green (normal), amber (warning), red (critical) match blob status field |

---

## Top CPU Panel

| # | Test | Expected result |
|---|---|---|
| TC-01 | Devices with `cpu_usage` data | Sorted highest first; up to 6 devices |
| TC-02 | Device with `name: null` | Falls back to `ip_address` |
| TC-03 | Device with `location_name` set | Grey sub-line shown |
| TC-04 | Device with `location_name: null` | Sub-line not shown (or empty) |
| TC-05 | All `cpu_usage` are null | Panel hidden |

---

## Top Temperature Panel

| # | Test | Expected result |
|---|---|---|
| TT-01 | Devices with temperature data | Sorted highest first; up to 6 devices |
| TT-02 | Device with `name: null` | Falls back to `ip_address` |
| TT-03 | Device with `location_name` set | Grey sub-line shown below device name |
| TT-04 | Device with `location_name: null` | Sub-line not shown (or empty) |
| TT-05 | All `last_temperature` are null | Panel hidden |

---

## Recent Events Panel

| # | Test | Expected result |
|---|---|---|
| RE-01 | Events with different severities | Critical = red, warning = amber, info = blue badges |
| RE-02 | Up to 20 events | All 20 shown; no pagination required |

---

## Dashboard Snapshot

| # | Test | Expected result |
|---|---|---|
| SN-01 | Click "Dashboard Snapshot" button | New browser window/tab opens; print dialog triggers automatically |
| SN-02 | Snapshot header | Shows Venue ID, Event Name, data timestamp, local + UTC time |
| SN-03 | Snapshot includes all panels | Summary tiles, internet status, speed test (if available), VLANs, down devices, top latency/CPU/temp, recent events |
| SN-04 | Speed test available | Speed test block appears in snapshot with ↓ Download and ↑ Upload |
| SN-05 | Speed test null | Speed test block absent from snapshot |
| SN-06 | Snapshot theme | Always light/printable regardless of user's dark/light theme |

---

## Favourite Venue

| # | Test | Expected result |
|---|---|---|
| F-01 | Click star on a tab | Star fills yellow; tab moves to first position |
| F-02 | Click star again | Star unfills; tab returns to alphabetical position |
| F-03 | Login with favourite set | Favourite tab is auto-selected on load |
| F-04 | Set favourite, then blob is deleted during session | Next 60s refresh clears favourite; first available tab becomes active |
| F-05 | Set favourite, logout, blob deleted before re-login | After login, no favourite active; defaults to first tab |
| F-06 | Set a second favourite | Replaces first (only one favourite per user) |

---

## User Management (Admin)

| # | Test | Expected result |
|---|---|---|
| UM-01 | Admin sees User Management section in Settings | Section visible with user list |
| UM-02 | Non-admin (viewer/operator) goes to Settings | User Management section not shown |
| UM-03 | Admin creates new user | User appears in list; email sent (or logged if SMTP off); `must_change_password = 1`; temp password shown in UI |
| UM-04 | New user logs in with temp password | Must-change-password gate on first login |
| UM-05 | Admin resets a user's password | New temp password generated; email sent; `must_change_password = 1` |
| UM-06 | Admin toggles user to inactive | That user's next login returns 403 |
| UM-07 | Inactive user logs in | 403 "Account is inactive" |
| UM-08 | Admin toggles user back to active | User can log in again |
| UM-09 | Admin tries to delete own account | Error "Cannot delete your own account" |
| UM-10 | Admin tries to delete the last admin | Error "Cannot delete the last admin account" |
| UM-11 | Admin deletes a non-admin user | User removed from list; their subsequent login fails |

---

## Theme

| # | Test | Expected result |
|---|---|---|
| TH-01 | Default theme | Dark |
| TH-02 | Toggle to light | All panels update immediately to light colours |
| TH-03 | Reload page after toggling | Theme preference persists |
| TH-04 | Two users with different theme settings | Each user sees their own theme |

---

## Blob Cleanup (In-Process Scheduler)

| # | Test | Expected result |
|---|---|---|
| CL-01 | Start backend — check logs | "blobCleanup: scheduler started (every 60min, stale after 48h)" in server log |
| CL-02 | Wait 5 minutes after startup | First cleanup run logged: "blobCleanup: scanning container=..." |
| CL-03 | Blob with `generated_at` within 48h | Logged as KEPT; blob remains in container |
| CL-04 | Blob with `generated_at` older than 48h | Logged as DELETED; blob removed from container |
| CL-05 | After cleanup, `GET /api/venues` | Deleted venue no longer appears |
| CL-06 | `AZURE_STORAGE_CONNECTION_STRING` not set | Log warning "AZURE_STORAGE_CONNECTION_STRING not set, skipping"; no crash |
| CL-07 | API listing with 49h-old blob | Blob is NOT returned by `GET /api/venues` (filtered at API layer, no wait for cleanup cycle) |

---

## API Smoke Tests

Run `node qa/api-tests.js` with `BACKEND_URL` set to the target server.

| # | Endpoint | Expected |
|---|---|---|
| AP-01 | `GET /health` | `{"status":"ok","ts":"..."}` |
| AP-02 | `POST /api/auth/login` — valid credentials | `200 {"token":"...","user":{...}}` |
| AP-03 | `POST /api/auth/login` — bad password | `401` |
| AP-04 | `GET /api/auth/me` — with valid token | `200` user object |
| AP-05 | `GET /api/auth/me` — no token | `401` |
| AP-06 | `GET /api/venues` — authenticated | `200` array of venue summaries |
| AP-07 | `GET /api/venues` — unauthenticated | `401` |
| AP-08 | `GET /api/venues/:venueId` — valid venue | `200` full blob JSON |
| AP-09 | `GET /api/venues/nonexistent` | `404` |
| AP-10 | `POST /api/venues/refresh` | `200` refreshed array |
| AP-11 | `GET /api/favourites` — no favourite set | `{"venue_id":null}` |
| AP-12 | `POST /api/favourites` with valid venue_id | `200 {"venue_id":"..."}` |
| AP-13 | `GET /api/favourites` — after setting | `{"venue_id":"..."}` |
| AP-14 | `DELETE /api/favourites` | `200 {"ok":true}` |
| AP-15 | `GET /api/users` — as admin | `200` user array |
| AP-16 | `GET /api/users` — as viewer | `403` |
| AP-17 | `GET /api/users` — unauthenticated | `401` |
| AP-18 | `POST /api/users` — as admin | `201 {id, username, email, role, temp_password}` |
| AP-19 | `PUT /api/users/:id/reset-password` — as admin | `200` |
| AP-20 | `DELETE /api/users/:id` — self-delete attempt | `400` |
| AP-21 | `POST /api/auth/change-password` — wrong current | `401` |
| AP-22 | `POST /api/auth/change-password` — weak new password | `400` |
| AP-23 | `POST /api/auth/change-password` — valid | `200 {"ok":true}` |
