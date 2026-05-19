# 1c — Competitive Baseline

## Purpose

The purpose of this document is to define the public tools and workflows that the Base Launch Intelligence Console must improve upon.

The product does not need to replace every tool. It needs to provide a better triage layer by combining the most useful signals from multiple tools into a ranked, explainable workflow.

Primary baseline:

> Manual workflow across DEX Screener, GeckoTerminal, Basescan, Farcaster, and risk scanners.

Secondary baseline:

> DEX Screener new Base pairs sorted by volume.

---

## Tools Reviewed

The assumed competitive and workflow baseline includes:

- DEX Screener
- GeckoTerminal
- Basescan
- TokenSniffer
- GoPlus
- Farcaster/Warpcast
- X/Twitter
- Telegram
- Coinbase/Base app discovery surfaces

---

## DEX Screener Baseline

## What it is useful for

DEX Screener is likely the default retail discovery surface.

It is useful for:

- New pair discovery
- Price charts
- Volume
- Liquidity
- Pair age
- Transaction counts
- Buyer/seller counts
- Trending visibility
- Boosted tokens
- Token links
- Fast market scanning

## Likely user workflow

A user may open DEX Screener and look for:

- New Base pairs
- High-volume tokens
- Trending tokens
- Boosted tokens
- Tokens with fast price movement
- Tokens with increasing transaction count
- Tokens with enough liquidity to be worth checking

## What it does well

- Fast token discovery
- Good chart-first workflow
- Easy retail usability
- Broad market coverage
- Quick access to pair-level data
- Good for seeing what is already visible

## What it misses

- It does not fully explain contract risk.
- It does not deeply evaluate deployer history.
- It does not reliably distinguish organic attention from paid visibility.
- It does not provide project-specific quality ranking.
- It does not deeply explain liquidity survivability.
- It can overemphasize volume and short-term momentum.
- It does not provide a complete Base-native social context.
- It does not provide a clear “worth deeper research vs ignore” decision layer.

## Product implication

The product should not try to out-chart DEX Screener.

It should use DEX Screener-like data as one input, then improve on it through:

- Risk scoring
- Deployer history
- Liquidity quality
- Paid-promotion awareness
- Base-native social context
- Explainable ranking

---

## GeckoTerminal Baseline

## What it is useful for

GeckoTerminal is useful for pool and market metadata.

It can help with:

- Pool discovery
- Token price
- Liquidity
- OHLCV
- DEX venue comparison
- Cross-checking DEX Screener data
- Pool-level market context

## Likely user workflow

A user may use GeckoTerminal to:

- Cross-check token/pair data
- Look for other pools
- Confirm liquidity and volume
- Review market activity outside DEX Screener
- Compare pool quality across venues

## What it does well

- Useful market-data cross-check
- Good pool-level visibility
- Helpful for confirming that a token has meaningful activity
- Better as an enrichment source than as the only discovery interface

## What it misses

- It does not provide a complete launch-quality score.
- It does not explain deployer reputation.
- It does not fully identify scam or contract risk.
- It may not solve canonical pool selection by itself.
- It does not provide workflow-level triage.
- It does not provide Base-native social context.

## Product implication

The product should use GeckoTerminal as a pool/liquidity cross-check.

The MVP should not rely on GeckoTerminal alone as the source of truth. It should combine GeckoTerminal data with DEX Screener, onchain data, and risk signals.

---

## Basescan Baseline

## What it is useful for

Basescan is useful for raw onchain verification and contract inspection.

It can help with:

- Contract address lookup
- Contract verification status
- Token creator/deployer address
- Transaction history
- Token transfers
- Holder data
- Contract source review
- Event inspection

## Likely user workflow

A user may open Basescan to answer:

- Is the contract verified?
- Who deployed it?
- When was it deployed?
- What other contracts has this deployer created?
- Are there suspicious transactions?
- Is ownership renounced?
- Are there proxy/admin patterns?
- Who are the top holders?

## What it does well

- Strong raw onchain data access
- Useful for contract verification
- Useful for deployer and transaction research
- Useful for manual investigation
- Good source for audit/debugging

## What it misses

- It is not optimized for fast launch triage.
- It requires manual interpretation.
- It does not summarize launch quality.
- It does not provide risk ranking by default.
- It does not explain liquidity quality.
- It does not connect social attention to onchain activity.
- It is too slow as the main workflow surface for reviewing many launches.

## Product implication

The product should use Basescan-like data to enrich contract, deployer, and holder analysis.

The product should turn raw explorer data into summarized, explainable risk and reputation signals.

---

## TokenSniffer / GoPlus Baseline

## What they are useful for

