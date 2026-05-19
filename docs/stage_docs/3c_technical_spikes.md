# 03 — Technical Spikes

## Purpose

This document defines the technical spikes that should be used to de-risk the MVP before full implementation.

The selected Stage 3 strictness is lightweight documentation only. However, a top-tier engineering process would still define small, bounded smoke tests so implementation does not start from unverified assumptions.

These spikes are intentionally small. They should prove feasibility, not become production code.

---

## Stage 3 Technical Questions

The core technical questions are:

1. Can we discover or ingest new Base token/pool candidates with 1–5 minute freshness?
2. Can we enrich a token with market and liquidity data using free/public sources?
3. Can we fetch enough contract-risk data to flag obvious high-risk launches?
4. Can we identify a deployer and basic deployer-history context?
5. Can we compute an explainable score from incomplete data?
6. Can a rough ranked table be rendered from normalized Postgres data?
7. Can this be done without Rust, paid APIs, self-hosted nodes, or Farcaster integration?

---

## Spike Rules

Each spike should follow these rules:

- Timebox each spike.
- Use a local development environment.
- Prefer Node/TypeScript.
- Store raw responses.
- Normalize only required MVP fields.
- Avoid overbuilding abstractions.
- Document blockers and missing fields.
- Stop when feasibility is proven or disproven.

---

## Spike 1 — Fetch Candidate Base Launches / Pairs

### Goal

Prove that candidate Base token launches can be discovered or approximated using free/public data.

### Preferred Path

Start with DEX Screener recent/new Base pairs if available through API surface.

### Alternative Path

Use Base RPC to query known DEX factory events for recent blocks.

### Inputs

- No API keys if possible
- Base chain identifier
- DEX Screener API
- Optional public Base RPC

### Output

A local JSON file containing at least 20 candidate Base token/pair records.

### Required Fields

- token address
- pair/pool address
- chain ID
- DEX ID
- pair creation time if available
- liquidity if available
- source
- fetched timestamp

### Success Criteria

- At least 20 candidate tokens/pairs can be fetched.
- Data is recent enough for a 1–5 minute monitoring product or acceptable for rough MVP evaluation.
- Each candidate has a token address and pool/pair address.

### Failure Conditions

- API does not expose enough recent Base pair data.
- Rate limits prevent useful polling.
- Records lack token addresses or pool identifiers.

### Notes

For v0, it is acceptable if discovery starts from DEX Screener rather than true first-block launch detection. The product success metric is workflow utility, not execution latency.

---

## Spike 2 — Enrich Token with DEX Screener Market Data

### Goal

Prove that a token/pair can be enriched with enough market data for the ranked feed.

### Inputs

- 5–10 token addresses or pair addresses from Spike 1
- DEX Screener API

### Output

Normalized market snapshots.

### Required Fields

- price USD
- liquidity USD
- volume windows
- pair creation time
- DEX venue
- quote token
- FDV or market cap if available

### Success Criteria

- At least 80% of test tokens return usable pair/market data.
- Liquidity and volume fields are available for most records.
- Pair creation time or first-observed fallback is available.

### Failure Conditions

- Too many records are missing market data.
- DEX Screener delay is too large for a useful ranked feed.
- Fields vary too much to normalize safely.

---

## Spike 3 — Cross-Check Pool Data with GeckoTerminal

### Goal

Determine whether GeckoTerminal is useful enough as a secondary source for pool and liquidity confidence.

### Inputs

- Same token list from Spike 2
- GeckoTerminal public API

### Output

Comparison table:

```text
token_address
dexscreener_pool
geckoterminal_top_pool
dexscreener_liquidity_usd
geckoterminal_liquidity_usd
match_status
canonical_confidence
```

### Success Criteria

- GeckoTerminal resolves pools for most test tokens.
- It helps detect multiple pools or validate the primary pool.
- It improves canonical-pool confidence for at least some tokens.

### Failure Conditions

- Public rate limits are too restrictive.
- Top-pool logic conflicts often with DEX Screener and cannot be resolved.
- Data is too delayed or incomplete.

### v0 Decision Rule

