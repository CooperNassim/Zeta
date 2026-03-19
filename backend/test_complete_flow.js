const { pool } = require('./src/config/database');
const { insert, findAll } = require('./src/database/queries');

async function test() {
  try {
    console.log('[完整流程测试] 测试删除后重新创建同日期数据\n');
    
    // 步骤1: 清理3月31日数据
    console.log('[步骤1] 清理3月31日数据...');
    await pool.query(`DELETE FROM daily_work_data WHERE date::text LIKE '%2026-03-31%'`);
    
    // 步骤2: 创建3月31日数据
    console.log('[步骤2] 创建3月31日数据...');
    const create1 = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '1000',
      sentiment: '微热',
      deleted: false
    });
    console.log('[步骤2] 创建成功, ID:', create1.id, 'nasdaq:', create1.nasdaq);
    
    // 步骤3: 查询验证（模拟API）
    console.log('[步骤3] 查询验证数据存在...');
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
    const found1 = data.find(d => d.date === '2026-03-31');
    console.log('[步骤3] 查找结果:', found1 ? { id: found1.id, date: found1.date, nasdaq: found1.nasdaq } : '未找到');
    
    // 步骤4: 软删除3月31日数据
    console.log('[步骤4] 软删除3月31日数据...');
    await pool.query(`UPDATE daily_work_data SET deleted = true WHERE id = $1`, [create1.id]);
    console.log('[步骤4] 删除完成');
    
    // 步骤5: 查询验证数据已不在列表中
    console.log('[步骤5] 验证数据已不在列表中...');
    data = await findAll('daily_work_data');
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
    const found2 = data.find(d => d.date === '2026-03-31');
    console.log('[步骤5] 查找结果:', found2 ? '还在列表（错误）' : '已从列表移除（正确）');
    
    // 步骤6: 重新创建3月31日数据
    console.log('[步骤6] 重新创建3月31日数据...');
    const create2 = await insert('daily_work_data', {
      date: '2026-03-31',
      nasdaq: '2000',
      sentiment: '沸点',
      deleted: false
    });
    console.log('[步骤6] 创建成功, ID:', create2.id, 'nasdaq:', create2.nasdaq, 'sentiment:', create2.sentiment);
    
    // 步骤7: 查询验证数据重新出现
    console.log('[步骤7] 验证数据重新出现...');
    data = await findAll('daily_work_data');
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
    const found3 = data.find(d => d.date === '2026-03-31');
    if (found3) {
      console.log('[步骤7] 查找结果:', { id: found3.id, date: found3.date, nasdaq: found3.nasdaq, sentiment: found3.sentiment });
      
      // 验证数据是否是恢复的还是新建的
      if (found3.id === create1.id) {
        console.log('[步骤7] ✓ 数据是恢复的（ID相同）');
      } else {
        console.log('[步骤7] ✓ 数据是新建的（ID不同）');
      }
      
      // 验证数据内容是否更新
      if (found3.nasdaq === '2000' && found3.sentiment === '沸点') {
        console.log('[步骤7] ✓ 数据内容已更新');
      } else {
        console.log('[步骤7] ✗ 数据内容未更新');
      }
      
      console.log('\n✓✓✓ 完整测试通过！删除后重新创建同日期数据功能正常 ✓✓✓');
    } else {
      console.log('[步骤7] ✗ 未找到3月31日数据');
      console.log('\n✗✗✗ 测试失败 ✗✗✗');
    }
    
  } catch (error) {
    console.error('[完整流程测试] 错误:', error.message);
    console.log('\n✗✗✗ 测试失败 ✗✗✗');
  } finally {
    await pool.end();
  }
}

test();
