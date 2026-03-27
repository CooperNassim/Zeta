-- ========================================
-- 交易记录模块重构迁移脚本
-- 版本: 3.0.0
-- 生成时间: 2026-03-25
-- 说明: 重构 trade_records 表结构，创建与 trade_orders 的自动同步触发器
--
-- 业务逻辑:
--   1. 当股票交易新增"买入"类型的交易单时，交易记录也同时新增一条相同交易编号的买入记录
--   2. 当股票交易新增"卖出"类型的交易单时，交易记录匹配交易编号更新卖出记录信息
--      如果相同交易编号有多条卖出记录，需要加总卖出数量，计算平均价格，卖出时间取晚的
-- ========================================

-- ========================================
-- 第一部分：备份现有数据
-- ========================================
CREATE TABLE IF NOT EXISTS trade_records_backup_sync AS
SELECT * FROM trade_records;

-- ========================================
-- 第二部分：重构 trade_records 表结构
-- ========================================
DROP TABLE IF EXISTS trade_records CASCADE;

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
    sell_order_ids TEXT NULL,  -- 存储多个卖出订单ID（逗号分隔）

    -- 盈亏信息（计算字段）
    profit NUMERIC(20, 2) NULL,
    profit_percent NUMERIC(10, 4) NULL,
    hold_duration INTEGER NULL,

    -- 其他评分信息（可选）
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
);

-- ========================================
-- 第三部分：创建索引
-- ========================================
CREATE INDEX idx_trade_records_id ON trade_records (id);
CREATE INDEX idx_trade_records_trade_number ON trade_records (trade_number);
CREATE INDEX idx_trade_records_symbol ON trade_records (symbol);
CREATE INDEX idx_trade_records_buy_time ON trade_records (buy_time DESC);
CREATE INDEX idx_trade_records_sell_time ON trade_records (sell_time DESC);
CREATE INDEX idx_trade_records_deleted ON trade_records (deleted);
CREATE INDEX idx_trade_records_created_at ON trade_records (created_at DESC);

-- ========================================
-- 第四部分：创建 updated_at 触发器
-- ========================================
CREATE TRIGGER update_trade_records_updated_at
    BEFORE UPDATE ON trade_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 第五部分：创建触发器函数 - 同步买入订单
-- ========================================
CREATE OR REPLACE FUNCTION sync_buy_order_to_trade_records()
RETURNS TRIGGER AS $$
BEGIN
    -- 只处理买入类型的订单
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
        
        RAISE NOTICE '已创建买入交易记录: trade_number=%, symbol=%', NEW.trade_number, NEW.symbol;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 第六部分：创建触发器函数 - 同步卖出订单
-- ========================================
CREATE OR REPLACE FUNCTION sync_sell_order_to_trade_records()
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
    -- 只处理卖出类型的订单
    IF NEW.order_type = '卖出' AND NEW.deleted = false THEN
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
            
            RAISE NOTICE '已更新卖出交易记录: trade_number=%, 卖出数量=%, 平均价格=%', 
                NEW.trade_number, total_quantity, avg_price;
        ELSE
            -- 如果没有找到对应的买入记录，创建一个新的记录（只有卖出信息）
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
            
            RAISE NOTICE '已创建卖出交易记录（无买入记录）: trade_number=%, symbol=%', NEW.trade_number, NEW.symbol;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 第七部分：创建触发器 - 合并买入和卖出逻辑
-- ========================================
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
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 第八部分：在 trade_orders 表上创建触发器
-- ========================================
DROP TRIGGER IF EXISTS trg_sync_trade_order_to_records ON trade_orders;

CREATE TRIGGER trg_sync_trade_order_to_records
    AFTER INSERT ON trade_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_trade_order_to_records();

-- ========================================
-- 第九部分：添加注释
-- ========================================
COMMENT ON TABLE trade_records IS '交易记录表 - 自动同步 trade_orders 数据';

COMMENT ON COLUMN trade_records.id IS '主键ID（自增）';
COMMENT ON COLUMN trade_records.trade_number IS '交易编号（关联 trade_orders）';
COMMENT ON COLUMN trade_records.symbol IS '股票代码';
COMMENT ON COLUMN trade_records.name IS '股票名称';
COMMENT ON COLUMN trade_records.buy_price IS '买入价格';
COMMENT ON COLUMN trade_records.buy_quantity IS '买入数量';
COMMENT ON COLUMN trade_records.buy_time IS '买入时间';
COMMENT ON COLUMN trade_records.buy_order_id IS '买入订单ID';
COMMENT ON COLUMN trade_records.sell_price IS '卖出平均价格（多条卖出记录的平均价格）';
COMMENT ON COLUMN trade_records.sell_quantity IS '卖出总数量（多条卖出记录的总和）';
COMMENT ON COLUMN trade_records.sell_time IS '最晚卖出时间';
COMMENT ON COLUMN trade_records.sell_order_ids IS '卖出订单ID列表（逗号分隔）';
COMMENT ON COLUMN trade_records.profit IS '盈亏金额';
COMMENT ON COLUMN trade_records.profit_percent IS '盈亏比例（%）';
COMMENT ON COLUMN trade_records.hold_duration IS '持有天数';

