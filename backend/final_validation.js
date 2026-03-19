const { pool } = require('./src/config/database');
const { insert, findAll } = require('./src/database/queries');

async function test() {
  try {
    console.log('========================================');
    console.log('  最终完整功能验证测试');
    console.log('========================================\n');
    
    let testPassed = true;
    
    // ========== 场景1: 删除后重新创建同日期数据 ==========
    console.log('场景1: 删除3月31日后重新创建\n');
    await pool.query(`DELETE FROM daily_work_data WHERE date::text LIKE '%2026-03-31%'`);
    
    const create1 = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '1000',
      sentiment: '微热',
      deleted: false
    });
    console.log('  1.1 创建3月31日: ID=' + create1.id);
    
    await pool.query(`UPDATE daily_work_data SET deleted = true WHERE id = $1`, [create1.id]);
    console.log('  1.2 软删除3月31日');
    
    const create2 = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '2000',
      sentiment: '沸点',
      deleted: false
    });
    console.log('  1.3 重新创建3月31日: ID=' + create2.id);
    
    if (create2.id === create1.id && create2.nasdaq === '2000' && create2.sentiment === '沸点') {
      console.log('  ✓ 场景1通过: 成功恢复并更新已删除数据\n');
    } else {
      console.log('  ✗ 场景1失败\n');
      testPassed = false;
    }
    
    // ========== 场景2: 前端日期验证 - 已删除数据允许重复 ==========
    console.log('场景2: 前端验证已删除数据允许重复\n');
    
    await pool.query(`DELETE FROM daily_work_data WHERE date::text LIKE '%2026-03-30%'`);
    await pool.query(`INSERT INTO daily_work_data (date, nasdaq, deleted) VALUES ($1, $2, $3)`,
      ['2026-03-30', '1000', false]);
    await pool.query(`UPDATE daily_work_data SET deleted = true WHERE date = $1`, ['2026-03-30']);
    console.log('  2.1 创建并软删除3月30日');
    
    // 模拟前端dailyWorkData（只包含未删除）
    const dailyWorkData = (await findAll('daily_work_data')).map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    
    const dateExists = dailyWorkData.some(d => d.date === '2026-03-30');
    console.log('  2.2 前端验证3月30日是否重复:', dateExists ? '重复' : '不重复');
    
    if (!dateExists) {
      console.log('  ✓ 场景2通过: 已删除数据允许重新创建\n');
    } else {
      console.log('  ✗ 场景2失败\n');
      testPassed = false;
    }
    
    // ========== 场景3: 前端日期验证 - 未删除数据不允许重复 ==========
    console.log('场景3: 前端验证未删除数据不允许重复\n');
    
    await pool.query(`DELETE FROM daily_work_data WHERE date::text LIKE '%2026-03-29%'`);
    await pool.query(`INSERT INTO daily_work_data (date, nasdaq, deleted) VALUES ($1, $2, $3)`,
      ['2026-03-29', '1000', false]);
    console.log('  3.1 创建3月29日数据');
    
    const dailyWorkData2 = (await findAll('daily_work_data')).map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    
    const dateExists2 = dailyWorkData2.some(d => d.date === '2026-03-29');
    console.log('  3.2 前端验证3月29日是否重复:', dateExists2 ? '重复' : '不重复');
    
    if (dateExists2) {
      console.log('  ✓ 场景3通过: 未删除数据不允许重复\n');
    } else {
      console.log('  ✗ 场景3失败\n');
      testPassed = false;
    }
    
    // ========== 场景4: 日期显示正确 ==========
    console.log('场景4: 验证3月16日数据正确显示\n');
    
    const allData = (await findAll('daily_work_data')).map(row => {
      if (row.date) {
        const dateObj = new Date(row.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        row.date = `${year}-${month}-${day}`;
      }
      return row;
    });
    
    const march16 = allData.find(d => d.date === '2026-03-16');
    if (march16) {
      console.log('  4.1 找到3月16日数据: ID=' + march16.id);
      console.log('  ✓ 场景4通过: 3月16日数据正确显示\n');
    } else {
      console.log('  ✗ 场景4失败: 未找到3月16日数据\n');
      testPassed = false;
    }
    
    // ========== 测试结果 ==========
    console.log('========================================');
    if (testPassed) {
      console.log('  ✓✓✓ 所有测试通过！功能完整正常 ✓✓✓');
    } else {
      console.log('  ✗✗✗ 部分测试失败 ✗✗✗');
    }
    console.log('========================================');
    
  } catch (error) {
    console.error('[最终验证] 错误:', error.message);
    console.log('\n✗✗✗ 测试失败 ✗✗✗');
  } finally {
    await pool.end();
  }
}

test();
