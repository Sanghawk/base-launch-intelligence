# 03 — Build vs Buy Decisions

## Purpose

This document defines what should be built internally, what should be bought or consumed from providers, and what should be deferred for the Base Launch Intelligence Console MVP.

The project is a two-week, rough internal research tool. The goal is to validate the ranked launch feed, not to build infrastructure for its own sake.

---

## Decision Principles

1. Use free/public providers first.
2. Build internally only when it is quick and directly improves the ranked feed.
3. Do not self-host infrastructure before product value is proven.
4. Avoid paid APIs unless a free path blocks the MVP.
5. Keep the stack boring: Next.js, Node/TypeScript, Postgres, local-first.
6. Defer Rust unless a measured bottleneck appears.
7. Defer Farcaster/Neynar until v0.5.
8. Prefer explainability over complexity.

---

## Summary Decision Table

| Capability                | Decision                                           | Rationale                                                                  |
| ------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| Frontend                  | Build                                              | Core product surface; use Next.js                                          |
| Backend/API               | Build                                              | Simple Node/TypeScript service/API routes are enough                       |
| Rust services             | Defer                                              | No known CPU bottleneck yet                                                |
| Database                  | Build/use Postgres                                 | Needed for normalized state and snapshots                                  |
| Launch discovery          | Use provider first, build targeted ingestion later | Avoid premature indexer complexity                                         |
| Market data               | Buy/use free provider                              | DEX Screener and GeckoTerminal are faster than building market aggregation |
| Contract-risk scanning    | Use provider                                       | GoPlus/TokenSniffer faster than custom static analysis                     |
| Deployer history          | Build basic version                                | Product-specific scoring input                                             |
| Canonical pool confidence | Build simple version                               | Critical to liquidity score quality                                        |
| Social data               | Defer                                              | Farcaster/Neynar is v0.5, not v0                                           |
| Alerts                    | Build basic version                                | Simple threshold-based alerts are core MVP utility                         |
| Execution/trading         | Do not build                                       | Explicit non-goal                                                          |
| Self-hosted Base node     | Do not build                                       | Too much infra before validation                                           |

---

# What to Build Internally

## 1. Ranked Launch Feed UI

### Decision

Build internally.

### Why

This is the product.

The MVP's primary surface is a rough internal ranked table. It should not be outsourced or over-polished.

### Scope

Build:

- Next.js page
- table layout
- ranking column
- triage label
- score columns
- reason string
- source links
- last updated timestamp

Do not build:

- full SaaS UI
- onboarding
- responsive polish
- public marketing pages
- team views
- custom design system

---

## 2. Normalization Layer

### Decision

Build internally.

### Why

The product's value depends on turning fragmented provider data into a clean, comparable launch record.

### Scope

Build normalization for:

- tokens
- pools
- market snapshots
- risk checks
- deployers
- scores
- alerts
- source observations

### Key Requirement

Store raw payloads separately from normalized rows.

---

## 3. Scoring Engine v0

### Decision

Build internally.

### Why

The score is the core product logic.

### Scope

Build transparent rule-based scoring for:

- contract risk
- liquidity quality
- deployer history
- overall score
- triage label
- reason string
- confidence level

### Do Not Build Yet

- ML ranking
- backtested alpha model
- dynamic weight optimization
- user-personalized scoring
- black-box recommendations

---

## 4. Basic Deployer History

### Decision

Build internally, but keep basic.

### Why

Deployer history is one of the project's key differentiators versus generic pair dashboards.

### v0 Scope

Build:

- deployer address capture
- first seen / last seen
- prior seen count inside your system
- prior contract/token count if easy from API
- basic labels such as `new`, `repeat`, `unknown`

Defer:

- full wallet clustering
- rug-history reconstruction
- LP-pull classification
- factory/deployer graph analysis
- cross-chain deployer identity

---

## 5. Canonical Pool Confidence

### Decision

Build simple version internally.

### Why

