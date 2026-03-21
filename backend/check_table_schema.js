require('dotenv').config();
const { pool } = require('./src/config/database');

async function checkTableSchema() {
  console.log('=== 检查 account 和 risk_config 表结构 ===\n');

  try {
    // 检查 account 表结构
    console.log('account 表结构:');
    const accountColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'account'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    accountColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('\n');

    // 检查 risk_config 表结构
    console.log('risk_config 表结构:');
    const riskConfigColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'risk_config'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    riskConfigColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('\n');

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

checkTableSchema();