TokenSniffer and GoPlus are useful for token-risk checks.

They can help identify:

- Honeypot risk
- Buy/sell tax
- Mutable tax
- Blacklist/whitelist logic
- Mint risk
- Ownership risk
- Holder concentration
- Liquidity lock/burn indicators
- Source verification
- Scam/spam indicators

## Likely user workflow

A user may paste a token contract into one or both tools and check whether the token is obviously dangerous.

## What they do well

- Fast first-pass risk screening
- Useful for identifying obvious scam patterns
- Helpful for non-technical users
- Good enrichment source for contract-risk indicators

## What they miss

- They are not complete oracles.
- They may miss delayed or dynamic risk.
- They may not explain broader market context.
- They do not rank tokens against other launches.
- They do not evaluate deployer history deeply enough for this product’s needs.
- They do not provide Base-native social context.
- They may produce false confidence if used alone.

## Product implication

The product should use risk scanners as evidence inputs, not as final judgment.

The MVP should expose risk-scanner findings as part of a broader explainable risk score.

---

## Farcaster / Warpcast Baseline

## What it is useful for

Farcaster/Warpcast is important because Base discovery is unusually social-native.

It can help identify:

- Creator activity
- Token mentions
- Contract-address references
- Community discussion
- Recasts
- Base-native attention
- Launch announcements
- Social propagation

## Likely user workflow

A user may search Farcaster/Warpcast for:

- Token ticker
- Token name
- Contract address
- Creator username
- Launch platform references
- Related casts or communities

## What it does well

- Strong Base-native relevance
- Useful for creator and community context
- More focused than broad X/Twitter for Base-specific activity
- Can surface early attention before generic dashboards fully reflect it

## What it misses

- Search may be noisy.
- Ticker/name mentions can be ambiguous.
- Attention can be botted or farmed.
- Contract resolution is not always clean.
- It does not natively connect social attention to liquidity, risk, or deployer history.
- It requires manual interpretation.

## Product implication

The product should treat Farcaster as a Base-native attention source.

The MVP should avoid generic sentiment analysis and instead focus on:

- Contract-resolved mentions
- Creator linkage
- Social velocity
- Recast/mention growth
- Whether attention is credible enough to justify deeper review

---

## Neynar Baseline

## What it is useful for

Neynar can provide programmatic access to Farcaster data.

It can support:

- Cast lookup
- User/profile data
- Social graph context
- Channels
- Contract or URL references
- Social activity indexing

## What it does well

- Makes Farcaster data operationally accessible
- Better suited for automation than manual Warpcast search
- Useful for a resolver service that maps casts and profiles to token contracts

## What it misses

- It is still only a data source.
- It does not automatically produce launch-quality ranking.
- It requires contract-resolution logic.
- It requires spam and ambiguity handling.
- It adds integration complexity.

## Product implication

Neynar should be considered a strong candidate for the social enrichment layer, but only after the core onchain/risk/liquidity triage path is defined.

---

## X/Twitter Baseline

## What it is useful for

X/Twitter may help detect broader social attention and narratives.

It can reveal:

- Influencer mentions
- Token tickers
- Meme propagation
- Public shilling
- Broader market attention
- Paid or coordinated promotion

## What it does well

- Broad crypto audience
- Fast narrative propagation
- Useful for later-stage or widely discussed tokens

## What it misses

- Noisy and easy to manipulate
- Less Base-specific than Farcaster
- API access can be costly or constrained
- Ticker mentions are ambiguous
- Bot and engagement farming are common
- Full sentiment ingestion is too broad for v0

## Product implication

X/Twitter should not be a core MVP dependency.

It can be deferred unless needed for manual context or future expansion.

---

## Telegram Baseline

## What it is useful for

Telegram can provide community and announcement context where accessible.

It may show:

- Project communities
- Announcements
- Coordination
- Early promotion
- Community activity

## What it does well

- Important social venue in crypto
- Useful for known project communities
- Can be helpful for manual research

## What it misses

- Not a reliable public firehose
- Hard to monitor comprehensively
- Closed groups are not accessible
- Spam and coordination are common
- Broad scraping is operationally brittle
- Less suitable for the first MVP

## Product implication

Telegram should not be a core MVP input.

It may be useful later for alert output or specific monitored communities, but not for initial signal generation.

---

## Coinbase/Base App Discovery Baseline

## What it is useful for

Coinbase/Base app surfaces may matter because Base-native discovery can be linked to app-level visibility, social feed behavior, and DEX integration.

It may help users discover:

- New Base tokens
- Socially visible tokens
- Creator-linked tokens
- Trending tokens
- Tokens surfaced through Base ecosystem flows

## What it does well

