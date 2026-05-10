-- ========================================
-- Zeta Trading System 数据库迁移脚本
-- 版本: trade_records_v2_fix_profit_sign
-- 说明: 修复 trade_records 表的 profit 字段
--       因为之前 buy_amount 符号错误导致 profit 计算错误
--       需要重新计算所有已结案交易的盈亏金额
-- ========================================

-- 更新 profit 字段：盈亏金额 = 卖出金额 - 买入金额（两个都是正数）
UPDATE trade_records
SET profit = (
    CASE
        -- 有卖出记录的情况：卖出金额 - 买入金额
        WHEN sell_amount IS NOT NULL AND buy_amount IS NOT NULL THEN
            COALESCE(sell_amount, 0) - ABS(COALESCE(buy_amount, 0))
        -- 只有买入记录：盈亏为0
        ELSE 0
    END
)
WHERE trade_status = '结束' OR trade_status = '已结束';

-- 同时修复 profit_percent（盈亏比例 = 盈亏金额 / 买入金额 * 100）
UPDATE trade_records
SET profit_percent = (
    CASE
        WHEN ABS(buy_amount) > 0 AND sell_amount IS NOT NULL THEN
            ROUND(((COALESCE(sell_amount, 0) - ABS(COALESCE(buy_amount, 0))) / ABS(COALESCE(buy_amount, 0))) * 100, 2)
        ELSE 0
    END
)
WHERE trade_status = '结束' OR trade_status = '已结束';
