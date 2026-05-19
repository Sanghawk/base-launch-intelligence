# 4e — API and Frontend Contracts

## Purpose

This document defines the MVP API and frontend contracts for the Base Launch Intelligence Console.

The API should expose normalized, scored, feed-ready data from Postgres to a rough internal Next.js dashboard. The frontend should not call external providers directly and should not run scoring logic.

The core user experience is one table:

```text
ranked Base launches
→ score and triage label
→ risk/liquidity/deployer summaries
→ reason string
→ external investigation links
→ dashboard alert flags
```

---

## Contract Principles

1. **Frontend receives feed-ready data.**  
   The UI should not reconstruct scores, infer labels, or join raw provider records.

2. **Provider details remain server-side.**  
   DEX Screener, GoPlus, GeckoTerminal, Basescan, and RPC integrations belong in the worker/API layer, not in React components.

3. **Every row must explain itself.**  
   A row without a score, label, confidence, and reason string is not useful for MVP triage.

4. **Missing data is explicit.**  
   The API should return `null` and confidence/staleness fields rather than pretending missing data is safe.

5. **Responses should be stable enough for the UI.**  
   The API can evolve, but the table row shape should stay stable during MVP implementation.

6. **Links are convenience only.**  
   External tool links support manual investigation; they are not required for scoring.

---

## Required API Endpoints

v0 requires three endpoints:

```text
GET /api/launches
GET /api/alerts
GET /api/health
```

Optional debug endpoints can be added during development, but they are not part of the MVP contract.

---

# Endpoint: `GET /api/launches`

## Purpose

Return the latest ranked launch rows for the dashboard table.

The response should contain one row per token, using the latest score and latest supporting records.

## Query parameters

| Parameter | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `limit` | number | No | `100` | Max rows to return. |
| `label` | string | No | none | Filter by triage label. |
| `minScore` | number | No | none | Filter by minimum overall score. |
| `includeRisky` | boolean | No | `true` | Whether to include `Risky` rows. |
| `includeIgnored` | boolean | No | `true` | Whether to include `Ignore` rows. |
| `freshness` | string | No | `recent` | `recent`, `all`, or `stale`. |
| `sort` | string | No | `triage` | `triage`, `score`, `newest`, `liquidity`, `risk`. |

For the first implementation, only `limit` is mandatory. The other parameters can be ignored until the base table works.

## Sorting semantics

Default `sort=triage` should order rows by:

```text
1. triage priority
2. overall_score desc
3. first_seen_at desc
```

Suggested triage priority:

| Label | Sort priority |
|---|---:|
| `High Priority` | `1` |
| `Research Deeper` | `2` |
| `Watch` | `3` |
| `Risky` | `4` |
| `Ignore` | `5` |

This intentionally puts `Risky` below `Watch` for the main workflow while still showing risk flags.

## Response type

```ts
type LaunchesResponse = {
  data: LaunchFeedRow[];
  meta: {
    limit: number;
    returned: number;
    generatedAt: string;
    lastWorkerRunAt: string | null;
    dataFreshness: 'fresh' | 'degraded' | 'stale' | 'unknown';
  };
};
```

## `LaunchFeedRow`

```ts
type LaunchFeedRow = {
  rank: number;

  token: TokenIdentityView;
  pool: PoolView | null;
  market: MarketView | null;
  score: ScoreView;
  summaries: SummaryView;
  alert: AlertFlagView | null;
  freshness: FreshnessView;
  links: ExternalLinksView;
};
```

---

## Token view

```ts
type TokenIdentityView = {
  chainId: 8453;
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;

  firstSeenAt: string;
  firstSeenSource: string;

  deployerAddress: string | null;
  creationTxHash: string | null;
  createdAtTimestamp: string | null;

  isVerified: boolean | null;
  isProxy: boolean | null;
  metadataConfidence: 'low' | 'medium' | 'high';
};
```

## Pool view

```ts
type PoolView = {
  address: string;
  dexId: string | null;

  quoteTokenAddress: string | null;
  quoteTokenSymbol: string | null;

  pairCreatedAt: string | null;
  firstSeenAt: string;

  isCanonicalCandidate: boolean;
  canonicalConfidence: 'low' | 'medium' | 'high';
  canonicalReason: string | null;
};
```