Wrong pool selection corrupts liquidity, price, FDV, and score interpretation.

### v0 Scope

Build a simple confidence heuristic using:

- highest liquidity pool
- known DEX venue
- quote asset quality
- pair age
- DEX Screener / GeckoTerminal agreement if available

### Output

```text
canonical_pool_confidence: low | medium | high
```

### Defer

- full route simulation
- concentrated-liquidity range analysis
- advanced slippage curves

---

## 6. Basic Alerts

### Decision

Build internally.

### Why

The selected v0 alert types are simple and tied directly to the score.

### v0 Scope

Build two alert types:

- new high-score launch
- obvious high-risk launch

### Do Not Build Yet

- alert inbox polish
- notification preferences
- multi-channel delivery
- social velocity alerts
- known-deployer alerts
- liquidity deterioration alerts

---

# What to Buy / Use as Provider

## 1. Market Data

### Decision

Use DEX Screener first.

### Why

Building market aggregation from raw onchain events would slow the MVP.

### Use For

- pair data
- price
- liquidity
- volume
- pair age
- DEX venue
- token links
- promotion metadata if available

### Fallback / Cross-check

Use GeckoTerminal if needed for:

- pool cross-checking
- top-pool comparison
- OHLCV
- liquidity confirmation

---

## 2. Contract Risk

### Decision

Use GoPlus first.

### Why

Custom contract-risk analysis is too expensive for v0.

### Use For

- honeypot risk
- tax risk
- blacklist/whitelist flags
- mint risk
- ownership/admin risk
- verification/open-source flag
- holder concentration if available
- LP lock/burn information if available

### Optional Secondary Provider

TokenSniffer, only if access is simple.

### Important Constraint

Provider scores are evidence, not truth.

---

## 3. Explorer Data

### Decision

Use Basescan if API access is available.

### Why

Explorer data is useful for verification and deployer context without building deep indexing.

### Use For

- verification status
- deployer/creator data
- creation transaction
- manual investigation links

### Fallback

If Basescan API is unavailable:

- use GoPlus creator fields where available
- use Base RPC transaction receipt where possible
- mark deployer-history confidence as low when unresolved

---

## 4. RPC Provider

### Decision

Use public/free Base RPC initially, then upgrade only if necessary.

### Why

The MVP data freshness target is 1–5 minutes, not sub-second execution.

### Use For

- token metadata reads
- transaction receipts
- targeted logs
- optional factory-event polling

### Defer

- self-hosted node
- multi-provider failover
- Flashblocks dependency

---

# What to Defer

## 1. Rust Backend

### Decision

Defer.

### Why

The MVP's bottlenecks are likely provider rate limits, data quality, missing fields, and scoring logic — not CPU performance.

### Reconsider Rust If

- Node event processing becomes CPU-bound
- custom log decoding becomes high-throughput
- price-impact simulation becomes expensive
- route simulation becomes a bottleneck
- websocket ingestion requires more robust concurrency
- a dedicated indexer service becomes necessary

### Future Rust Candidates

- event ingestion worker
- log decoder
- route simulation engine
- price-impact engine
- wallet graph computation service

---

## 2. Farcaster / Neynar

### Decision

Defer to v0.5.

### Why

Social attention is important to the broader thesis, but not required to prove the core ranked feed.

### Revisit When

- onchain/risk/liquidity ranking is working
- token identity and canonical pool logic are stable
- reason strings are useful
- there is a clear need for Base-native attention differentiation

---

## 3. Self-Hosted Base Node

### Decision

Do not build for MVP.

### Why

Self-hosting is infrastructure-heavy and does not create privileged mempool visibility.

### Revisit When

- provider costs become dominant
- RPC reliability blocks product use
- custom historical indexing becomes essential
- the product has proven value

---

## 4. Advanced Data Infrastructure

### Decision

Defer.

Do not use in MVP:

- Kafka
- ClickHouse
- graph database
- vector database
- distributed queues
- custom indexer framework
- large-scale data lake

