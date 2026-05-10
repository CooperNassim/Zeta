const {pool} = require('./src/config/database');

(async () => {
  // 检查重复的symbol
  const duplicates = await pool.query(`
    SELECT symbol, COUNT(*) as count, MAX(id) as max_id, MIN(id) as min_id
    FROM stock_pool
    WHERE deleted = false
    GROUP BY symbol
    HAVING COUNT(*) > 1
    ORDER BY count DESC, symbol
    LIMIT 20
  `);

  if (duplicates.rows.length > 0) {
    console.log('发现重复的股票:');
    duplicates.rows.forEach(r => {
      console.log(`  ${r.symbol}: ${r.count} 条记录 (ID: ${r.min_id}-${r.max_id})`);
    });

    // 统计总重复数
    const totalDups = await pool.query(`
      SELECT COUNT(*) as cnt FROM (
        SELECT symbol FROM stock_pool
        WHERE deleted = false
        GROUP BY symbol
        HAVING COUNT(*) > 1
      ) t
    `);
    console.log(`\n共 ${totalDups.rows[0].cnt} 个symbol有重复记录`);
  } else {
    console.log('未发现重复股票');
  }

  // 统计unique symbol数量
  const uniqueCount = await pool.query(`
    SELECT COUNT(DISTINCT symbol) as cnt FROM stock_pool WHERE deleted = false
  `);
  const totalCount = await pool.query(`
    SELECT COUNT(*) as cnt FROM stock_pool WHERE deleted = false
  `);
  console.log(`\n总记录数: ${totalCount.rows[0].cnt}`);
  console.log(`唯一symbol数: ${uniqueCount.rows[0].cnt}`);
  console.log(`重复记录数: ${totalCount.rows[0].cnt - uniqueCount.rows[0].cnt}`);

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
