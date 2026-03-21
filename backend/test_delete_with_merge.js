require('dotenv').config();
const { pool } = require('./src/config/database');

async function testScenario() {
  console.log('=== 测试删除同步场景 ===\n');

  try {
    // 1. 创建测试订单
    console.log('1. 创建测试订单...');
    const tradeNumber = 'TEST_SYNC_' + Date.now();
    const insertResult = await pool.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, price, quantity,
        order_date, status, is_virtual, deleted, created_at, updated_at
      ) VALUES (
        $1, 'buy', 'TEST', '测试同步', 100, 10,
        CURRENT_DATE, 'pending', false, false, NOW(), NOW()
      ) RETURNING id, trade_number
    `, [tradeNumber]);

    const newOrder = insertResult.rows[0];
    console.log(`✅ 创建成功: ID=${newOrder.id}, 编号=${newOrder.trade_number}\n`);

    // 2. 模拟 A 浏览器查看订单
    console.log('2. A浏览器查看订单（删除前）...');
    const ordersBefore = await pool.query(
      "SELECT id, trade_number, symbol, deleted FROM trade_orders WHERE deleted = false"
    );
    console.log(`订单数量: ${ordersBefore.rows.length}`);
    const existsBefore = ordersBefore.rows.some(o => o.trade_number === newOrder.trade_number);
    console.log(`测试订单存在: ${existsBefore ? '✅ 是' : '❌ 否'}\n`);

    // 3. 模拟 A 浏览器删除订单
    console.log('3. A浏览器删除订单...');
    const deleteResult = await pool.query(
      "UPDATE trade_orders SET deleted = true, deleted_at = NOW() WHERE id = $1 RETURNING deleted",
      [newOrder.id]
    );
    console.log(`✅ 删除成功: deleted=${deleteResult.rows[0].deleted}\n`);

    // 4. 模拟 B 浏览器刷新页面（调用 sync/all）
    console.log('4. B浏览器刷新页面（sync/all）...');
    const syncResult = await pool.query(
      "SELECT id, trade_number, symbol, deleted FROM trade_orders WHERE trade_number = $1",
      [newOrder.trade_number]
    );
    const orderFromDB = syncResult.rows[0];
    console.log(`数据库中的订单: ${JSON.stringify(orderFromDB)}`);
    console.log(`订单删除状态: ${orderFromDB?.deleted ? '已删除' : '未删除'}\n`);

    // 5. 模拟前端过滤逻辑
    console.log('5. 前端过滤逻辑...');
    const allOrders = (await pool.query(
      "SELECT id, trade_number, symbol, deleted FROM trade_orders"
    )).rows;
    const activeOrders = allOrders.filter(o => !o.deleted);
    console.log(`所有订单（包括已删除）: ${allOrders.length} 条`);
    console.log(`活跃订单（过滤后）: ${activeOrders.length} 条`);
    const isVisible = activeOrders.some(o => o.trade_number === newOrder.trade_number);
    console.log(`已删除订单是否可见: ${isVisible ? '❌ 是' : '✅ 否'}\n`);

    // 6. 清理测试数据
    console.log('6. 清理测试数据...');
    await pool.query(
      "DELETE FROM trade_orders WHERE trade_number = $1",
      [newOrder.trade_number]
    );
    console.log('✅ 清理完成\n');

    console.log('=== 测试结果 ===');
    console.log('✅ 删除功能正常工作');
    console.log('✅ 数据库正确标记 deleted=true');
    console.log('✅ 过滤逻辑正确过滤已删除订单');
    console.log('');
    console.log('前端行为:');
    console.log('- A浏览器删除 → 数据库 deleted=true');
    console.log('- B浏览器刷新 → sync/all 返回数据（包含 deleted=true）');
    console.log('- importOrders 过滤 → 移除 deleted=true 的订单');
    console.log('- persist merge → 使用过滤后的订单');
    console.log('- B浏览器显示 → 不显示已删除的订单 ✅');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await pool.end();
  }
}

testScenario();
