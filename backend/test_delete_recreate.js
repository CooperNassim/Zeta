const { pool } = require('./src/config/database');

async function test() {
  try {
    // 先清理3月31日
    await pool.query(`DELETE FROM daily_work_data WHERE date::text LIKE '%2026-03-31%'`);
    console.log('[测试1] 清理完成');
    
    // 创建3月31日数据
    const result = await pool.query(
      `INSERT INTO daily_work_data (date, nasdaq, deleted) 
       VALUES ($1, $2, $3) 
       RETURNING id, date, date::text as date_text, deleted`,
      ['2026-03-31', '1000', false]
    );
    console.log('[测试1] 创建成功:', result.rows[0]);
    
    // 软删除
    await pool.query(
      `UPDATE daily_work_data SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE date = $1`,
      ['2026-03-31']
    );
    console.log('[测试1] 软删除完成');
    
    // 查询已删除的记录
    const deletedRecord = await pool.query(
      `SELECT id, date, date::text as date_text, deleted FROM daily_work_data WHERE date = $1 AND deleted = true`,
      ['2026-03-31']
    );
    console.log('[测试1] 查询已删除记录:', deletedRecord.rows.length > 0 ? '找到' : '未找到');
    
    if (deletedRecord.rows.length > 0) {
      console.log('[测试1] 已删除记录:', deletedRecord.rows[0]);
    }
    
    // 尝试重新创建（模拟insert函数的逻辑）
    console.log('[测试1] 尝试重新创建3月31日数据...');
    try {
      const recreateResult = await pool.query(
        `INSERT INTO daily_work_data (date, nasdaq, deleted) 
         VALUES ($1, $2, $3) 
         RETURNING id, date, deleted`,
        ['2026-03-31', '2000', false]
      );
      console.log('[测试1] 重新创建成功:', recreateResult.rows[0]);
    } catch (error) {
      console.log('[测试1] 重新创建失败:', error.message);
    }
    
  } catch (error) {
    console.error('[测试1] 错误:', error.message);
  } finally {
    await pool.end();
  }
}

test();
