require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const sql = `
CREATE TABLE IF NOT EXISTS scheduled_orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
  condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('price_above', 'price_below', 'price_break', 'time')),
  trigger_price DECIMAL(15, 2),
  trigger_time TIMESTAMP,
  price DECIMAL(15, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  stop_loss_price DECIMAL(15, 2),
  take_profit_price DECIMAL(15, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'triggered', 'executed', 'cancelled', 'expired')),
  psychological_score DECIMAL(5, 2),
  strategy_score DECIMAL(5, 2),
  risk_score DECIMAL(5, 2),
  overall_score DECIMAL(5, 2),
  strategy_id INTEGER,
  executed_order_id VARCHAR(50),
  triggered_at TIMESTAMP,
  executed_at TIMESTAMP,
  expire_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_orders_symbol ON scheduled_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_scheduled_orders_status ON scheduled_orders(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_orders_condition_type ON scheduled_orders(condition_type);
`;

async function main() {
  try {
    await pool.query(sql);
    console.log('✅ 预约订单表 scheduled_orders 创建成功！');
  } catch (e) {
    console.error('❌ 创建失败:', e.message);
  } finally {
    pool.end();
  }
}

main();
