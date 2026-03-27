require('dotenv').config({ path: './backend/.env' });
const { pool } = require('./backend/src/config/database.js');

async function check() {
  try {
    // 检查trade_orders表
    const orders = await pool.query("SELECT * FROM trade_orders WHERE trade_number = '20260323001'");
    console.log('=== Trade Orders (20260323001) ===');
    console.log(JSON.stringify(orders.rows, null, 2));

    // 检查trade_records表
    const records = await pool.query("SELECT * FROM trade_records WHERE trade_number = '20260323001'");
    console.log('\n=== Trade Records (20260323001) ===');
    console.log(JSON.stringify(records.rows, null, 2));

    // 检查所有trade_records
    const allRecords = await pool.query('SELECT id, trade_number, symbol, name, buy_price, sell_price, created_at FROM trade_records ORDER BY created_at DESC LIMIT 10');
    console.log('\n=== Recent Trade Records ===');
    console.log(JSON.stringify(allRecords.rows, null, 2));

    // 检查最近的trade_orders
    const recentOrders = await pool.query('SELECT id, trade_number, order_type, symbol, name, price, quantity, status, created_at FROM trade_orders ORDER BY created_at DESC LIMIT 10');
    console.log('\n=== Recent Trade Orders ===');
    console.log(JSON.stringify(recentOrders.rows, null, 2));

    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
