# 03 — API Contracts and Sample Payloads

## Purpose

This document defines the expected API contracts, normalized fields, and sample payload shapes for the Stage 3 technical discovery phase.

Because this project has not yet run real API smoke tests, the payloads in this document are representative examples, not verified live responses. Before implementation, each provider contract should be confirmed against live API responses and stored under a `/samples` directory.

---

## Contract Principles

The MVP should treat every external data source as unreliable until normalized and confidence-scored.

Key principles:

- Store raw provider payloads for debugging.
- Normalize only the fields needed by the MVP.
- Track provider name and fetch timestamp on every observation.
- Treat missing fields as expected, not exceptional.
- Never let one provider silently overwrite another provider's data.
- Use confidence levels when a metric depends on incomplete data.

---

## Required Normalized Entities

The MVP needs these normalized entities:

```text
Token
Pool
MarketSnapshot
RiskCheck
Deployer
DeployerHistorySnapshot
Score
Alert
SourceObservation
```

---

## Entity: Token

### Purpose

Canonical record for a token contract on Base.

### Normalized Fields

```ts
type Token = {
  chainId: number; // 8453
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  firstSeenAt: string;
  firstSeenSource: string;
  deployerAddress: string | null;
  creationTxHash: string | null;
  createdAtBlock: number | null;
  createdAtTimestamp: string | null;
  isVerified: boolean | null;
  metadataConfidence: "low" | "medium" | "high";
};
```

### Notes

Token name and symbol are display fields only. They should not be used as identity keys because they can be duplicated or spoofed.

Primary identity key:

```text
chain_id + token_address
```

---

## Entity: Pool

### Purpose

Represents a DEX pool or pair for a token.

### Normalized Fields

```ts
type Pool = {
  chainId: number;
  poolAddress: string;
  dexId: string | null;
  baseTokenAddress: string;
  quoteTokenAddress: string | null;
  quoteTokenSymbol: string | null;
  pairCreatedAt: string | null;
  source: string;
  isCanonicalCandidate: boolean;
  canonicalConfidence: "low" | "medium" | "high";
};
```

### Canonical Pool Notes

A token may have multiple pools. The MVP should select a likely canonical pool using simple heuristics:

1. Highest reliable liquidity.
2. Strong quote asset such as WETH or USDC.
3. Known DEX venue.
4. Consistent DEX Screener / GeckoTerminal appearance.
5. Reasonable volume relative to liquidity.

If confidence is low, the score should say so.

---

## Entity: MarketSnapshot

### Purpose

Point-in-time market observation for a token or pool.

### Normalized Fields

```ts
type MarketSnapshot = {
  tokenAddress: string;
  poolAddress: string | null;
  source: "dexscreener" | "geckoterminal" | "rpc" | "other";
  observedAt: string;
  priceUsd: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  marketCapUsd: number | null;
  volume5mUsd: number | null;
  volume1hUsd: number | null;
  volume6hUsd: number | null;
  volume24hUsd: number | null;
  txns5m: number | null;
  txns1h: number | null;
  buyers5m: number | null;
  sellers5m: number | null;
  rawPayloadId: string;
};
```

### Notes

Market cap and FDV should be confidence-adjusted because supply data may be incomplete or unverified.

---

## Entity: RiskCheck

### Purpose

Provider-derived contract and trading-risk assessment.

### Normalized Fields

```ts
type RiskCheck = {
  tokenAddress: string;
  source: "goplus" | "tokensniffer" | "basescan" | "manual";
  observedAt: string;
  isHoneypot: boolean | null;
  buyTax: number | null;
  sellTax: number | null;
  isTaxModifiable: boolean | null;
  hasBlacklist: boolean | null;
  hasWhitelist: boolean | null;
  canMint: boolean | null;
  ownerAddress: string | null;
  ownershipRenounced: boolean | null;
  isProxy: boolean | null;
  isVerified: boolean | null;
  topHolderPct: number | null;
  top10HolderPct: number | null;
  lpLockedOrBurned: boolean | null;
  scannerScore: number | null;
  riskLevel: "unknown" | "low" | "medium" | "high" | "critical";
  rawPayloadId: string;
};
```

### Notes

