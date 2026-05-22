const { pool } = require('./src/config/database');

async function checkDuplicates() {
  try {
    // 检查 stock_daily 表的重复数据
    console.log('=== 检查 stock_daily 表重复数据 ===\n');
    
    const dailyResult = await pool.query(`
      SELECT 
        symbol,
        trade_date,
        COUNT(*) as count
      FROM stock_daily
      GROUP BY symbol, trade_date
      HAVING COUNT(*) > 1
      ORDER BY count DESC, trade_date DESC
      LIMIT 50
    `);

    if (dailyResult.rows.length > 0) {
      console.log(`❌ 发现 ${dailyResult.rows.length} 组重复数据:\n`);
      dailyResult.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.symbol} | ${row.trade_date} - 重复 ${row.count} 次`);
      });
    } else {
      console.log('✅ stock_daily 表没有重复数据\n');
    }

    // 检查 stock_weekly 表的重复数据
    console.log('=== 检查 stock_weekly 表重复数据 ===\n');
    
    const weeklyResult = await pool.query(`
      SELECT 
        symbol,
        week_date,
        COUNT(*) as count
      FROM stock_weekly
      GROUP BY symbol, week_date
      HAVING COUNT(*) > 1
      ORDER BY count DESC, week_date DESC
      LIMIT 50
    `);

    if (weeklyResult.rows.length > 0) {
      console.log(`❌ 发现 ${weeklyResult.rows.length} 组重复数据:\n`);
      weeklyResult.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.symbol} | ${row.week_date} - 重复 ${row.count} 次`);
      });
    } else {
      console.log('✅ stock_weekly 表没有重复数据\n');
    }

    // 检查 stock_monthly 表的重复数据
    console.log('=== 检查 stock_monthly 表重复数据 ===\n');
    
    const monthlyResult = await pool.query(`
      SELECT 
        symbol,
        month_date,
        COUNT(*) as count
      FROM stock_monthly
      GROUP BY symbol, month_date
      HAVING COUNT(*) > 1
      ORDER BY count DESC, month_date DESC
      LIMIT 50
    `);

    if (monthlyResult.rows.length > 0) {
      console.log(`❌ 发现 ${monthlyResult.rows.length} 组重复数据:\n`);
      monthlyResult.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.symbol} | ${row.month_date} - 重复 ${row.count} 次`);
      });
    } else {
      console.log('✅ stock_monthly 表没有重复数据\n');
    }

    // 统计总数据量
    const dailyStats = await pool.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(DISTINCT trade_date) as unique_dates,
        COUNT(DISTINCT symbol) as unique_symbols
      FROM stock_daily
    `);

    console.log('=== stock_daily 统计 ===');
    console.log(`总记录数: ${dailyStats.rows[0].total_count}`);
    console.log(`唯一日期数: ${dailyStats.rows[0].unique_dates}`);
    console.log(`唯一股票数: ${dailyStats.rows[0].unique_symbols}\n`);

    // 查看某个具体股票的数据，看是否有重复的价格模式
    console.log('=== 检查数据模式是否重复（查看单只股票最近40条） ===\n');
    const patternCheck = await pool.query(`
      SELECT symbol, trade_date, close_price
      FROM stock_daily
      ORDER BY trade_date DESC
      LIMIT 40
    `);
    
    console.log('最近40条收盘价（不同股票可能混在一起）:');
    patternCheck.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.symbol} | ${row.trade_date} | Close: ${row.close_price}`);
    });

    // 查看每个股票各有多少条数据
    console.log('\n=== 每个股票的记录数 ===\n');
    const perStock = await pool.query(`
      SELECT symbol, COUNT(*) as count, MIN(trade_date) as min_date, MAX(trade_date) as max_date
      FROM stock_daily
      GROUP BY symbol
      ORDER BY symbol
    `);
    
    perStock.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.symbol}: ${row.count} 条 (${row.min_date} ~ ${row.max_date})`);
    });

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
    process.exit(1);
  }
}

checkDuplicates();
