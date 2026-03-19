const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('=== 测试数据库日期和API转换 ===\n');

    // 清理并创建测试数据
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-31'");
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-30'");

    console.log('[1] 插入数据 date = \'2026-03-31\'');
    await pool.query(
      `INSERT INTO daily_work_data (date, nasdaq, sentiment, prediction, trade_status, deleted)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      ['2026-03-31', '100', '微热', '看涨', '积极地', false]
    );

    console.log('[2] 查询数据库返回的原始日期');
    const result = await pool.query(
      "SELECT id, date FROM daily_work_data WHERE date::text LIKE '2026-03-31%' ORDER BY id DESC LIMIT 1"
    );
    console.log('✓ ID:', result.rows[0].id);
    console.log('✓ date:', result.rows[0].date);
    console.log('✓ date type:', typeof result.rows[0].date);
    console.log('✓ date toISOString:', result.rows[0].date.toISOString());
    console.log();

    console.log('[3] 应用API日期转换逻辑');
    const row = result.rows[0];
    const dateObj = new Date(row.date);
    console.log('✓ dateObj:', dateObj);
    console.log('✓ dateObj.toString():', dateObj.toString());
    console.log('✓ dateObj.getFullYear():', dateObj.getFullYear());
    console.log('✓ dateObj.getMonth():', dateObj.getMonth());
    console.log('✓ dateObj.getDate():', dateObj.getDate());
    console.log();

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    console.log('✓ 转换后的日期字符串:', dateStr);
    console.log();

    console.log('[4] 验证');
    if (dateStr === '2026-03-31') {
      console.log('✅ 日期转换正确');
    } else {
      console.log('❌ 日期转换错误');
    }

    // 测试实际查询
    console.log('\n[5] 模拟前端查询 date = \'2026-03-31\' 的数据');
    const queryResult = await pool.query(
      "SELECT * FROM daily_work_data WHERE deleted = false ORDER BY date DESC"
    );
    console.log('✓ 总记录数:', queryResult.rows.length);
    console.log('✓ 所有日期:', queryResult.rows.map(r => r.date));
    console.log('✓ 包含 2026-03-31:', queryResult.rows.some(r => r.date.toISOString().includes('2026-03-31')));
    console.log();

    // 应用API转换
    const convertedData = queryResult.rows.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    console.log('✓ 转换后所有日期:', convertedData.map(r => r.date));
    console.log('✅ 包含 2026-03-31:', convertedData.some(r => r.date === '2026-03-31'));

  } catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

test();
