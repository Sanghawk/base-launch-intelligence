# 4b — Database Schema

## Purpose

This document defines the Postgres schema for the Base Launch Intelligence Console MVP.

The schema supports one narrow product loop:

```text
candidate Base launch / pool
→ token and pool identity
→ market snapshot
→ contract-risk snapshot
→ deployer-history snapshot
→ token score
→ alert
→ ranked launch feed
```

The schema is intentionally boring and local-first. It is designed for a solo-engineer MVP using:

```text
Postgres
Drizzle
Docker Compose
Node/TypeScript worker
Next.js frontend/API routes
```

The goal is not to design a general-purpose crypto warehouse. The goal is to make the first ranked feed reliable, inspectable, and easy to modify.

---

## Schema Goals

The v0 schema must support:

1. **Idempotent ingestion** of tokens, pools, and deployers.
2. **Append-oriented snapshots** for market data, risk checks, deployer history, and scores.
3. **Raw provider payload storage** for debugging and contract verification.
4. **Latest-ranked-feed queries** without complex application-side joining.
5. **Explicit uncertainty** through confidence fields and nullable provider-derived fields.
6. **Basic alert deduplication** for high-score and high-risk alerts.
7. **Worker observability** through `worker_runs`.

---

## Design Principles

## 1. Separate canonical identity from observations

Canonical tables store stable identity:

```text
tokens
deployers
pools
```

Snapshot tables store time-varying observations:

```text
market_snapshots
risk_checks
deployer_history_snapshots
token_scores
alerts
source_observations
worker_runs
```

This avoids corrupting token identity when providers disagree or return stale fields.

## 2. Store raw provider payloads first

Every provider response should be inserted into `source_observations` before normalized rows are written.

Normalized rows should reference the raw payload through `raw_payload_id` when possible.

## 3. Treat missing fields as unknown, not safe

Missing provider fields should be stored as `NULL`, not converted to optimistic defaults.

Examples:

```text
is_honeypot = NULL does not mean false
is_verified = NULL does not mean true
sell_tax = NULL does not mean 0
liquidity_usd = NULL does not mean 0
```

Scoring logic should lower confidence when required fields are missing.

## 4. Use internal IDs plus natural unique constraints

Each major table uses a UUID primary key for easier joins and Drizzle ergonomics.

Natural identity is enforced with unique constraints:

```text
tokens:    chain_id + address
pools:     chain_id + address
deployers: chain_id + address
alerts:    dedupe_key
```

## 5. Normalize addresses before insert

All EVM addresses should be normalized to lowercase before storage.

Do not rely on token name or symbol as identity. Token names and symbols are display fields only.

---

## Naming Conventions

| Area | Convention |
|---|---|
| Tables | `snake_case`, plural |
| Columns | `snake_case` |
| TypeScript fields | `camelCase` through Drizzle mappings or app-level types |
| Addresses | lowercase hex string |
| Timestamps | `timestamptz` |
| Money values | `numeric`, not floating point |
| Raw payloads | `jsonb` |
| Confidence fields | enum: `low`, `medium`, `high` |
| Unknown fields | `NULL`, not magic defaults |

---

## Required Tables

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

---

# Enum Types

## `confidence_level`

```sql
CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high');
```

Used by:

- `tokens.metadata_confidence`
- `pools.canonical_confidence`
- `deployer_history_snapshots.history_confidence`
- `deployer_history_snapshots.repeated_template_confidence`
- `token_scores.confidence`

## `risk_level`

```sql
CREATE TYPE risk_level AS ENUM ('unknown', 'low', 'medium', 'high', 'critical');
```

Used by:

- `risk_checks.risk_level`

## `triage_label`

```sql
CREATE TYPE triage_label AS ENUM (
  'Ignore',
  'Risky',
  'Watch',
  'Research Deeper',
  'High Priority'
);
```

Used by:

- `token_scores.triage_label`

## `alert_type`

```sql
CREATE TYPE alert_type AS ENUM (
  'new_high_score_launch',
  'obvious_high_risk_launch'
);
```

