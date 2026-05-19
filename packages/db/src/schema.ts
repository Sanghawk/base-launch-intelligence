import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core';

export const confidenceLevel = pgEnum('confidence_level', [
  'low',
  'medium',
  'high'
]);

export const riskLevel = pgEnum('risk_level', [
  'unknown',
  'low',
  'medium',
  'high',
  'critical'
]);

export const triageLabel = pgEnum('triage_label', [
  'Ignore',
  'Risky',
  'Watch',
  'Research Deeper',
  'High Priority'
]);

export const alertType = pgEnum('alert_type', [
  'new_high_score_launch',
  'obvious_high_risk_launch'
]);

export const alertSeverity = pgEnum('alert_severity', [
  'low',
  'medium',
  'high',
  'critical'
]);

export const workerRunStatus = pgEnum('worker_run_status', [
  'running',
  'success',
  'partial_failure',
  'failure'
]);

export type ConfidenceLevel = (typeof confidenceLevel.enumValues)[number];
export type RiskLevel = (typeof riskLevel.enumValues)[number];
export type TriageLabel = (typeof triageLabel.enumValues)[number];
export type AlertType = (typeof alertType.enumValues)[number];
export type AlertSeverity = (typeof alertSeverity.enumValues)[number];
export type WorkerRunStatus = (typeof workerRunStatus.enumValues)[number];

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
};

export const deployers = pgTable(
  'deployers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chainId: integer('chain_id').notNull(),
    address: text('address').notNull(),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
    knownLabel: text('known_label'),
    source: text('source').notNull(),
    ...timestamps
  },
  (table) => [
    unique('deployers_chain_id_address_key').on(table.chainId, table.address)
  ]
);

export const tokens = pgTable(
  'tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chainId: integer('chain_id').notNull(),
    address: text('address').notNull(),
    name: text('name'),
    symbol: text('symbol'),
    decimals: integer('decimals'),
    totalSupplyRaw: numeric('total_supply_raw', { precision: 78, scale: 0 }),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
    firstSeenSource: text('first_seen_source').notNull(),
    deployerId: uuid('deployer_id').references(() => deployers.id),
    deployerAddress: text('deployer_address'),
    creationTxHash: text('creation_tx_hash'),
    createdAtBlock: bigint('created_at_block', { mode: 'bigint' }),
    createdAtTimestamp: timestamp('created_at_timestamp', {
      withTimezone: true
    }),
    isVerified: boolean('is_verified'),
    isProxy: boolean('is_proxy'),
    metadataConfidence: confidenceLevel('metadata_confidence')
      .notNull()
      .default('low'),
    ...timestamps
  },
  (table) => [
    unique('tokens_chain_id_address_key').on(table.chainId, table.address),
    index('tokens_first_seen_at_idx').on(table.firstSeenAt.desc()),
    index('tokens_deployer_id_idx').on(table.deployerId)
  ]
);

export const pools = pgTable(
  'pools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chainId: integer('chain_id').notNull(),
    address: text('address').notNull(),
    dexId: text('dex_id'),
    baseTokenId: uuid('base_token_id')
      .notNull()
      .references(() => tokens.id),
    baseTokenAddress: text('base_token_address').notNull(),
    quoteTokenAddress: text('quote_token_address'),
    quoteTokenSymbol: text('quote_token_symbol'),
    quoteTokenName: text('quote_token_name'),
    pairCreatedAt: timestamp('pair_created_at', { withTimezone: true }),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull(),
    source: text('source').notNull(),
    isCanonicalCandidate: boolean('is_canonical_candidate')
      .notNull()
      .default(false),
    canonicalConfidence: confidenceLevel('canonical_confidence')
      .notNull()
      .default('low'),
    canonicalReason: text('canonical_reason'),
    ...timestamps
  },
  (table) => [
    unique('pools_chain_id_address_key').on(table.chainId, table.address),
    index('pools_base_token_id_idx').on(table.baseTokenId)
  ]
);

export const sourceObservations = pgTable(
  'source_observations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: text('source').notNull(),
    entityType: text('entity_type').notNull(),
    entityKey: text('entity_key').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    requestUrl: text('request_url'),
    requestParamsHash: text('request_params_hash'),
    responseStatus: integer('response_status'),
    durationMs: integer('duration_ms'),
    rawJson: jsonb('raw_json'),
    error: text('error'),
    errorType: text('error_type'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('source_observations_entity_fetched_idx').on(
      table.source,
      table.entityType,
      table.entityKey,
      table.fetchedAt.desc()
    )
  ]
);

