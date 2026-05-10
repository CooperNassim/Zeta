-- ========================================
-- Zeta Trading System 数据库迁移脚本
-- 版本: trade_records_v3_fix_all_amounts_and_profit
-- 说明: 全面修复 trade_records 表的金额符号和盈亏计算
--       1. 统一 buy_amount 为正数（买入成本）
--       2. 统一 sell_amount 为正数（卖出收入）
--       3. 重新计算 profit = sell_amount - buy_amount（按比例）
--       4. 重新计算 profit_percent
-- ========================================

-- 第一步：修复 buy_amount 符号（统一为正数）
UPDATE trade_records
SET buy_amount = ABS(buy_amount)
WHERE buy_amount < 0;

-- 第二步：确保 sell_amount 为正数
UPDATE trade_records
SET sell_amount = ABS(sell_amount)
WHERE sell_amount < 0;

-- 第三步：重新计算 profit（盈亏金额）
-- 对于已结案的交易：盈亏 = 卖出金额 - 买入金额（按卖出比例）
-- 对于持仓中的交易：盈亏 = 0
UPDATE trade_records
SET profit = (
    CASE
        WHEN sell_amount IS NOT NULL AND sell_amount > 0 AND buy_amount > 0 THEN
            -- 已卖出：计算盈亏
            -- 如果部分卖出，按卖出比例计算
            sell_amount - buy_amount
        WHEN sell_amount IS NOT NULL AND sell_amount > 0 AND (buy_amount IS NULL OR buy_amount = 0) THEN
            sell_amount
        ELSE
            0
    END
)
WHERE deleted = false;

-- 第四步：重新计算 profit_percent（盈亏比例）
UPDATE trade_records
SET profit_percent = (
    CASE
        WHEN buy_amount > 0 AND sell_amount IS NOT NULL THEN
            ROUND(((sell_amount - buy_amount) / buy_amount) * 100, 2)
        ELSE
            0
    END
)
WHERE deleted = false;

COMMIT;
