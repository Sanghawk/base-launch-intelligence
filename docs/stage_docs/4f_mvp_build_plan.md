# 4f — MVP Build Plan

## Purpose

This document defines the implementation plan for the Base Launch Intelligence Console MVP.

The MVP is a two-week, local-first vertical slice that proves whether a ranked, explainable Base launch feed is more useful than manually checking DEX Screener, GeckoTerminal, Basescan, and risk scanners.

The goal is not to build a generic crypto data platform. The goal is to ship a working research console with:

```text
candidate discovery
→ normalization
→ market enrichment
→ contract-risk enrichment
→ shallow deployer context
→ scoring and triage
→ alert flags
→ rough ranked table
```

---

## MVP Outcome

At the end of the MVP build, the system should run locally and show a ranked table of new Base launches.

The table should answer:

```text
Which new Base launches deserve deeper investigation?
Which are obviously risky?
Which are ignorable?
Which should be watched?
```

---

## Build Constraints

| Area              | Constraint                                            |
| ----------------- | ----------------------------------------------------- |
| Timebox           | Approximately two weeks                               |
| User              | Single analyst/operator                               |
| Deployment        | Local-first                                           |
| Stack             | Next.js, Node/TypeScript, Postgres, Drizzle           |
| Worker            | Long-running Node worker loop                         |
| Database          | Docker Compose Postgres                               |
| Polling           | 3-minute loop                                         |
| Discovery         | DEX Screener first                                    |
| Market data       | DEX Screener primary                                  |
| Risk data         | GoPlus primary                                        |
| Deployer data     | Basescan if available; fallback to GoPlus/RPC/unknown |
| Social data       | Deferred                                              |
| Trading/execution | Not built                                             |
| Rust              | Deferred                                              |
| Auth/billing      | Not built                                             |

---

## Definition of Done

The MVP is done when:

1. A local worker can discover candidate Base token/pool records.
2. Raw provider payloads are stored in `source_observations`.
3. Tokens, pools, market snapshots, risk checks, deployers, deployer-history snapshots, scores, alerts, and worker runs are persisted in Postgres.
4. Every scored token receives:
   - component scores
   - overall score
   - triage label
   - confidence
   - reason summary
   - reason details
5. The Next.js dashboard renders a ranked table from `GET /api/launches`.
6. The table is useful enough to compare against DEX Screener new Base pairs sorted by volume.
7. High-score and high-risk alerts are logged and visible as dashboard flags.
8. Missing data is represented explicitly and does not imply safety.
9. The system can run repeatedly without duplicating token identity rows or corrupting snapshots.
10. The implementation remains narrow and does not drift into execution, social ingestion, or generic alpha-terminal features.

---

## Recommended Repository Shape

Use a simple monorepo.

```text
base-launch-intel/
  apps/
    web/
      src/
        app/
          api/
            alerts/
              route.ts
            health/
              route.ts
            launches/
              route.ts
          page.tsx
        components/
          AddressLink.tsx
          ConfidenceCell.tsx
          ExternalLinksCell.tsx
          HealthBanner.tsx
          LaunchFeedRow.tsx
          LaunchFeedTable.tsx
          ScoreCell.tsx
          TriageLabelBadge.tsx
        lib/
          api.ts
          format.ts
    worker/
      src/
        index.ts
        config.ts
        logger.ts
        loop.ts
        pipeline/
          runPipelineOnce.ts
          discoverCandidates.ts
          normalizeCandidates.ts
          enrichMarket.ts
          enrichRisk.ts
          enrichDeployer.ts
          selectCanonicalPools.ts
          scoreTokens.ts
          evaluateAlerts.ts
        providers/
          dexscreener.ts
          geckoterminal.ts
          goplus.ts
          basescan.ts
          baseRpc.ts
        normalization/
          normalizeDexScreener.ts
          normalizeGoPlus.ts
          normalizeBasescan.ts
          normalizeGeckoTerminal.ts
        scoring/
          assignTriageLabel.ts
          buildReasonStrings.ts
          computeConfidence.ts
          constants.ts
          scoreContractRisk.ts
          scoreDeployerHistory.ts
          scoreLiquidityQuality.ts
          types.ts
        alerts/
          alertRules.ts
          dedupe.ts
        samples/
          dexscreener/
          goplus/
          geckoterminal/
          basescan/
  packages/
    db/
      src/
        client.ts
        schema.ts
        migrations/
        queries/
          feed.ts
          health.ts
    shared/
      src/
        contracts/
          api.ts
        types/
          scoring.ts
          providers.ts
  docker-compose.yml
  drizzle.config.ts
  package.json
  pnpm-workspace.yaml
  .env.example
  README.md
```

