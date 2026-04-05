// 添加 strategy_id 字段到 trade_orders 表的脚本
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function addStrategyIdField() {
  const client = await pool.connect();
  
  try {
    console.log('开始添加 strategy_id 字段到 trade_orders 表...');
    
    // 检查表结构
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'trade_orders' AND column_name = 'strategy_id';
    `);
    
    if (tableInfo.rows.length > 0) {
      console.log('strategy_id 字段已存在:', tableInfo.rows[0]);
      return;
    }
    
    // 添加 strategy_id 字段
    await client.query(`
      ALTER TABLE trade_orders 
      ADD COLUMN strategy_id INTEGER,
      ADD CONSTRAINT fk_trade_orders_strategy 
        FOREIGN KEY (strategy_id) 
        REFERENCES strategy_records(id);
    `);
    
    console.log('✅ strategy_id 字段添加成功，并创建了外键约束');
    
    // 验证字段已添加
    const verifyQuery = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'trade_orders' AND column_name = 'strategy_id';
    `);
    
    console.log('验证结果:', verifyQuery.rows[0]);
    
  } catch (error) {
    console.error('❌ 添加字段失败:', error.message);
    
    // 如果外键约束失败，尝试添加不带外键的字段
    if (error.message.includes('foreign key constraint')) {
      console.log('尝试添加不带外键约束的字段...');
      
      await client.query(`
        ALTER TABLE trade_orders 
        ADD COLUMN strategy_id INTEGER;
      `);
      
      console.log('✅ strategy_id 字段添加成功（不带外键约束）');
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

addStrategyIdField().catch(console.error);