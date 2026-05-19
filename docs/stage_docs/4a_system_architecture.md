# 4a — System Architecture

## Purpose

This document defines the MVP system architecture for the Base Launch Intelligence Console.

The architecture is intentionally narrow. It supports one core workflow:

```text
new Base launch
→ discover candidate token/pool
→ normalize source data
→ enrich market, risk, and deployer context
→ compute score and triage label
→ persist ranked feed state
→ emit basic alert when warranted
→ render rough internal dashboard table
```

The goal is not to build a generic crypto data platform. The goal is to build the smallest reliable architecture that can validate whether a ranked, explainable Base launch feed is more useful than manually checking public dashboards.

---

## Architectural Decision Summary

| Area | Decision |
|---|---|
| App shape | Next.js frontend + separate Node/TypeScript worker/API service |
| Job runner | Long-running Node worker loop |
| Polling interval | 3 minutes |
| Primary discovery source | DEX Screener first |
| Secondary discovery path | Optional Base RPC known-factory polling later |
| Market enrichment | DEX Screener primary; GeckoTerminal optional cross-check |
| Contract-risk enrichment | GoPlus primary |
| Explorer/deployer enrichment | Basescan if available; fallback to GoPlus creator field or RPC receipt |
| Database | Postgres through Docker Compose |
| Query/schema layer | Drizzle |
| Alert delivery | Console logs + dashboard alert flags |
| UI | Rough internal ranked table |
| Social integration | Deferred |
| Rust | Deferred |
| Self-hosted Base node | Deferred |
| Paid infrastructure | Deferred unless free path blocks MVP |

---

## Design Principles

1. **Separate ingestion from rendering.**  
   The worker should continue ingesting and enriching launches even when the Next.js UI is not being actively viewed.

2. **Store raw payloads before trusting normalized fields.**  
   Every provider response should be saved as a `source_observation` before normalization. Normalized rows should be derived from raw observations, not treated as provider truth.

3. **Prefer explicit uncertainty over silent inference.**  
   Missing honeypot, deployer, verification, or pool data should lower confidence. It should never imply safety.

4. **Use snapshots for time-varying data.**  
   Market data, risk checks, deployer summaries, scores, and alerts should be append-oriented or timestamped so the system can later evaluate changes.

5. **Keep the pipeline idempotent.**  
   Re-fetching the same token or pair should update canonical records and insert new snapshots without duplicating token identity.

6. **Optimize for explainable triage, not trading latency.**  
   A 3-minute polling loop is acceptable because v0 is a research and monitoring tool, not an execution system.

---

## High-Level Architecture

```mermaid
flowchart TD
  subgraph ExternalSources[External Data Sources]
    DS[DEX Screener]
    GT[GeckoTerminal optional]
    GP[GoPlus]
    BS[Basescan optional]
    RPC[Base RPC optional targeted reads]
  end

  subgraph Worker[Node/TypeScript Worker]
    Scheduler[3-minute worker loop]
    Discovery[Candidate discovery]
    Market[Market enrichment]
    Risk[Risk enrichment]
    Deployer[Deployer enrichment]
    Normalize[Normalization layer]
    Canonical[Canonical pool selection]
    Score[Scoring + triage engine]
    Alert[Alert evaluator]
  end

  subgraph Database[Postgres via Docker Compose]
    SourceObs[(source_observations)]
    Tokens[(tokens)]
    Pools[(pools)]
    MarketSnapshots[(market_snapshots)]
    RiskChecks[(risk_checks)]
    Deployers[(deployers)]
    DeployerSnapshots[(deployer_history_snapshots)]
    Scores[(token_scores)]
    Alerts[(alerts)]
  end

  subgraph API[Node API / Next.js API Boundary]
    FeedAPI[GET /api/launches]
    AlertAPI[GET /api/alerts]
    HealthAPI[GET /api/health]
  end

  subgraph UI[Next.js Frontend]
    Table[Ranked launch table]
    Flags[Dashboard alert flags]
    Links[External investigation links]
  end

  DS --> Discovery
  DS --> Market
  GT --> Market
  GP --> Risk
  BS --> Deployer
  RPC --> Discovery
  RPC --> Deployer

  Scheduler --> Discovery
  Discovery --> Normalize
  Market --> Normalize
  Risk --> Normalize
  Deployer --> Normalize
  Normalize --> SourceObs
  Normalize --> Tokens
  Normalize --> Pools
  Normalize --> MarketSnapshots
  Normalize --> RiskChecks
  Normalize --> Deployers
  Normalize --> DeployerSnapshots
  Normalize --> Canonical
  Canonical --> Score
  Score --> Scores
  Score --> Alert
  Alert --> Alerts

  Tokens --> FeedAPI
  Pools --> FeedAPI
  MarketSnapshots --> FeedAPI
  RiskChecks --> FeedAPI
  DeployerSnapshots --> FeedAPI
  Scores --> FeedAPI
  Alerts --> AlertAPI

  FeedAPI --> Table
  AlertAPI --> Flags
  Table --> Links
```

