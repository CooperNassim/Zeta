const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('=== 检查 trading_strategies 表状态 ===\n');

    // 1. 查询所有记录（包括已删除）
    const allRecords = await pool.query('SELECT id, name, deleted, deleted_at FROM trading_strategies ORDER BY id');
    console.log('1. 所有记录（包括已删除）:');
    console.log(`   总数: ${allRecords.rows.length}`);
    allRecords.rows.forEach(r => {
      console.log(`   ID:${r.id}, 名称:${r.name}, 已删除:${r.deleted}, 删除时间:${r.deleted_at}`);
    });

    // 2. 查询未删除的记录
    const activeRecords = await pool.query('SELECT id, name, deleted FROM trading_strategies WHERE deleted = false ORDER BY id');
    console.log('\n2. 未删除的记录:');
    console.log(`   总数: ${activeRecords.rows.length}`);
    activeRecords.rows.forEach(r => {
      console.log(`   ID:${r.id}, 名称:${r.name}`);
    });

    // 3. 测试新增记录
    console.log('\n3. 测试新增记录...');
    const insertResult = await pool.query(
      `INSERT INTO trading_strategies (strategy_type, name, status, deleted, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, deleted`,
      ['test_type', '测试新增_临时', '启用', false]
    );
    console.log(`   新增成功! ID: ${insertResult.rows[0].id}, 名称: ${insertResult.rows[0].name}`);

    // 4. 测试软删除
    console.log('\n4. 测试软删除刚才新增的记录...');
    await pool.query(
      'UPDATE trading_strategies SET deleted = true, deleted_at = NOW() WHERE id = $1',
      [insertResult.rows[0].id]
    );
    console.log(`   软删除成功!`);

    // 5. 再次查询未删除记录
    const afterDelete = await pool.query('SELECT id, name, deleted FROM trading_strategies WHERE deleted = false ORDER BY id');
    console.log(`   软删除后未删除记录数: ${afterDelete.rows.length}`);

    // 6. 清理测试数据
    console.log('\n5. 清理测试数据...');
    await pool.query('DELETE FROM trading_strategies WHERE name = $1', ['测试新增_临时']);
    console.log('   清理完成');

    await pool.end();
    console.log('\n=== 数据库测试完成，数据库功能正常 ===');
  } catch (error) {
    console.error('错误:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
