const { pool } = require('./src/config/database');

async function initData() {
  try {
    // 先清空现有数据
    await pool.query('DELETE FROM transactions');
    await pool.query('DELETE FROM trade_records');
    await pool.query('DELETE FROM orders');

    // 初始化 orders
    const orders = [
      { id: 'OD001', type: 'buy', symbol: '600519', name: '贵州茅台', price: 1650, quantity: 100, status: 'executed', created_at: new Date('2024-01-15') },
      { id: 'OD002', type: 'sell', symbol: '600519', name: '贵州茅台', price: 1725, quantity: 100, status: 'executed', created_at: new Date('2024-01-20') },
      { id: 'OD003', type: 'buy', symbol: '000333', name: '美的集团', price: 62.5, quantity: 200, status: 'executed', created_at: new Date('2024-02-01') },
      { id: 'OD004', type: 'sell', symbol: '000333', name: '美的集团', price: 65, quantity: 200, status: 'executed', created_at: new Date('2024-02-10') },
      { id: 'OD005', type: 'buy', symbol: '601318', name: '中国平安', price: 45.2, quantity: 300, status: 'executed', created_at: new Date('2024-03-01') },
      { id: 'OD006', type: 'sell', symbol: '601318', name: '中国平安', price: 46.8, quantity: 300, status: 'executed', created_at: new Date('2024-03-10') },
    ];

    console.log('正在初始化 orders...');
    for (const o of orders) {
      await pool.query(
        `INSERT INTO orders (id, type, symbol, name, price, quantity, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [o.id, o.type, o.symbol, o.name, o.price, o.quantity, o.status, o.created_at]
      );
    }
    console.log(`已插入 ${orders.length} 条 orders`);

    // 初始化 transactions (账单明细)
    const transactions = [
      { id: 'TX001', order_id: 'OD001', type: 'buy', symbol: '600519', name: '贵州茅台', price: 1650, quantity: 100, amount: -165000, transaction_time: new Date('2024-01-15'), created_at: new Date('2024-01-15') },
      { id: 'TX002', order_id: 'OD002', type: 'sell', symbol: '600519', name: '贵州茅台', price: 1725, quantity: 100, amount: 172500, transaction_time: new Date('2024-01-20'), created_at: new Date('2024-01-20') },
      { id: 'TX003', order_id: 'OD003', type: 'buy', symbol: '000333', name: '美的集团', price: 62.5, quantity: 200, amount: -12500, transaction_time: new Date('2024-02-01'), created_at: new Date('2024-02-01') },
      { id: 'TX004', order_id: 'OD004', type: 'sell', symbol: '000333', name: '美的集团', price: 65, quantity: 200, amount: 13000, transaction_time: new Date('2024-02-10'), created_at: new Date('2024-02-10') },
      { id: 'TX005', order_id: 'OD005', type: 'buy', symbol: '601318', name: '中国平安', price: 45.2, quantity: 300, amount: -13560, transaction_time: new Date('2024-03-01'), created_at: new Date('2024-03-01') },
      { id: 'TX006', order_id: 'OD006', type: 'sell', symbol: '601318', name: '中国平安', price: 46.8, quantity: 300, amount: 14040, transaction_time: new Date('2024-03-10'), created_at: new Date('2024-03-10') },
    ];

    console.log('正在初始化 transactions...');
    for (const t of transactions) {
      await pool.query(
        `INSERT INTO transactions (id, order_id, type, symbol, name, price, quantity, amount, transaction_time, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [t.id, t.order_id, t.type, t.symbol, t.name, t.price, t.quantity, t.amount, t.transaction_time, t.created_at]
      );
    }
    console.log(`已插入 ${transactions.length} 条 transactions`);

    // 初始化 trade_records (交易记录)
    const tradeRecords = [
      { 
        id: 'TR001', symbol: '600519', name: '贵州茅台',
        buy_order_id: 'OD001', sell_order_id: 'OD002',
        buy_price: 1650, buy_quantity: 100, buy_time: new Date('2024-01-15'),
        sell_price: 1725, sell_quantity: 100, sell_time: new Date('2024-01-20'),
        buy_amount: 165000, sell_amount: 172500, profit: 7500, profit_percent: 4.55,
        hold_duration: 5, overall_score: 85, buy_grade: 'A', sell_grade: 'A',
        created_at: new Date('2024-01-20')
      },
      { 
        id: 'TR002', symbol: '000333', name: '美的集团',
        buy_order_id: 'OD003', sell_order_id: 'OD004',
        buy_price: 62.5, buy_quantity: 200, buy_time: new Date('2024-02-01'),
        sell_price: 65, sell_quantity: 200, sell_time: new Date('2024-02-10'),
        buy_amount: 12500, sell_amount: 13000, profit: 500, profit_percent: 4,
        hold_duration: 9, overall_score: 80, buy_grade: 'B', sell_grade: 'B',
        created_at: new Date('2024-02-10')
      },
      { 
        id: 'TR003', symbol: '601318', name: '中国平安',
        buy_order_id: 'OD005', sell_order_id: 'OD006',
        buy_price: 45.2, buy_quantity: 300, buy_time: new Date('2024-03-01'),
        sell_price: 46.8, sell_quantity: 300, sell_time: new Date('2024-03-10'),
        buy_amount: 13560, sell_amount: 14040, profit: 480, profit_percent: 3.54,
        hold_duration: 9, overall_score: 75, buy_grade: 'B', sell_grade: 'B',
        created_at: new Date('2024-03-10')
      },
    ];

    console.log('正在初始化 trade_records...');
    for (const r of tradeRecords) {
      await pool.query(
        `INSERT INTO trade_records (id, symbol, name, buy_order_id, sell_order_id, buy_price, buy_quantity, buy_time, sell_price, sell_quantity, sell_time, buy_amount, sell_amount, profit, profit_percent, hold_duration, overall_score, buy_grade, sell_grade, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [r.id, r.symbol, r.name, r.buy_order_id, r.sell_order_id, r.buy_price, r.buy_quantity, r.buy_time, r.sell_price, r.sell_quantity, r.sell_time, r.buy_amount, r.sell_amount, r.profit, r.profit_percent, r.hold_duration, r.overall_score, r.buy_grade, r.sell_grade, r.created_at]
      );
    }
    console.log(`已插入 ${tradeRecords.length} 条 trade_records`);

    console.log('\n数据初始化完成！');
  } catch (error) {
    console.error('初始化失败:', error.message);
  } finally {
    pool.end();
  }
}

initData();