If GeckoTerminal creates friction, keep it optional for v0 and rely on DEX Screener + confidence flags.

---

## Spike 4 — Fetch Contract Risk with GoPlus

### Goal

Prove that token-security data can be fetched and normalized for Base tokens.

### Inputs

- 5–10 token addresses from prior spikes
- GoPlus Token Security endpoint
- Base chain ID `8453`

### Output

Normalized risk checks.

### Required Fields

- honeypot risk
- buy tax
- sell tax
- tax modifiability
- blacklist/whitelist flags
- mint risk
- owner/admin risk
- verification/open-source flag
- holder concentration if available
- LP lock/burn information if available

### Success Criteria

- At least 80% of test tokens return a GoPlus result.
- High-risk fields are clear enough to drive a triage downgrade.
- Missing values can be represented as unknown without breaking scoring.

### Failure Conditions

- GoPlus does not support enough Base tokens.
- Critical fields are frequently missing.
- API requires paid access earlier than expected.

### Scoring Implication

GoPlus fields should feed the `contract_risk_score`, not replace it.

---

## Spike 5 — Fetch Verification and Deployer Data with Basescan

### Goal

Prove that a token's deployer and verification status can be fetched or inferred.

### Inputs

- 5–10 token addresses
- Basescan API key if required
- Optional RPC transaction receipt fallback

### Output

Normalized contract/deployer records.

### Required Fields

- contract verification status
- deployer address or creator address
- creation transaction hash if available
- proxy status if available

### Success Criteria

- Verification status is obtainable for most test tokens.
- Deployer/creator address is obtainable for most test tokens.
- Data can be cached and linked to token records.

### Failure Conditions

- API key requirement blocks testing.
- Deployer is not reliably available.
- Rate limits make batch enrichment impractical.

### v0 Fallback

If Basescan is unavailable, use GoPlus creator fields or RPC transaction data where available. If deployer cannot be found, mark deployer-history confidence as low.

---

## Spike 6 — Basic Deployer-History Summary

### Goal

Determine whether v0 deployer history can be computed cheaply enough.

### Inputs

- Deployer addresses from Spike 5
- Basescan or RPC-derived transaction data
- Internal token history table if available

### Output

Basic deployer-history snapshot.

### Required Fields

- deployer address
- prior contract count if available
- prior token count if available
- first seen timestamp
- last seen timestamp
- history confidence

### Success Criteria

- Basic deployer history can be computed for at least some deployers.
- Missing history can be represented cleanly.
- The result is useful enough to include as a score component.

### Failure Conditions

- Free APIs cannot support prior-history queries.
- Deployer attribution is too inconsistent.
- History is too shallow to be useful in v0.

### v0 Decision Rule

If deployer history is weak, keep the component but reduce its weight and show low confidence.

---

## Spike 7 — Compute Basic Score

### Goal

Prove that incomplete data can still produce an explainable MVP score.

### Inputs

- Market snapshots
- Risk checks
- Deployer-history snapshots

### Output

A score object per token:

```ts
type TokenScore = {
  contractRiskScore: number;
  liquidityQualityScore: number;
  deployerHistoryScore: number;
  overallScore: number;
  triageLabel: string;
  confidence: string;
  reasonSummary: string;
  reasonDetails: string[];
};
```

### Suggested v0 Weights

```text
Contract risk: 40%
Liquidity quality: 40%
Deployer history: 20%
```

### Suggested Label Rules

```text
Critical contract risk → Risky
Very low liquidity → Ignore or Risky
Good liquidity + low risk + neutral/good deployer → Research Deeper
Strong score + high confidence → High Priority
Incomplete data + no critical risk → Watch
```

### Success Criteria

- Every token receives a score.
- Every score has a reason string.
- Missing data lowers confidence rather than crashing the score.
- Obvious risky tokens are downgraded.

### Failure Conditions

- Too many fields are missing to score meaningfully.
- Reason strings become misleading.
- The score mostly reproduces raw liquidity or volume ranking.

---

## Spike 8 — Store Normalized Data in Postgres

### Goal

Prove that the data model can support the ranked feed locally.

### Inputs

- Normalized outputs from prior spikes
- Local Postgres

