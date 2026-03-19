const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('=== 测试软删除功能 ===\n');

    // 1. 查看当前所有数据（包括已删除的）
    const allData = await pool.query('SELECT id, date, deleted, deleted_at FROM daily_work_data ORDER BY id');
    console.log('1. 所有数据（包括已删除）:');
    allData.rows.forEach(row => {
      console.log(`   ID: ${row.id}, 日期: ${row.date.toISOString().split('T')[0]}, 已删除: ${row.deleted}, 删除时间: ${row.deleted_at}`);
    });

    // 2. 查看未删除的数据
    const activeData = await pool.query('SELECT id, date, deleted FROM daily_work_data WHERE deleted = false OR deleted IS NULL ORDER BY id');
    console.log(`\n2. 未删除的数据数量: ${activeData.rows.length}`);

    // 3. 如果有数据,测试软删除第一条
    if (activeData.rows.length > 0) {
      const firstId = activeData.rows[0].id;
      const firstDate = activeData.rows[0].date;
      console.log(`\n3. 测试软删除 ID: ${firstId}, 日期: ${firstDate.toISOString().split('T')[0]}`);

      // 执行软删除
      const deleteResult = await pool.query(
        'UPDATE daily_work_data SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [firstId]
      );
      console.log(`   软删除结果: ${deleteResult.rowCount > 0 ? '成功' : '失败'}`);

      // 查看删除后的数据
      const afterDelete = await pool.query('SELECT id, date, deleted, deleted_at FROM daily_work_data WHERE id = $1', [firstId]);
      console.log(`   删除后状态: deleted=${afterDelete.rows[0].deleted}, deleted_at=${afterDelete.rows[0].deleted_at}`);

      // 测试查询未删除数据
      const activeAfter = await pool.query('SELECT COUNT(*) as count FROM daily_work_data WHERE deleted = false OR deleted IS NULL');
      console.log(`   删除后未删除数据数量: ${activeAfter.rows[0].count}`);

      // 恢复数据（为了测试）
      await pool.query('UPDATE daily_work_data SET deleted = false, deleted_at = NULL WHERE id = $1', [firstId]);
      console.log('   已恢复数据用于后续测试');
    }

    console.log('\n=== 测试完成 ===');

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
})();
