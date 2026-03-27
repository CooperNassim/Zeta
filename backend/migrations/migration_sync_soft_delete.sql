-- ========================================
-- 交易订单和交易记录软删除同步迁移脚本
-- 版本: 1.0.0
-- 创建时间: 2026-03-25
-- 说明: 当 trade_orders 被软删除时，同步软删除对应的 trade_records
-- ========================================

-- ========================================
-- 第一部分：修改触发器函数 - 支持软删除同步
-- ========================================
CREATE OR REPLACE FUNCTION sync_trade_order_to_records()
RETURNS TRIGGER AS $$
BEGIN
    -- 处理插入操作
    IF TG_OP = 'INSERT' THEN
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
                
                IF FOUND THEN
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
                    
                    RAISE NOTICE '触发器: 已更新卖出交易记录, 卖出数量=%, 平均价格=%', total_quantity, avg_price;
                ELSE
                    -- 如果没有找到对应的买入记录，创建一个新的记录
                    INSERT INTO trade_records (
                        trade_number,
                        symbol,
                        name,
                        sell_price,
                        sell_quantity,
                        sell_time,
                        sell_order_ids,
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
                    
                    RAISE NOTICE '触发器: 已创建卖出交易记录（无买入记录）';
                END IF;
            END;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- 处理更新操作 - 软删除同步
    IF TG_OP = 'UPDATE' THEN
        -- 检测软删除操作：deleted 从 false 变为 true
        IF OLD.deleted = false AND NEW.deleted = true THEN
            -- 同步软删除对应的交易记录
            UPDATE trade_records 
            SET deleted = true, 
                deleted_at = NEW.deleted_at,
                updated_at = CURRENT_TIMESTAMP
            WHERE trade_number = NEW.trade_number 
              AND deleted = false;
            
            RAISE NOTICE '触发器: 已同步软删除交易记录, trade_number=%', NEW.trade_number;
        END IF;
        
        -- 检测恢复操作：deleted 从 true 变为 false
        IF OLD.deleted = true AND NEW.deleted = false THEN
            -- 同步恢复对应的交易记录
            UPDATE trade_records 
            SET deleted = false, 
                deleted_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE trade_number = NEW.trade_number 
              AND deleted = true;
            
            RAISE NOTICE '触发器: 已同步恢复交易记录, trade_number=%', NEW.trade_number;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 第二部分：修改触发器 - 支持INSERT和UPDATE
-- ========================================
DROP TRIGGER IF EXISTS trg_sync_trade_order_to_records ON trade_orders;

CREATE TRIGGER trg_sync_trade_order_to_records
    AFTER INSERT OR UPDATE ON trade_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_trade_order_to_records();

-- ========================================
-- 第三部分：添加注释
-- ========================================
COMMENT ON FUNCTION sync_trade_order_to_records() IS 
'交易订单同步触发器函数 - 支持INSERT和UPDATE操作，包括软删除同步';

-- ========================================
-- 第四部分：验证迁移
-- ========================================
-- 检查触发器是否创建成功
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'trg_sync_trade_order_to_records'
    ) THEN
        RAISE NOTICE '✅ 触发器创建成功';
    ELSE
        RAISE EXCEPTION '❌ 触发器创建失败';
    END IF;
END $$;

COMMIT;
