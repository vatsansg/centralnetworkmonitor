# Deployment Guide — Central Network Monitor

## Prerequisites

- Node.js 22.5+
- npm 10+
- Azure CLI (`az` command)
- An Azure account with an active subscription
- Resource group: `rgnetworkmonitoringapp`

## Fresh Deployment

### 1. Clone and install

```bash
git clone https://github.com/vatsansg/centralnetworkmonitor.git
cd centralnetworkmonitor
npm install
cp .env.example backend/.env
# Edit backend/.env — set JWT_SECRET and AZURE_STORAGE_CONNECTION_STRING
```

### 2. Create App Service Plan

```bash
az appservice plan create \
  --name centralmonitor-plan \
  --resource-group rgnetworkmonitoringapp \
  --sku B1 \
  --is-linux \
  --location southeastasia
```

### 3. Create Web App

```bash
az webapp create \
  --name <YOUR_APP_NAME> \
  --resource-group rgnetworkmonitoringapp \
  --plan centralmonitor-plan \
  --runtime "NODE:22-lts"
```

### 4. Set Application Settings

```bash
az webapp config appsettings set \
  --name <YOUR_APP_NAME> \
  --resource-group rgnetworkmonitoringapp \
  --settings \
    NODE_ENV=production \
    PORT=3001 \
    JWT_SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')" \
    JWT_EXPIRES_IN=24h \
    DB_PATH="./data/centralmonitor.db" \
    LOG_LEVEL=info \
    AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=sanetworkmonitoringapp;AccountKey=<KEY>;EndpointSuffix=core.windows.net" \
    AZURE_STORAGE_CONTAINER=allvenuesource \
    SMTP_FROM="noreply@centralmonitor.local"
```

### 5. Build and deploy

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Package
zip -r deploy.zip backend/ frontend/dist/ package.json

# Deploy
az webapp deployment source config-zip \
  --name <YOUR_APP_NAME> \
  --resource-group rgnetworkmonitoringapp \
  --src deploy.zip
```

### 6. Set startup command

```bash
az webapp config set \
  --name <YOUR_APP_NAME> \
  --resource-group rgnetworkmonitoringapp \
  --startup-file "node --experimental-sqlite backend/server.js"
```

### 7. Deploy the WebJob

```bash
cd webjob && npm install --omit=dev && cd ..
zip -r cleanup-webjob.zip webjob/

az webapp webjob triggered upload \
  --name <YOUR_APP_NAME> \
  --resource-group rgnetworkmonitoringapp \
  --webjob-name cleanup \
  --webjob-file cleanup-webjob.zip
```

Set the schedule via Azure Portal: App Service → WebJobs → cleanup → Set Schedule → `0 0 2 * * *`

### 8. Verify

```bash
curl https://<YOUR_APP_NAME>.azurewebsites.net/health
# Expected: {"status":"ok","ts":"..."}
```

Open `https://<YOUR_APP_NAME>.azurewebsites.net` in a browser.

---

## Updating an Existing Deployment

```bash
git pull origin main
npm install
cd frontend && npm run build && cd ..
zip -r deploy.zip backend/ frontend/dist/ package.json
az webapp deployment source config-zip \
  --name <YOUR_APP_NAME> \
  --resource-group rgnetworkmonitoringapp \
  --src deploy.zip
```

## Running the WebJob Manually

```bash
# Locally (set env vars first):
node webjob/cleanup.js

# Via Azure CLI:
az webapp webjob triggered run \
  --name <YOUR_APP_NAME> \
  --resource-group rgnetworkmonitoringapp \
  --webjob-name cleanup
```

## Configuring SMTP (Email)

In Azure App Service Application Settings, set:

```
SMTP_HOST=smtp.yourmailserver.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
APP_URL=https://<YOUR_APP_NAME>.azurewebsites.net
```

If SMTP is not configured, user creation and password reset still work — credentials are logged to the console instead of emailed.

## Environment Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | 3001 | HTTP port |
| `NODE_ENV` | no | development | Set to `production` in Azure |
| `JWT_SECRET` | yes | — | 64-char random string |
| `JWT_EXPIRES_IN` | no | 24h | Token lifetime |
| `DB_PATH` | no | ./data/centralmonitor.db | SQLite file |
| `AZURE_STORAGE_CONNECTION_STRING` | yes | — | Azure Blob connection string |
| `AZURE_STORAGE_CONTAINER` | no | allvenuesource | Blob container name |
| `SMTP_HOST` | no | — | Leave blank to disable email |
| `SMTP_PORT` | no | 587 | SMTP port |
| `SMTP_USER` | no | — | SMTP auth username |
| `SMTP_PASS` | no | — | SMTP auth password |
| `SMTP_FROM` | no | noreply@centralmonitor.local | From address |
| `APP_URL` | no | http://localhost:5173 | App URL in invitation emails |

## Troubleshooting

**App won't start:**
- Check startup command: `node --experimental-sqlite backend/server.js`
- Check `NODE_ENV=production` is set
- View logs: `az webapp log tail --name <APP> --resource-group rgnetworkmonitoringapp`

**Blobs not loading:**
- Verify `AZURE_STORAGE_CONNECTION_STRING` in App Settings
- Check container name is `allvenuesource`
- Verify the storage account is accessible from the App Service region

**Email not sending:**
- Check SMTP settings — all four fields must be set
- `SMTP_HOST` being empty disables email silently
- Check logs for `[WARN] SMTP not configured`

**SQLite errors:**
- Ensure `DB_PATH` directory is writable by the App Service process
- Use `./data/centralmonitor.db` (relative to backend/)
- The `data/` directory is created automatically on first start
