// db.js — pool de conexão com o PostgreSQL (local via Docker ou Supabase na nuvem).
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL não definida. Copie .env.example para .env e configure.');
}

// Supabase exige SSL. Local (Docker) não usa. Detecta pela URL/flag.
const precisaSSL =
  process.env.PGSSL === 'true' ||
  (connectionString && /supabase\.(co|com)|sslmode=require/.test(connectionString));

export const pool = new Pool({
  connectionString,
  ssl: precisaSSL ? { rejectUnauthorized: false } : false,
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
