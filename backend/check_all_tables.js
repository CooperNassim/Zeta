const {pool} = require('./src/config/database');

const tables = ['account', 'orders', 'transactions', 'trade_records', 'trade_orders', 'stock_pool', 'daily_work_data', 'psychological_test_results', 'psychological_indicators', 'trading_strategies'];

(async () => {
  for (const table of tables) {
    try {
      const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const resDeleted = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE deleted = true`);
      const resActive = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE deleted = false`);
      console.log(`${table}: 总计=${res.rows[0].count}, 已删除=${resDeleted.rows[0].count}, 未删除=${resActive.rows[0].count}`);
    } catch (e) {
      try {
        const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`${table}: 总计=${res.rows[0].count} (无deleted字段)`);
      } catch (e2) {
        console.log(`${table}: 不存在 - ${e2.message}`);
      }
    }
  }
  pool.end();
})();
