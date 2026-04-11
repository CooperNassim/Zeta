import { pool } from './backend/src/config/database.js';

async function checkStockData() {
  const client = await pool.connect();
  
  try {
    console.log('=== 检查stock_pool表数据 ===');
    const stockPoolResult = await client.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN status != 'deleted' THEN 1 END) as active,
             COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted
      FROM stock_pool
    `);
    console.log('stock_pool表统计:', stockPoolResult.rows[0]);
    
    const activeStocks = await client.query(`
      SELECT symbol, name, current_price, status 
      FROM stock_pool 
      WHERE status != 'deleted' 
      ORDER BY symbol
    `);
    console.log(`活跃股票数量: ${activeStocks.rows.length}`);
    console.log('前10只活跃股票:', activeStocks.rows.slice(0, 10));
    
    console.log('\n=== 检查market_quotes表数据 ===');
    const marketQuotesResult = await client.query(`
      SELECT COUNT(*) as total FROM market_quotes
    `);
    console.log('market_quotes表统计:', marketQuotesResult.rows[0]);
    
    const recentStocks = await client.query(`
      SELECT symbol, name, current_price, timestamp 
      FROM market_quotes 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    console.log('最近更新的10只股票:', recentStocks.rows);
    
    console.log('\n=== 检查是否有301563等新下载的股票 ===');
    const testStock = await client.query(`
      SELECT symbol, name, current_price, status
      FROM stock_pool 
      WHERE symbol = '301563'
    `);
    console.log('股票301563在stock_pool表:', testStock.rows[0] || '未找到');
    
    const testStockMarket = await client.query(`
      SELECT symbol, name, current_price, timestamp
      FROM market_quotes
      WHERE symbol = '301563'
    `);
    console.log('股票301563在market_quotes表:', testStockMarket.rows[0] || '未找到');
    
  } catch (error) {
    console.error('查询数据库时出错:', error);
  } finally {
    client.release();
  }
}

checkStockData().then(() => {
  console.log('数据检查完成');
  process.exit(0);
}).catch(error => {
  console.error('检查过程出错:', error);
  process.exit(1);
});