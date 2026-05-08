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
      CREATE TABLE IF NOT EXISTS data_sync_history (
        id SERIAL PRIMARY KEY,
        market VARCHAR(20) NOT NULL,
        data_source_id INTEGER NOT NULL,
        sync_type VARCHAR(30) NOT NULL DEFAULT 'full',
        total_count INTEGER NOT NULL DEFAULT 0,
        new_count INTEGER NOT NULL DEFAULT 0,
        updated_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'running',
        error_message TEXT,
        started_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_data_source FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE SET NULL
      )
    `);
    console.log('Table data_sync_history created/already exists');

    await pool.query(`CREATE INDEX IF NOT EXISTS data_sync_history_market_idx ON data_sync_history (market)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS data_sync_history_status_idx ON data_sync_history (status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS data_sync_history_started_at_idx ON data_sync_history (started_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS data_sync_history_data_source_id_idx ON data_sync_history (data_source_id)`);
    console.log('Indexes created');

    try {
      await pool.query(`CREATE TRIGGER update_data_sync_history_updated_at BEFORE UPDATE ON data_sync_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
      console.log('Trigger created');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Trigger already exists');
      } else {
        console.log('Trigger warning:', e.message);
      }
    }

    console.log('Migration completed successfully!');
  } catch (e) {
    console.error('Migration failed:', e.message);
  } finally {
    await pool.end();
  }
}

runMigration();
