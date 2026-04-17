require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== 检查所有交易记录 ===\n');

    // 1. 查找所有股票交易记录
    console.log('1. 所有股票交易记录:');
    const result = await client.query(`
      SELECT id, transaction_type, symbol, name, amount, trade_number, created_at, deleted
      FROM transactions
      WHERE transaction_type IN ('买入', '卖出')
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`找到 ${result.rows.length} 条股票交易记录:`);
    console.table(result.rows);

    // 2. 查找未删除的股票交易记录
    console.log('\n2. 未删除的股票交易记录:');
    const activeResult = await client.query(`
      SELECT id, transaction_type, symbol, name, amount, trade_number, created_at
      FROM transactions
      WHERE transaction_type IN ('买入', '卖出')
      AND deleted = false
      ORDER BY created_at DESC
    `);
    
    console.log(`找到 ${activeResult.rows.length} 条未删除的股票交易记录:`);
    console.table(activeResult.rows);

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();