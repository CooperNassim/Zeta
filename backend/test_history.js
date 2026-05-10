const {pool} = require('./src/config/database');

(async () => {
  console.log('=== 历史行情数据验证 ===\n');

  // 1. 表结构
  console.log('[1] 表结构:');
  const tables = await pool.query(`
    SELECT table_name, 
           (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as col_count
    FROM information_schema.tables t
    WHERE table_schema = 'public' AND table_name IN ('stock_daily', 'stock_weekly', 'stock_monthly')
    ORDER BY table_name
  `);
  for (const t of tables.rows) {
    const cols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = '${t.table_name}' ORDER BY ordinal_position
    `);
    console.log(`  ${t.table_name} (${t.col_count}列):`);
    console.log(`    ${cols.rows.map(c => c.column_name).join(', ')}`);
  }

  // 2. 数据量
  console.log('\n[2] 数据量:');
  for (const table of ['stock_daily', 'stock_weekly', 'stock_monthly']) {
    const count = await pool.query(`SELECT COUNT(*) as cnt FROM ${table}`);
    console.log(`  ${table}: ${count.rows[0].cnt} 条`);
  }

  // 3. 示例数据
  console.log('\n[3] 日线示例数据 (000001):');
  const daily = await pool.query(`
    SELECT trade_date, open_price, high_price, low_price, close_price, change_percent
    FROM stock_daily WHERE symbol = '000001' ORDER BY trade_date DESC LIMIT 5
  `);
  daily.rows.forEach(r => {
    console.log(`  ${r.trade_date}: 开=${r.open_price} 高=${r.high_price} 低=${r.low_price} 收=${r.close_price} 涨跌幅=${r.change_percent}%`);
  });

  console.log('\n[4] 周线示例数据 (000001):');
  const weekly = await pool.query(`
    SELECT week_date, open_price, high_price, low_price, close_price
    FROM stock_weekly WHERE symbol = '000001' ORDER BY week_date DESC LIMIT 3
  `);
  weekly.rows.forEach(r => {
    console.log(`  ${r.week_date}: 开=${r.open_price} 高=${r.high_price} 低=${r.low_price} 收=${r.close_price}`);
  });

  console.log('\n[5] 月线示例数据 (000001):');
  const monthly = await pool.query(`
    SELECT month_date, open_price, high_price, low_price, close_price
    FROM stock_monthly WHERE symbol = '000001' ORDER BY month_date DESC LIMIT 3
  `);
  monthly.rows.forEach(r => {
    console.log(`  ${r.month_date}: 开=${r.open_price} 高=${r.high_price} 低=${r.low_price} 收=${r.close_price}`);
  });

  console.log('\n=== 验证完成 ===');
  process.exit(0);
})().catch(e => { console.error('验证失败:', e.message); process.exit(1); });
