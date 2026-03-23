/**
 * 修复历史数据中的 buy_order_id 关联问题
 * 
 * 问题描述：
 * - 某些卖出订单的 buy_order_id 关联到了已删除的买入订单
 * - 这导致前端计算可卖出数量时找不到正确的关联
 * 
 * 修复逻辑：
 * 1. 找出所有 buy_order_id 关联到已删除买入订单的卖出订单
 * 2. 根据 trade_number 找到同一交易编号的有效买入订单
 * 3. 将卖出订单的 buy_order_id 更新为正确的买入订单 ID
 */

const { pool } = require('./src/config/database');

async function fixBuyOrderId() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('开始修复 buy_order_id 历史数据问题');
    console.log('========================================\n');

    // 1. 首先检查 buy_order_id 字段是否存在
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trade_orders' AND column_name = 'buy_order_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ buy_order_id 字段不存在，请先运行 add_buy_order_id_field.js');
      return;
    }
    console.log('✅ buy_order_id 字段已存在\n');

    // 2. 找出所有卖出订单及其 buy_order_id 关联状态
    const sellOrders = await client.query(`
      SELECT id, trade_number, buy_order_id, quantity, deleted
      FROM trade_orders
      WHERE order_type = 'sell' AND deleted = false
      ORDER BY trade_number
    `);

    console.log(`找到 ${sellOrders.rows.length} 个未删除的卖出订单\n`);

    // 3. 找出所有有效的买入订单（未删除）
    const validBuyOrders = await client.query(`
      SELECT id, trade_number, quantity, deleted
      FROM trade_orders
      WHERE order_type = 'buy' AND deleted = false
    `);

    // 创建 trade_number -> 有效买入订单的映射
    const buyOrderByTradeNumber = new Map();
    validBuyOrders.rows.forEach(order => {
      buyOrderByTradeNumber.set(order.trade_number, order);
    });

    // 创建 id -> 有效买入订单的映射
    const validBuyOrderIds = new Set(validBuyOrders.rows.map(o => o.id));

    // 4. 分析每个卖出订单的关联状态
    const issues = [];
    const correct = [];
    const noBuyOrder = [];

    for (const sellOrder of sellOrders.rows) {
      // 如果没有关联买入订单
      if (sellOrder.buy_order_id === null) {
        noBuyOrder.push(sellOrder);
        continue;
      }

      // 检查关联的买入订单是否有效
      if (validBuyOrderIds.has(sellOrder.buy_order_id)) {
        // 关联正确
        correct.push({
          sellOrder,
          buyOrder: validBuyOrders.rows.find(o => o.id === sellOrder.buy_order_id)
        });
      } else {
        // 关联到已删除的买入订单，需要修复
        issues.push(sellOrder);
      }
    }

    console.log('========================================');
    console.log('关联状态分析：');
    console.log('========================================');
    console.log(`✅ 正确关联: ${correct.length} 个`);
    console.log(`❌ 关联到已删除订单: ${issues.length} 个`);
    console.log(`⚠️  未关联买入订单: ${noBuyOrder.length} 个`);
    console.log('');

    // 5. 修复关联到已删除订单的卖出订单
    if (issues.length > 0) {
      console.log('========================================');
      console.log('开始修复关联问题...');
      console.log('========================================\n');

      for (const issue of issues) {
        console.log(`处理卖出订单 ID=${issue.id}, trade_number=${issue.trade_number}`);
        
        // 查找同一交易编号的有效买入订单
        const validBuyOrder = buyOrderByTradeNumber.get(issue.trade_number);
        
        if (validBuyOrder) {
          console.log(`  找到有效买入订单: ID=${validBuyOrder.id}, 数量=${validBuyOrder.quantity}`);
          console.log(`  更新 buy_order_id: ${issue.buy_order_id} -> ${validBuyOrder.id}`);
          
          await client.query(`
            UPDATE trade_orders 
            SET buy_order_id = $1 
            WHERE id = $2
          `, [validBuyOrder.id, issue.id]);
          
          console.log('  ✅ 更新成功\n');
        } else {
          console.log('  ⚠️ 未找到同一交易编号的有效买入订单，跳过\n');
        }
      }

      console.log('========================================');
      console.log('修复完成！');
      console.log('========================================\n');
    }

    // 6. 为未关联买入订单的卖出订单添加关联（基于 trade_number）
    if (noBuyOrder.length > 0) {
      console.log('========================================');
      console.log(`为 ${noBuyOrder.length} 个未关联的卖出订单添加关联...`);
      console.log('========================================\n');

      for (const sellOrder of noBuyOrder) {
        console.log(`处理卖出订单 ID=${sellOrder.id}, trade_number=${sellOrder.trade_number}`);
        
        const validBuyOrder = buyOrderByTradeNumber.get(sellOrder.trade_number);
        
        if (validBuyOrder) {
          console.log(`  找到有效买入订单: ID=${validBuyOrder.id}, 数量=${validBuyOrder.quantity}`);
          console.log(`  设置 buy_order_id: ${validBuyOrder.id}`);
          
          await client.query(`
            UPDATE trade_orders 
            SET buy_order_id = $1 
            WHERE id = $2
          `, [validBuyOrder.id, sellOrder.id]);
          
          console.log('  ✅ 更新成功\n');
        } else {
          console.log('  ⚠️ 未找到同一交易编号的有效买入订单，跳过\n');
        }
      }

      console.log('========================================');
      console.log('未关联订单处理完成！');
      console.log('========================================\n');
    }

    // 7. 验证修复结果
    console.log('========================================');
    console.log('验证修复结果...');
    console.log('========================================\n');

    const verifyResult = await client.query(`
      SELECT 
        t.id,
        t.trade_number,
        t.order_type,
        t.buy_order_id,
        t.quantity,
        CASE WHEN b.id IS NOT NULL THEN '有效' ELSE '已删除/无效' END as buy_order_status
      FROM trade_orders t
      LEFT JOIN (
        SELECT id FROM trade_orders WHERE order_type = 'buy' AND deleted = false
      ) b ON t.buy_order_id = b.id
      WHERE t.order_type = 'sell' AND t.deleted = false
      ORDER BY t.trade_number
    `);

    console.log('卖出订单关联状态：');
    console.log('----------------------------------------');
    console.log('ID\t交易编号\t\t买入订单ID\t数量\t\t关联状态');
    console.log('----------------------------------------');
    
    for (const row of verifyResult.rows) {
      console.log(`${row.id}\t${row.trade_number}\t\t${row.buy_order_id}\t\t${row.quantity}\t\t${row.buy_order_status}`);
    }
    console.log('');

    // 8. 统计最终状态
    const finalStats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE buy_order_id IS NOT NULL AND buy_order_id IN (SELECT id FROM trade_orders WHERE order_type = 'buy' AND deleted = false)) as correctly_linked,
        COUNT(*) FILTER (WHERE buy_order_id IS NOT NULL AND buy_order_id NOT IN (SELECT id FROM trade_orders WHERE order_type = 'buy' AND deleted = false)) as incorrectly_linked,
        COUNT(*) FILTER (WHERE buy_order_id IS NULL) as not_linked
      FROM trade_orders
      WHERE order_type = 'sell' AND deleted = false
    `);

    const stats = finalStats.rows[0];
    console.log('========================================');
    console.log('最终统计：');
    console.log('========================================');
    console.log(`✅ 正确关联: ${stats.correctly_linked} 个`);
    console.log(`❌ 错误关联: ${stats.incorrectly_linked} 个`);
    console.log(`⚠️  未关联: ${stats.not_linked} 个`);
    console.log('');

    if (parseInt(stats.incorrectly_linked) === 0 && parseInt(stats.not_linked) === 0) {
      console.log('🎉 所有卖出订单都已正确关联到买入订单！');
    } else {
      console.log('⚠️  仍有问题需要处理，请检查上方输出');
    }

  } catch (error) {
    console.error('❌ 执行出错:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixBuyOrderId();
