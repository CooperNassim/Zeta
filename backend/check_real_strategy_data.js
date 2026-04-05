const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'zeta',
  user: 'postgres',
  password: '123456'
});

(async () => {
  try {
    await client.connect();
    
    // 查询交易记录中所有可能的策略字段
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trade_records' 
      AND column_name LIKE '%strategy%' 
      OR column_name LIKE '%buy_strategy%'
      ORDER BY column_name
    `);
    
    console.log('=== 交易记录表中所有策略相关字段 ===');
    columnsRes.rows.forEach(row => {
      console.log('字段名:', row.column_name, '类型:', row.data_type);
    });
    
    // 查询最近亏损记录的完整策略数据
    console.log('\\n=== 近期亏损记录的完整策略字段数据 ===');
    const dataRes = await client.query(`
      SELECT * 
      FROM trade_records 
      WHERE profit < 0 
      AND EXTRACT(MONTH FROM created_at) = 4
      AND EXTRACT(YEAR FROM created_at) = 2026
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (dataRes.rows.length > 0) {
      const record = dataRes.rows[0];
      console.log('交易记录ID:', record.id);
      console.log('交易编号:', record.trade_number);
      console.log('股票代码:', record.symbol);
      console.log('盈亏:', record.profit);
      
      // 输出所有策略相关的字段
      console.log('\\n策略相关字段值:');
      for (const [key, value] of Object.entries(record)) {
        if (key.includes('strategy') || key.includes('buy_strategy') || key.includes('trading_strategy')) {
          console.log(`${key}:`, value);
        }
      }
      
      // 如果有策略ID，查询对应的策略名称
      if (record.buy_strategy_id) {
        console.log('\\n=== 查询策略ID对应的策略名称 ===');
        const strategyRes = await client.query(`
          SELECT id, name, strategy_type 
          FROM trading_strategies 
          WHERE id = $1 AND deleted = false
        `, [record.buy_strategy_id]);
        
        if (strategyRes.rows.length > 0) {
          console.log('策略名称:', strategyRes.rows[0].name);
          console.log('策略类型:', strategyRes.rows[0].strategy_type);
        } else {
          console.log('未找到对应的策略');
        }
      }
    }
    
    await client.end();
  } catch (err) {
    console.error('错误:', err);
  }
})();