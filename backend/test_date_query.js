const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('=== 测试日期查询 ===\n');

    const dateStr = '2026-03-31';
    console.log('查询条件: date::text =', dateStr);

    const result1 = await pool.query(
      "SELECT id, date, deleted FROM daily_work_data WHERE date::text = $1",
      [dateStr]
    );
    console.log('\n查询结果1 (date::text = $1):', result1.rows.length, '条');

    const result2 = await pool.query(
      "SELECT id, date, deleted FROM daily_work_data WHERE date::text = $1 AND deleted = true",
      [dateStr]
    );
    console.log('查询结果2 (date::text = $1 AND deleted = true):', result2.rows.length, '条');

    const result3 = await pool.query(
      "SELECT id, date, deleted FROM daily_work_data WHERE date = $1",
      [dateStr]
    );
    console.log('查询结果3 (date = $1):', result3.rows.length, '条');

    console.log('\n日期字段的文本值:');
    const dateResult = await pool.query("SELECT date::text as date_str FROM daily_work_data WHERE id = 53");
    console.log(dateResult.rows[0].date_str);

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

test();
