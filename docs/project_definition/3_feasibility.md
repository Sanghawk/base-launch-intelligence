# Stage 3 — Technical Discovery

**Goal:** De-risk the hardest engineering assumptions before committing to a full build.

**What needs to be accomplished:**

* Verify which data sources are reliable enough for the MVP.
* Test Base RPC / Flashblocks access for launch and pool detection.
* Test DEX Screener and GeckoTerminal for market and liquidity metadata.
* Test Basescan, GoPlus, or TokenSniffer for contract and risk enrichment.
* Test Neynar or Farcaster data for social-signal enrichment.
* Confirm rate limits, costs, latency, data freshness, and fallback options.
* Identify which data needs to be indexed directly versus pulled from third-party APIs.

**Gate:** Can you reliably ingest, normalize, and score the required data?