Scanner output must not be treated as ground truth. It is evidence for the contract-risk score.

---

## Entity: Deployer

### Purpose

Canonical record for an address that deployed a token or relevant contract.

### Normalized Fields

```ts
type Deployer = {
  chainId: number;
  address: string;
  firstSeenAt: string;
  lastSeenAt: string;
  knownLabel: string | null;
  source: string;
};
```

---

## Entity: DeployerHistorySnapshot

### Purpose

Point-in-time summary of deployer behavior.

### Normalized Fields

```ts
type DeployerHistorySnapshot = {
  deployerAddress: string;
  observedAt: string;
  priorContractCount: number | null;
  priorTokenCount: number | null;
  priorLaunchCount: number | null;
  verifiedContractCount: number | null;
  suspiciousPriorLaunchCount: number | null;
  repeatedTemplateConfidence: "unknown" | "low" | "medium" | "high";
  historyConfidence: "low" | "medium" | "high";
  rawPayloadId: string | null;
};
```

### v0 Scope

v0 deployer history is basic:

- address known
- prior contract/token count if obtainable
- verification pattern if obtainable
- suspicious-history placeholder if not available

Do not attempt full wallet clustering or rug-history reconstruction in v0.

---

## Entity: Score

### Purpose

Explainable score for ranked feed.

### Normalized Fields

```ts
type TokenScore = {
  tokenAddress: string;
  scoredAt: string;
  contractRiskScore: number; // 0-100, higher is better/safter
  liquidityQualityScore: number; // 0-100
  deployerHistoryScore: number; // 0-100
  overallScore: number; // weighted aggregate
  triageLabel: "Ignore" | "Risky" | "Watch" | "Research Deeper" | "High Priority";
  confidence: "low" | "medium" | "high";
  reasonSummary: string;
  reasonDetails: string[];
};
```

### v0 Suggested Weights

```text
Contract risk: 40%
Liquidity quality: 40%
Deployer history: 20%
```

These are not final production weights. They are a starting point for a transparent MVP.

---

## Entity: Alert

### Purpose

Records emitted alerts.

### Normalized Fields

```ts
type Alert = {
  id: string;
  tokenAddress: string;
  alertType: "new_high_score_launch" | "obvious_high_risk_launch";
  createdAt: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  scoreAtAlert: number | null;
  acknowledgedAt: string | null;
};
```

### v0 Alert Types

Only two alert types are in scope:

1. New high-score launch
2. Obvious high-risk launch

---

## Entity: SourceObservation

### Purpose

Raw provider payload storage for debugging and auditability.

### Normalized Fields

```ts
type SourceObservation = {
  id: string;
  source: string;
  entityType: "token" | "pool" | "market_snapshot" | "risk_check" | "deployer";
  entityKey: string;
  fetchedAt: string;
  requestUrl: string | null;
  requestParamsHash: string | null;
  responseStatus: number | null;
  rawJson: unknown;
  error: string | null;
};
```

---

# Provider Contracts

## 1. DEX Screener

### MVP Use

Primary market-data enrichment source.

### Expected Fields

| Normalized Field | Expected Provider Field |
|---|---|
| chainId | `chainId` |
| dexId | `dexId` |
| poolAddress | `pairAddress` |
| baseTokenAddress | `baseToken.address` |
| baseTokenName | `baseToken.name` |
| baseTokenSymbol | `baseToken.symbol` |
| quoteTokenAddress | `quoteToken.address` |
| quoteTokenSymbol | `quoteToken.symbol` |
| priceUsd | `priceUsd` |
| liquidityUsd | `liquidity.usd` |
| fdvUsd | `fdv` |
| marketCapUsd | `marketCap` |
| pairCreatedAt | `pairCreatedAt` |
| volume windows | `volume` object |
| transaction windows | `txns` object |

### Representative Payload Shape