Used by:

- `alerts.alert_type`

## `alert_severity`

```sql
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
```

Used by:

- `alerts.severity`

## `worker_run_status`

```sql
CREATE TYPE worker_run_status AS ENUM (
  'running',
  'success',
  'partial_failure',
  'failure'
);
```

Used by:

- `worker_runs.status`

---

# Table: `tokens`

## Purpose

Canonical record for a token contract on Base.

This table should answer:

```text
What token contract is this?
When did this system first see it?
What deployer do we think created it?
How confident are we in the metadata?
```

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `chain_id` | `integer` | No | Base = `8453` |
| `address` | `text` | No | Lowercase token contract address |
| `name` | `text` | Yes | Display only; spoofable |
| `symbol` | `text` | Yes | Display only; spoofable |
| `decimals` | `integer` | Yes | From provider or ERC-20 call |
| `total_supply_raw` | `numeric(78,0)` | Yes | Optional raw integer supply |
| `first_seen_at` | `timestamptz` | No | Internal observation timestamp |
| `first_seen_source` | `text` | No | Example: `dexscreener` |
| `deployer_id` | `uuid` | Yes | FK to `deployers.id` |
| `deployer_address` | `text` | Yes | Denormalized for simpler lookup/debugging |
| `creation_tx_hash` | `text` | Yes | From Basescan/RPC/GoPlus if available |
| `created_at_block` | `bigint` | Yes | Contract creation block if known |
| `created_at_timestamp` | `timestamptz` | Yes | Contract creation timestamp if known |
| `is_verified` | `boolean` | Yes | Source-code verification, if known |
| `is_proxy` | `boolean` | Yes | Proxy status, if known |
| `metadata_confidence` | `confidence_level` | No | Default `low` |
| `created_at` | `timestamptz` | No | Row creation time |
| `updated_at` | `timestamptz` | No | Row update time |

## Constraints

```sql
PRIMARY KEY (id);
UNIQUE (chain_id, address);
```

## Indexes

```sql
CREATE INDEX idx_tokens_first_seen_at ON tokens (first_seen_at DESC);
CREATE INDEX idx_tokens_deployer_id ON tokens (deployer_id);
CREATE INDEX idx_tokens_deployer_address ON tokens (chain_id, deployer_address);
CREATE INDEX idx_tokens_symbol ON tokens (symbol);
```

## Notes

- `name` and `symbol` are never identity keys.
- `first_seen_at` is the product's reliable fallback for launch timing when pair creation or contract creation time is missing.
- `is_verified` can be updated by Basescan or GoPlus. Conflicting values should be handled conservatively by the scoring layer.

---

# Table: `deployers`

## Purpose

Canonical record for an address that deployed a token or relevant contract.

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `chain_id` | `integer` | No | Base = `8453` |
| `address` | `text` | No | Lowercase deployer address |
| `first_seen_at` | `timestamptz` | No | First time this system saw the deployer |
| `last_seen_at` | `timestamptz` | No | Last time this system saw the deployer |
| `known_label` | `text` | Yes | Optional manual/provider label |
| `source` | `text` | No | First source that identified the deployer |
| `created_at` | `timestamptz` | No | Row creation time |
| `updated_at` | `timestamptz` | No | Row update time |

## Constraints

```sql
PRIMARY KEY (id);
UNIQUE (chain_id, address);
```

## Indexes

```sql
CREATE INDEX idx_deployers_last_seen_at ON deployers (last_seen_at DESC);
CREATE INDEX idx_deployers_known_label ON deployers (known_label);
```

## Notes

- Unknown deployer is not automatically bad.
- A deployer can be a wallet, factory, launch-platform contract, or proxy path. v0 does not need to fully classify this.

---

# Table: `pools`

## Purpose

Represents a DEX pool or pair associated with a token.

