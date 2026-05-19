# 03 — Data Source Feasibility

## Purpose

Stage 3 is the technical discovery phase for the Base Launch Intelligence Console.

The purpose of this document is to evaluate whether the required data for the MVP can be collected, normalized, and refreshed cheaply enough to support a rough internal ranked launch feed.

The MVP is not trying to build a full trading terminal, execution bot, copytrading product, or multi-chain analytics platform. It is trying to answer:

> Can I reliably collect enough Base launch, market, contract-risk, liquidity, and deployer-context data to rank new launches better than DEX Screener new Base pairs sorted by volume?

---

## Stage 3 Decisions

| Area                           | Decision                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| Frontend                       | Next.js                                                        |
| Backend                        | Node/TypeScript by default                                     |
| Rust                           | Defer unless a specific bottleneck appears                     |
| Database                       | Postgres                                                       |
| Hosting                        | Local first; later Vercel + hosted DB if useful                |
| API budget                     | Free first; paid only if a free path blocks the MVP            |
| Farcaster/Neynar               | Deferred from v0 and Stage 3 testing                           |
| API keys                       | None currently available                                       |
| Technical discovery strictness | Lightweight docs only, with recommended smoke tests documented |
| Data freshness target          | 1–5 minutes                                                    |

---

## Required Data for MVP

The v0 ranked launch feed needs enough data to compute three primary score components:

1. Contract risk
2. Liquidity quality
3. Deployer history

Supporting data is also required for token identity, launch timing, pair/pool context, and ranking confidence.

---

## Required Data Fields

### Token Identity

| Field                |    Required? | Notes                                  |
| -------------------- | -----------: | -------------------------------------- |
| Chain ID             |          Yes | Base chain ID: `8453`                  |
| Token address        |          Yes | Primary join key                       |
| Token name           |          Yes | Display only; not trusted for identity |
| Token symbol         |          Yes | Display only; can be spoofed           |
| Decimals             |          Yes | Needed for normalized balances         |
| First seen timestamp |          Yes | Internal observation timestamp         |
| Creation transaction | Nice-to-have | Useful for deployer history            |
| Deployer address     |          Yes | Needed for deployer-history score      |

### Market / Pair / Pool Data

| Field                        |    Required? | Notes                                                          |
| ---------------------------- | -----------: | -------------------------------------------------------------- |
| Pair/pool address            |          Yes | Needed to link market data                                     |
| DEX venue                    |          Yes | Aerodrome, Uniswap, etc.                                       |
| Base token / quote token     |          Yes | Needed for quote-asset quality                                 |
| Pair creation time           |          Yes | Useful for launch age                                          |
| Liquidity USD                |          Yes | Raw signal, not sufficient alone                               |
| Volume windows               |          Yes | Useful but gameable                                            |
| Transaction counts           | Nice-to-have | Useful context                                                 |
| Price USD                    |          Yes | Display/context                                                |
| FDV / market cap             | Nice-to-have | Must be confidence-adjusted                                    |
| Paid boost / promotion flags | Nice-to-have | Useful to avoid mistaking paid visibility for organic interest |

### Contract Risk Data

| Field                           |    Required? | Notes                                                 |
| ------------------------------- | -----------: | ----------------------------------------------------- |
| Contract verification status    |          Yes | Basic trust/risk input                                |
| Honeypot risk                   |          Yes | Mandatory filter if available                         |
| Buy/sell tax                    |          Yes | Mandatory filter if available                         |
| Mutable tax                     |          Yes | High-risk flag                                        |
| Blacklist/whitelist logic       |          Yes | High-risk flag                                        |
| Mint authority                  |          Yes | High-risk flag                                        |
| Owner/admin privileges          |          Yes | High-risk flag                                        |
| Proxy/upgradeability indicators | Nice-to-have | Important but may require deeper inspection           |
| LP lock/burn status             | Nice-to-have | Useful but should not be treated as sufficient safety |

### Liquidity Quality Data

| Field                     |                      Required? | Notes                                       |
| ------------------------- | -----------------------------: | ------------------------------------------- |
| Raw liquidity             |                            Yes | Baseline input                              |
| Quote asset               |                            Yes | ETH/USDC stronger than obscure quote assets |
| Pool age                  |                            Yes | Context                                     |
| Canonical pool confidence |                            Yes | Needed to avoid scoring wrong pool          |
| Price impact estimate     | Nice-to-have v0; stronger v0.5 | Better than nominal liquidity               |
| Liquidity trend           |                   Nice-to-have | Useful after snapshots exist                |
| Multi-pool fragmentation  |                   Nice-to-have | Important but can be added after basic MVP  |

