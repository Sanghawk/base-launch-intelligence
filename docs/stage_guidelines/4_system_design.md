# Stage 4 — System Design

**Goal:** Design the boring, reliable v0 system.

**What needs to be accomplished:**

- Design the end-to-end system architecture.
- Define the core data model: tokens, pools, deployers, liquidity events, risk checks, social references, scores, and alerts.
- Define the event pipeline from launch detection to enrichment to scoring to dashboard display.
- Design the scoring model as transparent and explainable, not ML-driven.
- Define canonical pool selection logic so liquidity and price metrics are not corrupted.
- Add observability, logging, retries, and provider-failover assumptions.
- Keep the system simple enough for a solo engineer to operate.

**Gate:** Can you trace one token from launch detection → enrichment → score → alert → dashboard?