A token can have multiple pools. The scoring system should select one canonical candidate with an explicit confidence level.

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `chain_id` | `integer` | No | Base = `8453` |
| `address` | `text` | No | Lowercase pool/pair address |
| `dex_id` | `text` | Yes | Example: `uniswap`, `aerodrome`, `pancakeswap` |
| `base_token_id` | `uuid` | No | FK to `tokens.id`; product token side |
| `base_token_address` | `text` | No | Denormalized lowercase address |
| `quote_token_address` | `text` | Yes | Lowercase quote token address |
| `quote_token_symbol` | `text` | Yes | Example: `WETH`, `USDC` |
| `quote_token_name` | `text` | Yes | Optional |
| `pair_created_at` | `timestamptz` | Yes | Provider-derived pool creation time |
| `first_seen_at` | `timestamptz` | No | Internal first observation |
| `source` | `text` | No | First source that found the pool |
| `is_canonical_candidate` | `boolean` | No | Default `false` |
| `canonical_confidence` | `confidence_level` | No | Default `low` |
| `canonical_reason` | `text` | Yes | Short explanation of canonical-pool decision |
| `created_at` | `timestamptz` | No | Row creation time |
| `updated_at` | `timestamptz` | No | Row update time |

## Constraints

```sql
PRIMARY KEY (id);
UNIQUE (chain_id, address);
```

## Indexes

```sql
CREATE INDEX idx_pools_token ON pools (base_token_id);
CREATE INDEX idx_pools_token_canonical ON pools (base_token_id, is_canonical_candidate);
CREATE INDEX idx_pools_pair_created_at ON pools (pair_created_at DESC);
CREATE INDEX idx_pools_dex_id ON pools (dex_id);
CREATE INDEX idx_pools_quote_token ON pools (quote_token_symbol);
```

## Notes

- The product token should usually be the non-blue-chip side of the pair.
- If token-side detection is ambiguous, store the provider's interpretation but set low confidence in scoring.
- `is_canonical_candidate` is not a permanent truth. It can change as liquidity moves or better data arrives.

---

# Table: `market_snapshots`

## Purpose

Point-in-time market observation for a token/pool.

This table is append-oriented. Do not overwrite past market snapshots.

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `token_id` | `uuid` | No | FK to `tokens.id` |
| `pool_id` | `uuid` | Yes | FK to `pools.id`; nullable if source is token-level |
| `source` | `text` | No | `dexscreener`, `geckoterminal`, `rpc`, etc. |
| `observed_at` | `timestamptz` | No | Time provider response was fetched/observed |
| `price_usd` | `numeric(38,18)` | Yes | Provider-derived USD price |
| `liquidity_usd` | `numeric(38,8)` | Yes | Raw liquidity USD |
| `fdv_usd` | `numeric(38,8)` | Yes | FDV if available; confidence-adjusted downstream |
| `market_cap_usd` | `numeric(38,8)` | Yes | Market cap if available; confidence-adjusted downstream |
| `volume_5m_usd` | `numeric(38,8)` | Yes | 5-minute volume |
| `volume_1h_usd` | `numeric(38,8)` | Yes | 1-hour volume |
| `volume_6h_usd` | `numeric(38,8)` | Yes | 6-hour volume |
| `volume_24h_usd` | `numeric(38,8)` | Yes | 24-hour volume |
| `txns_5m_buys` | `integer` | Yes | 5-minute buys |
| `txns_5m_sells` | `integer` | Yes | 5-minute sells |
| `txns_1h_buys` | `integer` | Yes | 1-hour buys |
| `txns_1h_sells` | `integer` | Yes | 1-hour sells |
| `buyers_5m` | `integer` | Yes | If provider exposes buyer counts |
| `sellers_5m` | `integer` | Yes | If provider exposes seller counts |
| `raw_payload_id` | `uuid` | Yes | FK to `source_observations.id` |
| `created_at` | `timestamptz` | No | Row creation time |

## Constraints

```sql
PRIMARY KEY (id);
```

Optional dedupe constraint:

```sql
UNIQUE (token_id, pool_id, source, observed_at);
```

## Indexes

