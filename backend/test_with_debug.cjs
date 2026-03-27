const { pool } = require('./src/config/database');
const fs = require('fs');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 应用调试版触发器 ===\n');
    
    // 应用调试版触发器
    const sql = fs.readFileSync('fix_trigger_debug.sql', 'utf8');
    await client.query(sql);
    console.log('✅ 调试版触发器已应用\n');
    
    // 测试
    console.log('=== 开始测试 ===\n');
    
    // 创建买入订单
    console.log('1. 创建买入订单...');
    const buy = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'DEBUG_TEST_001', '买入', '000001', '调试测试',
        10.00, 1000, CURRENT_DATE, false
      ) RETURNING *
    `);
    console.log('   ✅ 买入订单:', buy.rows[0].id, buy.rows[0].order_type);
    
    // 创建卖出订单
    console.log('\n2. 创建卖出订单...');
    const sell = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'DEBUG_TEST_001', '卖出', '000001', '调试测试',
        11.00, 500, CURRENT_DATE, false
      ) RETURNING *
    `);
    console.log('   ✅ 卖出订单:', sell.rows[0].id, sell.rows[0].order_type);
    
    // 检查结果
    console.log('\n3. 检查交易记录...');
    const record = await client.query(`
      SELECT * FROM trade_records WHERE trade_number = 'DEBUG_TEST_001'
    `);
    
    if (record.rows.length > 0) {
      const rec = record.rows[0];
      console.log('   ID:', rec.id);
      console.log('   买入价:', rec.buy_price, '数量:', rec.buy_quantity);
      console.log('   卖出价:', rec.sell_price || 'NULL', '数量:', rec.sell_quantity || 'NULL');
      console.log('   盈亏:', rec.profit || 'NULL');
      
      if (rec.sell_price) {
        console.log('\n   ✅✅✅ 触发器工作正常！');
      } else {
        console.log('\n   ❌ 卖出信息未更新');
      }
    }
    
    // 清理
    await client.query("DELETE FROM trade_orders WHERE trade_number = 'DEBUG_TEST_001'");
    await client.query("DELETE FROM trade_records WHERE trade_number = 'DEBUG_TEST_001'");
    console.log('\n4. 测试数据已清理');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
})();
