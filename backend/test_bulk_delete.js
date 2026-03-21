const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    // 1. 查询当前所有数据
    console.log('1. 当前所有数据:');
    const allData = await client.query('SELECT id, trade_number, symbol, deleted FROM trade_orders ORDER BY id');
    console.table(allData.rows);

    if (allData.rows.length === 0) {
      console.log('表为空，先插入一条测试数据...');
      await client.query(`
        INSERT INTO trade_orders (trade_number, order_type, symbol, name, price, quantity, order_date, status, is_virtual)
        VALUES ('20260322001', 'buy', '600519', '贵州茅台', 1650.00, 100, '2026-03-22', 'completed', false)
        RETURNING *
      `);
    }

    // 2. 查询未删除的数据
    console.log('\n2. 未删除的数据:');
    const notDeleted = await client.query('SELECT id, trade_number, symbol, deleted FROM trade_orders WHERE deleted = false ORDER BY id');
    console.table(notDeleted.rows);

    if (notDeleted.rows.length > 0) {
      const idToDelete = notDeleted.rows[0].id;
      console.log(`\n3. 尝试软删除 ID: ${idToDelete}`);

      // 3. 执行软删除
      const result = await client.query(
        'UPDATE trade_orders SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [idToDelete]
      );
      console.log('删除结果:', result.rows[0]);

      // 4. 再次查询未删除的数据
      console.log('\n4. 删除后未删除的数据:');
      const afterDelete = await client.query('SELECT id, trade_number, symbol, deleted FROM trade_orders WHERE deleted = false ORDER BY id');
      console.table(afterDelete.rows);
    }
  } catch (e) {
    console.error('错误:', e.message);
    console.error('堆栈:', e.stack);
  } finally {
    await client.release();
    await pool.end();
  }
})();
