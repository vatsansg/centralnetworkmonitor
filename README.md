# Central Network Monitor

A cloud-hosted central dashboard that reads venue health JSON snapshots from Azure Blob Storage and presents them as per-venue tabs.

## Quick Start

### Prerequisites
- Node.js 22.5+
- npm 10+

### Setup

```bash
# Install all dependencies
npm install

# Copy and configure environment
cp .env.example backend/.env
# Edit backend/.env with your values

# Start backend (terminal 1)
npm run dev:backend

# Start frontend (terminal 2)
npm run dev:frontend
```

Open http://localhost:5173

Default credentials: `admin` / `Admin@1234` (you will be forced to change on first login)

## Project Structure

```
centralnetworkmonitorapp/
├── backend/          Express API + SQLite
├── frontend/         React + Vite + Tailwind
├── webjob/           Azure WebJob cleanup script
└── qa/               API test suite
```

## Documentation

- [Architecture](ARCHITECTURE.md)
- [User Guide](USER_GUIDE.md)
- [Deployment](DEPLOYMENT.md)
- [QA Test Cases](QA_TEST_CASES.md)
