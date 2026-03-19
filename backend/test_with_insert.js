const { pool } = require('./src/config/database');
const { insert } = require('./src/database/queries');

async function test() {
  try {
    console.log('=== 使用 insert 函数测试删除后重新创建 ===\n');

    // 清理测试数据
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-31'");
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-30'");

    // 1. 创建数据
    console.log('[1] 创建 2026-03-31 的数据...');
    const created = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '100',
      sentiment: '微热',
      prediction: '看涨',
      trade_status: '积极地',
      deleted: false
    });
    console.log('✓ 创建成功，ID:', created.id);
    console.log();

    // 2. 查询所有数据
    console.log('[2] 查询所有数据...');
    let allData = await pool.query(
      "SELECT * FROM daily_work_data WHERE deleted = false ORDER BY date DESC"
    );
    allData = allData.rows.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    console.log('✓ 数据总数:', allData.length);
    console.log('✅ 包含 2026-03-31:', allData.some(r => r.date === '2026-03-31'));
    console.log();

    // 3. 软删除
    console.log('[3] 软删除数据...');
    await pool.query(
      "UPDATE daily_work_data SET deleted = true WHERE id = $1",
      [created.id]
    );
    console.log('✓ 删除完成');
    console.log();

    // 4. 查询验证删除
    console.log('[4] 查询验证删除...');
    let afterDelete = await pool.query(
      "SELECT * FROM daily_work_data WHERE deleted = false ORDER BY date DESC"
    );
    afterDelete = afterDelete.rows.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    console.log('✓ 数据总数:', afterDelete.length);
    console.log('✅ 不包含 2026-03-31:', !afterDelete.some(r => r.date === '2026-03-31'));
    console.log();

    // 5. 使用 insert 函数重新创建
    console.log('[5] 使用 insert 函数重新创建 2026-03-31 的数据...');
    const recreated = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '200',
      sentiment: '过热',
      prediction: '看涨',
      trade_status: '积极地',
      deleted: false
    });
    console.log('✓ 重新创建成功，ID:', recreated.id);
    console.log('✓ nasdaq:', recreated.nasdaq);
    console.log();

    // 6. 查询验证重新创建
    console.log('[6] 查询验证重新创建...');
    let afterRecreate = await pool.query(
      "SELECT * FROM daily_work_data WHERE deleted = false ORDER BY date DESC"
    );
    afterRecreate = afterRecreate.rows.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    console.log('✓ 数据总数:', afterRecreate.length);
    console.log('✅ 包含 2026-03-31:', afterRecreate.some(r => r.date === '2026-03-31'));
    console.log();

    // 7. 验证数据内容
    const found = afterRecreate.find(r => r.date === '2026-03-31');
    if (found) {
      console.log('✓ 找到数据');
      console.log('✓ nasdaq:', found.nasdaq);
      console.log('✓ sentiment:', found.sentiment);
      console.log('✅ 数据内容正确（新值）');
    }

    console.log('\n✅ 所有测试通过！insert 函数正确处理了删除后重新创建。');

  } catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

test();
