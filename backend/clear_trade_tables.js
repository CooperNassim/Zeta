/**
 * 清空交易记录相关表的数据，用于测试环境重置
 * 
 * 注意：此脚本将删除以下表中的所有数据：
 * - trade_records (交易记录)
 * - orders (订单)
 * 
 * 使用方法：node backend/clear_trade_tables.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function clearTradeTables() {
  const client = await pool.connect();
  
  try {
    console.log('开始清空交易记录相关表...\n');
    
    // 开始事务
    await client.query('BEGIN');
    
    // 删除所有交易记录
    const tradeRecordsResult = await client.query('DELETE FROM trade_records');
    console.log(`✓ 删除了 ${tradeRecordsResult.rowCount} 条交易记录`);
    
    // 删除所有订单
    const ordersResult = await client.query('DELETE FROM orders');
    console.log(`✓ 删除了 ${ordersResult.rowCount} 条订单`);
    
    // 重置自增序列（如果有）
    await client.query('ALTER SEQUENCE trade_records_id_seq RESTART WITH 1');
    console.log('✓ 重置 trade_records ID 序列');
    
    await client.query('ALTER SEQUENCE orders_id_seq RESTART WITH 1');
    console.log('✓ 重置 orders ID 序列');
    
    // 提交事务
    await client.query('COMMIT');
    
    console.log('\n✅ 交易记录数据清空完成！');
    console.log('\n数据库已准备好重新测试。\n');
    
  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error('\n❌ 清空数据时发生错误:', error.message);
    console.error('已回滚所有操作。\n');
    throw error;
  } finally {
    client.release();
  }
}

async function checkDataCount() {
  const client = await pool.connect();
  
  try {
    // 检查各表的记录数
    const tradeRecords = await client.query('SELECT COUNT(*) FROM trade_records');
    const orders = await client.query('SELECT COUNT(*) FROM orders');
    
    console.log('当前数据统计：');
    console.log(`  trade_records: ${tradeRecords.rows[0].count} 条`);
    console.log(`  orders: ${orders.rows[0].count} 条`);
    console.log('');
    
  } catch (error) {
    console.error('检查数据时出错:', error.message);
  } finally {
    client.release();
  }
}

// 主函数
async function main() {
  try {
    // 先显示当前数据量
    await checkDataCount();
    
    // 确认操作
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('⚠️  确认要清空所有交易记录数据吗？此操作不可逆！(yes/no): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 'yes') {
      await clearTradeTables();
      // 显示清空后的数据量
      await checkDataCount();
    } else {
      console.log('❌ 操作已取消。\n');
    }
    
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { clearTradeTables, checkDataCount };
