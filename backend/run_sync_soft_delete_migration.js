/**
 * 执行交易订单和交易记录软删除同步迁移
 * 
 * 功能：当 trade_orders 被软删除时，自动同步软删除对应的 trade_records
 */

require('dotenv').config();
const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('开始执行软删除同步迁移...');
    console.log('========================================\n');
    
    // 读取迁移文件
    const migrationFile = path.join(__dirname, 'migrations', 'migration_sync_soft_delete.sql');
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('1️⃣  读取迁移文件...');
    console.log(`   文件: ${migrationFile}`);
    console.log(`   大小: ${migrationSQL.length} 字节\n`);
    
    // 开始事务
    await client.query('BEGIN');
    
    // 执行迁移
    console.log('2️⃣  执行迁移SQL...');
    await client.query(migrationSQL);
    console.log('   ✅ SQL执行完成\n');
    
    // 验证触发器
    console.log('3️⃣  验证触发器...');
    const triggerCheck = await client.query(`
      SELECT 
        tgname as trigger_name,
        tgtype as trigger_type,
        tgenabled as enabled
      FROM pg_trigger
      WHERE tgname = 'trg_sync_trade_order_to_records'
    `);
    
    if (triggerCheck.rows.length > 0) {
      const trigger = triggerCheck.rows[0];
      console.log('   ✅ 触发器信息:');
      console.log(`      名称: ${trigger.trigger_name}`);
      console.log(`      类型: ${trigger.trigger_type}`);
      console.log(`      状态: ${trigger.enabled === 'O' ? '启用' : '禁用'}\n`);
    } else {
      throw new Error('触发器未创建成功');
    }
    
    // 验证函数
    console.log('4️⃣  验证触发器函数...');
    const funcCheck = await client.query(`
      SELECT 
        proname as function_name,
        prosrc as function_body
      FROM pg_proc
      WHERE proname = 'sync_trade_order_to_records'
    `);
    
    if (funcCheck.rows.length > 0) {
      console.log('   ✅ 函数信息:');
      console.log(`      名称: ${funcCheck.rows[0].function_name}`);
      
      // 检查是否包含软删除同步逻辑
      const funcBody = funcCheck.rows[0].function_body;
      const hasSoftDeleteSync = funcBody.includes('TG_OP = \'UPDATE\'') && 
                                  funcBody.includes('deleted = false AND NEW.deleted = true');
      
      if (hasSoftDeleteSync) {
        console.log('      ✅ 包含软删除同步逻辑\n');
      } else {
        console.log('      ⚠️  可能缺少软删除同步逻辑\n');
      }
    } else {
      throw new Error('触发器函数未创建成功');
    }
    
    // 提交事务
    await client.query('COMMIT');
    
    console.log('========================================');
    console.log('✅ 迁移执行成功！');
    console.log('========================================\n');
    
    console.log('📋 功能说明:');
    console.log('   - 当 trade_orders 被软删除时（deleted: false → true）');
    console.log('   - 自动软删除对应的 trade_records');
    console.log('   - 当 trade_orders 被恢复时（deleted: true → false）');
    console.log('   - 自动恢复对应的 trade_records\n');
    
    console.log('📝 使用示例:');
    console.log('   删除订单:');
    console.log('   UPDATE trade_orders SET deleted = true, deleted_at = NOW() WHERE id = 123;');
    console.log('   → 对应的交易记录也会被软删除\n');
    
    console.log('   恢复订单:');
    console.log('   UPDATE trade_orders SET deleted = false, deleted_at = NULL WHERE id = 123;');
    console.log('   → 对应的交易记录也会被恢复\n');
    
  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    
    console.error('\n========================================');
    console.error('❌ 迁移执行失败！');
    console.error('========================================\n');
    console.error('错误信息:', error.message);
    console.error('\n完整错误:', error);
    
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行迁移
runMigration().catch(err => {
  console.error('\n迁移执行异常:', err);
  process.exit(1);
});
