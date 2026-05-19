# 4d — Scoring and Triage Model

## Purpose

This document defines the MVP scoring and triage model for the Base Launch Intelligence Console.

The scoring model converts normalized launch, market, liquidity, contract-risk, and deployer-history data into:

```text
contract_risk_score
liquidity_quality_score
deployer_history_score
overall_score
triage_label
confidence
reason_summary
reason_details
critical_flags
```

The model is intentionally rule-based, auditable, and conservative. It is not a price-prediction model, a trading signal, or a recommendation engine.

---

## Model Scope

## In scope for v0

| Component                 | Included | Purpose                                                            |
| ------------------------- | -------: | ------------------------------------------------------------------ |
| Contract risk             |      Yes | Block or downgrade obvious high-risk launches                      |
| Liquidity quality         |      Yes | Prevent thin, fragile, or misleading liquidity from ranking highly |
| Deployer history          |      Yes | Add context on repeat, unknown, or suspicious deployers            |
| Canonical pool confidence |      Yes | Prevent wrong-pool selection from corrupting liquidity score       |
| Score confidence          |      Yes | Make missing or stale data visible                                 |
| Reason strings            |      Yes | Make every score inspectable                                       |
| High-score alerts         |      Yes | Surface launches worth immediate manual review                     |
| High-risk alerts          |      Yes | Surface severe risk detections                                     |

## Out of scope for v0

```text
ML ranking
price prediction
buy/sell recommendations
wallet-cohort scoring
cross-token wallet migration
Farcaster/social velocity
full route simulation
full price-impact curves
retention curves
smart-account-aware clustering
advanced deployer graph analysis
```

---

## Score Semantics

All component scores use the same convention:

```text
0   = worst / unusable / highest concern
100 = best / cleanest / highest confidence positive
```

The scores are workflow-ranking scores, not objective measurements of token quality.

|                     Score | Meaning                                                          |
| ------------------------: | ---------------------------------------------------------------- |
|     `contract_risk_score` | Higher means fewer known contract/security concerns.             |
| `liquidity_quality_score` | Higher means stronger, more usable, better-context liquidity.    |
|  `deployer_history_score` | Higher means more favorable or less concerning deployer context. |
|           `overall_score` | Weighted combination after hard gates and confidence penalties.  |

---

## v0 Weighting

Initial v0 weighting:

```text
Contract risk:      40%
Liquidity quality:  40%
Deployer history:   20%
```

Formula before hard gates:

```text
overall_score =
  (contract_risk_score * 0.40) +
  (liquidity_quality_score * 0.40) +
  (deployer_history_score * 0.20)
```

These weights should remain static during the first implementation. Changing them too early will make validation harder.

---

## Triage Labels

The product supports five labels:

| Label             | Meaning                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| `Ignore`          | Low-quality, too thin, stale, or not worth active monitoring.                        |
| `Risky`           | Obvious or material structural risk. Review only for research/debugging.             |
| `Watch`           | Incomplete or mixed data; not disqualified, but not strong enough for deeper review. |
| `Research Deeper` | Plausibly worth manual investigation and not obviously disqualified.                 |
| `High Priority`   | Strongest candidates for immediate manual review.                                    |

Labels are research workflow states. They are not trading instructions.

---

## Label Priority Order

When labels conflict, apply this priority:

```text
Risky
Ignore
High Priority
Research Deeper
Watch
```

Rationale:

1. Severe contract or structural risk should override attractive market activity.
2. Very low liquidity should prevent attention inflation.
3. High-priority status should require both score and confidence.
4. Incomplete but non-critical cases should usually become `Watch`.

---

## Hard Downgrade Rules

Hard downgrades run before ordinary threshold labels.

## Forced `Risky`

Assign `Risky` when any critical flag is present:

