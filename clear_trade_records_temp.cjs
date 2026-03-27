/**
 * 清空交易记录的数据库数据
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function clearTradeRecords() {
  const client = await pool.connect();
  
  try {
    console.log('开始清空交易记录数据...\n');
    
    // 检查当前数据量
    const currentTradeRecords = await client.query('SELECT COUNT(*) FROM trade_records');
    const currentOrders = await client.query('SELECT COUNT(*) FROM orders');
    
    console.log('当前数据统计：');
    console.log(`  trade_records: ${currentTradeRecords.rows[0].count} 条`);
    console.log(`  orders: ${currentOrders.rows[0].count} 条\n`);
    
    // 开始事务
    await client.query('BEGIN');
    
    // 删除所有交易记录
    const tradeRecordsResult = await client.query('DELETE FROM trade_records');
    console.log(`✓ 删除了 ${tradeRecordsResult.rowCount} 条交易记录`);
    
    // 删除所有订单
    const ordersResult = await client.query('DELETE FROM orders');
    console.log(`✓ 删除了 ${ordersResult.rowCount} 条订单`);
    
    // 重置自增序列（如果有）
    try {
      await client.query('ALTER SEQUENCE trade_records_id_seq RESTART WITH 1');
      console.log('✓ 重置 trade_records ID 序列');
    } catch (e) {
      console.log('  (trade_records 序列不存在或无需重置)');
    }
    
    try {
      await client.query('ALTER SEQUENCE orders_id_seq RESTART WITH 1');
      console.log('✓ 重置 orders ID 序列');
    } catch (e) {
      console.log('  (orders 序列不存在或无需重置)');
    }
    
    // 提交事务
    await client.query('COMMIT');
    
    console.log('\n✅ 交易记录数据清空完成！');
    
    // 显示清空后的数据量
    const newTradeRecords = await client.query('SELECT COUNT(*) FROM trade_records');
    const newOrders = await client.query('SELECT COUNT(*) FROM orders');
    
    console.log('\n清空后数据统计：');
    console.log(`  trade_records: ${newTradeRecords.rows[0].count} 条`);
    console.log(`  orders: ${newOrders.rows[0].count} 条`);
    console.log('\n数据库已准备好重新使用。\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 清空数据时发生错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clearTradeRecords()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('错误:', err);
    process.exit(1);
  });
