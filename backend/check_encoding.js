const {pool} = require('./src/config/database');

(async () => {
  const samples = await pool.query(
    "SELECT symbol, name, name::bytea as name_bytes FROM stock_pool WHERE deleted = false ORDER BY updated_at DESC LIMIT 10"
  );
  console.log('最近更新的股票名称:');
  samples.rows.forEach(r => {
    console.log(`  ${r.symbol}: "${r.name}" (length: ${r.name?.length || 0})`);
  });
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
