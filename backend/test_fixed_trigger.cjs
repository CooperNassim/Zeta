const { pool } = require('./src/config/database');
const fs = require('fs');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 应用修复版触发器 ===\n');
    
    const sql = fs.readFileSync('fix_trigger_step_by_step.sql', 'utf8');
    await client.query(sql);
    console.log('✅ 修复版触发器已应用\n');
    
    console.log('=== 完整测试 ===\n');
    
    // 测试1: 中文买入+卖出
    console.log('1. 测试中文订单流程...');
    await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, price, quantity, order_date, deleted
      ) VALUES ('FINAL_TEST_001', '买入', '000001', '测试', 10.00, 1000, CURRENT_DATE, false)
    `);
    console.log('   ✅ 创建买入订单');
    
    await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, price, quantity, order_date, deleted
      ) VALUES ('FINAL_TEST_001', '卖出', '000001', '测试', 11.00, 500, CURRENT_DATE, false)
    `);
    console.log('   ✅ 创建卖出订单');
    
    const result1 = await client.query(`
      SELECT buy_price, buy_quantity, sell_price, sell_quantity, profit 
      FROM trade_records WHERE trade_number = 'FINAL_TEST_001'
    `);
    
    if (result1.rows.length > 0 && result1.rows[0].sell_price) {
      console.log('   ✅✅✅ 中文订单成功！');
      console.log('      买入:', result1.rows[0].buy_price, 'x', result1.rows[0].buy_quantity);
      console.log('      卖出:', result1.rows[0].sell_price, 'x', result1.rows[0].sell_quantity);
      console.log('      盈亏:', result1.rows[0].profit);
    } else {
      console.log('   ❌ 中文订单失败');
    }
    
    // 测试2: 英文买入+卖出
    console.log('\n2. 测试英文订单流程...');
    await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, price, quantity, order_date, deleted
      ) VALUES ('FINAL_TEST_002', 'buy', '600036', 'Test', 20.00, 500, CURRENT_DATE, false)
    `);
    console.log('   ✅ 创建买入订单');
    
    await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, price, quantity, order_date, deleted
      ) VALUES ('FINAL_TEST_002', 'sell', '600036', 'Test', 22.00, 300, CURRENT_DATE, false)
    `);
    console.log('   ✅ 创建卖出订单');
    
    const result2 = await client.query(`
      SELECT buy_price, buy_quantity, sell_price, sell_quantity, profit 
      FROM trade_records WHERE trade_number = 'FINAL_TEST_002'
    `);
    
    if (result2.rows.length > 0 && result2.rows[0].sell_price) {
      console.log('   ✅✅✅ 英文订单成功！');
      console.log('      买入:', result2.rows[0].buy_price, 'x', result2.rows[0].buy_quantity);
      console.log('      卖出:', result2.rows[0].sell_price, 'x', result2.rows[0].sell_quantity);
      console.log('      盈亏:', result2.rows[0].profit);
    } else {
      console.log('   ❌ 英文订单失败');
    }
    
    // 清理
    await client.query("DELETE FROM trade_orders WHERE trade_number LIKE 'FINAL_TEST_%'");
    await client.query("DELETE FROM trade_records WHERE trade_number LIKE 'FINAL_TEST_%'");
    console.log('\n3. 测试数据已清理');
    
    console.log('\n========================================');
    console.log('✅ 触发器修复完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
})();
