require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function main() {
  try {
    // 模拟同步接口查询
    const tables = ['trade_orders', 'trade_records', 'transactions'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT * FROM ${table} WHERE deleted = false ORDER BY id`);
      console.log(`\n=== ${table} (${result.rows.length} 条未删除记录) ===`);
      if (result.rows.length > 0) {
        console.log('第一条记录:', JSON.stringify(result.rows[0], null, 2));
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

main();
