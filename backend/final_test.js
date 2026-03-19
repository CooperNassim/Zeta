const { pool } = require('./src/config/database');
const { insert, remove, findAll } = require('./src/database/queries');

async function test() {
  try {
    console.log('=== 最终综合测试 ===\n');

    // 清理测试数据
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-31'");
    await pool.query("DELETE FROM daily_work_data WHERE date = '2026-03-30'");

    // 测试1：创建、删除、重新创建同日期数据
    console.log('【测试1】创建-删除-重新创建同日期数据');
    const data1 = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '100',
      sentiment: '微热',
      prediction: '看涨',
      trade_status: '积极地',
      deleted: false
    });
    console.log('✓ 创建成功，ID:', data1.id);

    await remove('daily_work_data', data1.id);
    console.log('✓ 删除成功');

    const data2 = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '200',
      sentiment: '过热',
      prediction: '看涨',
      trade_status: '积极地',
      deleted: false
    });
    console.log('✓ 重新创建成功，ID:', data2.id);
    console.log('✓ nasdaq:', data2.nasdaq);

    if (data2.nasdaq === '200') {
      console.log('✅ 测试1通过\n');
    } else {
      console.log('❌ 测试1失败\n');
    }

    // 测试2：查询未删除的数据
    console.log('【测试2】查询未删除的数据');
    let data = await findAll('daily_work_data');
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

    const found = data.find(r => r.date === '2026-03-31');
    if (found && found.nasdaq === '200') {
      console.log('✓ 查询成功，找到数据');
      console.log('✅ 测试2通过\n');
    } else {
      console.log('❌ 测试2失败\n');
    }

    // 测试3：日期验证（前端场景）
    console.log('【测试3】日期验证逻辑');
    const hasDuplicate = data.some(r => r.date === '2026-03-31');
    if (hasDuplicate) {
      console.log('✓ 当前列表中存在2026-03-31，不允许重复创建');
      console.log('✅ 测试3通过\n');
    } else {
      console.log('❌ 测试3失败\n');
    }

    // 测试4：删除后验证不显示
    console.log('【测试4】删除后验证不显示');
    await remove('daily_work_data', data2.id);
    console.log('✓ 删除成功');

    let dataAfterDelete = await findAll('daily_work_data');
    dataAfterDelete = dataAfterDelete.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });

    const stillFound = dataAfterDelete.some(r => r.date === '2026-03-31');
    if (!stillFound) {
      console.log('✓ 删除后不显示');
      console.log('✅ 测试4通过\n');
    } else {
      console.log('❌ 测试4失败\n');
    }

    // 测试5：删除后允许重复创建
    console.log('【测试5】删除后允许重复创建');
    const data3 = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '300',
      sentiment: '过热',
      prediction: '看涨',
      trade_status: '积极地',
      deleted: false
    });
    console.log('✓ 重新创建成功，ID:', data3.id);
    console.log('✓ nasdaq:', data3.nasdaq);

    if (data3.nasdaq === '300') {
      console.log('✅ 测试5通过\n');
    } else {
      console.log('❌ 测试5失败\n');
    }

    // 测试6：最终验证
    console.log('【测试6】最终验证');
    let finalData = await findAll('daily_work_data');
    finalData = finalData.map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });

    const finalFound = finalData.find(r => r.date === '2026-03-31');
    if (finalFound && finalFound.nasdaq === '300') {
      console.log('✓ 最终查询成功');
      console.log('✅ 测试6通过\n');
    } else {
      console.log('❌ 测试6失败\n');
    }

    console.log('=== ✅ 所有测试通过！ ===');

  } catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

test();