---

## Runtime Components

## 1. Next.js Frontend

### Responsibility

Render the internal analyst console.

### v0 Scope

The UI should include one main ranked feed table with:

- rank
- token name
- token symbol
- token address
- first seen time
- pool/pair address
- venue
- liquidity
- volume
- token age or pair age
- overall score
- triage label
- contract-risk summary
- liquidity-quality summary
- deployer-history summary
- confidence
- reason string
- last updated timestamp
- external links
- alert flag, if applicable

### Non-Responsibilities

The frontend should not:

- fetch provider APIs directly
- run scoring logic
- perform enrichment
- manage job scheduling
- hide low-confidence data behind polished labels
- include authentication, billing, onboarding, or public SaaS flows in v0

---

## 2. Node/TypeScript Worker

### Responsibility

Run the ingestion, enrichment, normalization, scoring, and alert-generation pipeline.

### Runtime Model

The worker is a long-running Node process with a 3-minute polling loop.

```text
Every 3 minutes:
1. fetch candidate Base launches/pairs
2. upsert token and pool identity
3. fetch or refresh market data
4. fetch missing or stale contract-risk data
5. fetch missing or stale deployer data
6. compute canonical-pool confidence
7. compute token score and triage label
8. write alerts if thresholds are crossed
9. log run summary
```

### Why Worker Loop Instead of Cron or Queue

| Option | Decision | Reason |
|---|---|---|
| Cron script | Not selected | Simple, but weaker for stateful polling, retries, and local observability |
| Node worker loop | Selected | Simple enough for v0 and keeps ingestion decoupled from UI rendering |
| Postgres-backed job queue | Deferred | Useful later, but unnecessary until provider failures or volume justify it |

### Worker Guardrails

The worker should:

- avoid overlapping runs
- log every run start and completion
- back off on provider failures
- cap candidates per run if provider limits are hit
- persist failed provider responses as `source_observations`
- never delete raw observations during normal operation
- never block the full run because one source fails

---

## 3. API Boundary

### Responsibility

Expose normalized data from Postgres to the frontend.

This can be implemented either as:

- Next.js route handlers, or
- a small Node API service in the same monorepo.

For v0, prefer the simplest implementation that keeps the frontend clean and avoids duplicating query logic.

### Required v0 Endpoints

```text
GET /api/launches
GET /api/alerts
GET /api/health
```

### `GET /api/launches`

Returns the latest ranked launch rows.

Core query behavior:

- one row per token
- latest score per token
- latest canonical pool candidate
- latest market snapshot for that pool
- latest risk check
- latest deployer-history snapshot
- latest unresolved alert flag, if any
- ordered by triage priority and overall score

Suggested query parameters:

