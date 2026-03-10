const { pool } = require('./src/config/database');

(async () => {
  try {
    const dates = ['2026-03-13', '2026-03-14', '2026-03-15'];
    for (const date of dates) {
      await pool.query('DELETE FROM daily_work_data WHERE date = $1', [date]);
      await pool.query('INSERT INTO daily_work_data (date, nasdaq, sentiment, prediction) VALUES ($1, $2, $3, $4)', [date, `测试数据${date.slice(-2)}`, '微热', '看涨']);
      console.log(`创建数据: ${date}`);
    }
    console.log('\n所有测试数据创建成功');
    await pool.end();
  } catch(err) {
    console.error('Error:', err.message);
  }
})();
