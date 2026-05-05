# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## Project Overview

Zeta 智能交易系统 — a React-based intelligent trading management system with a Node.js/Express backend and PostgreSQL database. The system integrates psychological testing, trading strategy evaluation, and risk modeling to assist with trading decisions.

## Development Environment

- **OS**: Windows 11 (Chinese locale)
- **Shell**: bash (Git Bash)
- **IDE**: CodeBuddy
- **Language**: Chinese (all UI text and documentation)

## Architecture

### Three-tier Docker Compose Architecture

```
Frontend (Vite, port 5173) → Backend (Express, port 3001) → PostgreSQL 16 (port 5432)
```

In development, Vite proxies `/api` and `/health` to the backend (`localhost:3001`).

### Frontend (React 18 + Vite 7)

- **State management**: Zustand with localStorage persistence (`src/store/useStore.js`)
- **Routing**: React Router v6 (`src/App.jsx`)
- **Styling**: Tailwind CSS 3 with custom glass-morphism design
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date handling**: date-fns

### Backend (Express + PostgreSQL)

- **Entry**: `backend/src/server.js` — Express server with helmet, CORS, rate limiting, compression, morgan logging
- **Database**: PostgreSQL via `pg` pool (`backend/src/config/database.js`)
- **API routes**: `backend/src/routes/api.js` — all routes under `/api`
- **Query helpers**: `backend/src/database/queries.js` — `findAll`, `findById`, `insert`, `update`, `remove` (soft delete), `restore`, `bulkInsert`, etc.
- **Migrations**: `backend/migrations/` — SQL migration files, run via `npm run migrate`

### Key Patterns

- **Data sync**: On app load and page focus, `DataSync` component in `App.jsx` fetches `GET /api/sync/all` and imports all tables into Zustand store. Store persists to localStorage.
- **Soft delete**: Most tables use `deleted` (boolean) + `deleted_at` (timestamp) columns. Queries filter `WHERE deleted = false` by default.
- **Cache versioning**: `localStorage.clear()` runs on app load if the cache version tag has changed (defined in `App.jsx`).

## Build & Run Commands

```bash
# Frontend dev server (port 5173)
npm run dev

# Backend dev server (port 3001)
cd backend && npm run dev

# Docker Compose (all services)
docker-compose up --build

# Local deployment script (Windows)
./DEPLOY_LOCAL.bat
```

## Database Operations

```bash
cd backend
npm run init-db          # Initialize database tables
npm run migrate          # Run migrations
npm run migrate:verify   # Verify migration state
npm run backup           # Backup database
npm run restore          # Restore from backup
npm run db:export        # Export schema + data
npm run db:import        # Import schema + data
npm run db:incremental   # Incremental schema export
```

## Page Routes & Modules

| Route | Component | Description |
|---|---|---|
| `/` | `Home.jsx` | Landing page with robot animation and stats |
| `/daily-work` | `DailyWork.jsx` | Maintain global asset prices (stocks, crypto, forex) |
| `/psychological-test` | `PsychologicalTest.jsx` | Daily psychological state assessment (5 indicators) |
| `/trading-strategy` | `TradingStrategy.jsx` | Buy/sell strategy management with scoring |
| `/risk-model` | `RiskModel.jsx` | Risk models (conservative/balanced/aggressive) with position calculator |
| `/order-management` | `OrderManagement.jsx` | Order workflow: psych test → strategy → risk → execute |
| `/trade-records` | `TradeRecords.jsx` | Buy/sell records with P&L analysis |
| `/transaction-history` | `TransactionHistory.jsx` | Account ledger with deposits/withdrawals |
| `/stock-pool` | `StockPool.jsx` | Stock watchlist with real-time quotes |
| `/technical-indicators` | `TechnicalIndicators.jsx` | Technical analysis (MACD, RSI, BOLL, etc.) |

## Navigation Structure

- **首页** (Home) — top nav
- **交易** (Trading) — top nav, with left sidebar containing: 每日功课, 心理测试, 交易策略, 风险模型, 股票交易, 交易记录, 账单明细
- **研究院** (Research) — top nav, with left sidebar containing: 股票行情, 技术指标

## Key Files

- `src/App.jsx` — Main app with routing, navigation, DataSync
- `src/store/useStore.js` — Central Zustand store (~2500 lines), all app state
- `src/pages/*.jsx` — Page components
- `src/components/*.jsx` — Shared UI components (DataTable, Modal, FormModal, CustomInput, etc.)
- `src/services/apiClient.js` — HTTP client wrapper
- `src/contexts/ToastContext.jsx` — Toast notification context
- `backend/src/server.js` — Express server entry
- `backend/src/routes/api.js` — All API route handlers
- `backend/src/database/queries.js` — Reusable database query functions
- `backend/migrations/` — SQL migration files

## Environment Variables

### Frontend (`.env`)
- `VITE_API_URL` — Backend URL (default: `http://localhost:3001`)

### Backend (`backend/.env`)
- `PORT` — Server port (default: 3001)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL connection
- `NODE_ENV` — `development` or `production`
- `CORS_ORIGIN` — Allowed CORS origins (comma-separated)

### Docker (`.env.docker`)
- Uses `DB_HOST=postgres` (container service name)
- `DOCKER_BACKEND_HOST=backend` for Vite proxy

## Code Conventions

- All UI text in Chinese
- JSX files use `.jsx` extension
- ES modules (`"type": "module"` in frontend), CommonJS in backend
- Components: PascalCase files, functional components with hooks
- Store actions prefixed with import verb: `importOrders`, `importTransactions`, etc.
- API calls go through either `src/services/apiClient.js` or inline `fetch` in the store
