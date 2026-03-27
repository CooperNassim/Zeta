const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 手动执行卖出逻辑测试 ===\n');
    
    // 准备测试数据
    await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'MANUAL_SELL_TEST', '买入', '000001', '手动测试',
        10.00, 1000, CURRENT_DATE, false
      )
    `);
    console.log('1. 创建买入订单');
    
    const buyRec = await client.query(`
      SELECT * FROM trade_records WHERE trade_number = 'MANUAL_SELL_TEST'
    `);
    console.log('   交易记录:', buyRec.rows[0]?.id);
    
    // 创建卖出订单（暂时禁用触发器）
    console.log('\n2. 禁用触发器并创建卖出订单...');
    await client.query('ALTER TABLE trade_orders DISABLE TRIGGER trg_sync_trade_order_to_records');
    
    await client.query(`
      INSERT INTO trade_orders (
        trade_number, order_type, symbol, name, 
        price, quantity, order_date, deleted
      ) VALUES (
        'MANUAL_SELL_TEST', '卖出', '000001', '手动测试',
        11.00, 500, CURRENT_DATE, false
      )
    `);
    console.log('   卖出订单已创建（触发器已禁用）');
    
    // 手动执行卖出逻辑
    console.log('\n3. 手动执行卖出逻辑...');
    
    try {
      // 步骤1: 查找交易记录
      const existingRecord = await client.query(`
        SELECT * FROM trade_records 
        WHERE trade_number = 'MANUAL_SELL_TEST' AND deleted = false
        LIMIT 1
      `);
      
      if (existingRecord.rows.length === 0) {
        console.log('   ❌ 未找到交易记录');
      } else {
        const existing_record = existingRecord.rows[0];
        console.log('   ✅ 找到交易记录:', existing_record.id);
        
        // 步骤2: 计算卖出汇总
        const sellSummary = await client.query(`
          SELECT 
            COALESCE(SUM(quantity), 0) as total_qty,
            COALESCE(SUM(quantity * price), 0) as total_amt,
            MAX(COALESCE(order_time::TIMESTAMPTZ, (order_date::DATE)::TIMESTAMPTZ)) as latest_tm
          FROM trade_orders
          WHERE trade_number = 'MANUAL_SELL_TEST'
            AND (order_type = '卖出' OR order_type = 'sell')
            AND deleted = false
        `);
        
        const total_quantity = sellSummary.rows[0].total_qty;
        const total_amount = sellSummary.rows[0].total_amt;
        const latest_time = sellSummary.rows[0].latest_tm;
        
        console.log('   卖出汇总:');
        console.log('      总数量:', total_quantity);
        console.log('      总金额:', total_amount);
        console.log('      最新时间:', latest_time);
        
        // 步骤3: 计算平均价格
        let avg_price = 0;
        if (total_quantity > 0) {
          avg_price = total_amount / total_quantity;
        }
        console.log('      平均价格:', avg_price);
        
        // 步骤4: 计算盈亏
        let total_profit = null;
        let profit_pct = null;
        let hold_days = null;
        
        if (existing_record.buy_price && existing_record.buy_quantity) {
          total_profit = (avg_price * total_quantity) - 
                        (existing_record.buy_price * Math.min(total_quantity, existing_record.buy_quantity));
          
          if (existing_record.buy_price > 0) {
            profit_pct = ((avg_price - existing_record.buy_price) / existing_record.buy_price) * 100;
          }
          
          if (existing_record.buy_time) {
            hold_days = Math.floor((new Date(latest_time) - new Date(existing_record.buy_time)) / (1000 * 60 * 60 * 24));
          }
        }
        
        console.log('   盈亏计算:');
        console.log('      利润:', total_profit);
        console.log('      百分比:', profit_pct);
        console.log('      持有天数:', hold_days);
        
        // 步骤5: 更新交易记录
        const updateResult = await client.query(`
          UPDATE trade_records SET
            sell_price = $1,
            sell_quantity = $2,
            sell_time = $3,
            sell_order_id = $4,
            profit = $5,
            profit_percent = $6,
            hold_duration = $7,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $8
        `, [avg_price, total_quantity, latest_time, 'MANUAL_TEST', total_profit, profit_pct, hold_days, existing_record.id]);
        
        console.log('   ✅ 更新结果:', updateResult.rowCount, '行受影响');
        
        // 检查更新后的记录
        const updatedRec = await client.query(`
          SELECT * FROM trade_records WHERE id = $1
        `, [existing_record.id]);
        
        console.log('\n   更新后的记录:');
        console.log('      sell_price:', updatedRec.rows[0].sell_price);
        console.log('      sell_quantity:', updatedRec.rows[0].sell_quantity);
        console.log('      profit:', updatedRec.rows[0].profit);
      }
    } catch (err) {
      console.error('   ❌ 手动执行错误:', err.message);
    }
    
    // 重新启用触发器
    await client.query('ALTER TABLE trade_orders ENABLE TRIGGER trg_sync_trade_order_to_records');
    console.log('\n4. 触发器已重新启用');
    
    // 清理
    await client.query("DELETE FROM trade_orders WHERE trade_number = 'MANUAL_SELL_TEST'");
    await client.query("DELETE FROM trade_records WHERE trade_number = 'MANUAL_SELL_TEST'");
    console.log('\n5. 测试数据已清理');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
})();