### Output

A small local database with tables for:

- tokens
- pools
- market_snapshots
- risk_checks
- deployers
- deployer_history_snapshots
- token_scores
- source_observations

### Success Criteria

- Data can be inserted idempotently.
- Repeated fetches create new snapshots without corrupting token identity.
- The latest score per token can be queried easily.

### Failure Conditions

- Schema is too complex for v0.
- Identity keys are unclear.
- Snapshot tables become hard to query.

---

## Spike 9 — Render Rough Ranked Table

### Goal

Prove that normalized data can be rendered in the product's primary v0 surface.

### Inputs

- Local Postgres data
- Next.js frontend
- API route or server action

### Output

Rough internal table.

### Required Columns

- rank
- token symbol
- token address
- pool address
- age
- liquidity
- volume
- overall score
- triage label
- contract-risk summary
- liquidity summary
- deployer summary
- confidence
- reason string
- last updated

### Success Criteria

- Ranked feed loads locally.
- The table is usable even if visually rough.
- You can quickly decide which tokens to ignore, watch, or research deeper.

### Failure Conditions

- The table does not improve triage over DEX Screener.
- Required fields are too sparse.
- Score explanations are not understandable.

---

## Spike 10 — Basic Alert Rules

### Goal

Prove that simple v0 alerts can be generated from score changes or score thresholds.

### v0 Alert Types

1. New high-score launch
2. Obvious high-risk launch

### Inputs

- Token scores
- Risk checks
- New token observations

### Output

Rows in an `alerts` table.

### Example Rules

```text
New high-score launch:
- overall_score >= 80
- confidence != low
- no critical contract-risk flag

Obvious high-risk launch:
- honeypot risk true, OR
- high sell tax, OR
- blacklist true, OR
- mint/admin critical risk, OR
- unverified + very low liquidity + suspicious deployer signal
```

### Success Criteria

- Alerts are generated deterministically.
- Alerts include reason strings.
- Alert spam is limited.

### Failure Conditions

- Too many alerts fire.
- Alerts mostly duplicate table rows without adding value.
- High-risk alerts are not explainable.

---

## Recommended Spike Order

Run the spikes in this order:

```text
1. DEX Screener candidate pair fetch
2. DEX Screener market enrichment
3. GoPlus risk enrichment
4. Basescan verification/deployer lookup
5. Basic deployer-history summary
6. Optional GeckoTerminal cross-check
7. Basic score computation
8. Postgres persistence
9. Rough ranked table
10. Basic alerts
```

This order proves the shortest path to the product surface before adding optional complexity.

---

## Explicit Non-Spikes for Stage 3

Do not spike these yet:

- Rust backend
- Farcaster/Neynar integration
- X/Twitter ingestion
- Telegram ingestion
- Full self-hosted Base node
- Kafka
- ClickHouse
- Graph database
- ML ranking model
- Wallet clustering
- Copytrading labels
- Execution system

---

## Stage 3 Go / No-Go Decision

## Go to Stage 4 if:

- Candidate Base launches/pairs can be collected.
- Market data is available for most candidates.
- Contract-risk data is obtainable for most candidates.
- Deployer attribution is at least partially feasible.
- A simple score can be computed with reason strings.
- A rough ranked table appears feasible in Next.js + Postgres.

## Narrow scope if:

- Deployer history is too weak.
- GeckoTerminal cross-checking is too rate-limited.
- Contract-risk APIs are incomplete but still somewhat useful.
- DEX Screener is sufficient for market data but not launch discovery.

## Stop or rethink if:

- New launch/pair discovery is not feasible with free/cheap sources.
- Market/risk fields are too sparse to score.
- The score mostly duplicates DEX Screener volume/liquidity sorting.
- The ranked feed would not plausibly become more useful than DEX Screener/manual workflow.

---

## Stage 3 Spike Summary

Stage 3 should not become a full build. It should prove that the core MVP loop is technically viable:

```text
candidate launch/pair
→ market enrichment
→ risk enrichment
→ deployer context
→ score
→ ranked table
→ basic alert
```

If this loop cannot be proven cheaply, the project should be narrowed before implementation.
