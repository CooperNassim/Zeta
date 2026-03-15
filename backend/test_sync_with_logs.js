const { findAll } = require('./src/database/queries');

(async () => {
  try {
    console.log('正在测试所有表...');
    const tables = [
      'account',
      'daily_work_data',
      'psychological_test_results',
      'psychological_indicators',
      'trading_strategies',
      'risk_models',
      'risk_config',
      'account_risk_data',
      'technical_indicators',
      'orders',
      'transactions',
      'trade_records',
      'stock_pool',
      'stock_kline_data',
      'strategy_records',
      'scheduled_orders'
    ];

    for (const table of tables) {
      try {
        const data = await findAll(table);
        console.log(`${table}: ${data.length} records`);
      } catch (err) {
        console.error(`Error for table ${table}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
