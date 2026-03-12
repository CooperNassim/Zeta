// 直接测试心理测试的保存流程
const { pool } = require('./src/config/database');

async function testPsychTest() {
  const client = await pool.connect();
  try {
    // 检查今天的记录
    const today = '2026-03-12';
    const checkResult = await client.query(
      'SELECT * FROM psychological_test_results WHERE test_date = $1 AND deleted = false',
      [today]
    );
    console.log('今天的记录数量:', checkResult.rows.length);

    if (checkResult.rows.length > 0) {
      // 更新今天的记录
      const updateResult = await client.query(
        `UPDATE psychological_test_results
         SET scores = $1, overall_score = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
         WHERE test_date = $4 AND deleted = false
         RETURNING *`,
        [JSON.stringify({ '1': 5, '2': 5, '3': 5, '4': 5, '5': 5 }), 5.0, '手动测试更新', today]
      );
      console.log('更新成功:', updateResult.rows[0]);
    } else {
      // 插入新记录
      const insertResult = await client.query(
        `INSERT INTO psychological_test_results (test_date, scores, overall_score, notes, deleted, deleted_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [today, JSON.stringify({ '1': 5, '2': 5, '3': 5, '4': 5, '5': 5 }), 5.0, '手动测试']
      );
      console.log('插入成功:', insertResult.rows[0]);
    }

    // 查询所有记录
    const allResult = await client.query(
      'SELECT test_date, overall_score, notes FROM psychological_test_results WHERE deleted = false ORDER BY test_date DESC'
    );
    console.log('\n所有心理测试记录:');
    allResult.rows.forEach(row => {
      console.log(`- ${row.test_date.toISOString().split('T')[0]}: ${row.overall_score}分 (${row.notes})`);
    });

  } catch (error) {
    console.error('错误:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testPsychTest();
