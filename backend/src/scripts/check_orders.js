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
    const result = await pool.query("SELECT COUNT(*) as count FROM orders WHERE deleted = false");
    console.log('未删除的订单数量:', result.rows[0].count);
    
    const deletedResult = await pool.query("SELECT COUNT(*) as count FROM orders WHERE deleted = true");
    console.log('已删除的订单数量:', deletedResult.rows[0].count);
    
    const totalResult = await pool.query("SELECT COUNT(*) as count FROM orders");
    console.log('订单总数:', totalResult.rows[0].count);
    
    if (parseInt(result.rows[0].count) > 0) {
      const sample = await pool.query("SELECT id, trade_number, stock_code, stock_name, price, quantity, created_at FROM orders WHERE deleted = false LIMIT 5");
      console.log('样本数据:', sample.rows);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

main();
