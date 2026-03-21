const { findAll } = require('./src/database/queries');

(async () => {
  try {
    // 测试查询 trade_orders
    console.log('测试查询 trade_orders:');
    const tradeOrders = await findAll('trade_orders');
    console.log(`  trade_orders 数量: ${tradeOrders.length}`);

    // 测试查询 orders (应该失败)
    console.log('\n测试查询 orders:');
    try {
      const orders = await findAll('orders');
      console.log(`  orders 数量: ${orders.length}`);
    } catch (err) {
      console.log(`  orders 查询失败: ${err.message}`);
    }
  } catch (error) {
    console.error('错误:', error);
  }
})();
