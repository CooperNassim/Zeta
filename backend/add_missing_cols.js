const {pool} = require('./src/config/database');

const columns = [
  'trade_commission NUMERIC NULL',
  'other_fees NUMERIC NULL',
  'sell_trade_commission NUMERIC NULL',
  'sell_other_fees NUMERIC NULL',
  'fees NUMERIC NULL',
  'slippage NUMERIC NULL',
  'net_profit NUMERIC NULL',
  'net_profit_percent NUMERIC NULL',
  'slippage_net_profit_ratio NUMERIC NULL',
  'buy_channel JSON',
  'sell_channel JSON',
  'buy_grade VARCHAR(10)',
  'sell_grade VARCHAR(10)',
  'overall_score NUMERIC',
  'hold_duration INTEGER',
  'profit_percent NUMERIC',
  'profit NUMERIC',
  'buy_order_time TIMESTAMPTZ',
  'sell_order_time TIMESTAMPTZ',
  'buy_psychological_score NUMERIC',
  'buy_strategy_score NUMERIC',
  'buy_strategy_id INTEGER',
  'sell_psychological_score NUMERIC',
  'sell_strategy_score NUMERIC',
  'sell_strategy_id INTEGER',
  'trade_summary TEXT',
  'actual_sell_price NUMERIC NULL'
];

async function checkAndAddColumns() {
  const missing = [];
  for (const col of columns) {
    const colName = col.split(' ')[0];
    const result = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = $1`,
      [colName]
    );
    if (result.rows.length === 0) {
      missing.push({ name: colName, definition: col });
    }
  }
  
  if (missing.length === 0) {
    console.log('所有字段都已存在');
  } else {
    console.log('缺失字段:');
    for (const m of missing) {
      console.log(`  ${m.name}`);
      try {
        await pool.query(`ALTER TABLE trade_records ADD COLUMN ${m.definition}`);
        console.log(`    ✅ 已添加 ${m.name}`);
      } catch (e) {
        console.log(`    ❌ 添加失败: ${e.message}`);
      }
    }
  }
  
  pool.end();
}

checkAndAddColumns();
