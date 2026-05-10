const {pool} = require('./src/config/database');

(async () => {
  const [total, valid, remaining] = await Promise.all([
    pool.query('SELECT COUNT(*) as cnt FROM stock_pool WHERE deleted = false'),
    pool.query("SELECT COUNT(*) as cnt FROM stock_pool WHERE deleted = false AND name IS NOT NULL AND name <> '' AND position(E'\\xef\\xbf\\xbd' in name) = 0"),
    pool.query("SELECT symbol, name FROM stock_pool WHERE deleted = false AND (name IS NULL OR name = '' OR position(E'\\xef\\xbf\\xbd' in name) > 0) ORDER BY symbol LIMIT 5")
  ]);

  console.log(`总股票数: ${total.rows[0].cnt}`);
  console.log(`有效名称: ${valid.rows[0].cnt}`);
  console.log(`剩余问题: ${total.rows[0].cnt - valid.rows[0].cnt}`);
  console.log('剩余问题股票示例:');
  remaining.rows.forEach(r => console.log(`  ${r.symbol}: "${r.name}"`));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
