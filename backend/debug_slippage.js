const { pool } = require('./src/config/database');

(async () => {
  try {
    const client = await pool.connect();
    
    // 检查买入相关字段
    const buyResult = await client.query(
      "SELECT id, stock_name, buy_order_price, buy_price, buy_quantity FROM trade_records WHERE buy_order_price IS NOT NULL LIMIT 2"
    );
    
    console.log('=== Buy Records ===');
    buyResult.rows.forEach(r => {
      console.log(`Stock: ${r.stock_name}`);
      console.log(`  buy_order_price: ${r.buy_order_price} (type: ${typeof r.buy_order_price})`);
      console.log(`  buy_price: ${r.buy_price} (type: ${typeof r.buy_price})`);
      console.log(`  buy_quantity: ${r.buy_quantity} (type: ${typeof r.buy_quantity})`);
      
      // 测试滑点计算
      const buySlippage = (r.buy_price && r.buy_order_price && r.buy_quantity)
        ? (parseFloat(r.buy_price) - parseFloat(r.buy_order_price)) * parseFloat(r.buy_quantity)
        : null;
      console.log(`  buySlippage: ${buySlippage}`);
      console.log('');
    });
    
    // 检查卖出相关字段
    const sellResult = await client.query(
      "SELECT id, stock_name, sell_order_price, sell_price, sell_quantity FROM trade_records WHERE sell_order_price IS NOT NULL LIMIT 2"
    );
    
    console.log('=== Sell Records ===');
    sellResult.rows.forEach(r => {
      console.log(`Stock: ${r.stock_name}`);
      console.log(`  sell_order_price: ${r.sell_order_price} (type: ${typeof r.sell_order_price})`);
      console.log(`  sell_price: ${r.sell_price} (type: ${typeof r.sell_price})`);
      console.log(`  sell_quantity: ${r.sell_quantity} (type: ${typeof r.sell_quantity})`);
      
      // 测试滑点计算
      const sellSlippage = (r.sell_order_price && r.sell_price && r.sell_quantity)
        ? (parseFloat(r.sell_order_price) - parseFloat(r.sell_price)) * parseFloat(r.sell_quantity)
        : null;
      console.log(`  sellSlippage: ${sellSlippage}`);
      console.log('');
    });
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
