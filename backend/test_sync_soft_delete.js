/**
 * 测试交易订单和交易记录软删除同步功能
 */

require('dotenv').config();
const { pool } = require('./src/config/database');

async function testSoftDeleteSync() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('测试软删除同步功能');
    console.log('========================================\n');
    
    // 生成唯一的测试交易编号（符合数据库字段长度限制）
    const timestamp = Date.now().toString().slice(-10); // 只取后10位
    const testTradeNumber = 'TEST' + timestamp; // 总长度不超过20
    const testSymbol = 'TEST' + Math.floor(Math.random() * 10000);
    
    console.log('📋 测试参数:');
    console.log(`   交易编号: ${testTradeNumber}`);
    console.log(`   股票代码: ${testSymbol}\n`);
    
    // ========================================
    // 测试 1: 创建买入订单
    // ========================================
    console.log('1️⃣  创建买入订单...');
    const buyOrder = await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, price, quantity,
        order_date, order_time, status, deleted
      ) VALUES (
        $1, '买入', $2, '测试股票', 10.00, 100,
        CURRENT_DATE, NOW(), 'completed', false
      )
      RETURNING *
    `, [testTradeNumber, testSymbol]);
    
    console.log('   ✅ 买入订单创建成功');
    console.log(`      ID: ${buyOrder.rows[0].id}`);
    console.log(`      deleted: ${buyOrder.rows[0].deleted}\n`);
    
    // 验证交易记录是否创建
    console.log('2️⃣  验证交易记录是否自动创建...');
    await new Promise(resolve => setTimeout(resolve, 100)); // 等待触发器执行
    
    const tradeRecord1 = await client.query(`
      SELECT * FROM trade_records 
      WHERE trade_number = $1 AND deleted = false
    `, [testTradeNumber]);
    
    if (tradeRecord1.rows.length > 0) {
      console.log('   ✅ 交易记录已自动创建');
      console.log(`      ID: ${tradeRecord1.rows[0].id}`);
      console.log(`      deleted: ${tradeRecord1.rows[0].deleted}\n`);
    } else {
      throw new Error('交易记录未创建');
    }
    
    // ========================================
    // 测试 2: 软删除买入订单
    // ========================================
    console.log('3️⃣  软删除买入订单...');
    const deletedOrder = await client.query(`
      UPDATE trade_orders 
      SET deleted = true, deleted_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [buyOrder.rows[0].id]);
    
    console.log('   ✅ 买入订单已软删除');
    console.log(`      deleted: ${deletedOrder.rows[0].deleted}`);
    console.log(`      deleted_at: ${deletedOrder.rows[0].deleted_at}\n`);
    
    // 验证交易记录是否同步软删除
    console.log('4️⃣  验证交易记录是否同步软删除...');
    await new Promise(resolve => setTimeout(resolve, 100)); // 等待触发器执行
    
    const tradeRecord2 = await client.query(`
      SELECT * FROM trade_records 
      WHERE trade_number = $1
    `, [testTradeNumber]);
    
    if (tradeRecord2.rows.length > 0 && tradeRecord2.rows[0].deleted === true) {
      console.log('   ✅✅✅ 交易记录已同步软删除！');
      console.log(`      deleted: ${tradeRecord2.rows[0].deleted}`);
      console.log(`      deleted_at: ${tradeRecord2.rows[0].deleted_at}\n`);
    } else {
      throw new Error('交易记录未同步软删除');
    }
    
    // ========================================
    // 测试 3: 恢复买入订单
    // ========================================
    console.log('5️⃣  恢复买入订单...');
    const restoredOrder = await client.query(`
      UPDATE trade_orders 
      SET deleted = false, deleted_at = NULL
      WHERE id = $1
      RETURNING *
    `, [buyOrder.rows[0].id]);
    
    console.log('   ✅ 买入订单已恢复');
    console.log(`      deleted: ${restoredOrder.rows[0].deleted}\n`);
    
    // 验证交易记录是否同步恢复
    console.log('6️⃣  验证交易记录是否同步恢复...');
    await new Promise(resolve => setTimeout(resolve, 100)); // 等待触发器执行
    
    const tradeRecord3 = await client.query(`
      SELECT * FROM trade_records 
      WHERE trade_number = $1
    `, [testTradeNumber]);
    
    if (tradeRecord3.rows.length > 0 && tradeRecord3.rows[0].deleted === false) {
      console.log('   ✅✅✅ 交易记录已同步恢复！');
      console.log(`      deleted: ${tradeRecord3.rows[0].deleted}`);
      console.log(`      deleted_at: ${tradeRecord3.rows[0].deleted_at}\n`);
    } else {
      throw new Error('交易记录未同步恢复');
    }
    
    // ========================================
    // 清理测试数据
    // ========================================
    console.log('7️⃣  清理测试数据...');
    await client.query(`DELETE FROM trade_records WHERE trade_number = $1`, [testTradeNumber]);
    await client.query(`DELETE FROM trade_orders WHERE trade_number = $1`, [testTradeNumber]);
    console.log('   ✅ 测试数据已清理\n');
    
    // ========================================
    // 测试结果
    // ========================================
    console.log('========================================');
    console.log('✅ 所有测试通过！');
    console.log('========================================\n');
    
    console.log('📋 测试总结:');
    console.log('   ✅ 创建订单时自动创建交易记录');
    console.log('   ✅ 软删除订单时同步软删除交易记录');
    console.log('   ✅ 恢复订单时同步恢复交易记录\n');
    
    console.log('🎉 软删除同步功能工作正常！\n');
    
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ 测试失败！');
    console.error('========================================\n');
    console.error('错误信息:', error.message);
    console.error('\n完整错误:', error);
    
    // 尝试清理测试数据
    try {
      await client.query(`DELETE FROM trade_records WHERE trade_number LIKE 'TEST_SOFT_DELETE_%'`);
      await client.query(`DELETE FROM trade_orders WHERE trade_number LIKE 'TEST_SOFT_DELETE_%'`);
      console.log('\n测试数据已清理');
    } catch (cleanupError) {
      console.error('\n清理测试数据失败:', cleanupError.message);
    }
    
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行测试
testSoftDeleteSync().catch(err => {
  console.error('\n测试执行异常:', err);
  process.exit(1);
});
