# 02 — Product Requirements

## Product Summary

The MVP is a private, rough internal Base launch intelligence console that ranks new Base token launches by quality and risk.

The first version should help the initial analyst/operator decide whether a new Base launch is:

- worth deeper research
- obviously risky
- ignorable
- worth watching
- higher priority than other launches

The product is not a trading terminal, token recommender, copytrading product, paid signal group, portfolio tracker, or multi-chain dashboard.

## Target User

The first user is the builder/operator of the tool.

The user is acting as an analyst monitoring Base token launches and needs a faster, more repeatable way to triage launches than manually checking DEX Screener, GeckoTerminal, Basescan, Farcaster, and risk scanners separately.

The MVP does not need onboarding, team support, billing, public-facing polish, or multi-user workflows.

## Core Problem

Base token launches are frequent, noisy, and manipulation-prone. Public dashboards show activity, but they do not reliably answer whether a launch is structurally sound, risky, liquid enough to matter, or worth deeper research.

The manual workflow is fragmented across multiple tools:

- DEX Screener for token discovery and pair data
- GeckoTerminal for pool and market-data cross-checking
- Basescan for contract and deployer inspection
- GoPlus / TokenSniffer for risk checks
- Farcaster / social surfaces for attention context

The MVP should reduce this fragmentation by producing a ranked, explainable launch feed.

## MVP Goal

Build a rough internal ranked launch feed for new Base tokens that combines:

- contract risk
- liquidity quality
- deployer history
- basic market and pool metadata required to support liquidity scoring

The MVP should answer:

> Which new Base launches deserve deeper investigation, and which should be ignored or treated as risky?

## User Workflow

The primary workflow is:

```text
Detect new Base launch
→ collect basic market and pool metadata
→ enrich with contract-risk data
→ enrich with deployer-history data
→ evaluate liquidity quality
→ assign score and triage label
→ display in ranked launch feed
→ optionally trigger high-score or high-risk alert
→ user decides whether to ignore, watch, or research deeper
```

## Core Features

### 1. Ranked Launch Feed

The main screen is a ranked table of new Base launches.

The feed should show enough information to support triage without requiring a token detail page.

Required columns:

- token name
- token symbol
- token address
- launch time or first seen time
- pair/pool address
- primary venue, if known
- liquidity
- volume
- token age
- overall score
- triage label
- contract-risk summary
- liquidity-quality summary
- deployer-history summary
- reason string
- last updated timestamp

### 2. Triage Labels

The product should use these labels:

| Label           | Meaning                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| Ignore          | Low-quality or insufficiently interesting launch; no action needed.               |
| Risky           | Obvious or material structural risk; avoid or inspect only for research purposes. |
| Watch           | Not enough confidence for deeper research, but worth monitoring.                  |
| Research Deeper | Sufficiently interesting and not obviously disqualified.                          |
| High Priority   | Strongest candidates for immediate manual review.                                 |

Labels are not trade recommendations. They are research workflow states.

### 3. Contract-Risk Scoring

Contract risk is a must-have v0 score component.

The MVP should evaluate, where data is available:

- contract verification status
- honeypot risk
- buy tax
- sell tax
- mutable tax risk
- blacklist or whitelist logic
- mint authority
- owner/admin privileges
- proxy or upgradeability risk
- LP lock or burn signals, if available
- scanner confidence and data freshness

The product should not treat any scanner as ground truth. Risk-scanner outputs are evidence inputs.

### 4. Liquidity-Quality Scoring

Liquidity quality is a must-have v0 score component.

The MVP should evaluate:

- liquidity amount
- quote asset quality
- pair age
- pool venue
- volume relative to liquidity
- apparent liquidity stability
- basic canonical-pool confidence
- whether liquidity appears too thin to matter

The MVP may use simple heuristics first. Full price-impact curves, route simulation, and advanced pool modeling can be deferred.

### 5. Deployer-History Scoring

Deployer history is a must-have v0 score component.

The MVP should evaluate:

- deployer address
- number of prior token launches, if available
- prior failed or suspicious launches, if available
- prior LP-pull or liquidity-removal patterns, if available
- repeat deployment cadence
- verification behavior
- whether the deployer is new, unknown, repeat, or suspicious

The first version can be conservative and label unknown deployers as `unknown`, not automatically bad.

### 6. Alerts

The MVP should support only two alert types:

| Alert                    | Meaning                                       |
| ------------------------ | --------------------------------------------- |
| New high-score launch    | A launch crosses the high-priority threshold. |
| Obvious high-risk launch | A launch is detected with severe risk flags.  |

Deferred alert types:

- known deployer launches again
- liquidity improves significantly
- liquidity deteriorates significantly
- social velocity spike
- social-to-contract attention changes

### 7. Data Freshness

The MVP should feel fast enough for monitoring, not execution.

Target freshness:

> 1–5 minute updates

The product does not require sub-second updates, mempool behavior, or execution-grade latency.

## Explicitly Deferred Features

The following features are out of v0:

- Farcaster/Base-native social attention scoring
- X/Twitter sentiment analysis
- Telegram ingestion
- full token detail page
- expandable rows
- trade execution
- copytrading
- paid signal mechanics
- portfolio tracking
- multi-chain support
- black-box ML ranking
- generic smart-money labels
- wallet-cohort graphing
- cross-token wallet migration
- retention curves
- route simulation
- SaaS onboarding
- billing
- public API

## Non-Goals

The MVP will not:

- predict the next 100x token
- recommend buying or selling tokens
- execute trades
- copy other wallets
- act as a signal group
- compete on public-mempool sniping
- build a generic alpha terminal
- attempt to identify real humans behind wallets
- claim scanner outputs are definitive

## Assumptions

- A ranked launch feed is more useful than a raw new-pairs feed.
- Contract risk, liquidity quality, and deployer history are sufficient to create first-pass triage value.
- Social signals are useful but can be deferred until the core ranking loop is proven.
- A rough internal UI is acceptable for v0.
- A 1–5 minute refresh loop is acceptable because the product is for research and monitoring, not execution.
- The primary comparison baseline is DEX Screener new Base pairs sorted by volume.

## Risks

| Risk                                        | Impact                        | Mitigation                                                           |
| ------------------------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| Ranked feed is not better than DEX Screener | Project may lack product edge | Compare against DEX Screener new Base pairs by volume.               |
| Contract-risk data is incomplete            | False confidence              | Show confidence and raw reason strings.                              |
| Liquidity data is misleading                | Bad ranking                   | Include canonical-pool confidence and conservative liquidity labels. |
| Deployer history is hard to infer           | Weak differentiator           | Start with shallow deployer history and mark unknowns clearly.       |
| Alerts are noisy                            | User ignores product          | Keep alerts limited to high-score and high-risk only.                |
| MVP scope expands                           | Two-week target breaks        | Keep social, detail pages, wallet graphs, and polish deferred.       |

## Acceptance Standard

The MVP is acceptable if it provides a usable ranked table where each row gives a clear reason why a token is labeled `Ignore`, `Risky`, `Watch`, `Research Deeper`, or `High Priority`.

The MVP does not need to be visually polished or externally usable.

## Stage 2 Exit Gate

Stage 2 is complete when the MVP can be described as:

> A rough internal ranked feed of new Base launches that scores each token using contract risk, liquidity quality, and deployer history, with basic alerts for high-score and high-risk launches.
