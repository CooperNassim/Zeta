/**
 * 从 trade_orders 恢复 trade_records 数据
 * 运行方式: node backend/restore_trade_records.js
 */

const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('从 trade_orders 恢复 trade_records 数据');
    console.log('========================================\n');

    // 1. 检查当前 trade_orders 数据
    const orders = await client.query(`
      SELECT id, trade_number, order_type, symbol, name, price, quantity, 
             psychological_score, strategy_score, overall_score,
             is_virtual, buy_order_id, status, created_at
      FROM trade_orders
      WHERE deleted = false
      ORDER BY trade_number, order_type
    `);
    console.log(`找到 ${orders.rows.length} 条订单记录\n`);

    // 2. 按 trade_number 分组
    const tradeMap = new Map();
    
    for (const order of orders.rows) {
      const tn = order.trade_number;
      if (!tradeMap.has(tn)) {
        tradeMap.set(tn, {
          trade_number: tn,
          buy: null,
          sell: null,
          symbol: order.symbol,
          name: order.name || '',
          is_virtual: order.is_virtual
        });
      }
      
      if (order.order_type === 'buy') {
        tradeMap.get(tn).buy = order;
      } else if (order.order_type === 'sell') {
        tradeMap.get(tn).sell = order;
      }
    }

    console.log(`找到 ${tradeMap.size} 个不同的交易编号\n`);

    // 3. 生成 trade_records
    let insertCount = 0;
    let skipCount = 0;

    for (const [tradeNumber, trade] of tradeMap) {
      if (!trade.buy && !trade.sell) {
        skipCount++;
        continue;
      }

      const buy = trade.buy;
      const sell = trade.sell;

      // 计算盈亏（如果有卖出）
      let profit = null;
      let profitPercent = null;
      let holdDuration = 0;

      if (sell && buy) {
        const buyAmount = parseFloat(buy.price) * parseInt(buy.quantity);
        const sellAmount = parseFloat(sell.price) * parseInt(sell.quantity);
        profit = sellAmount - buyAmount;
        profitPercent = buyAmount > 0 ? (profit / buyAmount) * 100 : 0;
        
        const buyTime = new Date(buy.created_at);
        const sellTime = new Date(sell.created_at);
        holdDuration = Math.ceil((sellTime - buyTime) / (1000 * 60 * 60 * 24));
      }

      // 买入评级
      const buyScore = buy?.overall_score ? parseFloat(buy.overall_score) : 0;
      const buyGrade = buyScore >= 70 ? 'A' : buyScore >= 40 ? 'B' : 'C';

      // 卖出评级
      let sellGrade = null;
      if (sell?.overall_score) {
        const sellScore = parseFloat(sell.overall_score);
        sellGrade = sellScore >= 70 ? 'A' : sellScore >= 40 ? 'B' : 'C';
      }

      // 综合评分
      let overallScore = null;
      if (buy && sell) {
        const buyS = buy.overall_score ? parseFloat(buy.overall_score) : 0;
        const sellS = sell.overall_score ? parseFloat(sell.overall_score) : 0;
        overallScore = ((buyS + sellS) / 2).toFixed(1);
      } else if (buy) {
        overallScore = buy.overall_score;
      }

      // 构建记录（只包含 trade_records 表中实际存在的字段）
      const record = {
        trade_number: tradeNumber,
        trade_type: buy ? '买入' : '卖出',
        symbol: trade.symbol,
        name: trade.name,
        buy_order_id: buy ? buy.id.toString() : null,
        sell_order_id: sell ? sell.id.toString() : null,
        buy_price: buy ? parseFloat(buy.price) : null,
        buy_quantity: buy ? parseInt(buy.quantity) : null,
        buy_time: buy ? buy.created_at : null,
        buy_order_price: buy ? parseFloat(buy.price) : null,
        buy_order_time: buy ? buy.created_at : null,
        buy_psychological_score: buy ? parseFloat(buy.psychological_score || 0) : null,
        buy_strategy_score: buy ? parseFloat(buy.strategy_score || 0) : null,
        buy_grade: buyGrade,
        buy_amount: buy ? (parseFloat(buy.price) * parseInt(buy.quantity)).toFixed(2) : null,
        sell_price: sell ? parseFloat(sell.price) : null,
        sell_quantity: sell ? parseInt(sell.quantity) : null,
        sell_time: sell ? sell.created_at : null,
        sell_order_price: sell ? parseFloat(sell.price) : null,
        sell_order_time: sell ? sell.created_at : null,
        sell_psychological_score: sell ? parseFloat(sell.psychological_score || 0) : null,
        sell_strategy_score: sell ? parseFloat(sell.strategy_score || 0) : null,
        sell_grade: sellGrade,
        sell_amount: sell ? (parseFloat(sell.price) * parseInt(sell.quantity)).toFixed(2) : null,
        profit: profit !== null ? profit.toFixed(2) : null,
        profit_percent: profitPercent !== null ? profitPercent.toFixed(2) : null,
        hold_duration: holdDuration,
        overall_score: overallScore ? parseFloat(overallScore) : null,
        deleted: false,
        deleted_at: null,
        created_at: buy ? buy.created_at : (sell ? sell.created_at : new Date().toISOString()),
        updated_at: new Date().toISOString()
      };

      try {
        const columns = Object.keys(record).join(', ');
        const placeholders = Object.keys(record).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(record);
        
        await client.query(
          `INSERT INTO trade_records (${columns}) VALUES (${placeholders})`,
          values
        );
        insertCount++;
        console.log(`  ✓ 插入: ${tradeNumber}`);
      } catch (err) {
        console.error(`  ✗ 插入失败 ${tradeNumber}: ${err.message}`);
      }
    }

    console.log(`\n========================================`);
    console.log(`恢复完成！`);
    console.log(`成功: ${insertCount} 条`);
    console.log(`跳过: ${skipCount} 条`);
    console.log(`========================================`);

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
})();
