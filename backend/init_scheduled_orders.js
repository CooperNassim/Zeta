const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'zeta_trading',
  user: 'postgres',
  password: '960717'
});

const scheduledOrders = [
  {
    order_id: 'SO20240310001',
    symbol: '600519',
    name: '贵州茅台',
    type: 'buy',
    condition_type: 'price_above',
    trigger_price: 1700.00,
    price: 1680.00,
    quantity: 100,
    status: 'pending',
    created_at: new Date()
  },
  {
    order_id: 'SO20240310002',
    symbol: '000333',
    name: '美的集团',
    type: 'buy',
    condition_type: 'price_below',
    trigger_price: 60.00,
    price: 58.00,
    quantity: 200,
    status: 'pending',
    created_at: new Date()
  },
  {
    order_id: 'SO20240310003',
    symbol: '601318',
    name: '中国平安',
    type: 'sell',
    condition_type: 'price_above',
    trigger_price: 48.00,
    price: 47.50,
    quantity: 300,
    status: 'pending',
    created_at: new Date()
  },
  {
    order_id: 'SO20240310004',
    symbol: '600036',
    name: '招商银行',
    type: 'buy',
    condition_type: 'time',
    trigger_time: new Date(Date.now() + 86400000),
    price: 35.00,
    quantity: 500,
    status: 'pending',
    created_at: new Date()
  }
];

async function initData() {
  try {
    // 清空并插入预约订单数据
    await pool.query('TRUNCATE TABLE scheduled_orders RESTART IDENTITY CASCADE');
    
    for (const order of scheduledOrders) {
      await pool.query(
        `INSERT INTO scheduled_orders (order_id, symbol, name, type, condition_type, trigger_price, trigger_time, price, quantity, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [order.order_id, order.symbol, order.name, order.type, order.condition_type, order.trigger_price, order.trigger_time, order.price, order.quantity, order.status, order.created_at]
      );
    }
    
    console.log('✅ 预约订单数据初始化成功！');
    
    // 验证数据
    const result = await pool.query('SELECT * FROM scheduled_orders');
    console.log(`\n当前共有 ${result.rows.length} 条预约订单`);
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    pool.end();
  }
}

initData();