## Market view

```ts
type MarketView = {
  source: 'dexscreener' | 'geckoterminal' | 'rpc' | 'other';
  observedAt: string;

  priceUsd: string | null;
  liquidityUsd: string | null;
  fdvUsd: string | null;
  marketCapUsd: string | null;

  volume5mUsd: string | null;
  volume1hUsd: string | null;
  volume6hUsd: string | null;
  volume24hUsd: string | null;

  txns5mBuys: number | null;
  txns5mSells: number | null;
  txns1hBuys: number | null;
  txns1hSells: number | null;

  buyers5m: number | null;
  sellers5m: number | null;
};
```

Money values should be serialized as strings to avoid precision loss from `numeric` database fields.

## Score view

```ts
type ScoreView = {
  scoredAt: string;

  contractRiskScore: number;
  liquidityQualityScore: number;
  deployerHistoryScore: number;
  overallScore: number;

  triageLabel:
    | 'Ignore'
    | 'Risky'
    | 'Watch'
    | 'Research Deeper'
    | 'High Priority';

  confidence: 'low' | 'medium' | 'high';

  reasonSummary: string;
  reasonDetails: string[];
  criticalFlags: string[];
};
```

## Summary view

```ts
type SummaryView = {
  contractRiskSummary: string;
  liquidityQualitySummary: string;
  deployerHistorySummary: string;
};
```

These summaries are separate from `reasonSummary` so the table can show component-level explanations.

## Alert flag view

```ts
type AlertFlagView = {
  hasUnacknowledgedAlert: boolean;
  alertType: 'new_high_score_launch' | 'obvious_high_risk_launch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  createdAt: string;
};
```

## Freshness view

```ts
type FreshnessView = {
  lastUpdatedAt: string | null;
  marketDataAgeSeconds: number | null;
  riskDataAgeSeconds: number | null;
  scoreAgeSeconds: number | null;

  marketDataStatus: 'fresh' | 'stale' | 'missing';
  riskDataStatus: 'fresh' | 'stale' | 'missing';
  scoreStatus: 'fresh' | 'stale' | 'missing';
};
```

## External links view

```ts
type ExternalLinksView = {
  dexscreener: string | null;
  geckoterminal: string | null;
  basescanToken: string;
  basescanDeployer: string | null;
  goplus: string | null;
};
```

For Base:

```text
basescanToken = https://basescan.org/token/{tokenAddress}
basescanDeployer = https://basescan.org/address/{deployerAddress}
```

DEX Screener and GeckoTerminal links may be constructed from pool or token address if provider-specific URL patterns are known. If not, return `null`.

---

## Example `GET /api/launches` response

