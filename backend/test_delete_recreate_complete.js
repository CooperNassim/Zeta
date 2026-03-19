const { pool } = require('./src/config/database');
const { insert, update } = require('./src/database/queries');
const { readAll, deleteById } = require('./src/database/queries');

async function test() {
  const testDate = '2026-03-31';
  
  try {
    console.log('=== 完整测试：删除后重新创建同日期数据 ===\n');
    
    // 1. 清理可能存在的旧数据
    console.log('[1] 清理旧数据...');
    const existing = await pool.query(
      'SELECT * FROM daily_work_data WHERE date = $1',
      [testDate]
    );
    for (const row of existing.rows) {
      await pool.query('DELETE FROM daily_work_data WHERE id = $1', [row.id]);
    }
    console.log('✓ 清理完成\n');
    
    // 2. 创建初始数据
    console.log('[2] 创建初始数据...');
    const initialData = {
      date: testDate,
      nasdaq: '100', ftse: '100', dax: '100', n225: '100', hsi: '100',
      bitcoin: '100', eurusd: '100', usdjpy: '100', usdcny: '100',
      oil: '100', gold: '100', bond: '100', consecutive: '100', a50: '100',
      sh_index: '100', sh_2day_power: '100', sh_13day_power: '100',
      up_count: '10', limit_up: '5', down_count: '5', limit_down: '5',
      volume: '1000', sentiment: '微热', prediction: '看涨', trade_status: '积极地',
      deleted: false
    };
    const created = await insert('daily_work_data', initialData);
    console.log('✓ 创建成功');
    console.log('✓ created值:', JSON.stringify(created, null, 2));
    console.log('✓ ID:', created?.id);
    console.log('✓ 日期:', created?.date);
    console.log('✓ deleted:', created?.deleted);
    console.log();
    
    // 3. 查询显示数据（模拟前端调用）
    console.log('[3] 查询显示数据（deleted = false）...');
    const displayData = await pool.query(
      'SELECT * FROM daily_work_data WHERE date = $1 AND deleted = false ORDER BY date DESC',
      [testDate]
    );
    console.log('✓ 显示数据数量:', displayData.rows.length);
    console.log('✓ 显示数据:', displayData.rows.map(r => ({
      id: r.id,
      date: r.date,
      deleted: r.deleted
    })));
    console.log();
    
    // 4. 删除数据
    console.log('[4] 删除数据...');
    if (created?.id) {
      await pool.query(
        'UPDATE daily_work_data SET deleted = true WHERE id = $1',
        [created.id]
      );
    } else {
      console.log('❌ 无法删除：created.id不存在');
      return;
    }
    console.log('✓ 删除完成\n');
    
    // 5. 验证删除状态
    console.log('[5] 验证删除状态...');
    const deletedCheck = await pool.query(
      'SELECT * FROM daily_work_data WHERE date = $1',
      [testDate]
    );
    console.log('✓ 总记录数:', deletedCheck.rows.length);
    console.log('✓ 记录详情:', deletedCheck.rows.map(r => ({
      id: r.id,
      date: r.date,
      deleted: r.deleted
    })));
    console.log();
    
    // 6. 重新创建数据
    console.log('[6] 重新创建数据...');
    const recreated = await insert('daily_work_data', {
      date: testDate,
      nasdaq: '200', ftse: '200', dax: '200', n225: '200', hsi: '200',
      bitcoin: '200', eurusd: '200', usdjpy: '200', usdcny: '200',
      oil: '200', gold: '200', bond: '200', consecutive: '200', a50: '200',
      sh_index: '200', sh_2day_power: '200', sh_13day_power: '200',
      up_count: '20', limit_up: '10', down_count: '10', limit_down: '10',
      volume: '2000', sentiment: '过热', prediction: '看涨', trade_status: '积极地',
      deleted: false
    });
    console.log('✓ 重新创建成功');
    console.log('✓ ID:', recreated[0]?.id);
    console.log('✓ 日期:', recreated[0]?.date);
    console.log('✓ deleted:', recreated[0]?.deleted);
    console.log();
    
    // 7. 查询显示数据（模拟前端调用）
    console.log('[7] 重新创建后查询显示数据（deleted = false）...');
    const finalDisplayData = await pool.query(
      'SELECT * FROM daily_work_data WHERE date = $1 AND deleted = false ORDER BY date DESC',
      [testDate]
    );
    console.log('✓ 显示数据数量:', finalDisplayData.rows.length);
    console.log('✓ 显示数据详情:', finalDisplayData.rows.map(r => ({
      id: r.id,
      date: r.date,
      deleted: r.deleted,
      nasdaq: r.nasdaq
    })));
    console.log();
    
    // 8. 最终状态验证
    console.log('[8] 最终状态验证...');
    const allData = await pool.query(
      'SELECT * FROM daily_work_data WHERE date = $1',
      [testDate]
    );
    console.log('✓ 数据库总记录数:', allData.rows.length);
    console.log('✓ 所有记录:', allData.rows.map(r => ({
      id: r.id,
      date: r.date,
      deleted: r.deleted,
      nasdaq: r.nasdaq
    })));
    console.log();
    
    if (finalDisplayData.rows.length === 0) {
      console.log('❌ 问题确认：重新创建后查询不到显示数据！');
      console.log('原因分析：');
      console.log('- 数据库中有记录：', allData.rows.length > 0);
      if (allData.rows.length > 0) {
        console.log('- 第一条记录deleted状态:', allData.rows[0].deleted);
        console.log('- 第一条记录nasdaq值:', allData.rows[0].nasdaq);
      }
      console.log('- 但 deleted = false 的查询结果为 0');
    } else {
      console.log('✅ 成功！重新创建后可以正常显示数据');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

test();
