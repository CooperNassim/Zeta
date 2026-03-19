const { pool } = require('./src/config/database');

async function cleanAndInit() {
  try {
    console.log('=== 清理并初始化心理测试数据 ===\n');

    // 1. 删除所有记录
    console.log('1. 删除所有记录...');
    await pool.query('DELETE FROM psychological_test_results');
    console.log('   ✓ 已清空表\n');

    // 2. 验证
    const result = await pool.query('SELECT COUNT(*) FROM psychological_test_results');
    console.log('2. 验证结果:');
    console.log('   记录数:', result.rows[0].count);
    console.log('\n✅ 数据库已清空，可以开始测试了！');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await pool.end();
  }
}

cleanAndInit();
