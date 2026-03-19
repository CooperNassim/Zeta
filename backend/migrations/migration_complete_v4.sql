-- ========================================
-- Zeta Trading System 完整数据库迁移脚本 V4
-- 版本: 4.0.0
-- 生成时间: 2026-03-19
-- 说明: 此脚本包含所有必要的表和初始数据,包含重构后的交易策略表
--
-- 版本历史:
--   V1: 初始版本
--   V2: 添加软删除支持
--   V3: 修正时间戳为 TIMESTAMPTZ
--   V4: 重构交易策略表,参考 daily_work_data 规范
--
-- 预留表结构说明:
--   以下表结构已预留,未来可根据需求添加:
--   - portfolio_management (投资组合管理)
--   - market_analysis (市场分析)
--   - trade_simulation (交易模拟)
--   - system_logs (系统日志)
--   - user_settings (用户设置)
--
-- 注意: 新增表时请遵循以下规范:
--   1. 使用 SERIAL 主键
--   2. 统一使用 TIMESTAMPTZ 时间类型
--   3. 包含 deleted/deleted_at 软删除字段
--   4. 创建必要的索引
--   5. 添加 updated_at 触发器
--   6. 添加表和字段注释
-- ========================================

-- 删除现有表（如果存在）- 注意 CASCADE 会自动删除相关序列
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS trading_strategies CASCADE;
DROP TABLE IF EXISTS trade_records CASCADE;
DROP TABLE IF EXISTS technical_indicators CASCADE;
DROP TABLE IF EXISTS strategy_records CASCADE;
DROP TABLE IF EXISTS stock_pool CASCADE;
DROP TABLE IF EXISTS stock_kline_data CASCADE;
DROP TABLE IF EXISTS scheduled_orders CASCADE;
DROP TABLE IF EXISTS risk_models CASCADE;
DROP TABLE IF EXISTS risk_config CASCADE;
DROP TABLE IF EXISTS psychological_tests_backup CASCADE;
DROP TABLE IF EXISTS psychological_test_results CASCADE;
DROP TABLE IF EXISTS psychological_test_indicators CASCADE;
DROP TABLE IF EXISTS psychological_indicators CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS daily_work_data_backup CASCADE;
DROP TABLE IF EXISTS daily_work_data CASCADE;
DROP TABLE IF EXISTS account_risk_data CASCADE;
DROP TABLE IF EXISTS account CASCADE;

