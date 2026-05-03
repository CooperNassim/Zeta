-- 修复 transactions 表：order_id 改为可空（手动记账不需要关联订单）
ALTER TABLE transactions ALTER COLUMN order_id DROP NOT NULL;

-- 修复 transactions 表：添加缺失的 name 字段
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'name') THEN
        ALTER TABLE transactions ADD COLUMN name VARCHAR(200) NULL;
    END IF;
END $$;

-- 修复 trade_records 表：使用正确的字段名
-- 当前字段：stock_name, entry_price, entry_date, exit_price, exit_date, quantity
-- 需要添加的字段：name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, 
--                  sell_order_ids, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount

DO $$
BEGIN
    -- name 字段（作为 stock_name 的别名，或者直接用 stock_name）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'name') THEN
        ALTER TABLE trade_records ADD COLUMN name VARCHAR(200) NULL;
    END IF;

    -- buy_price 字段（对应 entry_price）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'buy_price') THEN
        ALTER TABLE trade_records ADD COLUMN buy_price NUMERIC NULL;
    END IF;

    -- buy_quantity 字段（对应 quantity）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'buy_quantity') THEN
        ALTER TABLE trade_records ADD COLUMN buy_quantity NUMERIC NULL;
    END IF;

    -- buy_time 字段（对应 entry_date）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'buy_time') THEN
        ALTER TABLE trade_records ADD COLUMN buy_time TIMESTAMPTZ NULL;
    END IF;

    -- buy_order_price 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'buy_order_price') THEN
        ALTER TABLE trade_records ADD COLUMN buy_order_price NUMERIC NULL;
    END IF;

    -- buy_amount 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'buy_amount') THEN
        ALTER TABLE trade_records ADD COLUMN buy_amount NUMERIC NULL;
    END IF;

    -- sell_order_ids 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'sell_order_ids') THEN
        ALTER TABLE trade_records ADD COLUMN sell_order_ids TEXT NULL;
    END IF;

    -- sell_price 字段（对应 exit_price）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'sell_price') THEN
        ALTER TABLE trade_records ADD COLUMN sell_price NUMERIC NULL;
    END IF;

    -- sell_quantity 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'sell_quantity') THEN
        ALTER TABLE trade_records ADD COLUMN sell_quantity NUMERIC NULL;
    END IF;

    -- sell_time 字段（对应 exit_date）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'sell_time') THEN
        ALTER TABLE trade_records ADD COLUMN sell_time TIMESTAMPTZ NULL;
    END IF;

    -- sell_order_price 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'sell_order_price') THEN
        ALTER TABLE trade_records ADD COLUMN sell_order_price NUMERIC NULL;
    END IF;

    -- sell_amount 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'sell_amount') THEN
        ALTER TABLE trade_records ADD COLUMN sell_amount NUMERIC NULL;
    END IF;

    -- actual_sell_price 字段（用户手动录入的券商实际成交价）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_records' AND column_name = 'actual_sell_price') THEN
        ALTER TABLE trade_records ADD COLUMN actual_sell_price NUMERIC NULL;
    END IF;
END $$;

-- 添加表注释
COMMENT ON COLUMN transactions.order_id IS '关联订单ID（手动记账为空）';
COMMENT ON COLUMN transactions.name IS '股票名称';
COMMENT ON COLUMN trade_records.name IS '股票名称';
COMMENT ON COLUMN trade_records.buy_price IS '买入价格';
COMMENT ON COLUMN trade_records.buy_quantity IS '买入数量';
COMMENT ON COLUMN trade_records.buy_time IS '买入时间';
COMMENT ON COLUMN trade_records.buy_order_price IS '买入订单价格';
COMMENT ON COLUMN trade_records.buy_amount IS '买入金额';
COMMENT ON COLUMN trade_records.sell_order_ids IS '卖出订单ID列表（逗号分隔）';
COMMENT ON COLUMN trade_records.sell_price IS '卖出价格';
COMMENT ON COLUMN trade_records.sell_quantity IS '卖出数量';
COMMENT ON COLUMN trade_records.sell_time IS '卖出时间';
COMMENT ON COLUMN trade_records.sell_order_price IS '卖出订单价格';
COMMENT ON COLUMN trade_records.sell_amount IS '卖出金额';
