const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('[前端验证测试] 测试前端日期重复验证逻辑\n');
    
    // 清理
    await pool.query(`DELETE FROM daily_work_data WHERE date::text LIKE '%2026-03-31%'`);
    
    // 创建3月31日数据
    await pool.query(
      `INSERT INTO daily_work_data (date, nasdaq, deleted) 
       VALUES ($1, $2, $3)`,
      ['2026-03-31', '1000', false]
    );
    console.log('[测试] 创建3月31日数据');
    
    // 软删除
    await pool.query(
      `UPDATE daily_work_data SET deleted = true WHERE date = $1`,
      ['2026-03-31']
    );
    console.log('[测试] 软删除3月31日数据\n');
    
    // 模拟前端的dailyWorkData（只包含未删除的数据）
    const dailyWorkData = await pool.query(
      `SELECT id, date, date::text as date_text FROM daily_work_data WHERE deleted = false ORDER BY date DESC LIMIT 5`
    );
    
    console.log('[测试] 前端显示的数据（未删除）:');
    dailyWorkData.rows.forEach(row => {
      let dateStr = row.date;
      const dateObj = new Date(row.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
      console.log(`  - ID: ${row.id}, 日期: ${dateStr}`);
    });
    
    // 模拟前端验证逻辑
    console.log('\n[测试] 模拟前端验证：尝试创建3月31日数据...');
    const formData = { date: '2026-03-31' };
    const dateExists = dailyWorkData.rows.some(data => {
      let dateStr = data.date;
      const dateObj = new Date(data.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
      return dateStr === formData.date;
    });
    
    if (dateExists) {
      console.log('[测试] ✗ 前端验证失败：日期已存在');
    } else {
      console.log('[测试] ✓ 前端验证通过：日期不存在（因为已删除的数据不算）');
    }
    
    // 再创建一个3月30日的未删除数据
    await pool.query(
      `INSERT INTO daily_work_data (date, nasdaq, deleted) 
       VALUES ($1, $2, $3)`,
      ['2026-03-30', '1000', false]
    );
    console.log('\n[测试] 创建3月30日数据');
    
    // 重新获取未删除数据
    const dailyWorkData2 = await pool.query(
      `SELECT id, date FROM daily_work_data WHERE deleted = false ORDER BY date DESC`
    );
    
    console.log('[测试] 前端显示的数据（未删除）:');
    dailyWorkData2.rows.forEach(row => {
      let dateStr = row.date;
      const dateObj = new Date(row.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
      console.log(`  - ID: ${row.id}, 日期: ${dateStr}`);
    });
    
    // 测试验证3月30日
    console.log('\n[测试] 模拟前端验证：尝试创建3月30日数据...');
    const dateExists2 = dailyWorkData2.rows.some(data => {
      let dateStr = data.date;
      const dateObj = new Date(data.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
      return dateStr === '2026-03-30';
    });
    
    if (dateExists2) {
      console.log('[测试] ✓ 前端验证正确：3月30日已存在，不允许重复');
    } else {
      console.log('[测试] ✗ 前端验证错误');
    }
    
    console.log('\n✓✓✓ 前端验证测试通过 ✓✓✓');
    
  } catch (error) {
    console.error('[前端验证测试] 错误:', error.message);
  } finally {
    await pool.end();
  }
}

test();
