const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 同步现有订单到交易记录 ===\n');
    
    // 开始事务
    await client.query('BEGIN');
    
    // 1. 处理买入订单
    console.log('1. 处理买入订单...');
    const buyOrders = await client.query(`
      SELECT * FROM trade_orders 
      WHERE (order_type = '买入' OR order_type = 'buy') 
        AND deleted = false
      ORDER BY created_at
    `);
    
    console.log(`   找到 ${buyOrders.rows.length} 条买入订单`);
    
    for (const order of buyOrders.rows) {
      // 检查是否已存在
      const existing = await client.query(`
        SELECT id FROM trade_records 
        WHERE trade_number = $1 AND deleted = false
      `, [order.trade_number]);
      
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO trade_records (
            trade_number, symbol, name, buy_price, buy_quantity,
            buy_time, buy_order_id, buy_psychological_score, buy_strategy_score, buy_grade
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          order.trade_number,
          order.symbol,
          order.name,
          order.price,
          order.quantity,
          order.order_time || order.order_date,
          order.id,
          order.psychological_score,
          order.strategy_score,
          order.overall_score >= 80 ? 'A' : order.overall_score >= 60 ? 'B' : order.overall_score >= 40 ? 'C' : 'D'
        ]);
        console.log(`   ✅ 创建记录: ${order.trade_number} - ${order.symbol}`);
      } else {
        console.log(`   ⏭️  跳过已存在: ${order.trade_number}`);
      }
    }
    
    // 2. 处理卖出订单
    console.log('\n2. 处理卖出订单...');
    const sellOrders = await client.query(`
      SELECT DISTINCT trade_number 
      FROM trade_orders 
      WHERE (order_type = '卖出' OR order_type = 'sell') 
        AND deleted = false
    `);
    
    console.log(`   找到 ${sellOrders.rows.length} 个交易编号有卖出订单`);
    
    for (const { trade_number } of sellOrders.rows) {
      // 查找交易记录
      const record = await client.query(`
        SELECT * FROM trade_records 
        WHERE trade_number = $1 AND deleted = false
        LIMIT 1
      `, [trade_number]);
      
      if (record.rows.length > 0) {
        // 计算卖出汇总
        const sellSummary = await client.query(`
          SELECT 
            COALESCE(SUM(quantity), 0) as total_qty,
            COALESCE(SUM(quantity * price), 0) as total_amt,
            MAX(COALESCE(order_time::TIMESTAMPTZ, (order_date::DATE)::TIMESTAMPTZ)) as latest_tm
          FROM trade_orders
          WHERE trade_number = $1
            AND (order_type = '卖出' OR order_type = 'sell')
            AND deleted = false
        `, [trade_number]);
        
        const total_qty = sellSummary.rows[0].total_qty;
        const total_amt = sellSummary.rows[0].total_amt;
        const latest_tm = sellSummary.rows[0].latest_tm;
        const avg_price = total_qty > 0 ? total_amt / total_qty : 0;
        
        const rec = record.rows[0];
        let profit = null;
        let profit_pct = null;
        let hold_days = null;
        
        if (rec.buy_price && rec.buy_quantity) {
          profit = (avg_price * total_qty) - (rec.buy_price * Math.min(total_qty, rec.buy_quantity));
          
          if (rec.buy_price > 0) {
            profit_pct = ((avg_price - rec.buy_price) / rec.buy_price) * 100;
          }
          
          if (rec.buy_time && latest_tm) {
            hold_days = Math.floor((new Date(latest_tm) - new Date(rec.buy_time)) / (1000 * 60 * 60 * 24));
          }
        }
        
        await client.query(`
          UPDATE trade_records SET
            sell_price = $1,
            sell_quantity = $2,
            sell_time = $3,
            profit = $4,
            profit_percent = $5,
            hold_duration = $6,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
        `, [avg_price, total_qty, latest_tm, profit, profit_pct, hold_days, rec.id]);
        
        console.log(`   ✅ 更新卖出: ${trade_number} - 数量: ${total_qty}, 均价: ${avg_price.toFixed(2)}, 盈亏: ${profit || 'N/A'}`);
      } else {
        console.log(`   ⚠️  未找到买入记录: ${trade_number}`);
      }
    }
    
    // 提交事务
    await client.query('COMMIT');
    
    // 显示结果
    console.log('\n=== 同步结果 ===');
    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(sell_price) as with_sell
      FROM trade_records 
      WHERE deleted = false
    `);
    console.log(`总交易记录: ${result.rows[0].total}`);
    console.log(`包含卖出: ${result.rows[0].with_sell}`);
    console.log('\n✅ 同步完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
})();
