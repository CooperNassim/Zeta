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
    console.log('=== 修复触发器 ===\n');

    // 1. 强制删除函数 (CASCADE)
    console.log('1. 强制删除函数 (CASCADE)...');
    await client.query('DROP FUNCTION IF EXISTS sync_transactions_from_trade_orders() CASCADE');
    console.log('   ✅ 函数已删除\n');

    // 2. 验证
    console.log('2. 验证修复...');
    const funcResult = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_name = 'sync_transactions_from_trade_orders'
    `);
    console.log('   sync_transactions_from_trade_orders 函数:', funcResult.rows.length === 0 ? '无 ✅' : '仍存在 ❌');

    console.log('\n✅ 修复完成！错误的触发器和函数已被删除');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();