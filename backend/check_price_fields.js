/**
 * 检查trade_records表中价格字段
 */
const { pool } = require('./src/config/database');

async function checkPriceFields() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'trade_records' AND column_name LIKE '%price%'
      ORDER BY ordinal_position
    `);

    console.log('trade_records 表中的价格字段:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('错误:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPriceFields();
