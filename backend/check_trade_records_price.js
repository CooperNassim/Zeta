/**
 * 检查交易记录中的价格字段
 */
const { pool } = require('./src/config/database');

async function checkTradeRecordsPrice() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('检查交易记录价格字段');
    console.log('========================================\n');

    const result = await client.query(`
      SELECT
        id,
        trade_number,
        buy_price,
        buy_order_price,
        sell_price,
        sell_order_price
      FROM trade_records
      WHERE deleted = false
      ORDER BY id
      LIMIT 5
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  没有找到交易记录\n');
    } else {
      console.log(`找到 ${result.rows.length} 条记录:\n`);
      result.rows.forEach((row, index) => {
        console.log(`记录 ${index + 1} (ID: ${row.id}, 交易编号: ${row.trade_number}):`);
        console.log(`  买入价格: ${row.buy_price}`);
        console.log(`  买入订单价格: ${row.buy_order_price}`);
        console.log(`  卖出价格: ${row.sell_price}`);
        console.log(`  卖出订单价格: ${row.sell_order_price}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ 执行出错:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTradeRecordsPrice();
