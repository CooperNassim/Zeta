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
    console.log('=== 检查交易记录表结构 ===\n');

    // 1. 检查表结构
    console.log('1. 表结构:');
    const tableResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `);
    console.table(tableResult.rows);

    // 2. 查找没有交易编号的记录
    console.log('\n2. 查找没有交易编号的记录:');
    const result = await client.query(`
      SELECT id, transaction_type, symbol, name, amount, trade_number, created_at, deleted
      FROM transactions
      WHERE (trade_number IS NULL OR trade_number = '')
      AND (transaction_type = '买入' OR transaction_type = '卖出')
      ORDER BY created_at DESC
    `);
    
    console.log(`找到 ${result.rows.length} 条没有交易编号的股票交易记录:`);
    console.table(result.rows);

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();