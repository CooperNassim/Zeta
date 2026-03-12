// 清空心理测试相关表
// 加载环境变量（从 backend 目录的 .env 文件）
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function clearPsychologicalTables() {
  const client = await pool.connect();
  try {
    console.log('开始清空心理测试表...\n');

    // 删除所有心理测试结果
    const deleteResult = await client.query(
      `DELETE FROM psychological_test_results`
    );
    console.log(`✅ 已删除 ${deleteResult.rowCount} 条心理测试结果`);

    // 重置自增ID序列
    await client.query(
      `ALTER SEQUENCE psychological_test_results_id_seq RESTART WITH 1`
    );
    console.log('✅ 已重置ID序列\n');

    // 验证表是否为空
    const verifyResult = await client.query(
      `SELECT COUNT(*) as count FROM psychological_test_results`
    );
    console.log(`当前表中共有 ${verifyResult.rows[0].count} 条记录`);

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clearPsychologicalTables()
  .then(() => {
    console.log('\n✅ 心理测试表清空完成!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ 清空失败:', err);
    process.exit(1);
  });
