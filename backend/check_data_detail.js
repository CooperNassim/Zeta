require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

(async () => {
  const client = await pool.connect();
  try {
    // 检查买入订单
    const buyOrders = await client.query(`
      SELECT id, trade_number, order_type, symbol, name, quantity, price, deleted 
      FROM trade_orders 
      WHERE order_type = '买入'
      ORDER BY created_at DESC
    `);
    
    console.log('=== 所有买入订单 ===');
    console.table(buyOrders.rows);

    // 检查交易记录
    const records = await client.query(`
      SELECT id, trade_number, symbol, buy_quantity, buy_price, deleted
      FROM trade_records 
      ORDER BY created_at DESC
    `);
    
    console.log('\n=== 所有交易记录 ===');
    console.table(records.rows);

    // 检查trade_number="20260325001"的订单和记录
    const specificOrder = await client.query(`
      SELECT id, trade_number, order_type, symbol, quantity, price, deleted 
      FROM trade_orders 
      WHERE trade_number = '20260325001'
    `);
    
    console.log('\n=== trade_number=20260325001 的订单 ===');
    console.table(specificOrder.rows);

    const specificRecord = await client.query(`
      SELECT * FROM trade_records 
      WHERE trade_number = '20260325001'
    `);
    
    console.log('\n=== trade_number=20260325001 的交易记录 ===');
    console.table(specificRecord.rows);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