| Condition                                           | Critical flag               |
| --------------------------------------------------- | --------------------------- |
| Honeypot detected                                   | `honeypot_detected`         |
| Sell tax is extremely high                          | `extreme_sell_tax`          |
| Buy tax is extremely high                           | `extreme_buy_tax`           |
| Blacklist logic detected                            | `blacklist_detected`        |
| Whitelist restriction detected                      | `whitelist_detected`        |
| Mint authority with weak/unknown ownership controls | `mint_authority_risk`       |
| Proxy/upgradeability risk with weak verification    | `proxy_upgradeability_risk` |
| Tax modifiable with non-trivial tax                 | `modifiable_tax_risk`       |

Suggested v0 tax thresholds:

| Field    | Medium concern | High concern | Critical concern |
| -------- | -------------: | -----------: | ---------------: |
| Buy tax  |         `> 5%` |      `> 10%` |         `>= 20%` |
| Sell tax |         `> 5%` |      `> 10%` |         `>= 20%` |

These thresholds are deliberately conservative. They should be tuned after observing real Base launches.

## Forced `Ignore`

Assign `Ignore` when liquidity is too thin to support useful monitoring and there is no offsetting reason to watch.

Suggested forced-ignore conditions:

```text
liquidity_usd is null or < 1,000
AND no meaningful volume
AND no strong deployer context
AND no high-confidence risk reason requiring Risky
```

or:

```text
canonical_pool_confidence = low
AND liquidity is very low
AND market data is stale or incomplete
```

Do not use `Ignore` for severe scam-like risk. Use `Risky` instead.

---

## Contract-Risk Score

## Inputs

Use the latest `risk_checks` row and relevant token fields:

```text
is_honeypot
buy_tax
sell_tax
is_tax_modifiable
has_blacklist
has_whitelist
can_mint
owner_address
ownership_renounced
is_proxy
is_verified
top_holder_pct
top10_holder_pct
lp_locked_or_burned
risk_level
scanner_score
risk_summary
observed_at
```

## Baseline

Start at:

```text
contract_risk_score = 85
```

Then apply penalties and small positive adjustments.

Starting at 85 avoids giving every unknown token a perfect safety score while still allowing clean scanner results to score well.

## Penalties

| Condition                                 |                                                                      Penalty |
| ----------------------------------------- | ---------------------------------------------------------------------------: |
| Honeypot true                             |                                                  force `0` and critical flag |
| Sell tax `>= 20%`                         |                                                  force `0` and critical flag |
| Buy tax `>= 20%`                          |                                                      `-50` and critical flag |
| Sell tax `> 10%`                          |                                                                        `-35` |
| Buy tax `> 10%`                           |                                                                        `-25` |
| Sell tax `> 5%`                           |                                                                        `-15` |
| Buy tax `> 5%`                            |                                                                        `-10` |
| Tax modifiable true and buy/sell tax > 0  |                                                                        `-35` |
| Tax modifiable true and taxes unknown     |                                                                        `-25` |
| Blacklist true                            |                                       force max score `20` and critical flag |
| Whitelist true                            |                                       force max score `20` and critical flag |
| Can mint true and ownership not renounced |                                                                        `-35` |
| Can mint true and owner unknown           |                                                                        `-30` |
| Owner/admin present and not renounced     |                                                                        `-15` |
| Proxy true and not verified               |                                                                        `-25` |
| Contract not verified / not open source   |                                                                        `-15` |
| Top holder pct `> 20%`                    |                                                                        `-20` |
| Top holder pct `> 10%`                    |                                                                        `-10` |
| Top 10 holder pct `> 50%`                 |                                                                        `-15` |
| LP not locked/burned when available       |                                                                        `-10` |
| Risk scanner unavailable                  | `-20` confidence penalty, not score penalty unless no other risk data exists |

## Positive adjustments

| Condition                                               | Adjustment |
| ------------------------------------------------------- | ---------: |
| Open source / verified true                             |       `+5` |
| Ownership renounced true                                |       `+5` |
| LP locked or burned true                                |       `+5` |
| No honeypot, low taxes, no blacklist, no mint, verified |       `+5` |

Positive adjustments are capped so they cannot erase severe structural concerns.

## Score bounds

