-- ========================================
-- Zeta Trading System 数据库迁移脚本 - 为transactions表添加account_type字段
-- 版本: 6.0.0
-- 说明: 添加account_type字段用于区分实盘(realtime)和虚拟盘(virtual)数据
-- ========================================

-- 添加 account_type 字段
DO $$
BEGIN
    -- 添加 account_type 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'account_type') THEN
        ALTER TABLE transactions ADD COLUMN account_type VARCHAR(20) NOT NULL DEFAULT 'realtime';
        
        -- 添加索引
        CREATE INDEX IF NOT EXISTS transactions_account_type_idx ON transactions (account_type);
        
        -- 添加注释
        COMMENT ON COLUMN transactions.account_type IS '账户类型: realtime=实盘, virtual=虚拟盘';
    END IF;
END $$;

-- 为现有数据设置默认账户类型为实盘
UPDATE transactions SET account_type = 'realtime' WHERE account_type IS NULL OR account_type = '';

COMMIT;