const {pool} = require('./src/config/database');

(async () => {
  // 简单统计
  const total = await pool.query(`
    SELECT COUNT(*) as cnt FROM stock_pool WHERE deleted = false
  `);
  const unique = await pool.query(`
    SELECT COUNT(DISTINCT symbol) as cnt FROM stock_pool WHERE deleted = false
  `);

  console.log(`总记录数: ${total.rows[0].cnt}`);
  console.log(`唯一symbol数: ${unique.rows[0].cnt}`);
  console.log(`重复记录: ${total.rows[0].cnt - unique.rows[0].cnt}`);

  // 按前缀分类统计
  console.log('\n按代码前缀分布:');

  const prefixes = [
    { pattern: '68%', label: '科创板' },
    { pattern: '6%', label: '沪市主板' },
    { pattern: '30%', label: '创业板' },
    { pattern: '002%', label: '中小板' },
    { pattern: '00%', label: '深市主板' },
    { pattern: '920%', label: '北交所' },
    { pattern: '8%', label: '北交所(老代码)' },
    { pattern: '4%', label: '北交所(老代码)' },
    { pattern: '51%', label: 'ETF/基金' },
    { pattern: '52%', label: 'ETF/基金' },
    { pattern: '15%', label: '可转债' },
    { pattern: '16%', label: '基金' },
    { pattern: '50%', label: 'ETF' },
    { pattern: '56%', label: 'ETF' },
    { pattern: '58%', label: 'ETF' },
  ];

  let counted = 0;
  for (const { pattern, label } of prefixes) {
    const result = await pool.query(`
      SELECT COUNT(DISTINCT symbol) as cnt FROM stock_pool
      WHERE deleted = false AND symbol LIKE '${pattern}'
    `);
    const cnt = parseInt(result.rows[0].cnt);
    if (cnt > 0) {
      console.log(`  ${label} (${pattern}): ${cnt}`);
      counted += cnt;
    }
  }

  // 其他
  const notLikeConditions = prefixes.map(p => `symbol NOT LIKE '${p.pattern}'`).join(' AND ');
  const others = await pool.query(`
    SELECT COUNT(DISTINCT symbol) as cnt FROM stock_pool
    WHERE deleted = false AND ${notLikeConditions}
  `);
  console.log(`  其他: ${others.rows[0].cnt}`);

  console.log(`\n纯A股股票数量(不含ETF/基金/债券): ${unique.rows[0].cnt - parseInt(others.rows[0].cnt)}`);
  console.log(`A股总股票约5000+，当前数据包含ETF/基金/债券等`);

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
