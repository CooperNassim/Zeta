require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

(async () => {
  try {
    // 检查触发器函数源码
    const funcResult = await pool.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'sync_trade_order_to_records'
    `);
    
    if (funcResult.rows.length > 0) {
      console.log('=== 触发器函数源码 ===\n');
      console.log(funcResult.rows[0].prosrc);
    } else {
      console.log('❌ 没有找到触发器函数');
    }

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
    process.exit(1);
  }
})();
