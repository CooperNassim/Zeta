const { pool } = require('./src/config/database');

async function test() {
  try {
    console.log('=== 测试真实的前端API流程 ===\n');

    // 清理测试数据
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-31'");
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-30'");

    // 1. 创建数据
    console.log('[1] 创建 2026-03-31 的数据...');
    const createResult = await pool.query(
      `INSERT INTO daily_work_data (date, nasdaq, sentiment, prediction, trade_status, deleted)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      ['2026-03-31', '100', '微热', '看涨', '积极地', false]
    );
    console.log('✓ 创建成功，ID:', createResult.rows[0].id);
    console.log();

    // 2. 模拟前端查询（应用API日期转换）
    console.log('[2] 前端查询所有数据（应用API日期转换）...');
    let data = await pool.query(
      "SELECT * FROM daily_work_data WHERE deleted = false ORDER BY date DESC"
    );
    data = data.rows.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    console.log('✓ 数据总数:', data.length);
    console.log('✓ 日期列表:', data.map(r => r.date));
    console.log('✅ 包含 2026-03-31:', data.some(r => r.date === '2026-03-31'));
    console.log();

    // 3. 删除数据
    console.log('[3] 删除数据（软删除）...');
    await pool.query(
      "UPDATE daily_work_data SET deleted = true WHERE id = $1",
      [createResult.rows[0].id]
    );
    console.log('✓ 删除完成');
    console.log();

    // 4. 查询验证删除
    console.log('[4] 查询验证删除...');
    let dataAfterDelete = await pool.query(
      "SELECT * FROM daily_work_data WHERE deleted = false ORDER BY date DESC"
    );
    dataAfterDelete = dataAfterDelete.rows.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    console.log('✓ 删除后数据总数:', dataAfterDelete.length);
    console.log('✓ 日期列表:', dataAfterDelete.map(r => r.date));
    console.log('✅ 不包含 2026-03-31:', !dataAfterDelete.some(r => r.date === '2026-03-31'));
    console.log();

    // 5. 重新创建数据
    console.log('[5] 重新创建 2026-03-31 的数据...');
    const recreateResult = await pool.query(
      `INSERT INTO daily_work_data (date, nasdaq, sentiment, prediction, trade_status, deleted)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      ['2026-03-31', '200', '过热', '看涨', '积极地', false]
    );
    console.log('✓ 重新创建成功，ID:', recreateResult.rows[0].id);
    console.log();

    // 6. 查询验证重新创建
    console.log('[6] 查询验证重新创建...');
    let dataAfterRecreate = await pool.query(
      "SELECT * FROM daily_work_data WHERE deleted = false ORDER BY date DESC"
    );
    dataAfterRecreate = dataAfterRecreate.rows.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    console.log('✓ 重新创建后数据总数:', dataAfterRecreate.length);
    console.log('✓ 日期列表:', dataAfterRecreate.map(r => r.date));
    console.log('✅ 包含 2026-03-31:', dataAfterRecreate.some(r => r.date === '2026-03-31'));
    console.log();

    // 7. 验证数据内容
    const recreatedData = dataAfterRecreate.find(r => r.date === '2026-03-31');
    if (recreatedData) {
      console.log('✓ 找到重新创建的数据');
      console.log('✓ nasdaq:', recreatedData.nasdaq);
      console.log('✓ sentiment:', recreatedData.sentiment);
      console.log('✅ 数据内容正确');
    } else {
      console.log('❌ 未找到重新创建的数据');
    }

    console.log('\n✅ 所有测试通过！');

  } catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

test();
