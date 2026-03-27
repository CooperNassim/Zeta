const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 详细测试触发器 ===\n');
    
    // 测试完整的买入->卖出流程
    console.log('1. 创建买入订单...');
    const buyOrder = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'TEST_DETAILED_001', '买入', '000001', '详细测试股票',
        10.00, 1000, CURRENT_DATE, false
      ) RETURNING id, trade_number, order_type, price, quantity
    `);
    console.log('   ✅ 买入订单:', buyOrder.rows[0]);
    
    // 检查交易记录
    console.log('\n2. 检查买入后的交易记录...');
    const buyRecord = await client.query(`
      SELECT id, trade_number, symbol, buy_price, buy_quantity, sell_price, sell_quantity
      FROM trade_records 
      WHERE trade_number = 'TEST_DETAILED_001'
    `);
    if (buyRecord.rows.length > 0) {
      console.log('   ✅ 交易记录已创建:');
      console.log('      ', buyRecord.rows[0]);
    } else {
      console.log('   ❌ 交易记录未创建');
    }
    
    // 创建卖出订单
    console.log('\n3. 创建卖出订单...');
    const sellOrder = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'TEST_DETAILED_001', '卖出', '000001', '详细测试股票',
        11.00, 500, CURRENT_DATE, false
      ) RETURNING id, trade_number, order_type, price, quantity
    `);
    console.log('   ✅ 卖出订单:', sellOrder.rows[0]);
    
    // 再次检查交易记录
    console.log('\n4. 检查卖出后的交易记录...');
    const sellRecord = await client.query(`
      SELECT 
        id, trade_number, symbol, 
        buy_price, buy_quantity, 
        sell_price, sell_quantity,
        profit, profit_percent,
        hold_duration
      FROM trade_records 
      WHERE trade_number = 'TEST_DETAILED_001'
    `);
    if (sellRecord.rows.length > 0) {
      const rec = sellRecord.rows[0];
      console.log('   交易记录详情:');
      console.log('      ID:', rec.id);
      console.log('      买入价:', rec.buy_price, '数量:', rec.buy_quantity);
      console.log('      卖出价:', rec.sell_price, '数量:', rec.sell_quantity);
      console.log('      盈亏:', rec.profit, '百分比:', rec.profit_percent);
      console.log('      持有天数:', rec.hold_duration);
      
      if (rec.sell_price && rec.sell_quantity) {
        console.log('\n   ✅ 触发器工作正常！');
      } else {
        console.log('\n   ❌ 卖出信息未更新');
      }
    } else {
      console.log('   ❌ 交易记录未找到');
    }
    
    // 测试英文订单
    console.log('\n\n=== 测试英文订单 ===\n');
    
    console.log('5. 创建英文买入订单...');
    const buyEN = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'TEST_DETAILED_002', 'buy', '600036', 'English Test',
        20.00, 500, CURRENT_DATE, false
      ) RETURNING id, trade_number, order_type
    `);
    console.log('   ✅ 创建订单:', buyEN.rows[0]);
    
    const recordEN = await client.query(`
      SELECT id, trade_number, buy_price, buy_quantity 
      FROM trade_records 
      WHERE trade_number = 'TEST_DETAILED_002'
    `);
    if (recordEN.rows.length > 0) {
      console.log('   ✅ 交易记录已创建:', recordEN.rows[0]);
    } else {
      console.log('   ❌ 交易记录未创建');
    }
    
    console.log('\n6. 创建英文卖出订单...');
    const sellEN = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'TEST_DETAILED_002', 'sell', '600036', 'English Test',
        22.00, 300, CURRENT_DATE, false
      ) RETURNING id, trade_number, order_type
    `);
    console.log('   ✅ 创建订单:', sellEN.rows[0]);
    
    const recordAfterSellEN = await client.query(`
      SELECT id, trade_number, buy_price, sell_price, sell_quantity, profit
      FROM trade_records 
      WHERE trade_number = 'TEST_DETAILED_002'
    `);
    if (recordAfterSellEN.rows.length > 0) {
      const rec = recordAfterSellEN.rows[0];
      console.log('   交易记录:', rec);
      if (rec.sell_price) {
        console.log('   ✅ 卖出信息已更新');
      } else {
        console.log('   ❌ 卖出信息未更新');
      }
    }
    
    // 清理测试数据
    console.log('\n\n=== 清理测试数据 ===');
    await client.query("DELETE FROM trade_orders WHERE trade_number LIKE 'TEST_DETAILED_%'");
    await client.query("DELETE FROM trade_records WHERE trade_number LIKE 'TEST_DETAILED_%'");
    console.log('✅ 测试数据已清理\n');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
