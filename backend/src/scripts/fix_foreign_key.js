// 修复外键约束问题
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function fixForeignKey() {
  const client = await pool.connect();
  
  try {
    console.log('开始修复外键约束问题...');
    
    // 检查外键约束是否存在
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'trade_orders' AND constraint_name = 'fk_trade_orders_strategy';
    `);
    
    if (constraints.rows.length > 0) {
      console.log('找到外键约束，准备删除...');
      
      // 删除外键约束
      await client.query(`
        ALTER TABLE trade_orders 
        DROP CONSTRAINT fk_trade_orders_strategy;
      `);
      
      console.log('✅ 外键约束已删除');
    } else {
      console.log('未找到外键约束 fk_trade_orders_strategy');
    }
    
    // 将 strategy_id 字段设置为可空（如果还未设置）
    await client.query(`
      ALTER TABLE trade_orders 
      ALTER COLUMN strategy_id DROP NOT NULL;
    `);
    
    console.log('✅ strategy_id 字段已设置为可空');
    
    // 验证修改
    const columnInfo = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'trade_orders' AND column_name = 'strategy_id';
    `);
    
    console.log('策略字段信息:', columnInfo.rows[0]);
    
  } catch (error) {
    console.error('修复失败:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixForeignKey().catch(console.error);