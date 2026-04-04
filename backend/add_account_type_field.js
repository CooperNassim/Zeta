const { query } = require('./src/database/queries');

async function addAccountTypeField() {
  try {
    console.log('=== 为transactions表添加account_type字段 ===\n');
    
    // 第一步：检查是否已存在account_type字段
    console.log('1. 检查是否已存在account_type字段...');
    try {
      const checkResult = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'account_type';
      `);
      
      if (checkResult && checkResult.rows && checkResult.rows.length > 0) {
        console.log('   ✅ account_type字段已存在');
      // 继续执行，确保所有步骤都完成
    } else {
      console.log('   📋 account_type字段不存在，继续添加...');
      }
    } catch (err) {
      console.log('   📋 检查过程中遇到小问题，继续执行添加...');
    }
      console.log('   📋 开始添加account_type字段...');
      
      // 添加account_type字段
      await query(`
        ALTER TABLE transactions 
        ADD COLUMN account_type VARCHAR(20) NOT NULL DEFAULT 'realtime';
      `);
      console.log('   ✅ account_type字段添加成功');
      
      // 创建索引
      await query(`
        CREATE INDEX IF NOT EXISTS transactions_account_type_idx 
        ON transactions (account_type);
      `);
      console.log('   ✅ 索引创建成功');
    }
    
    // 第二步：为现有数据设置默认账户类型
    console.log('\\n2. 为现有数据设置默认账户类型...');
    await query(`
      UPDATE transactions 
      SET account_type = 'realtime' 
      WHERE account_type IS NULL OR account_type = '';
    `);
    console.log('   ✅ 默认账户类型设置完成');
    
    // 第三步：验证数据状态
    console.log('\\n3. 验证数据状态...');
    const dataCheck = await query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN deleted = true THEN 1 END) as deleted_count,
        COUNT(CASE WHEN account_type = 'virtual' THEN 1 END) as virtual_count,
        COUNT(CASE WHEN account_type = 'realtime' THEN 1 END) as realtime_count
      FROM transactions;
    `);
    
    const { total_count, deleted_count, virtual_count, realtime_count } = dataCheck.rows[0];
    console.log('   总记录数:', parseInt(total_count));
    console.log('   已删除记录:', parseInt(deleted_count));
    console.log('   虚拟盘记录:', parseInt(virtual_count));
    console.log('   实盘记录:', parseInt(realtime_count));
    
    console.log('\\n=== ✅ 迁移完成 ===');
    console.log('\\n📌 下一步:');
    console.log('   1. 前端数据同步功能将能够区分实盘和虚拟盘数据');
    console.log('   2. 账单明细页面将正确显示数据');
    
  } catch (err) {
    console.error('❌ 迁移失败:', err);
    throw err;
  }
}

async function main() {
  try {
    await addAccountTypeField();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

main();