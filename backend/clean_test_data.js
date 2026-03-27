/**
 * 清理测试数据并重新同步交易记录
 */

const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 清理测试数据并重新同步 ===\n');

    // 1. 显示当前数据
    console.log('1. 当前数据统计:');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM trade_orders) as total_orders,
        (SELECT COUNT(*) FROM trade_orders WHERE deleted = true) as deleted_orders,
        (SELECT COUNT(*) FROM trade_orders WHERE deleted = false) as active_orders,
        (SELECT COUNT(*) FROM trade_records) as total_records
    `);
    console.table(stats.rows[0]);

    // 2. 查看测试订单
    console.log('\n2. 测试订单 (symbol 为数字):');
    const testOrders = await client.query(`
      SELECT id, trade_number, order_type, symbol, quantity, price, deleted
      FROM trade_orders
      WHERE symbol ~ '^[0-9]+$'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.table(testOrders.rows);

    // 3. 删除测试订单(软删除)
    if (testOrders.rows.length > 0) {
      console.log('\n3. 软删除测试订单...');
      const testIds = testOrders.rows.map(r => r.id);
      await client.query(`
        UPDATE trade_orders 
        SET deleted = true, deleted_at = CURRENT_TIMESTAMP
        WHERE id = ANY($1)
      `, [testIds]);
      console.log(`   ✅ 已软删除 ${testIds.length} 条测试订单\n`);
    }

    // 4. 重新同步所有有效订单
    console.log('4. 重新同步有效订单...');
    
    // 清空 trade_records
    await client.query('TRUNCATE TABLE trade_records RESTART IDENTITY CASCADE');
    console.log('   ✅ 已清空 trade_records 表\n');

    // 同步买入订单
    const buyOrders = await client.query(`
      INSERT INTO trade_records (
        trade_number, symbol, name,
        buy_price, buy_quantity, buy_time, buy_order_id,
        buy_psychological_score, buy_strategy_score, buy_grade,
        created_at
      )
      SELECT 
        trade_number, symbol, name,
        price, quantity,
        COALESCE(order_time::TIMESTAMPTZ, (order_date::DATE)::TIMESTAMPTZ),
        id,
        psychological_score, strategy_score,
        CASE 
          WHEN overall_score >= 80 THEN 'A'
          WHEN overall_score >= 60 THEN 'B'
          WHEN overall_score >= 40 THEN 'C'
          ELSE 'D'
        END,
        created_at
      FROM trade_orders
      WHERE (order_type = '买入' OR order_type = 'buy') AND deleted = false
      RETURNING id
    `);
    console.log(`   ✅ 已同步 ${buyOrders.rowCount} 条买入记录\n`);

    // 同步卖出订单
    const sellOrders = await client.query(`
      SELECT DISTINCT trade_number 
      FROM trade_orders 
      WHERE (order_type = '卖出' OR order_type = 'sell') AND deleted = false
    `);

    let updatedCount = 0;
    let createdCount = 0;

    for (const row of sellOrders.rows) {
      const tradeNumber = row.trade_number;

      // 检查是否已有交易记录
      const existing = await client.query(
        'SELECT * FROM trade_records WHERE trade_number = $1 AND deleted = false',
        [tradeNumber]
      );

      // 计算卖出汇总
      const summary = await client.query(`
        SELECT 
          COALESCE(SUM(quantity), 0) as total_qty,
          COALESCE(SUM(quantity * price), 0) as total_amt,
          MAX(COALESCE(order_time::TIMESTAMPTZ, (order_date::DATE)::TIMESTAMPTZ)) as latest_tm,
          STRING_AGG(id::TEXT, ',') as order_ids
        FROM trade_orders
        WHERE trade_number = $1 AND (order_type = '卖出' OR order_type = 'sell') AND deleted = false
      `, [tradeNumber]);

      const totalQty = summary.rows[0].total_qty;
      const totalAmt = summary.rows[0].total_amt;
      const latestTm = summary.rows[0].latest_tm;
      const orderIds = summary.rows[0].order_ids;
      const avgPrice = totalQty > 0 ? totalAmt / totalQty : 0;

      if (existing.rows.length > 0) {
        // 更新现有记录
        const existingRec = existing.rows[0];
        let profit = null;
        let profitPct = null;
        let holdDays = null;

        if (existingRec.buy_price) {
          profit = (avgPrice - existingRec.buy_price) * totalQty;
          if (existingRec.buy_price > 0) {
            profitPct = ((avgPrice - existingRec.buy_price) / existingRec.buy_price) * 100;
          }
          if (existingRec.buy_time) {
            holdDays = Math.floor((new Date(latestTm) - new Date(existingRec.buy_time)) / (1000 * 60 * 60 * 24));
          }
        }

        await client.query(`
          UPDATE trade_records SET
            sell_price = $1,
            sell_quantity = $2,
            sell_time = $3,
            sell_order_ids = $4,
            profit = $5,
            profit_percent = $6,
            hold_duration = $7,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $8
        `, [avgPrice, totalQty, latestTm, orderIds, profit, profitPct, holdDays, existingRec.id]);
        
        updatedCount++;
      } else {
        // 创建新记录
        const orderInfo = await client.query(
          'SELECT symbol, name FROM trade_orders WHERE trade_number = $1 AND deleted = false LIMIT 1',
          [tradeNumber]
        );

        if (orderInfo.rows.length > 0) {
          await client.query(`
            INSERT INTO trade_records (
              trade_number, symbol, name,
              sell_price, sell_quantity, sell_time, sell_order_ids
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [tradeNumber, orderInfo.rows[0].symbol, orderInfo.rows[0].name, avgPrice, totalQty, latestTm, orderIds]);
          
          createdCount++;
        }
      }
    }

    console.log(`   ✅ 已更新 ${updatedCount} 条记录，新建 ${createdCount} 条记录\n`);

    // 5. 验证结果
    console.log('5. 验证结果:');
    const finalStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM trade_orders WHERE deleted = false) as active_orders,
        (SELECT COUNT(*) FROM trade_records WHERE deleted = false) as total_records,
        (SELECT COUNT(*) FROM trade_records WHERE buy_price IS NOT NULL AND deleted = false) as records_with_buy,
        (SELECT COUNT(*) FROM trade_records WHERE sell_price IS NOT NULL AND deleted = false) as records_with_sell
    `);
    console.table(finalStats.rows[0]);

    // 6. 显示示例数据
    console.log('\n6. 示例交易记录:');
    const samples = await client.query(`
      SELECT id, trade_number, symbol, name,
             buy_price, buy_quantity, 
             sell_price, sell_quantity,
             profit, profit_percent, hold_duration
      FROM trade_records
      WHERE deleted = false
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.table(samples.rows);

    console.log('\n✅ 清理和同步完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
