# Deployment Guide — CentralNetworkMonitorApp

---

## Local Development

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22.x (requires `--experimental-sqlite`) |
| npm | 10.x |
| Azure CLI | Latest (`az` in PATH) |
| Git | Any |

### 1. Clone and install

```powershell
git clone https://github.com/vatsansg/centralnetworkmonitor.git
cd centralnetworkmonitor
npm install
```

`npm install` at the root installs both `backend/` and `frontend/` dependencies via npm workspaces into the root `node_modules`.

### 2. Create the backend environment file

Create `backend/.env` — **never commit this file**:

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=sanetworkmonitoringapp;AccountKey=<key>;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=allvenuesource
JWT_SECRET=<at-least-32-random-characters>
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=<gmail-app-password>
SMTP_FROM=CentralMonitor <your@gmail.com>
BLOB_STALE_HOURS=48
```

Verify `.env` is listed in `.gitignore`:
```powershell
Select-String -Path ".gitignore" -Pattern "\.env"
```

### 3. Start the backend

```powershell
npm run dev:backend
```

Backend starts at `http://localhost:3001`. On first run:
- `backend/data/` directory is created
- `backend/data/centralmonitor.db` SQLite database is created with schema
- Admin user `admin` / `Admin@1234` is seeded (INSERT OR IGNORE — won't overwrite if already exists)
- Blob cleanup scheduler starts (runs after 5 min delay, then every hour)

### 4. Start the frontend

In a second terminal:

```powershell
npm run dev:frontend
```

Frontend starts at `http://localhost:5173`. Vite proxies all `/api` and `/health` requests to `http://localhost:3001`.

### 5. First login

- URL: `http://localhost:5173`
- Username: `admin`
- Password: `Admin@1234`
- You will be redirected to Settings → Change Password on first login (`must_change_password = 1`).

### Reset admin password (if locked out)

```powershell
node -e "const bcrypt=require('./node_modules/bcryptjs');const{DatabaseSync}=require('node:sqlite');const hash=bcrypt.hashSync('Admin@1234',10);const db=new DatabaseSync('./backend/data/centralmonitor.db');db.prepare('UPDATE users SET password_hash=?,must_change_password=0 WHERE username=?').run(hash,'admin');db.close();console.log('Done')"
```

---

## Azure Production Deployment

### Azure Resources

| Resource | Name |
|---|---|
| Subscription | WTT Live (`9d8eb79c-fd5b-4c17-a579-8aeec72e0125`) |
| Resource Group | `rgnetworkmonitoringapp` |
| App Service | `centralnetworkmonitor` |
| App Service Plan | `centralmonitor-plan` (Linux B1, southeastasia) |
| Storage Account | `sanetworkmonitoringapp` |
| Blob Container | `allvenuesource` |

**Live URL**: `https://centralnetworkmonitor.azurewebsites.net`

### Step 1 — Verify Azure subscription

```powershell
az account show
```

If "name" is not "WTT Live":
```powershell
az account set --subscription "9d8eb79c-fd5b-4c17-a579-8aeec72e0125"
```

### Step 2 — Build the frontend

```powershell
cd C:\vatsan\techprojects\INFRA\inframonitoringai\centralazuremonitor
npm run build
# Output: frontend/dist/
```

### Step 3 — Populate the staging directory

The staging directory must NOT contain `node_modules` — the startup script installs them on the container.

```powershell
$src = "C:\vatsan\techprojects\INFRA\inframonitoringai\centralazuremonitor"
$dst = "C:\Users\VatsanRamasubramania\AppData\Local\Temp\deploy-stage"

# Clear staging
Get-ChildItem $dst | Remove-Item -Recurse -Force

# Copy backend (excluding node_modules and data/)
$backendDst = Join-Path $dst "backend"
New-Item -ItemType Directory -Force $backendDst | Out-Null
Get-ChildItem "$src\backend" |
  Where-Object { $_.Name -notin @('node_modules', 'data') } |
  Copy-Item -Destination $backendDst -Recurse -Force

# Copy startup script
Copy-Item "$src\startup.sh" -Destination $dst -Force

# Copy built frontend
$frontendDst = Join-Path $dst "frontend\dist"
New-Item -ItemType Directory -Force $frontendDst | Out-Null
Copy-Item "$src\frontend\dist\*" -Destination $frontendDst -Recurse -Force
```

### Step 4 — Create the deployment zip

> **CRITICAL**: Do NOT use `Compress-Archive`. It writes backslash paths (`backend\src\routes\auth.js`) in the zip entries. Azure's Linux rsync rejects them and the deployment fails silently.

Use the .NET `ZipArchive` API, which lets you normalise paths to forward slashes:

```powershell
Add-Type -AssemblyName "System.IO.Compression"
Add-Type -AssemblyName "System.IO.Compression.FileSystem"

$stage   = "C:\Users\VatsanRamasubramania\AppData\Local\Temp\deploy-stage"
$zipPath = "C:\Users\VatsanRamasubramania\AppData\Local\Temp\deploy.zip"

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$fs  = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::ReadWrite)
$zip = [System.IO.Compression.ZipArchive]::new($fs, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem $stage -Recurse -File | ForEach-Object {
  $entryName = $_.FullName.Substring($stage.Length + 1).Replace("\", "/")
  $entry = $zip.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
  $entryStream = $entry.Open()
  $fileStream  = [System.IO.File]::OpenRead($_.FullName)
  $fileStream.CopyTo($entryStream)
  $fileStream.Close(); $entryStream.Close()
}
$zip.Dispose(); $fs.Close()
Write-Host "Created: $zipPath"
```

### Step 5 — Deploy

```powershell
az webapp deployment source config-zip `
  --resource-group rgnetworkmonitoringapp `
  --name centralnetworkmonitor `
  --src "C:\Users\VatsanRamasubramania\AppData\Local\Temp\deploy.zip" `
  --timeout 600
```

Expected output ends with:
```json
"status": "RuntimeSuccessful"
```

Azure runs `startup.sh` on container start:
1. Installs backend `node_modules` (only on first boot or if missing)
2. Starts `node --experimental-sqlite backend/server.js`

### Step 6 — Verify

```powershell
curl https://centralnetworkmonitor.azurewebsites.net/health
# Expected: {"status":"ok","ts":"..."}
```

---

## Azure App Service Configuration

### Application Settings

Set in Azure Portal → `centralnetworkmonitor` → Configuration → Application settings:

| Setting | Value |
|---|---|
| `AZURE_STORAGE_CONNECTION_STRING` | Full connection string |
| `AZURE_STORAGE_CONTAINER` | `allvenuesource` |
| `JWT_SECRET` | 32+ char random string |
| `JWT_EXPIRES_IN` | `24h` |
| `PORT` | `8080` |
| `NODE_ENV` | `production` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Gmail address |
| `SMTP_PASS` | Gmail App Password |
| `SMTP_FROM` | `CentralMonitor <email>` |
| `BLOB_STALE_HOURS` | `48` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` |

### General Settings

- **Startup command**: `bash /home/site/wwwroot/startup.sh`
- **Runtime stack**: Node.js 22 LTS
- **OS**: Linux

---

## Creating Azure Resources from Scratch

Only needed if deploying to a brand new Azure account:

```powershell
# Resource group
az group create --name rgnetworkmonitoringapp --location southeastasia

# App Service Plan
az appservice plan create `
  --name centralmonitor-plan `
  --resource-group rgnetworkmonitoringapp `
  --sku B1 --is-linux --location southeastasia

# Web App
az webapp create `
  --name centralnetworkmonitor `
  --resource-group rgnetworkmonitoringapp `
  --plan centralmonitor-plan `
  --runtime "NODE:22-lts"

# Startup command
az webapp config set `
  --name centralnetworkmonitor `
  --resource-group rgnetworkmonitoringapp `
  --startup-file "bash /home/site/wwwroot/startup.sh"

# Disable Oryx build (we pre-build)
az webapp config appsettings set `
  --name centralnetworkmonitor `
  --resource-group rgnetworkmonitoringapp `
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false

# Storage account
az storage account create `
  --name sanetworkmonitoringapp `
  --resource-group rgnetworkmonitoringapp `
  --location southeastasia --sku Standard_LRS

# Blob container
az storage container create `
  --name allvenuesource `
  --account-name sanetworkmonitoringapp
```

---

## GitHub

Repository: `https://github.com/vatsansg/centralnetworkmonitor`

```powershell
cd C:\vatsan\techprojects\INFRA\inframonitoringai\centralazuremonitor
git add <files>
git commit -m "message"
git push origin main
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `ResourceGroupNotFound` | Wrong Azure subscription | `az account set --subscription "9d8eb79c-..."` |
| Deployment succeeds but app crashes | Missing Application Setting | Check all env vars in Azure Portal |
| `Cannot find module 'node:sqlite'` | Node < 22 | Set Runtime Stack to Node 22 LTS |
| Zip deploy succeeds but app doesn't start | Backslash paths in zip | Use .NET ZipArchive (not Compress-Archive) |
| Login fails locally (Admin@1234) | Password was changed or DB stale | Run reset admin password one-liner above |
| No venues showing | Container empty or wrong connection string | Check `AZURE_STORAGE_CONNECTION_STRING` |
| Stale venue still in API for up to 60s | 60s blob list cache | By design; max 60s delay after blob update |
| Blob cleanup not running | `AZURE_STORAGE_CONNECTION_STRING` missing | Check env vars; server logs at startup confirm scheduler started |
| Email not sending | SMTP settings missing or incorrect | All 4 SMTP fields required; check server logs |
