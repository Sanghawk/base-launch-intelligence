# 02 — MVP Scope

## MVP Objective

Build the smallest useful version of a Base launch intelligence console.

The MVP should provide a rough internal ranked feed of new Base launches, scored by:

- contract risk
- liquidity quality
- deployer history

The product should help answer:

> Which new Base launches deserve deeper investigation, and which should be ignored or treated as risky?

## Scope Philosophy
c
The MVP should be a narrow vertical slice, not a broad dashboard.

Prioritize:

- useful ranking
- clear triage labels
- explainable reason strings
- fast-enough refresh
- high-risk filtering
- high-score surfacing

Deprioritize:

- visual polish
- full token detail pages
- advanced social intelligence
- wallet graphs
- multi-chain support
- monetization
- execution features

## In Scope

## 1. Ranked Launch Feed

The main screen is a table of new Base launches ordered by score or priority.

The feed should include:

- token name
- token symbol
- token address
- first seen time
- pool/pair address
- venue, if available
- liquidity
- volume
- token age
- overall score
- triage label
- risk summary
- liquidity summary
- deployer summary
- reason string
- last updated timestamp

## 2. Triage Labels

The product should support five labels:

- Ignore
- Risky
- Watch
- Research Deeper
- High Priority

These labels represent research workflow states, not trade instructions.

## 3. Contract-Risk Component

The contract-risk component should include available indicators such as:

- contract verification
- honeypot flags
- buy tax
- sell tax
- mutable tax
- blacklist/whitelist logic
- mint authority
- owner/admin powers
- proxy risk
- LP lock/burn signals, if available

Minimum acceptable v0:

- consume one risk source or scanner
- store risk result
- produce a risk label
- show a reason string

## 4. Liquidity-Quality Component

The liquidity-quality component should include available indicators such as:

- liquidity amount
- volume
- pair age
- quote asset quality
- primary pool/pair candidate
- venue
- basic liquidity-to-volume sanity check
- basic canonical-pool confidence

Minimum acceptable v0:

- show liquidity and volume
- identify primary pair/pool candidate
- assign basic liquidity-quality label
- show a reason string

## 5. Deployer-History Component

The deployer-history component should include available indicators such as:

- deployer address
- prior deployments, if available
- prior token launches, if available
- deployer age or first-seen time, if available
- repeat-launch behavior
- suspicious prior behavior, if detectable

Minimum acceptable v0:

- identify deployer address
- classify as unknown, new, repeat, or suspicious where possible
- show a reason string

## 6. Basic Alerts

v0 alert types:

- new high-score launch
- obvious high-risk launch

Minimum acceptable v0:

- alerts can be simple logs, console output, email, webhook, Telegram bot message, or dashboard flag
- no complex alert inbox required

## 7. 1–5 Minute Refresh Cadence

The product should update frequently enough to support monitoring.

Target:

> Refresh or ingest every 1–5 minutes.

Sub-second infrastructure is not required for v0.

## Out of Scope

The following are explicitly out of scope for v0:

- trade execution
- copytrading
- paid signal group mechanics
- portfolio tracking
- multi-chain support
- token recommendations
- black-box ML ranking
- public-mempool sniping
- generic smart-money labels
- full X/Twitter sentiment ingestion
- Telegram ingestion
- Farcaster/Base-native social scoring
- wallet-cohort overlap
- cross-token wallet migration
- retention curves
- full token detail page
- expandable token rows
- route simulation
- advanced price-impact modeling
- production authentication
- billing
- public launch
- public API access

## Must-Have Features

| Feature | Required? | Notes |
|---|---:|---|
| Ranked launch feed | Yes | Main product surface. |
| Contract-risk score | Yes | Mandatory trust layer. |
| Liquidity-quality score | Yes | Primary structural filter. |
| Deployer-history score | Yes | Highest-value differentiator for triage. |
| Triage labels | Yes | Makes score actionable. |
| Reason strings | Yes | Required for trust and debugging. |
| Basic alerts | Yes | Only high-score and high-risk. |
| 1–5 minute freshness | Yes | Fast enough for monitoring. |

## Should-Have Features

| Feature | Priority | Notes |
|---|---:|---|
| Basic canonical-pool confidence | High | Required to avoid bad liquidity interpretation. |
| DEX Screener comparison link | High | Helps validate against baseline. |
| Raw source timestamps | High | Helps debug stale data. |
| Score component breakdown | High | Needed for explainability. |
| Manual override notes | Medium | Useful but not mandatory. |

## Could-Have Features

| Feature | Notes |
|---|---|
| CSV export | Useful for validation, but not core. |
| Saved watchlist | Helpful after v0 is usable. |
| Simple filtering by label | Useful if table grows quickly. |
| Simple sorting by score/risk/liquidity | Useful but not central. |

## Deferred Features

## v0.5 Candidates

- Farcaster/Base-native attention signal
- known deployer launch alerts
- liquidity improvement/deterioration alerts
- social velocity spike alerts
- expandable table rows
- basic holder concentration
- paid boost awareness

## Later Candidates

- wallet-cohort overlap
- cross-token wallet migration
- retention curves
- route quality
- price-impact curves
- smart-account-aware clustering
- richer deployer reputation model
- production-grade alert routing

## Two-Week Scope Constraint

The MVP is scoped for a two-week build target with moderate flexibility.

This means:

- the MVP may overflow slightly if needed
- overflow is only acceptable for work that improves the ranked-feed triage loop
- UI polish should not cause overflow
- social features should not cause overflow
- detail pages should not cause overflow
- advanced graph or wallet features should not cause overflow

## Scope Cut Rules

If the project is running long, cut in this order:

1. UI polish
2. optional filters and sorting
3. alert delivery polish
4. deployer-history depth
5. advanced liquidity heuristics
6. any social features
7. any detail-page work
8. any wallet graph work

Do not cut:

- ranked launch feed
- triage labels
- contract-risk component
- liquidity-quality component
- deployer-history component
- reason strings

## Minimum Viable Version

The absolute minimum acceptable MVP is:

```text
A rough table of new Base launches with:
- token identity
- basic market/liquidity data
- contract-risk label
- deployer-history label
- liquidity-quality label
- overall triage label
- reason string
- timestamp
```

If this version is not useful, the product thesis should be questioned before adding more features.

## MVP Scope Summary

The MVP is not a full intelligence platform.

It is a narrow internal tool for answering:

> Is this new Base launch worth deeper research, obviously risky, or ignorable?
