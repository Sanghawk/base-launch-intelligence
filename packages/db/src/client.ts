import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';

if ('window' in globalThis) {
  throw new Error(
    '@base-launch-intelligence/db client is server-only and must not be imported from browser or client-component code'
  );
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to initialize the database client');
}

export const pool = new Pool({
  connectionString
});

export const db = drizzle({
  client: pool,
  schema
});
