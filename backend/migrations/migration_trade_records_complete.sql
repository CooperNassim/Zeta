-- ========================================
-- 交易记录表完整重构迁移脚本
-- 版本: 2.0.0
-- 生成时间: 2026-03-22
-- 说明: 完全按照 daily_work_data 的规范重构 trade_records 表
--       添加所有前端字段，确保数据库结构与前端完全一致
--
-- 规范要求:
--   1. 使用 SERIAL 主键（自增ID）
--   2. 统一使用 TIMESTAMPTZ 时间类型
--   3. 包含 deleted/deleted_at 软删除字段
--   4. 创建必要的索引
--   5. 添加 updated_at 触发器
--   6. 添加表和字段注释
--   7. 添加必要的 CHECK 约束
-- ========================================

-- 备份现有数据
CREATE TABLE IF NOT EXISTS trade_records_backup_complete AS
SELECT * FROM trade_records;

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS trade_records CASCADE;

-- ========================================
-- 重建 trade_records 表（完全匹配前端字段）
-- ========================================
CREATE TABLE trade_records (
    -- 主键和系统字段
    id SERIAL PRIMARY KEY,                                       -- 自增主键ID
    deleted BOOLEAN NOT NULL DEFAULT false,                        -- 软删除标记
    deleted_at TIMESTAMPTZ NULL,                                  -- 删除时间（带时区）
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,        -- 创建时间（带时区）
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,        -- 更新时间（带时区）

    -- 交易基本信息
    trade_number VARCHAR(20) NOT NULL,                           -- 交易编号
    trade_type VARCHAR(10) NOT NULL,                             -- 交易类型（买入/卖出）
    symbol VARCHAR(50) NOT NULL,                                 -- 股票代码
    name VARCHAR(200) NOT NULL,                                  -- 股票名称

    -- 订单关联信息
    buy_order_id VARCHAR(50) NULL,                               -- 买入订单ID
    sell_order_id VARCHAR(50) NULL,                              -- 卖出订单ID

    -- 买入相关字段
    buy_price NUMERIC(20, 4) NULL,                               -- 买入价格
    buy_quantity NUMERIC(20, 4) NULL,                            -- 买入数量
    buy_time TIMESTAMPTZ NULL,                                   -- 买入时间（带时区）
    buy_order_price NUMERIC(20, 4) NULL,                         -- 买入订单价格
    buy_order_time TIMESTAMPTZ NULL,                             -- 买入订单时间（带时区）
    buy_psychological_score NUMERIC(5, 2) NULL,                  -- 买入心理评分（0-10分制）
    buy_strategy_score NUMERIC(5, 2) NULL,                        -- 买入策略评分（0-100分制）
    buy_strategy_id INTEGER NULL,                                -- 买入策略ID

    -- 卖出相关字段
    sell_price NUMERIC(20, 4) NULL,                              -- 卖出价格
    sell_quantity NUMERIC(20, 4) NULL,                           -- 卖出数量
    sell_time TIMESTAMPTZ NULL,                                  -- 卖出时间（带时区）
    sell_order_price NUMERIC(20, 4) NULL,                        -- 卖出订单价格
    sell_order_time TIMESTAMPTZ NULL,                             -- 卖出订单时间（带时区）
    sell_psychological_score NUMERIC(5, 2) NULL,                 -- 卖出心理评分（0-10分制）
    sell_strategy_score NUMERIC(5, 2) NULL,                      -- 卖出策略评分（0-100分制）
    sell_strategy_id INTEGER NULL,                               -- 卖出策略ID

    -- 金额和盈亏信息
    buy_amount NUMERIC(20, 2) NULL,                              -- 买入金额
    sell_amount NUMERIC(20, 2) NULL,                             -- 卖出金额
    profit NUMERIC(20, 2) NULL,                                  -- 盈亏金额
    profit_percent NUMERIC(10, 4) NULL,                          -- 盈亏比例（%）
    hold_duration INTEGER NULL,                                  -- 持有天数

    -- 评级和评分
    buy_grade VARCHAR(10) NULL,                                  -- 买入评级（A/B/C/D）
    sell_grade VARCHAR(10) NULL,                                 -- 卖出评级（A/B/C/D）
    overall_score NUMERIC(5, 2) NULL,                            -- 综合评分（0-100分制）

    -- 通道数据
    buy_channel JSON NULL,                                       -- 买入通道数据（JSON格式）
    sell_channel JSON NULL,                                      -- 卖出通道数据（JSON格式）

    -- 交易总结
    trade_summary TEXT NULL,                                     -- 交易总结

    -- 费用信息
    trade_commission NUMERIC(20, 2) NULL,                       -- 交易佣金
    sell_trade_commission NUMERIC(20, 2) NULL,                  -- 卖出佣金
    other_fees NUMERIC(20, 2) NULL,                              -- 其他费用
    sell_other_fees NUMERIC(20, 2) NULL,                         -- 卖出其他费用
    fees NUMERIC(20, 2) NULL,                                    -- 总手续费

    -- 滑点和净盈亏
    slippage NUMERIC(20, 2) NULL,                                -- 滑点
    net_profit NUMERIC(20, 2) NULL,                              -- 净盈亏（扣除手续费）
    net_profit_percent NUMERIC(10, 4) NULL,                      -- 净盈亏比例（%）
    slippage_net_profit_ratio NUMERIC(10, 4) NULL                -- 滑净盈比
);

