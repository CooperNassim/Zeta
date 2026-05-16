-- ========================================
-- 回测系统表 (v1)
-- 用途：存储股票回测配置、结果和参数优化数据
-- 包含表：backtest_configs, backtest_results, backtest_optimizations
-- ========================================

-- 回测配置表
CREATE TABLE backtest_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    stock_codes TEXT[] NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    indicators JSONB NOT NULL,
    buy_conditions JSONB NOT NULL,
    sell_conditions JSONB NOT NULL,
    stop_loss JSONB,
    take_profit JSONB,
    position_sizing JSONB NOT NULL,
    initial_capital DECIMAL(15,2) NOT NULL DEFAULT 100000,
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0003,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 回测结果表
CREATE TABLE backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES backtest_configs(id),
    total_return DECIMAL(8,4),
    annual_return DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    win_rate DECIMAL(5,2),
    profit_loss_ratio DECIMAL(8,4),
    total_trades INTEGER,
    avg_holding_days DECIMAL(8,2),
    calmar_ratio DECIMAL(8,4),
    sortino_ratio DECIMAL(8,4),
    trades JSONB,
    equity_curve JSONB,
    drawdown_curve JSONB,
    run_time INTERVAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 参数优化结果表
CREATE TABLE backtest_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES backtest_configs(id),
    param_combinations JSONB NOT NULL,
    results JSONB NOT NULL,
    best_params JSONB NOT NULL,
    optimization_target VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX backtest_configs_stock_codes_idx ON backtest_configs USING GIN(stock_codes);
CREATE INDEX backtest_configs_start_date_idx ON backtest_configs (start_date DESC);
CREATE INDEX backtest_configs_created_at_idx ON backtest_configs (created_at DESC);
CREATE INDEX backtest_configs_deleted_idx ON backtest_configs (deleted);

CREATE INDEX backtest_results_config_id_idx ON backtest_results (config_id);
CREATE INDEX backtest_results_created_at_idx ON backtest_results (created_at DESC);

CREATE INDEX backtest_optimizations_config_id_idx ON backtest_optimizations (config_id);
CREATE INDEX backtest_optimizations_target_idx ON backtest_optimizations (optimization_target);
CREATE INDEX backtest_optimizations_created_at_idx ON backtest_optimizations (created_at DESC);

-- 触发器
CREATE TRIGGER update_backtest_configs_updated_at BEFORE UPDATE ON backtest_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 表注释
COMMENT ON TABLE backtest_configs IS '回测配置表';
COMMENT ON COLUMN backtest_configs.name IS '回测名称';
COMMENT ON COLUMN backtest_configs.description IS '描述';
COMMENT ON COLUMN backtest_configs.stock_codes IS '股票代码数组';
COMMENT ON COLUMN backtest_configs.start_date IS '开始日期';
COMMENT ON COLUMN backtest_configs.end_date IS '结束日期';
COMMENT ON COLUMN backtest_configs.indicators IS '技术指标配置 (JSONB)';
COMMENT ON COLUMN backtest_configs.buy_conditions IS '买入条件 (JSONB)';
COMMENT ON COLUMN backtest_configs.sell_conditions IS '卖出条件 (JSONB)';
COMMENT ON COLUMN backtest_configs.stop_loss IS '止损配置 (JSONB)';
COMMENT ON COLUMN backtest_configs.take_profit IS '止盈配置 (JSONB)';
COMMENT ON COLUMN backtest_configs.position_sizing IS '仓位管理配置 (JSONB)';
COMMENT ON COLUMN backtest_configs.initial_capital IS '初始资金';
COMMENT ON COLUMN backtest_configs.commission_rate IS '手续费率';

COMMENT ON TABLE backtest_results IS '回测结果表';
COMMENT ON COLUMN backtest_results.config_id IS '关联配置ID';
COMMENT ON COLUMN backtest_results.total_return IS '总收益率';
COMMENT ON COLUMN backtest_results.annual_return IS '年化收益率';
COMMENT ON COLUMN backtest_results.max_drawdown IS '最大回撤';
COMMENT ON COLUMN backtest_results.sharpe_ratio IS '夏普比率';
COMMENT ON COLUMN backtest_results.win_rate IS '胜率';
COMMENT ON COLUMN backtest_results.profit_loss_ratio IS '盈亏比';
COMMENT ON COLUMN backtest_results.total_trades IS '总交易次数';
COMMENT ON COLUMN backtest_results.avg_holding_days IS '平均持仓天数';
COMMENT ON COLUMN backtest_results.calmar_ratio IS '卡尔玛比率';
COMMENT ON COLUMN backtest_results.sortino_ratio IS '索提诺比率';
COMMENT ON COLUMN backtest_results.trades IS '交易明细 (JSONB)';
COMMENT ON COLUMN backtest_results.equity_curve IS '资金曲线数据 (JSONB)';
COMMENT ON COLUMN backtest_results.drawdown_curve IS '回撤曲线数据 (JSONB)';
COMMENT ON COLUMN backtest_results.run_time IS '回测耗时';

COMMENT ON TABLE backtest_optimizations IS '参数优化结果表';
COMMENT ON COLUMN backtest_optimizations.config_id IS '关联配置ID';
COMMENT ON COLUMN backtest_optimizations.param_combinations IS '参数组合 (JSONB)';
COMMENT ON COLUMN backtest_optimizations.results IS '每组参数的回测结果 (JSONB)';
COMMENT ON COLUMN backtest_optimizations.best_params IS '最优参数 (JSONB)';
COMMENT ON COLUMN backtest_optimizations.optimization_target IS '优化目标';
