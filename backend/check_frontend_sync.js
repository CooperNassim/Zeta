/**
 * 验证前端数据同步状态
 * 
 * 检查内容：
 * 1. 数据库中的订单数据是否正确
 * 2. buy_order_id 关联是否正确
 * 3. 前端计算可卖出数量是否正确
 */

const { pool } = require('./src/config/database');

async function checkFrontendSync() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('前端数据同步验证');
    console.log('========================================\n');

    // 1. 检查 buy_order_id 字段是否存在
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trade_orders' AND column_name = 'buy_order_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ buy_order_id 字段不存在\n');
      console.log('请先运行 add_buy_order_id_field.js 添加字段\n');
      return;
    }
    console.log('✅ buy_order_id 字段已存在\n');

    // 2. 获取所有未删除的订单
    const allOrders = await client.query(`
      SELECT 
        id, 
        trade_number, 
        order_type, 
        quantity,
        buy_order_id,
        deleted
      FROM trade_orders
      WHERE deleted = false
      ORDER BY trade_number, order_type
    `);

    console.log(`总共 ${allOrders.rows.length} 个未删除订单\n`);

    // 3. 按交易编号分组
    const ordersByTradeNumber = new Map();
    for (const order of allOrders.rows) {
      if (!ordersByTradeNumber.has(order.trade_number)) {
        ordersByTradeNumber.set(order.trade_number, []);
      }
      ordersByTradeNumber.get(order.trade_number).push(order);
    }

    // 4. 检查每个交易编号的订单关联状态
    console.log('========================================');
    console.log('按交易编号检查关联状态');
    console.log('========================================\n');

    let totalIssues = 0;
    let totalValid = 0;

    for (const [tradeNumber, orders] of ordersByTradeNumber) {
      const buyOrders = orders.filter(o => o.order_type === 'buy');
      const sellOrders = orders.filter(o => o.order_type === 'sell');

      if (buyOrders.length === 0) {
        console.log(`⚠️  交易编号 ${tradeNumber}: 只有卖出订单，没有买入订单`);
        console.log(`   卖出订单: ${sellOrders.map(o => `ID=${o.id}, qty=${o.quantity}`).join(', ')}\n`);
        continue;
      }

      if (sellOrders.length === 0) {
        console.log(`ℹ️  交易编号 ${tradeNumber}: 只有买入订单，没有卖出订单`);
        console.log(`   买入订单: ${buyOrders.map(o => `ID=${o.id}, qty=${o.quantity}`).join(', ')}\n`);
        continue;
      }

      // 计算总的买入和卖出数量
      const totalBuyQty = buyOrders.reduce((sum, o) => sum + parseInt(o.quantity), 0);
      const totalSellQty = sellOrders.reduce((sum, o) => sum + parseInt(o.quantity), 0);
      const availableQty = totalBuyQty - totalSellQty;

      // 检查每个卖出订单的关联状态
      let hasIssue = false;
      for (const sellOrder of sellOrders) {
        if (sellOrder.buy_order_id === null) {
          hasIssue = true;
          console.log(`❌ 交易编号 ${tradeNumber}:`);
          console.log(`   卖出订单 ID=${sellOrder.id} 没有关联买入订单`);
          console.log(`   期望: buy_order_id 应为 ${buyOrders[0].id} (或其他有效买入订单ID)`);
          console.log(`   影响: 可卖出数量计算可能不准确`);
          totalIssues++;
        } else if (!buyOrders.some(o => o.id === sellOrder.buy_order_id)) {
          hasIssue = true;
          console.log(`❌ 交易编号 ${tradeNumber}:`);
          console.log(`   卖出订单 ID=${sellOrder.id} 关联到不存在的买入订单 ID=${sellOrder.buy_order_id}`);
          console.log(`   期望: buy_order_id 应为 ${buyOrders[0].id} (或其他有效买入订单ID)`);
          console.log(`   影响: 可卖出数量计算错误！`);
          totalIssues++;
        } else {
          totalValid++;
        }
      }

      if (!hasIssue) {
        console.log(`✅ 交易编号 ${tradeNumber}:`);
        console.log(`   买入: ${totalBuyQty}, 卖出: ${totalSellQty}, 可卖出: ${availableQty}`);
        console.log(`   买入订单: ${buyOrders.map(o => `ID=${o.id}`).join(', ')}`);
        console.log(`   卖出订单: ${sellOrders.map(o => `ID=${o.id}(关联=${o.buy_order_id})`).join(', ')}`);
      }
      console.log('');
    }

    // 5. 汇总统计
    console.log('========================================');
    console.log('汇总统计');
    console.log('========================================');
    console.log(`✅ 正确关联的卖出订单: ${totalValid} 个`);
    console.log(`❌ 存在问题的卖出订单: ${totalIssues} 个`);
    console.log('');

    if (totalIssues === 0) {
      console.log('🎉 所有卖出订单都已正确关联！前端计算应正常工作。');
    } else {
      console.log('⚠️  存在问题的订单需要修复！');
      console.log('请运行 fix_buy_order_id.js 来修复这些问题\n');
    }

    // 6. 模拟前端计算逻辑
    console.log('========================================');
    console.log('前端计算逻辑模拟');
    console.log('========================================\n');

    for (const [tradeNumber, orders] of ordersByTradeNumber) {
      const buyOrders = orders.filter(o => o.order_type === 'buy');
      const sellOrders = orders.filter(o => o.order_type === 'sell');

      if (buyOrders.length === 0 || sellOrders.length === 0) continue;

      // 模拟 calculateAvailableQuantity 函数逻辑（使用 buyOrderId 方式）
      for (const buyOrder of buyOrders) {
        const buyQty = parseInt(buyOrder.quantity);
        
        // 查找关联的卖出订单
        const linkedSellOrders = sellOrders.filter(o => o.buy_order_id === buyOrder.id);
        const soldQty = linkedSellOrders.reduce((sum, o) => sum + parseInt(o.quantity), 0);
        
        const calculatedAvailable = Math.max(0, buyQty - soldQty);

        // 使用 tradeNumber 方式计算
        const totalBuyQty = orders
          .filter(o => o.order_type === 'buy')
          .reduce((sum, o) => sum + parseInt(o.quantity), 0);
        
        const activeBuyOrderIds = new Set(buyOrders.map(o => o.id));
        const totalSoldQty = orders
          .filter(o => 
            o.order_type === 'sell' &&
            (o.buy_order_id === null || activeBuyOrderIds.has(o.buy_order_id))
          )
          .reduce((sum, o) => sum + parseInt(o.quantity), 0);
        
        const tradeNumberAvailable = Math.max(0, totalBuyQty - totalSoldQty);

        console.log(`交易编号 ${tradeNumber}, 买入订单 ID=${buyOrder.id}:`);
        console.log(`  买入数量: ${buyQty}`);
        console.log(`  关联卖出数量: ${soldQty} (订单: ${linkedSellOrders.map(o => o.id).join(', ') || '无'})`);
        console.log(`  buyOrderId方式可卖出: ${calculatedAvailable}`);
        console.log(`  tradeNumber方式可卖出: ${tradeNumberAvailable}`);

        if (calculatedAvailable !== tradeNumberAvailable) {
          console.log(`  ⚠️  两种计算方式结果不一致！`);
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ 执行出错:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkFrontendSync();