export const marketSnapshots = pgTable(
  'market_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenId: uuid('token_id')
      .notNull()
      .references(() => tokens.id),
    poolId: uuid('pool_id').references(() => pools.id),
    source: text('source').notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    priceUsd: numeric('price_usd', { precision: 38, scale: 18 }),
    liquidityUsd: numeric('liquidity_usd', { precision: 38, scale: 8 }),
    fdvUsd: numeric('fdv_usd', { precision: 38, scale: 8 }),
    marketCapUsd: numeric('market_cap_usd', { precision: 38, scale: 8 }),
    volume5mUsd: numeric('volume_5m_usd', { precision: 38, scale: 8 }),
    volume1hUsd: numeric('volume_1h_usd', { precision: 38, scale: 8 }),
    volume6hUsd: numeric('volume_6h_usd', { precision: 38, scale: 8 }),
    volume24hUsd: numeric('volume_24h_usd', { precision: 38, scale: 8 }),
    txns5mBuys: integer('txns_5m_buys'),
    txns5mSells: integer('txns_5m_sells'),
    txns1hBuys: integer('txns_1h_buys'),
    txns1hSells: integer('txns_1h_sells'),
    buyers5m: integer('buyers_5m'),
    sellers5m: integer('sellers_5m'),
    rawPayloadId: uuid('raw_payload_id').references(
      () => sourceObservations.id
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('market_snapshots_token_observed_at_idx').on(
      table.tokenId,
      table.observedAt.desc()
    ),
    index('market_snapshots_pool_observed_at_idx').on(
      table.poolId,
      table.observedAt.desc()
    )
  ]
);

export const riskChecks = pgTable(
  'risk_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenId: uuid('token_id')
      .notNull()
      .references(() => tokens.id),
    source: text('source').notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    isHoneypot: boolean('is_honeypot'),
    buyTax: numeric('buy_tax', { precision: 10, scale: 4 }),
    sellTax: numeric('sell_tax', { precision: 10, scale: 4 }),
    isTaxModifiable: boolean('is_tax_modifiable'),
    hasBlacklist: boolean('has_blacklist'),
    hasWhitelist: boolean('has_whitelist'),
    canMint: boolean('can_mint'),
    ownerAddress: text('owner_address'),
    ownershipRenounced: boolean('ownership_renounced'),
    isProxy: boolean('is_proxy'),
    isVerified: boolean('is_verified'),
    topHolderPct: numeric('top_holder_pct', { precision: 10, scale: 4 }),
    top10HolderPct: numeric('top10_holder_pct', { precision: 10, scale: 4 }),
    lpLockedOrBurned: boolean('lp_locked_or_burned'),
    scannerScore: numeric('scanner_score', { precision: 10, scale: 4 }),
    riskLevel: riskLevel('risk_level').notNull().default('unknown'),
    riskSummary: text('risk_summary'),
    rawPayloadId: uuid('raw_payload_id').references(
      () => sourceObservations.id
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('risk_checks_token_observed_at_idx').on(
      table.tokenId,
      table.observedAt.desc()
    )
  ]
);

export const deployerHistorySnapshots = pgTable(
  'deployer_history_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deployerId: uuid('deployer_id')
      .notNull()
      .references(() => deployers.id),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    priorContractCount: integer('prior_contract_count'),
    priorTokenCount: integer('prior_token_count'),
    priorLaunchCount: integer('prior_launch_count'),
    internalPriorSeenTokenCount: integer(
      'internal_prior_seen_token_count'
    ).notNull(),
    verifiedContractCount: integer('verified_contract_count'),
    suspiciousPriorLaunchCount: integer('suspicious_prior_launch_count'),
    repeatedTemplateConfidence: confidenceLevel('repeated_template_confidence'),
    historyConfidence: confidenceLevel('history_confidence').notNull(),
    summary: text('summary'),
    rawPayloadId: uuid('raw_payload_id').references(
      () => sourceObservations.id
    ),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('deployer_history_snapshots_deployer_observed_at_idx').on(
      table.deployerId,
      table.observedAt.desc()
    )
  ]
);