```json
{
  "data": [
    {
      "rank": 1,
      "token": {
        "chainId": 8453,
        "address": "0xabc0000000000000000000000000000000000000",
        "name": "Example Token",
        "symbol": "EXAMPLE",
        "decimals": 18,
        "firstSeenAt": "2026-05-18T18:03:00.000Z",
        "firstSeenSource": "dexscreener",
        "deployerAddress": "0xdef0000000000000000000000000000000000000",
        "creationTxHash": null,
        "createdAtTimestamp": null,
        "isVerified": true,
        "isProxy": false,
        "metadataConfidence": "medium"
      },
      "pool": {
        "address": "0xpool000000000000000000000000000000000000",
        "dexId": "uniswap",
        "quoteTokenAddress": "0x4200000000000000000000000000000000000006",
        "quoteTokenSymbol": "WETH",
        "pairCreatedAt": "2026-05-18T18:00:00.000Z",
        "firstSeenAt": "2026-05-18T18:03:00.000Z",
        "isCanonicalCandidate": true,
        "canonicalConfidence": "high",
        "canonicalReason": "Highest liquidity pool with WETH quote on known DEX."
      },
      "market": {
        "source": "dexscreener",
        "observedAt": "2026-05-18T18:06:00.000Z",
        "priceUsd": "0.000123",
        "liquidityUsd": "65000.00",
        "fdvUsd": "123000.00",
        "marketCapUsd": null,
        "volume5mUsd": "2500.00",
        "volume1hUsd": "18000.00",
        "volume6hUsd": null,
        "volume24hUsd": null,
        "txns5mBuys": 20,
        "txns5mSells": 12,
        "txns1hBuys": 160,
        "txns1hSells": 120,
        "buyers5m": null,
        "sellers5m": null
      },
      "score": {
        "scoredAt": "2026-05-18T18:06:15.000Z",
        "contractRiskScore": 88,
        "liquidityQualityScore": 82,
        "deployerHistoryScore": 65,
        "overallScore": 81,
        "triageLabel": "High Priority",
        "confidence": "medium",
        "reasonSummary": "High Priority: clean basic risk check, strong WETH liquidity, repeat deployer with no internal negative history.",
        "reasonDetails": [
          "Contract risk score 88: low tax, no blacklist flag, verified/open-source signal present.",
          "Liquidity score 82: $65k WETH liquidity, active pool, canonical confidence high.",
          "Deployer score 65: repeat deployer seen internally; no suspicious prior launch count available.",
          "Confidence medium: external deployer history is incomplete."
        ],
        "criticalFlags": []
      },
      "summaries": {
        "contractRiskSummary": "Low apparent risk from latest scanner check.",
        "liquidityQualitySummary": "Strong WETH liquidity with high canonical-pool confidence.",
        "deployerHistorySummary": "Repeat deployer in internal history; no known negative signal."
      },
      "alert": {
        "hasUnacknowledgedAlert": true,
        "alertType": "new_high_score_launch",
        "severity": "high",
        "title": "New high-priority Base launch",
        "createdAt": "2026-05-18T18:06:16.000Z"
      },
      "freshness": {
        "lastUpdatedAt": "2026-05-18T18:06:15.000Z",
        "marketDataAgeSeconds": 15,
        "riskDataAgeSeconds": 30,
        "scoreAgeSeconds": 5,
        "marketDataStatus": "fresh",
        "riskDataStatus": "fresh",
        "scoreStatus": "fresh"
      },
      "links": {
        "dexscreener": "https://dexscreener.com/base/0xpool000000000000000000000000000000000000",
        "geckoterminal": null,
        "basescanToken": "https://basescan.org/token/0xabc0000000000000000000000000000000000000",
        "basescanDeployer": "https://basescan.org/address/0xdef0000000000000000000000000000000000000",
        "goplus": null
      }
    }
  ],
  "meta": {
    "limit": 100,
    "returned": 1,
    "generatedAt": "2026-05-18T18:06:20.000Z",
    "lastWorkerRunAt": "2026-05-18T18:06:15.000Z",
    "dataFreshness": "fresh"
  }
}
```

---

# Endpoint: `GET /api/alerts`

## Purpose

Return recent alert rows for dashboard flags or a simple alerts panel.

## Query parameters

| Parameter | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `limit` | number | No | `50` | Max alerts to return. |
| `unacknowledgedOnly` | boolean | No | `false` | Acknowledgement can be deferred. |
| `type` | string | No | none | Filter by alert type. |
| `severity` | string | No | none | Filter by severity. |

## Response type

```ts
type AlertsResponse = {
  data: AlertView[];
  meta: {
    limit: number;
    returned: number;
    generatedAt: string;
  };
};

type AlertView = {
  id: string;
  tokenAddress: string;
  tokenSymbol: string | null;
  tokenName: string | null;

  alertType: 'new_high_score_launch' | 'obvious_high_risk_launch';
  severity: 'low' | 'medium' | 'high' | 'critical';

  title: string;
  message: string;

  scoreAtAlert: number | null;
  triageLabelAtAlert:
    | 'Ignore'
    | 'Risky'
    | 'Watch'
    | 'Research Deeper'
    | 'High Priority'
    | null;

  createdAt: string;
  acknowledgedAt: string | null;

  links: ExternalLinksView;
};
```

## Example response

