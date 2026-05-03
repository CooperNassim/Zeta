-- ========================================
-- Zeta Trading System 数据库迁移脚本 - 为transactions表添加account_name字段
-- 版本: 8.0.0
-- 说明: 添加account_name字段用于账户名称标识
-- ========================================

-- 添加 account_name 字段
DO $$
BEGIN
    -- 添加 account_name 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'account_name') THEN
        ALTER TABLE transactions ADD COLUMN account_name VARCHAR(50) NULL;
        
        -- 添加索引
        CREATE INDEX IF NOT EXISTS transactions_account_name_idx ON transactions (account_name);
        
        -- 添加注释
        COMMENT ON COLUMN transactions.account_name IS '账户名称';
    END IF;
END $$;

-- 为现有数据设置默认账户名称
UPDATE transactions SET account_name = '实盘账户' WHERE account_name IS NULL AND account_type = 'real';
UPDATE transactions SET account_name = '虚拟盘账户' WHERE account_name IS NULL AND account_type = 'virtual';

COMMIT;