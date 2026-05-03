const {pool} = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const migrationPath = path.join(__dirname, 'migrations', 'migration_fix_table_fields.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');
    console.log('✅ 迁移成功完成');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ 迁移失败:', err.message);
  } finally {
    pool.end();
  }
}

runMigration();