```sql
CREATE INDEX idx_market_snapshots_token_observed ON market_snapshots (token_id, observed_at DESC);
CREATE INDEX idx_market_snapshots_pool_observed ON market_snapshots (pool_id, observed_at DESC);
CREATE INDEX idx_market_snapshots_source_observed ON market_snapshots (source, observed_at DESC);
CREATE INDEX idx_market_snapshots_liquidity ON market_snapshots (liquidity_usd DESC);
```

## Notes

- Do not compute high-confidence market-cap or FDV logic when supply is unverified or provider cap fields are missing.
- Volume is useful context but gameable. Scoring should not simply rank by raw volume.

---

# Table: `risk_checks`

## Purpose

Provider-derived contract and trading-risk assessment.

This table is append-oriented because risk scanners may update coverage after first observation.

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `token_id` | `uuid` | No | FK to `tokens.id` |
| `source` | `text` | No | `goplus`, `tokensniffer`, `basescan`, `manual` |
| `observed_at` | `timestamptz` | No | Fetch timestamp |
| `is_honeypot` | `boolean` | Yes | `NULL` means unknown |
| `buy_tax` | `numeric(10,4)` | Yes | Percent or decimal normalized by app convention |
| `sell_tax` | `numeric(10,4)` | Yes | Percent or decimal normalized by app convention |
| `is_tax_modifiable` | `boolean` | Yes | Mutable tax risk |
| `has_blacklist` | `boolean` | Yes | Blacklist logic flag |
| `has_whitelist` | `boolean` | Yes | Whitelist logic flag |
| `can_mint` | `boolean` | Yes | Mint authority risk |
| `owner_address` | `text` | Yes | Owner/admin if available |
| `ownership_renounced` | `boolean` | Yes | Provider-derived, not absolute truth |
| `is_proxy` | `boolean` | Yes | Proxy/upgradeability flag |
| `is_verified` | `boolean` | Yes | Source verification/open-source flag |
| `top_holder_pct` | `numeric(10,4)` | Yes | Percent |
| `top10_holder_pct` | `numeric(10,4)` | Yes | Percent |
| `lp_locked_or_burned` | `boolean` | Yes | Must not be treated as sufficient safety |
| `scanner_score` | `numeric(10,4)` | Yes | Provider score if available |
| `risk_level` | `risk_level` | No | Default `unknown` |
| `risk_summary` | `text` | Yes | Short normalized summary |
| `raw_payload_id` | `uuid` | Yes | FK to `source_observations.id` |
| `created_at` | `timestamptz` | No | Row creation time |

## Constraints

```sql
PRIMARY KEY (id);
```

Optional dedupe constraint:

```sql
UNIQUE (token_id, source, observed_at);
```

## Indexes

```sql
CREATE INDEX idx_risk_checks_token_observed ON risk_checks (token_id, observed_at DESC);
CREATE INDEX idx_risk_checks_risk_level ON risk_checks (risk_level);
CREATE INDEX idx_risk_checks_honeypot ON risk_checks (is_honeypot);
CREATE INDEX idx_risk_checks_sell_tax ON risk_checks (sell_tax DESC);
```

## Notes

- Scanner output is evidence, not truth.
- Severe flags can force `Risky`, but lack of severe flags does not imply safety.
- Percent normalization must be consistent. Pick one convention in code and test it: either `5.0` means 5%, or `0.05` means 5%. Prefer `5.0` for readability in the DB.

---

# Table: `deployer_history_snapshots`

## Purpose

Point-in-time summary of deployer behavior.

