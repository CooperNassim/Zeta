require('dotenv').config();
const { pool } = require('./src/config/database');

async function checkCurrentState() {
  console.log('=== 检查当前数据库状态 ===\n');

  try {
    // 1. 查看所有订单（包括已删除）
    console.log('1. 所有订单（包括已删除）:');
    const allOrders = await pool.query('SELECT id, trade_number, symbol, deleted, deleted_at FROM trade_orders ORDER BY created_at DESC LIMIT 10');
    allOrders.rows.forEach(order => {
      console.log(`  ID: ${order.id}, 交易编号: ${order.trade_number}, 股票: ${order.symbol}, 删除: ${order.deleted}, 删除时间: ${order.deleted_at}`);
    });
    console.log('');

    // 2. 查看未删除的订单
    console.log('2. 未删除的订单:');
    const activeOrders = await pool.query("SELECT id, trade_number, symbol FROM trade_orders WHERE deleted = false ORDER BY created_at DESC LIMIT 10");
    activeOrders.rows.forEach(order => {
      console.log(`  ID: ${order.id}, 交易编号: ${order.trade_number}, 股票: ${order.symbol}`);
    });
    console.log('');

    console.log(`总计: ${allOrders.rows.length} 条记录，其中 ${activeOrders.rows.length} 条未删除\n`);

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

checkCurrentState();
