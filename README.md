# Base Launch Intelligence Console

Private Base-native launch intelligence and risk-ranking console MVP.

The goal is to help an analyst/operator triage new Base token launches by quality, risk, liquidity quality, and deployer context.

This is not a trading bot, copytrading product, signal group, portfolio tracker, or generic multi-chain dashboard.

## Current status

M0 bootstrap skeleton.

The repository currently includes:

- pnpm monorepo workspace
- minimal Next.js web app shell
- minimal Node/TypeScript worker shell
- shared package skeleton
- database package skeleton
- local Postgres through Docker Compose
- TypeScript typechecking
- Prettier formatting
- environment variable scaffolding

## Prerequisites

Recommended local environment:

- WSL/Linux shell
- Node.js 22+
- pnpm
- Docker Desktop with WSL integration enabled

Verify local tooling:

```bash
node -v
pnpm -v
docker --version
docker compose version
```

## Install dependencies

From the repository root:

```bash
pnpm install
```

## Environment setup

Create a local environment file:

```bash
cp .env.example .env
```

The expected local database URL is:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/base_launch_intel
```

Do not commit `.env`.

Provider API keys and RPC URLs are optional in M0. They should remain server-side only and must not be exposed through `NEXT_PUBLIC_*` variables.

## Start local Postgres

```bash
docker compose up -d
```

Check that Postgres is running:

```bash
docker compose ps
```

Optional database readiness check:

```bash
docker compose exec postgres pg_isready -U postgres -d base_launch_intel
```

Optional database name check:

```bash
docker compose exec postgres psql -U postgres -d base_launch_intel -c "select current_database();"
```

Stop Postgres:

```bash
docker compose down
```

Do not use `docker compose down -v` unless you intentionally want to delete the local database volume.

## Database migrations

The Drizzle schema lives in `packages/db/src/schema.ts`. Generated SQL migrations are checked into `packages/db/src/migrations/`.

Generate a migration from the current schema:

```bash
pnpm db:generate
```

This writes a new `XXXX_<tag>.sql` file plus a snapshot under `packages/db/src/migrations/meta/`. If the schema has not changed, drizzle-kit reports `No schema changes, nothing to migrate` and writes nothing.

Apply pending migrations to the local database:

```bash
pnpm db:migrate
```

Drizzle records applied migrations in the `drizzle.__drizzle_migrations` table inside the same database, so re-running `pnpm db:migrate` is idempotent — it applies nothing once everything is up to date.

Open Drizzle Studio to inspect tables and data:

```bash
pnpm db:studio
```

### Caveats

- `pnpm db:generate` and `pnpm db:migrate` require `DATABASE_URL` to be set; copy `.env.example` to `.env` first.
- Re-generating after a schema change produces a new migration file (e.g. `0001_*.sql`) — do **not** edit the existing `0000_*.sql` after it has been applied to any environment. If you need to redo the initial migration locally, drop the `public` and `drizzle` schemas first (`docker compose down -v` resets everything, or `DROP SCHEMA public CASCADE; DROP SCHEMA drizzle CASCADE;` keeps the volume).
- Migration filenames include a random tag (the part after the index). Regenerating from scratch will produce a different tag — commit the generated files exactly as drizzle-kit emits them.

## Run the web app

```bash
pnpm dev:web
```

Open:

```text
http://localhost:3000
```

Expected result:

- placeholder Next.js page renders
- no provider API calls are made from the browser
- no database query is required to load the page
- no ranked launch table is implemented yet

## Run the worker

In a separate terminal:

```bash
pnpm dev:worker
```

Expected result:

- worker logs a startup message
- worker logs a placeholder loop tick
- default polling interval is 3 minutes

For a faster local smoke test:

```bash
WORKER_POLL_INTERVAL_MS=5000 pnpm dev:worker
```

This should log a placeholder tick roughly every 5 seconds.

Stop the worker with:

```text
Ctrl + C
```

## Typecheck

```bash
pnpm typecheck
```

This runs typechecking across the workspace packages.

## Formatting

```bash
pnpm format
```

Check formatting without writing changes:

```bash
pnpm format:check
```

## Linting

```bash
pnpm lint
```

Linting is intentionally deferred during M0 to avoid introducing extra configuration complexity before the runnable skeleton is complete. Use TypeScript typechecking and Prettier formatting for now.

## Useful local commands

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm dev:web
pnpm dev:worker
pnpm typecheck
pnpm format
```

## Workspace layout

```text
apps/
  web/
  worker/
packages/
  db/
  shared/
docker-compose.yml
pnpm-workspace.yaml
.env.example
README.md
```

## Current M0 limitations

The following are intentionally not implemented yet:

- provider ingestion
- DEX Screener client
- GoPlus client
- GeckoTerminal client
- Basescan client
- Base RPC reads
- real database client wiring into the web app and worker
- source observation persistence
- scoring logic
- alert logic
- API routes
- ranked dashboard table
- launch feed
- production authentication
- wallet connection
- trading or execution features

M1 will add the real database schema and migrations. Later milestones will add provider sample capture, normalization, scoring, API routes, and the ranked table.
