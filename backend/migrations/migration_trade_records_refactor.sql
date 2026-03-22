-- ========================================
-- 交易记录表重构迁移脚本
-- 版本: 1.0.0
-- 生成时间: 2026-03-22
-- 说明: 按照 daily_work_data 的规范重构 trade_records 表
--
-- 规范要求:
--   1. 使用 SERIAL 主键
--   2. 统一使用 TIMESTAMPTZ 时间类型
--   3. 包含 deleted/deleted_at 软删除字段
--   4. 创建必要的索引
--   5. 添加 updated_at 触发器
--   6. 添加表和字段注释
-- ========================================

-- 备份现有数据
CREATE TABLE IF NOT EXISTS trade_records_backup_20260322 AS
SELECT * FROM trade_records;

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS trade_records CASCADE;

-- ========================================
-- 重建 trade_records 表（按照 daily_work_data 规范）
-- ========================================
CREATE TABLE trade_records (
    id SERIAL PRIMARY KEY,
    trade_number VARCHAR(20) NOT NULL,              -- 交易编号
    trade_type VARCHAR(10) NOT NULL,                -- 交易类型（买入/卖出）
    symbol VARCHAR(50) NOT NULL,                    -- 股票代码
    name VARCHAR(200) NOT NULL,                     -- 股票名称
    buy_order_id INTEGER NULL,                      -- 买入订单ID
    sell_order_id INTEGER NULL,                     -- 卖出订单ID
    buy_price NUMERIC NULL,                          -- 买入价格
    buy_quantity NUMERIC NULL,                       -- 买入数量
    buy_time TIMESTAMPTZ NULL,                       -- 买入时间
    buy_order_price NUMERIC NULL,                    -- 买入订单价格
    buy_order_time TIMESTAMPTZ NULL,                 -- 买入订单时间
    buy_psychological_score NUMERIC NULL,            -- 买入心理评分
    buy_strategy_score NUMERIC NULL,                 -- 买入策略评分
    buy_strategy_id INTEGER NULL,                    -- 买入策略ID
    sell_price NUMERIC NULL,                         -- 卖出价格
    sell_quantity NUMERIC NULL,                      -- 卖出数量
    sell_time TIMESTAMPTZ NULL,                      -- 卖出时间
    sell_order_price NUMERIC NULL,                   -- 卖出订单价格
    sell_order_time TIMESTAMPTZ NULL,                -- 卖出订单时间
    sell_psychological_score NUMERIC NULL,           -- 卖出心理评分
    sell_strategy_score NUMERIC NULL,                -- 卖出策略评分
    sell_strategy_id INTEGER NULL,                   -- 卖出策略ID
    buy_amount NUMERIC NULL,                          -- 买入金额
    sell_amount NUMERIC NULL,                         -- 卖出金额
    profit NUMERIC NULL,                              -- 盈亏金额
    profit_percent NUMERIC NULL,                      -- 盈亏比例
    hold_duration INTEGER NULL,                       -- 持有天数
    buy_grade VARCHAR(10) NULL,                       -- 买入评级
    sell_grade VARCHAR(10) NULL,                      -- 卖出评级
    overall_score NUMERIC NULL,                       -- 综合评分
    buy_channel JSON NULL,                            -- 买入通道数据
    sell_channel JSON NULL,                           -- 卖出通道数据
    trade_summary TEXT NULL,                          -- 交易总结
    net_profit NUMERIC NULL,                          -- 净盈亏（扣除手续费）
    net_profit_percent NUMERIC NULL,                  -- 净盈亏比例
    slippage NUMERIC NULL,                            -- 滑点
    slippage_net_profit_ratio NUMERIC NULL,          -- 滑净盈比
    deleted BOOLEAN NOT NULL DEFAULT false,           -- 软删除标记
    deleted_at TIMESTAMPTZ NULL,                      -- 删除时间
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 创建索引
CREATE INDEX trade_records_trade_number_idx ON trade_records (trade_number);
CREATE INDEX trade_records_symbol_idx ON trade_records (symbol);
CREATE INDEX trade_records_trade_type_idx ON trade_records (trade_type);
CREATE INDEX trade_records_buy_time_idx ON trade_records (buy_time DESC);
CREATE INDEX trade_records_sell_time_idx ON trade_records (sell_time DESC);
CREATE INDEX trade_records_deleted_idx ON trade_records (deleted);
CREATE INDEX trade_records_created_at_idx ON trade_records (created_at DESC);

-- 创建 updated_at 触发器
CREATE TRIGGER update_trade_records_updated_at 
    BEFORE UPDATE ON trade_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表和字段注释
COMMENT ON TABLE trade_records IS '交易记录表 - 按照daily_work_data规范重构';

COMMENT ON COLUMN trade_records.id IS '主键ID（自增）';
COMMENT ON COLUMN trade_records.trade_number IS '交易编号';
COMMENT ON COLUMN trade_records.trade_type IS '交易类型（买入/卖出）';
COMMENT ON COLUMN trade_records.symbol IS '股票代码';
COMMENT ON COLUMN trade_records.name IS '股票名称';
COMMENT ON COLUMN trade_records.buy_order_id IS '买入订单ID（关联orders表）';
COMMENT ON COLUMN trade_records.sell_order_id IS '卖出订单ID（关联orders表）';
COMMENT ON COLUMN trade_records.buy_price IS '买入价格';
COMMENT ON COLUMN trade_records.buy_quantity IS '买入数量';
COMMENT ON COLUMN trade_records.buy_time IS '买入时间（带时区）';
COMMENT ON COLUMN trade_records.buy_order_price IS '买入订单价格';
COMMENT ON COLUMN trade_records.buy_order_time IS '买入订单时间（带时区）';
COMMENT ON COLUMN trade_records.buy_psychological_score IS '买入心理评分（0-10分制）';
COMMENT ON COLUMN trade_records.buy_strategy_score IS '买入策略评分（0-100分制）';
COMMENT ON COLUMN trade_records.buy_strategy_id IS '买入策略ID（关联trading_strategies表）';
COMMENT ON COLUMN trade_records.sell_price IS '卖出价格';
COMMENT ON COLUMN trade_records.sell_quantity IS '卖出数量';
COMMENT ON COLUMN trade_records.sell_time IS '卖出时间（带时区）';
COMMENT ON COLUMN trade_records.sell_order_price IS '卖出订单价格';
COMMENT ON COLUMN trade_records.sell_order_time IS '卖出订单时间（带时区）';
COMMENT ON COLUMN trade_records.sell_psychological_score IS '卖出心理评分（0-10分制）';
COMMENT ON COLUMN trade_records.sell_strategy_score IS '卖出策略评分（0-100分制）';
COMMENT ON COLUMN trade_records.sell_strategy_id IS '卖出策略ID（关联trading_strategies表）';
COMMENT ON COLUMN trade_records.buy_amount IS '买入金额';
COMMENT ON COLUMN trade_records.sell_amount IS '卖出金额';
COMMENT ON COLUMN trade_records.profit IS '盈亏金额';
COMMENT ON COLUMN trade_records.profit_percent IS '盈亏比例（%）';
COMMENT ON COLUMN trade_records.hold_duration IS '持有天数';
COMMENT ON COLUMN trade_records.buy_grade IS '买入评级（A/B/C/D）';
COMMENT ON COLUMN trade_records.sell_grade IS '卖出评级（A/B/C/D）';
COMMENT ON COLUMN trade_records.overall_score IS '综合评分（0-100分制）';
COMMENT ON COLUMN trade_records.buy_channel IS '买入通道数据（JSON格式，包含上下轨等指标）';
COMMENT ON COLUMN trade_records.sell_channel IS '卖出通道数据（JSON格式，包含上下轨等指标）';
COMMENT ON COLUMN trade_records.trade_summary IS '交易总结';
COMMENT ON COLUMN trade_records.net_profit IS '净盈亏（扣除手续费后的实际盈亏）';
COMMENT ON COLUMN trade_records.net_profit_percent IS '净盈亏比例（%）';
COMMENT ON COLUMN trade_records.slippage IS '滑点（实际成交价与订单价的差额）';
COMMENT ON COLUMN trade_records.slippage_net_profit_ratio IS '滑净盈比（滑点与净盈亏的比例）';
COMMENT ON COLUMN trade_records.deleted IS '软删除标记（false=未删除，true=已删除）';
COMMENT ON COLUMN trade_records.deleted_at IS '删除时间（带时区）';
COMMENT ON COLUMN trade_records.created_at IS '创建时间（带时区）';
COMMENT ON COLUMN trade_records.updated_at IS '更新时间（带时区）';

-- 如果需要从备份恢复数据，可以执行以下SQL（根据实际字段映射调整）
-- INSERT INTO trade_records (
--     trade_number, trade_type, symbol, name, buy_order_id, sell_order_id,
--     buy_price, buy_quantity, buy_time, buy_order_price, buy_order_time,
--     buy_psychological_score, buy_strategy_score, buy_strategy_id,
--     sell_price, sell_quantity, sell_time, sell_order_price, sell_order_time,
--     sell_psychological_score, sell_strategy_score, sell_strategy_id,
--     buy_amount, sell_amount, profit, profit_percent, hold_duration,
--     buy_grade, sell_grade, overall_score, buy_channel, sell_channel,
--     trade_summary, net_profit, net_profit_percent, slippage,
--     slippage_net_profit_ratio, deleted, deleted_at, created_at, updated_at
-- )
-- SELECT
--     trade_number, trade_type, symbol, name, buy_order_id, sell_order_id,
--     buy_price, buy_quantity, buy_time, buy_order_price, buy_order_time,
--     buy_psychological_score, buy_strategy_score, buy_strategy_id,
--     sell_price, sell_quantity, sell_time, sell_order_price, sell_order_time,
--     sell_psychological_score, sell_strategy_score, sell_strategy_id,
--     buy_amount, sell_amount, profit, profit_percent, hold_duration,
--     buy_grade, sell_grade, overall_score, buy_channel, sell_channel,
--     trade_summary, net_profit, net_profit_percent, slippage,
--     slippage_net_profit_ratio, deleted, deleted_at, created_at, updated_at
-- FROM trade_records_backup_20260322;

COMMIT;
