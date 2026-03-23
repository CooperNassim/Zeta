require('dotenv').config();
const { pool } = require('./src/config/database');

async function checkOrder23() {
  const client = await pool.connect();
  
  try {
    console.log('检查交易编号 20260322004 的所有订单：\n');
    
    const orders = await client.query(`
      SELECT 
        id, trade_number, order_type, quantity, buy_order_id, deleted
      FROM trade_orders
      WHERE trade_number = '20260322004'
      ORDER BY order_type
    `);
    
    console.log('结果:');
    for (const o of orders.rows) {
      console.log(`  ID=${o.id}, type=${o.order_type}, qty=${o.quantity}, buy_order_id=${o.buy_order_id}, deleted=${o.deleted}`);
    }
    
    // 检查是否有其他交易编号的买入订单
    console.log('\n检查所有未删除的买入订单：');
    const buyOrders = await client.query(`
      SELECT id, trade_number, quantity, deleted
      FROM trade_orders
      WHERE order_type = 'buy' AND deleted = false
      ORDER BY id
    `);
    
    for (const o of buyOrders.rows) {
      console.log(`  ID=${o.id}, trade_number=${o.trade_number}, qty=${o.quantity}, deleted=${o.deleted}`);
    }
    
    // 检查 ID=23 的详细信息
    console.log('\n检查 ID=23 的详细信息：');
    const order23 = await client.query(`
      SELECT * FROM trade_orders WHERE id = 23
    `);
    console.log(order23.rows[0]);
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkOrder23();
