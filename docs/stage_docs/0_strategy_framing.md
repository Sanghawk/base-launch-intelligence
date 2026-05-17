# 00 — Strategy Framing

## Core Product Thesis

Base token launches are fast-moving, noisy, and manipulation-prone. Generic dashboards surface activity, but they do not reliably explain whether a launch is structurally sound, risky, liquid enough to matter, or gaining credible Base-native attention.

This project will build a Base-native launch intelligence and risk-ranking console that helps an analyst quickly triage new Base token launches by combining launch detection, deployer history, contract risk, liquidity quality, holder concentration, and Base-native attention signals.

The product is not trying to predict the next 100x token. It is trying to answer:

> Among new Base token launches, which ones are worth deeper investigation, which ones are obviously risky, and which ones can be ignored?

---

## One-Sentence Product Description

A private Base launch intelligence console that ranks new Base token launches by quality, risk, liquidity survivability, and attention credibility so I can monitor the market faster and decide what deserves deeper research.

---

## Primary User

The primary user is myself as the initial analyst/operator.

This means the first version should optimize for:

- Personal monitoring
- Fast triage
- Research efficiency
- Clear explanations
- Avoiding obvious scams and low-quality launches
- Identifying launches worth deeper manual investigation

The product should not initially optimize for external users, polished SaaS onboarding, monetization, or broad market appeal.

---

## Core Job-to-be-Done

When a new Base token launches or starts gaining attention, help me quickly decide whether it is:

1. Worth deeper investigation
2. Structurally risky
3. Low-quality noise
4. Potentially gaining credible Base-native attention
5. More interesting than what public dashboards are already surfacing

The core workflow is:

> Detect launch → enrich with risk/liquidity/deployer/social data → rank → explain → decide whether to investigate further.

---

## Product Category

The product category is:

> Base-native launch intelligence and monitoring tool

It should be positioned as an intelligence console, not as a trading product.

Closest adjacent categories:

- Onchain intelligence dashboard
- Token launch monitor
- Risk-ranking console
- Crypto research workflow tool
- Base ecosystem monitoring tool

It should not be positioned as:

- Memecoin alpha terminal
- Trading bot
- Copytrading platform
- Paid signal group
- Smart-money tracker
- Price prediction engine
- Generic multi-chain dashboard

---

## Core User Promise

### Primary Promise

Rank new Base launches by quality and risk so I can quickly decide what deserves attention.

### Supporting Promises

- Save time researching new Base tokens
- Avoid obvious scams and low-quality launches
- Detect Base-native attention earlier than generic dashboards
- Surface launches worth deeper manual investigation
- Explain why a token is ranked highly or poorly
- Reduce the need to manually jump between DEX Screener, GeckoTerminal, Basescan, Farcaster, and risk scanners

---

## Strategic Bet

Generic dashboards are good at showing activity, volume, price movement, and trending tokens.

This product will be useful if it can explain launch quality better than those dashboards by combining:

- Launch detection
- Launch platform classification
- Deployer reputation
- Contract risk
- Liquidity quality
- Holder concentration
- Canonical pool confidence
- Farcaster/Base-native social attention
- Alert-worthy state changes

The strategic bet is:

> A focused Base-native ranking and triage tool can produce better research leverage than manually checking public dashboards and social feeds separately.

The edge is not raw speed alone. The edge is better interpretation of launch context.

---

## Explicit Non-Goals

The first version will not include:

- Trading bot functionality
- Copytrading
- Paid signal group mechanics
- Trade execution
- Portfolio tracking
- Multi-chain support
- Broad X/Twitter sentiment scraping
- Broad Telegram sentiment scraping
- Public-mempool sniping
- Black-box ML price prediction
- Generic smart-money labels
- Direct token recommendations
- Polished public SaaS onboarding
- Monetization
- Billing
- Team accounts
- Public API access

These are intentionally excluded to keep the first version focused, testable, and realistic within a two-week build window.

---

## Main Thesis Risks

### 1. Ranking quality may not beat public dashboards

The biggest risk is that the console does not provide better triage than DEX Screener, GeckoTerminal, Basescan, and Farcaster used manually.

### 2. Signals may be too noisy or gameable

Volume, holders, social activity, and liquidity can be manipulated. The system needs to avoid over-trusting simple metrics.

### 3. Data quality may be insufficient

Third-party APIs may have gaps, stale data, rate limits, inconsistent schemas, or delayed updates.

### 4. Canonical pool selection may be hard

If the system chooses the wrong pool as the primary pool, liquidity, price, market cap, and score calculations may become unreliable.

### 5. Base-native social signals may not add enough value

Farcaster and Base-native attention may not improve ranking quality enough to justify the integration cost.

### 6. The product may drift toward trading signals

There is a risk of scope creep from research intelligence into token recommendations, signal selling, or execution tooling.

### 7. The two-week build window may force hard tradeoffs

The first version needs to stay narrow enough to produce a working vertical slice rather than an incomplete broad dashboard.

---

## Time Constraint

The first version should be scoped for a two-week build.

This means the initial version should prioritize:

- Working ingestion
- Basic enrichment
- Transparent scoring
- Simple dashboard
- Useful triage
- Manual research support

It should deprioritize:

- Perfect UI
- Advanced wallet graph analysis
- Machine learning
- Multi-chain support
- Complex alert customization
- Monetization
- Public launch readiness

---

## Stage 0 Exit Gate

Stage 0 is complete if the following statement is clear and accepted:

> I am building a private Base-native launch intelligence and risk-ranking console for myself as the initial analyst/operator. It helps me monitor new Base token launches, rank them by quality and risk, avoid obvious garbage, and identify launches worth deeper investigation. It is not a trading bot, copytrading product, signal group, portfolio tracker, or generic multi-chain memecoin dashboard. The first version succeeds if it helps me triage Base launches faster and more effectively than manually checking public dashboards and social feeds.

---

## Stage 0 Decision Summary

| Decision Area | Decision |
|---|---|
| Primary user | Myself as initial analyst/operator |
| Use case | Personal monitoring and private research |
| Ambition level | Research project / portfolio project |
| Product category | Base-native launch intelligence and monitoring tool |
| Primary promise | Rank new Base launches by quality and risk |
| Monetization | No monetization for now |
| Positioning | Intelligence / monitoring tool |
| First-version timebox | 2 weeks |
| Hardest strategic risk | Ranking may not outperform public dashboards/manual workflow |