```json
{
  "chainId": "base",
  "dexId": "uniswap",
  "pairAddress": "0x...",
  "baseToken": {
    "address": "0x...",
    "name": "Example Token",
    "symbol": "EXAMPLE"
  },
  "quoteToken": {
    "address": "0x...",
    "symbol": "WETH"
  },
  "priceUsd": "0.000123",
  "liquidity": {
    "usd": 25000,
    "base": 100000000,
    "quote": 5.5
  },
  "fdv": 123000,
  "marketCap": 100000,
  "pairCreatedAt": 1710000000000,
  "volume": {
    "m5": 1000,
    "h1": 5000,
    "h6": 20000,
    "h24": 75000
  },
  "txns": {
    "m5": { "buys": 10, "sells": 5 },
    "h1": { "buys": 100, "sells": 80 }
  }
}
```

### Missing Field Handling

- If `marketCap` is missing, use `fdv` only as context.
- If `pairCreatedAt` is missing, use first observed time.
- If multiple pairs exist, rank candidate pools before scoring liquidity.

---

## 2. GeckoTerminal

### MVP Use

Optional cross-check for pool metadata and canonical pool confidence.

### Expected Fields

| Normalized Field | Expected Provider Field |
|---|---|
| poolAddress | pool ID/address |
| dexId | DEX relationship/attributes |
| baseTokenAddress | token relationships |
| quoteTokenAddress | quote token relationships |
| priceUsd | attributes price field |
| liquidityUsd | reserve/liquidity field |
| volume windows | volume attributes |
| marketCapUsd | token attributes, if available |

### Representative Payload Shape

```json
{
  "data": {
    "id": "base_0x...",
    "type": "pool",
    "attributes": {
      "address": "0x...",
      "name": "EXAMPLE / WETH",
      "base_token_price_usd": "0.000123",
      "reserve_in_usd": "25000",
      "fdv_usd": "123000",
      "market_cap_usd": null,
      "volume_usd": {
        "h24": "75000"
      }
    },
    "relationships": {
      "base_token": { "data": { "id": "base_0x..." } },
      "quote_token": { "data": { "id": "base_0x..." } }
    }
  }
}
```

### Missing Field Handling

- If `market_cap_usd` is null, do not compute market-cap-derived risk with high confidence.
- Use GeckoTerminal as confirmation, not sole source of truth.

---

## 3. GoPlus

### MVP Use

Primary token-security enrichment source if accessible.

### Expected Fields

| Normalized Field | Expected Provider Concept |
|---|---|
| isHoneypot | honeypot flag |
| buyTax | buy tax field |
| sellTax | sell tax field |
| isTaxModifiable | tax modifiable flag |
| hasBlacklist | blacklist flag |
| hasWhitelist | whitelist flag |
| canMint | mintable flag |
| ownerAddress | owner field |
| ownershipRenounced | owner/renounced interpretation |
| lpLockedOrBurned | LP holder/lock fields |
| topHolderPct | holder distribution fields |
| isVerified | source code verification if present |

### Representative Payload Shape

```json
{
  "code": 1,
  "message": "OK",
  "result": {
    "8453": {
      "0x...": {
        "token_name": "Example Token",
        "token_symbol": "EXAMPLE",
        "is_honeypot": "0",
        "buy_tax": "0.00",
        "sell_tax": "0.00",
        "slippage_modifiable": "0",
        "is_blacklisted": "0",
        "is_whitelisted": "0",
        "is_mintable": "0",
        "owner_address": "0x...",
        "creator_address": "0x...",
        "is_open_source": "1",
        "holders": []
      }
    }
  }
}
```

### Missing Field Handling

- If a field is absent, mark it as `null`, not safe.
- If provider returns no result, risk confidence should be low.
- If high-risk fields are present, triage label should be downgraded aggressively.

---

## 4. TokenSniffer

### MVP Use

Optional secondary risk scanner.

### Expected Fields

| Normalized Field | Expected Provider Concept |
|---|---|
| scannerScore | token score |
| riskLevel | scam/spam classification |
| isHoneypot | trading-risk flag if present |
| lpLockedOrBurned | liquidity lock/burn flag if present |
| isVerified | source verification flag if present |

### Representative Payload Shape

```json
{
  "address": "0x...",
  "chainId": 8453,
  "score": 65,
  "riskLevel": "medium",
  "flags": [
    "unverified_contract",
    "high_holder_concentration"
  ]
}
```

### Missing Field Handling

Do not block the MVP on TokenSniffer. Use GoPlus + Basescan first if TokenSniffer access is not straightforward.

