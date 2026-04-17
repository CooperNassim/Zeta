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
    console.log('=== 检查 trade_orders 表结构和数据 ===\n');

    // 1. 检查表结构
    console.log('1. 表结构:');
    const tableResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'trade_orders'
      ORDER BY ordinal_position
    `);
    console.table(tableResult.rows);

    // 2. 检查数据
    console.log('\n2. 最近10条数据:');
    const dataResult = await client.query(`
      SELECT * FROM trade_orders
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.table(dataResult.rows);

    // 3. 检查字段映射
    console.log('\n3. 检查字段映射 - 关键字段:');
    const mapResult = await client.query(`
      SELECT
        id,
        trade_number,
        order_type,
        symbol,
        name,
        price,
        quantity,
        created_at
      FROM trade_orders
      ORDER BY id DESC
      LIMIT 5
    `);
    console.table(mapResult.rows);

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();