```text
?limit=100
?label=High%20Priority
?minScore=70
?includeRisky=true
```

Filtering is optional for first implementation. The endpoint should work without any query parameters.

### `GET /api/alerts`

Returns recent alerts.

Suggested query parameters:

```text
?limit=50
?unacknowledgedOnly=true
```

Acknowledgement can be deferred. Dashboard flags and recent alert rows are enough for v0.

### `GET /api/health`

Returns local system health:

```ts
type HealthResponse = {
  status: "ok" | "degraded";
  database: "ok" | "error";
  lastWorkerRunAt: string | null;
  lastSuccessfulDiscoveryAt: string | null;
  lastError: string | null;
};
```

---

## 4. Postgres Database

### Responsibility

Persist canonical state, snapshots, raw provider observations, scores, and alerts.

### Required Tables

```text
tokens
pools
market_snapshots
risk_checks
deployers
deployer_history_snapshots
token_scores
alerts
source_observations
worker_runs
```

`worker_runs` is an added operational table for architecture-level observability.

### Data Model Pattern

Use two types of tables:

1. **Canonical identity tables**
   - `tokens`
   - `pools`
   - `deployers`

2. **Observation/snapshot tables**
   - `market_snapshots`
   - `risk_checks`
   - `deployer_history_snapshots`
   - `token_scores`
   - `alerts`
   - `source_observations`
   - `worker_runs`

### Identity Rules

| Entity | Primary identity |
|---|---|
| Token | `chain_id + token_address` |
| Pool | `chain_id + pool_address` |
| Deployer | `chain_id + deployer_address` |
| Market snapshot | generated ID or `token + pool + source + observed_at` |
| Risk check | generated ID or `token + source + observed_at` |
| Score | generated ID or `token + scored_at` |
| Alert | generated ID, with dedupe key for alert type + token + state |
| Source observation | generated ID |

Full schema details belong in `4b_database_schema.md`.

---

## External Source Roles

## 1. DEX Screener

### Role

Primary discovery and market-data provider.

### Used For

- candidate Base token/pair discovery
- pair address
- token identity fields
- DEX venue
- quote token
- pair creation time
- price
- liquidity
- volume windows
- transaction windows where available
- token links and promotion metadata where available

### Architecture Notes

DEX Screener should be treated as a provider feed, not as the canonical truth of token quality.

The worker should store:

- raw DEX Screener payload in `source_observations`
- normalized token identity in `tokens`
- normalized pool identity in `pools`
- normalized market rows in `market_snapshots`

---

## 2. GeckoTerminal

### Role

Optional pool/liquidity cross-check.

### Used For

- validating candidate canonical pool
- detecting multiple pools
- cross-checking liquidity
- improving canonical-pool confidence
- OHLCV or top-pool metadata if useful

### v0 Policy

GeckoTerminal should not block the first working feed.

Use it when:

- DEX Screener pool data is missing or suspicious
- multiple DEX Screener pools exist for a token
- a token crosses a score threshold and needs better pool confidence

Suggested cadence:

```text
on demand or every 5–15 minutes for recent/high-interest tokens
```

---

## 3. GoPlus

### Role

Primary contract-risk enrichment provider.

### Used For

- honeypot flag
- buy tax
- sell tax
- mutable tax risk
- blacklist/whitelist flags
- mint risk
- owner/admin risk
- open-source or verification-like fields if available
- holder concentration if available
- LP lock/burn indicators if available
- creator address if available

### Architecture Notes

GoPlus output should feed the internal `contract_risk_score`. It should not directly decide that a token is safe.

High-risk GoPlus flags can immediately force or strongly bias the token toward `Risky`, but missing GoPlus fields must lower confidence rather than imply safety.

Suggested cadence:

```text
first seen → immediate check
recent tokens → occasional recheck
older tokens → stop or manual refresh only
```

---

## 4. Basescan

### Role

Optional verification and deployer augmentation source.

### Used For

