-- ========================================
-- Zeta Trading System 数据库迁移脚本 - 账单明细每日快照字段
-- 版本: 7.0.0
-- 说明: 为 transactions 表添加总资产、本月收入、本月支出、本月收支每日快照字段
-- ========================================

-- 添加每日快照字段（如果不存在）
DO $$
BEGIN
    -- 添加 daily_total_assets 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'daily_total_assets') THEN
        ALTER TABLE transactions ADD COLUMN daily_total_assets DECIMAL(15,2) NULL;
        COMMENT ON COLUMN transactions.daily_total_assets IS '总资产每日快照';
    END IF;
    
    -- 添加 daily_month_income 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'daily_month_income') THEN
        ALTER TABLE transactions ADD COLUMN daily_month_income DECIMAL(15,2) NULL;
        COMMENT ON COLUMN transactions.daily_month_income IS '本月收入每日快照';
    END IF;
    
    -- 添加 daily_month_expense 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'daily_month_expense') THEN
        ALTER TABLE transactions ADD COLUMN daily_month_expense DECIMAL(15,2) NULL;
        COMMENT ON COLUMN transactions.daily_month_expense IS '本月支出每日快照';
    END IF;
    
    -- 添加 daily_month_balance 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'daily_month_balance') THEN
        ALTER TABLE transactions ADD COLUMN daily_month_balance DECIMAL(15,2) NULL;
        COMMENT ON COLUMN transactions.daily_month_balance IS '本月收支每日快照（收入-支出）';
    END IF;
    
    -- 添加 daily_snapshot_date 字段，用于记录快照日期（仅日期部分）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'daily_snapshot_date') THEN
        ALTER TABLE transactions ADD COLUMN daily_snapshot_date DATE NULL;
        COMMENT ON COLUMN transactions.daily_snapshot_date IS '快照日期（仅日期部分，用于按日查询）';
    END IF;
END $$;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS transactions_snapshot_date_idx ON transactions (daily_snapshot_date DESC);
CREATE INDEX IF NOT EXISTS transactions_daily_assets_idx ON transactions (daily_total_assets);
CREATE INDEX IF NOT EXISTS transactions_daily_income_idx ON transactions (daily_month_income);
CREATE INDEX IF NOT EXISTS transactions_daily_expense_idx ON transactions (daily_month_expense);

-- 更新表注释
COMMENT ON COLUMN transactions.daily_total_assets IS '总资产每日快照';
COMMENT ON COLUMN transactions.daily_month_income IS '本月收入每日快照';
COMMENT ON COLUMN transactions.daily_month_expense IS '本月支出每日快照';
COMMENT ON COLUMN transactions.daily_month_balance IS '本月收支每日快照（收入-支出）';
COMMENT ON COLUMN transactions.daily_snapshot_date IS '快照日期（仅日期部分，用于按日查询）';

COMMIT;