- Relevant to Base-native discovery
- May expose retail attention paths
- Can influence which tokens become visible to casual users

## What it misses

- Not designed as an analyst-grade research tool
- Does not provide deep risk explanations
- Does not expose a full ranking methodology for this product’s use case
- Does not replace contract, liquidity, deployer, and risk analysis

## Product implication

Base/Coinbase discovery surfaces should be treated as part of the broader attention environment, not as the core product interface.

---

## What Existing Tools Do Well

Existing tools are strong at:

- Showing charts
- Surfacing new pairs
- Showing raw volume
- Showing raw liquidity
- Showing pair age
- Showing basic token metadata
- Showing contract pages
- Showing risk scanner outputs
- Surfacing visible social activity
- Helping with manual investigation

They are useful as inputs and baselines.

---

## What Existing Tools Miss

Existing tools generally do not provide a unified answer to:

> Which new Base launches are worth deeper investigation, obviously risky, or ignorable?

Key gaps:

### 1. No unified launch-quality score

Tools show data, but they rarely combine the data into an explainable launch-quality view.

### 2. Weak deployer context

Most tools do not deeply surface repeat deployer behavior, prior launch outcomes, or deployer reputation as a primary ranking input.

### 3. Weak liquidity-quality interpretation

Raw liquidity is shown more often than usable liquidity, slippage-adjusted depth, canonical pool confidence, or survivability.

### 4. Weak social-to-onchain resolution

Social attention is rarely connected cleanly to the canonical token contract.

### 5. Weak manipulation awareness

Public tools can surface metrics that are also easy to fake:

- Volume
- Holder count
- Engagement
- Paid boosts
- Short-term price action

### 6. Too much manual interpretation

Users must manually combine charts, pools, contracts, scanners, and social context.

### 7. No project-specific triage workflow

Existing tools are not optimized around this product’s desired workflow:

> Detect launch → enrich → rank → explain → decide whether to investigate.

---

## Differentiation Opportunity

The product should differentiate by becoming an explainable triage layer across public tools.

The opportunity is not to build a better charting product.

The opportunity is to build a better research-ranking system for Base launches.

## Differentiation Pillars

### 1. Explainable ranking

Every token should show:

- Overall rank or score
- Risk explanation
- Liquidity explanation
- Deployer explanation
- Social/context explanation
- Confidence level

### 2. Risk-first filtering

The system should quickly separate:

- Obvious high-risk launches
- Low-quality noise
- Watchlist candidates
- Launches worth deeper investigation

### 3. Liquidity survivability

The system should emphasize:

- Usable liquidity
- Price impact
- Quote asset quality
- Canonical pool confidence
- Liquidity changes over time

### 4. Deployer reputation

The system should treat deployers as important context.

It should surface:

- Prior launches
- Repeated patterns
- Prior liquidity behavior
- Verification history
- Suspicious deployer reuse

### 5. Base-native attention

The system should focus on Base-relevant social context.

It should prioritize:

- Farcaster-linked attention
- Contract-resolved mentions
- Creator linkage
- Social velocity
- Base launch-platform context

### 6. Alerting

The system should alert only when something meaningful changes:

- New high-score launch
- Risk downgrade
- Liquidity improvement
- Liquidity deterioration
- Social velocity spike
- Known deployer launch

---

## Primary Baseline Comparison

The MVP should first be compared against:

> Manual workflow across DEX Screener + GeckoTerminal + Basescan + Farcaster + TokenSniffer/GoPlus.

The question is:

> Does the console save time and produce a better triage decision than checking these tools manually?

---

## Secondary Baseline Comparison

The second baseline is:

> DEX Screener new Base pairs sorted by volume.

The question is:

> Does the console produce a more useful ranked list than simply looking at new Base pairs or high-volume tokens?

---

## Baseline Success Criteria

The product begins to justify itself if it can:

- Reduce manual review time per token
- Reduce obvious scam exposure
- Produce better watchlist candidates
- Explain why a launch is risky or interesting
- Surface better launches than simple volume sorting
- Avoid over-ranking paid boosts or fake volume
- Connect Base-native attention to actual token contracts
- Help create a repeatable research workflow

---

## Competitive Baseline Summary

Existing tools are necessary but fragmented.

DEX Screener is strong for discovery. GeckoTerminal is useful for pool data. Basescan is useful for contract inspection. TokenSniffer and GoPlus are useful for risk checks. Farcaster is useful for Base-native social context.

The gap is the absence of a focused, explainable, Base-native launch triage layer.

The product should win by combining these fragmented signals into a ranked workflow that helps answer:

> Is this new Base launch worth deeper research, obviously risky, or ignorable?