This table allows the scoring engine to use deployer context without requiring expensive history queries on every feed render.

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `deployer_id` | `uuid` | No | FK to `deployers.id` |
| `observed_at` | `timestamptz` | No | Snapshot timestamp |
| `prior_contract_count` | `integer` | Yes | External/API-derived count if available |
| `prior_token_count` | `integer` | Yes | External/API-derived token count if available |
| `prior_launch_count` | `integer` | Yes | Launch count if available |
| `internal_prior_seen_token_count` | `integer` | No | Count from this system before current token |
| `verified_contract_count` | `integer` | Yes | If obtainable |
| `suspicious_prior_launch_count` | `integer` | Yes | v0 likely nullable/placeholder |
| `repeated_template_confidence` | `confidence_level` | Yes | Optional; can be null in v0 |
| `history_confidence` | `confidence_level` | No | Confidence in deployer-history summary |
| `summary` | `text` | Yes | Example: `repeat deployer seen 3 times internally` |
| `raw_payload_id` | `uuid` | Yes | FK to `source_observations.id` |
| `created_at` | `timestamptz` | No | Row creation time |

## Constraints

```sql
PRIMARY KEY (id);
```

## Indexes

```sql
CREATE INDEX idx_deployer_history_deployer_observed
  ON deployer_history_snapshots (deployer_id, observed_at DESC);
CREATE INDEX idx_deployer_history_confidence
  ON deployer_history_snapshots (history_confidence);
```

## Notes

- v0 deployer history can be shallow.
- Internal prior-token count is usually the most reliable first signal.
- Missing external history should lower confidence, not imply clean history.

---

# Table: `token_scores`

## Purpose

Stores explainable score snapshots for ranked feed rendering.

Every scored token should receive:

```text
contract risk score
liquidity quality score
deployer history score
overall score
triage label
confidence
reason summary
reason details
```

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `token_id` | `uuid` | No | FK to `tokens.id` |
| `canonical_pool_id` | `uuid` | Yes | FK to `pools.id` |
| `market_snapshot_id` | `uuid` | Yes | FK to `market_snapshots.id` |
| `risk_check_id` | `uuid` | Yes | FK to `risk_checks.id` |
| `deployer_history_snapshot_id` | `uuid` | Yes | FK to `deployer_history_snapshots.id` |
| `scored_at` | `timestamptz` | No | Score timestamp |
| `contract_risk_score` | `numeric(6,2)` | No | 0-100; higher is safer/better |
| `liquidity_quality_score` | `numeric(6,2)` | No | 0-100 |
| `deployer_history_score` | `numeric(6,2)` | No | 0-100 |
| `overall_score` | `numeric(6,2)` | No | Weighted aggregate |
| `triage_label` | `triage_label` | No | Research workflow state |
| `confidence` | `confidence_level` | No | Overall scoring confidence |
| `reason_summary` | `text` | No | Short feed-ready explanation |
| `reason_details` | `jsonb` | No | Array/object of detailed drivers |
| `critical_flags` | `jsonb` | No | Array/object of hard downgrade flags |
| `created_at` | `timestamptz` | No | Row creation time |

## Constraints

```sql
PRIMARY KEY (id);
```

Optional dedupe constraint:

```sql
UNIQUE (token_id, scored_at);
```

## Indexes

```sql
CREATE INDEX idx_token_scores_token_scored ON token_scores (token_id, scored_at DESC);
CREATE INDEX idx_token_scores_ranked ON token_scores (triage_label, overall_score DESC, scored_at DESC);
CREATE INDEX idx_token_scores_overall ON token_scores (overall_score DESC);
CREATE INDEX idx_token_scores_confidence ON token_scores (confidence);
```

## Notes

- Scores are snapshots, not mutable token fields.
- Feed rendering should use the latest score per token.
- Every score must include a reason string. If the reason cannot be generated, scoring should fail for that token rather than silently insert an opaque row.

---

# Table: `alerts`

## Purpose

Stores v0 alerts.

Only two alert types are in scope:

```text
new_high_score_launch
obvious_high_risk_launch
```

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `token_id` | `uuid` | No | FK to `tokens.id` |
| `token_score_id` | `uuid` | Yes | FK to `token_scores.id` |
| `alert_type` | `alert_type` | No | v0 alert type |
| `severity` | `alert_severity` | No | Severity for dashboard flag |
| `title` | `text` | No | Short title |
| `message` | `text` | No | Feed/display message |
| `score_at_alert` | `numeric(6,2)` | Yes | Overall score at alert time |
| `reason_details` | `jsonb` | No | Evidence for the alert |
| `dedupe_key` | `text` | No | Unique key for suppressing duplicate alerts |
| `state_hash` | `text` | Yes | Optional hash of relevant score/risk state |
| `created_at` | `timestamptz` | No | Alert creation time |
| `acknowledged_at` | `timestamptz` | Yes | Optional; UI can defer acknowledgement |

