const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    // 测试插入数据
    console.log('测试插入数据...');
    const insertSQL = `
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, price, quantity,
        order_date, status, is_virtual
      )
      VALUES ('TEST001', 'buy', '000001', '平安银行', 12.50, 1000,
              '2026-03-22', 'pending', false)
      RETURNING id;
    `;
    const result = await client.query(insertSQL);
    console.log(`✅ 插入成功，生成的 ID: ${result.rows[0].id}`);

    // 查看数据
    const data = await client.query('SELECT * FROM trade_orders WHERE trade_number = $1', ['TEST001']);
    console.log('\n插入的数据:');
    console.table(data.rows);

    // 删除测试数据
    await client.query('DELETE FROM trade_orders WHERE trade_number = $1', ['TEST001']);
    console.log('\n✅ 测试数据已清理');
  } finally {
    await client.release();
    await pool.end();
  }
})();
