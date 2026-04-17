-- ========================================
-- Zeta Trading System 数据库迁移脚本 - 为trade_orders表添加account_name和account_type字段
-- 版本: 1.0.0
-- 说明: 添加account_name和account_type字段用于账户名称标识
-- ========================================

-- 添加 account_name 和 account_type 字段
DO $$
BEGIN
    -- 添加 account_name 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_orders' AND column_name = 'account_name') THEN
        ALTER TABLE trade_orders ADD COLUMN account_name VARCHAR(50) NULL;
        
        -- 添加索引
        CREATE INDEX IF NOT EXISTS trade_orders_account_name_idx ON trade_orders (account_name);
        
        -- 添加注释
        COMMENT ON COLUMN trade_orders.account_name IS '账户名称';
    END IF;
    
    -- 添加 account_type 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_orders' AND column_name = 'account_type') THEN
        ALTER TABLE trade_orders ADD COLUMN account_type VARCHAR(20) NULL;
        
        -- 添加索引
        CREATE INDEX IF NOT EXISTS trade_orders_account_type_idx ON trade_orders (account_type);
        
        -- 添加注释
        COMMENT ON COLUMN trade_orders.account_type IS '账户类型: real=实盘, virtual=虚拟盘';
    END IF;
END $$;

-- 为现有数据设置默认账户名称
UPDATE trade_orders SET 
    account_name = COALESCE(account_name, CASE WHEN is_virtual = true THEN '虚拟盘账户' ELSE '实盘账户' END),
    account_type = COALESCE(account_type, CASE WHEN is_virtual = true THEN 'virtual' ELSE 'real' END)
WHERE account_name IS NULL OR account_type IS NULL;

COMMIT;