---

## 5. Basescan

### MVP Use

Explorer augmentation for verification and deployer history.

### Expected Fields

| Normalized Field | Expected Provider Concept |
|---|---|
| isVerified | contract source verification |
| contractCreator | deployer address |
| creationTxHash | deployment transaction |
| txlist | deployer transaction history |
| tokenTransfers | token activity, if used |

### Representative Payload Shape

```json
{
  "status": "1",
  "message": "OK",
  "result": [
    {
      "SourceCode": "...",
      "ABI": "...",
      "ContractName": "ExampleToken",
      "CompilerVersion": "v0.8.20",
      "Proxy": "0",
      "Implementation": "",
      "ContractCreator": "0x...",
      "TxHash": "0x..."
    }
  ]
}
```

### Missing Field Handling

- If source code is not verified, mark `isVerified = false`.
- If deployer cannot be found, set deployer-history confidence to low.
- Do not rely on Basescan for high-throughput streaming.

---

## 6. Base RPC

### MVP Use

Onchain reads and targeted event queries.

### Candidate RPC Methods

```text
eth_blockNumber
eth_getBlockByNumber
eth_getTransactionByHash
eth_getTransactionReceipt
eth_getLogs
eth_call
```

### Candidate Contract Calls

ERC-20 metadata:

```text
name()
symbol()
decimals()
totalSupply()
owner() if available
```

### Candidate Events

ERC-20:

```text
Transfer(address indexed from, address indexed to, uint256 value)
```

DEX factories:

```text
PairCreated(...)
PoolCreated(...)
```

Actual event signatures depend on DEX venue and must be confirmed in Stage 4 or implementation.

### Representative RPC Log Shape

```json
{
  "address": "0xFactoryOrTokenAddress",
  "topics": [
    "0xeventSignature",
    "0xindexedTopic1",
    "0xindexedTopic2"
  ],
  "data": "0x...",
  "blockNumber": "0x123",
  "transactionHash": "0x...",
  "logIndex": "0x1"
}
```

### Missing Field Handling

RPC logs are low-level. Decoding errors should be stored as source-observation errors, not silently discarded.

---

# Normalized Field Mapping

## Minimum Ranked Feed Fields

| UI Field | Source Priority |
|---|---|
| Token symbol | DEX Screener → RPC metadata |
| Token address | DEX Screener → RPC |
| Pool address | DEX Screener → GeckoTerminal → RPC |
| Pair age | DEX Screener → first observed |
| Liquidity | DEX Screener → GeckoTerminal |
| Volume | DEX Screener → GeckoTerminal |
| Contract risk | GoPlus → TokenSniffer → Basescan |
| Verified status | Basescan → GoPlus |
| Deployer | GoPlus creator field → Basescan → RPC receipt |
| Deployer history | Basescan/API-derived → internal history |
| Score | Internal |
| Triage label | Internal |
| Reason string | Internal |

---

# Missing Fields Policy

## Missing field should not imply safety

Example:

```text
If honeypot risk is null, the system should not show “safe.”
It should show “unknown honeypot status” and lower score confidence.
```

## Confidence levels

Use confidence levels to prevent overclaiming.

```text
High confidence:
- data is available from multiple sources or direct onchain query

Medium confidence:
- data is available from one credible source

Low confidence:
- data is missing, stale, contradictory, or inferred
```

---

# Recommended Sample Payload Directory

When smoke tests are run, save payloads like this:

```text
/samples
  /dexscreener
    token-pairs-example.json
    pair-example.json
  /geckoterminal
    token-pools-example.json
  /goplus
    token-security-example.json
  /basescan
    contract-source-example.json
    contract-creation-example.json
  /rpc
    pool-created-log-example.json
    token-metadata-call-example.json
```

---

# API Contract Exit Gate

This document is complete for Stage 3 when the following are true:

- Each required MVP field has a preferred source.
- Missing fields have an explicit fallback behavior.
- Provider payloads are not treated as stable until smoke-tested.
- The MVP can compute a rough score from normalized contract-risk, liquidity-quality, and deployer-history fields.

Before implementation, replace representative sample payloads with real captured payloads from live API calls.
