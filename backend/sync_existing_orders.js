require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'zeta_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== 同步现有订单到交易记录 ===\n');

    // 1. 为现有买入订单创建交易记录
    const buyOrders = await client.query(`
      SELECT * FROM trade_orders 
      WHERE order_type = '买入' AND deleted = false
    `);
    
    console.log(`找到 ${buyOrders.rows.length} 条买入订单\n`);

    for (const order of buyOrders.rows) {
      // 检查是否已存在交易记录
      const existing = await client.query(
        'SELECT * FROM trade_records WHERE trade_number = $1 AND deleted = false',
        [order.trade_number]
      );
      
      if (existing.rows.length === 0) {
        // 创建新的交易记录
        const result = await client.query(`
          INSERT INTO trade_records (
            trade_number,
            symbol,
            name,
            buy_price,
            buy_quantity,
            buy_time,
            buy_order_id,
            buy_psychological_score,
            buy_strategy_score,
            buy_grade
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
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
        
        console.log(`✅ 为订单 ${order.id} (${order.symbol}) 创建交易记录`);
      } else {
        console.log(`⏭️  订单 ${order.id} (${order.symbol}) 已有交易记录，跳过`);
      }
    }

    // 2. 显示结果
    const records = await client.query(`
      SELECT id, trade_number, symbol, buy_quantity, buy_price, created_at 
      FROM trade_records 
      WHERE deleted = false
      ORDER BY created_at DESC
    `);
    
    console.log('\n=== 当前交易记录 ===');
    console.table(records.rows);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