## Constraints

```sql
PRIMARY KEY (id);
UNIQUE (dedupe_key);
```

## Indexes

```sql
CREATE INDEX idx_alerts_token_created ON alerts (token_id, created_at DESC);
CREATE INDEX idx_alerts_created ON alerts (created_at DESC);
CREATE INDEX idx_alerts_unacknowledged ON alerts (acknowledged_at) WHERE acknowledged_at IS NULL;
CREATE INDEX idx_alerts_type_severity ON alerts (alert_type, severity);
```

## Dedupe Key Format

Suggested v0 format:

```text
{alert_type}:{chain_id}:{token_address}:{state_bucket}
```

Examples:

```text
new_high_score_launch:8453:0xabc...:score_ge_80
obvious_high_risk_launch:8453:0xabc...:honeypot_true
```

## Notes

- Alert delivery in v0 is Postgres row + worker console log + dashboard flag.
- Do not build email, Telegram, webhook, notification preferences, or alert inbox polish yet.

---

# Table: `source_observations`

## Purpose

Stores raw provider payloads and provider errors.

This is the audit/debugging backbone of the MVP.

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `source` | `text` | No | `dexscreener`, `geckoterminal`, `goplus`, `basescan`, `rpc` |
| `entity_type` | `text` | No | `token`, `pool`, `market_snapshot`, `risk_check`, `deployer`, etc. |
| `entity_key` | `text` | No | Token/pool/deployer key, usually chain + address |
| `fetched_at` | `timestamptz` | No | Fetch timestamp |
| `request_url` | `text` | Yes | Full or redacted URL |
| `request_params_hash` | `text` | Yes | Stable hash of request params |
| `response_status` | `integer` | Yes | HTTP/RPC status if available |
| `duration_ms` | `integer` | Yes | Provider request duration |
| `raw_json` | `jsonb` | Yes | Raw JSON response |
| `error` | `text` | Yes | Error message if request/parse failed |
| `error_type` | `text` | Yes | `network`, `rate_limit`, `parse`, `provider`, etc. |
| `created_at` | `timestamptz` | No | Row creation time |

## Constraints

```sql
PRIMARY KEY (id);
```

Optional dedupe helper:

```sql
CREATE INDEX idx_source_observations_request_hash
  ON source_observations (source, request_params_hash, fetched_at DESC);
```

## Indexes

```sql
CREATE INDEX idx_source_observations_entity
  ON source_observations (entity_type, entity_key, fetched_at DESC);
CREATE INDEX idx_source_observations_source_fetched
  ON source_observations (source, fetched_at DESC);
CREATE INDEX idx_source_observations_errors
  ON source_observations (source, fetched_at DESC)
  WHERE error IS NOT NULL;
```

## Notes

- This table can grow quickly. That is acceptable for v0.
- Later retention policy can archive or prune raw payloads older than a threshold.
- Do not store API keys or sensitive headers in `request_url`.

---

# Table: `worker_runs`

## Purpose

Operational observability for the local worker loop.

This table makes it possible to answer:

```text
When did the worker last run?
Did it succeed?
How many candidates did it process?
Which provider failed?
```

## Columns

