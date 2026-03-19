const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('1. 查询所有交易策略(包含已删除):');
    const all = await pool.query('SELECT id, name, deleted FROM trading_strategies ORDER BY id');
    console.log(all.rows);

    console.log('\n2. 删除第一条记录:');
    if (all.rows.length > 0) {
      const idToDelete = all.rows[0].id;
      const deleteRes = await pool.query('UPDATE trading_strategies SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [idToDelete]);
      console.log('删除结果:', deleteRes.rows[0]);

      console.log('\n3. 删除后查询未删除的记录:');
      const active = await pool.query('SELECT id, name, deleted FROM trading_strategies WHERE deleted = false ORDER BY id');
      console.log('未删除记录数:', active.rows.length);
      console.log(active.rows);
    }

    await pool.end();
  } catch (error) {
    console.error('测试失败:', error);
    await pool.end();
    process.exit(1);
  }
})();
