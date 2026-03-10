const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'zeta_trading',
  user: 'postgres',
  password: '960717'
});

const orders = [
  { id: '1700000000001', type: 'buy', symbol: '600519', name: '贵州茅台', price: 1650.00, quantity: 100, status: 'executed', psychological_score: 75, strategy_score: 82, risk_score: 88, overall_score: 82, created_at: '2024-01-01T09:30:00.000Z', executed_at: '2024-01-01T09:30:00.000Z' },
  { id: '1700000000002', type: 'sell', symbol: '600519', name: '贵州茅台', price: 1725.00, quantity: 100, status: 'executed', psychological_score: 80, strategy_score: 85, risk_score: 90, overall_score: 85, created_at: '2024-01-02T10:15:00.000Z', executed_at: '2024-01-02T10:15:00.000Z' },
  { id: '1700000000003', type: 'buy', symbol: '000333', name: '美的集团', price: 62.50, quantity: 200, status: 'pending', psychological_score: 70, strategy_score: 78, risk_score: 85, overall_score: 78, created_at: '2024-01-03T14:00:00.000Z', executed_at: null },
  { id: '1700000000004', type: 'buy', symbol: '601318', name: '中国平安', price: 45.20, quantity: 300, status: 'executed', psychological_score: 65, strategy_score: 75, risk_score: 80, overall_score: 73, created_at: '2024-01-04T11:00:00.000Z', executed_at: '2024-01-04T11:00:00.000Z' },
  { id: '1700000000005', type: 'sell', symbol: '601318', name: '中国平安', price: 46.80, quantity: 300, status: 'executed', psychological_score: 85, strategy_score: 88, risk_score: 92, overall_score: 88, created_at: '2024-01-05T13:30:00.000Z', executed_at: '2024-01-05T13:30:00.000Z' },
  { id: '1700000000006', type: 'buy', symbol: '600036', name: '招商银行', price: 35.00, quantity: 500, status: 'pending', psychological_score: 72, strategy_score: 80, risk_score: 86, overall_score: 79, created_at: '2024-01-06T09:15:00.000Z', executed_at: null },
];

async function initData() {
  try {
    // 清空并插入普通订单数据
    await pool.query('TRUNCATE TABLE orders RESTART IDENTITY CASCADE');
    
    for (const order of orders) {
      await pool.query(
        `INSERT INTO orders (id, type, symbol, name, price, quantity, status, psychological_score, strategy_score, risk_score, overall_score, created_at, executed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [order.id, order.type, order.symbol, order.name, order.price, order.quantity, order.status, order.psychological_score, order.strategy_score, order.risk_score, order.overall_score, order.created_at, order.executed_at]
      );
    }
    
    console.log('✅ 普通订单数据初始化成功！');
    
    // 验证数据
    const result = await pool.query('SELECT * FROM orders');
    console.log(`\n当前共有 ${result.rows.length} 条普通订单`);
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    pool.end();
  }
}

initData();
