-- ========================================
-- Zeta Trading System 数据库迁移脚本
-- 版本: trade_records_v4_add_slippage_fields
-- 说明: 确保 trade_records 表有 slippage 和 slippage_net_profit_ratio 字段
-- ========================================

-- 添加 slippage 字段（如果不存在）
ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS slippage NUMERIC(15, 2);

-- 添加 slippage_net_profit_ratio 字段（如果不存在）
ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS slippage_net_profit_ratio NUMERIC(10, 2);
