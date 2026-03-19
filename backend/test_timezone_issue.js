const { pool } = require('./src/config/database');
const { insert, readAll } = require('./src/database/queries');

async function test() {
  try {
    console.log('=== 测试时区问题 ===\n');
    
    // 清理旧数据
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-31'");
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-30'");
    
    console.log('[1] 插入 2026-03-31 的数据...');
    const created = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '100', ftse: '100', dax: '100', n225: '100', hsi: '100',
      bitcoin: '100', eurusd: '100', usdjpy: '100', usdcny: '100',
      oil: '100', gold: '100', bond: '100', consecutive: '100', a50: '100',
      sh_index: '100', sh_2day_power: '100', sh_13day_power: '100',
      up_count: '10', limit_up: '5', down_count: '5', limit_down: '5',
      volume: '1000', sentiment: '微热', prediction: '看涨', trade_status: '积极地',
      deleted: false
    });
    
    console.log('✓ 插入成功');
    console.log('✓ 返回的日期:', created.date);
    console.log('✓ 返回的日期类型:', typeof created.date);
    console.log();
    
    console.log('[2] 查询数据库实际存储...');
    const dbData = await pool.query(
      "SELECT id, date, deleted FROM daily_work_data WHERE id = $1",
      [created.id]
    );
    console.log('✓ 数据库中的日期:', dbData.rows[0].date);
    console.log('✓ 数据库中的日期类型:', typeof dbData.rows[0].date);
    console.log();
    
    console.log('[3] 模拟前端查询（readAll）...');
    const allData = await readAll('daily_work_data');
    console.log('✓ 返回数据数量:', allData.length);
    const found = allData.find(d => d.id === created.id);
    if (found) {
      console.log('✓ 找到记录');
      console.log('✓ 日期:', found.date);
      console.log('✓ 日期类型:', typeof found.date);
    }
    console.log();
    
    console.log('[4] 按日期查询 2026-03-31...');
    const dateQuery = await pool.query(
      "SELECT id, date, deleted FROM daily_work_data WHERE date = $1",
      ['2026-03-31']
    );
    console.log('✓ 查询结果数量:', dateQuery.rows.length);
    if (dateQuery.rows.length > 0) {
      console.log('✓ 日期:', dateQuery.rows[0].date);
    }
    console.log();
    
    console.log('[5] 按日期查询 2026-03-30...');
    const dateQuery2 = await pool.query(
      "SELECT id, date, deleted FROM daily_work_data WHERE date = $1",
      ['2026-03-30']
    );
    console.log('✓ 查询结果数量:', dateQuery2.rows.length);
    if (dateQuery2.rows.length > 0) {
      console.log('✓ 日期:', dateQuery2.rows[0].date);
    }
    console.log();
    
    if (dateQuery.rows.length === 0 && dateQuery2.rows.length > 0) {
      console.log('❌ 问题确认：插入 2026-03-31 的数据被存储为 2026-03-30');
    }
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

test();
