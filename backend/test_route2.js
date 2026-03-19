const { pool } = require('./src/config/database');
const { findOne, insert, update } = require('./src/database/queries');

async function testRoute() {
  try {
    console.log('=== 测试心理测试路由逻辑 ===\n');

    const testDate = '2026-03-13';
    const testData = {
      scores: { 1: 2, 2: 1, 3: 2, 4: 1, 5: 2 },
      overall_score: 8,
      test_date: testDate,
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log('1. 检查是否存在记录...');
    const existingRecord = await findOne('psychological_test_results', { where: { test_date: testDate } });
    console.log('   已存在记录:', existingRecord);

    let result;
    if (existingRecord) {
      console.log('2. 更新已有记录, ID:', existingRecord.id);
      result = await update('psychological_test_results', existingRecord.id, {
        scores: testData.scores,
        overall_score: testData.overall_score,
        updated_at: new Date()
      });
      console.log('   更新结果:', result);
    } else {
      console.log('2. 创建新记录');
      result = await insert('psychological_test_results', testData);
      console.log('   插入结果:', result);
    }

    console.log('\n✅ 测试成功!');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  } finally {
    await pool.end();
  }
}

testRoute();
