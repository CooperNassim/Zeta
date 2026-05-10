const {pool} = require('./src/config/database');

(async () => {
  // 找几只在截图中显示乱码的股票
  const targetSymbols = ['601878', '601877', '601998', '603259'];
  const results = await pool.query(
    "SELECT symbol, name, current_price, updated_at FROM stock_pool WHERE symbol = ANY($1) AND deleted = false",
    [targetSymbols]
  );
  console.log('目标股票:');
  results.rows.forEach(r => {
    const bytes = Buffer.from(r.name || '', 'utf8');
    console.log(`  ${r.symbol}: name="${r.name}" bytes=[${Array.from(bytes).join(',')}] len=${r.name?.length || 0}`);
  });
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
