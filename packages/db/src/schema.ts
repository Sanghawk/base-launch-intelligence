import {
  bigint,
  boolean,
  integer,
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
    unique('tokens_chain_id_address_key').on(table.chainId, table.address)
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
    unique('pools_chain_id_address_key').on(table.chainId, table.address)
  ]
);

export type Deployer = typeof deployers.$inferSelect;
export type NewDeployer = typeof deployers.$inferInsert;
export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
export type Pool = typeof pools.$inferSelect;
export type NewPool = typeof pools.$inferInsert;