### Deployer History Data

| Field                       |        Required? | Notes                                     |
| --------------------------- | ---------------: | ----------------------------------------- |
| Deployer address            |              Yes | Core input                                |
| Number of prior deployments | Yes, if feasible | Basic v0 deployer-history signal          |
| Prior token addresses       |     Nice-to-have | Useful for later enrichment               |
| Prior suspicious launches   |     Nice-to-have | Likely hard without history               |
| Prior liquidity behavior    |         Deferred | v0.5+                                     |
| Factory relationship        |     Nice-to-have | Useful for launch-platform classification |

---

## Candidate Data Sources

## 1. Base RPC

### Role

Base RPC is the primary source for onchain observation.

Likely uses:

- Block reads
- Transaction reads
- Log queries
- Contract calls
- Pool creation event detection
- ERC-20 metadata reads
- Basic deployer extraction from transactions

### MVP Fit

| Category   | Assessment                                                         |
| ---------- | ------------------------------------------------------------------ |
| MVP value  | High                                                               |
| Cost       | Free initially if using public RPC; production providers later     |
| Freshness  | Good enough for 1–5 minute MVP target                              |
| Complexity | Moderate                                                           |
| Risk       | Public endpoints may be rate-limited and unsuitable for production |

### Recommended MVP Use

Use Base RPC for targeted reads and log queries only. Do not attempt full-chain indexing in v0.

Recommended approach:

1. Start with provider/public RPC for local prototype.
2. Query recent logs for known DEX factory events.
3. Read token metadata and deployer-related transaction data.
4. Store normalized observations in Postgres.
5. Add provider fallback later if the MVP proves useful.

### Risks

- Public RPC may rate-limit or lag.
- Chain-wide scanning can become expensive quickly.
- Raw RPC alone may not easily discover every relevant launch surface.
- Event coverage depends on known factory contracts and ABI support.

---

## 2. Base Flashblocks RPC

### Role

Flashblocks can provide faster post-ordering visibility through preconfirmation state.

### MVP Fit

| Category   | Assessment                                                             |
| ---------- | ---------------------------------------------------------------------- |
| MVP value  | Medium for v0, higher later                                            |
| Cost       | Depends on provider                                                    |
| Freshness  | Excellent, but not required for 1–5 minute target                      |
| Complexity | Moderate                                                               |
| Risk       | Not a public mempool; requires correct mental model and fallback logic |

### Recommended MVP Use

Do not make Flashblocks required for the first local MVP.

Use standard block/log polling first. Consider Flashblocks later if the ranked feed is useful and detection speed becomes an important differentiator.

### Key Constraint

Flashblocks does not create a public mempool edge. It is useful for faster observed state, not privileged pre-trade visibility.

---

## 3. DEX Screener

### Role

DEX Screener is the best first market-data enrichment source.

Likely uses:

- Pair lookup
- Token/pair search
- Market data enrichment
- Liquidity
- Volume
- Pair creation time
- Price
- Boost/promotion metadata where available

### MVP Fit

| Category   | Assessment                                           |
| ---------- | ---------------------------------------------------- |
| MVP value  | Very high                                            |
| Cost       | Free public API                                      |
| Freshness  | Good enough for dashboard ranking                    |
| Complexity | Low                                                  |
| Risk       | Can create discovery bias if treated as ground truth |

### Recommended MVP Use

Use DEX Screener as the first market-enrichment layer.

For v0, it should provide:

- pair address
- DEX ID
- liquidity USD
- volume windows
- pair creation time
- price USD
- FDV/market cap if available
- token links where available

### Risks

- Tokens may appear after some delay.
- Boosted/trending visibility may be paid or manipulated.
- DEX Screener should not be treated as the only discovery source long term.
- DEX Screener data should be cached and normalized.

---

## 4. GeckoTerminal

### Role

GeckoTerminal is a useful pool and market-data cross-check.

Likely uses:

- Token pools
- Pool metadata
- OHLCV
- Liquidity
- Top-pool comparison
- Market cap / FDV cross-checks

### MVP Fit

| Category   | Assessment                                      |
| ---------- | ----------------------------------------------- |
| MVP value  | Medium-high                                     |
| Cost       | Free/public but rate-limited                    |
| Freshness  | Good enough for minute-level features           |
| Complexity | Low-moderate                                    |
| Risk       | Public rate limits may constrain broad scanning |

