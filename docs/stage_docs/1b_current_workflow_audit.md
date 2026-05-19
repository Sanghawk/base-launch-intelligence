# 1b — Current Workflow Audit

## Important Framing Note

This is not an audit of an existing mature personal workflow.

There is currently no consistent manual workflow for researching new Base token launches. This document defines the likely manual workflow that would be required if I monitored Base launches without a dedicated intelligence console.

The purpose of this document is to establish the workflow baseline that the product must improve.

---

## Current Tools Used

No tools are currently used consistently.

For the purposes of Stage 1, the assumed manual workflow uses the tools a typical retail trader, onchain analyst, or Base launch observer would likely use.

Assumed tool set:

- DEX Screener
- GeckoTerminal
- Basescan
- TokenSniffer
- GoPlus
- Farcaster/Warpcast
- X/Twitter
- Telegram
- Coinbase/Base app discovery surfaces
- Manual notes or spreadsheet tracking, if needed

---

## Manual Research Steps

## Step 1 — Discover a new token

Likely discovery sources:

- DEX Screener new Base pairs
- DEX Screener trending tokens
- DEX Screener boosted tokens
- GeckoTerminal Base pools
- Farcaster/Warpcast mentions
- X/Twitter posts
- Telegram/community mentions
- Coinbase/Base app surfaces
- Someone else mentioning the token

### Key question

> Why is this token visible now?

Possible reasons:

- New pair created
- Price is moving
- Volume is increasing
- Liquidity was added
- Paid boost
- Social mentions
- Known creator/deployer
- Meme/narrative momentum

---

## Step 2 — Inspect basic market data

Likely checked in DEX Screener or GeckoTerminal:

- Token age
- Pair creation time
- Price movement
- Volume
- Liquidity
- FDV / market cap, if available
- Transaction count
- Buyer/seller count
- Pool/pair address
- Quote asset
- DEX venue

### Key question

> Is there enough real market activity to justify deeper review?

---

## Step 3 — Evaluate liquidity

Likely checked through DEX Screener, GeckoTerminal, and possibly direct pool data:

- Total liquidity
- Liquidity trend
- Quote asset quality
- Pool venue
- Number of active pools
- Whether liquidity is fragmented
- Whether the displayed pool is likely the canonical pool
- Whether the token can support meaningful entry/exit without severe slippage

### Key question

> Is the token actually tradable, or does it only look liquid?

---

## Step 4 — Check contract and deployer

Likely checked in Basescan:

- Contract address
- Contract verification status
- Creator/deployer address
- Token creation transaction
- Ownership or admin controls
- Proxy patterns
- Mint permissions
- Transfer restrictions
- Prior deployer history
- Related deployments

### Key question

> Does the contract or deployer create obvious structural risk?

---

## Step 5 — Check token-risk scanners

Likely checked through TokenSniffer or GoPlus:

- Honeypot risk
- Buy tax
- Sell tax
- Whether tax is modifiable
- Blacklist/whitelist logic
- Mint authority
- Ownership status
- Holder concentration
- LP lock/burn status
- Source verification
- Scanner score

### Key question

> Is this launch obviously unsafe or structurally suspicious?

---

## Step 6 — Check holder and concentration data

Likely checked through Basescan, TokenSniffer, GoPlus, or other token-analysis tools:

- Top holder percentage
- Top 10 holder percentage
- Top 25 holder percentage
- LP/system-wallet exclusions
- Team-controlled wallet suspicion
- Fresh-wallet clustering
- Dust distribution
- Suspicious holder splits

### Key question

> Is ownership too concentrated or artificially distributed?

---

## Step 7 — Check social context

Likely checked through Farcaster/Warpcast, X/Twitter, Telegram, and possibly Coinbase/Base app surfaces:

- Who is mentioning the token?
- Are mentions contract-resolved or just ticker-based?
- Is there a known creator or community?
- Is attention increasing?
- Are mentions organic or farmed?
- Is the token being boosted or promoted?
- Are there credible Base-native references?
- Are there repeated spam posts?

### Key question

> Is the attention credible, or is it likely paid/manipulated noise?

---

## Step 8 — Compare against other launches

Manual comparison would likely involve opening multiple tokens and comparing:

- Liquidity
- Volume
- Risk profile
- Deployer history
- Holder distribution
- Social context
- Age
- Momentum
- Narrative

### Key question

> Is this token more research-worthy than other launches today?

---

## Step 9 — Decide triage outcome

Final manual outcome should be one of:

- Ignore
- Risky / avoid
- Watchlist
- Research deeper
- High-priority investigation

### Key question

> What should I do with this launch next?

---

## Time Required Per Token

Because no current workflow exists, this is an estimate.

### Light review

Estimated time:

> 1–3 minutes per token

Includes:

- Chart glance
- Liquidity glance
- Basic risk glance
- Quick reject or watchlist decision

### Standard review

Estimated time:

> 3–10 minutes per token

Includes:

- DEX Screener review
- GeckoTerminal cross-check
- Basescan contract/deployer check
- TokenSniffer/GoPlus review
- Basic social search
- Triage decision

### Deep review

Estimated time:

> 10–30+ minutes per token

Includes:

- Deployer history
- Holder concentration
- LP analysis
- Social mapping
- Multiple pool checks
- Manual notes
- Comparison with other launches

### Realistic daily capacity

Without automation:

- Light review: 5–10 tokens/day
- Serious monitoring: 15–30 tokens/day
- Sustained monitoring beyond that likely requires ranking and automation

---

## Pain Points

## 1. No repeatable process

There is not yet a consistent workflow for evaluating Base launches.

This creates two problems:

- It is easy to miss important checks.
- It is hard to compare tokens consistently.

---

## 2. Too many tools

Manual research requires moving between:

- DEX Screener
- GeckoTerminal
- Basescan
- Risk scanners
- Farcaster
- X/Twitter
- Telegram

This creates friction and makes the workflow slower than necessary.

---

## 3. Too many launches

Base launches are frequent enough that manual review can become overwhelming.

Without ranking, every token competes for attention equally.

---

## 4. Liquidity is hard to interpret

Raw liquidity is not enough.

Important unanswered questions:

- Is this the canonical pool?
- Is liquidity fragmented?
- Is the quote asset high quality?
- Is liquidity usable at realistic trade sizes?
- Can the token survive normal buy/sell pressure?
- Is apparent liquidity temporary or deceptive?

---

## 5. Volume may be fake or low quality

Volume alone may reflect:

- Wash trading
- Paid promotion
- Bot activity
- Short-lived attention
- Self-routing
- Low-quality speculative churn

A product should avoid over-weighting raw volume.

---

## 6. Social attention may be misleading

Social attention may reflect:

- Real Base-native interest
- Paid promotion
- Bot activity
- Spam
- Closed-channel coordination leaking into public view
- Ambiguous ticker mentions
- Contract-address confusion

A useful product must distinguish contract-resolved, credible attention from generic engagement.

---

## 7. Deployer history is hard to evaluate manually

A deployer may have prior launches, rugs, abandoned projects, or repeated patterns.

Manual evaluation is slow because it requires:

- Looking up prior contracts
- Connecting related deployments
- Checking liquidity behavior
- Checking past outcomes
- Detecting wallet rotation or factory patterns

---

## 8. Contract risk is fragmented

Risk data may come from several places:

- Basescan
- GoPlus
- TokenSniffer
- Manual contract inspection
- Holder analysis

Each source is incomplete. Manual review is inconsistent.

---

## 9. Ranking is missing

Public tools show lists, charts, and metrics, but they do not provide a project-specific answer to:

> Which launches deserve deeper investigation first?

This is the main product opportunity.

---

## Repetitive Tasks

The following steps are repetitive and good candidates for automation:

- Detect new Base token/pool launches
- Pull DEX Screener pair data
- Pull GeckoTerminal pool data
- Identify likely canonical pool
- Fetch contract verification status
- Fetch deployer address
- Fetch risk scanner results
- Pull holder concentration data
- Detect paid boosts or promotion metadata
- Search for Farcaster mentions
- Normalize token metadata
- Calculate preliminary risk score
- Calculate preliminary liquidity score
- Generate reason strings
- Alert on high-priority launches

---

## Error-Prone Steps

The following manual steps are likely to produce mistakes:

### 1. Choosing the wrong pool

If the wrong pool is treated as canonical, price, liquidity, market cap, and volume interpretation may be wrong.

### 2. Over-trusting raw volume

Volume may be washed, botted, or temporarily inflated.

### 3. Over-trusting holder count

Holder count may be inflated through dusting or sybil wallets.

### 4. Over-trusting social mentions

Ticker mentions and engagement can be ambiguous or manipulated.

### 5. Under-checking deployer history

Manual workflows often treat each token as isolated, missing repeat deployer behavior.

### 6. Over-trusting risk scanners

TokenSniffer and GoPlus are useful but not complete. Scanner output should be treated as evidence, not ground truth.

### 7. Ignoring confidence levels

Some data is reliable, some is incomplete, and some is stale. Manual workflows rarely expose uncertainty clearly.

---

## Missing Context

Manual workflows often fail to combine the following context in one place:

- Launch surface
- Contract creation time
- First pool creation
- Canonical pool confidence
- Liquidity quality
- Price impact
- Contract risk
- Holder concentration
- Deployer history
- Prior deployer outcomes
- Social mentions
- Farcaster creator linkage
- Paid promotion flags
- Retention over time
- Whether the token is improving or deteriorating after launch

---

## Opportunities for Automation

## 1. Unified launch feed

Automatically detect and list new Base token launches and pools.

## 2. Risk summary

Automatically summarize:

- Contract verification
- Honeypot/tax risk
- Owner powers
- Mint risk
- Blacklist/whitelist risk
- Holder concentration
- LP lock/burn state

## 3. Liquidity quality score

Automatically assess:

- Usable depth
- Quote asset
- Pool venue
- Price impact
- Canonical pool confidence
- Liquidity trend

## 4. Deployer reputation

Automatically track:

- Prior launches
- Prior LP behavior
- Verification patterns
- Abandoned or failed launches
- Repeated token templates
- Factory/deployer relationships

## 5. Base-native attention signal

Automatically track:

- Farcaster mentions
- Contract-resolved references
- Creator or profile linkage
- Social velocity
- Spam/promotion risk

## 6. Explainable ranking

Automatically produce a ranked list with reason strings, such as:

- “High risk: unverified contract and concentrated holders”
- “Worth reviewing: strong liquidity depth and credible Farcaster attention”
- “Ignore: low liquidity, weak social footprint, and paid boost only”
- “Watch: new launch from repeat deployer with improving liquidity”

## 7. Alerting

Automatically alert when:

- A new launch crosses a quality threshold
- Risk status changes
- Liquidity improves or deteriorates
- Social velocity spikes
- A known deployer launches again

---

## Workflow Success Definition

The future product should improve the manual workflow if it can:

- Reduce time required to triage a token
- Reduce the number of tools needed per token
- Catch obvious risks earlier
- Rank launches more usefully than raw public dashboards
- Explain why a token deserves attention or should be ignored
- Help create a repeatable research process where none currently exists

---

## Current Workflow Audit Summary

There is no established current workflow. The assumed manual workflow is fragmented, slow, and inconsistent.

The product opportunity is to turn that fragmented workflow into a single ranked, explainable, Base-native launch triage console.