-- ========================================
-- 表: account
-- ========================================
CREATE TABLE account (
    id SERIAL PRIMARY KEY,
    total_balance NUMERIC NOT NULL DEFAULT 0,
    available_balance NUMERIC NOT NULL DEFAULT 0,
    frozen_balance NUMERIC NOT NULL DEFAULT 0,
    total_profit NUMERIC NOT NULL DEFAULT 0,
    total_profit_rate NUMERIC NOT NULL DEFAULT 0,
    today_profit NUMERIC NOT NULL DEFAULT 0,
    today_profit_rate NUMERIC NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    winning_orders INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 表: account_risk_data
-- ========================================
CREATE TABLE account_risk_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_assets NUMERIC NOT NULL,
    net_assets NUMERIC NOT NULL,
    max_assets NUMERIC NOT NULL,
    current_drawdown NUMERIC NOT NULL,
    max_drawdown NUMERIC NOT NULL,
    daily_return NUMERIC NOT NULL,
    volatility NUMERIC NOT NULL,
    sharpe_ratio NUMERIC NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX account_risk_data_date_key ON public.account_risk_data USING btree (date);

-- ========================================
-- 表: daily_work_data
-- ========================================
CREATE TABLE daily_work_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    nasdaq TEXT NULL,
    ftse TEXT NULL,
    dax TEXT NULL,
    n225 TEXT NULL,
    hsi TEXT NULL,
    bitcoin TEXT NULL,
    eurusd TEXT NULL,
    usdjpy TEXT NULL,
    usdcny TEXT NULL,
    oil TEXT NULL,
    gold TEXT NULL,
    bond TEXT NULL,
    consecutive TEXT NULL,
    a50 TEXT NULL,
    sh_index TEXT NULL,
    sh_2day_power TEXT NULL,
    sh_13day_power TEXT NULL,
    up_count TEXT NULL,
    limit_up TEXT NULL,
    down_count TEXT NULL,
    limit_down TEXT NULL,
    volume TEXT NULL,
    sentiment TEXT NULL,
    prediction TEXT NULL,
    trade_status TEXT NULL,
    review_plan TEXT NULL,
    review_execution TEXT NULL,
    review_result TEXT NULL,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX daily_work_data_date_idx ON daily_work_data (date);
CREATE INDEX daily_work_data_created_at_idx ON daily_work_data (created_at DESC);

-- ========================================
-- 表: orders
-- ========================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_type VARCHAR(20) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL,
    order_date DATE NOT NULL,
    order_time VARCHAR(8) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reason TEXT,
    notes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX orders_date_idx ON orders (order_date DESC);
CREATE INDEX orders_symbol_idx ON orders (symbol);
CREATE INDEX orders_status_idx ON orders (status);

-- ========================================
-- 表: transactions
-- ========================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_time VARCHAR(8) NOT NULL,
    fee NUMERIC NOT NULL DEFAULT 0,
    profit NUMERIC NULL,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX transactions_order_id_idx ON transactions (order_id);
CREATE INDEX transactions_date_idx ON transactions (transaction_date DESC);
CREATE INDEX transactions_symbol_idx ON transactions (symbol);

-- ========================================
-- 表: trading_strategies (重构版)
-- ========================================
CREATE TABLE trading_strategies (
    id SERIAL PRIMARY KEY,
    strategy_type VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    eval_standard_1 TEXT NULL,
    eval_standard_2 TEXT NULL,
    eval_standard_3 TEXT NULL,
    eval_standard_4 TEXT NULL,
    eval_standard_5 TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT '启用',
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trading_strategies_type ON trading_strategies (strategy_type);
CREATE INDEX idx_trading_strategies_status ON trading_strategies (status);
CREATE INDEX idx_trading_strategies_deleted ON trading_strategies (deleted);
CREATE INDEX idx_trading_strategies_created ON trading_strategies (created_at DESC);

-- ========================================
-- 表: strategy_records
-- ========================================
CREATE TABLE strategy_records (
    id SERIAL PRIMARY KEY,
    strategy_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    eval_score_1 VARCHAR(20) NULL,
    eval_score_2 VARCHAR(20) NULL,
    eval_score_3 VARCHAR(20) NULL,
    eval_score_4 VARCHAR(20) NULL,
    eval_score_5 VARCHAR(20) NULL,
    total_score NUMERIC NULL,
    notes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX strategy_records_strategy_idx ON strategy_records (strategy_id);
CREATE INDEX strategy_records_order_idx ON strategy_records (order_id);
CREATE INDEX strategy_records_created_idx ON strategy_records (created_at DESC);

-- ========================================
-- 表: trade_records
-- ========================================
CREATE TABLE trade_records (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    entry_price NUMERIC NOT NULL,
    exit_price NUMERIC,
    entry_date DATE NOT NULL,
    exit_date DATE,
    quantity NUMERIC NOT NULL,
    profit NUMERIC,
    profit_rate NUMERIC,
    holding_days INTEGER,
    notes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX trade_records_order_idx ON trade_records (order_id);
CREATE INDEX trade_records_symbol_idx ON trade_records (symbol);
CREATE INDEX trade_records_date_idx ON trade_records (entry_date DESC);

-- ========================================
-- 表: technical_indicators
-- ========================================
CREATE TABLE technical_indicators (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    indicator_type VARCHAR(20) NOT NULL,
    value NUMERIC NOT NULL,
    indicator_date DATE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX tech_indicators_symbol_idx ON technical_indicators (symbol);
CREATE INDEX tech_indicators_type_idx ON technical_indicators (indicator_type);
CREATE INDEX tech_indicators_date_idx ON technical_indicators (indicator_date DESC);

-- ========================================
-- 表: stock_pool
-- ========================================
CREATE TABLE stock_pool (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    sector VARCHAR(100) NULL,
    market VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'watching',
    buy_price NUMERIC NULL,
    sell_price NUMERIC NULL,
    notes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX stock_pool_symbol_idx ON stock_pool (symbol);
CREATE INDEX stock_pool_status_idx ON stock_pool (status);
CREATE INDEX stock_pool_sector_idx ON stock_pool (sector);

-- ========================================
-- 表: stock_kline_data
-- ========================================
CREATE TABLE stock_kline_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    open_price NUMERIC NOT NULL,
    high_price NUMERIC NOT NULL,
    low_price NUMERIC NOT NULL,
    close_price NUMERIC NOT NULL,
    volume NUMERIC NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX kline_symbol_date_idx ON stock_kline_data (symbol, date);

-- ========================================
-- 表: scheduled_orders
-- ========================================
CREATE TABLE scheduled_orders (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL,
    trigger_price NUMERIC,
    trigger_type VARCHAR(20) NOT NULL DEFAULT 'price',
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(8) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX scheduled_orders_date_idx ON scheduled_orders (scheduled_date);
CREATE INDEX scheduled_orders_status_idx ON scheduled_orders (status);

-- ========================================
-- 表: risk_config
-- ========================================
CREATE TABLE risk_config (
    id SERIAL PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL,
    max_position_size NUMERIC NOT NULL,
    max_daily_loss NUMERIC NOT NULL,
    max_drawdown NUMERIC NOT NULL,
    stop_loss_rate NUMERIC NOT NULL,
    take_profit_rate NUMERIC NOT NULL,
    notes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 表: risk_models
-- ========================================
CREATE TABLE risk_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    parameters TEXT NOT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 表: psychological_indicators
-- ========================================
CREATE TABLE psychological_indicators (
    id SERIAL PRIMARY KEY,
    indicator_name VARCHAR(100) NOT NULL,
    description TEXT,
    scoring_method VARCHAR(50),
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 表: psychological_test_results
-- ========================================
CREATE TABLE psychological_test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    test_date DATE NOT NULL,
    indicators JSON NOT NULL,
    total_score NUMERIC NOT NULL,
    notes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX psych_results_user_idx ON psychological_test_results (user_id);
CREATE INDEX psych_results_date_idx ON psychological_test_results (test_date DESC);

-- ========================================
-- 表: psychological_test_indicators
-- ========================================
CREATE TABLE psychological_test_indicators (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL,
    indicator_id INTEGER NOT NULL,
    score NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES psychological_test_results(id),
    FOREIGN KEY (indicator_id) REFERENCES psychological_indicators(id)
);

-- ========================================
-- 通用 updated_at 触发器
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有包含 updated_at 字段的表创建触发器
CREATE TRIGGER update_account_updated_at BEFORE UPDATE ON account FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_account_risk_data_updated_at BEFORE UPDATE ON account_risk_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_work_data_updated_at BEFORE UPDATE ON daily_work_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_strategies_updated_at BEFORE UPDATE ON trading_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_records_updated_at BEFORE UPDATE ON strategy_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_records_updated_at BEFORE UPDATE ON trade_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technical_indicators_updated_at BEFORE UPDATE ON technical_indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_pool_updated_at BEFORE UPDATE ON stock_pool FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_kline_data_updated_at BEFORE UPDATE ON stock_kline_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_orders_updated_at BEFORE UPDATE ON scheduled_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_config_updated_at BEFORE UPDATE ON risk_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_models_updated_at BEFORE UPDATE ON risk_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_psychological_indicators_updated_at BEFORE UPDATE ON psychological_indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_psychological_test_results_updated_at BEFORE UPDATE ON psychological_test_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 插入初始数据
-- ========================================

-- 插入账户数据
INSERT INTO account (total_balance, available_balance, total_profit, today_profit) VALUES
(100000, 100000, 0, 0);

-- 插入交易策略数据 (重构版)
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status) VALUES
(1, '买入', '趋势突破策略', '指标：0=突破阻力位；1=放量确认；2=回踩不破；', '指标：0=MACD金叉；1=RSI强势；2=KDJ超买；', '指标：0=均线多头；1=趋势向上；2=量价配合；', '指标：0=情绪指数高；1=资金流入；2=北向资金增；', '指标：0=盈亏比>2；1=止损<3%；2=仓位<30%；', '启用'),
(2, '买入', '回调买入策略', '指标：0=回踩支撑位；1=企稳迹象；2=缩量调整；', '指标：0=MACD底背离；1=RSI超卖；2=KDJ金叉；', '指标：0=均线支撑；1=趋势未破；2=量能萎缩；', '指标：0=恐慌情绪；1=抄底资金；2=北向资金入场；', '指标：0=盈亏比>3；1=止损<2%；2=仓位<40%；', '启用'),
(3, '买入', '低吸策略', '指标：0=超跌反弹；1=底部信号；2=技术背离；', '指标：0=MACD绿柱缩短；1=RSI<30；2=KDJ低位；', '指标：0=长期均线支撑；1=下跌趋势减缓；2=成交量极低；', '指标：0=极度恐慌；1=机构抄底；2=外资大单；', '指标：0=盈亏比>4；1=止损<2%；2=仓位<20%；', '停用'),
(4, '卖出', '止盈策略', '指标：0=盈利达标；1=加速上涨；2=量能放大；', '指标：0=MACD顶背离；1=RSI>70；2=KDJ死叉；', '指标：0=跌破均线；1=趋势转弱；2=量能萎缩；', '指标：0=情绪过热；1=获利盘涌出；2=北向资金流出；', '指标：0=收益锁定；1=止盈线触发；2=分批止盈；', '启用'),
(5, '卖出', '止损策略', '指标：0=跌破止损位；1=放量破位；2=反抽无力；', '指标：0=MACD死叉；1=RSI弱势；2=KDJ高位；', '指标：0=均线空头；1=趋势破坏；2=量能放大；', '指标：0=情绪恐慌；1=恐慌性抛售；2=外资大幅流出；', '指标：0=亏损控制；1=止损线触发；2=坚决止损；', '启用'),
(6, '卖出', '风险控制策略', '指标：0=风险过高；1=仓位过大；2=波动剧烈；', '指标：0=系统性风险；1=黑天鹅事件；2=政策利空；', '指标：0=技术破位；1=支撑失效；2=反弹无力；', '指标：0=市场恐慌；1=流动性危机；2=全面下跌；', '指标：0=保护本金；1.降低仓位；2.空仓观望；', '停用');

-- 插入心理指标
INSERT INTO psychological_indicators (indicator_name, description, scoring_method) VALUES
('心态稳定性', '评估投资者在面对市场波动时的心理稳定性', '1-10分'),
('风险承受能力', '评估投资者对风险的承受意愿和能力', '1-10分'),
('决策果断性', '评估投资决策的果断程度和执行力', '1-10分'),
('情绪控制力', '评估投资者情绪对交易决策的影响程度', '1-10分'),
('纪律性', '评估投资者遵守交易纪律的情况', '1-10分');

-- 插入风险配置
INSERT INTO risk_config (config_name, max_position_size, max_daily_loss, max_drawdown, stop_loss_rate, take_profit_rate) VALUES
('默认配置', 30, 5, 20, 3, 10);

-- ========================================
-- 添加表注释
-- ========================================
COMMENT ON TABLE account IS '账户信息表';
COMMENT ON TABLE account_risk_data IS '账户风险数据表';
COMMENT ON TABLE daily_work_data IS '每日功课数据表';
COMMENT ON TABLE orders IS '订单表';
COMMENT ON TABLE transactions IS '交易记录表';
COMMENT ON TABLE trading_strategies IS '交易策略表 (重构版)';
COMMENT ON TABLE strategy_records IS '策略评估记录表';
COMMENT ON TABLE trade_records IS '交易记录表';
COMMENT ON TABLE technical_indicators IS '技术指标表';
COMMENT ON TABLE stock_pool IS '股票池表';
COMMENT ON TABLE stock_kline_data IS '股票K线数据表';
COMMENT ON TABLE scheduled_orders IS '计划订单表';
COMMENT ON TABLE risk_config IS '风险配置表';
COMMENT ON TABLE risk_models IS '风险模型表';
COMMENT ON TABLE psychological_indicators IS '心理指标表';
COMMENT ON TABLE psychological_test_results IS '心理测试结果表';
COMMENT ON TABLE psychological_test_indicators IS '心理测试指标评分表';

COMMIT;