```json
{
  "data": [
    {
      "id": "9d7f0a7b-8f94-4daa-a83c-6a39f4ec0c13",
      "tokenAddress": "0xabc0000000000000000000000000000000000000",
      "tokenSymbol": "EXAMPLE",
      "tokenName": "Example Token",
      "alertType": "new_high_score_launch",
      "severity": "high",
      "title": "New high-priority Base launch",
      "message": "EXAMPLE scored 81: clean basic risk check, strong WETH liquidity, repeat deployer with no internal negative history.",
      "scoreAtAlert": 81,
      "triageLabelAtAlert": "High Priority",
      "createdAt": "2026-05-18T18:06:16.000Z",
      "acknowledgedAt": null,
      "links": {
        "dexscreener": "https://dexscreener.com/base/0xpool000000000000000000000000000000000000",
        "geckoterminal": null,
        "basescanToken": "https://basescan.org/token/0xabc0000000000000000000000000000000000000",
        "basescanDeployer": "https://basescan.org/address/0xdef0000000000000000000000000000000000000",
        "goplus": null
      }
    }
  ],
  "meta": {
    "limit": 50,
    "returned": 1,
    "generatedAt": "2026-05-18T18:07:00.000Z"
  }
}
```

---

# Endpoint: `GET /api/health`

## Purpose

Return local system health for development and dashboard status.

## Response type

```ts
type HealthResponse = {
  status: 'ok' | 'degraded' | 'error';

  database: {
    status: 'ok' | 'error';
    latencyMs: number | null;
  };

  worker: {
    lastWorkerRunAt: string | null;
    lastSuccessfulRunAt: string | null;
    lastSuccessfulDiscoveryAt: string | null;
    lastRunStatus: 'running' | 'success' | 'partial_failure' | 'failure' | null;
    lastError: string | null;
  };

  providers: {
    dexscreener: ProviderHealthView;
    geckoterminal: ProviderHealthView;
    goplus: ProviderHealthView;
    basescan: ProviderHealthView;
    baseRpc: ProviderHealthView;
  };

  generatedAt: string;
};

type ProviderHealthView = {
  status: 'ok' | 'degraded' | 'error' | 'not_configured' | 'unknown';
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
};
```

## Example response

```json
{
  "status": "degraded",
  "database": {
    "status": "ok",
    "latencyMs": 12
  },
  "worker": {
    "lastWorkerRunAt": "2026-05-18T18:06:15.000Z",
    "lastSuccessfulRunAt": "2026-05-18T18:03:15.000Z",
    "lastSuccessfulDiscoveryAt": "2026-05-18T18:06:01.000Z",
    "lastRunStatus": "partial_failure",
    "lastError": "GoPlus request failed for 3 tokens"
  },
  "providers": {
    "dexscreener": {
      "status": "ok",
      "lastSuccessAt": "2026-05-18T18:06:01.000Z",
      "lastErrorAt": null,
      "lastError": null
    },
    "geckoterminal": {
      "status": "not_configured",
      "lastSuccessAt": null,
      "lastErrorAt": null,
      "lastError": null
    },
    "goplus": {
      "status": "degraded",
      "lastSuccessAt": "2026-05-18T18:03:03.000Z",
      "lastErrorAt": "2026-05-18T18:06:03.000Z",
      "lastError": "HTTP 429"
    },
    "basescan": {
      "status": "not_configured",
      "lastSuccessAt": null,
      "lastErrorAt": null,
      "lastError": null
    },
    "baseRpc": {
      "status": "not_configured",
      "lastSuccessAt": null,
      "lastErrorAt": null,
      "lastError": null
    }
  },
  "generatedAt": "2026-05-18T18:07:00.000Z"
}
```

---

## API Error Shape

All API errors should return a consistent shape:

```ts
type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    generatedAt: string;
  };
};
```

Example:

```json
{
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "Could not query launch feed."
  },
  "meta": {
    "generatedAt": "2026-05-18T18:07:00.000Z"
  }
}
```

Recommended HTTP statuses:

| Scenario | Status |
|---|---:|
| Invalid query parameter | `400` |
| Database unavailable | `503` |
| Unexpected server error | `500` |
| Endpoint not implemented | `501` |

