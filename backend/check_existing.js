const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('=== 检查数据库中的2026-03-31数据 ===\n');

    const result = await pool.query(
      "SELECT id, date, deleted, deleted_at FROM daily_work_data WHERE date::text LIKE '2026-03-31%'"
    );

    console.log('找到记录数:', result.rows.length);
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log('\nID:', row.id);
        console.log('date:', row.date);
        console.log('deleted:', row.deleted);
        console.log('deleted_at:', row.deleted_at);
      });
    } else {
      console.log('未找到任何记录');
    }

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

test();
