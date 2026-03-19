const { pool } = require('./src/config/database');
const { insert } = require('./src/database/queries');

async function test() {
  try {
    // 清理
    await pool.query(`DELETE FROM daily_work_data WHERE date::text LIKE '%2026-03-31%'`);
    console.log('[测试2] 清理完成');
    
    // 创建
    const result1 = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '1000',
      deleted: false
    });
    console.log('[测试2] 第一次创建:', result1.id);
    
    // 软删除
    await pool.query(`UPDATE daily_work_data SET deleted = true WHERE id = $1`, [result1.id]);
    console.log('[测试2] 软删除完成');
    
    // 检查已删除记录
    const checkResult = await pool.query(
      `SELECT * FROM daily_work_data WHERE date = $1 AND deleted = true`,
      ['2026-03-31']
    );
    console.log('[测试2] 已删除记录数量:', checkResult.rows.length);
    if (checkResult.rows.length > 0) {
      console.log('[测试2] 已删除记录:', {
        id: checkResult.rows[0].id,
        date: checkResult.rows[0].date,
        deleted: checkResult.rows[0].deleted
      });
    }
    
    // 使用insert函数重新创建（应该恢复已删除的记录）
    console.log('[测试2] 使用insert函数重新创建...');
    const result2 = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '2000',
      deleted: false
    });
    console.log('[测试2] 重新创建结果:', {
      id: result2.id,
      date: result2.date,
      nasdaq: result2.nasdaq,
      deleted: result2.deleted
    });
    
    // 验证是否是恢复还是新建
    if (result2.id === result1.id) {
      console.log('[测试2] ✓ 成功恢复已删除记录');
    } else {
      console.log('[测试2] ✓ 成功创建新记录');
    }
    
  } catch (error) {
    console.error('[测试2] 错误:', error.message);
    console.error('[测试2] 错误堆栈:', error.stack);
  } finally {
    await pool.end();
  }
}

test();