This is more structure than strictly necessary, but it prevents provider, normalization, scoring, and UI logic from collapsing into one file.

---

## Environment Variables

Minimum `.env.example`:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/base_launch_intel

WORKER_POLL_INTERVAL_MS=180000
WORKER_CANDIDATE_LIMIT=50

DEXSCREENER_BASE_URL=https://api.dexscreener.com
GECKOTERMINAL_BASE_URL=https://api.geckoterminal.com/api/v2
GOPLUS_BASE_URL=https://api.gopluslabs.io

BASESCAN_API_KEY=
BASE_RPC_URL=

ENABLE_GECKOTERMINAL=false
ENABLE_BASESCAN=false
ENABLE_BASE_RPC=false
```

Do not expose provider keys to the frontend.

---

# Milestone Plan

## Milestone 0 — Project Bootstrap

## Goal

Create a runnable local development skeleton.

## Tasks

- Initialize repository.
- Add package manager workspace.
- Create `apps/web`.
- Create `apps/worker`.
- Create `packages/db`.
- Create `packages/shared`.
- Add TypeScript config.
- Add lint/format scripts if desired.
- Add Docker Compose Postgres.
- Add `.env.example`.
- Add basic README with local commands.

## Acceptance criteria

- `docker compose up` starts Postgres.
- Web app runs locally.
- Worker app starts and logs a placeholder loop.
- Packages compile.

## Suggested commands

```bash
pnpm install
docker compose up -d
pnpm dev:web
pnpm dev:worker
```

---

## Milestone 1 — Database Schema and Drizzle

## Goal

Implement the Stage 4 schema and migrations.

## Tasks

- Define Drizzle schema for:
  - `tokens`
  - `pools`
  - `market_snapshots`
  - `risk_checks`
  - `deployers`
  - `deployer_history_snapshots`
  - `token_scores`
  - `alerts`
  - `source_observations`
  - `worker_runs`
- Add enum types.
- Add indexes and unique constraints.
- Generate and run migration.
- Add database client.
- Add simple health query.

## Acceptance criteria

- Migrations run against local Postgres.
- Tables exist.
- Insert/select smoke test passes.
- Address fields are stored lowercase by application code.
- Snapshot tables allow repeated observations.

## Build notes

Do not over-optimize schema. The goal is feed reliability and inspectability, not analytics warehouse design.

---

## Milestone 2 — Provider Sample Capture

## Goal

Confirm provider payload shapes before deep implementation.

## Tasks

- Implement thin DEX Screener client.
- Fetch latest token profiles or candidate records.
- Filter to Base records.
- For each Base token, fetch token-pair data where required.
- Store sample JSON files under:
  - `apps/worker/src/samples/dexscreener`
- Implement thin GoPlus client.
- Fetch token-security sample for a small token list.
- Store sample JSON files under:
  - `apps/worker/src/samples/goplus`
- Optionally test GeckoTerminal for a few tokens.
- Optionally test Basescan if an API key is available.

## Acceptance criteria

- At least 20 candidate Base token/pair records can be captured from DEX Screener or an acceptable candidate source.
- At least 5–10 token-pair market responses are saved.
- At least 5–10 GoPlus token-security responses are saved or failures are documented.
- Missing fields and provider quirks are documented in code comments or README notes.

## Risk checkpoint

If DEX Screener cannot provide enough recent candidate records, add a bounded Base RPC known-factory polling task or use DEX Screener search/profile flow as a temporary candidate approximation.

---

## Milestone 3 — Source Observations and Normalization

## Goal

Store raw responses and normalize token/pool/market state.

## Tasks

- Implement `source_observations` insert helper.
- Implement candidate normalization.
- Upsert tokens by `chain_id + address`.
- Upsert pools by `chain_id + address`.
- Normalize DEX Screener market snapshots.
- Insert `market_snapshots`.
- Preserve earliest `first_seen_at`.
- Never overwrite known non-null identity fields with null.
- Add blue-chip quote-asset heuristic for product-token detection.

## Acceptance criteria

- Running discovery creates raw observations.
- Running discovery creates token records.
- Running discovery creates pool records when pair addresses are available.
- Running market enrichment creates market snapshots.
- Re-running the same payload does not duplicate token identity.
- Historical market snapshots append correctly.

## Implementation order

```text
1. source observation helper
2. token upsert
3. pool upsert
4. market snapshot insert
5. candidate processing list for downstream stages
```

---

## Milestone 4 — Worker Loop

## Goal

Create the real pipeline shell with worker-run observability.

## Tasks

- Implement `worker_runs`.
- Implement non-overlapping worker loop.
- Implement `runPipelineOnce`.
- Add provider-level error capture.
- Mark run as:
  - `success`
  - `partial_failure`
  - `failure`
- Add counters:
  - candidates discovered
  - tokens upserted
  - pools upserted
  - market snapshots inserted
  - risk checks inserted
  - scores inserted
  - alerts inserted
- Add structured logs.

## Acceptance criteria

- Worker runs every 3 minutes by default.
- Worker does not overlap runs.
- Worker logs run start/end.
- Worker records success/failure in Postgres.
- One provider failure does not necessarily crash the full run.

---

## Milestone 5 — Contract-Risk Enrichment

## Goal

Fetch and normalize GoPlus risk data.

## Tasks

- Implement GoPlus provider client.
- Normalize:
  - honeypot
  - buy tax
  - sell tax
  - tax modifiability
  - blacklist/whitelist
  - mint
  - owner/admin
  - ownership renounced
  - open-source/verification
  - top holder concentration where available
  - LP lock/burn where available
  - creator address where available
- Insert `risk_checks`.
- Update token verification/deployer fields when appropriate.
- Store missing fields as `null`.
- Add staleness/recheck policy.

## Acceptance criteria

- New tokens receive a risk check when GoPlus is available.
- Missing GoPlus data does not mark tokens safe.
- Severe flags are normalized clearly enough for scoring.
- Raw GoPlus payloads are stored.
- Token creator field is captured if supplied.

## Cut rule

If GoPlus access is unreliable, implement a placeholder risk check state and keep the system honest:

```text
risk data unavailable
confidence low
no High Priority eligibility
```

Do not block the whole MVP on perfect scanner integration.

---

## Milestone 6 — Deployer Enrichment

## Goal

Resolve a deployer address and compute shallow deployer history.

## Tasks

- Implement deployer resolution priority:
  1. Basescan contract creator, if available.
  2. GoPlus creator address, if available.
  3. Base RPC fallback, if feasible.
  4. Unknown.
- Upsert `deployers`.
- Link `tokens.deployer_id` and `tokens.deployer_address`.
- Compute `internal_prior_seen_token_count`.
- Insert `deployer_history_snapshots`.
- Add summary strings.

## Acceptance criteria

- Tokens with a known creator/deployer are linked to a deployer record.
- Unknown deployers are represented explicitly.
- Internal repeat deployers are counted.
- Missing external history lowers confidence.
- Unknown deployer does not force `Risky`.

## Cut rule

If Basescan is not available, use GoPlus creator fields and internal history only. That is sufficient for v0.

---

## Milestone 7 — Canonical Pool Selection

## Goal

Select one likely canonical pool per token with confidence.

## Tasks

- Group pools by token.
- Get latest market snapshot per pool.
- Score pool candidates by:
  - liquidity
  - quote asset quality
  - known venue
  - pair age
  - volume/liquidity sanity
  - GeckoTerminal agreement if available
- Mark one pool as `is_canonical_candidate = true` when possible.
- Set `canonical_confidence`.
- Set `canonical_reason`.
- Reset previous canonical flags when selection changes.

## Acceptance criteria

- Exactly one canonical pool is selected when data is sufficient.
- Low-confidence cases are marked low confidence.
- Multiple close pools do not produce false high confidence.
- Reason strings can reference canonical-pool confidence.

## Cut rule

Start with the simplest rule:

```text
highest liquidity pool with WETH/USDC quote on known DEX
```

Then add refinements only if bad pool selection appears in real output.

---

## Milestone 8 — Scoring and Triage

## Goal

Implement the rule-based scoring engine.

## Tasks

- Implement:
  - `scoreContractRisk`
  - `scoreLiquidityQuality`
  - `scoreDeployerHistory`
  - `computeConfidence`
  - `assignTriageLabel`
  - `buildReasonStrings`
- Insert `token_scores`.
- Include `critical_flags`.
- Add unit tests for hard gates.
- Add sample fixtures.

## Acceptance criteria

- Every processed token receives a score.
- Honeypot/extreme risk forces `Risky`.
- Very low liquidity cannot become `High Priority`.
- Missing risk data lowers confidence.
- Unknown deployer does not force `Risky`.
- Every score has a non-empty `reason_summary`.
- Scores are explainable from visible data.

## Initial v0 thresholds

Use the thresholds in `4d_scoring_and_triage_model.md`.

Do not tune weights until at least 50–100 real scored launches are reviewed.

---

## Milestone 9 — Alert Evaluation

## Goal

Create basic high-score and high-risk alerts.

## Tasks

- Implement `new_high_score_launch` rule.
- Implement `obvious_high_risk_launch` rule.
- Add alert dedupe key.
- Insert alerts.
- Log alerts to console.
- Expose alert flags in feed query.

## Acceptance criteria

- High-priority tokens create at most one active high-score alert per state.
- Obvious high-risk tokens create high-risk alerts.
- Alerts appear in `/api/alerts`.
- Alert flags appear in `/api/launches`.
- Alerts are not required to send email, Telegram, or webhook notifications.

---

## Milestone 10 — API Endpoints

## Goal

Expose dashboard-ready data.

## Tasks

- Implement `GET /api/launches`.
- Implement `GET /api/alerts`.
- Implement `GET /api/health`.
- Create shared API types.
- Implement latest-row feed query.
- Serialize numeric money values safely.
- Include freshness fields.
- Include external links.

## Acceptance criteria

- `/api/launches` returns one row per scored token.
- Rows include all required MVP table fields.
- Rows are ordered by triage priority and score.
- `/api/alerts` returns recent alerts.
- `/api/health` reports DB and worker status.
- API error shape is consistent.

---

## Milestone 11 — Frontend Ranked Table

## Goal

Render the rough internal console.

## Tasks

- Build main page.
- Fetch `/api/launches`.
- Render ranked table.
- Add health banner from `/api/health`.
- Render alert flags.
- Add compact address display.
- Add external links.
- Add formatting helpers.
- Add basic empty/loading/error states.

## Acceptance criteria

- Main table is readable.
- Every row shows:
  - label
  - score
  - token identity
  - liquidity
  - volume
  - risk summary
  - liquidity summary
  - deployer summary
  - confidence
  - reason
  - links
  - updated timestamp
- User can triage without opening a detail page.
- Missing/stale data is visibly different from zero values.
- UI does not call provider APIs directly.

## Cut rule

Do not spend significant time on visual polish. Use plain table styling until the ranking loop is useful.

---

## Milestone 12 — Local Validation Pass

## Goal

Compare the console against the manual baseline.

## Tasks

- Run the worker for multiple polling cycles.
- Review top-ranked rows.
- Compare against DEX Screener new Base pairs sorted by volume.
- Record:
  - bad `High Priority` rows
  - obvious scams that were not `Risky`
  - thin-liquidity tokens that ranked too high
  - missing-risk cases
  - wrong canonical pool cases
  - confusing reason strings
- Adjust hard gates only if failures are obvious.
- Do not overfit weights after a tiny sample.

## Acceptance criteria

- The console can produce a meaningful ranked feed.
- Obvious high-risk launches are captured.
- Reason strings are understandable.
- The table is at least plausibly more useful than raw volume sorting.
- Main remaining issues are documented.

---

# Suggested Two-Week Schedule

## Week 1 — Data foundation and scoring

| Day | Focus                                | Output                                       |
| --: | ------------------------------------ | -------------------------------------------- |
|   1 | Bootstrap repo, Docker, Drizzle      | Local app skeleton and DB connection         |
|   2 | Schema and migrations                | Tables, enums, indexes                       |
|   3 | DEX Screener client and samples      | Candidate + market sample payloads           |
|   4 | Raw observations and normalization   | Tokens, pools, market snapshots              |
|   5 | Worker loop and worker_runs          | Repeatable 3-minute ingestion                |
|   6 | GoPlus risk enrichment               | Risk checks and raw payloads                 |
|   7 | Deployer enrichment + canonical pool | Shallow deployer history and pool confidence |

## Week 2 — Product loop and validation

| Day | Focus                           | Output                                    |
| --: | ------------------------------- | ----------------------------------------- |
|   8 | Scoring engine                  | Scores, labels, reason strings            |
|   9 | Alerts                          | High-score and high-risk alert rows       |
|  10 | API endpoints                   | Launches, alerts, health                  |
|  11 | Ranked table UI                 | Rough usable dashboard                    |
|  12 | End-to-end hardening            | Error states, staleness, logs             |
|  13 | Validation against DEX Screener | Notes and threshold fixes                 |
|  14 | Cleanup and MVP review          | README, known issues, next-stage decision |

This schedule assumes focused work. If time is constrained, cut polish and optional integrations first.

---

# Task Breakdown

## Backend / Worker

| Task                            | Priority | Notes                                       |
| ------------------------------- | -------: | ------------------------------------------- |
| Postgres + Drizzle schema       |       P0 | Required                                    |
| Source observation storage      |       P0 | Required for debugging                      |
| DEX Screener discovery          |       P0 | Required                                    |
| DEX Screener market enrichment  |       P0 | Required                                    |
| GoPlus risk enrichment          |       P0 | Required if accessible                      |
| Deployer resolution from GoPlus |       P0 | Good enough fallback                        |
| Basescan deployer enrichment    |       P1 | Use if key available                        |
| GeckoTerminal cross-check       |       P1 | Optional for ambiguous/high-interest tokens |
| Base RPC fallback               |       P2 | Only if needed                              |
| Canonical pool selection        |       P0 | Required                                    |
| Scoring engine                  |       P0 | Required                                    |
| Alert evaluator                 |       P0 | Required                                    |
| Worker health logging           |       P0 | Required                                    |

## API

| Task                  | Priority | Notes    |
| --------------------- | -------: | -------- |
| `GET /api/launches`   |       P0 | Required |
| `GET /api/alerts`     |       P0 | Required |
| `GET /api/health`     |       P0 | Required |
| Filter by label       |       P2 | Optional |
| Acknowledge alerts    |       P2 | Deferred |
| Token detail endpoint |       P3 | Deferred |

## Frontend

| Task                         | Priority | Notes    |
| ---------------------------- | -------: | -------- |
| Ranked table                 |       P0 | Required |
| Reason string display        |       P0 | Required |
| Component summaries          |       P0 | Required |
| Confidence/staleness display |       P0 | Required |
| External links               |       P1 | Useful   |
| Alert flags                  |       P1 | Useful   |
| Sorting/filtering UI         |       P2 | Optional |
| Detail page                  |       P3 | Deferred |
| Charts                       |       P3 | Deferred |

---

# Scope Cut Rules

If the project runs long, cut in this order:

1. UI polish.
2. Advanced filtering and sorting.
3. GeckoTerminal cross-check.
4. Basescan enrichment.
5. Base RPC fallback.
6. Alert UI beyond simple flags.
7. Advanced deployer-history depth.
8. Advanced canonical pool logic.
9. Any detail page.
10. Any social integration.

Do not cut:

```text
ranked launch feed
contract-risk score
liquidity-quality score
deployer-history score
triage label
reason strings
source observations
basic worker loop
Postgres persistence
```

---

# Risk Register

| Risk                                                   | Impact                 | Mitigation                                                |
| ------------------------------------------------------ | ---------------------- | --------------------------------------------------------- |
| DEX Screener candidate source is delayed or incomplete | Feed misses launches   | Accept for v0 or add bounded RPC factory polling later    |
| GoPlus fields are missing or unreliable                | False confidence       | Treat missing risk as low confidence; block High Priority |
| Basescan API unavailable                               | Weak deployer history  | Use GoPlus creator field + internal history               |
| Canonical pool selection wrong                         | Bad liquidity scores   | Start conservative; expose confidence and reason          |
| Raw volume dominates ranking                           | Recreates DEX Screener | Keep volume as secondary liquidity sanity signal          |
| Alerts are noisy                                       | User ignores them      | Only high-score and severe-risk alerts                    |
| UI takes too much time                                 | MVP slips              | Use plain table, no detail page                           |
| Scope drifts into social/execution                     | Product loses focus    | Enforce non-goals and cut rules                           |
| Provider rate limits break polling                     | Worker failures        | Cap candidate count, cache, mark partial failures         |

---

# Testing Plan

## Unit tests

Required:

```text
scoreContractRisk
scoreLiquidityQuality
scoreDeployerHistory
assignTriageLabel
computeConfidence
canonical pool selection
address normalization
money formatting
```

## Integration tests

Recommended:

```text
DEX Screener sample → token/pool/market rows
GoPlus sample → risk_check row
Token + market + risk + deployer → token_score row
Score → alert evaluator
Feed query → LaunchFeedRow
```

## Manual smoke tests

Run locally:

```text
1. Start Postgres.
2. Run migrations.
3. Start worker.
4. Wait for 2–3 polling cycles.
5. Open web app.
6. Confirm table rows are visible.
7. Confirm reason strings are understandable.
8. Confirm latest worker run appears in health endpoint.
9. Confirm source observations exist for provider responses.
10. Confirm no duplicate token identity rows are created after repeated runs.
```

---

# Operational Commands

Suggested scripts:

```json
{
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:worker": "pnpm --filter worker dev",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test"
  }
}
```

Suggested local run sequence:

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm dev:worker
pnpm dev:web
```