-- ========================================
-- 创建索引（与 daily_work_data 一致）
-- ========================================
CREATE INDEX idx_trade_records_id ON trade_records (id);
CREATE INDEX idx_trade_records_trade_number ON trade_records (trade_number);
CREATE INDEX idx_trade_records_symbol ON trade_records (symbol);
CREATE INDEX idx_trade_records_trade_type ON trade_records (trade_type);
CREATE INDEX idx_trade_records_buy_time ON trade_records (buy_time DESC);
CREATE INDEX idx_trade_records_sell_time ON trade_records (sell_time DESC);
CREATE INDEX idx_trade_records_deleted ON trade_records (deleted);
CREATE INDEX idx_trade_records_created_at ON trade_records (created_at DESC);
CREATE INDEX idx_trade_records_buy_grade ON trade_records (buy_grade);
CREATE INDEX idx_trade_records_sell_grade ON trade_records (sell_grade);

-- ========================================
-- 创建 CHECK 约束（与 daily_work_data 一致）
-- ========================================
-- 交易类型约束
ALTER TABLE trade_records
    ADD CONSTRAINT chk_trade_records_trade_type
    CHECK (trade_type IN ('买入', '卖出'));

-- 买入评级约束
ALTER TABLE trade_records
    ADD CONSTRAINT chk_trade_records_buy_grade
    CHECK (buy_grade IS NULL OR buy_grade IN ('A', 'B', 'C', 'D'));

-- 卖出评级约束
ALTER TABLE trade_records
    ADD CONSTRAINT chk_trade_records_sell_grade
    CHECK (sell_grade IS NULL OR sell_grade IN ('A', 'B', 'C', 'D'));

-- 买入心理评分约束（0-10）
ALTER TABLE trade_records
    ADD CONSTRAINT chk_trade_records_buy_psych_score
    CHECK (buy_psychological_score IS NULL OR (buy_psychological_score >= 0 AND buy_psychological_score <= 10));

-- 卖出心理评分约束（0-10）
ALTER TABLE trade_records
    ADD CONSTRAINT chk_trade_records_sell_psych_score
    CHECK (sell_psychological_score IS NULL OR (sell_psychological_score >= 0 AND sell_psychological_score <= 10));

-- 买入策略评分约束（0-100）
ALTER TABLE trade_records
    ADD CONSTRAINT chk_trade_records_buy_strategy_score
    CHECK (buy_strategy_score IS NULL OR (buy_strategy_score >= 0 AND buy_strategy_score <= 100));

-- 卖出策略评分约束（0-100）
ALTER TABLE trade_records
    ADD CONSTRAINT chk_trade_records_sell_strategy_score
    CHECK (sell_strategy_score IS NULL OR (sell_strategy_score >= 0 AND sell_strategy_score <= 100));

-- 综合评分约束（0-100）
ALTER TABLE trade_records
    ADD CONSTRAINT chk_trade_records_overall_score
    CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100));

-- 持有天数约束（不能为负数）
ALTER TABLE trade_records
    ADD CONSTRAINT chk_trade_records_hold_duration
    CHECK (hold_duration IS NULL OR hold_duration >= 0);

-- ========================================
-- 创建 updated_at 触发器（与 daily_work_data 一致）
-- ========================================
CREATE TRIGGER update_trade_records_updated_at
    BEFORE UPDATE ON trade_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 添加表和字段注释（与 daily_work_data 一致）
-- ========================================
-- 表注释
COMMENT ON TABLE trade_records IS '交易记录表 - 完全按照daily_work_data规范重构';

