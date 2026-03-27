const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 检查触发器详细信息 ===\n');
    
    // 检查所有触发器
    const triggers = await client.query(`
      SELECT 
        trigger_name,
        event_object_table,
        event_manipulation,
        action_timing,
        action_orientation,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log('数据库中的所有触发器:');
    if (triggers.rows.length === 0) {
      console.log('   没有触发器');
    } else {
      triggers.rows.forEach(t => {
        console.log(`   - ${t.trigger_name}`);
        console.log(`     表: ${t.event_object_table}`);
        console.log(`     事件: ${t.action_timing} ${t.event_manipulation}`);
        console.log(`     函数: ${t.action_statement}`);
        console.log('');
      });
    }
    
    // 检查触发器函数
    const functions = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type
      FROM information_schema.routines
      WHERE routine_type = 'FUNCTION'
        AND routine_schema = 'public'
        AND routine_name LIKE '%sync%'
      ORDER BY routine_name
    `);
    
    console.log('\n同步相关的函数:');
    if (functions.rows.length === 0) {
      console.log('   没有找到函数');
    } else {
      functions.rows.forEach(f => {
        console.log(`   - ${f.routine_name} (返回类型: ${f.data_type})`);
      });
    }
    
    // 测试：创建一个简单的测试触发器
    console.log('\n\n=== 创建简单测试触发器 ===');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION simple_test_trigger()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE NOTICE '简单测试触发器被调用: order_type=%', NEW.order_type;
        
        IF NEW.order_type = '卖出' OR NEW.order_type = 'sell' THEN
          UPDATE trade_records 
          SET sell_price = 99.99, sell_quantity = 999
          WHERE trade_number = NEW.trade_number;
          
          RAISE NOTICE '更新完成，影响行数: %', (SELECT COUNT(*) FROM trade_records WHERE trade_number = NEW.trade_number AND sell_price = 99.99);
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ 简单测试函数已创建');
    
    // 创建测试触发器
    await client.query(`
      DROP TRIGGER IF EXISTS test_simple_trigger ON trade_orders;
      CREATE TRIGGER test_simple_trigger
        AFTER INSERT ON trade_orders
        FOR EACH ROW
        EXECUTE FUNCTION simple_test_trigger();
    `);
    console.log('✅ 简单测试触发器已创建\n');
    
    // 测试
    console.log('=== 测试简单触发器 ===\n');
    
    await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'SIMPLE_TRIGGER_TEST', '买入', '000001', '测试',
        10.00, 1000, CURRENT_DATE, false
      )
    `);
    console.log('1. 创建买入订单');
    
    await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'SIMPLE_TRIGGER_TEST', '卖出', '000001', '测试',
        11.00, 500, CURRENT_DATE, false
      )
    `);
    console.log('2. 创建卖出订单');
    
    const result = await client.query(`
      SELECT sell_price, sell_quantity FROM trade_records 
      WHERE trade_number = 'SIMPLE_TRIGGER_TEST'
    `);
    
    if (result.rows.length > 0) {
      console.log('   sell_price:', result.rows[0].sell_price);
      console.log('   sell_quantity:', result.rows[0].sell_quantity);
      
      if (result.rows[0].sell_price == 99.99) {
        console.log('\n   ✅✅✅ 简单触发器工作正常！');
      } else {
        console.log('\n   ❌ 简单触发器也没有工作');
      }
    }
    
    // 清理
    await client.query('DROP TRIGGER IF EXISTS test_simple_trigger ON trade_orders');
    await client.query('DROP FUNCTION IF EXISTS simple_test_trigger()');
    await client.query("DELETE FROM trade_orders WHERE trade_number = 'SIMPLE_TRIGGER_TEST'");
    await client.query("DELETE FROM trade_records WHERE trade_number = 'SIMPLE_TRIGGER_TEST'");
    console.log('\n3. 测试触发器已删除，数据已清理');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
})();