### Recommended MVP Use

Use GeckoTerminal as a secondary source only.

Best use cases:

- Cross-check DEX Screener liquidity
- Compare pools for the same token
- Improve canonical pool confidence
- Validate whether market cap fields are missing or unreliable

### Risks

- Low public rate limits may prevent aggressive polling.
- Top-pool logic may not match your canonical-pool logic.
- Market-cap fields may be missing when supply is unverified.

---

## 5. Basescan

### Role

Basescan is useful for explorer-style enrichment, not real-time ingestion.

Likely uses:

- Contract verification status
- Deployer address lookups
- Contract creation metadata
- Token transfer history
- Holder checks, if available through API or page-derived workflow
- Transaction history for deployer context

### MVP Fit

| Category   | Assessment                                               |
| ---------- | -------------------------------------------------------- |
| MVP value  | High                                                     |
| Cost       | Free tier likely enough for prototype if key is obtained |
| Freshness  | Good enough for risk/deployer enrichment                 |
| Complexity | Low-moderate                                             |
| Risk       | Low throughput; not a stream                             |

### Recommended MVP Use

Use Basescan as a secondary enrichment source.

v0 goals:

- verify contract status
- identify deployer when possible
- count simple prior activity for deployer
- link out to Basescan for manual inspection

### Risks

- Requires API key.
- Rate limits may be tight.
- It is not appropriate as the primary event stream.
- Some deployer-history queries may be expensive or incomplete.

---

## 6. GoPlus

### Role

GoPlus is a strong first-pass token-security enrichment source.

Likely uses:

- Token security endpoint for Base chain
- Honeypot flags
- Tax flags
- Owner/admin risk
- Mint risk
- Blacklist/whitelist flags
- Holder concentration data where available
- LP lock information where available

### MVP Fit

| Category   | Assessment                                              |
| ---------- | ------------------------------------------------------- |
| MVP value  | Very high                                               |
| Cost       | Free/public path may be available; confirm before build |
| Freshness  | Good enough for MVP                                     |
| Complexity | Low                                                     |
| Risk       | Scanner output is not ground truth                      |

### Recommended MVP Use

Use GoPlus as the first contract-risk enrichment option.

Do not treat GoPlus as the final score. Treat it as evidence feeding the contract-risk component.

### Risks

- False negatives are possible.
- Delayed activations may not be caught.
- Some fields may be missing or ambiguous.
- The product must expose scanner confidence and reason strings.

---

## 7. TokenSniffer

### Role

TokenSniffer can provide an additional scam/spam and token-risk score.

### MVP Fit

| Category   | Assessment                           |
| ---------- | ------------------------------------ |
| MVP value  | Medium-high                          |
| Cost       | Unclear; verify before relying on it |
| Freshness  | Good enough if accessible            |
| Complexity | Low if API access is available       |
| Risk       | Pricing/access may be a blocker      |

### Recommended MVP Use

Treat TokenSniffer as optional in v0.

Use it only if access is easy and free or low-cost.

### Risks

- API access and pricing may block use.
- Scanner score should not be treated as truth.
- May overlap with GoPlus enough that it is not needed for the first prototype.

---

## 8. Neynar / Farcaster

### Role

Farcaster is important to the broader Base-native thesis, but it is deferred from v0.

Likely future uses:

- Contract-resolved cast mentions
- Creator linkage
- Social velocity
- Recasts/replies
- Channel context
- Profile credibility

### MVP Fit

| Category   | Assessment                          |
| ---------- | ----------------------------------- |
| MVP value  | Deferred                            |
| Cost       | May require key/plan                |
| Freshness  | Good enough for social signals      |
| Complexity | Moderate                            |
| Risk       | Resolver complexity and noisy joins |

### Recommended MVP Use

Do not include in Stage 3 smoke testing.

Revisit in v0.5 after the core ranked feed works with onchain, risk, liquidity, and deployer signals.

---

## Recommended Source Priority

## v0 Required

| Priority | Source       | Why                                                    |
| -------: | ------------ | ------------------------------------------------------ |
|        1 | DEX Screener | Fastest path to market/pair data                       |
|        2 | Base RPC     | Required for onchain verification and future ingestion |
|        3 | GoPlus       | Fast contract-risk enrichment                          |
|        4 | Basescan     | Verification/deployer augmentation                     |
|        5 | Postgres     | Durable normalized store                               |

## v0 Optional