-- 系统字段注释
COMMENT ON COLUMN trade_records.id IS '主键ID（自增）';
COMMENT ON COLUMN trade_records.deleted IS '软删除标记（false=未删除，true=已删除）';
COMMENT ON COLUMN trade_records.deleted_at IS '删除时间（带时区）';
COMMENT ON COLUMN trade_records.created_at IS '创建时间（带时区）';
COMMENT ON COLUMN trade_records.updated_at IS '更新时间（带时区）';

-- 交易基本信息注释
COMMENT ON COLUMN trade_records.trade_number IS '交易编号';
COMMENT ON COLUMN trade_records.trade_type IS '交易类型（买入/卖出）';
COMMENT ON COLUMN trade_records.symbol IS '股票代码';
COMMENT ON COLUMN trade_records.name IS '股票名称';

-- 订单关联信息注释
COMMENT ON COLUMN trade_records.buy_order_id IS '买入订单ID（字符串类型）';
COMMENT ON COLUMN trade_records.sell_order_id IS '卖出订单ID（字符串类型）';

-- 买入相关字段注释
COMMENT ON COLUMN trade_records.buy_price IS '买入价格';
COMMENT ON COLUMN trade_records.buy_quantity IS '买入数量';
COMMENT ON COLUMN trade_records.buy_time IS '买入时间（带时区）';
COMMENT ON COLUMN trade_records.buy_order_price IS '买入订单价格';
COMMENT ON COLUMN trade_records.buy_order_time IS '买入订单时间（带时区）';
COMMENT ON COLUMN trade_records.buy_psychological_score IS '买入心理评分（0-10分制）';
COMMENT ON COLUMN trade_records.buy_strategy_score IS '买入策略评分（0-100分制）';
COMMENT ON COLUMN trade_records.buy_strategy_id IS '买入策略ID（关联trading_strategies表）';

-- 卖出相关字段注释
COMMENT ON COLUMN trade_records.sell_price IS '卖出价格';
COMMENT ON COLUMN trade_records.sell_quantity IS '卖出数量';
COMMENT ON COLUMN trade_records.sell_time IS '卖出时间（带时区）';
COMMENT ON COLUMN trade_records.sell_order_price IS '卖出订单价格';
COMMENT ON COLUMN trade_records.sell_order_time IS '卖出订单时间（带时区）';
COMMENT ON COLUMN trade_records.sell_psychological_score IS '卖出心理评分（0-10分制）';
COMMENT ON COLUMN trade_records.sell_strategy_score IS '卖出策略评分（0-100分制）';
COMMENT ON COLUMN trade_records.sell_strategy_id IS '卖出策略ID（关联trading_strategies表）';

-- 金额和盈亏信息注释
COMMENT ON COLUMN trade_records.buy_amount IS '买入金额';
COMMENT ON COLUMN trade_records.sell_amount IS '卖出金额';
COMMENT ON COLUMN trade_records.profit IS '盈亏金额';
COMMENT ON COLUMN trade_records.profit_percent IS '盈亏比例（%）';
COMMENT ON COLUMN trade_records.hold_duration IS '持有天数';

-- 评级和评分注释
COMMENT ON COLUMN trade_records.buy_grade IS '买入评级（A/B/C/D）';
COMMENT ON COLUMN trade_records.sell_grade IS '卖出评级（A/B/C/D）';
COMMENT ON COLUMN trade_records.overall_score IS '综合评分（0-100分制）';

-- 通道数据注释
COMMENT ON COLUMN trade_records.buy_channel IS '买入通道数据（JSON格式，包含上下轨等指标）';
COMMENT ON COLUMN trade_records.sell_channel IS '卖出通道数据（JSON格式，包含上下轨等指标）';

-- 交易总结注释
COMMENT ON COLUMN trade_records.trade_summary IS '交易总结';

-- 费用信息注释
COMMENT ON COLUMN trade_records.trade_commission IS '买入交易佣金';
COMMENT ON COLUMN trade_records.sell_trade_commission IS '卖出交易佣金';
COMMENT ON COLUMN trade_records.other_fees IS '买入其他费用';
COMMENT ON COLUMN trade_records.sell_other_fees IS '卖出其他费用';
COMMENT ON COLUMN trade_records.fees IS '总手续费';

-- 滑点和净盈亏注释
COMMENT ON COLUMN trade_records.slippage IS '滑点（实际成交价与订单价的差额）';
COMMENT ON COLUMN trade_records.net_profit IS '净盈亏（扣除手续费后的实际盈亏）';
COMMENT ON COLUMN trade_records.net_profit_percent IS '净盈亏比例（%）';
COMMENT ON COLUMN trade_records.slippage_net_profit_ratio IS '滑净盈比（滑点与净盈亏的比例）';