- contract verification status
- deployer/creator address
- creation transaction hash
- proxy status if available
- manual investigation links
- deployer transaction context if feasible

### v0 Policy

Use Basescan if API access is available.

If unavailable:

1. use GoPlus creator fields where available
2. use Base RPC transaction receipt where possible
3. mark deployer-history confidence as low when unresolved

Basescan should not be treated as a high-throughput stream.

---

## 5. Base RPC

### Role

Targeted onchain fallback and future ingestion path.

### Used For in v0

- token metadata reads if provider metadata is missing
- transaction receipt lookup
- targeted logs for known DEX factory events, later in v0 if needed
- fallback deployer/creation inference where feasible

### Not Used For in v0

- full-chain indexing
- self-hosted node operations
- mempool analytics
- execution or trading
- sub-second detection

### Phase-Two v0 Addition

If DEX Screener discovery is too delayed or incomplete, add known-factory polling through Base RPC for selected DEX factories.

This should be a bounded addition, not a general-purpose indexer.

---

## Pipeline Design

## Stage 1 — Candidate Discovery

### Input

DEX Screener recent/new Base pair data.

### Output

Candidate records with:

- token address
- pool/pair address
- DEX ID
- quote token
- pair creation time, if available
- liquidity, if available
- source
- fetched timestamp

### Rules

- Ignore non-Base records.
- Normalize addresses to lowercase.
- Store raw payload before normalization.
- Upsert token and pool identity.
- Do not trust token name or symbol as identity.
- Use first observed timestamp when launch time is unavailable.

---

## Stage 2 — Market Enrichment

### Input

Candidate token/pool records.

### Primary Source

DEX Screener.

### Optional Source

GeckoTerminal.

### Output

`market_snapshots` rows.

### Rules

- Snapshot market fields every run for recent tokens.
- Reduce refresh frequency for old or ignored tokens later.
- Treat FDV and market cap as context, not hard truth.
- If multiple pools exist, mark canonical confidence before scoring liquidity.
- Do not over-rank raw volume.

---

## Stage 3 — Contract-Risk Enrichment

### Input

Candidate token address.

### Primary Source

GoPlus.

### Optional/Fallback Sources

- TokenSniffer later, if easy
- Basescan verification
- manual link-out

### Output

`risk_checks` rows.

### Rules

- Fetch immediately for newly seen tokens.
- Cache results.
- Recheck recent tokens occasionally because risk state can change or scanner coverage can improve.
- Unknown fields remain `null`.
- Critical risk fields can trigger `obvious_high_risk_launch` alert.

---

## Stage 4 — Deployer Enrichment

### Input

Token address, creation transaction if available, provider creator fields if available.

### Primary Source

Basescan if available.

### Fallbacks

- GoPlus creator field
- Base RPC transaction receipt
- internal first-seen history
- manual investigation link

### Output

- `tokens.deployer_address`
- `deployers`
- `deployer_history_snapshots`

### Rules

- Unknown deployer should not automatically mean bad deployer.
- Missing deployer lowers confidence.
- Internal history should count prior tokens observed by this system.
- External prior contract/token count is best-effort only.

---

## Stage 5 — Canonical Pool Selection

### Input

Pools and market snapshots for a token.

### Output

Updated pool canonical fields:

```text
is_canonical_candidate
canonical_confidence: low | medium | high
```

### v0 Heuristic

Prefer the pool with:

1. highest reliable liquidity
2. WETH or USDC quote asset
3. known DEX venue
4. recent activity without obviously absurd volume/liquidity ratio
5. DEX Screener and GeckoTerminal agreement, if available

### Rules

- Low confidence should lower liquidity-quality confidence.
- Wrong-pool risk should be visible in the reason string.
- Do not compute high-confidence liquidity quality from a low-confidence pool.

---

## Stage 6 — Scoring and Triage

### Input

