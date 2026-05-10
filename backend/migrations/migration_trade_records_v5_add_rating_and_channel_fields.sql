-- ========================================
-- Zeta Trading System 数据库迁移脚本
-- 版本: trade_records_v5_add_rating_and_channel_fields
-- 说明: 为 trade_records 表添加评级和通道字段
--       买入评级、卖出评级、通道上轨、通道下轨、交易评级
--       为未来行情数据接入后的自动计算做准备
-- ========================================

-- 添加通道上轨字段（如果不存在）
ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS upper_band NUMERIC(15, 2);

-- 添加通道下轨字段（如果不存在）
ALTER TABLE trade_records ADD COLUMN IF NOT EXISTS lower_band NUMERIC(15, 2);

-- 添加字段注释
COMMENT ON COLUMN trade_records.upper_band IS '通道上轨价格（用于评级计算）';
COMMENT ON COLUMN trade_records.lower_band IS '通道下轨价格（用于评级计算）';
COMMENT ON COLUMN trade_records.buy_grade IS '买入评级（A/B/C/D，由行情数据计算）';
COMMENT ON COLUMN trade_records.sell_grade IS '卖出评级（A/B/C/D，由行情数据计算）';
COMMENT ON COLUMN trade_records.overall_score IS '交易评级（综合评分，由行情数据计算）';
