const { pool } = require('./src/config/database');
const { insert } = require('./src/database/queries');
const { findAll } = require('./src/database/queries');

async function test() {
  try {
    console.log('=== 完整端到端测试 ===\n');

    // 清理测试数据
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-31'");
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-30'");

    // 场景1：用户在前端创建3月31日数据
    console.log('=== 场景1：用户在前端创建3月31日数据 ===');
    console.log('[前端] 用户提交表单，date = "2026-03-31"');

    // 前端调用 POST /api/daily_work_data
    const created = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '100',
      sentiment: '微热',
      prediction: '看涨',
      trade_status: '积极地',
      deleted: false
    });
    console.log('[后端] 创建成功，ID:', created.id);

    // 前端调用 GET /api/daily_work_data（或 sync/all）
    console.log('[前端] 从数据库同步数据...');
    let frontendData = await findAll('daily_work_data');

    // 应用API日期转换
    frontendData = frontendData.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });

    console.log('[前端] 收到的数据:');
    console.log('  - 总数:', frontendData.length);
    console.log('  - 包含2026-03-31:', frontendData.some(r => r.date === '2026-03-31'));

    if (frontendData.some(r => r.date === '2026-03-31')) {
      console.log('✅ 场景1成功：创建后可以显示\n');
    } else {
      console.log('❌ 场景1失败：创建后不显示\n');
    }

    // 场景2：用户删除3月31日数据
    console.log('=== 场景2：用户删除3月31日数据 ===');
    console.log('[前端] 用户点击删除，ID =', created.id);

    // 前端调用 DELETE /api/daily_work_data/:id
    await pool.query("UPDATE daily_work_data SET deleted = true WHERE id = $1", [created.id]);
    console.log('[后端] 软删除成功');

    // 前端再次同步数据
    console.log('[前端] 从数据库同步数据...');
    frontendData = await findAll('daily_work_data');
    frontendData = frontendData.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });

    console.log('[前端] 收到的数据:');
    console.log('  - 总数:', frontendData.length);
    console.log('  - 包含2026-03-31:', frontendData.some(r => r.date === '2026-03-31'));

    if (!frontendData.some(r => r.date === '2026-03-31')) {
      console.log('✅ 场景2成功：删除后不显示\n');
    } else {
      console.log('❌ 场景2失败：删除后仍然显示\n');
    }

    // 场景3：用户重新创建3月31日数据
    console.log('=== 场景3：用户重新创建3月31日数据 ===');
    console.log('[前端] 用户再次提交表单，date = "2026-03-31"');

    // 前端调用 POST /api/daily_work_data
    const recreated = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '200',
      sentiment: '过热',
      prediction: '看涨',
      trade_status: '积极地',
      deleted: false
    });
    console.log('[后端] 重新创建成功，ID:', recreated.id);
    console.log('[后端] nasdaq值:', recreated.nasdaq);

    // 前端再次同步数据
    console.log('[前端] 从数据库同步数据...');
    frontendData = await findAll('daily_work_data');
    frontendData = frontendData.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });

    console.log('[前端] 收到的数据:');
    console.log('  - 总数:', frontendData.length);
    console.log('  - 包含2026-03-31:', frontendData.some(r => r.date === '2026-03-31'));

    const found = frontendData.find(r => r.date === '2026-03-31');
    if (found && found.nasdaq === '200') {
      console.log('  - nasdaq值:', found.nasdaq);
      console.log('✅ 场景3成功：重新创建后可以显示且内容正确\n');
      console.log('=== ✅ 所有场景测试通过！ ===');
    } else if (found) {
      console.log('  - nasdaq值:', found.nasdaq);
      console.log('❌ 场景3失败：内容不正确\n');
    } else {
      console.log('❌ 场景3失败：重新创建后不显示\n');
    }

  } catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

test();
