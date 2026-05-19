import { config } from 'dotenv';

config({ path: '.env' });

const { pool } = await import('../packages/db/src/client.js');

try {
  const result = await pool.query<{
    database: string;
    schema_name: string;
    ok: number;
  }>(
    'select current_database() as database, current_schema() as schema_name, 1 as ok'
  );

  console.log(result.rows[0]);
} finally {
  await pool.end();
}