| Column | Type | Nullable | Notes |
|---|---:|---:|---|
| `id` | `uuid` | No | Primary key |
| `started_at` | `timestamptz` | No | Run start |
| `completed_at` | `timestamptz` | Yes | Run completion |
| `status` | `worker_run_status` | No | `running`, `success`, `partial_failure`, `failure` |
| `candidates_fetched` | `integer` | No | Default `0` |
| `tokens_inserted` | `integer` | No | Default `0` |
| `tokens_updated` | `integer` | No | Default `0` |
| `pools_inserted` | `integer` | No | Default `0` |
| `pools_updated` | `integer` | No | Default `0` |
| `market_snapshots_inserted` | `integer` | No | Default `0` |
| `risk_checks_inserted` | `integer` | No | Default `0` |
| `deployer_snapshots_inserted` | `integer` | No | Default `0` |
| `scores_computed` | `integer` | No | Default `0` |
| `alerts_created` | `integer` | No | Default `0` |
| `provider_error_count` | `integer` | No | Default `0` |
| `error_summary` | `text` | Yes | Short human-readable summary |
| `error_details` | `jsonb` | Yes | Structured provider/pipeline errors |
| `created_at` | `timestamptz` | No | Row creation time |

## Constraints

```sql
PRIMARY KEY (id);
```

## Indexes

```sql
CREATE INDEX idx_worker_runs_started ON worker_runs (started_at DESC);
CREATE INDEX idx_worker_runs_status ON worker_runs (status, started_at DESC);
```

---

# Feed Query Design

## Goal

`GET /api/launches` should return one row per token using:

- latest token score
- latest canonical pool
- latest market snapshot for that pool
- latest risk check
- latest deployer-history snapshot
- latest unacknowledged alert flag

## Recommended SQL Shape

Use lateral joins for latest-per-token rows.

```sql
SELECT
  t.id AS token_id,
  t.chain_id,
  t.address AS token_address,
  t.name,
  t.symbol,
  t.first_seen_at,
  t.deployer_address,

  p.id AS pool_id,
  p.address AS pool_address,
  p.dex_id,
  p.quote_token_symbol,
  p.pair_created_at,
  p.canonical_confidence,

  ms.price_usd,
  ms.liquidity_usd,
  ms.volume_5m_usd,
  ms.volume_1h_usd,
  ms.volume_24h_usd,
  ms.observed_at AS market_observed_at,

  rc.risk_level,
  rc.is_honeypot,
  rc.sell_tax,
  rc.has_blacklist,
  rc.can_mint,
  rc.observed_at AS risk_observed_at,

  dhs.history_confidence,
  dhs.internal_prior_seen_token_count,
  dhs.prior_contract_count,
  dhs.prior_token_count,
  dhs.summary AS deployer_summary,

  s.overall_score,
  s.contract_risk_score,
  s.liquidity_quality_score,
  s.deployer_history_score,
  s.triage_label,
  s.confidence,
  s.reason_summary,
  s.reason_details,
  s.scored_at,

  a.alert_type AS latest_alert_type,
  a.severity AS latest_alert_severity,
  a.created_at AS latest_alert_created_at
FROM tokens t
JOIN LATERAL (
  SELECT *
  FROM token_scores s
  WHERE s.token_id = t.id
  ORDER BY s.scored_at DESC
  LIMIT 1
) s ON true
LEFT JOIN pools p
  ON p.id = s.canonical_pool_id
LEFT JOIN market_snapshots ms
  ON ms.id = s.market_snapshot_id
LEFT JOIN risk_checks rc
  ON rc.id = s.risk_check_id
LEFT JOIN deployers d
  ON d.id = t.deployer_id
LEFT JOIN LATERAL (
  SELECT *
  FROM deployer_history_snapshots dhs
  WHERE dhs.deployer_id = d.id
  ORDER BY dhs.observed_at DESC
  LIMIT 1
) dhs ON true
LEFT JOIN LATERAL (
  SELECT *
  FROM alerts a
  WHERE a.token_id = t.id
    AND a.acknowledged_at IS NULL
  ORDER BY a.created_at DESC
  LIMIT 1
) a ON true
ORDER BY
  CASE s.triage_label
    WHEN 'High Priority' THEN 1
    WHEN 'Research Deeper' THEN 2
    WHEN 'Watch' THEN 3
    WHEN 'Risky' THEN 4
    WHEN 'Ignore' THEN 5
  END,
  s.overall_score DESC,
  s.scored_at DESC
LIMIT 100;
```

