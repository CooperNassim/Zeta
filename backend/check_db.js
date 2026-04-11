const { pool } = require('./src/config/database');

async function checkDatabase() {
  const client = await pool.connect();
  try {
    // 检查market_quotes表
    const marketResult = await client.query('SELECT COUNT(*) FROM market_quotes');
    console.log('market_quotes表记录数:', marketResult.rows[0].count);
    
    // 检查特定股票
    const stockResult = await client.query('SELECT * FROM market_quotes WHERE symbol = $1', ['301563']);
    console.log('301563股票在market_quotes表中的记录:', stockResult.rows.length > 0 ? '存在' : '不存在');
    if (stockResult.rows.length > 0) {
      console.log('详细数据:', JSON.stringify(stockResult.rows[0], null, 2));
    }
    
    // 检查stock_pool表
    const poolResult = await client.query('SELECT COUNT(*) FROM stock_pool');
    console.log('stock_pool表记录数:', poolResult.rows[0].count);
    
    // 检查301563在stock_pool表
    const poolStockResult = await client.query('SELECT * FROM stock_pool WHERE symbol = $1', ['301563']);
    console.log('301563股票在stock_pool表中的记录:', poolStockResult.rows.length > 0 ? '存在' : '不存在');
    if (poolStockResult.rows.length > 0) {
      console.log('详细数据:', JSON.stringify(poolStockResult.rows[0], null, 2));
    }
    
  } finally {
    client.release();
  }
}

checkDatabase().catch(console.error);