# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Base Launch Intelligence** is a private launch intelligence console MVP designed to help analysts/operators triage new Base token launches by quality, risk, liquidity survivability, and deployer context.

Current status: **M0 bootstrap skeleton** - functional monorepo with database scaffolding and runnable web/worker shells. Real provider integrations, database schema, scoring logic, and ranked tables are planned for M1+.

## Tech Stack

- **Language**: TypeScript (strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`)
- **Package Manager**: pnpm (v10.13.1+)
- **Node.js**: 20+
- **Web Framework**: Next.js (latest) with React
- **Backend/Worker**: Node.js TypeScript via tsx
- **Database**: PostgreSQL 16 (Docker), ORM is Drizzle (0.45.2+)
- **Formatting**: Prettier (single quotes, semi-colons, no trailing commas)
- **Database Migrations**: Drizzle Kit

## Monorepo Structure

```
apps/
  web/          # Next.js app (http://localhost:3000)
  worker/       # Node/TypeScript background ingestion loop
packages/
  db/           # Database client, schema, migrations (Drizzle ORM)
  shared/       # Types and API contracts (ChainId, EvmAddress, ConfidenceLevel)
docker-compose.yml
pnpm-workspace.yaml
```

All packages extend `tsconfig.base.json` for consistent strict TypeScript configuration.

## Key Commands

### Setup & Installation
```bash
pnpm install              # Install all workspace dependencies
cp .env.example .env      # Create local environment file
docker compose up -d      # Start local Postgres (base_launch_intel database)
```

### Development
```bash
pnpm dev:web              # Run Next.js on http://localhost:3000
pnpm dev:worker           # Run background worker with 3-minute poll (or set WORKER_POLL_INTERVAL_MS)
WORKER_POLL_INTERVAL_MS=5000 pnpm dev:worker  # Faster polling for testing
```

### Quality & Type Checking
```bash
pnpm typecheck            # Run TypeScript across all workspace packages
pnpm format               # Auto-format code with Prettier
pnpm format:check         # Check formatting without writing
```

### Database
```bash
pnpm db:generate          # Generate Drizzle migrations from schema.ts
pnpm db:migrate           # Apply migrations to local Postgres
pnpm db:studio            # Open Drizzle Studio visual editor
pnpm db:check             # Test database connectivity
```

### GitHub Issue Seeding
```bash
pnpm seed:issues .github/issue-seeds/m1.yml --repo OWNER/REPO
pnpm seed:issues .github/issue-seeds/m1.yml --repo OWNER/REPO --dry-run  # Preview
```

**Note**: Linting is deferred until M1. Use `pnpm typecheck` and `pnpm format` for code quality.

## Architecture Patterns

### Database Layer (`packages/db/`)
- **Schema Definition**: `packages/db/src/schema.ts` (placeholder until M1)
- **Client Export**: `packages/db/src/client.ts` exports `db` (Drizzle instance) and `pool` (pg.Pool)
- **Exports**:
  - `.` → main exports (schema status, db client, pool)
  - `./client` → database client and connection pool
  - `./schema` → table definitions and types
- **Migrations**: Stored in `packages/db/src/migrations/` (generated via Drizzle Kit)
- When M1 schema is added, define all tables/indexes/enums here; other packages import from `@base-launch-intelligence/db/schema`

### Shared Types (`packages/shared/`)
- Core types: `ChainId` (Base = 8453), `EvmAddress`, `ConfidenceLevel`
- API contracts reserved for M1 (currently placeholder)
- All workspace packages can import from `@base-launch-intelligence/shared`

### Web App (`apps/web/`)
- Next.js app server structure (App Router)
- Currently: placeholder page, no database queries, no provider API calls
- Future: ranked launch dashboard, API routes for worker coordination
- Can import from `@base-launch-intelligence/db` and `@base-launch-intelligence/shared`

### Worker (`apps/worker/`)
- Background ingestion loop running on configurable poll interval (default 3 minutes)
- Entry: `apps/worker/src/index.ts` → initializes config → starts placeholder loop
- **Config** (via env vars):
  - `WORKER_POLL_INTERVAL_MS=180000` → polling cadence
  - `WORKER_CANDIDATE_LIMIT=50` → max launches per run
  - `NODE_ENV` → environment
- **Structured Logging**: JSON output via `logger` for monitoring
- Handles graceful SIGINT/SIGTERM shutdown
- Currently: placeholder tick loop; M1+ will add real provider fetching and scoring

## Environment Variables

Located in `.env.example`. Key variables:
- `DATABASE_URL`: Postgres connection string (required for db operations)
- `WORKER_POLL_INTERVAL_MS`: Worker polling frequency in milliseconds
- `WORKER_CANDIDATE_LIMIT`: Max launches processed per worker tick
- Provider URLs (DEX Screener, GeckoTerminal, GoPlus) are public; set feature flags to disable them in M0
- API keys (Basescan, Base RPC) are optional; do not commit real keys in `.env`

**Provider APIs are intentionally not integrated in M0.**

## Database Setup

1. Postgres runs in Docker via `docker compose up -d`
2. Database: `base_launch_intel`, user: `postgres`, password: `postgres`
3. Connection tested via `pnpm db:check`
4. Schema placeholder until M1; run `pnpm db:generate` and `pnpm db:migrate` when schema is defined
5. Stop Postgres: `docker compose down` (use `docker compose down -v` only if intentionally deleting volume)

## Type Safety Notes

- All TypeScript files use strict mode with additional checks
- `ChainId = 8453` is hardcoded in worker (Base-only for M0)
- `EvmAddress = "0x${string}"` for all blockchain addresses
- `ConfidenceLevel` enum for quality tiers (low/medium/high)
- Future M1+ tables should include strong type definitions in schema.ts

## Next Phases (M1+)

- Real database schema (tables, enums, indexes, relations)
- Provider ingestion (DEX Screener, GoPlus, GeckoTerminal, Basescan)
- Scoring and triage logic
- API routes for frontend
- Ranked launch dashboard table
- Production authentication

Currently deferred: DEX/RPC reads, real migrations, API contracts, ranked table, launch feed, wallet connection, trading features.