After penalties and adjustments:

```text
contract_risk_score = clamp(contract_risk_score, 0, 100)
```

## Risk-level mapping

If using a normalized `risk_level` from a provider, treat it as advisory evidence:

| Provider risk level |                    Score cap |
| ------------------- | ---------------------------: |
| `critical`          |                         `20` |
| `high`              |                         `40` |
| `medium`            |                         `70` |
| `low`               |                       no cap |
| `unknown`           | no cap, but lower confidence |

Provider risk levels should not replace field-level scoring.

---

## Liquidity-Quality Score

## Inputs

Use the latest canonical pool and market snapshot:

```text
liquidity_usd
volume_5m_usd
volume_1h_usd
volume_6h_usd
volume_24h_usd
txns_5m_buys
txns_5m_sells
txns_1h_buys
txns_1h_sells
buyers_5m
sellers_5m
price_usd
fdv_usd
market_cap_usd
quote_token_symbol
dex_id
pair_created_at
canonical_confidence
canonical_reason
market_snapshot_observed_at
```

## Baseline

Start from a liquidity tier, then adjust.

## Liquidity tier score

|    Liquidity USD | Base score |
| ---------------: | ---------: |
|          Missing |       `20` |
|        `< 1,000` |       `10` |
|    `1,000–4,999` |       `25` |
|   `5,000–14,999` |       `45` |
|  `15,000–49,999` |       `65` |
| `50,000–149,999` |       `80` |
|     `>= 150,000` |       `90` |

These thresholds should be tuned after observing actual launch distributions.

## Quote-asset adjustment

| Quote asset       | Adjustment |
| ----------------- | ---------: |
| `WETH`            |       `+8` |
| `USDC`            |       `+8` |
| `USDbC`           |       `+4` |
| `DAI`             |       `+3` |
| `cbBTC`           |       `+2` |
| Unknown / obscure |      `-10` |

## Venue adjustment

| Venue context                                | Adjustment |
| -------------------------------------------- | ---------: |
| Known major Base DEX                         |       `+5` |
| Known launch platform / expected pool source |       `+3` |
| Unknown venue                                |       `-8` |
| Provider venue missing                       |      `-10` |

Known major Base DEX examples for v0:

```text
uniswap
aerodrome
baseswap
pancakeswap
```

This list should live in config, not hard-coded in scoring functions.

## Canonical-pool confidence adjustment

| Canonical confidence |                            Adjustment |
| -------------------- | ------------------------------------: |
| `high`               |                                  `+5` |
| `medium`             |                                   `0` |
| `low`                | `-25` and cap liquidity score at `60` |

If the canonical pool is low-confidence, the model should not produce a high-confidence liquidity score.

## Volume/liquidity sanity adjustment

Volume is useful but gameable. Use it mainly as a sanity check.

Compute:

```text
volume_liquidity_ratio_1h = volume_1h_usd / liquidity_usd
volume_liquidity_ratio_24h = volume_24h_usd / liquidity_usd
```

Suggested adjustments:

| Condition                                                 |                      Adjustment |
| --------------------------------------------------------- | ------------------------------: |
| Missing volume and token is new                           |                             `0` |
| Missing volume and token is not new                       |                           `-10` |
| Moderate volume with adequate liquidity                   |                            `+5` |
| Very high volume/liquidity ratio on thin liquidity        |                           `-10` |
| Absurd ratio suggesting wash/noise                        |                           `-20` |
| Transactions exist but buys/sells are extremely one-sided | `-5` to `-15` depending context |

Suggested v0 suspicious thresholds:

```text
liquidity_usd < 10,000 AND volume_1h_usd / liquidity_usd > 10
liquidity_usd < 25,000 AND volume_24h_usd / liquidity_usd > 50
```

These are not proof of manipulation. They are reason-string inputs and scoring penalties.

## Age adjustment

