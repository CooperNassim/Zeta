const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'zeta_trading',
  user: 'postgres',
  password: '960717',
});

async function deleteTradeRecords() {
  try {
    await client.connect();
    
    // 先查看数据量
    const countResult = await client.query('SELECT COUNT(*) FROM trade_records');
    console.log(`当前 trade_records 表中的数据量: ${countResult.rows[0].count}`);
    
    if (parseInt(countResult.rows[0].count) === 0) {
      console.log('表已经是空的，无需删除');
      return;
    }
    
    // 执行硬删除
    const result = await client.query('DELETE FROM trade_records');
    console.log(`已删除 trade_records 表中的所有数据`);
    
    // 验证删除结果
    const verifyResult = await client.query('SELECT COUNT(*) FROM trade_records');
    console.log(`删除后数据量: ${verifyResult.rows[0].count}`);
    
  } catch (error) {
    console.error('删除失败:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

deleteTradeRecords();
