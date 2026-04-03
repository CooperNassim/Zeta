-- ========================================
-- Zeta Trading System 数据库迁移脚本 - transactions 表重构
-- 版本: 5.0.0
-- 说明: 根据 TransactionHistory.jsx 前端字段重构 transactions 表
-- 参考: daily_work_data 表结构规范
--
-- 前端字段:
--   - createdAt: 时间
--   - type: 记账类型 (买入/卖出/入账/出账)
--   - symbol: 股票代码
--   - name: 股票名称
--   - description: 描述
--   - amount: 金额
--   - balance: 余额
-- ========================================

-- 添加新字段（如果不存在）
DO $$
BEGIN
    -- 添加 name 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'name') THEN
        ALTER TABLE transactions ADD COLUMN name TEXT NULL;
    END IF;
    
    -- 添加 description 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'description') THEN
        ALTER TABLE transactions ADD COLUMN description TEXT NULL;
    END IF;
    
    -- 添加 amount 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'amount') THEN
        ALTER TABLE transactions ADD COLUMN amount TEXT NULL;
    END IF;
    
    -- 添加 balance 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'balance') THEN
        ALTER TABLE transactions ADD COLUMN balance TEXT NULL;
    END IF;
END $$;

-- 修改 order_id 为可空（手动记账不需要关联订单）
ALTER TABLE transactions ALTER COLUMN order_id DROP NOT NULL;

-- 修改 symbol 为可空（手动记账可能没有股票代码）
ALTER TABLE transactions ALTER COLUMN symbol DROP NOT NULL;

-- 修改 transaction_type 为可空
ALTER TABLE transactions ALTER COLUMN transaction_type DROP NOT NULL;

-- 修改 price 为可空
ALTER TABLE transactions ALTER COLUMN price DROP NOT NULL;

-- 修改 quantity 为可空
ALTER TABLE transactions ALTER COLUMN quantity DROP NOT NULL;

-- 修改 total_price 为可空
ALTER TABLE transactions ALTER COLUMN total_price DROP NOT NULL;

-- 修改 transaction_date 为可空
ALTER TABLE transactions ALTER COLUMN transaction_date DROP NOT NULL;

-- 修改 transaction_time 为可空
ALTER TABLE transactions ALTER COLUMN transaction_time DROP NOT NULL;

-- 修改 fee 为可空
ALTER TABLE transactions ALTER COLUMN fee DROP NOT NULL;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions (transaction_type);
CREATE INDEX IF NOT EXISTS transactions_symbol_idx ON transactions (symbol);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions (created_at DESC);

-- 添加表注释
COMMENT ON TABLE transactions IS '账单明细表';
COMMENT ON COLUMN transactions.id IS '主键ID';
COMMENT ON COLUMN transactions.order_id IS '关联订单ID（手动记账为空）';
COMMENT ON COLUMN transactions.transaction_type IS '记账类型 (买入/卖出/入账/出账)';
COMMENT ON COLUMN transactions.symbol IS '股票代码';
COMMENT ON COLUMN transactions.name IS '股票名称';
COMMENT ON COLUMN transactions.description IS '描述';
COMMENT ON COLUMN transactions.amount IS '金额';
COMMENT ON COLUMN transactions.balance IS '余额';
COMMENT ON COLUMN transactions.price IS '价格（旧字段，兼容用）';
COMMENT ON COLUMN transactions.quantity IS '数量（旧字段，兼容用）';
COMMENT ON COLUMN transactions.total_price IS '总价（旧字段，兼容用）';
COMMENT ON COLUMN transactions.transaction_date IS '交易日期';
COMMENT ON COLUMN transactions.transaction_time IS '交易时间';
COMMENT ON COLUMN transactions.fee IS '手续费';
COMMENT ON COLUMN transactions.profit IS '盈亏';
COMMENT ON COLUMN transactions.deleted IS '是否删除';
COMMENT ON COLUMN transactions.deleted_at IS '删除时间';
COMMENT ON COLUMN transactions.created_at IS '创建时间';
COMMENT ON COLUMN transactions.updated_at IS '更新时间';

COMMIT;