| Pair age                                 | Adjustment |
| ---------------------------------------- | ---------: |
| Missing                                  |       `-5` |
| `< 15 minutes`                           |        `0` |
| `15 minutes–6 hours`                     |       `+3` |
| `6–24 hours` and liquidity still present |       `+5` |
| `> 24 hours` and stagnant/low activity   |       `-5` |

Do not penalize very new launches too heavily solely for age.

## Liquidity score bounds

```text
liquidity_quality_score = clamp(score, 0, 100)
```

---

## Deployer-History Score

## Inputs

Use token deployer fields and the latest deployer-history snapshot:

```text
deployer_address
internal_prior_seen_token_count
prior_contract_count
prior_token_count
prior_launch_count
verified_contract_count
suspicious_prior_launch_count
repeated_template_confidence
history_confidence
known_label
summary
```

## Baseline

Start at:

```text
deployer_history_score = 55
```

Rationale: unknown deployers should not be treated as bad by default, but they should not contribute strong positive ranking.

## Adjustments

| Condition                                                        |                            Adjustment |
| ---------------------------------------------------------------- | ------------------------------------: |
| Deployer unknown                                                 |            `-10` and lower confidence |
| New deployer, no suspicious data                                 |                                   `0` |
| Repeat deployer seen internally 2–4 times, no suspicious history |                                  `+5` |
| Repeat deployer seen internally 5+ times, no suspicious history  |                                 `+10` |
| Prior verified contracts available                               |                                  `+5` |
| Known positive manual/provider label                             |                                 `+15` |
| Suspicious prior launch count `>= 1`                             |                                 `-25` |
| Suspicious prior launch count `>= 3`                             |                                 `-45` |
| Repeated template confidence high and prior outcomes unknown     |                                 `-10` |
| Very high launch cadence with weak liquidity outcomes            |                                 `-20` |
| External history unavailable                                     | confidence penalty, not score penalty |

## Score caps

| Condition                              | Score cap |
| -------------------------------------- | --------: |
| Suspicious prior launch count `>= 3`   |      `35` |
| Deployer unknown                       |      `60` |
| History confidence low                 |      `70` |
| Known suspicious manual/provider label |      `25` |

## Deployer score bounds

```text
deployer_history_score = clamp(score, 0, 100)
```

---

## Confidence Model

Confidence is separate from score.

A token can have a high score with medium confidence, or a mediocre score with high confidence.

## Component confidence

Compute confidence for each component:

```ts
type ComponentConfidence = 'low' | 'medium' | 'high';
```

## Contract-risk confidence

| Condition                                         | Confidence |
| ------------------------------------------------- | ---------- |
| Fresh scanner result with key fields present      | `high`     |
| Scanner result present but several fields missing | `medium`   |
| Scanner unavailable or stale                      | `low`      |

Important key fields:

```text
honeypot
buy_tax
sell_tax
blacklist/whitelist
mint
verification/open-source
owner/admin
```

## Liquidity confidence

| Condition                                             | Confidence |
| ----------------------------------------------------- | ---------- |
| Fresh market data + high canonical-pool confidence    | `high`     |
| Fresh market data + medium canonical-pool confidence  | `medium`   |
| Stale/missing market data or low canonical confidence | `low`      |

Suggested freshness:

```text
hot/recent tokens: market snapshot newer than 5 minutes
warm tokens: market snapshot newer than 15 minutes
cold/ignored tokens: snapshot may be older but should be shown as stale
```

## Deployer confidence

| Condition                                               | Confidence |
| ------------------------------------------------------- | ---------- |
| Deployer resolved + internal/external history available | `high`     |
| Deployer resolved + only internal history available     | `medium`   |
| Deployer unknown or history unavailable                 | `low`      |

## Overall confidence

Use the lowest-confidence critical component, with one exception:

```text
if contractRiskConfidence = low:
  overall confidence cannot exceed medium

if liquidityConfidence = low:
  overall confidence cannot exceed medium

if deployerConfidence = low:
  overall confidence can still be medium if contract and liquidity are high
```

Suggested mapping:

