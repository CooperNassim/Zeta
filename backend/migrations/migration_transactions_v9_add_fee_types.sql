-- ========================================
-- Zeta Trading System 数据库迁移脚本
-- 版本: transactions_v9_add_fee_transaction_types
-- 说明: 为 transactions 表的 transaction_type 新增4种费用记账类型
--       买入佣金、卖出佣金、买入其他费用、卖出其他费用
--       通过交易结案保存时自动创建/更新
-- ========================================

-- 更新 transaction_type 字段注释，包含新的费用类型
COMMENT ON COLUMN transactions.transaction_type IS '记账类型 (买入/卖出/手动入账/手动出账/买入佣金/卖出佣金/买入其他费用/卖出其他费用)';

-- 确保 trade_number 字段存在（如果不存在则添加）
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS trade_number VARCHAR(50) NULL;

-- 创建 trade_number 索引（如果不存在）
CREATE INDEX IF NOT EXISTS transactions_trade_number_idx ON transactions (trade_number);
