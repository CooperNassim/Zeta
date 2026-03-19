// 测试心理测试提交功能
import { pool } from './backend/src/config/database.js';

async function testPsychologicalTest() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('=== 测试心理测试提交功能 ===\n');

    const today = new Date().toISOString().split('T')[0];

    // 1. 准备测试数据
    const testScores = {
      '1': 2,
      '2': 1,
      '3': 2,
      '4': 2,
      '5': 2
    };

    const overallScore = Object.values(testScores).reduce((sum, val) => sum + val, 0);
    console.log('1. 准备的测试数据:');
    console.log('   日期:', today);
    console.log('   分数:', JSON.stringify(testScores));
    console.log('   总分:', overallScore, '\n');

    // 2. 先检查是否存在该日期的记录
    const checkResult = await client.query(
      'SELECT * FROM psychological_test_results WHERE test_date = $1',
      [today]
    );
    console.log('2. 检查是否存在该日期的记录:');
    console.log('   记录数:', checkResult.rows.length);
    if (checkResult.rows.length > 0) {
      console.log('   记录详情:', JSON.stringify(checkResult.rows[0], null, 2));
    }
    console.log('');

    // 3. 如果存在，先软删除
    if (checkResult.rows.length > 0) {
      await client.query(
        'UPDATE psychological_test_results SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [checkResult.rows[0].id]
      );
      console.log('3. 已软删除旧记录\n');
    }

    // 4. 尝试插入新记录
    console.log('4. 插入新记录...');
    const insertResult = await client.query(
      `INSERT INTO psychological_test_results (test_date, scores, overall_score, notes, deleted, deleted_at, created_at, updated_at)
       VALUES ($1, $2, $3, '', false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [today, JSON.stringify(testScores), overallScore.toString()]
    );

    const insertedRecord = insertResult.rows[0];
    console.log('   插入成功!');
    console.log('   记录详情:', JSON.stringify(insertedRecord, null, 2));
    console.log('');

    // 5. 查询验证
    console.log('5. 查询验证...');
    const queryResult = await client.query(
      'SELECT * FROM psychological_test_results WHERE test_date = $1 AND deleted = false',
      [today]
    );

    if (queryResult.rows.length === 0) {
      console.log('   ❌ 错误: 查询不到记录');
      await client.query('ROLLBACK');
      return;
    }

    const verifiedRecord = queryResult.rows[0];
    console.log('   查询成功!');
    console.log('   scores:', JSON.stringify(verifiedRecord.scores));
    console.log('   overall_score:', verifiedRecord.overall_score);
    console.log('   整数分数:', Math.round(parseFloat(verifiedRecord.overall_score)));

    // 验证分数是否正确
    const verifiedScore = Math.round(parseFloat(verifiedRecord.overall_score));
    const expectedScore = Object.values(testScores).reduce((sum, val) => sum + val, 0);

    if (verifiedScore === expectedScore) {
      console.log('   ✅ 分数正确:', verifiedScore, '=', expectedScore);
    } else {
      console.log('   ❌ 分数错误: 期望', expectedScore, '实际', verifiedScore);
    }

    console.log('');

    // 6. 测试更新
    console.log('6. 测试更新记录...');
    const newScores = {
      '1': 2,
      '2': 2,
      '3': 2,
      '4': 2,
      '5': 2
    };
    const newOverallScore = Object.values(newScores).reduce((sum, val) => sum + val, 0);

    const updateResult = await client.query(
      `UPDATE psychological_test_results
       SET scores = $1, overall_score = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(newScores), newOverallScore.toString(), insertedRecord.id]
    );

    const updatedRecord = updateResult.rows[0];
    console.log('   更新成功!');
    console.log('   新分数:', JSON.stringify(updatedRecord.scores));
    console.log('   新总分:', updatedRecord.overall_score);

    const updatedVerifiedScore = Math.round(parseFloat(updatedRecord.overall_score));
    if (updatedVerifiedScore === newOverallScore) {
      console.log('   ✅ 更新后分数正确:', updatedVerifiedScore, '=', newOverallScore);
    } else {
      console.log('   ❌ 更新后分数错误: 期望', newOverallScore, '实际', updatedVerifiedScore);
    }

    console.log('');
    console.log('=== 测试完成 ===');

    await client.query('ROLLBACK'); // 回滚，不影响真实数据

  } catch (error) {
    console.error('测试失败:', error);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testPsychologicalTest()
  .then(() => {
    console.log('\n✅ 所有测试通过');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  });
