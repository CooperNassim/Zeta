const {pool} = require('./src/config/database');

(async () => {
  const [noName, emptyName, hasName, samples] = await Promise.all([
    pool.query('SELECT COUNT(*) as cnt FROM stock_pool WHERE deleted = false AND name IS NULL'),
    pool.query("SELECT COUNT(*) as cnt FROM stock_pool WHERE deleted = false AND name = ''"),
    pool.query("SELECT COUNT(*) as cnt FROM stock_pool WHERE deleted = false AND name IS NOT NULL AND name <> ''"),
    pool.query("SELECT symbol, name FROM stock_pool WHERE deleted = false AND (name IS NULL OR name = '') ORDER BY symbol LIMIT 10")
  ]);
  console.log('name为NULL:', noName.rows[0].cnt);
  console.log('name为空字符串:', emptyName.rows[0].cnt);
  console.log('name有值:', hasName.rows[0].cnt);
  console.log('名称为空的示例:');
  samples.rows.forEach(r => console.log('  ', r.symbol, '|', r.name));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
