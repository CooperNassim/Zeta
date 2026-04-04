const { query } = require('./src/database/queries');

async function fixTransactions() {
  console.log('=== 检查和修复交易数据 ===\n');
  
  try {
    // 1. 首先检查数据库连接和表结构
    console.log('1. 检查数据库状态...');
    
    // 检查表是否存在
    const tableCheck = await query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions')`);
    console.log('   transactions表是否存在:', tableCheck.rows[0].exists);
    
    // 获取所有数据
    const allData = await query('SELECT * FROM transactions ORDER BY id');
    console.log('2. 数据库中的交易数据数量:', allData.rows ? allData.rows.length : '未知');
    
    if (allData.rows && allData.rows.length > 0) {
      console.log('3. 数据详情:');
      allData.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ID: ${row.id}, 类型: ${row.transaction_type}, 金额: ${row.amount}, 删除: ${row.deleted}, 时间: ${row.created_at}`);
      });
      
      // 4. 统计删除状态
      const deletedCount = allData.rows.filter(row => row.deleted === true).length;
      const activeCount = allData.rows.filter(row => row.deleted === false || row.deleted === null).length;
      console.log('4. 删除状态统计:');
      console.log('   ✅ 活跃数据:', activeCount);
      console.log('   ❌ 已删除数据:', deletedCount);
      
      // 5. 检查是否有最新的真实交易数据需要恢复
      const latestRecords = allData.rows
        .filter(row => row.trade_number && row.trade_number.includes('20260403')) // 包含今天日期的交易
        .slice(0, 5);
      
      if (latestRecords.length > 0) {
        console.log('5. 发现最近的交易记录，建议恢复这些数据:');
        latestRecords.forEach(row => {
          console.log(`   ID: ${row.id}, 交易编号: ${row.trade_number || '无'}, 金额: ${row.amount}`);
        });
        
        // 6. 恢复建议的交易数据
        const restoreIds = latestRecords.map(row => row.id);
        await query('UPDATE transactions SET deleted = false, deleted_at = NULL WHERE id = ANY($1)', [restoreIds]);
        console.log(`6. 已恢复数据:`, restoreIds);
      } else {
        console.log('5. 没有找到最近的交易记录，建议创建新的测试数据');
      }
    } else {
      console.log('3. 数据库中没有交易数据');
      console.log('4. 建议创建测试数据');
    }
    
    console.log('\n=== ✅ 检查完成 ===');
    
  } catch (err) {
    console.error('❌ 检查失败:', err.message);
  }
}

// 执行
fixTransactions().then(() => {
  console.log('✅ 脚本执行完成');
  process.exit(0);
}).catch(err => {
  console.error('❌ 脚本执行失败');
  process.exit(1);
});