- latest market snapshot
- latest risk check
- latest deployer-history snapshot
- canonical pool confidence

### Output

`token_scores` row.

### v0 Components

```text
contract_risk_score
liquidity_quality_score
deployer_history_score
overall_score
triage_label
confidence
reason_summary
reason_details
```

### v0 Weighting

```text
Contract risk: 40%
Liquidity quality: 40%
Deployer history: 20%
```

### Label Set

```text
Ignore
Risky
Watch
Research Deeper
High Priority
```

### Rules

- Critical contract risk should override otherwise good market data.
- Very low liquidity should prevent high-priority ranking.
- Missing data should lower confidence.
- Unknown deployer should not automatically force `Risky`.
- Every score must have a reason string.
- Labels are research workflow states, not buy/sell recommendations.

Full scoring rules belong in `4d_scoring_and_triage_model.md`.

---

## Stage 7 — Alert Evaluation

### Input

Latest token score, risk check, and prior alerts.

### Output

`alerts` row and console log.

### v0 Alert Types

```text
new_high_score_launch
obvious_high_risk_launch
```

### Suggested Rules

High-score alert:

```text
overall_score >= 80
confidence != low
no critical contract-risk flag
not previously alerted for this token/state
```

High-risk alert:

```text
honeypot risk true
OR high sell tax
OR blacklist true
OR mint/admin critical risk
OR unverified + very low liquidity + suspicious deployer signal
```

### Alert Delivery

For v0:

- write alert row to Postgres
- show alert flag in dashboard
- log alert to worker console

Do not build:

- email delivery
- Telegram delivery
- webhook delivery
- alert inbox polish
- notification preferences

---

## Polling and Refresh Cadence

## Main Loop

```text
Every 3 minutes
```

### Suggested Source Cadence

| Data Type | Cadence | Notes |
|---|---:|---|
| DEX Screener candidate discovery | every 3 minutes | Main loop |
| DEX Screener market refresh | every 3 minutes for recent tokens | Reduce for old/ignored tokens later |
| GoPlus risk check | first seen, then occasional recheck | Do not spam scanner |
| Basescan verification/deployer | first seen, then occasional recheck | If API available |
| GeckoTerminal cross-check | on demand or 5–15 minutes | Optional |
| Base RPC metadata/receipt | on demand | Optional fallback |
| Score recomputation | every run after new snapshots | Cheap and deterministic |
| Alert evaluation | every run after scoring | Dedupe required |

### Token Aging Policy

To control cost and noise, tokens should be assigned a freshness tier.

| Tier | Definition | Refresh behavior |
|---|---|---|
| Hot | first seen in last 60 minutes | refresh every worker run |
| Warm | first seen in last 24 hours | refresh every 2–5 runs |
| Cold | older than 24 hours or ignored | refresh rarely or stop |

This can be implemented later in v0 after the basic loop works.

---

## Error Handling

## Provider Failure Policy

If a provider request fails:

1. write failed response/error to `source_observations`
2. continue the worker run
3. mark affected normalized fields as missing or stale
4. lower confidence where needed
5. log provider-level error summary

The system should not fail the entire pipeline because GeckoTerminal, Basescan, GoPlus, or RPC is unavailable.

## Missing Data Policy

| Missing Data | Behavior |
|---|---|
| Missing token name/symbol | show address and mark metadata confidence low |
| Missing pair creation time | use first-seen timestamp |
| Missing liquidity | mark liquidity quality unknown/low confidence |
| Missing GoPlus risk data | do not mark safe; lower contract-risk confidence |
| Missing deployer | classify deployer as unknown; lower deployer confidence |
| Missing GeckoTerminal cross-check | continue with DEX Screener only; lower canonical confidence if pool is ambiguous |
| Missing Basescan verification | use GoPlus/RPC if possible; otherwise mark unknown |

## Duplicate Handling

The worker should dedupe by:

- token address
- pool address
- provider observation hash where useful
- alert type + token address + alert state