---

# Validation Notes Template

Use this after monitoring sessions.

```md
# Validation Session

Date:
Duration:
Worker runs observed:
Approx token rows reviewed:

## Did I open the console before DEX Screener?

Yes/No:

## Top-ranked rows

| Token | Label | Score | Did label make sense? | Notes |
| ----- | ----- | ----: | --------------------- | ----- |

## False positives

Tokens ranked too high:

## False negatives

Tokens that should have ranked higher:

## Risk failures

Obvious risky launches not labeled Risky:

## Liquidity failures

Wrong canonical pool or misleading liquidity:

## Reason-string issues

Confusing or missing explanations:

## Changes to consider

Hard gates:
Thresholds:
Weights:
Provider handling:
UI:
```

---

# Post-MVP Decision Gate

After the MVP runs over a meaningful sample, answer:

1. Is the console becoming the first screen before DEX Screener?
2. Are `Research Deeper` and `High Priority` rows better than volume sorting?
3. Are obvious scams and unsafe tokens reliably downgraded?
4. Are reason strings clear enough to trust or challenge?
5. Is deployer history adding useful differentiation?
6. Is canonical pool confidence preventing bad liquidity interpretation?
7. Is the next best improvement social attention, better deployer history, better liquidity modeling, or UI workflow?

## Move forward if

```text
The ranked feed is clearly more useful than raw DEX Screener volume sorting for first-pass triage.
```

## Narrow or stop if

```text
The console does not improve triage enough to become the preferred starting surface.
```

---

# Likely v0.5 Priorities

If v0 works, likely next improvements are:

1. Better canonical pool confidence with GeckoTerminal cross-check.
2. Stronger deployer-history reconstruction.
3. Paid boost / promotion awareness.
4. Basic holder concentration.
5. Known deployer alerts.
6. Liquidity deterioration/improvement alerts.
7. Farcaster/Base-native attention signal.
8. Expandable row or detail drawer.

Do not add social or wallet graph features until the core ranking loop is working.
