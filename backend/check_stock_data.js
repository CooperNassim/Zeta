require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function checkStockData() {
  const client = await pool.connect();
  try {
    console.log('🔍 检查301563股票数据...\n');
    
    // 1. 检查market_quotes表
    console.log('1. market_quotes表查询:');
    const marketQuotesResult = await client.query(`
      SELECT symbol, name, current_price, change_percent, volume, timestamp 
      FROM market_quotes 
      WHERE symbol = '301563' 
      ORDER BY timestamp DESC 
      LIMIT 5;
    `);
    
    console.log(`   查询到 ${marketQuotesResult.rows.length} 条记录:`);
    marketQuotesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.symbol} | ${row.name} | ¥${row.current_price} | ${row.change_percent}% | ${row.volume} | ${row.timestamp}`);
    });
    
    // 2. 检查stock_pool表
    console.log('\n2. stock_pool表查询:');
    const stockPoolResult = await client.query(`
      SELECT symbol, name, market, current_price, change_percent, status, updated_at 
      FROM stock_pool 
      WHERE symbol = '301563';
    `);
    
    console.log(`   查询到 ${stockPoolResult.rows.length} 条记录:`);
    stockPoolResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.symbol} | ${row.name} | ${row.market} | ¥${row.current_price} | ${row.change_percent}% | ${row.status} | ${row.updated_at}`);
    });
    
    // 3. 检查表记录总数
    console.log('\n3. 表记录统计:');
    const marketQuotesCount = await client.query('SELECT COUNT(*) FROM market_quotes');
    const stockPoolCount = await client.query('SELECT COUNT(*) FROM stock_pool');
    
    console.log(`   market_quotes表总记录数: ${marketQuotesCount.rows[0].count}`);
    console.log(`   stock_pool表总记录数: ${stockPoolCount.rows[0].count}`);
    
    // 4. 检查最近更新
    console.log('\n4. 最近更新时间:');
    const latestMarketQuotes = await client.query(`
      SELECT symbol, timestamp FROM market_quotes 
      ORDER BY timestamp DESC LIMIT 1;
    `);
    const latestStockPool = await client.query(`
      SELECT symbol, updated_at FROM stock_pool 
      ORDER BY updated_at DESC LIMIT 1;
    `);
    
    if (latestMarketQuotes.rows[0]) {
      console.log(`   market_quotes最近更新: ${latestMarketQuotes.rows[0].symbol} - ${latestMarketQuotes.rows[0].timestamp}`);
    }
    if (latestStockPool.rows[0]) {
      console.log(`   stock_pool最近更新: ${latestStockPool.rows[0].symbol} - ${latestStockPool.rows[0].updated_at}`);
    }
    
  } catch (error) {
    console.error('❌ 查询数据库时出错:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStockData().catch(console.error);