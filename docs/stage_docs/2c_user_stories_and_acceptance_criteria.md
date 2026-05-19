# 02 — User Stories and Acceptance Criteria

## Primary User

The primary user is the analyst/operator building and using the tool.

The product should optimize for personal monitoring, fast triage, and repeatable research judgment.

## Primary User Story

```text
As an analyst monitoring Base token launches,
I want to see new launches ranked by quality and risk,
so that I can quickly decide which tokens deserve deeper research, which are obviously risky, and which can be ignored.
```

## Launch Feed Stories

### Story 1 — View ranked launches

```text
As an analyst,
I want the app to open to a ranked feed of new Base launches,
so that I can start triaging immediately without navigating through multiple screens.
```

Acceptance criteria:

- The main screen is a table.
- The table shows new Base launches.
- Rows are ordered by score, priority, or triage importance.
- Each row includes a triage label.
- Each row includes a reason string.
- The user can understand why a launch is ranked highly or poorly without opening another page.

### Story 2 — See core token identity

```text
As an analyst,
I want each launch row to show basic token identity,
so that I know exactly which token and contract I am reviewing.
```

Acceptance criteria:

- Each row shows token name, if available.
- Each row shows token symbol, if available.
- Each row shows token address.
- Each row shows first-seen time or launch time.
- Each row shows pair/pool address where available.
- Token identity fields do not rely only on ticker/name because these can be ambiguous.

### Story 3 — See basic market context

```text
As an analyst,
I want to see basic market and pool data,
so that I can quickly judge whether the launch has enough activity to inspect further.
```

Acceptance criteria:

- Each row shows liquidity, if available.
- Each row shows volume, if available.
- Each row shows token age or pair age.
- Each row shows venue or pool source, if available.
- Stale or unavailable data is marked clearly.

## Triage Stories

### Story 4 — Get a triage label

```text
As an analyst,
I want every launch to receive a simple triage label,
so that I can decide what to do next quickly.
```

Acceptance criteria:

- Every scored token receives one of the following labels:
  - Ignore
  - Risky
  - Watch
  - Research Deeper
  - High Priority
- Labels are generated from explicit scoring rules.
- Labels are not framed as buy/sell recommendations.
- Labels can be audited through score breakdowns or reason strings.

### Story 5 — Understand why a label was assigned

```text
As an analyst,
I want each label to include a reason string,
so that I can trust or challenge the ranking.
```

Acceptance criteria:

- Each row has a short reason string.
- The reason string mentions the strongest positive or negative drivers.
- The reason string does not overstate confidence.
- Examples:
  - `Risky: unverified contract, high sell tax, unknown deployer.`
  - `Research Deeper: clean basic risk check, adequate liquidity, repeat deployer with no obvious negative history.`
  - `Ignore: very low liquidity and no meaningful market activity.`

## Contract-Risk Stories

### Story 6 — See contract-risk status

```text
As an analyst,
I want to see contract-risk status for each launch,
so that I can avoid wasting time on obvious high-risk tokens.
```

Acceptance criteria:

- The system stores risk-check data for each token where available.
- The system shows a contract-risk label or score.
- The system marks unavailable risk data clearly.
- Severe risk flags can assign or strongly influence the `Risky` label.

### Story 7 — Detect obvious high-risk launches

```text
As an analyst,
I want the system to flag obvious high-risk launches,
so that I can quickly avoid or deprioritize them.
```

Acceptance criteria:

- The system can flag obvious risk conditions such as:
  - honeypot indicator
  - severe tax risk
  - mutable tax risk
  - blacklist/whitelist risk
  - mint risk
  - owner/admin risk
  - unverified contract, depending on context
- High-risk launches can trigger a basic alert.
- Risk flags include source and timestamp where available.

## Liquidity-Quality Stories

### Story 8 — See liquidity-quality status

```text
As an analyst,
I want to see liquidity quality for each launch,
so that I can tell whether the token is actually worth monitoring.
```

Acceptance criteria:

- The system shows liquidity amount.
- The system shows volume where available.
- The system identifies the primary pair/pool candidate where available.
- The system assigns a basic liquidity-quality label or score.
- The system explains weak liquidity, adequate liquidity, or suspicious liquidity in plain language.

