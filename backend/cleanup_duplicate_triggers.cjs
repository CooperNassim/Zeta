const { pool } = require('./src/config/database');

async function cleanupDuplicateTriggers() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('=== 清理重复触发器 ===\n');
    
    // 1. 删除旧的触发器
    const oldTriggers = [
      'sync_buy_order_trigger',
      'sync_sell_order_trigger',
      'trg_sync_buy_order',
      'trg_sync_sell_order'
    ];
    
    for (const triggerName of oldTriggers) {
      console.log(`删除触发器: ${triggerName}`);
      await client.query(`DROP TRIGGER IF EXISTS ${triggerName} ON trade_orders;`);
    }
    
    console.log('\n保留触发器:');
    console.log('  - trg_sync_trade_order_to_records (统一触发器)');
    console.log('  - trg_update_trade_record_on_order_delete (删除同步)');
    
    // 2. 清理重复的交易记录
    console.log('\n=== 清理重复的交易记录 ===\n');
    
    // 查找重复记录（同一个trade_number有多条记录）
    const duplicateCheck = await client.query(`
      SELECT trade_number, COUNT(*) as count
      FROM trade_records
      WHERE deleted = false
      GROUP BY trade_number
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC;
    `);
    
    if (duplicateCheck.rows.length > 0) {
      console.log(`找到 ${duplicateCheck.rows.length} 个重复的交易编号：\n`);
      
      for (const row of duplicateCheck.rows) {
        console.log(`  ${row.trade_number}: ${row.count} 条记录`);
        
        // 获取该trade_number的所有记录
        const records = await client.query(
          'SELECT id, created_at FROM trade_records WHERE trade_number = $1 AND deleted = false ORDER BY created_at',
          [row.trade_number]
        );
        
        // 保留最早的一条，删除其他的
        if (records.rows.length > 1) {
          const keepId = records.rows[0].id;
          const deleteIds = records.rows.slice(1).map(r => r.id);
          
          console.log(`    保留 ID ${keepId}，删除 ID: ${deleteIds.join(', ')}`);
          
          await client.query(
            'DELETE FROM trade_records WHERE id = ANY($1)',
            [deleteIds]
          );
        }
      }
    } else {
      console.log('没有找到重复的交易记录');
    }
    
    await client.query('COMMIT');
    console.log('\n✅ 清理完成！');
    
    // 验证结果
    console.log('\n=== 验证结果 ===\n');
    const remainingTriggers = await client.query(`
      SELECT tgname FROM pg_trigger
      WHERE tgrelid = 'trade_orders'::regclass
        AND tgname NOT LIKE 'RI_%'
      ORDER BY tgname;
    `);
    
    console.log('剩余触发器:');
    remainingTriggers.rows.forEach(r => console.log(`  - ${r.tgname}`));
    
    const remainingRecords = await client.query(`
      SELECT trade_number, COUNT(*) as count
      FROM trade_records
      WHERE deleted = false
      GROUP BY trade_number
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC;
    `);
    
    console.log('\n重复记录数:', remainingRecords.rows.length);
    
    process.exit();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ 错误:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

cleanupDuplicateTriggers();
