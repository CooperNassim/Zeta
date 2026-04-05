// 检查策略记录表数据
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function checkStrategyRecords() {
  const client = await pool.connect();
  
  try {
    console.log('检查策略记录表数据...');
    
    // 检查策略记录表中的所有记录
    const strategyRecords = await client.query('SELECT id, name FROM strategy_records ORDER BY id;');
    console.log('策略记录表数据:', strategyRecords.rows);
    
    // 检查当前订单中使用的策略ID
    const usedStrategyIds = await client.query(`
      SELECT DISTINCT strategy_id 
      FROM trade_orders 
      WHERE strategy_id IS NOT NULL 
      ORDER BY strategy_id;
    `);
    console.log('订单中使用的策略ID:', usedStrategyIds.rows);
    
    // 检查缺失的策略ID
    if (usedStrategyIds.rows.length > 0) {
      const missingIds = usedStrategyIds.rows.filter(row => 
        !strategyRecords.rows.some(sr => sr.id === row.strategy_id)
      );
      if (missingIds.length > 0) {
        console.log('缺失的策略ID:', missingIds);
      }
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkStrategyRecords().catch(console.error);