const {pool} = require('./src/config/database');

(async () => {
  // 查看stock_pool表结构
  const columns = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'stock_pool'
    ORDER BY ordinal_position
  `);

  console.log('stock_pool 表结构:');
  console.log('字段名\t\t\t\t类型\t\t\t\t可空');
  console.log('-'.repeat(70));
  columns.rows.forEach(r => {
    console.log(`${r.column_name}\t\t${r.data_type}\t\t\t${r.is_nullable}`);
  });

  // 查看最新数据示例（去掉trade_date字段）
  console.log('\n最新数据示例:');
  const samples = await pool.query(`
    SELECT symbol, name, current_price, change_percent, updated_at
    FROM stock_pool WHERE deleted = false
    ORDER BY updated_at DESC
    LIMIT 5
  `);
  samples.rows.forEach(r => console.log(`  ${r.symbol} ${r.name}: 价格=${r.current_price} 更新=${r.updated_at}`));

  // 检查是否每个symbol只有一条记录
  const dupCheck = await pool.query(`
    SELECT COUNT(*) as cnt FROM (
      SELECT symbol FROM stock_pool
      WHERE deleted = false
      GROUP BY symbol
      HAVING COUNT(*) > 1
    ) t
  `);
  console.log(`\n重复symbol数: ${dupCheck.rows[0].cnt}`);

  const uniqueCount = await pool.query(`
    SELECT COUNT(DISTINCT symbol) as cnt FROM stock_pool WHERE deleted = false
  `);
  const totalRecords = await pool.query(`
    SELECT COUNT(*) as cnt FROM stock_pool WHERE deleted = false
  `);
  console.log(`总记录数: ${totalRecords.rows[0].cnt}`);
  console.log(`唯一symbol数: ${uniqueCount.rows[0].cnt}`);
  console.log(`结论: ${totalRecords.rows[0].cnt === uniqueCount.rows[0].cnt ? '每个symbol只存1条最新行情' : '存在多条历史数据'}`);

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
