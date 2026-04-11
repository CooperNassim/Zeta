require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function checkBothTables() {
  const client = await pool.connect();
  try {
    console.log('🔍 对比两个表的数据...\n');
    
    // 1. 检查market_quotes表 (API查询的表)
    console.log('1. market_quotes表（API查询的表）:');
    const marketQuotesResult = await client.query(`
      SELECT symbol, name, current_price, change_percent, timestamp 
      FROM market_quotes 
      WHERE symbol = '301563' 
      ORDER BY timestamp DESC 
      LIMIT 5;
    `);
    
    console.log(`   查询到 ${marketQuotesResult.rows.length} 条记录:`);
    marketQuotesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.symbol} | ${row.name} | ¥${row.current_price} | ${row.change_percent}% | ${row.timestamp}`);
    });
    
    // 2. 检查stock_pool表 (行情中心应该查询的表)
    console.log('\n2. stock_pool表（行情中心应该查询的表）:');
    const stockPoolResult = await client.query(`
      SELECT symbol, name, current_price, change_percent, status, updated_at 
      FROM stock_pool 
      WHERE symbol = '301563';
    `);
    
    console.log(`   查询到 ${stockPoolResult.rows.length} 条记录:`);
    stockPoolResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.symbol} | ${row.name} | ¥${row.current_price} | ${row.change_percent}% | ${row.status} | ${row.updated_at}`);
    });
    
    // 3. 检查API实际返回的数据
    console.log('\n3. 模拟API返回的数据:');
    const apiResult = await client.query(`
      SELECT symbol, name, current_price, change_percent, timestamp 
      FROM market_quotes 
      ORDER BY symbol
    `);
    console.log(`   API返回记录数: ${apiResult.rows.length}`);
    console.log(`   包含301563: ${apiResult.rows.some(row => row.symbol === '301563')}`);
    
    // 4. 修正API查询，应该从stock_pool表获取数据（只查现有字段）
    console.log('\n4. 修正后的API查询（从stock_pool表）:');
    const correctedQuery = await client.query(`
      SELECT 
        symbol, name, current_price, change_percent, market, sector, status, updated_at as timestamp
      FROM stock_pool 
      WHERE status != 'deleted'
      ORDER BY symbol
    `);
    
    console.log(`   修正后查询记录数: ${correctedQuery.rows.length}`);
    console.log(`   包含301563: ${correctedQuery.rows.some(row => row.symbol === '301563')}`);
    
    if (correctedQuery.rows.some(row => row.symbol === '301563')) {
      const stockInfo = correctedQuery.rows.find(row => row.symbol === '301563');
      console.log(`   301563详情: ${stockInfo.symbol} | ${stockInfo.name} | ¥${stockInfo.current_price} | ${stockInfo.change_percent}%`);
    }
    
  } catch (error) {
    console.error('❌ 查询数据库时出错:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkBothTables().catch(console.error);