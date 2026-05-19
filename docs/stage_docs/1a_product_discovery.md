# 1a — Product Discovery

## Discovery Goal

The goal of Stage 1 is to validate the problem space before defining the MVP.

This stage should determine whether a Base-native launch intelligence and risk-ranking console would provide meaningful value compared with a manual workflow using public tools such as DEX Screener, GeckoTerminal, Basescan, Farcaster, and token-risk scanners.

Because there is no established personal workflow yet, this stage is not only about auditing current behavior. It is also about designing and evaluating the manual workflow that the product would need to improve upon.

The central discovery question is:

> Can a dedicated Base launch intelligence console help me triage new Base token launches faster, more consistently, and with better risk awareness than a manual workflow across public tools?

---

## Core Assumptions

### Product Assumptions

- Base token launches are frequent, noisy, and difficult to evaluate manually.
- Generic dashboards surface activity but do not sufficiently explain launch quality, risk, liquidity survivability, or attention credibility.
- The first version should support research and monitoring, not trading execution.
- The product should rank and explain launches rather than make direct token recommendations.
- The first user is myself as the analyst/operator.
- The first version should be scoped as a private research and monitoring tool.

### User Assumptions

- A typical retail or analyst workflow would involve jumping between several tools.
- Most retail users likely start from a discovery surface such as DEX Screener, trending tokens, social posts, or someone else mentioning a token.
- Manual research is likely inconsistent because each tool answers only part of the question.
- The main decision is not “should I buy?” but “is this worth deeper investigation, obviously risky, or ignorable?”

### Market Assumptions

- Base-specific launch surfaces, social discovery, and liquidity venues create a focused enough ecosystem to monitor.
- Public data is sufficient to build a useful first-pass ranking system.
- A composite score combining risk, liquidity, deployer history, and Base-native attention should be more useful than raw volume or trending status alone.
- Simple metrics such as volume, holder count, and engagement are easy to manipulate and should not be trusted in isolation.

---

## User Workflow Hypothesis

A typical manual workflow for researching a new Base token would likely look like this:

1. Discover the token through a public surface:
   - DEX Screener new pairs
   - DEX Screener trending or boosted tokens
   - Farcaster/Warpcast posts
   - X/Twitter posts
   - Telegram/community mentions
   - Coinbase/Base app discovery surfaces
   - Word of mouth

2. Open the token chart:
   - Check price action
   - Check volume
   - Check liquidity
   - Check age
   - Check number of transactions
   - Check buyers and sellers

3. Validate market structure:
   - Check liquidity depth
   - Check whether liquidity is usable
   - Check whether there are multiple pools
   - Check quote asset quality
   - Check whether the token is only active in a weak or suspicious pool

4. Check contract and deployer:
   - Open Basescan
   - Check whether the contract is verified
   - Check token creation time
   - Check creator/deployer address
   - Look for suspicious permissions or proxy behavior
   - Review prior deployer activity if possible

5. Check token-risk scanners:
   - TokenSniffer
   - GoPlus
   - Honeypot/tax indicators
   - Holder concentration
   - Liquidity lock or burn status
   - Ownership risk

6. Check social context:
   - Search Farcaster/Warpcast
   - Search X/Twitter
   - Look for creator linkage
   - Look for repeated contract mentions
   - Look for suspicious engagement or bot-like promotion

7. Decide whether to:
   - Ignore the token
   - Mark it as risky
   - Watch it
   - Research it deeper
   - Compare it against other launches

---

## Problems to Validate

### 1. Discovery overload

There may be too many Base launches to inspect manually.

Discovery surfaces may show many tokens, but they do not automatically identify which launches deserve deeper research.

### 2. Context fragmentation

A single token may require checking multiple tools:

- DEX Screener for pair/chart data
- GeckoTerminal for pool/liquidity cross-checking
- Basescan for contract/deployer data
- TokenSniffer or GoPlus for security risk
- Farcaster/Warpcast for Base-native attention
- X/Twitter and Telegram for broader social context

This creates tab-switching, duplicated work, and inconsistent review quality.

### 3. Weak signal quality

Many common signals are easy to manipulate:

- Volume can be washed
- Holder count can be sybilled
- Social attention can be farmed
- Liquidity can be temporarily seeded
- Paid boosts can mimic organic attention
- Token metadata can be misleading

The product must validate whether better composite ranking can reduce this noise.

