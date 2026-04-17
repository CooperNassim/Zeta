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
    console.log('=== 检查交易记录数据库数据 ===\n');

    // 1. 查找所有交易记录
    console.log('1. 所有交易记录:');
    const result = await client.query(`
      SELECT id, transaction_type, symbol, name, amount, trade_number, created_at, deleted
      FROM transactions
      ORDER BY created_at DESC
    `);
    
    console.log(`找到 ${result.rows.length} 条交易记录:`);
    console.table(result.rows);

    // 2. 查找未删除的交易记录
    console.log('\n2. 未删除的交易记录:');
    const activeResult = await client.query(`
      SELECT id, transaction_type, symbol, name, amount, trade_number, created_at
      FROM transactions
      WHERE deleted = false
      ORDER BY created_at DESC
    `);
    
    console.log(`找到 ${activeResult.rows.length} 条未删除的交易记录:`);
    console.table(activeResult.rows);

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();