---

## Observability

## Required v0 Logs

The worker should log:

```text
run started
candidate count fetched
new token count
new pool count
market snapshots inserted
risk checks inserted
basis/deployer checks inserted
scores computed
alerts emitted
provider errors
run duration
run completed
```

## Worker Runs Table

Add a `worker_runs` table with:

```ts
type WorkerRun = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: "running" | "success" | "partial_failure" | "failure";
  candidatesFetched: number;
  tokensInserted: number;
  poolsInserted: number;
  marketSnapshotsInserted: number;
  riskChecksInserted: number;
  scoresComputed: number;
  alertsCreated: number;
  errorSummary: string | null;
};
```

This keeps v0 debuggable without introducing a full observability stack.

---

## Monorepo Folder Structure

Recommended structure:

```text
base-launch-intelligence/
  apps/
    web/
      app/
        page.tsx
        api/
          launches/route.ts
          alerts/route.ts
          health/route.ts
      components/
        LaunchTable.tsx
        TriageBadge.tsx
        AlertFlag.tsx
      lib/
        format.ts
        links.ts
    worker/
      src/
        index.ts
        loop.ts
        pipeline/
          discoverCandidates.ts
          enrichMarket.ts
          enrichRisk.ts
          enrichDeployer.ts
          selectCanonicalPool.ts
          scoreTokens.ts
          evaluateAlerts.ts
        providers/
          dexscreener.ts
          geckoterminal.ts
          goplus.ts
          basescan.ts
          baseRpc.ts
        normalize/
          token.ts
          pool.ts
          market.ts
          risk.ts
          deployer.ts
        utils/
          logger.ts
          retry.ts
          addresses.ts
  packages/
    db/
      schema.ts
      client.ts
      migrations/
    scoring/
      contractRisk.ts
      liquidityQuality.ts
      deployerHistory.ts
      overallScore.ts
      labels.ts
      reasons.ts
    types/
      token.ts
      pool.ts
      market.ts
      risk.ts
      deployer.ts
      score.ts
      alert.ts
    config/
      env.ts
      constants.ts
  samples/
    dexscreener/
    geckoterminal/
    goplus/
    basescan/
    rpc/
  docker-compose.yml
  drizzle.config.ts
  package.json
  README.md
```

### Package Responsibilities

| Package/App | Responsibility |
|---|---|
| `apps/web` | Next.js UI and local API routes |
| `apps/worker` | polling loop and pipeline execution |
| `packages/db` | Drizzle schema, client, migrations |
| `packages/scoring` | deterministic scoring and reason generation |
| `packages/types` | shared TypeScript types |
| `packages/config` | environment/config constants |
| `samples` | captured raw provider payloads for test fixtures |

---

## Environment Variables

Suggested `.env` shape:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5432/base_launch_intel
BASE_CHAIN_ID=8453
WORKER_POLL_INTERVAL_MS=180000

DEXSCREENER_BASE_URL=https://api.dexscreener.com
GECKOTERMINAL_BASE_URL=https://api.geckoterminal.com/api/v2
GOPLUS_BASE_URL=https://api.gopluslabs.io
BASESCAN_BASE_URL=https://api.basescan.org/api
BASE_RPC_URL=https://mainnet.base.org

