const {pool} = require('./src/config/database');

(async () => {
  // 查看"其他"类到底是什么
  console.log('查看"其他"类symbol示例(前50个):');
  const others = await pool.query(`
    SELECT symbol, name FROM stock_pool 
    WHERE deleted = false 
    AND symbol NOT LIKE '68%'
    AND symbol NOT LIKE '6%'
    AND symbol NOT LIKE '30%'
    AND symbol NOT LIKE '002%'
    AND symbol NOT LIKE '00%'
    AND symbol NOT LIKE '920%'
    AND symbol NOT LIKE '8%'
    AND symbol NOT LIKE '4%'
    ORDER BY symbol
    LIMIT 50
  `);

  console.log('symbol\t\tname');
  console.log('-'.repeat(40));
  others.rows.forEach(r => console.log(`${r.symbol}\t\t${r.name}`));

  // 统计"其他"中的不同前缀
  console.log('\n"其他"类前缀分布:');
  const prefixStats = await pool.query(`
    SELECT 
      LEFT(symbol, 2) as prefix,
      COUNT(*) as cnt
    FROM stock_pool
    WHERE deleted = false
    AND symbol NOT LIKE '68%'
    AND symbol NOT LIKE '6%'
    AND symbol NOT LIKE '30%'
    AND symbol NOT LIKE '002%'
    AND symbol NOT LIKE '00%'
    AND symbol NOT LIKE '920%'
    AND symbol NOT LIKE '8%'
    AND symbol NOT LIKE '4%'
    GROUP BY LEFT(symbol, 2)
    ORDER BY cnt DESC
    LIMIT 20
  `);

  prefixStats.rows.forEach(r => console.log(`  ${r.prefix}开头: ${r.cnt} 条`));

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