---

## Frontend Contract

## Main route

```text
/
```

The main route should render the ranked launch feed.

Optional future routes:

```text
/alerts
/health
```

For v0, alerts and health can be embedded on the main page.

---

## Main table requirements

The main screen is a table with one row per launch/token.

Required columns:

| Column | Source field |
|---|---|
| Rank | `rank` |
| Token | `token.symbol`, `token.name`, `token.address` |
| Age | `token.firstSeenAt` or `pool.pairCreatedAt` |
| Pool | `pool.address`, `pool.dexId`, `pool.quoteTokenSymbol` |
| Liquidity | `market.liquidityUsd` |
| Volume | `market.volume5mUsd`, `market.volume1hUsd`, or `market.volume24hUsd` |
| Score | `score.overallScore` |
| Label | `score.triageLabel` |
| Confidence | `score.confidence` |
| Contract risk | `summaries.contractRiskSummary` |
| Liquidity quality | `summaries.liquidityQualitySummary` |
| Deployer | `summaries.deployerHistorySummary`, `token.deployerAddress` |
| Reason | `score.reasonSummary` |
| Updated | `freshness.lastUpdatedAt` |
| Links | `links.*` |
| Alert | `alert` |

## Recommended MVP table column order

```text
Rank
Label
Score
Token
Age
Liquidity
Volume 1h
Risk
Liquidity Quality
Deployer
Confidence
Reason
Updated
Links
Alert
```

This order prioritizes triage over raw market data.

---

## Frontend type definitions

Suggested shared type placement:

```text
packages/shared/src/contracts/api.ts
```

The frontend and API should import from shared contracts where possible.

```ts
export type TriageLabel =
  | 'Ignore'
  | 'Risky'
  | 'Watch'
  | 'Research Deeper'
  | 'High Priority';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type AlertType =
  | 'new_high_score_launch'
  | 'obvious_high_risk_launch';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
```

---

## Formatting Rules

## Addresses

Display addresses compactly:

```text
0x1234…abcd
```

But preserve full address in:

- copy button
- link href
- title tooltip if implemented

## Money

Format USD fields:

| Value | Display |
|---:|---|
| `null` | `—` |
| `< 1` | `<$1` |
| `1–999` | `$123` |
| `1,000–999,999` | `$12.3k` |
| `>= 1,000,000` | `$1.2m` |

## Scores

Display scores as whole numbers:

```text
81
```

Store and return decimals if useful, but the table should not need precision.

## Age

Use compact relative age:

```text
3m
42m
6h
2d
```

Show exact timestamp on hover only if easy.

## Confidence

Use plain text:

```text
low
medium
high
```

Visual styling can be added, but should not replace text.

## Missing data

Use:

```text
—
```

Do not display `0` for missing numeric values.

---

## Staleness Rules

The API should calculate staleness where possible so the frontend does not duplicate business logic.

Suggested status rules:

## Market data

| Age | Status |
|---:|---|
| `<= 5 minutes` | `fresh` |
| `5–30 minutes` | `stale` |
| missing | `missing` |

## Risk data

| Age | Status |
|---:|---|
| `<= 30 minutes` for new/hot tokens | `fresh` |
| `30 minutes–6 hours` | `stale` |
| missing | `missing` |

## Score

| Age | Status |
|---:|---|
| `<= 5 minutes` | `fresh` |
| `5–30 minutes` | `stale` |
| missing | `missing` |

The UI should show stale/missing statuses plainly.

---

## Dashboard State Handling

## Loading state

Show a simple loading message:

```text
Loading launch feed…
```

No skeleton UI required.

## Empty state

If no launches exist:

```text
No launch records yet. Start the worker or check provider configuration.
```

## Degraded state

If health is degraded:

```text
Data may be incomplete. Last worker run: {timestamp}. Last error: {message}.
```

## Error state

If `/api/launches` fails:

```text
Could not load launch feed.
```

Include a small debug detail in local development.

---

## Frontend Components

Suggested component structure:

