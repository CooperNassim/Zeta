const { pool } = require('./src/config/database');

async function test() {
  try {
    // 查询所有未删除的数据
    const allResult = await pool.query(
      `SELECT id, date, date::text as date_text, deleted, created_at 
       FROM daily_work_data 
       WHERE deleted = false 
       ORDER BY date DESC`
    );
    console.log('[测试4] 所有未删除数据:', allResult.rows.map(r => ({
      id: r.id, 
      date: r.date, 
      date_text: r.date_text,
      deleted: r.deleted 
    })));
    
    // 查找3月16日
    const march16 = await pool.query(
      `SELECT * FROM daily_work_data WHERE date = $1 OR date::text LIKE $2`,
      ['2026-03-16', '%2026-03-16%']
    );
    console.log('[测试4] 3月16日数据:', march16.rows.map(r => ({
      id: r.id,
      date: r.date,
      date_text: r.date,
      deleted: r.deleted
    })));
    
    // 测试前端日期转换逻辑
    console.log('[测试4] 测试日期转换:');
    allResult.rows.forEach(r => {
      let dateStr = r.date;
      if (r.date && typeof r.date === 'string' && r.date.includes('T')) {
        const dateObj = new Date(r.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
      console.log(`  原始: ${r.date} -> 转换后: ${dateStr}`);
    });
    
  } catch (error) {
    console.error('[测试4] 错误:', error.message);
  } finally {
    await pool.end();
  }
}

test();
