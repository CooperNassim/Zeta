/**
 * 执行交易记录模块重构迁移脚本
 * 
 * 功能：
 * 1. 重构 trade_records 表结构
 * 2. 创建自动同步触发器
 * 3. 为现有数据创建交易记录
 */

const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

(async () => {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('交易记录模块重构迁移');
    console.log('========================================\n');

    // 1. 检查当前 trade_orders 表结构
    console.log('1. 检查 trade_orders 表结构...');
    const ordersColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trade_orders' 
      ORDER BY ordinal_position
    `);
    console.log('   trade_orders 表字段:');
    console.table(ordersColumns.rows);

    // 2. 检查当前 trade_records 表结构
    console.log('\n2. 检查 trade_records 表结构...');
    const recordsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trade_records' 
      ORDER BY ordinal_position
    `);
    console.log('   trade_records 表字段:');
    console.table(recordsColumns.rows);

    // 3. 备份现有数据
    console.log('\n3. 备份现有 trade_records 数据...');
    await client.query('DROP TABLE IF EXISTS trade_records_backup_sync CASCADE');
    await client.query('CREATE TABLE trade_records_backup_sync AS SELECT * FROM trade_records');
    const backupCount = await client.query('SELECT COUNT(*) FROM trade_records_backup_sync');
    console.log(`   ✅ 已备份 ${backupCount.rows[0].count} 条记录\n`);

    // 4. 读取迁移脚本
    console.log('4. 执行迁移脚本...');
    const migrationPath = path.join(__dirname, 'migrations', 'migration_trade_records_sync.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // 分割并执行迁移语句
    // 移除注释行并按分号分割
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement + ';');
          successCount++;
        } catch (err) {
          // 忽略某些特定错误
          if (err.message.includes('already exists') || 
              err.message.includes('does not exist') ||
              err.message.includes('duplicate key')) {
            console.log(`   ⚠️ 跳过: ${err.message.substring(0, 100)}`);
          } else {
            console.log(`   ❌ 错误: ${err.message.substring(0, 200)}`);
            errorCount++;
          }
        }
      }
    }

    console.log(`   ✅ 执行完成: 成功 ${successCount} 条, 错误 ${errorCount} 条\n`);

    // 5. 验证新表结构
    console.log('5. 验证新 trade_records 表结构...');
    const newColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'trade_records' 
      ORDER BY ordinal_position
    `);
    console.log('   新表结构:');
    console.table(newColumns.rows);

    // 6. 检查触发器
    console.log('\n6. 检查触发器...');
    const triggers = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'trade_orders'
    `);
    console.log('   trade_orders 触发器:');
    console.table(triggers.rows);

    // 7. 检查同步结果
    console.log('\n7. 检查数据同步结果...');
    const buyOrdersCount = await client.query(
      "SELECT COUNT(*) FROM trade_orders WHERE order_type = '买入' AND deleted = false"
    );
    const sellOrdersCount = await client.query(
      "SELECT COUNT(*) FROM trade_orders WHERE order_type = '卖出' AND deleted = false"
    );
    const recordsCount = await client.query(
      'SELECT COUNT(*) FROM trade_records WHERE deleted = false'
    );

    console.log(`   买入订单数: ${buyOrdersCount.rows[0].count}`);
    console.log(`   卖出订单数: ${sellOrdersCount.rows[0].count}`);
    console.log(`   交易记录数: ${recordsCount.rows[0].count}`);

    // 8. 显示示例数据
    console.log('\n8. 示例交易记录数据:');
    const sampleRecords = await client.query(`
      SELECT id, trade_number, symbol, name,
             buy_price, buy_quantity, 
             sell_price, sell_quantity,
             profit, profit_percent, hold_duration
      FROM trade_records
      WHERE deleted = false
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.table(sampleRecords.rows);

    console.log('\n========================================');
    console.log('迁移完成！');
    console.log('========================================');
    console.log('\n业务逻辑说明:');
    console.log('1. 当新增"买入"类型订单时，自动在 trade_records 中创建买入记录');
    console.log('2. 当新增"卖出"类型订单时，自动更新 trade_records 中对应记录');
    console.log('3. 多条卖出记录会自动合并：');
    console.log('   - 卖出数量 = 总和');
    console.log('   - 卖出价格 = 加权平均价格');
    console.log('   - 卖出时间 = 最晚的卖出时间');
    console.log('\n备份表: trade_records_backup_sync');
    console.log('如需回滚，请手动恢复备份数据\n');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
})();