| Component confidences                         | Overall      |
| --------------------------------------------- | ------------ |
| All high                                      | `high`       |
| Two high, one medium                          | `high`       |
| One or more low but no critical missing field | `medium`     |
| Contract risk low or liquidity low            | max `medium` |
| Contract risk low and liquidity low           | `low`        |
| No risk check and no market snapshot          | `low`        |

## Confidence effects on label

| Confidence | Label impact                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `high`     | Eligible for `High Priority`                                                                                       |
| `medium`   | Eligible for `Research Deeper`; eligible for `High Priority` only if score is very strong and no critical unknowns |
| `low`      | Usually `Watch`, `Ignore`, or `Risky`; not eligible for `High Priority`                                            |

---

## Overall Label Rules

After hard downgrades and component scores:

## `Risky`

Assign when:

```text
critical_flags.length > 0
OR contract_risk_score < 35
OR provider risk_level IN ('high', 'critical') with supporting field-level evidence
```

## `Ignore`

Assign when:

```text
overall_score < 35
AND no critical risk requiring Risky
```

or:

```text
liquidity_quality_score < 25
AND liquidity_usd < 5,000
AND no strong reason to watch
```

## `Watch`

Assign when:

```text
overall_score >= 35 AND overall_score < 65
```

or:

```text
overall_score >= 65
AND confidence = low
AND no critical risk
```

## `Research Deeper`

Assign when:

```text
overall_score >= 65
AND confidence IN ('medium', 'high')
AND contract_risk_score >= 65
AND liquidity_quality_score >= 55
AND no critical flags
```

## `High Priority`

Assign when:

```text
overall_score >= 80
AND confidence IN ('medium', 'high')
AND contract_risk_score >= 75
AND liquidity_quality_score >= 70
AND no critical flags
AND canonical_pool_confidence != 'low'
```

For stricter validation, require `confidence = high` during the first internal alpha. This will reduce noisy alerts.

---

## Alert Rules

## High-score alert

Emit `new_high_score_launch` when:

```text
triage_label = 'High Priority'
AND overall_score >= 80
AND confidence != 'low'
AND no previous active alert exists for this token and alert type
```

Alert severity:

|   Score | Severity                                            |
| ------: | --------------------------------------------------- |
| `80–89` | `high`                                              |
|   `90+` | `critical` only if all component confidence is high |

Use `critical` sparingly.

## Obvious high-risk alert

Emit `obvious_high_risk_launch` when:

```text
triage_label = 'Risky'
AND critical_flags contains at least one severe contract risk
AND no previous active alert exists for this token and alert type + risk-state
```

Severe contract-risk flags:

```text
honeypot_detected
extreme_sell_tax
blacklist_detected
whitelist_detected
mint_authority_risk
proxy_upgradeability_risk
modifiable_tax_risk
```

Alert severity:

| Condition                      | Severity   |
| ------------------------------ | ---------- |
| Honeypot or blacklist          | `critical` |
| Extreme sell tax               | `critical` |
| Mint/admin/proxy critical risk | `high`     |
| Multiple high-risk flags       | `critical` |

---

## Reason String Model

Every score must produce:

```text
reason_summary
reason_details[]
critical_flags[]
```

## `reason_summary`

A feed-ready sentence or short phrase.

Examples:

```text
Risky: honeypot flag and blacklist logic detected.
Ignore: liquidity below $1k and no meaningful market activity.
Watch: adequate liquidity but contract-risk data is unavailable.
Research Deeper: clean basic risk check, adequate WETH liquidity, unknown deployer.
High Priority: clean risk check, strong WETH liquidity, repeat deployer with no internal negative history.
```

## `reason_details`

Structured details for debugging and future expandable rows.

Example:

```json
[
  "Contract risk score 82: verified contract, low tax, no blacklist flag.",
  "Liquidity score 74: $42k liquidity on WETH pair; canonical confidence high.",
  "Deployer score 60: deployer seen once internally; no suspicious prior history available.",
  "Confidence medium: Basescan deployer history unavailable."
]
```

## Reason-generation rules

