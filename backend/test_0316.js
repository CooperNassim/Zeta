const { pool } = require('./src/config/database');
const { insert } = require('./src/database/queries');

async function test() {
  const testData = {
    date: '2026-03-16',
    nasdaq: '1000',
    ftse: '1000',
    dax: '1000',
    n225: '1000',
    hsi: '1000',
    bitcoin: '1000',
    eurusd: '1000',
    usdjpy: '1000',
    usdcny: '1000',
    oil: '1000',
    gold: '1000',
    bond: '1000',
    consecutive: '1000',
    a50: '1000',
    sh_index: '1000',
    sh_2day_power: '1000',
    sh_13day_power: '1000',
    up_count: '1000',
    limit_up: '1000',
    down_count: '1000',
    limit_down: '1000',
    volume: '1000',
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地',
    deleted: false
  };
  
  try {
    console.log('[测试1] 准备插入数据:', testData.date);
    const result = await insert('daily_work_data', testData);
    console.log('[测试1] 插入成功:', result);
    
    // 查询验证
    const checkResult = await pool.query(
      'SELECT * FROM daily_work_data WHERE date = $1',
      [testData.date]
    );
    console.log('[测试1] 查询结果数量:', checkResult.rows.length);
    console.log('[测试1] 查询结果:', checkResult.rows.map(r => ({ id: r.id, date: r.date, deleted: r.deleted })));
    
    // 测试查询所有数据
    const allResult = await pool.query('SELECT * FROM daily_work_data WHERE deleted = false ORDER BY date DESC LIMIT 5');
    console.log('[测试1] 最新5条数据:', allResult.rows.map(r => ({ id: r.id, date: r.date, deleted: r.deleted })));
    
  } catch (error) {
    console.error('[测试1] 插入失败:', error.message);
  } finally {
    await pool.end();
  }
}

test();
