/**
 * 交易记录模块重构 - 简化版迁移脚本
 * 
 * 直接使用 JavaScript 执行迁移，更可控
 */

const { pool } = require('./src/config/database');

(async () => {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('交易记录模块重构迁移');
    console.log('========================================\n');

    // 1. 备份现有数据
    console.log('1. 备份现有 trade_records 数据...');
    await client.query('DROP TABLE IF EXISTS trade_records_backup_sync CASCADE');
    await client.query('CREATE TABLE trade_records_backup_sync AS SELECT * FROM trade_records');
    const backupCount = await client.query('SELECT COUNT(*) FROM trade_records_backup_sync');
    console.log(`   ✅ 已备份 ${backupCount.rows[0].count} 条记录\n`);

    // 2. 删除旧表并创建新表
    console.log('2. 创建新的 trade_records 表...');
    await client.query('DROP TABLE IF EXISTS trade_records CASCADE');
    
    await client.query(`
      CREATE TABLE trade_records (
        -- 主键和系统字段
        id SERIAL PRIMARY KEY,
        deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,

        -- 交易编号（核心关联字段）
        trade_number VARCHAR(50) NOT NULL,

        -- 股票信息
        symbol VARCHAR(50) NOT NULL,
        name VARCHAR(200),

        -- 买入相关字段
        buy_price NUMERIC(20, 4) NULL,
        buy_quantity NUMERIC(20, 4) NULL,
        buy_time TIMESTAMPTZ NULL,
        buy_order_id INTEGER NULL,

        -- 卖出相关字段
        sell_price NUMERIC(20, 4) NULL,
        sell_quantity NUMERIC(20, 4) NULL,
        sell_time TIMESTAMPTZ NULL,
        sell_order_ids TEXT NULL,

        -- 盈亏信息
        profit NUMERIC(20, 2) NULL,
        profit_percent NUMERIC(10, 4) NULL,
        hold_duration INTEGER NULL,

        -- 其他评分信息
        buy_psychological_score NUMERIC(5, 2) NULL,
        buy_strategy_score NUMERIC(5, 2) NULL,
        sell_psychological_score NUMERIC(5, 2) NULL,
        sell_strategy_score NUMERIC(5, 2) NULL,
        overall_score NUMERIC(5, 2) NULL,

        -- 评级
        buy_grade VARCHAR(10) NULL,
        sell_grade VARCHAR(10) NULL,

        -- 备注
        notes TEXT NULL
      )
    `);
    console.log('   ✅ 新表已创建\n');

    // 3. 创建索引
    console.log('3. 创建索引...');
    await client.query('CREATE INDEX idx_trade_records_id ON trade_records (id)');
    await client.query('CREATE INDEX idx_trade_records_trade_number ON trade_records (trade_number)');
    await client.query('CREATE INDEX idx_trade_records_symbol ON trade_records (symbol)');
    await client.query('CREATE INDEX idx_trade_records_buy_time ON trade_records (buy_time DESC)');
    await client.query('CREATE INDEX idx_trade_records_sell_time ON trade_records (sell_time DESC)');
    await client.query('CREATE INDEX idx_trade_records_deleted ON trade_records (deleted)');
    await client.query('CREATE INDEX idx_trade_records_created_at ON trade_records (created_at DESC)');
    console.log('   ✅ 索引已创建\n');

    // 4. 创建 updated_at 触发器
    console.log('4. 创建 updated_at 触发器...');
    await client.query(`
      CREATE TRIGGER update_trade_records_updated_at
        BEFORE UPDATE ON trade_records
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('   ✅ 触发器已创建\n');

    // 5. 创建同步触发器函数
    console.log('5. 创建同步触发器函数...');
    await client.query(`
      CREATE OR REPLACE FUNCTION sync_trade_order_to_records()
      RETURNS TRIGGER AS $$
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
        -- 处理买入订单
        IF NEW.order_type = '买入' AND NEW.deleted = false THEN
          INSERT INTO trade_records (
            trade_number, symbol, name,
            buy_price, buy_quantity, buy_time, buy_order_id,
            buy_psychological_score, buy_strategy_score, buy_grade
          ) VALUES (
            NEW.trade_number, NEW.symbol, NEW.name,
            NEW.price, NEW.quantity,
            COALESCE(NEW.order_time::TIMESTAMPTZ, (NEW.order_date::DATE)::TIMESTAMPTZ),
            NEW.id,
            NEW.psychological_score, NEW.strategy_score,
            CASE 
              WHEN NEW.overall_score >= 80 THEN 'A'
              WHEN NEW.overall_score >= 60 THEN 'B'
              WHEN NEW.overall_score >= 40 THEN 'C'
              ELSE 'D'
            END
          );
          RETURN NEW;
        END IF;

        -- 处理卖出订单
        IF NEW.order_type = '卖出' AND NEW.deleted = false THEN
          -- 查找对应的交易记录
          SELECT * INTO existing_record 
          FROM trade_records 
          WHERE trade_number = NEW.trade_number AND deleted = false
          LIMIT 1;

          IF existing_record IS NOT NULL THEN
            -- 计算所有卖出订单的汇总
            SELECT 
              COALESCE(SUM(quantity), 0),
              COALESCE(SUM(quantity * price), 0),
              MAX(COALESCE(order_time::TIMESTAMPTZ, (order_date::DATE)::TIMESTAMPTZ)),
              STRING_AGG(id::TEXT, ',')
            INTO total_quantity, total_amount, latest_time, order_ids
            FROM trade_orders
            WHERE trade_number = NEW.trade_number 
              AND order_type = '卖出' 
              AND deleted = false;

            -- 计算平均价格
            IF total_quantity > 0 THEN
              avg_price := total_amount / total_quantity;
            ELSE
              avg_price := NEW.price;
            END IF;

            -- 计算盈亏
            total_profit := NULL;
            profit_pct := NULL;
            hold_days := NULL;

            IF existing_record.buy_price IS NOT NULL THEN
              total_profit := (avg_price - existing_record.buy_price) * total_quantity;
              IF existing_record.buy_price > 0 THEN
                profit_pct := ((avg_price - existing_record.buy_price) / existing_record.buy_price) * 100;
              END IF;
              IF existing_record.buy_time IS NOT NULL THEN
                hold_days := DATE_PART('day', latest_time - existing_record.buy_time)::INTEGER;
              END IF;
            END IF;

            -- 更新交易记录
            UPDATE trade_records SET
              sell_price = avg_price,
              sell_quantity = total_quantity,
              sell_time = latest_time,
              sell_order_ids = order_ids,
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
          ELSE
            -- 创建新记录
            INSERT INTO trade_records (
              trade_number, symbol, name,
              sell_price, sell_quantity, sell_time, sell_order_ids,
              sell_psychological_score, sell_strategy_score, sell_grade
            ) VALUES (
              NEW.trade_number, NEW.symbol, NEW.name,
              NEW.price, NEW.quantity,
              COALESCE(NEW.order_time::TIMESTAMPTZ, (NEW.order_date::DATE)::TIMESTAMPTZ),
              NEW.id::TEXT,
              NEW.psychological_score, NEW.strategy_score,
              CASE 
                WHEN NEW.overall_score >= 80 THEN 'A'
                WHEN NEW.overall_score >= 60 THEN 'B'
                WHEN NEW.overall_score >= 40 THEN 'C'
                ELSE 'D'
              END
            );
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('   ✅ 触发器函数已创建\n');

    // 6. 创建触发器
    console.log('6. 创建同步触发器...');
    await client.query('DROP TRIGGER IF EXISTS trg_sync_trade_order_to_records ON trade_orders');
    await client.query(`
      CREATE TRIGGER trg_sync_trade_order_to_records
        AFTER INSERT ON trade_orders
        FOR EACH ROW
        EXECUTE FUNCTION sync_trade_order_to_records()
    `);
    console.log('   ✅ 触发器已创建\n');

    // 7. 同步现有买入订单
    console.log('7. 同步现有买入订单...');
    const buyResult = await client.query(`
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
      WHERE order_type = '买入' AND deleted = false
    `);
    console.log(`   ✅ 已同步 ${buyResult.rowCount} 条买入记录\n`);

    // 8. 同步现有卖出订单
    console.log('8. 同步现有卖出订单...');
    
    // 获取所有卖出订单的交易编号
    const sellOrders = await client.query(`
      SELECT DISTINCT trade_number 
      FROM trade_orders 
      WHERE order_type = '卖出' AND deleted = false
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
        WHERE trade_number = $1 AND order_type = '卖出' AND deleted = false
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

    // 9. 验证结果
    console.log('9. 验证结果...');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM trade_orders WHERE order_type = '买入' AND deleted = false) as buy_orders,
        (SELECT COUNT(*) FROM trade_orders WHERE order_type = '卖出' AND deleted = false) as sell_orders,
        (SELECT COUNT(*) FROM trade_records WHERE deleted = false) as total_records,
        (SELECT COUNT(*) FROM trade_records WHERE buy_price IS NOT NULL AND deleted = false) as records_with_buy,
        (SELECT COUNT(*) FROM trade_records WHERE sell_price IS NOT NULL AND deleted = false) as records_with_sell
    `);
    console.table(stats.rows[0]);

    // 10. 显示示例数据
    console.log('\n10. 示例交易记录:');
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

    console.log('\n========================================');
    console.log('迁移完成！');
    console.log('========================================');
    console.log('\n业务逻辑说明:');
    console.log('1. 当新增"买入"类型订单时，自动在 trade_records 中创建买入记录');
    console.log('2. 当新增"卖出"类型订单时，自动更新 trade_records 中对应记录');
    console.log('3. 多条卖出记录会自动合并：');
    console.log('   - 卖出数量 = 总和');
    console.log('   - 卖出价格 = 加权平均价格');
    console.log('   - 卖出时间 = 最晚的卖出时间');
    console.log('\n备份表: trade_records_backup_sync\n');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
})();
