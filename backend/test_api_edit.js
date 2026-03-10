const { pool } = require('./src/config/database');

async function testAPIDateEdit() {
  try {
    console.log('========== 通过API测试编辑日期 ==========');
    
    // 1. 清理
    console.log('\n1. 清理旧数据...');
    await pool.query(`DELETE FROM daily_work_data WHERE date IN ('2026-03-16', '2026-03-29', '2026-03-30')`);
    console.log('   ✅ 完成');
    
    // 2. 创建数据
    console.log('\n2. 创建两条数据...');
    const r1 = await pool.query(`INSERT INTO daily_work_data (date, nasdaq, sentiment, prediction, trade_status) VALUES ('2026-03-16', '100', '微热', '看涨', '积极地') RETURNING id, date`);
    const r2 = await pool.query(`INSERT INTO daily_work_data (date, nasdaq, sentiment, prediction, trade_status) VALUES ('2026-03-29', '200', '微冷', '看跌', '保守地') RETURNING id, date`);
    const id1 = r1.rows[0].id;
    const id2 = r2.rows[0].id;
    console.log(`   ✅ 创建: id=${id1}(3月16日), id=${id2}(3月29日)`);
    
    // 3. 直接通过update函数测试
    const { update } = require('./src/database/queries');
    
    console.log('\n3. 测试：将3月29日改成3月16日（应该报错）...');
    try {
      await update('daily_work_data', id2, { date: '2026-03-16', nasdaq: '999' });
      console.log('   ❌ 应该报错但成功了');
    } catch (e) {
      console.log(`   ✅ 正确报错: ${e.message}`);
    }
    
    console.log('\n4. 删除3月16日...');
    await pool.query(`UPDATE daily_work_data SET deleted = true WHERE id = $1`, [id1]);
    console.log('   ✅ 删除完成');
    
    console.log('\n5. 测试：将3月29日改成3月16日（应该成功恢复）...');
    const result = await update('daily_work_data', id2, { date: '2026-03-16', nasdaq: '999' });
    console.log(`   ✅ 结果: id=${result.id}, date=${result.date}, nasdaq=${result.nasdaq}`);
    
    console.log('\n6. 测试：将3月16日改成3月30日（应该成功）...');
    const result2 = await update('daily_work_data', result.id, { date: '2026-03-30', nasdaq: '888' });
    console.log(`   ✅ 结果: id=${result2.id}, date=${result2.date}, nasdaq=${result2.nasdaq}`);
    
    // 7. 验证
    console.log('\n7. 验证最终数据...');
    const final = await pool.query(`SELECT id, date, deleted FROM daily_work_data WHERE date IN ('2026-03-16', '2026-03-29', '2026-03-30') ORDER BY date`);
    final.rows.forEach(r => {
      console.log(`   id=${r.id}, date=${r.date.toISOString().split('T')[0]}, deleted=${r.deleted}`);
    });
    
    // 8. 清理
    console.log('\n8. 清理...');
    await pool.query(`DELETE FROM daily_work_data WHERE date IN ('2026-03-16', '2026-03-29', '2026-03-30')`);
    console.log('   ✅ 清理完成');
    
    console.log('\n========== 测试完成 ==========');
    process.exit(0);
  } catch (e) {
    console.error('\n错误:', e);
    process.exit(1);
  }
}

testAPIDateEdit();
