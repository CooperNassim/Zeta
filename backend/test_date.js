const { pool } = require('./src/config/database');

async function test() {
  try {
    // 测试插入并返回原始日期
    const result = await pool.query(
      `INSERT INTO daily_work_data (date, nasdaq, deleted) 
       VALUES ($1, $2, $3) 
       RETURNING date, date::text as date_text`,
      ['2026-03-16', 'test', false]
    );
    console.log('[测试2] 插入结果:', result.rows[0]);
    
    // 测试查询
    const checkResult = await pool.query(
      `SELECT date, date::text as date_text FROM daily_work_data WHERE date = $1`,
      ['2026-03-16']
    );
    console.log('[测试2] 查询结果:', checkResult.rows);
    
    // 查看所有日期
    const allResult = await pool.query(
      `SELECT id, date, date::text as date_text, deleted 
       FROM daily_work_data 
       WHERE date LIKE '2026-03-1%'
       ORDER BY date`
    );
    console.log('[测试2] 所有3月份数据:', allResult.rows.map(r => ({
      id: r.id, 
      date: r.date, 
      date_text: r.date_text, 
      deleted: r.deleted 
    })));
    
  } catch (error) {
    console.error('[测试2] 错误:', error.message);
  } finally {
    await pool.end();
  }
}

test();
