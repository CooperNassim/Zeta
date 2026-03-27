const { pool } = require('./src/config/database');

(async () => {
  try {
    console.log('=== 检查触发器状态 ===\n');

    // 1. 检查trade_orders表结构
    const orderColumns = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'trade_orders'
      ORDER BY ordinal_position
    `);
    
    console.log('1. trade_orders 表结构:');
    orderColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    // 2. 检查触发器是否存在
    const triggers = await pool.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('trade_orders', 'trade_records')
    `);
    
    console.log('\n2. 数据库触发器:');
    if (triggers.rows.length === 0) {
      console.log('   ❌ 没有找到触发器');
    } else {
      console.log('   ✅ 找到触发器:');
      triggers.rows.forEach(t => {
        console.log(`   - ${t.trigger_name} on ${t.event_object_table}`);
      });
    }

    // 3. 检查触发器函数
    const functions = await pool.query(`
      SELECT 
        routine_name
      FROM information_schema.routines
      WHERE routine_type = 'FUNCTION'
        AND routine_name LIKE '%trade%'
        AND routine_schema = 'public'
    `);
    
    console.log('\n3. 触发器函数:');
    if (functions.rows.length === 0) {
      console.log('   ❌ 没有找到相关函数');
    } else {
      console.log('   ✅ 找到函数:');
      functions.rows.forEach(f => {
        console.log(`   - ${f.routine_name}`);
      });
    }

    // 4. 测试触发器功能
    console.log('\n4. 测试触发器功能:');
    
    // 获取现有订单数量
    const beforeOrders = await pool.query('SELECT COUNT(*) FROM trade_orders WHERE trade_number = $1', ['TEST001']);
    const beforeRecords = await pool.query('SELECT COUNT(*) FROM trade_records WHERE trade_number = $1', ['TEST001']);
    console.log(`   测试前: 订单=${beforeOrders.rows[0].count}, 记录=${beforeRecords.rows[0].count}`);
    
    // 创建测试买入订单
    const testOrder = await pool.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date,
        deleted
      ) VALUES (
        'TEST001', '买入', '000001', '测试',
        10.00, 1000, CURRENT_DATE,
        false
      ) RETURNING id, trade_number, order_type
    `);
    console.log('   ✅ 创建测试订单:', testOrder.rows[0]);

    // 检查是否生成交易记录
    const afterRecord = await pool.query(`
      SELECT * FROM trade_records 
      WHERE trade_number = 'TEST001'
    `);
    
    if (afterRecord.rows.length > 0) {
      console.log('   ✅ 触发器工作正常，已创建交易记录');
      console.log('      记录ID:', afterRecord.rows[0].id);
    } else {
      console.log('   ❌ 触发器未工作，没有创建交易记录');
    }

    // 清理测试数据
    await pool.query("DELETE FROM trade_orders WHERE trade_number = 'TEST001'");
    await pool.query("DELETE FROM trade_records WHERE trade_number = 'TEST001'");
    console.log('   ✅ 测试数据已清理\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