1. Mention the strongest negative driver first if label is `Risky` or `Ignore`.
2. Mention the strongest positive driver first if label is `Research Deeper` or `High Priority`.
3. Always mention missing data when it materially affects confidence.
4. Do not imply safety from missing fields.
5. Do not use buy/sell language.
6. Keep `reason_summary` short enough for the table.

---

## Missing Data Rules

| Missing field            | Behavior                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Missing risk check       | Risk confidence low; cannot be `High Priority`; reason must mention unknown risk data. |
| Missing liquidity        | Liquidity score low; likely `Ignore` or `Watch`.                                       |
| Missing deployer         | Deployer score neutral-low; confidence penalty; do not force `Risky`.                  |
| Missing pair age         | Small liquidity confidence penalty.                                                    |
| Missing market cap / FDV | Do not use cap-ratio rules.                                                            |
| Missing LP lock          | Do not assume unlocked; mention if relevant.                                           |
| Missing canonical pool   | Liquidity confidence low; cannot be `High Priority`.                                   |

---

## Anti-Gaming Rules

The model should avoid these failure modes:

## Do not over-rank raw volume

Raw volume is easy to manipulate. Use it only with:

```text
liquidity
transaction diversity
canonical-pool confidence
volume/liquidity sanity
```

## Do not over-trust holder count

Holder count is deferred from v0 unless supplied by a risk provider. If added later, it must be adjusted for dust and sybil patterns.

## Do not treat risk scanners as oracles

A clean scanner result is not proof of safety. It is a positive input with timestamp and confidence.

## Do not let paid visibility look organic

DEX Screener boosts, ads, or paid order metadata should eventually lower organic-attention assumptions. In v0, paid-promotion awareness can be included in reason details if available, but it should not be a primary score component unless data is reliable.

## Do not treat unknown deployer as malicious

Unknown deployer lowers confidence. It should not automatically force `Risky`.

---

## Scoring Pseudocode

```ts
type ScoreInput = {
  token: Token;
  canonicalPool: Pool | null;
  marketSnapshot: MarketSnapshot | null;
  riskCheck: RiskCheck | null;
  deployerHistory: DeployerHistorySnapshot | null;
};

type TokenScoreResult = {
  contractRiskScore: number;
  liquidityQualityScore: number;
  deployerHistoryScore: number;
  overallScore: number;
  triageLabel: TriageLabel;
  confidence: ConfidenceLevel;
  reasonSummary: string;
  reasonDetails: string[];
  criticalFlags: string[];
};

function scoreToken(input: ScoreInput): TokenScoreResult {
  const contract = scoreContractRisk(input.riskCheck, input.token);
  const liquidity = scoreLiquidityQuality(
    input.marketSnapshot,
    input.canonicalPool
  );
  const deployer = scoreDeployerHistory(input.deployerHistory, input.token);

  const criticalFlags = [
    ...contract.criticalFlags,
    ...liquidity.criticalFlags,
    ...deployer.criticalFlags
  ];

  let overallScore =
    contract.score * 0.4 + liquidity.score * 0.4 + deployer.score * 0.2;

  overallScore = clamp(overallScore, 0, 100);

  const confidence = computeOverallConfidence([
    contract.confidence,
    liquidity.confidence,
    deployer.confidence
  ]);

  const triageLabel = assignTriageLabel({
    overallScore,
    contractRiskScore: contract.score,
    liquidityQualityScore: liquidity.score,
    deployerHistoryScore: deployer.score,
    confidence,
    criticalFlags,
    canonicalConfidence: input.canonicalPool?.canonicalConfidence ?? 'low'
  });

  return buildScoreResult({
    contract,
    liquidity,
    deployer,
    overallScore,
    triageLabel,
    confidence,
    criticalFlags
  });
}
```

---

## Example Outputs

## Example 1 — Obvious high risk

