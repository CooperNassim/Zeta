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
    console.log('=== 将交易记录标记为软删除 ===\n');

    // 1. 查找所有股票交易记录
    console.log('1. 查找所有股票交易记录:');
    const result = await client.query(`
      SELECT id, transaction_type, symbol, name, amount, trade_number, created_at, deleted
      FROM transactions
      WHERE transaction_type IN ('买入', '卖出')
      ORDER BY created_at DESC
    `);
    
    console.log(`找到 ${result.rows.length} 条股票交易记录:`);
    console.table(result.rows);

    if (result.rows.length > 0) {
      // 2. 标记为软删除
      console.log('\n2. 标记为软删除:');
      const ids = result.rows.map(row => row.id);
      const now = new Date().toISOString();
      
      const updateResult = await client.query(`
        UPDATE transactions
        SET deleted = true, deleted_at = $1
        WHERE id = ANY($2)
        RETURNING id, deleted, deleted_at
      `, [now, ids]);
      
      console.log(`成功标记 ${updateResult.rows.length} 条记录为软删除:`);
      console.table(updateResult.rows);
    }

    console.log('\n✅ 操作完成！');

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();