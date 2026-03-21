const { pool } = require('./src/config/database');

(async () => {
  try {
    // 查询特定交易编号
    const result = await pool.query(
      'SELECT * FROM trade_orders WHERE trade_number = $1',
      ['20260322010']
    );

    console.log('查询结果:');
    console.log('找到记录数:', result.rows.length);

    if (result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('没有找到交易编号为 20260322010 的记录');

      // 查询所有记录
      console.log('\n数据库中所有记录:');
      const allData = await pool.query('SELECT id, trade_number, symbol, deleted, created_at FROM trade_orders ORDER BY created_at DESC LIMIT 10');
      console.table(allData.rows);
    }
  } catch (e) {
    console.error('错误:', e.message);
  } finally {
    await pool.end();
  }
})();
