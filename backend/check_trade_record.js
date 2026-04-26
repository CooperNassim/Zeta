const { pool } = require('./src/config/database');

async function check() {
  const client = await pool.connect();
  try {
    // 查询 trade_orders（股票交易列表）
    const orders = await client.query(
      'SELECT id, trade_number, order_type, price, quantity, deleted, created_at FROM trade_orders WHERE trade_number = $1 ORDER BY id',
      ['20260422026']
    );
    console.log('========== 股票交易列表 (trade_orders) ==========');
    orders.rows.forEach(r => {
      console.log(`id: ${r.id}, order_type: ${r.order_type}, price: ${r.price}, quantity: ${r.quantity}, deleted: ${r.deleted}`);
    });

    // 查询 trade_records（交易记录）
    const records = await client.query(
      'SELECT id, trade_number, buy_order_id, sell_order_id, buy_price, sell_price, deleted, created_at FROM trade_records WHERE trade_number = $1 ORDER BY id',
      ['20260422026']
    );
    console.log('\n========== 交易记录 (trade_records) ==========');
    records.rows.forEach(r => {
      const type = r.buy_order_id ? '买入' : (r.sell_order_id ? '卖出' : '未知');
      console.log(`id: ${r.id}, 类型: ${type}, deleted: ${r.deleted}`);
      console.log(`  buy_order_id: ${r.buy_order_id}, sell_order_id: ${r.sell_order_id}`);
      console.log(`  buy_price: ${r.buy_price}, sell_price: ${r.sell_price}`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(err => {
  console.error('查询失败:', err);
  process.exit(1);
});