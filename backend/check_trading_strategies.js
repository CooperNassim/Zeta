const {pool} = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query('SELECT id, name, strategy_type, status FROM trading_strategies WHERE deleted = false ORDER BY id');
    console.log('trading_strategies:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    pool.end();
  }
})();
