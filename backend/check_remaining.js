const {pool} = require('./src/config/database');

(async () => {
  const remaining = await pool.query(
    "SELECT symbol FROM stock_pool WHERE deleted = false AND (name IS NULL OR name = '') ORDER BY symbol"
  );
  console.log(`还剩 ${remaining.rows.length} 只无名称的股票:`);
  remaining.rows.slice(0, 30).forEach(r => console.log('  ', r.symbol));
  if (remaining.rows.length > 30) console.log('  ...');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