### 4. Risk assessment is slow

Obvious scams or low-quality launches may be detectable, but the current manual process likely requires too much time per token.

The product should determine whether risk signals can be summarized quickly and accurately.

### 5. Deployer history is underused

Generic dashboards often treat every token as isolated.

The product should validate whether deployer history and repeat launch behavior provide useful triage value.

### 6. Liquidity quality is more important than nominal liquidity

Raw liquidity does not guarantee tradability.

The product should validate whether liquidity quality, canonical pool confidence, and price impact are better indicators than raw liquidity alone.

### 7. Base-native attention may be valuable but noisy

Farcaster and Base-native social surfaces may provide useful context, but social signals can also introduce noise.

The product should validate whether Base-native attention improves ranking quality enough to justify integration.

---

## Questions to Answer

### Workflow Questions

- What would a serious manual workflow for Base launch research look like?
- Which steps are repetitive enough to automate?
- Which steps require judgment and should remain explainable?
- How much time would manual triage take per token?
- How many tokens could realistically be reviewed per day without automation?

### Product Value Questions

- Would a ranked feed be more useful than manually checking DEX Screener?
- Would score explanations make the system more trustworthy?
- Would risk flags reduce time wasted on obvious low-quality launches?
- Would deployer history materially improve triage?
- Would Farcaster/Base-native social data improve launch context?
- Would alerts provide value, or would they create noise?

### Competitive Questions

- What do DEX Screener and GeckoTerminal already solve well?
- What do they fail to explain?
- Where are risk scanners useful but insufficient?
- Where does Basescan provide raw data but not workflow value?
- What must this product do better than public tools?

### Scope Questions

- What is the smallest workflow that would be useful?
- Which signals are mandatory for v0?
- Which signals should be deferred?
- What should be excluded to avoid building a generic alpha terminal?

---

## Discovery Method

Stage 1 should use a lightweight discovery process.

### Step 1 — Build the assumed manual workflow

Document how a retail user or analyst would research a new Base token without this product.

This includes:

- Discovery source
- Chart review
- Liquidity review
- Contract review
- Risk scanner review
- Social/context review
- Final triage decision

### Step 2 — Review public baselines

Evaluate the tools that currently form the likely manual workflow:

- DEX Screener
- GeckoTerminal
- Basescan
- TokenSniffer
- GoPlus
- Farcaster/Warpcast
- X/Twitter
- Telegram
- Coinbase/Base app discovery surfaces, if relevant

### Step 3 — Identify workflow gaps

For each tool, determine:

- What it does well
- What it does poorly
- What context is missing
- What still requires manual judgment
- What could be automated
- What would need to be normalized into a unified score

### Step 4 — Define the MVP opportunity

Translate the discovery findings into a clear statement of what the MVP must improve.

The MVP should not attempt to replace every tool. It should provide a better triage layer across them.

### Step 5 — Decide whether to move to Product Definition

Move to Stage 2 only if the opportunity is clear enough to define an MVP.

---

## Assumed Discovery Baseline

Because there is no existing personal workflow, the baseline is:

> A manual workflow across DEX Screener, GeckoTerminal, Basescan, Farcaster, and risk scanners.

The product should be judged against this baseline first.

Secondary baseline:

> DEX Screener new Base pairs sorted by volume.

---

## Initial Improvement Criteria

The product would be useful if it can provide:

- Faster triage
- Fewer tabs and tools needed
- Better ranked list than raw new-pair or volume feeds
- Clearer explanations of risk
- Better visibility into liquidity quality
- Better visibility into deployer history
- Better detection of Base-native attention
- Better alerting for launches worth reviewing
- A repeatable research process where none currently exists

---

## Stage 1 Success Criteria

Stage 1 is successful if the following are true:

- The assumed manual workflow is clearly documented.
- The main public baseline tools are understood.
- The highest-friction parts of the workflow are identified.
- The MVP differentiation opportunity is clear.
- The product can be framed as a triage and ranking layer, not another generic dashboard.
- There is enough clarity to move into Product Definition.

---

## Stage 1 Exit Gate

Stage 1 is complete when this statement can be answered clearly:

> The MVP should improve Base launch triage by combining discovery, risk, liquidity, deployer, and Base-native attention context into a ranked, explainable workflow that is more useful than manually checking public dashboards and scanners separately.

If this cannot be stated clearly, do not move to Stage 2.