## View Option

For v0, the API can run this query directly.

If the query becomes repetitive, create a view:

```sql
CREATE VIEW latest_ranked_launches AS ...
```

Do not materialize the view until performance requires it.

---

# Idempotent Write Patterns

## Token upsert

Natural key:

```text
chain_id + address
```

Behavior:

- insert new token if unseen
- keep earliest `first_seen_at`
- update display metadata if new non-null values arrive
- update deployer fields if confidence improves
- never overwrite known deployer with null

## Pool upsert

Natural key:

```text
chain_id + address
```

Behavior:

- insert new pool if unseen
- keep earliest `first_seen_at`
- update `dex_id`, quote token, and pair creation time if improved
- canonical fields can be updated every run

## Market snapshot insert

Behavior:

- append snapshot per fetch
- optionally dedupe exact repeated `token_id + pool_id + source + observed_at`
- do not update old snapshots

## Risk check insert

Behavior:

- append when fetched
- do not assume unchanged risk means safe forever
- recheck recent tokens occasionally

## Score insert

Behavior:

- insert each computed score as a new snapshot
- if nothing changed, duplicate scores are acceptable in v0 but can be suppressed later with a score hash

## Alert insert

Behavior:

- insert if `dedupe_key` is new
- ignore conflict if alert state already emitted
- do not emit repeated high-score alerts every run for the same token/state

---

# Drizzle Implementation Notes

## Recommended file location

```text
packages/db/schema.ts
```

## Recommended shared helpers

```ts
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};
```

## Enum declarations

```ts
export const confidenceLevel = pgEnum('confidence_level', ['low', 'medium', 'high']);

export const riskLevel = pgEnum('risk_level', [
  'unknown',
  'low',
  'medium',
  'high',
  'critical',
]);

export const triageLabel = pgEnum('triage_label', [
  'Ignore',
  'Risky',
  'Watch',
  'Research Deeper',
  'High Priority',
]);
```

## Address columns

Use `text` for addresses in v0.

Add application-level validation:

```text
- must start with 0x
- must be 42 characters
- must be lowercase before insert
```

A future migration can add stronger DB-level checks.

---

# Migration Order

Recommended initial migration order:

1. Create enum types.
2. Create `source_observations`.
3. Create `deployers`.
4. Create `tokens`.
5. Create `pools`.
6. Create `market_snapshots`.
7. Create `risk_checks`.
8. Create `deployer_history_snapshots`.
9. Create `token_scores`.
10. Create `alerts`.
11. Create `worker_runs`.
12. Add indexes.
13. Add optional `latest_ranked_launches` view if desired.

---

# Retention Policy

## v0

Keep everything.

The local MVP should prioritize debugging and traceability over storage efficiency.

## Later

Potential retention policy:

| Table | Retention idea |
|---|---|
| `source_observations` | Keep 30-90 days locally, archive if useful |
| `market_snapshots` | Keep high-frequency recent data; downsample older data |
| `risk_checks` | Keep all or latest plus changes |
| `token_scores` | Keep all during validation; later downsample unchanged scores |
| `worker_runs` | Keep 30-90 days |

Do not implement retention until local storage becomes a real problem.

---

# Future Tables Not in v0

Do not add these in the first schema migration unless implementation demands them:

```text
holder_snapshots
holder_balances
pool_events
swap_events
liquidity_events
social_observations
farcaster_mentions
token_links
watchlist_items
manual_notes
provider_rate_limits
score_change_events
```

These are plausible v0.5+ additions. Adding them early increases schema and query complexity before the core ranked feed proves useful.

---

# Database Exit Criteria

The schema is acceptable for Stage 5 implementation when:

- token, pool, and deployer records can be inserted idempotently
- repeated market fetches create snapshots without corrupting identity
- risk checks can store unknown fields as null
- latest score per token can be queried easily
- alerts can be deduped deterministically
- raw provider payloads are stored and linked to normalized records
- the ranked feed query can return the required table columns

