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
    
    console.log('=== 检查当月亏损记录的策略字段 ===');
    
    // 查询当月亏损记录
    const res = await client.query(`
      SELECT 
        id, 
        trade_number,
        symbol,
        buy_strategy_id,
        buy_strategy,
        trading_strategy,
        buy_price,
        sell_price,
        profit,
        profit_rate,
        status,
        created_at
      FROM trade_records 
      WHERE profit < 0 
      AND EXTRACT(MONTH FROM created_at) = 4
      AND EXTRACT(YEAR FROM created_at) = 2026
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('当月亏损记录：');
    res.rows.forEach(row => {
      console.log('---');
      console.log('交易编号:', row.trade_number);
      console.log('股票代码:', row.symbol);
      console.log('买入策略ID:', row.buy_strategy_id);
      console.log('买入策略:', row.buy_strategy);
      console.log('交易策略:', row.trading_strategy);
      console.log('盈亏:', row.profit);
    });
    
    // 检查策略表数据
    console.log('\n=== 检查策略表数据 ===');
    const strategiesRes = await client.query('SELECT id, name, strategy_type FROM trading_strategies WHERE deleted = false LIMIT 5');
    console.log('策略表数据：');
    strategiesRes.rows.forEach(row => {
      console.log('ID:', row.id, '名称:', row.name, '类型:', row.strategy_type);
    });
    
    await client.end();
  } catch (err) {
    console.error('查询错误:', err);
  }
})();