import { config } from 'dotenv';

config({ path: '.env' });

import { and, eq } from 'drizzle-orm';
import {
  deployers,
  marketSnapshots,
  pools,
  sourceObservations,
  tokens
} from '../packages/db/src/schema.js';

const { db, pool } = await import('../packages/db/src/client.js');

function requireRow<T>(row: T | undefined, label: string): T {
  if (row === undefined) throw new Error(`no row returned for ${label}`);
  return row;
}

const CHAIN_ID = 8453;
// Mixed-case addresses simulate provider input; lowercased before every insert
const DEPLOYER_ADDR =
  '0xDEAD000000000000000000000000000000000001'.toLowerCase();
const TOKEN_ADDR = '0xDEAD000000000000000000000000000000000002'.toLowerCase();
const POOL_ADDR = '0xDEAD000000000000000000000000000000000003'.toLowerCase();
const now = new Date();

try {
  console.log('smoke-test-db: starting\n');

  // --- Canonical identity rows (upsert — safe to re-run) ---

  const deployer = requireRow(
    (
      await db
        .insert(deployers)
        .values({
          chainId: CHAIN_ID,
          address: DEPLOYER_ADDR,
          firstSeenAt: now,
          lastSeenAt: now,
          source: 'smoke-test'
        })
        .onConflictDoUpdate({
          target: [deployers.chainId, deployers.address],
          set: { lastSeenAt: now, updatedAt: now }
        })
        .returning({ id: deployers.id })
    )[0],
    'deployer'
  );
  console.log('deployer.id:', deployer.id);

  const token = requireRow(
    (
      await db
        .insert(tokens)
        .values({
          chainId: CHAIN_ID,
          address: TOKEN_ADDR,
          name: 'Smoke Test Token',
          symbol: 'SMOKE',
          decimals: 18,
          firstSeenAt: now,
          firstSeenSource: 'smoke-test',
          deployerId: deployer.id,
          deployerAddress: DEPLOYER_ADDR
        })
        .onConflictDoUpdate({
          target: [tokens.chainId, tokens.address],
          set: { updatedAt: now }
        })
        .returning({ id: tokens.id })
    )[0],
    'token'
  );
  console.log('token.id:', token.id);

  const poolRow = requireRow(
    (
      await db
        .insert(pools)
        .values({
          chainId: CHAIN_ID,
          address: POOL_ADDR,
          dexId: 'uniswap-v3',
          baseTokenId: token.id,
          baseTokenAddress: TOKEN_ADDR,
          quoteTokenAddress: '0x4200000000000000000000000000000000000006',
          quoteTokenSymbol: 'WETH',
          firstSeenAt: now,
          source: 'smoke-test'
        })
        .onConflictDoUpdate({
          target: [pools.chainId, pools.address],
          set: { updatedAt: now }
        })
        .returning({ id: pools.id })
    )[0],
    'pool'
  );
  console.log('pool.id:', poolRow.id);

  // --- Append-only snapshot rows (no unique constraint — always insert) ---

  const obs = requireRow(
    (
      await db
        .insert(sourceObservations)
        .values({
          source: 'smoke-test',
          entityType: 'token',
          entityKey: `${CHAIN_ID}:${TOKEN_ADDR}`,
          fetchedAt: now,
          responseStatus: 200,
          durationMs: 1,
          rawJson: { smoke: true }
        })
        .returning({ id: sourceObservations.id })
    )[0],
    'sourceObservation'
  );
  console.log('sourceObservation.id:', obs.id);

  const snap1 = requireRow(
    (
      await db
        .insert(marketSnapshots)
        .values({
          tokenId: token.id,
          poolId: poolRow.id,
          source: 'smoke-test',
          observedAt: now,
          priceUsd: '0.001234',
          liquidityUsd: '5000.00',
          volume24hUsd: '12345.67'
        })
        .returning({ id: marketSnapshots.id })
    )[0],
    'marketSnapshot'
  );
  console.log('marketSnapshot.id:', snap1.id);

  // --- Idempotency: re-insert canonical rows and confirm same IDs returned ---

  console.log('\nidempotency checks:');

  const deployer2 = requireRow(
    (
      await db
        .insert(deployers)
        .values({
          chainId: CHAIN_ID,
          address: DEPLOYER_ADDR,
          firstSeenAt: now,
          lastSeenAt: now,
          source: 'smoke-test'
        })
        .onConflictDoUpdate({
          target: [deployers.chainId, deployers.address],
          set: { lastSeenAt: now, updatedAt: now }
        })
        .returning({ id: deployers.id })
    )[0],
    'deployer (re-insert)'
  );

  const token2 = requireRow(
    (
      await db
        .insert(tokens)
        .values({
          chainId: CHAIN_ID,
          address: TOKEN_ADDR,
          firstSeenAt: now,
          firstSeenSource: 'smoke-test'
        })
        .onConflictDoUpdate({
          target: [tokens.chainId, tokens.address],
          set: { updatedAt: now }
        })
        .returning({ id: tokens.id })
    )[0],
    'token (re-insert)'
  );

  const poolRow2 = requireRow(
    (
      await db
        .insert(pools)
        .values({
          chainId: CHAIN_ID,
          address: POOL_ADDR,
          baseTokenId: token.id,
          baseTokenAddress: TOKEN_ADDR,
          firstSeenAt: now,
          source: 'smoke-test'
        })
        .onConflictDoUpdate({
          target: [pools.chainId, pools.address],
          set: { updatedAt: now }
        })
        .returning({ id: pools.id })
    )[0],
    'pool (re-insert)'
  );

  if (deployer.id !== deployer2.id)
    throw new Error('deployer id changed on re-insert');
  if (token.id !== token2.id) throw new Error('token id changed on re-insert');
  if (poolRow.id !== poolRow2.id)
    throw new Error('pool id changed on re-insert');
  console.log('  canonical rows: same id on re-insert ✓');

  // --- Snapshot append: confirm a new row is created each time ---

  const snap2 = requireRow(
    (
      await db
        .insert(marketSnapshots)
        .values({
          tokenId: token.id,
          source: 'smoke-test',
          observedAt: new Date(),
          liquidityUsd: '5100.00'
        })
        .returning({ id: marketSnapshots.id })
    )[0],
    'marketSnapshot (append)'
  );

  if (snap1.id === snap2.id)
    throw new Error('snapshot not appended: same id returned');
  console.log('  snapshot rows: new row on each insert ✓');

  // --- Select back ---

  console.log('\nselect:');

  const tokenRows = await db
    .select({ id: tokens.id, symbol: tokens.symbol, address: tokens.address })
    .from(tokens)
    .where(and(eq(tokens.chainId, CHAIN_ID), eq(tokens.address, TOKEN_ADDR)));
  console.log('  token:', tokenRows[0]);

  const snapshotRows = await db
    .select({ id: marketSnapshots.id })
    .from(marketSnapshots)
    .where(eq(marketSnapshots.tokenId, token.id));
  console.log(`  marketSnapshots: ${snapshotRows.length} row(s) (expect >=2)`);

  if (snapshotRows.length < 2)
    throw new Error('expected at least 2 snapshot rows');

  console.log('\nsmoke-test-db: all checks passed ✓');
} finally {
  await pool.end();
}
