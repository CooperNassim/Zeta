const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function checkTransactionsData() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'zeta_trading',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    await client.connect();
    
    console.log('📊 交易记录表所有字段和部分数据查看:');
    
    // 查看表结构
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 transactions表字段结构:');
    schemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}) - 可空: ${row.is_nullable}`);
    });
    
    // 查看最近10条交易记录的详细数据
    const dataResult = await client.query(`
      SELECT * FROM transactions 
      WHERE transaction_type = '股票买入'
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n🔍 最近10条股票买入交易记录详情:');
    console.log('字段名:');
    if (dataResult.rows.length > 0) {
      console.log(Object.keys(dataResult.rows[0]));
    }
    
    console.log('\n数据内容:');
    dataResult.rows.forEach((row, index) => {
      console.log(`\n--- 记录 ${index + 1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`交易类型: ${row.transaction_type}`);
      console.log(`股票代码: ${row.symbol}`);
      console.log(`金额: ${row.amount}`);
      console.log(`余额: ${row.balance}`);
      console.log(`删除状态: ${row.deleted}`);
      console.log(`账户类型: ${row.account_type}`);
      console.log(`交易编号: ${row.trade_number}`);
      
      // 检查所有可能的交易状态字段
      console.log('可能的状态字段值:');
      console.log(`  交易状态字段不存在`);
      
      // 显示所有字段
      console.log('完整字段结构:');
      Object.keys(row).forEach(key => {
        if (['交易状态', 'trade_status', 'status', 'state'].some(statusField => key.toLowerCase().includes(statusField.toLowerCase()))) {
          console.log(`  ${key}: ${row[key]}`);
        }
      });
    });
    
    // 检查是否有包含"交易状态"信息的关联表
    console.log('\n🔎 检查关联表 (trade_orders) 的状态字段:');
    const ordersResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'trade_orders'
      AND column_name ILIKE '%status%'
    `);
    
    if (ordersResult.rows.length > 0) {
      console.log('trade_orders表的状态字段:');
      ordersResult.rows.forEach(row => {
        console.log(`  ${row.column_name} (${row.data_type}) - 可空: ${row.is_nullable}`);
      });
      
      // 查看trade_orders中的数据
      const ordersData = await client.query(`
        SELECT id, order_type, symbol, price, quantity, status
        FROM trade_orders 
        WHERE deleted = false
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('\n🔍 trade_orders表中的状态数据:');
      ordersData.rows.forEach(row => {
        console.log(`  ID: ${row.id}, 类型: ${row.order_type}, 股票: ${row.symbol}, 状态: ${row.status}`);
      });
    }
    
  } catch (err) {
    console.error('数据库操作失败:', err);
  } finally {
    await client.end();
  }
}

checkTransactionsData();