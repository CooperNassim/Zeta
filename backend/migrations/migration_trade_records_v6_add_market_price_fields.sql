-- ========================================
-- Zeta Trading System 数据库迁移脚本
-- 版本: trade_records_v6_add_market_price_fields
-- 说明: 为 trade_records 表添加行情价格字段
--       为未来行情数据接入后的评级计算做准备
-- ========================================

-- 添加买入当天最高价字段（如果不存在）
ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS buy_high_price NUMERIC(15, 2);

-- 添加买入当天最低价字段（如果不存在）
ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS buy_low_price NUMERIC(15, 2);

-- 添加卖出当天最高价字段（如果不存在）
ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS sell_high_price NUMERIC(15, 2);

-- 添加卖出当天最低价字段（如果不存在）
ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS sell_low_price NUMERIC(15, 2);

-- 添加字段注释
COMMENT ON COLUMN trade_records.buy_high_price IS '买入当天最高价（用于评级计算）';
COMMENT ON COLUMN trade_records.buy_low_price IS '买入当天最低价（用于评级计算）';
COMMENT ON COLUMN trade_records.sell_high_price IS '卖出当天最高价（用于评级计算）';
COMMENT ON COLUMN trade_records.sell_low_price IS '卖出当天最低价（用于评级计算）';
