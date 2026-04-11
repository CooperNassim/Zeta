require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function checkStockPoolConstraints() {
  const client = await pool.connect();
  try {
    // 检查stock_pool表的约束信息
    const result = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as constraint_def 
      FROM pg_constraint 
      WHERE conrelid = 'stock_pool'::regclass 
      AND contype IN ('p', 'u');
    `);
    
    if (result.rows.length === 0) {
      console.log('stock_pool表缺少唯一约束，需要添加symbol字段的唯一约束');
    } else {
      console.log('当前约束:');
      result.rows.forEach(row => {
        console.log(`- 约束名: ${row.conname}, 类型: ${row.contype}, 定义: ${row.constraint_def}`);
      });
    }
    
    // 检查表结构
    const tableInfo = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stock_pool' 
      ORDER BY ordinal_position;
    `);
    console.log('\nstock_pool表字段:', tableInfo.rows.map(r => r.column_name).join(', '));
    
    // 尝试添加唯一约束
    console.log('\n尝试添加symbol字段唯一约束...');
    try {
      await client.query(`
        ALTER TABLE stock_pool 
        ADD CONSTRAINT stock_pool_symbol_unique UNIQUE (symbol);
      `);
      console.log('✅ symbol字段唯一约束添加成功');
    } catch (addError) {
      console.log('❌ 添加约束失败，可能已存在:', addError.message);
      
      // 检查是否已存在symbol索引
      const indexCheck = await client.query(`
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'stock_pool' AND indexdef LIKE '%symbol%';
      `);
      console.log('symbol相关索引:', indexCheck.rows);
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkStockPoolConstraints().catch(console.error);