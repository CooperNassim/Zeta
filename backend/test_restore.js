const { pool } = require('./src/config/database');

async function test() {
  const dateStr = '2026-03-31';
  console.log('查询条件: date::text =', dateStr);

  const result = await pool.query(
    `SELECT * FROM daily_work_data WHERE date::text = $1 AND deleted = true`,
    [dateStr]
  );

  console.log('找到记录数:', result.rows.length);
  if (result.rows.length > 0) {
    console.log('记录ID:', result.rows[0].id);
    console.log('记录日期:', result.rows[0].date);
    console.log('deleted:', result.rows[0].deleted);
  }

  await pool.end();
}

test();
