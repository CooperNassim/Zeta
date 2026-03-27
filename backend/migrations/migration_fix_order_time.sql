-- ========================================
-- 修复 order_time 字段类型
-- ========================================
-- 问题：order_time 字段是 VARCHAR(8)，无法存储完整的时间戳
-- 解决：将其改为 TIMESTAMPTZ 类型

BEGIN;

-- 1. 备份现有数据
CREATE TEMP TABLE trade_orders_backup AS 
SELECT * FROM trade_orders;

-- 2. 删除依赖的触发器
DROP TRIGGER IF EXISTS sync_buy_order_trigger ON trade_orders;
DROP TRIGGER IF EXISTS sync_sell_order_trigger ON trade_orders;

-- 3. 修改 order_time 字段类型
ALTER TABLE trade_orders 
ALTER COLUMN order_time TYPE TIMESTAMPTZ 
USING 
  CASE 
    WHEN order_time IS NULL THEN NULL
    WHEN order_time ~ '^\d{2}:\d{2}' THEN 
      -- 如果是 HH:mm 格式，结合 order_date 生成完整时间戳
      (order_date::DATE + order_time::TIME)::TIMESTAMPTZ
    ELSE 
      -- 尝试直接转换
      order_time::TIMESTAMPTZ
  END;

-- 4. 重新创建触发器函数（简化版，不再需要 COALESCE）
CREATE OR REPLACE FUNCTION sync_buy_order_to_trade_records()
RETURNS TRIGGER AS $$
BEGIN
    -- 只有买入订单才会触发
    IF NEW.order_type = '买入' AND (TG_OP = 'INSERT' OR (OLD.order_type IS DISTINCT FROM NEW.order_type)) THEN
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
        ) VALUES (
            NEW.trade_number,
            NEW.symbol,
            NEW.name,
            NEW.price,
            NEW.quantity,
            NEW.order_time,  -- 直接使用，已经是 TIMESTAMPTZ 类型
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
        
        RAISE NOTICE '已创建买入交易记录: trade_number=%, symbol=%', NEW.trade_number, NEW.symbol;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_sell_order_to_trade_records()
RETURNS TRIGGER AS $$
DECLARE
    existing_record RECORD;
    total_quantity NUMERIC(20, 4);
    total_amount NUMERIC(20, 4);
    avg_price NUMERIC(20, 4);
    latest_time TIMESTAMPTZ;
    order_ids TEXT;
BEGIN
    -- 只有卖出订单才会触发
    IF NEW.order_type = '卖出' THEN
        -- 查找同一交易编号的买入记录
        SELECT * INTO existing_record 
        FROM trade_records 
        WHERE trade_number = NEW.trade_number 
        AND buy_time IS NOT NULL
        LIMIT 1;
        
        IF existing_record IS NOT NULL THEN
            -- 计算累计卖出数量和金额
            SELECT 
                COALESCE(SUM(quantity), 0),
                COALESCE(SUM(quantity * price), 0),
                MAX(order_time),
                STRING_AGG(id::TEXT, ',')
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
            
            -- 更新交易记录
            UPDATE trade_records
            SET 
                sell_price = avg_price,
                sell_quantity = total_quantity,
                sell_time = latest_time,  -- 直接使用，已经是 TIMESTAMPTZ 类型
                sell_order_id = order_ids,
                sell_psychological_score = NEW.psychological_score,
                sell_strategy_score = NEW.strategy_score,
                sell_grade = CASE 
                    WHEN NEW.overall_score >= 80 THEN 'A'
                    WHEN NEW.overall_score >= 60 THEN 'B'
                    WHEN NEW.overall_score >= 40 THEN 'C'
                    ELSE 'D'
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = existing_record.id;
            
            RAISE NOTICE '已更新交易记录: trade_number=%, symbol=%', NEW.trade_number, NEW.symbol;
        ELSE
            -- 如果没有找到买入记录，创建一个只有卖出信息的记录
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
                NEW.order_time,  -- 直接使用，已经是 TIMESTAMPTZ 类型
                NEW.id::TEXT,
                NEW.psychological_score,
                NEW.strategy_score,
                CASE 
                    WHEN NEW.overall_score >= 80 THEN 'A'
                    WHEN NEW.overall_score >= 60 THEN 'B'
                    WHEN NEW.overall_score >= 40 THEN 'C'
                    ELSE 'D'
                END
            );
            
            RAISE NOTICE '已创建卖出交易记录（无买入信息）: trade_number=%, symbol=%', NEW.trade_number, NEW.symbol;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 重新创建触发器
CREATE TRIGGER sync_buy_order_trigger
    AFTER INSERT OR UPDATE ON trade_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_buy_order_to_trade_records();

CREATE TRIGGER sync_sell_order_trigger
    AFTER INSERT OR UPDATE ON trade_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_sell_order_to_trade_records();

COMMIT;

-- 验证修改
SELECT 
    column_name, 
    data_type, 
    udt_name,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'trade_orders' 
AND column_name = 'order_time';
