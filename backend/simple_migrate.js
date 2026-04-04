const { query } = require('./src/database/queries');

async function addAccountType() {
  console.log('=== 添加account_type字段到transactions表 ===\n');
  
  try {
    // 1. 检查并添加字段
    console.log('1. 检查字段是否存在...');
    
    // 尝试直接执行ALTER，如果已存在会报错但继续执行
    try {
      await query(`ALTER TABLE transactions ADD COLUMN account_type VARCHAR(20) NOT NULL DEFAULT 'realtime'`);
      console.log('   ✅ 添加account_type字段成功');
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('   ✅ 字段已存在，跳过添加');
      } else {
        throw err;
      }
    }
    
    // 2. 为现有数据设置默认值
    console.log('\\n2. 为现有数据设置默认值...');
    await query(`UPDATE transactions SET account_type = 'realtime' WHERE account_type IS NULL OR account_type = ''`);
    console.log('   ✅ 默认值设置完成');
    
    // 3. 获取统计数据
    console.log('\\n3. 获取统计数据...');
    const result = await query('SELECT COUNT(*) as total, COUNT(CASE WHEN deleted = true THEN 1 END) as deleted FROM transactions');
    const row = result.rows[0];
    console.log('   ✅ 总记录数:', parseInt(row.total));
    console.log('   ✅ 已删除记录:', parseInt(row.deleted));
    
    console.log('\\n=== ✅ 迁移完成 ===');
    
  } catch (err) {
    console.error('❌ 迁移失败:', err.message);
    throw err;
  }
}

// 执行
addAccountType().then(() => {
  console.log('✅ 脚本执行成功');
  process.exit(0);
}).catch(err => {
  console.error('❌ 脚本执行失败');
  process.exit(1);
});