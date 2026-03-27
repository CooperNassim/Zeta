-- ========================================
-- 迁移脚本：添加 trade_price, trade_quantity, trade_time 字段
-- 目的：将交易价格/数量/时间与买入价格/数量/时间关联
-- ========================================

-- 添加字段（如果不存在）
DO $$ 
BEGIN
    -- 添加 trade_price 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trade_records' AND column_name = 'trade_price'
    ) THEN
        ALTER TABLE trade_records ADD COLUMN trade_price NUMERIC(20, 4) NULL;
        RAISE NOTICE '已添加 trade_price 字段';
    ELSE
        RAISE NOTICE 'trade_price 字段已存在';
    END IF;

    -- 添加 trade_quantity 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trade_records' AND column_name = 'trade_quantity'
    ) THEN
        ALTER TABLE trade_records ADD COLUMN trade_quantity INTEGER NULL;
        RAISE NOTICE '已添加 trade_quantity 字段';
    ELSE
        RAISE NOTICE 'trade_quantity 字段已存在';
    END IF;

    -- 添加 trade_time 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trade_records' AND column_name = 'trade_time'
    ) THEN
        ALTER TABLE trade_records ADD COLUMN trade_time TIMESTAMPTZ NULL;
        RAISE NOTICE '已添加 trade_time 字段';
    ELSE
        RAISE NOTICE 'trade_time 字段已存在';
    END IF;
END $$;

-- 为现有记录填充 trade_price, trade_quantity, trade_time 字段
-- 使用 buy_price, buy_quantity, buy_time 的值
UPDATE trade_records 
SET 
    trade_price = buy_price,
    trade_quantity = buy_quantity,
    trade_time = buy_time
WHERE trade_price IS NULL AND buy_price IS NOT NULL;

-- 验证字段添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trade_records' 
  AND column_name IN ('trade_price', 'trade_quantity', 'trade_time')
ORDER BY column_name;