-- ========================================
-- 第十部分：为现有数据创建交易记录
-- ========================================
-- 先处理买入订单
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
    buy_grade,
    created_at
)
SELECT 
    trade_number,
    symbol,
    name,
    price,
    quantity,
    COALESCE(order_time::TIMESTAMPTZ, (order_date::DATE)::TIMESTAMPTZ),
    id,
    psychological_score,
    strategy_score,
    CASE 
        WHEN overall_score >= 80 THEN 'A'
        WHEN overall_score >= 60 THEN 'B'
        WHEN overall_score >= 40 THEN 'C'
        ELSE 'D'
    END,
    created_at
FROM trade_orders
WHERE order_type = '买入' AND deleted = false
ON CONFLICT DO NOTHING;

-- 然后处理卖出订单
DO $$
DECLARE
    sell_order RECORD;
    existing_rec RECORD;
    total_qty NUMERIC(20, 4);
    total_amt NUMERIC(20, 4);
    avg_price NUMERIC(20, 4);
    latest_tm TIMESTAMPTZ;
    order_id_list TEXT;
    calc_profit NUMERIC(20, 2);
    calc_profit_pct NUMERIC(10, 4);
    calc_hold_days INTEGER;
BEGIN
    FOR sell_order IN 
        SELECT DISTINCT trade_number FROM trade_orders 
        WHERE order_type = '卖出' AND deleted = false
    LOOP
        -- 查找对应的交易记录
        SELECT * INTO existing_rec 
        FROM trade_records 
        WHERE trade_number = sell_order.trade_number AND deleted = false
        LIMIT 1;
        
        -- 计算所有卖出订单的汇总
        SELECT 
            COALESCE(SUM(quantity), 0),
            COALESCE(SUM(quantity * price), 0),
            MAX(COALESCE(order_time::TIMESTAMPTZ, (order_date::DATE)::TIMESTAMPTZ)),
            STRING_AGG(id::TEXT, ',')
        INTO total_qty, total_amt, latest_tm, order_id_list
        FROM trade_orders
        WHERE trade_number = sell_order.trade_number 
          AND order_type = '卖出' 
          AND deleted = false;
        
        -- 计算平均价格
        IF total_qty > 0 THEN
            avg_price := total_amt / total_qty;
        END IF;
        
        IF existing_rec IS NOT NULL THEN
            -- 计算盈亏
            calc_profit := NULL;
            calc_profit_pct := NULL;
            calc_hold_days := NULL;
            
            IF existing_rec.buy_price IS NOT NULL AND existing_rec.buy_quantity IS NOT NULL THEN
                calc_profit := (avg_price * total_qty) - (existing_rec.buy_price * LEAST(total_qty, existing_rec.buy_quantity));
                
                IF existing_rec.buy_price > 0 THEN
                    calc_profit_pct := ((avg_price - existing_rec.buy_price) / existing_rec.buy_price) * 100;
                END IF;
                
                IF existing_rec.buy_time IS NOT NULL THEN
                    calc_hold_days := DATE_PART('day', latest_tm - existing_rec.buy_time)::INTEGER;
                END IF;
            END IF;
            
            -- 更新交易记录
            UPDATE trade_records SET
                sell_price = avg_price,
                sell_quantity = total_qty,
                sell_time = latest_tm,
                sell_order_ids = order_id_list,
                profit = calc_profit,
                profit_percent = calc_profit_pct,
                hold_duration = calc_hold_days,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = existing_rec.id;
        ELSE
            -- 创建新的记录
            INSERT INTO trade_records (
                trade_number,
                symbol,
                name,
                sell_price,
                sell_quantity,
                sell_time,
                sell_order_ids
            )
            SELECT 
                sell_order.trade_number,
                symbol,
                name,
                avg_price,
                total_qty,
                latest_tm,
                order_id_list
            FROM trade_orders
            WHERE trade_number = sell_order.trade_number 
              AND deleted = false
            LIMIT 1;
        END IF;
    END LOOP;
END $$;

COMMIT;
