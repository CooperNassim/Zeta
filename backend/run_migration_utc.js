const fs = require('fs');
const { pool } = require('./src/config/database');

(async () => {
  const sql = fs.readFileSync('migrations/migration_utc_time.sql', 'utf8');
  try {
    await pool.query(sql);
    console.log('UTC时间格式迁移完成');
  } catch(e) {
    console.error('迁移失败:', e.message);
  }
  await pool.end();
})();
