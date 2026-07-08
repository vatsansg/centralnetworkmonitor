# User Guide — CentralNetworkMonitorApp

---

## Logging In

1. Navigate to the app URL (e.g. `https://centralnetworkmonitor.azurewebsites.net`)
2. Enter your **Username** and **Password**
3. Click **Sign In**

**First Login (Admin):** Default credentials are `admin` / `Admin@1234`. You will be redirected to Settings → Change Password immediately. The dashboard and sidebar are locked until the password is changed.

**New User First Login:** You will receive your temporary credentials by email. On first login you are automatically redirected to Settings → Change Password.

---

## Must-Change-Password Flow

A banner reads: *"You must change your password before continuing."* You cannot access the dashboard until the form is completed. Enter your temporary password as the current password, then set a new password that meets the requirements:

- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (e.g. `!@#$%^&*`)

---

## Dashboard — Venue Tabs

After logging in, a tab bar appears across the top of the page. Each tab represents one active venue currently reporting to the system.

- **Click a tab** to load that venue's dashboard
- **Alphabetical order** by default; your starred (favourite) venue is pinned first
- **Yellow triangle warning icon** on a tab: the data is more than 30 minutes old (stale)
- The meta bar below the tabs shows `generated_at` timestamp and elapsed time (e.g. "5h 12m ago") — the elapsed time updates every minute

### No Active Events

If no venue data is in the system, the dashboard shows a large "No Active Events" message with a **Refresh** button. Click it to immediately re-poll Azure.

---

## Dashboard Panels

Each venue tab contains the following panels:

### Device Summary (top tiles)

Five coloured tiles show device counts for the venue:

| Tile | Colour | Meaning |
|---|---|---|
| Up | Green | Devices responding normally |
| Down | Red | Devices not responding |
| Warning | Amber | Devices with elevated latency or partial issues |
| Unknown | Grey | Devices not yet polled |
| Total | Blue | All devices monitored |

### Internet Status

Shows whether the venue's internet connection is **ONLINE** (green) or **OFFLINE** (red).

- **OFFLINE**: Shows the time the connection went down ("Down since HH:MM")

**Speed Test section** (appears below when a speed test result is available):

| Row | What it shows |
|---|---|
| ↓ Download | Download speed in Mbps (blue) |
| ↑ Upload | Upload speed in Mbps (green) |
| Last tested | Relative time ("5 minutes ago") + local clock time + timezone |

If the last speed test failed, an amber warning row appears instead of the speed values.

### VLANs

A table listing the active VLANs at the venue:

| Column | Description |
|---|---|
| Name | VLAN name (e.g. Staff, Broadcast) |
| Subnet | Network address/prefix |
| Gateway | Default gateway IP |

### Down Devices

A table showing all devices currently offline. Hidden if no devices are down.

| Column | Description |
|---|---|
| Name | Device name (falls back to IP address if no name configured) |
| IP | IP address |
| Type | Device type (e.g. Switch, AP, Server) |
| Location | Physical location (e.g. "Call Area") |
| Last Seen | Timestamp of last successful contact |

Device names are shown in red. Rows with unknown devices show the IP address.

### Top Latency

Top 8 devices by ping latency, sorted highest first.

- Device name (falls back to IP) with a grey sub-line showing location
- Latency in milliseconds with status colour (green/amber/red)
- Packet loss percentage

### Top CPU

Top 6 devices by CPU usage. Hidden if no CPU data is available.

- Device name (falls back to IP) with grey location sub-line
- CPU usage as a percentage with a coloured bar indicator

### Top Temperature

Top 6 devices by recorded temperature. Hidden if no temperature data is available.

- Device name (falls back to IP) with grey location sub-line
- Temperature in °C with red/amber colouring for high values
- Also shows current CPU % and Memory % for context

### Recent Events

Up to 20 of the most recent events at the venue, newest first.

| Severity | Colour |
|---|---|
| Critical | Red |
| Warning | Amber |
| Info | Blue |

Each row shows: device name, event message, and how long ago it occurred.

---

## Auto-Refresh

- The dashboard auto-refreshes every **60 seconds**
- The header shows "Last refreshed: HH:MM:SS"
- Speed test relative times (e.g. "5 minutes ago") update every 30 seconds
- Click the **Refresh** button (empty state) or use `POST /api/venues/refresh` to force an immediate reload

---

## Dashboard Snapshot

Click the **Dashboard Snapshot** button (bottom-right of the dashboard) to generate a print-ready view of the current venue.

A new browser window opens and the print dialog appears automatically. The snapshot includes:

- Venue ID, event name, data timestamp
- All device summary tiles
- Internet status + speed test results
- VLANs table
- Down devices table
- Top latency, CPU, and temperature lists
- Recent events

The snapshot is always rendered in a light, printable style regardless of your theme setting.

---

## Favourite Venue

1. Click the **star icon** on any venue tab to make it your favourite
2. The starred tab moves to the **first position** in the tab list; the star fills yellow
3. On your next login, your favourite venue opens automatically
4. Click the star again to unset the favourite

If the blob for your favourite venue is deleted (e.g. event ended), the favourite is automatically cleared on the next refresh and the first available venue becomes active.

---

## Changing Your Password

1. Click the **Settings** (gear) icon in the header, or navigate to `/settings`
2. Under **Change Password**, fill in:
   - Current password
   - New password
   - Confirm new password
3. Click **Change Password**

The same complexity requirements apply: 8+ chars, uppercase, lowercase, number, special character.

---

## Theme

Click the **sun / moon icon** in the header to toggle between dark and light theme. Your preference is saved to your account and persists across sessions and devices.

---

## Admin: User Management

Available only to users with the **admin** role. Go to Settings → **User Management**.

### Add a User

1. Click **+ Add User**
2. Enter username, email address, and role (`viewer`, `operator`, or `admin`)
3. Click **Create User**

A temporary password is generated and emailed to the user. The password is also shown in the UI immediately after creation. The user will be forced to change their password on first login.

### Manage Existing Users

| Action | How |
|---|---|
| Toggle active/inactive | Click the Active / Inactive badge in the user's row |
| Change role | Edit the role dropdown in the user's row |
| Reset password | Click the circular arrow icon — a new temp password is generated and emailed |
| Delete user | Click the trash icon — cannot delete yourself or the last admin |

Inactive users cannot log in and receive a "Account is inactive" error if they try.

---

## Logging Out

Click **Logout** in the header. You are redirected to the login page. The back button will not re-enter the dashboard.

---

## Role Reference

| Role | Permissions |
|---|---|
| `viewer` | View dashboard, change own password, set own favourite and theme |
| `operator` | Same as viewer |
| `admin` | All viewer/operator permissions + create/edit/delete users, reset passwords |
