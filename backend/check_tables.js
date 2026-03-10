const { pool } = require('./src/config/database');

async function main() {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('数据库中的表:');
    result.rows.forEach(t => console.log('  - ' + t.table_name));
  } catch (e) {
    console.error('查询失败:', e.message);
  } finally {
    pool.end();
  }
}

main();
