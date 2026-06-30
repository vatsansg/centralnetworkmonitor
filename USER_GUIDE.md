# User Guide — Central Network Monitor

## Logging In

1. Navigate to the app URL
2. Enter your **Username** and **Password**
3. Click **Sign In**

**First Login (Admin):** Credentials are `admin` / `Admin@1234`. You will be taken directly to Settings → Change Password. You cannot access the dashboard until the password is changed.

**New User First Login:** You will receive your temporary credentials by email. On first login you will be redirected to Change Password automatically.

## Must-Change-Password Flow

A banner appears: "You must change your password before continuing." The sidebar and dashboard are locked until you complete the form. Enter your temporary password as the current password, then set a new one meeting the requirements (8+ chars, uppercase, lowercase, number, special character).

## Dashboard — Venue Tabs

Once logged in, the top area shows a tab for each active venue. Each tab label is the venue ID (e.g. `WTT135406`).

- **Click a tab** to view that venue's dashboard
- **Alphabetical order** by default; your favourite tab is pinned first
- **Yellow triangle** on a tab: data is more than 30 minutes old (stale)
- **Tooltip on hover**: shows "Last updated X min ago"

### No Active Events

If no venue data is available, the dashboard shows a large "No Active Events" message with a **Refresh** button. This refreshes the blob list from Azure.

## Dashboard Panels

Each venue tab shows:

| Panel | What it shows |
|---|---|
| **Meta bar** | Event name, Venue ID, app version, data timestamp, internet status |
| **Device Summary** | Tile counts: Up / Down / Warning / Unknown / Total |
| **Internet Status** | ONLINE (green) or OFFLINE (red) badge; down-since time if offline |
| **VLANs** | Active VLANs with subnet and gateway |
| **Down Devices** | Table of all devices currently down (hidden if none) |
| **Top Latency** | Top 8 devices by ping latency with status |
| **Top CPU** | Top 6 devices by CPU usage with bar indicators (hidden if no data) |
| **Top Temperature** | Top 6 devices by temperature (hidden if no data) |
| **Recent Events** | Last 20 events, severity colour-coded (red=critical, yellow=warning, blue=info) |

The dashboard **auto-refreshes every 60 seconds**. The header shows "Last refreshed: HH:MM:SS".

## PDF Snapshot

Click the **Dashboard Snapshot** button (bottom-right corner) to generate a print-ready view of the current venue dashboard. A new browser tab opens and the print dialog appears automatically. The snapshot includes all panels and a timestamp footer.

## Favourite Venue Tab

1. Click the **star icon** on any tab (or in the sidebar) to set it as your favourite
2. The favourite tab moves to the **first position** in the tab list and the star fills yellow
3. On your next login, the favourite tab opens automatically
4. To unset: click the star again

**If the blob is deleted:** On your next login (or next 60s refresh), the favourite is silently cleared and the first available tab becomes active.

## Auto-Refresh Behaviour

- Tab list refreshes every 60 seconds (polls `GET /api/venues`)
- Active venue data refreshes every 60 seconds
- Last refresh time shows in the header
- Click **Refresh** in the empty state to force an immediate poll

## Changing Your Password

1. Click the **Settings** icon (gear) in the header, or navigate to `/settings`
2. Under **Change Password**, enter your current password, then new password twice
3. Password requirements: 8+ characters, at least one uppercase letter, one number, one special character
4. Click **Change Password**

## Admin: User Management

Available only to admin users. In Settings → **User Management**:

- **View all users** with their role, status, and last login
- **+ Add User**: Enter username, email, role. A temporary password is generated and emailed
- **Toggle Active/Inactive**: Click the Active/Inactive badge. Inactive users cannot log in
- **Reset Password** (circular arrow icon): Generates a new temp password and emails it; user must change on next login
- **Delete User** (trash icon): Permanently removes the user. Cannot delete yourself or the last admin

## Theme

Click the **sun/moon icon** in the header to toggle dark/light theme. Your preference is saved and persists across sessions and devices.

## Logging Out

Click **Logout** in the header. You are redirected to the login page. The back button will not re-enter the app.
