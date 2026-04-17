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
    console.log('=== 创建触发器函数 ===\n');

    // 1. 创建触发器函数
    await client.query(`
      CREATE OR REPLACE FUNCTION sync_trade_order_to_records()
      RETURNS TRIGGER AS $$
      BEGIN
          -- 处理买入订单
          IF NEW.order_type = '买入' AND NEW.deleted = false THEN
              -- 插入新的交易记录
              INSERT INTO trade_records (
                  trade_number,
                  symbol,
                  name,
                  buy_price,
                  buy_quantity,
                  buy_time,
                  buy_order_id,
                  buy_order_price,
                  buy_psychological_score,
                  buy_strategy_score,
                  buy_grade
              ) VALUES (
                  NEW.trade_number,
                  NEW.symbol,
                  NEW.name,
                  NEW.price,
                  NEW.quantity,
                  COALESCE(
                      NEW.order_time::TIMESTAMPTZ,
                      (NEW.order_date::DATE)::TIMESTAMPTZ
                  ),
                  NEW.id,
                  NEW.price,
                  NEW.psychological_score,
                  NEW.strategy_score,
                  CASE 
                      WHEN NEW.overall_score >= 80 THEN 'A'
                      WHEN NEW.overall_score >= 60 THEN 'B'
                      WHEN NEW.overall_score >= 40 THEN 'C'
                      ELSE 'D'
                  END
              );
              
              RAISE NOTICE '触发器: 已创建买入交易记录';
              RETURN NEW;
          END IF;
          
          -- 处理卖出订单
          IF NEW.order_type = '卖出' AND NEW.deleted = false THEN
              DECLARE
                  existing_record RECORD;
                  total_quantity NUMERIC(20, 4);
                  total_amount NUMERIC(20, 4);
                  avg_price NUMERIC(20, 4);
                  latest_time TIMESTAMPTZ;
                  order_ids TEXT;
                  total_profit NUMERIC(20, 2);
                  profit_pct NUMERIC(10, 4);
                  hold_days INTEGER;
              BEGIN
                  -- 查找对应的交易记录
                  SELECT * INTO existing_record 
                  FROM trade_records 
                  WHERE trade_number = NEW.trade_number AND deleted = false
                  LIMIT 1;
                  
                  IF existing_record IS NOT NULL THEN
                      -- 计算所有卖出订单的汇总
                      SELECT 
                          COALESCE(SUM(quantity), 0) as total_qty,
                          COALESCE(SUM(quantity * price), 0) as total_amt,
                          MAX(COALESCE(order_time::TIMESTAMPTZ, (order_date::DATE)::TIMESTAMPTZ)) as latest_tm,
                          STRING_AGG(id::TEXT, ',') as ids
                      INTO total_quantity, total_amount, latest_time, order_ids
                      FROM trade_orders
                      WHERE trade_number = NEW.trade_number 
                        AND order_type = '卖出' 
                        AND deleted = false;
                      
                      -- 计算平均卖出价格
                      IF total_quantity > 0 THEN
                          avg_price := total_amount / total_quantity;
                      ELSE
                          avg_price := NEW.price;
                      END IF;
                      
                      -- 计算盈亏
                      total_profit := NULL;
                      profit_pct := NULL;
                      hold_days := NULL;
                      
                      IF existing_record.buy_price IS NOT NULL AND existing_record.buy_quantity IS NOT NULL THEN
                          total_profit := (avg_price * total_quantity) - (existing_record.buy_price * LEAST(total_quantity, existing_record.buy_quantity));
                          
                          IF existing_record.buy_price > 0 THEN
                              profit_pct := ((avg_price - existing_record.buy_price) / existing_record.buy_price) * 100;
                          END IF;
                          
                          -- 计算持有天数
                          IF existing_record.buy_time IS NOT NULL THEN
                              hold_days := DATE_PART('day', latest_time - existing_record.buy_time)::INTEGER;
                          END IF;
                      END IF;
                      
                      -- 更新交易记录
                      UPDATE trade_records SET
                          sell_price = avg_price,
                          sell_quantity = total_quantity,
                          sell_time = latest_time,
                          sell_order_id = NEW.id,
                          sell_psychological_score = NEW.psychological_score,
                          sell_strategy_score = NEW.strategy_score,
                          sell_grade = CASE 
                              WHEN NEW.overall_score >= 80 THEN 'A'
                              WHEN NEW.overall_score >= 60 THEN 'B'
                              WHEN NEW.overall_score >= 40 THEN 'C'
                              ELSE 'D'
                          END,
                          profit = total_profit,
                          profit_percent = profit_pct,
                          hold_duration = hold_days,
                          updated_at = CURRENT_TIMESTAMP
                      WHERE id = existing_record.id;
                      
                      RAISE NOTICE '触发器: 已更新卖出交易记录';
                  ELSE
                      -- 创建新记录（只有卖出信息）
                      INSERT INTO trade_records (
                          trade_number,
                          symbol,
                          name,
                          sell_price,
                          sell_quantity,
                          sell_time,
                          sell_order_id,
                          sell_psychological_score,
                          sell_strategy_score,
                          sell_grade
                      ) VALUES (
                          NEW.trade_number,
                          NEW.symbol,
                          NEW.name,
                          NEW.price,
                          NEW.quantity,
                          COALESCE(
                              NEW.order_time::TIMESTAMPTZ,
                              (NEW.order_date::DATE)::TIMESTAMPTZ
                          ),
                          NEW.id,
                          NEW.psychological_score,
                          NEW.strategy_score,
                          CASE 
                              WHEN NEW.overall_score >= 80 THEN 'A'
                              WHEN NEW.overall_score >= 60 THEN 'B'
                              WHEN NEW.overall_score >= 40 THEN 'C'
                              ELSE 'D'
                          END
                      );
                      
                      RAISE NOTICE '触发器: 已创建卖出交易记录（无买入记录）';
                  END IF;
              END;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ 触发器函数创建成功\n');

    // 2. 删除旧触发器（如果存在）
    await client.query('DROP TRIGGER IF EXISTS trg_sync_trade_order_to_records ON trade_orders');
    console.log('✅ 已删除旧触发器\n');

    // 3. 创建新触发器
    await client.query(`
      CREATE TRIGGER trg_sync_trade_order_to_records
          AFTER INSERT ON trade_orders
          FOR EACH ROW
          EXECUTE FUNCTION sync_trade_order_to_records()
    `);
    console.log('✅ 触发器创建成功\n');

    // 4. 验证触发器
    const triggerCheck = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'trade_orders'
    `);
    console.log('=== 触发器验证 ===');
    console.table(triggerCheck.rows);

    console.log('\n✅ 触发器安装完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
