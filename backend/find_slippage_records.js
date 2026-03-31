const { pool } = require('./src/config/database');

(async () => {
  try {
    const client = await pool.connect();
    
    // 查找买入价格和订单价格不同的记录
    const buyResult = await client.query(
      `SELECT id, stock_name, buy_order_price, buy_price, buy_quantity
       FROM trade_records
       WHERE buy_order_price IS NOT NULL
       AND buy_price IS NOT NULL
       AND ABS(buy_price - buy_order_price) > 0.0001
       LIMIT 5`
    );
    
    console.log('=== 有买入滑点的记录 ===');
    if (buyResult.rows.length === 0) {
      console.log('没有找到买入价格和订单价格不同的记录');
    } else {
      buyResult.rows.forEach(r => {
        const slippage = (parseFloat(r.buy_price) - parseFloat(r.buy_order_price)) * parseFloat(r.buy_quantity);
        console.log(`Stock: ${r.stock_name}`);
        console.log(`  buy_order_price: ${r.buy_order_price}`);
        console.log(`  buy_price: ${r.buy_price}`);
        console.log(`  buy_quantity: ${r.buy_quantity}`);
        console.log(`  滑点: ${slippage}`);
        console.log('');
      });
    }
    
    // 查找卖出价格和订单价格不同的记录
    const sellResult = await client.query(
      `SELECT id, stock_name, sell_order_price, sell_price, sell_quantity
       FROM trade_records
       WHERE sell_order_price IS NOT NULL
       AND sell_price IS NOT NULL
       AND ABS(sell_price - sell_order_price) > 0.0001
       LIMIT 5`
    );
    
    console.log('=== 有卖出滑点的记录 ===');
    if (sellResult.rows.length === 0) {
      console.log('没有找到卖出价格和订单价格不同的记录');
    } else {
      sellResult.rows.forEach(r => {
        const slippage = (parseFloat(r.sell_order_price) - parseFloat(r.sell_price)) * parseFloat(r.sell_quantity);
        console.log(`Stock: ${r.stock_name}`);
        console.log(`  sell_order_price: ${r.sell_order_price}`);
        console.log(`  sell_price: ${r.sell_price}`);
        console.log(`  sell_quantity: ${r.sell_quantity}`);
        console.log(`  滑点: ${slippage}`);
        console.log('');
      });
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
