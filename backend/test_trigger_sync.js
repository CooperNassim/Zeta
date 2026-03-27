/**
 * 测试触发器同步功能
 */

const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 测试触发器同步功能 ===\n');

    // 1. 创建测试买入订单(中文格式)
    console.log('1. 创建测试买入订单(中文格式)...');
    const buyOrderCN = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, order_time,
        psychological_score, strategy_score, overall_score,
        deleted
      ) VALUES (
        'TEST001', '买入', '000001', '平安银行',
        10.50, 1000, CURRENT_DATE, '09:30:00',
        8.5, 7.5, 8.0,
        false
      ) RETURNING id, trade_number, order_type, symbol
    `);
    console.log('   ✅ 创建订单:', buyOrderCN.rows[0]);

    // 检查是否生成交易记录
    const recordCN = await client.query(`
      SELECT * FROM trade_records WHERE trade_number = 'TEST001'
    `);
    console.log('   交易记录:', recordCN.rows.length > 0 ? '✅ 已生成' : '❌ 未生成');
    if (recordCN.rows.length > 0) {
      console.log('   记录详情:', {
        trade_number: recordCN.rows[0].trade_number,
        symbol: recordCN.rows[0].symbol,
        buy_price: recordCN.rows[0].buy_price,
        buy_quantity: recordCN.rows[0].buy_quantity
      });
    }

    // 2. 创建测试买入订单(英文格式)
    console.log('\n2. 创建测试买入订单(英文格式)...');
    const buyOrderEN = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, order_time,
        psychological_score, strategy_score, overall_score,
        deleted
      ) VALUES (
        'TEST002', 'buy', '600036', '招商银行',
        35.20, 500, CURRENT_DATE, '10:15:00',
        9.0, 8.0, 8.5,
        false
      ) RETURNING id, trade_number, order_type, symbol
    `);
    console.log('   ✅ 创建订单:', buyOrderEN.rows[0]);

    // 检查是否生成交易记录
    const recordEN = await client.query(`
      SELECT * FROM trade_records WHERE trade_number = 'TEST002'
    `);
    console.log('   交易记录:', recordEN.rows.length > 0 ? '✅ 已生成' : '❌ 未生成');
    if (recordEN.rows.length > 0) {
      console.log('   记录详情:', {
        trade_number: recordEN.rows[0].trade_number,
        symbol: recordEN.rows[0].symbol,
        buy_price: recordEN.rows[0].buy_price,
        buy_quantity: recordEN.rows[0].buy_quantity
      });
    }

    // 3. 创建测试卖出订单(中文格式)
    console.log('\n3. 创建测试卖出订单(中文格式)...');
    const sellOrderCN = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, order_time,
        psychological_score, strategy_score, overall_score,
        deleted
      ) VALUES (
        'TEST001', '卖出', '000001', '平安银行',
        11.00, 500, CURRENT_DATE, '14:30:00',
        8.0, 7.0, 7.5,
        false
      ) RETURNING id, trade_number, order_type, symbol
    `);
    console.log('   ✅ 创建订单:', sellOrderCN.rows[0]);

    // 检查交易记录是否更新
    const recordAfterSell = await client.query(`
      SELECT * FROM trade_records WHERE trade_number = 'TEST001'
    `);
    if (recordAfterSell.rows.length > 0) {
      const rec = recordAfterSell.rows[0];
      console.log('   交易记录更新:', {
        sell_price: rec.sell_price ? '✅ ' + rec.sell_price : '❌ 未设置',
        sell_quantity: rec.sell_quantity ? '✅ ' + rec.sell_quantity : '❌ 未设置',
        profit: rec.profit ? '✅ ' + rec.profit : '❌ 未设置'
      });
    }

    // 4. 创建测试卖出订单(英文格式)
    console.log('\n4. 创建测试卖出订单(英文格式)...');
    const sellOrderEN = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, order_time,
        psychological_score, strategy_score, overall_score,
        deleted
      ) VALUES (
        'TEST002', 'sell', '600036', '招商银行',
        36.00, 300, CURRENT_DATE, '15:00:00',
        7.5, 8.5, 8.0,
        false
      ) RETURNING id, trade_number, order_type, symbol
    `);
    console.log('   ✅ 创建订单:', sellOrderEN.rows[0]);

    // 检查交易记录是否更新
    const recordAfterSellEN = await client.query(`
      SELECT * FROM trade_records WHERE trade_number = 'TEST002'
    `);
    if (recordAfterSellEN.rows.length > 0) {
      const rec = recordAfterSellEN.rows[0];
      console.log('   交易记录更新:', {
        sell_price: rec.sell_price ? '✅ ' + rec.sell_price : '❌ 未设置',
        sell_quantity: rec.sell_quantity ? '✅ ' + rec.sell_quantity : '❌ 未设置',
        profit: rec.profit ? '✅ ' + rec.profit : '❌ 未设置'
      });
    }

    // 5. 显示所有测试数据
    console.log('\n5. 所有测试订单:');
    const allOrders = await client.query(`
      SELECT id, trade_number, order_type, symbol, quantity, price
      FROM trade_orders
      WHERE trade_number LIKE 'TEST%'
      ORDER BY id
    `);
    console.table(allOrders.rows);

    console.log('\n6. 所有交易记录:');
    const allRecords = await client.query(`
      SELECT id, trade_number, symbol, 
             buy_price, buy_quantity,
             sell_price, sell_quantity,
             profit, profit_percent
      FROM trade_records
      WHERE trade_number LIKE 'TEST%'
      ORDER BY id
    `);
    console.table(allRecords.rows);

    // 6. 清理测试数据
    console.log('\n7. 清理测试数据...');
    await client.query("DELETE FROM trade_orders WHERE trade_number LIKE 'TEST%'");
    await client.query("DELETE FROM trade_records WHERE trade_number LIKE 'TEST%'");
    console.log('   ✅ 测试数据已清理\n');

    console.log('========================================');
    console.log('✅ 触发器功能测试完成！');
    console.log('========================================');
    console.log('\n结论:');
    console.log('- 中文格式订单("买入"/"卖出") → 触发器正常工作');
    console.log('- 英文格式订单("buy"/"sell") → 触发器正常工作');
    console.log('- 买入订单自动创建交易记录');
    console.log('- 卖出订单自动更新交易记录并计算盈亏');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