BASESCAN_API_KEY=
GOPLUS_API_KEY=
ENABLE_GECKOTERMINAL=false
ENABLE_BASE_RPC_FACTORY_POLLING=false
```

Do not require optional provider keys for the app to boot. Missing optional keys should disable only the dependent enrichment step.

---

## Local Development Runtime

## Docker Compose Services

```text
postgres
```

Optional later:

```text
adminer or pgadmin
```

Do not add Redis, Kafka, ClickHouse, or graph storage in v0.

## Local Process Model

Run these processes separately:

```text
pnpm dev:web
pnpm dev:worker
```

Expected behavior:

- Postgres starts through Docker Compose.
- Worker polls every 3 minutes.
- Web app reads from Postgres through API routes.
- Dashboard shows the latest scored launches.

---

## Security and Safety Boundaries

The system must not:

- execute trades
- store private keys
- request wallet signatures
- connect to a user wallet
- provide buy/sell recommendations
- claim risk scanners are definitive
- expose a public API in v0
- identify real humans behind wallets

This architecture intentionally avoids wallet connectivity and execution paths.

---

## Deferred Architecture

Do not design or implement these in v0:

| Deferred Area | Reason |
|---|---|
| Rust worker | No measured CPU bottleneck |
| Farcaster/Neynar | Deferred until core ranking loop works |
| X/Twitter ingestion | Too noisy and outside v0 scope |
| Telegram ingestion | Weak as broad input; possible future alert output only |
| Self-hosted Base node | Infra-heavy before validation |
| Flashblocks dependency | Not required for 1–5 minute freshness |
| Kafka | Overkill for local MVP |
| ClickHouse | Overkill until query volume or time-series volume justifies it |
| Graph database | Premature before wallet/deployer graph scope exists |
| Vector database | No v0 semantic retrieval requirement |
| ML ranking | Premature and harder to debug than rules |
| Route simulation | Deferred until liquidity heuristics prove useful |
| Full token detail pages | v0 is table-only |
| External alert delivery | Console logs + dashboard flags are enough |

---

## Key Failure Modes and Architectural Defenses

| Failure Mode | Architectural Defense |
|---|---|
| DEX Screener misses very early launches | Accept for v0; add bounded Base RPC factory polling later if needed |
| Wrong canonical pool | Store all pools; compute canonical confidence; expose uncertainty |
| Raw volume dominates score | Liquidity score should use volume as context, not sole rank signal |
| Risk scanner false confidence | Store scanner output as evidence; missing fields lower confidence |
| Deployer attribution unavailable | Fallback to GoPlus/RPC/manual links; classify as unknown, not automatically bad |
| Provider rate limits | Cache, tier refresh cadence, avoid polling all sources equally |
| Alert spam | Only two alert types; threshold + dedupe rules |
| Opaque score | Store component scores and reason strings |
| UI becomes product sink | Keep table-only MVP; no detail pages or polish requirements |
| Scope drifts into trading | No wallet, no execution, no recommendations |

---

## Stage 4 Dependencies

This architecture depends on the following Stage 4 documents:

| Document | Dependency |
|---|---|
| `4b_database_schema.md` | Defines exact Drizzle/Postgres schema and indexes |
| `4c_ingestion_and_enrichment_pipeline.md` | Defines precise worker step logic and provider call order |
| `4d_scoring_and_triage_model.md` | Defines scoring rules, labels, thresholds, and reason strings |
| `4e_api_and_frontend_contracts.md` | Defines API response shapes and frontend table contracts |
| `4f_mvp_build_plan.md` | Converts architecture into implementation sequence |

---

## Architecture Exit Criteria

This architecture is sufficient for Stage 5 if:

- a developer can identify every runtime process
- every provider has a defined role and fallback behavior
- the worker loop has a clear execution order
- Postgres ownership of canonical state is clear
- raw payload storage is required
- confidence handling is explicit
- the frontend only depends on normalized API responses
- alerts are limited and deterministic
- deferred systems remain out of scope

---

## Final Recommendation

Use this v0 architecture:

```text
Next.js web app
+ separate Node/TypeScript worker loop
+ Drizzle/Postgres
+ Docker Compose local database
+ DEX Screener primary discovery/market data
+ GoPlus primary contract-risk enrichment
+ Basescan optional deployer/verification enrichment
+ GeckoTerminal optional canonical-pool cross-check
+ Base RPC targeted fallback only
+ console/dashboard alerts
```

This is the narrowest architecture that supports the product thesis without becoming a generic data platform.
