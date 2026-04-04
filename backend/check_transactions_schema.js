const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function checkTransactionsSchema() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'zeta_trading',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    await client.connect();
    
    // 检查transactions表的字段
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `);
    
    console.log('transactions表字段结构:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}) - 可空: ${row.is_nullable}`);
    });
    
    // 检查是否有trade_number字段，如果没有则需要添加
    const hasTradeNumber = result.rows.some(row => row.column_name === 'trade_number');
    
    if (!hasTradeNumber) {
      console.log('\n⚡ 需要添加trade_number字段到transactions表');
      await client.query(`
        ALTER TABLE transactions 
        ADD COLUMN trade_number VARCHAR(50)
      `);
      console.log('✅ 已成功添加trade_number字段');
    } else {
      console.log('✅ transactions表已包含trade_number字段');
    }
    
  } catch (err) {
    console.error('数据库操作失败:', err);
  } finally {
    await client.end();
  }
}

checkTransactionsSchema();