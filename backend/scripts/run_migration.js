const fs = require('fs');
const path = require('path');

async function runMigration() {
  const { pool } = require('../src/config/database');
  const migrationSql = fs.readFileSync(
    path.join(__dirname, '../migrations/migration_psychological_test_timezone_fix.sql'),
    'utf-8'
  );

  try {
    console.log('开始执行心理测试表迁移...');
    
    // 按分号分割 SQL 语句
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const result = await pool.query(statement);
          if (result.rows && result.rows.length > 0) {
            console.log('执行结果:', result.rows[0]);
          }
        } catch (err) {
          console.error('执行错误:', err.message);
        }
      }
    }

    console.log('迁移执行完成！');
  } catch (error) {
    console.error('迁移失败:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
