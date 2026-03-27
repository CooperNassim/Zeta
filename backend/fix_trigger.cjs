const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 修复触发器函数 ===\n');
    
    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'fix_trigger_trade_type.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // 执行SQL
    await client.query(sql);
    console.log('✅ 触发器函数已更新\n');
    
    // 测试触发器
    console.log('=== 测试触发器 ===\n');
    
    // 测试1: 中文买入
    console.log('1. 测试中文买入订单...');
    const buyCN = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'TEST_FIX_001', '买入', '000001', '测试股票',
        10.00, 1000, CURRENT_DATE, false
      ) RETURNING id, trade_number, order_type
    `);
    console.log('   ✅ 创建订单:', buyCN.rows[0]);
    
    const recordCN = await client.query(`
      SELECT * FROM trade_records WHERE trade_number = 'TEST_FIX_001'
    `);
    if (recordCN.rows.length > 0) {
      console.log('   ✅ 触发器工作正常，已创建交易记录');
      console.log('      ID:', recordCN.rows[0].id, 'symbol:', recordCN.rows[0].symbol);
    } else {
      console.log('   ❌ 触发器未工作');
    }
    
    // 测试2: 英文买入
    console.log('\n2. 测试英文买入订单...');
    const buyEN = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'TEST_FIX_002', 'buy', '600036', 'Test Stock',
        20.00, 500, CURRENT_DATE, false
      ) RETURNING id, trade_number, order_type
    `);
    console.log('   ✅ 创建订单:', buyEN.rows[0]);
    
    const recordEN = await client.query(`
      SELECT * FROM trade_records WHERE trade_number = 'TEST_FIX_002'
    `);
    if (recordEN.rows.length > 0) {
      console.log('   ✅ 触发器工作正常，已创建交易记录');
      console.log('      ID:', recordEN.rows[0].id, 'symbol:', recordEN.rows[0].symbol);
    } else {
      console.log('   ❌ 触发器未工作');
    }
    
    // 测试3: 中文卖出
    console.log('\n3. 测试中文卖出订单...');
    const sellCN = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'TEST_FIX_001', '卖出', '000001', '测试股票',
        11.00, 500, CURRENT_DATE, false
      ) RETURNING id, trade_number, order_type
    `);
    console.log('   ✅ 创建订单:', sellCN.rows[0]);
    
    const recordAfterSell = await client.query(`
      SELECT * FROM trade_records WHERE trade_number = 'TEST_FIX_001'
    `);
    if (recordAfterSell.rows.length > 0 && recordAfterSell.rows[0].sell_price) {
      console.log('   ✅ 触发器工作正常，已更新卖出信息');
      console.log('      sell_price:', recordAfterSell.rows[0].sell_price, 
                  'sell_quantity:', recordAfterSell.rows[0].sell_quantity);
    } else {
      console.log('   ❌ 触发器未正确更新');
    }
    
    // 清理测试数据
    console.log('\n=== 清理测试数据 ===');
    await client.query("DELETE FROM trade_orders WHERE trade_number LIKE 'TEST_FIX_%'");
    await client.query("DELETE FROM trade_records WHERE trade_number LIKE 'TEST_FIX_%'");
    console.log('✅ 测试数据已清理\n');
    
    console.log('========================================');
    console.log('✅ 触发器修复完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
