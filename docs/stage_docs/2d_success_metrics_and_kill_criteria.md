# 02 — Success Metrics and Kill Criteria

## Strategic Success Criterion

The project is strategically successful if the console helps the analyst/operator triage new Base token launches faster and with better judgment than the current expected manual workflow across DEX Screener, GeckoTerminal, Basescan, Farcaster, and token-risk scanners.

The first version succeeds if it becomes useful enough that the analyst checks it before opening DEX Screener.

## Primary MVP Success Metrics

## 1. Preferred Starting Surface

Primary metric:

> I check this console before DEX Screener when monitoring new Base launches.

Interpretation:

- This is the clearest behavioral signal that the product has workflow value.
- If the console is not useful enough to become the first screen, the MVP is not yet working.

Measurement method:

- Track personal usage during internal alpha.
- After each monitoring session, note whether the console or DEX Screener was opened first.
- Use qualitative judgment for Stage 5–6; quantify later if needed.

Success condition:

```text
The console becomes the default first screen for Base launch triage.
```

Kill signal:

```text
The analyst still opens DEX Screener first and ignores the console.
```

## 2. Better Ranked List Than DEX Screener Volume Sorting

Primary comparative metric:

> The ranked feed is more useful than DEX Screener new Base pairs sorted by volume.

Interpretation:

- The MVP must provide better triage than a simple public baseline.
- The product does not need to predict winners, but it must improve prioritization.

Measurement method:

Compare:

- console top-ranked launches
- DEX Screener new Base pairs sorted by volume

Evaluate whether console-ranked tokens are better on:

- lower obvious-risk rate
- better liquidity quality
- better deployer context
- fewer low-quality boosted/noisy launches
- higher usefulness for deeper manual research

Success condition:

```text
The console top-ranked list produces better research candidates than simple volume sorting.
```

Kill signal:

```text
DEX Screener volume sorting is just as useful or more useful than the console ranking.
```

## Supporting MVP Success Metrics

## 3. Manual Triage Time Reduction

Supporting metric:

> The console reduces the time required to make a first-pass triage decision.

Measurement method:

Estimate time required to classify a token as:

- Ignore
- Risky
- Watch
- Research Deeper
- High Priority

Compare:

- manual workflow using public tools
- console-assisted workflow

Initial success condition:

```text
The console meaningfully reduces first-pass review time per token.
```

Suggested later threshold:

```text
Reduce first-pass triage time by at least 50%.
```

This exact threshold does not need to be enforced until validation is more formal.

## 4. Obvious-Risk Capture

Supporting metric:

> The console flags obvious risky launches quickly enough to avoid wasting research time.

Measurement method:

Track launches that have severe risk flags, such as:

- honeypot indicator
- severe tax risk
- mutable tax risk
- blacklist/whitelist risk
- mint risk
- suspicious owner/admin control
- unverified or suspicious contract pattern
- suspicious deployer history

Success condition:

```text
The console reliably marks obvious high-risk launches as Risky.
```

Kill signal:

```text
Obvious risky launches frequently appear as Watch, Research Deeper, or High Priority.
```

## 5. Research-Candidate Quality

Supporting metric:

> Tokens labeled Research Deeper or High Priority are plausibly worth manual inspection.

Measurement method:

For each token labeled `Research Deeper` or `High Priority`, manually review whether the label made sense.

Evaluate:

- Was liquidity sufficient to matter?
- Were contract risks acceptable or at least clearly explained?
- Was deployer context reasonable?
- Did the reason string match the actual data?
- Was the token more interesting than random new launches?

Success condition:

```text
Most Research Deeper and High Priority labels feel justified after manual inspection.
```

Kill signal:

```text
High-priority labels are dominated by obvious noise, bad liquidity, or untrustworthy data.
```

## 6. Explanation Usefulness

Supporting metric:

> Score explanations are clear enough to support trust and debugging.

Measurement method:

For each ranked row, inspect whether the reason string answers:

- Why is this token ranked here?
- What are the strongest positive signals?
- What are the strongest negative signals?
- What data is missing or low-confidence?

Success condition:

```text
The analyst can understand and challenge every score from the row-level explanation.
```

Kill signal:

```text
Scores feel opaque, arbitrary, or disconnected from the visible data.
```

## Baselines

## Primary Baseline

```text
Manual workflow across:
- DEX Screener
- GeckoTerminal
- Basescan
- TokenSniffer / GoPlus
- Farcaster/social search, later if needed
```

The question:

> Does the console save time and improve triage compared with checking these tools manually?

## Secondary Baseline

```text
DEX Screener new Base pairs sorted by volume.
```

The question:

> Does the console produce a more useful ranked list than a simple public volume-based feed?

## Future Baselines

After v0, additional baselines may include:

- DEX Screener trending/boosted tokens
- GeckoTerminal top Base pools
- simple liquidity-only ranking
- simple contract-risk-only ranking
- onchain-only ranking without social signals
- ranking with Farcaster features versus without Farcaster features

## Measurement Method

## Stage 5–6 Measurement

During MVP build and internal alpha:

- manually inspect console output
- compare top-ranked rows against DEX Screener
- record obvious false positives
- record obvious false negatives
- record whether alerts were useful
- record whether the console became the first screen

## Stage 7 Measurement

During validation beta:

- run continuous monitoring over several hundred Base launches
- compare ranker against public baselines
- measure liquidity retention
- measure scam/risk incidence
- measure alert precision
- measure operator usefulness
- evaluate whether social signals improve rankings, if added

## MVP Kill Criteria

## Primary Kill Criterion

```text
The product is not better than DEX Screener/manual workflow.
```

This is the main kill criterion.

If the console does not produce better triage than DEX Screener new Base pairs plus manual checks, the project should be narrowed or stopped.

## Specific Kill Criteria

| Kill Criterion | Meaning | Action |
|---|---|---|
| No ranking lift over DEX Screener volume sorting | Added complexity is not creating product value. | Narrow or stop. |
| Analyst still opens DEX Screener first | Product is not becoming the preferred workflow. | Rework feed or stop. |
| False positives dominate high-priority labels | Ranking is too noisy. | Tighten score thresholds. |
| Obvious scams pass as good candidates | Risk score is too weak. | Improve risk model before adding features. |
| Liquidity quality is frequently wrong | Pool/canonicalization logic is unreliable. | Prioritize liquidity model or stop. |
| Deployer history is unavailable or unhelpful | One core differentiator is weak. | Simplify or replace component. |
| Alerts are mostly ignored | Alerts are too noisy or not useful. | Reduce alert types and thresholds. |
| MVP cannot stay narrow | Scope is drifting into a generic terminal. | Cut features aggressively. |

## Non-Kill Conditions

The project should not be killed merely because:

- the UI is rough
- the first scoring thresholds are imperfect
- not every token has complete data
- some deployers are unknown
- social signals are missing in v0
- advanced wallet graphing is not implemented
- the first version is not monetizable

These are expected v0 limitations.

## Success Threshold for Moving Past MVP

The project can move beyond MVP if:

- the console becomes the preferred first screen
- the ranked feed feels more useful than DEX Screener volume sorting
- high-risk labels catch obvious bad launches
- high-priority labels are plausibly worth deeper research
- score explanations are understandable
- the system remains maintainable as a solo-engineer project

## Stage 2 Exit Gate

Stage 2 is complete when these statements are accepted:

```text
The MVP will be judged primarily by whether I check it before DEX Screener.

The MVP will be compared against DEX Screener new Base pairs sorted by volume.

The MVP should be killed or narrowed if its ranking does not improve triage versus DEX Screener/manual workflow.
```
