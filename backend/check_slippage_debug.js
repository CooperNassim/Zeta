const { pool } = require('./src/config/database');

(async () => {
  try {
    const client = await pool.connect();
    
    // 检查有买入订单价格的记录
    const buyResult = await client.query(
      "SELECT id, stock_name, buy_order_price, buy_price, buy_quantity FROM trade_records WHERE buy_order_price IS NOT NULL LIMIT 3"
    );
    
    console.log('=== Buy Records ===');
    buyResult.rows.forEach(r => {
      console.log(`Stock: ${r.stock_name}`);
      console.log(`  buy_order_price: ${r.buy_order_price} (${typeof r.buy_order_price})`);
      console.log(`  buy_price: ${r.buy_price} (${typeof r.buy_price})`);
      console.log(`  buy_quantity: ${r.buy_quantity} (${typeof r.buy_quantity})`);
      
      // 计算滑点
      let buySlippage = null;
      if (r.buy_price !== null && r.buy_price !== undefined &&
          r.buy_order_price !== null && r.buy_order_price !== undefined &&
          r.buy_quantity !== null && r.buy_quantity !== undefined) {
        const priceDiff = parseFloat(r.buy_price) - parseFloat(r.buy_order_price);
        const quantity = parseFloat(r.buy_quantity);
        buySlippage = priceDiff * quantity;
        console.log(`  priceDiff: ${priceDiff}, quantity: ${quantity}`);
        console.log(`  buySlippage: ${buySlippage}`);
      } else {
        console.log(`  Conditions not met, buySlippage: null`);
      }
      console.log('');
    });
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
