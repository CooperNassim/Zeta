const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function runMigration() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        market VARCHAR(20) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        api_url TEXT,
        api_key TEXT,
        api_secret TEXT,
        rate_limit INTEGER NOT NULL DEFAULT 60,
        max_retries INTEGER NOT NULL DEFAULT 3,
        timeout INTEGER NOT NULL DEFAULT 10,
        is_default BOOLEAN NOT NULL DEFAULT false,
        status VARCHAR(20) NOT NULL DEFAULT 'enabled',
        notes TEXT,
        last_tested_at TIMESTAMPTZ,
        last_test_status VARCHAR(20),
        last_test_latency INTEGER,
        deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table data_sources created/already exists');

    await pool.query(`CREATE INDEX IF NOT EXISTS data_sources_market_idx ON data_sources (market)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS data_sources_provider_idx ON data_sources (provider)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS data_sources_status_idx ON data_sources (status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS data_sources_is_default_idx ON data_sources (is_default)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS data_sources_created_at_idx ON data_sources (created_at DESC)`);
    console.log('Indexes created');

    try {
      await pool.query(`CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
      console.log('Trigger created');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Trigger already exists');
      } else {
        console.log('Trigger warning:', e.message);
      }
    }

    console.log('data_sources migration completed!');
  } catch (e) {
    console.error('Migration failed:', e.message);
  } finally {
    await pool.end();
  }
}

runMigration();
