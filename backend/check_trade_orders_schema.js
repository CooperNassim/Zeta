require('dotenv').config();
const { pool } = require('./src/config/database');

async function checkSchema() {
  console.log('=== 检查 trade_orders 表结构 ===\n');

  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'trade_orders'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
