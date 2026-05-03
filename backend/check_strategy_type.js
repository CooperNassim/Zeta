const {pool} = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query('SELECT id, name, strategy_type FROM trading_strategies WHERE deleted = false LIMIT 5');
    console.log('trading_strategies strategy_type values:');
    res.rows.forEach(r => console.log(`  id=${r.id}, name="${r.name}", strategy_type="${r.strategy_type}"`));
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    pool.end();
  }
})();