| Source          | Use if                                    |
| --------------- | ----------------------------------------- |
| GeckoTerminal   | Needed to cross-check pool/liquidity data |
| TokenSniffer    | Access is easy and free/cheap             |
| Flashblocks RPC | Detection speed becomes important         |

## Deferred

| Source                | Defer reason                                             |
| --------------------- | -------------------------------------------------------- |
| Neynar/Farcaster      | Social signal deferred to v0.5                           |
| X/Twitter             | Too noisy and costly for v0                              |
| Telegram              | Weak as a broad input source                             |
| Self-hosted Base node | Too much infrastructure for unvalidated MVP              |
| Bitquery              | Useful but likely paid/overkill for v0                   |
| The Graph             | Useful later for known schemas, not first discovery loop |

---

## Feasibility Assessment by MVP Capability

## 1. New Launch / Pair Discovery

### Feasibility

Medium.

### Recommended v0 path

Start with DEX Screener new/recent Base pairs or pair search/enrichment, then add Base RPC factory-event polling if needed.

### Risk

Using DEX Screener alone may miss launches before they appear on DEX Screener. That is acceptable for the first rough MVP if the success metric is workflow utility, not lowest-latency detection.

---

## 2. Market Enrichment

### Feasibility

High.

### Recommended v0 path

Use DEX Screener first. Use GeckoTerminal as a cross-check if the DEX Screener data appears incomplete or inconsistent.

---

## 3. Contract Risk

### Feasibility

High.

### Recommended v0 path

Use GoPlus first. Add Basescan verification status. Add TokenSniffer only if access is easy.

---

## 4. Liquidity Quality

### Feasibility

Medium-high.

### Recommended v0 path

Start with a simple liquidity-quality score:

- raw liquidity USD
- quote asset quality
- pair age
- DEX venue
- liquidity-to-FDV ratio if reliable
- basic canonical-pool confidence

Defer advanced slippage simulation and concentrated-liquidity range analysis.

---

## 5. Deployer History

### Feasibility

Medium.

### Recommended v0 path

Start with basic deployer history:

- deployer address
- number of prior contract creations if obtainable
- prior token deployments if easily detected
- verification pattern if easily available

Do not attempt full rug-history or wallet-cluster analysis in v0.

---

## 6. Ranked Feed

### Feasibility

High if the scoring model is simple.

### Recommended v0 path

Compute three component scores:

- `contract_risk_score`
- `liquidity_quality_score`
- `deployer_history_score`

Then compute:

- `overall_score`
- `triage_label`
- `reason_string`
- `confidence_level`

---

## Rate Limit and Cost Strategy

## Principles

- Cache aggressively.
- Store raw payloads for debugging.
- Avoid re-fetching static metadata.
- Use backoff and retry logic.
- Do not poll every source at the same frequency.
- Defer paid providers until a free path blocks the MVP.

## Suggested Refresh Cadence

| Data Type                 |                           Suggested Cadence |
| ------------------------- | ------------------------------------------: |
| New pairs / launch feed   |                                 1–5 minutes |
| DEX Screener market data  |               1–5 minutes for recent tokens |
| GeckoTerminal cross-check |                   5–15 minutes or on demand |
| GoPlus risk check         | Once at first seen, then occasional recheck |
| Basescan verification     | Once at first seen, then occasional recheck |
| Deployer history          |                  On first seen, then cached |
| Old token market updates  |                    Reduce frequency or stop |

---

## Recommended Smoke Tests Before Implementation

Even though Stage 3 is lightweight docs only, the following smoke tests should be run before heavy implementation:

1. Fetch recent Base pairs from DEX Screener.
2. Pick five token addresses and fetch market data.
3. Fetch GoPlus token-security data for the same five tokens.
4. Fetch Basescan verification/deployer data for the same five tokens.
5. Store normalized rows in a local Postgres table.
6. Compute a dummy score and triage label.
7. Render the rows in a rough local table.

---

## Stage 3 Feasibility Conclusion

The MVP appears feasible with a free-first, Node/TypeScript, Postgres, local-development stack.

The highest-risk technical assumptions are:

1. Reliable new-launch/pair discovery without paid providers.
2. Deployer-history quality from free sources.
3. Canonical pool confidence with limited data.
4. API rate limits and missing fields.
5. Avoiding overconfidence in risk-scanner outputs.

Stage 3 should proceed with a simple architecture and defer Rust, Farcaster, paid APIs, self-hosted nodes, and advanced event indexing until the ranked feed proves useful.