export const tokenScores = pgTable(
  'token_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenId: uuid('token_id')
      .notNull()
      .references(() => tokens.id),
    canonicalPoolId: uuid('canonical_pool_id').references(() => pools.id),
    marketSnapshotId: uuid('market_snapshot_id').references(
      () => marketSnapshots.id
    ),
    riskCheckId: uuid('risk_check_id').references(() => riskChecks.id),
    deployerHistorySnapshotId: uuid('deployer_history_snapshot_id').references(
      () => deployerHistorySnapshots.id
    ),
    scoredAt: timestamp('scored_at', { withTimezone: true }).notNull(),
    contractRiskScore: numeric('contract_risk_score', {
      precision: 6,
      scale: 2
    }).notNull(),
    liquidityQualityScore: numeric('liquidity_quality_score', {
      precision: 6,
      scale: 2
    }).notNull(),
    deployerHistoryScore: numeric('deployer_history_score', {
      precision: 6,
      scale: 2
    }).notNull(),
    overallScore: numeric('overall_score', {
      precision: 6,
      scale: 2
    }).notNull(),
    triageLabel: triageLabel('triage_label').notNull(),
    confidence: confidenceLevel('confidence').notNull(),
    reasonSummary: text('reason_summary').notNull(),
    reasonDetails: jsonb('reason_details').notNull(),
    criticalFlags: jsonb('critical_flags').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('token_scores_token_scored_at_idx').on(
      table.tokenId,
      table.scoredAt.desc()
    ),
    index('token_scores_scored_at_idx').on(table.scoredAt.desc())
  ]
);

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenId: uuid('token_id')
      .notNull()
      .references(() => tokens.id),
    tokenScoreId: uuid('token_score_id').references(() => tokenScores.id),
    alertType: alertType('alert_type').notNull(),
    severity: alertSeverity('severity').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    scoreAtAlert: numeric('score_at_alert', { precision: 6, scale: 2 }),
    reasonDetails: jsonb('reason_details').notNull(),
    dedupeKey: text('dedupe_key').notNull().unique(),
    stateHash: text('state_hash'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true })
  },
  (table) => [
    index('alerts_created_at_idx').on(table.createdAt.desc()),
    index('alerts_token_created_at_idx').on(
      table.tokenId,
      table.createdAt.desc()
    )
  ]
);

export const workerRuns = pgTable(
  'worker_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    status: workerRunStatus('status').notNull(),
    candidatesFetched: integer('candidates_fetched').notNull().default(0),
    tokensInserted: integer('tokens_inserted').notNull().default(0),
    tokensUpdated: integer('tokens_updated').notNull().default(0),
    poolsInserted: integer('pools_inserted').notNull().default(0),
    poolsUpdated: integer('pools_updated').notNull().default(0),
    marketSnapshotsInserted: integer('market_snapshots_inserted')
      .notNull()
      .default(0),
    riskChecksInserted: integer('risk_checks_inserted').notNull().default(0),
    deployerSnapshotsInserted: integer('deployer_snapshots_inserted')
      .notNull()
      .default(0),
    scoresComputed: integer('scores_computed').notNull().default(0),
    alertsCreated: integer('alerts_created').notNull().default(0),
    providerErrorCount: integer('provider_error_count').notNull().default(0),
    errorSummary: text('error_summary'),
    errorDetails: jsonb('error_details'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index('worker_runs_started_at_idx').on(table.startedAt.desc()),
    index('worker_runs_status_started_at_idx').on(
      table.status,
      table.startedAt.desc()
    )
  ]
);

export type Deployer = typeof deployers.$inferSelect;
export type NewDeployer = typeof deployers.$inferInsert;
export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
export type Pool = typeof pools.$inferSelect;
export type NewPool = typeof pools.$inferInsert;
export type SourceObservation = typeof sourceObservations.$inferSelect;
export type NewSourceObservation = typeof sourceObservations.$inferInsert;
export type MarketSnapshot = typeof marketSnapshots.$inferSelect;
export type NewMarketSnapshot = typeof marketSnapshots.$inferInsert;
export type RiskCheck = typeof riskChecks.$inferSelect;
export type NewRiskCheck = typeof riskChecks.$inferInsert;
export type DeployerHistorySnapshot =
  typeof deployerHistorySnapshots.$inferSelect;
export type NewDeployerHistorySnapshot =
  typeof deployerHistorySnapshots.$inferInsert;
export type TokenScore = typeof tokenScores.$inferSelect;
export type NewTokenScore = typeof tokenScores.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type WorkerRun = typeof workerRuns.$inferSelect;
export type NewWorkerRun = typeof workerRuns.$inferInsert;