```text
apps/web/src/app/page.tsx
apps/web/src/components/LaunchFeedTable.tsx
apps/web/src/components/LaunchFeedRow.tsx
apps/web/src/components/TriageLabelBadge.tsx
apps/web/src/components/ScoreCell.tsx
apps/web/src/components/ConfidenceCell.tsx
apps/web/src/components/AddressLink.tsx
apps/web/src/components/ExternalLinksCell.tsx
apps/web/src/components/HealthBanner.tsx
apps/web/src/lib/api.ts
apps/web/src/lib/format.ts
```

## Component responsibilities

| Component | Responsibility |
|---|---|
| `LaunchFeedTable` | Render table headers and rows. |
| `LaunchFeedRow` | Render one `LaunchFeedRow`. |
| `TriageLabelBadge` | Display triage label as text + minimal styling. |
| `ScoreCell` | Display overall and optional component scores. |
| `ConfidenceCell` | Display confidence and stale/missing flags. |
| `AddressLink` | Compact address display and external link/copy support. |
| `ExternalLinksCell` | Links to DEX Screener, Basescan, etc. |
| `HealthBanner` | Show degraded worker/provider state. |

---

## API Implementation Notes

## Feed query shape

The API should use SQL/Drizzle to select:

```text
tokens
latest token_scores per token
latest canonical pool
latest market snapshot for canonical pool
latest risk check
latest deployer history snapshot
latest unacknowledged alert
```

Use database-level latest-row selection where possible. Avoid joining all historical snapshots in application code.

## Suggested SQL strategy

Use CTEs or lateral joins:

```sql
WITH latest_scores AS (
  SELECT DISTINCT ON (token_id)
    *
  FROM token_scores
  ORDER BY token_id, scored_at DESC
)
SELECT ...
FROM latest_scores
JOIN tokens ...
LEFT JOIN pools ...
LEFT JOIN market_snapshots ...
LEFT JOIN risk_checks ...
LEFT JOIN deployer_history_snapshots ...
ORDER BY ...
LIMIT ...
```

Drizzle can represent this either directly or through raw SQL for the feed query.

## Numeric serialization

Postgres `numeric` values should be serialized as strings or safely converted after formatting.

Recommended:

```text
API response: strings for money fields
Frontend formatting: parse only for display
```

## Runtime mode

For v0, route handlers can run in the Node.js runtime:

```ts
export const runtime = 'nodejs';
```

Avoid Edge runtime unless database access is explicitly compatible.

---

## Security and Access

v0 is a private local/internal tool.

In scope:

```text
local development
private network use
manual environment variables
```

Out of scope:

```text
production auth
multi-user permissions
billing
public API keys
rate-limited public API access
```

If deployed beyond local development, add at minimum:

```text
basic auth
environment-level access controls
no public provider keys in client bundles
```

---

## Deferred API Features

Do not build these in v0 unless required for debugging:

```text
POST /api/alerts/:id/acknowledge
GET /api/tokens/:address
GET /api/tokens/:address/raw
POST /api/tokens/:address/refresh
POST /api/manual-overrides
GET /api/source-observations
GET /api/metrics
public API access
websocket feed
server-sent events
```

A detail endpoint may be useful later, but the MVP table should stand on its own.

---

## Acceptance Criteria

## API

- `GET /api/launches` returns one row per scored token.
- Rows include token identity, pool, market, score, summaries, freshness, links, and alert flag.
- Rows are ordered by triage priority and score by default.
- Missing data is represented as `null`, `missing`, or low confidence.
- Money values do not lose precision.
- API errors use a consistent error shape.

## Frontend

- Main screen renders a readable ranked table.
- Every row shows triage label, score, confidence, and reason string.
- The user can identify token contract and pool address without relying on ticker/name.
- The user can distinguish stale/missing data from zero values.
- Alert flags are visible in the table.
- External links are available for manual investigation.
- No provider API calls are made from the browser.

## Non-Goals

The frontend does not need:

```text
full token detail pages
expandable rows
advanced filters
saved views
responsive polish
auth
dark/light theming polish
charts
trade buttons
portfolio data
social feed
```
