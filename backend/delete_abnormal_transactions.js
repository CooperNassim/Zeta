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
    console.log('=== 永久删除异常交易记录 ===\n');

    // 1. 查找异常交易记录（symbol='2' 或 name='2'）
    console.log('1. 查找异常交易记录:');
    const result = await client.query(`
      SELECT id, transaction_type, symbol, name, amount, trade_number, created_at, deleted
      FROM transactions
      WHERE (symbol = '2' OR name = '2')
      ORDER BY created_at DESC
    `);
    
    console.log(`找到 ${result.rows.length} 条异常交易记录:`);
    console.table(result.rows);

    if (result.rows.length > 0) {
      // 2. 永久删除这些记录
      console.log('\n2. 永久删除异常记录:');
      const ids = result.rows.map(row => row.id);
      
      const deleteResult = await client.query(`
        DELETE FROM transactions
        WHERE id = ANY($1)
        RETURNING id
      `, [ids]);
      
      console.log(`成功删除 ${deleteResult.rows.length} 条异常记录:`);
      console.table(deleteResult.rows);
    }

    // 3. 验证删除结果
    console.log('\n3. 验证删除结果:');
    const verifyResult = await client.query(`
      SELECT id, transaction_type, symbol, name, amount, trade_number, created_at, deleted
      FROM transactions
      WHERE (symbol = '2' OR name = '2')
      ORDER BY created_at DESC
    `);
    
    console.log(`剩余 ${verifyResult.rows.length} 条异常交易记录:`);
    console.table(verifyResult.rows);

    console.log('\n✅ 操作完成！');

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();