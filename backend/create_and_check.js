const { pool } = require('./src/config/database');

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('开始创建数据库表...');
    
    // 创建stock_pool表
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_pool (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        market VARCHAR(10) NOT NULL,
        exchange VARCHAR(20),
        sector VARCHAR(50),
        current_price DECIMAL(10,4) DEFAULT 0,
        change_percent DECIMAL(8,4) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ stock_pool表创建/检查完成');
    
    // 创建market_quotes表
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_quotes (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        current_price DECIMAL(10,4) DEFAULT 0,
        prev_close DECIMAL(10,4) DEFAULT 0,
        change_percent DECIMAL(8,4) DEFAULT 0,
        volume BIGINT DEFAULT 0,
        high_price DECIMAL(10,4) DEFAULT 0,
        low_price DECIMAL(10,4) DEFAULT 0,
        open_price DECIMAL(10,4) DEFAULT 0,
        amount DECIMAL(15,2) DEFAULT 0,
        market VARCHAR(10) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ market_quotes表创建/检查完成');
    
    await client.query('COMMIT');
    console.log('✅ 所有表创建完成');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('创建表失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function checkDatabase() {
  const client = await pool.connect();
  try {
    console.log('\n🔍 检查当前数据库状态...');
    
    // 检查market_quotes表
    const marketResult = await client.query('SELECT COUNT(*) FROM market_quotes');
    console.log('market_quotes表记录数:', marketResult.rows[0].count);
    
    // 检查所有股票
    const allStocks = await client.query('SELECT symbol, name FROM market_quotes');
    console.log('market_quotes表中现有股票:', allStocks.rows.map(r => r.symbol).join(', ') || '无');
    
    // 检查特定股票
    const stockResult = await client.query('SELECT * FROM market_quotes WHERE symbol = $1', ['301563']);
    console.log('301563股票在market_quotes表中的记录:', stockResult.rows.length > 0 ? '存在' : '不存在');
    if (stockResult.rows.length > 0) {
      console.log('详细数据:', JSON.stringify(stockResult.rows[0], null, 2));
    }
    
    // 检查stock_pool表
    const poolResult = await client.query('SELECT COUNT(*) FROM stock_pool');
    console.log('stock_pool表记录数:', poolResult.rows[0].count);
    
    // 检查stock_pool中的所有股票
    const allPoolStocks = await client.query('SELECT symbol, name FROM stock_pool');
    console.log('stock_pool表中现有股票:', allPoolStocks.rows.map(r => r.symbol).join(', ') || '无');
    
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

// 主程序
async function main() {
  try {
    await createTables();
    await checkDatabase();
    console.log('\n✅ 数据库检查和初始化完成');
  } catch (error) {
    console.error('❌ 程序执行失败:', error);
    process.exit(1);
  }
}

main();