```json
{
  "contractRiskScore": 0,
  "liquidityQualityScore": 72,
  "deployerHistoryScore": 55,
  "overallScore": 40.8,
  "triageLabel": "Risky",
  "confidence": "high",
  "reasonSummary": "Risky: honeypot flag detected despite adequate liquidity.",
  "criticalFlags": ["honeypot_detected"],
  "reasonDetails": [
    "Contract risk score 0: GoPlus honeypot flag is true.",
    "Liquidity score 72: adequate WETH liquidity, canonical confidence high.",
    "Deployer score 55: deployer context neutral or unavailable."
  ]
}
```

## Example 2 — High priority

```json
{
  "contractRiskScore": 88,
  "liquidityQualityScore": 82,
  "deployerHistoryScore": 65,
  "overallScore": 81,
  "triageLabel": "High Priority",
  "confidence": "medium",
  "reasonSummary": "High Priority: clean basic risk check, strong WETH liquidity, repeat deployer with no internal negative history.",
  "criticalFlags": [],
  "reasonDetails": [
    "Contract risk score 88: low tax, no blacklist flag, verified/open-source signal present.",
    "Liquidity score 82: $65k WETH liquidity, active pool, canonical confidence high.",
    "Deployer score 65: repeat deployer seen internally; no suspicious prior launch count available.",
    "Confidence medium: external deployer history is incomplete."
  ]
}
```

## Example 3 — Watch due to missing risk data

```json
{
  "contractRiskScore": 65,
  "liquidityQualityScore": 76,
  "deployerHistoryScore": 55,
  "overallScore": 67.4,
  "triageLabel": "Watch",
  "confidence": "low",
  "reasonSummary": "Watch: adequate liquidity, but contract-risk data is unavailable.",
  "criticalFlags": [],
  "reasonDetails": [
    "Contract risk confidence low: no current GoPlus risk check available.",
    "Liquidity score 76: adequate USDC liquidity, canonical confidence medium.",
    "Deployer score 55: deployer unresolved or neutral."
  ]
}
```

---

## Validation Plan

During MVP/internal alpha, validate scoring against two baselines:

1. DEX Screener new Base pairs sorted by volume.
2. Manual workflow across DEX Screener, GeckoTerminal, Basescan, and GoPlus/TokenSniffer.

Track:

| Metric                     | Question                                                    |
| -------------------------- | ----------------------------------------------------------- |
| Obvious-risk capture       | Are severe-risk launches consistently labeled `Risky`?      |
| High-priority precision    | Are `High Priority` rows actually worth manual review?      |
| Research-deeper usefulness | Are `Research Deeper` rows better than random new launches? |
| False positive rate        | Are noisy/thin/unsafe launches ranking too highly?          |
| False negative review      | Are interesting launches being buried as `Ignore`?          |
| Reason quality             | Can the analyst understand and challenge each label?        |

## Initial tuning rules

Do not tune weights after every bad row. Instead:

```text
Review at least 50–100 scored launches before changing component weights.
Tune hard gates first.
Tune reason strings second.
Tune component weights last.
```

---

## Implementation Notes

## Suggested file placement

```text
apps/worker/src/scoring/
  index.ts
  scoreContractRisk.ts
  scoreLiquidityQuality.ts
  scoreDeployerHistory.ts
  assignTriageLabel.ts
  computeConfidence.ts
  buildReasonStrings.ts
  constants.ts
  types.ts
```

## Testing fixtures

Create fixtures for:

```text
clean_token_good_liquidity.json
honeypot_good_liquidity.json
thin_liquidity_clean_contract.json
missing_risk_data.json
unknown_deployer.json
repeat_deployer_good.json
suspicious_deployer.json
multiple_pools_low_confidence.json
```

## Required unit tests

At minimum:

1. Honeypot forces `Risky`.
2. Extreme sell tax forces `Risky`.
3. Very low liquidity cannot become `High Priority`.
4. Missing risk data lowers confidence.
5. Unknown deployer does not force `Risky`.
6. Low canonical-pool confidence caps liquidity score.
7. High score with low confidence does not become `High Priority`.
8. Every score returns a non-empty `reason_summary`.