### Why

The MVP needs a ranked table, not a data platform.

---

## 5. Advanced Signals

### Decision

Defer.

Do not build in v0:

- wallet cohort quality
- cross-token wallet migration
- retention curves
- smart-account-aware clustering
- cross-chain bridge-origin models
- social velocity
- full price-impact curves
- advanced route quality

### Why

These may be valuable later, but they are not needed to prove the first ranked feed.

---

# What Not to Build

## Explicit Non-Goals

Do not build:

- trading bot
- copytrading system
- paid signal group
- execution system
- portfolio tracker
- generic multi-chain dashboard
- public-mempool sniping
- mempool analytics
- black-box price prediction
- generic smart-money labels
- broad X/Twitter sentiment ingestion
- broad Telegram ingestion
- polished SaaS onboarding
- billing
- team accounts

These would pull the product away from the validated MVP: a private Base-native launch triage and risk-ranking console.

---

# Provider Fallback Strategy

## Market Data Fallbacks

| Primary      | Fallback      | Last Resort                 |
| ------------ | ------------- | --------------------------- |
| DEX Screener | GeckoTerminal | Base RPC-derived pool reads |

## Risk Data Fallbacks

| Primary | Fallback     | Last Resort                  |
| ------- | ------------ | ---------------------------- |
| GoPlus  | TokenSniffer | Basescan/manual verification |

## Deployer Data Fallbacks

| Primary  | Fallback             | Last Resort                         |
| -------- | -------------------- | ----------------------------------- |
| Basescan | GoPlus creator field | RPC transaction receipt/manual link |

## Discovery Fallbacks

| Primary                       | Fallback                 | Last Resort      |
| ----------------------------- | ------------------------ | ---------------- |
| DEX Screener recent/new pairs | Known DEX factory events | Manual seed list |

---

# Cost Constraints

## Current Constraint

No paid APIs for MVP unless the free path blocks feasibility.

## Acceptable Paid Upgrade Later

Paid APIs are acceptable later if they clearly improve:

- launch coverage
- data freshness
- rate-limit reliability
- deployer history
- risk enrichment
- operational stability

## Not Acceptable for MVP

Do not pay for:

- broad social firehose
- enterprise data platform
- node infrastructure before validation
- advanced graph analytics
- trading/execution infrastructure

---

# Build-vs-Buy Decisions by Stage

## Stage 3

Build:

- docs
- optional smoke tests
- normalized schemas

Use provider:

- DEX Screener
- GoPlus
- Basescan if possible
- GeckoTerminal optional

Defer:

- Rust
- Farcaster
- self-hosted node
- paid infra

## Stage 4

Build:

- system design
- database schema
- pipeline design
- score design
- alert rules

Still defer:

- Rust
- social integration
- advanced indexing

## Stage 5

Build:

- local MVP
- ranked feed
- basic ingestion/enrichment
- scoring
- alerts

Only add paid providers if MVP cannot function without them.

---

# Stage 3 Exit Gate

Stage 3 is complete when these decisions are accepted:

1. Next.js + Node/TypeScript is the default MVP stack.
2. Rust is deferred until a measured bottleneck exists.
3. Postgres is the database.
4. The MVP starts local-only.
5. DEX Screener is the first market-data source.
6. GoPlus is the first contract-risk source if accessible.
7. Basescan is used for verification/deployer augmentation if accessible.
8. GeckoTerminal is optional for pool cross-checking.
9. Farcaster/Neynar is deferred to v0.5.
10. Self-hosted Base node is explicitly not part of the MVP.
11. The MVP is feasible enough to proceed to Stage 4 system design.

---

# Final Recommendation

Use a boring free-first stack:

```text
Next.js
Node/TypeScript
Postgres
Local development
DEX Screener
GoPlus
Basescan if available
GeckoTerminal optional
```

Do not use Rust, Farcaster, paid APIs, self-hosted nodes, or advanced data infrastructure until the ranked feed proves useful.
