const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

(async () => {
  try {
    // Check for channel fields
    const check = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='trade_records' 
      AND column_name IN ('upper_band', 'lower_band', 'channel_upper', 'channel_lower', 'upper_band_price', 'lower_band_price')
    `);
    console.log('通道相关字段:', check.rows.map(r => r.column_name).join(', ') || '无');
    
    // Add missing fields if needed
    const addUpper = await pool.query(`
      ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS upper_band NUMERIC(15, 2);
    `);
    const addLower = await pool.query(`
      ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS lower_band NUMERIC(15, 2);
    `);
    console.log('已添加 upper_band 和 lower_band 字段');
    
    await pool.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
