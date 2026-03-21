require('dotenv').config();
const { pool } = require('./src/config/database');

async function addDeletedColumns() {
  console.log('=== 为 account 和 risk_config 表添加 deleted 字段 ===\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 为 account 表添加 deleted 字段
    console.log('为 account 表添加 deleted 字段...');
    await client.query(`
      ALTER TABLE account
      ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ account 表字段添加成功');

    // 为 risk_config 表添加 deleted 字段
    console.log('为 risk_config 表添加 deleted 字段...');
    await client.query(`
      ALTER TABLE risk_config
      ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ risk_config 表字段添加成功');

    await client.query('COMMIT');
    console.log('\n✅ 所有表结构更新成功！');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addDeletedColumns();
