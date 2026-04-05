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
    
    // 查询交易记录中实际存储的策略数据
    const res = await client.query(`
      SELECT 
        id, trade_number, symbol, profit,
        buy_strategy_id, 
        buy_strategy,
        buy_strategy_score,
        trading_strategy,
        strategy_score,
        strategy_id
      FROM trade_records 
      WHERE profit < 0 
      AND EXTRACT(MONTH FROM created_at) = 4
      AND EXTRACT(YEAR FROM created_at) = 2026
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    console.log('=== 数据库中的实际数据 ===');
    if (res.rows.length === 0) {
      console.log('本月没有亏损记录');
    } else {
      res.rows.forEach(row => {
        console.log('---');
        console.log('交易编号:', row.trade_number);
        console.log('股票代码:', row.symbol);
        console.log('盈亏:', row.profit);
        console.log('buy_strategy_id (买入策略ID):', row.buy_strategy_id);
        console.log('buy_strategy (买入策略):', row.buy_strategy);
        console.log('trading_strategy (交易策略):', row.trading_strategy);
        console.log('strategy_id (策略ID):', row.strategy_id);
        console.log('buy_strategy_score (买入策略得分):', row.buy_strategy_score);
        console.log('strategy_score (策略得分):', row.strategy_score);
      });
    }
    
    await client.end();
  } catch (err) {
    console.error('错误:', err);
  }
})();