-- ========================================
-- 字段映射表（前端 camelCase → 数据库 snake_case）
-- ========================================
-- 前端字段                   数据库字段                     类型
-- --------                   ----------                     ----
-- id                         id                             SERIAL (主键)
-- tradeNumber                trade_number                   VARCHAR(20)
-- tradeType                  trade_type                     VARCHAR(10) [CHECK]
-- symbol                     symbol                         VARCHAR(50)
-- name                       name                           VARCHAR(200)
-- buyOrderId                 buy_order_id                   VARCHAR(50)
-- sellOrderId                sell_order_id                  VARCHAR(50)
-- buyPrice                   buy_price                      NUMERIC(20,4)
-- buyQuantity                buy_quantity                   NUMERIC(20,4)
-- buyTime                    buy_time                       TIMESTAMPTZ
-- buyOrderPrice              buy_order_price                NUMERIC(20,4)
-- buyOrderTime               buy_order_time                 TIMESTAMPTZ
-- buyPsychologicalScore      buy_psychological_score         NUMERIC(5,2) [CHECK: 0-10]
-- buyStrategyScore           buy_strategy_score              NUMERIC(5,2) [CHECK: 0-100]
-- buyStrategyId              buy_strategy_id                INTEGER
-- sellPrice                  sell_price                     NUMERIC(20,4)
-- sellQuantity               sell_quantity                  NUMERIC(20,4)
-- sellTime                   sell_time                      TIMESTAMPTZ
-- sellOrderPrice             sell_order_price               NUMERIC(20,4)
-- sellOrderTime              sell_order_time                TIMESTAMPTZ
-- sellPsychologicalScore     sell_psychological_score        NUMERIC(5,2) [CHECK: 0-10]
-- sellStrategyScore          sell_strategy_score             NUMERIC(5,2) [CHECK: 0-100]
-- sellStrategyId             sell_strategy_id               INTEGER
-- buyAmount                  buy_amount                     NUMERIC(20,2)
-- sellAmount                 sell_amount                    NUMERIC(20,2)
-- profit                     profit                         NUMERIC(20,2)
-- profitPercent              profit_percent                 NUMERIC(10,4)
-- holdDuration               hold_duration                  INTEGER [CHECK: >=0]
-- buyGrade                   buy_grade                      VARCHAR(10) [CHECK: A/B/C/D]
-- sellGrade                  sell_grade                     VARCHAR(10) [CHECK: A/B/C/D]
-- overallScore               overall_score                  NUMERIC(5,2) [CHECK: 0-100]
-- buyChannel                 buy_channel                    JSON
-- sellChannel                sell_channel                   JSON
-- tradeSummary               trade_summary                   TEXT
-- tradeCommission            trade_commission                NUMERIC(20,2)
-- sellTradeCommission        sell_trade_commission          NUMERIC(20,2)
-- otherFees                  other_fees                     NUMERIC(20,2)
-- sellOtherFees              sell_other_fees                 NUMERIC(20,2)
-- fees                       fees                           NUMERIC(20,2)
-- slippage                   slippage                       NUMERIC(20,2)
-- netProfit                  net_profit                     NUMERIC(20,2)
-- netProfitPercent           net_profit_percent              NUMERIC(10,4)
-- slippageNetProfitRatio     slippage_net_profit_ratio      NUMERIC(10,4)
-- deleted                    deleted                        BOOLEAN
-- deletedAt                  deleted_at                      TIMESTAMPTZ
-- createdAt                  created_at                     TIMESTAMPTZ
-- updatedAt                  updated_at                     TIMESTAMPTZ

-- ========================================
-- 迁移说明
-- ========================================
-- 1. 此脚本完全按照 daily_work_data 表的规范重构 trade_records 表
-- 2. 添加了所有前端使用的字段（42个字段）
-- 3. 使用 SERIAL 自增主键，与 daily_work_data 保持一致
-- 4. 所有时间字段使用 TIMESTAMPTZ 类型，与 daily_work_data 保持一致
-- 5. 包含 deleted/deleted_at 软删除字段，与 daily_work_data 保持一致
-- 6. 创建了必要的索引，与 daily_work_data 保持一致
-- 7. 添加了 updated_at 触发器，与 daily_work_data 保持一致
-- 8. 添加了 CHECK 约束，确保数据完整性
-- 9. 添加了详细的表和字段注释
-- 10. 前端字段映射：camelCase（前端） ↔ snake_case（数据库）

-- 如需从备份恢复数据，请根据实际字段映射手动调整
-- 提示：由于字段结构变化较大，建议手动重新导入数据

COMMIT;
