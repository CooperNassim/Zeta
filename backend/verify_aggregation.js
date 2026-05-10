const {pool} = require('./src/config/database');

(async () => {
  console.log('=== 验证周线/月线聚合逻辑 ===\n');

  // 1. 查看日线数据
  console.log('[1] 日线数据 (000001):');
  const daily = await pool.query(`
    SELECT trade_date, open_price, high_price, low_price, close_price, volume, amount
    FROM stock_daily WHERE symbol = '000001' ORDER BY trade_date ASC
  `);
  daily.rows.forEach(r => {
    console.log(`  ${r.trade_date}: 开=${r.open_price} 高=${r.high_price} 低=${r.low_price} 收=${r.close_price} 量=${r.volume}`);
  });

  // 2. 查看聚合后的周线
  console.log('\n[2] 聚合后的周线 (000001):');
  const weekly = await pool.query(`
    SELECT week_date, open_price, high_price, low_price, close_price, volume, amount
    FROM stock_weekly WHERE symbol = '000001' ORDER BY week_date ASC
  `);
  weekly.rows.forEach(r => {
    console.log(`  ${r.week_date}: 开=${r.open_price} 高=${r.high_price} 低=${r.low_price} 收=${r.close_price} 量=${r.volume}`);
  });

  // 3. 验证聚合是否正确
  console.log('\n[3] 聚合验证:');
  if (daily.rows.length > 0 && weekly.rows.length > 0) {
    const firstDaily = daily.rows[0];
    const lastDaily = daily.rows[daily.rows.length - 1];
    const weeklyData = weekly.rows[0];

    const expectedOpen = firstDaily.open_price;
    const expectedClose = lastDaily.close_price;
    const expectedHigh = Math.max(...daily.rows.map(r => parseFloat(r.high_price)));
    const expectedLow = Math.min(...daily.rows.map(r => parseFloat(r.low_price)));
    const expectedVolume = daily.rows.reduce((sum, r) => sum + parseInt(r.volume || 0), 0);

    console.log(`  预期开盘: ${expectedOpen}, 实际: ${weeklyData.open_price} ${expectedOpen == weeklyData.open_price ? '✓' : '✗'}`);
    console.log(`  预期收盘: ${expectedClose}, 实际: ${weeklyData.close_price} ${expectedClose == weeklyData.close_price ? '✓' : '✗'}`);
    console.log(`  预期最高: ${expectedHigh}, 实际: ${weeklyData.high_price} ${expectedHigh == parseFloat(weeklyData.high_price) ? '✓' : '✗'}`);
    console.log(`  预期最低: ${expectedLow}, 实际: ${weeklyData.low_price} ${expectedLow == parseFloat(weeklyData.low_price) ? '✓' : '✗'}`);
    console.log(`  预期总量: ${expectedVolume}, 实际: ${weeklyData.volume} ${expectedVolume == parseInt(weeklyData.volume) ? '✓' : '✗'}`);
  }

  console.log('\n=== 验证完成 ===');
  process.exit(0);
})().catch(e => { console.error('验证失败:', e.message); process.exit(1); });
