const { pool } = require('./src/config/database');
const { update } = require('./src/database/queries');

async function testEditDate() {
  try {
    console.log('========== 测试编辑日期功能 ==========');
    
    // 1. 清理测试数据
    console.log('\n1. 清理旧测试数据...');
    await pool.query(`DELETE FROM daily_work_data WHERE date IN ('2026-03-16', '2026-03-29')`);
    console.log('   ✅ 清理完成');
    
    // 2. 创建两条测试数据
    console.log('\n2. 创建测试数据...');
    const testData1 = {
      date: '2026-03-16',
      nasdaq: '12345',
      ftse: '67890',
      sentiment: '微热',
      prediction: '看涨',
      trade_status: '积极地'
    };
    const testData2 = {
      date: '2026-03-29',
      nasdaq: '54321',
      ftse: '09876',
      sentiment: '微冷',
      prediction: '看跌',
      trade_status: '保守地'
    };
    
    const result1 = await pool.query(`
      INSERT INTO daily_work_data (date, nasdaq, ftse, sentiment, prediction, trade_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [testData1.date, testData1.nasdaq, testData1.ftse, testData1.sentiment, testData1.prediction, testData1.trade_status]);
    
    const result2 = await pool.query(`
      INSERT INTO daily_work_data (date, nasdaq, ftse, sentiment, prediction, trade_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [testData2.date, testData2.nasdaq, testData2.ftse, testData2.sentiment, testData2.prediction, testData2.trade_status]);
    
    const id1 = result1.rows[0].id;
    const id2 = result2.rows[0].id;
    console.log(`   ✅ 创建完成: id=${id1} (2026-03-16), id=${id2} (2026-03-29)`);
    
    // 3. 测试场景：将3月29日的日期改成3月16日（应该报错，因为3月16日已存在）
    console.log('\n3. 测试：将3月29日改成3月16日（预期报错）...');
    try {
      await update('daily_work_data', id2, {
        date: '2026-03-16',
        nasdaq: '99999'
      });
      console.log('   ❌ 错误：应该报错但成功了！');
    } catch (error) {
      if (error.message.includes('已存在')) {
        console.log(`   ✅ 正确报错: ${error.message}`);
      } else {
        console.log(`   ❌ 错误类型不对: ${error.message}`);
      }
    }
    
    // 4. 测试场景：删除3月16日，然后再将3月29日改成3月16日（应该成功）
    console.log('\n4. 删除3月16日数据...');
    await pool.query(`UPDATE daily_work_data SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, [id1]);
    console.log('   ✅ 删除完成');
    
    console.log('\n5. 再次测试：将3月29日改成3月16日（应该成功恢复已删除记录）...');
    let updateResult = null;
    try {
      updateResult = await update('daily_work_data', id2, {
        date: '2026-03-16',
        nasdaq: '99999'
      });
      console.log(`   ✅ 更新成功: id=${updateResult.id}, date=${updateResult.date}, nasdaq=${updateResult.nasdaq}`);
      
      // 验证数据
      const verify = await pool.query(`SELECT * FROM daily_work_data WHERE date = '2026-03-16' AND deleted = false`);
      console.log(`   验证: 找到 ${verify.rows.length} 条未删除的2026-03-16记录`);
      
      const verifyDeleted = await pool.query(`SELECT * FROM daily_work_data WHERE id = $1`, [id1]);
      console.log(`   验证: 原2026-03-16记录(id=${id1}) deleted状态=${verifyDeleted.rows[0]?.deleted}`);
    } catch (error) {
      console.log(`   ❌ 更新失败: ${error.message}`);
    }
    
    // 6. 测试场景：将3月16日改成3月30日（新日期不存在）
    console.log('\n6. 测试：将3月16日改成3月30日（应该成功）...');
    try {
      const updateResult2 = await update('daily_work_data', 72, {
        date: '2026-03-30',
        nasdaq: '88888'
      });
      console.log(`   ✅ 更新成功: id=${updateResult2.id}, date=${updateResult2.date}, nasdaq=${updateResult2.nasdaq}`);
    } catch (error) {
      console.log(`   ❌ 更新失败: ${error.message}`);
    }
    
    // 7. 查看最终数据
    console.log('\n7. 最终数据状态:');
    const finalData = await pool.query(`SELECT id, date, deleted FROM daily_work_data WHERE date IN ('2026-03-16', '2026-03-29', '2026-03-30') ORDER BY date`);
    finalData.rows.forEach(row => {
      console.log(`   id=${row.id}, date=${row.date}, deleted=${row.deleted}`);
    });
    
    // 8. 清理测试数据
    console.log('\n8. 清理测试数据...');
    await pool.query(`DELETE FROM daily_work_data WHERE date IN ('2026-03-16', '2026-03-29', '2026-03-30')`);
    console.log('   ✅ 清理完成');
    
    console.log('\n========== 测试完成 ==========');
    process.exit(0);
  } catch (error) {
    console.error('\n测试失败:', error);
    process.exit(1);
  }
}

testEditDate();
