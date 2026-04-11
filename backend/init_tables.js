const { pool } = require('./src/config/database');

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('开始创建数据库表...');
    
    // 创建stock_pool表（股票池）
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
    
    // 创建market_quotes表（实时行情）
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

// 创建表并检查状态
createTables()
  .then(() => {
    console.log('数据库表初始化成功');
    // 重新检查数据
    return require('./check_db')();
  })
  .catch(error => {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  });