const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('测试1: 查询当天数据');
    const result1 = await pool.query(
      "SELECT * FROM psychological_test_results WHERE test_date = $1 AND deleted = false",
      ['2026-03-13']
    );
    console.log('查询结果:', result1.rows);

    console.log('\n测试2: 插入新数据');
    const result2 = await pool.query(
      "INSERT INTO psychological_test_results (scores, overall_score, test_date, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *",
      [{ 1: 2, 2: 1, 3: 2, 4: 1, 5: 2 }, 8, '2026-03-13']
    );
    console.log('插入结果:', result2.rows[0]);

    console.log('\n测试3: 更新数据');
    const result3 = await pool.query(
      "UPDATE psychological_test_results SET scores = $1, overall_score = $2, updated_at = NOW() WHERE test_date = $3 AND deleted = false RETURNING *",
      [{ 1: 1, 2: 0, 3: 1, 4: 2, 5: 0 }, 4, '2026-03-13']
    );
    console.log('更新结果:', result3.rows[0]);

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

test();