### Story 9 — Avoid over-trusting raw liquidity

```text
As an analyst,
I want the system to avoid treating raw liquidity as automatically good,
so that fake or fragile liquidity does not inflate rankings.
```

Acceptance criteria:

- Liquidity quality is not based only on nominal liquidity.
- The system considers basic pool context where available.
- The system can downgrade low-confidence or suspicious pool data.
- The system can show canonical-pool confidence if available.

## Deployer-History Stories

### Story 10 — See deployer context

```text
As an analyst,
I want to see deployer-history context,
so that I can identify repeat, unknown, or suspicious deployers.
```

Acceptance criteria:

- The system identifies the deployer address where available.
- The system classifies deployer context as one of:
  - unknown
  - new
  - repeat
  - suspicious
- The system shows a deployer-history summary.
- Unknown deployers are not automatically treated as bad.

### Story 11 — Detect suspicious repeat behavior

```text
As an analyst,
I want the system to identify suspicious repeat deployer behavior,
so that I can avoid launches from low-quality or exploitative deployers.
```

Acceptance criteria:

- The system can store prior deployer observations.
- The system can show prior launches where available.
- The system can downgrade deployers with suspicious prior behavior.
- The system can explain the downgrade.

## Alerting Stories

### Story 12 — Alert on high-score launches

```text
As an analyst,
I want to receive or see an alert when a launch becomes high priority,
so that I do not miss launches worth deeper research.
```

Acceptance criteria:

- A launch can trigger a high-score alert.
- The alert includes token identity.
- The alert includes score or label.
- The alert includes a reason string.
- The alert does not require a polished alert inbox.

### Story 13 — Alert on obvious high-risk launches

```text
As an analyst,
I want to receive or see an alert when a launch has severe risk flags,
so that I understand what the system is filtering out.
```

Acceptance criteria:

- A launch can trigger a high-risk alert.
- The alert includes the risk reason.
- The alert includes data source and timestamp where possible.
- The system avoids sending noisy alerts for minor or low-confidence warnings.

## Dashboard Stories

### Story 14 — Use table-only MVP

```text
As an analyst,
I want the MVP to work from a single table,
so that the first version remains narrow and fast to build.
```

Acceptance criteria:

- No full token detail page is required.
- No expandable row is required.
- The table contains enough information for first-pass triage.
- Links to external tools may be included if helpful.

### Story 15 — Use rough internal UI

```text
As the initial user,
I want a rough internal UI,
so that the project prioritizes useful ranking over polish.
```

Acceptance criteria:

- The UI can be visually rough.
- The UI must be readable.
- The UI must expose the ranking, labels, and reasons clearly.
- No public-facing onboarding or SaaS polish is required.

## Data Freshness Stories

### Story 16 — Keep data fresh enough for monitoring

```text
As an analyst,
I want the feed to refresh every 1–5 minutes,
so that the tool is useful for monitoring without becoming an execution product.
```

Acceptance criteria:

- Data refresh target is 1–5 minutes.
- Stale rows show last updated time.
- The system does not need sub-second updates.
- The system does not depend on public-mempool visibility.

## Out-of-Scope Stories

The following stories are intentionally not accepted for v0:

```text
As a trader, I want to execute trades from the product.
As a user, I want copytrading recommendations.
As a user, I want a portfolio tracker.
As a user, I want a multi-chain dashboard.
As a user, I want X/Twitter and Telegram sentiment.
As a user, I want AI price predictions.
As a user, I want smart-money wallet labels.
As a user, I want a polished public SaaS experience.
As a user, I want detailed token profile pages.
```

## Global Acceptance Criteria

The MVP is acceptable when:

- new Base launches appear in a ranked table
- each launch has a triage label
- each launch has a reason string
- contract risk is represented
- liquidity quality is represented
- deployer history is represented
- high-score and high-risk launches can trigger basic alerts
- the table is useful enough to check before DEX Screener

## Stage 2 Acceptance Summary

The Stage 2 product definition is valid if the MVP can be built as a narrow vertical slice:

```text
New launch → enrichment → score → triage label → ranked table → basic alert
```

Anything outside that path should be deferred.
