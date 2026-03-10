const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('清空每日功课数据库');
    console.log('========================================\n');

    // 1. 检查当前记录数
    console.log('1. 检查当前数据...');
    const countBefore = await client.query('SELECT COUNT(*) FROM daily_work_data');
    console.log(`   当前记录数: ${countBefore.rows[0].count}\n`);

    // 2. 硬删除所有数据（DELETE而不是TRUNCATE，保持表结构和约束）
    console.log('2. 删除所有记录...');
    await client.query('DELETE FROM daily_work_data');
    console.log('   ✅ 所有记录已删除\n');

    // 3. 重置自增ID序列
    console.log('3. 重置ID序列...');
    await client.query('ALTER SEQUENCE daily_work_data_id_seq RESTART WITH 1');
    console.log('   ✅ ID序列已重置\n');

    // 4. 验证结果
    console.log('4. 验证结果...');
    const countAfter = await client.query('SELECT COUNT(*) FROM daily_work_data');
    console.log(`   当前记录数: ${countAfter.rows[0].count}`);

    // 5. 显示ID序列当前值
    const seqValue = await client.query(
      "SELECT last_value FROM daily_work_data_id_seq"
    );
    console.log(`   ID序列当前值: ${seqValue.rows[0].last_value}\n`);

    console.log('========================================');
    console.log('✅ 数据库已清空！');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 清空失败:', error.message);
  } finally {
    client.release();
    pool.end();
  }
})();
