const { pool } = require('./src/config/database');
const { findAll } = require('./src/database/queries');

async function test() {
  try {
    // 模拟 API 的处理逻辑
    let data = await findAll('daily_work_data');
    
    console.log('[测试5] 原始数据前3条:', data.slice(0, 3).map(r => ({
      id: r.id,
      date: r.date,
      dateType: typeof r.date
    })));
    
    // 应用修复后的日期转换
    data = data.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    
    console.log('[测试5] 转换后数据前3条:', data.slice(0, 3).map(r => ({
      id: r.id,
      date: r.date
    })));
    
    // 查找3月16日
    const march16 = data.find(d => d.date === '2026-03-16');
    console.log('[测试5] 找到3月16日:', march16 ? { id: march16.id, date: march16.date } : '未找到');
    
  } catch (error) {
    console.error('[测试5] 错误:', error.message);
  } finally {
    await pool.end();
  }
}

test();
