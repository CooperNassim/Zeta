const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    // 设置客户端显示NOTICE消息
    await client.query('SET client_min_messages TO NOTICE');
    
    console.log('=== 直接测试触发器 ===\n');
    
    // 创建买入订单
    console.log('1. 创建买入订单...');
    const buyResult = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'DIRECT_TEST_001', '买入', '000001', '直接测试',
        10.00, 1000, CURRENT_DATE, false
      ) RETURNING id, trade_number, order_type
    `);
    console.log('   结果:', buyResult.rows[0]);
    
    // 检查交易记录
    const buyRec = await client.query(`
      SELECT id, trade_number, buy_price, buy_quantity 
      FROM trade_records 
      WHERE trade_number = 'DIRECT_TEST_001'
    `);
    console.log('   交易记录:', buyRec.rows.length > 0 ? '✅ 已创建' : '❌ 未创建', buyRec.rows[0]?.id || '');
    
    // 创建卖出订单
    console.log('\n2. 创建卖出订单...');
    const sellResult = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'DIRECT_TEST_001', '卖出', '000001', '直接测试',
        11.00, 500, CURRENT_DATE, false
      ) RETURNING id, trade_number, order_type
    `);
    console.log('   结果:', sellResult.rows[0]);
    
    // 立即检查交易记录
    const sellRec = await client.query(`
      SELECT 
        id, trade_number, 
        buy_price, buy_quantity,
        sell_price, sell_quantity,
        profit, profit_percent
      FROM trade_records 
      WHERE trade_number = 'DIRECT_TEST_001'
    `);
    
    if (sellRec.rows.length > 0) {
      const rec = sellRec.rows[0];
      console.log('\n   交易记录详情:');
      console.log('      ID:', rec.id);
      console.log('      买入:', rec.buy_price, 'x', rec.buy_quantity);
      console.log('      卖出:', rec.sell_price || 'NULL', 'x', rec.sell_quantity || 'NULL');
      console.log('      盈亏:', rec.profit || 'NULL');
      
      if (rec.sell_price !== null) {
        console.log('\n   ✅✅✅ 成功！触发器工作了！');
      } else {
        console.log('\n   ❌ 卖出信息仍然是NULL');
        
        // 尝试手动调用UPDATE查看是否有效
        console.log('\n3. 尝试手动UPDATE...');
        await client.query(`
          UPDATE trade_records 
          SET sell_price = 11.00, sell_quantity = 500
          WHERE trade_number = 'DIRECT_TEST_001'
        `);
        
        const afterManual = await client.query(`
          SELECT sell_price, sell_quantity FROM trade_records WHERE trade_number = 'DIRECT_TEST_001'
        `);
        console.log('   手动更新后:', afterManual.rows[0]);
      }
    }
    
    // 清理
    await client.query("DELETE FROM trade_orders WHERE trade_number = 'DIRECT_TEST_001'");
    await client.query("DELETE FROM trade_records WHERE trade_number = 'DIRECT_TEST_001'");
    console.log('\n4. 数据已清理');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
})();
