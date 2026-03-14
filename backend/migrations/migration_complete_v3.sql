-- Zeta Trading System 完整数据库迁移脚本
-- 生成时间: 2026-03-13

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

-- 表: account
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

-- 表: account_risk_data
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
CREATE UNIQUE INDEX account_risk_data_date_key ON account_risk_data (date);

-- 表: daily_work_data
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
CREATE UNIQUE INDEX daily_work_data_date_key ON daily_work_data (date);
CREATE INDEX idx_daily_work_deleted ON daily_work_data (deleted);

-- 表: orders
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    trade_number VARCHAR(50) NULL,
    type VARCHAR(20) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NULL,
    price NUMERIC NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_virtual BOOLEAN NOT NULL DEFAULT false,
    psychological_score NUMERIC NULL,
    strategy_score NUMERIC NULL,
    risk_score NUMERIC NULL,
    overall_score NUMERIC NULL,
    buy_order_id BIGINT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_symbol ON orders (symbol);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_deleted ON orders (deleted);

-- 表: psychological_indicators (旧的)
CREATE TABLE psychological_indicators (
    id BIGINT PRIMARY KEY,
    user_id INTEGER NULL,
    indicator_name VARCHAR(100) NULL,
    value NUMERIC NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false
);

-- 表: psychological_test_indicators (0-2分测试问题)
CREATE TABLE psychological_test_indicators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    min_score NUMERIC DEFAULT 0,
    max_score NUMERIC DEFAULT 2,
    weight NUMERIC DEFAULT 0.2,
    sort_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO psychological_test_indicators (name, description, min_score, max_score, weight, sort_order) VALUES
('今天身体感觉怎么样？', '0=感觉生病了；1=感觉正常；2=感觉好极了；', 0, 2, 0.20, 1),
('昨天交易如何？', '0=亏损；1=没有交易；2=盈利；', 0, 2, 0.20, 2),
('早上做好计划了吗？', '0=没做；1=无仓位；2=准备得很好；', 0, 2, 0.20, 3),
('早上情绪如何？', '0=低落；1=正常；2=棒极了；', 0, 2, 0.20, 4),
('今天工作量如何？', '0=很忙；1=正常；2=很闲；', 0, 2, 0.20, 5);

-- 表: psychological_test_results
CREATE TABLE psychological_test_results (
    id SERIAL PRIMARY KEY,
    test_date DATE NOT NULL,
    test_type VARCHAR(50) DEFAULT 'daily',
    score JSONB NOT NULL,
    overall_score NUMERIC NOT NULL,
    notes TEXT NULL,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX psychological_test_results_test_date_key ON psychological_test_results (test_date);

-- 表: risk_config
CREATE TABLE risk_config (
    id SERIAL PRIMARY KEY,
    total_risk_ratio NUMERIC NOT NULL,
    single_trade_risk_ratio NUMERIC NOT NULL,
    max_positions INTEGER NOT NULL,
    stop_loss_ratio NUMERIC NOT NULL,
    take_profit_ratio NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO risk_config (id, total_risk_ratio, single_trade_risk_ratio, max_positions, stop_loss_ratio, take_profit_ratio) VALUES (1, 0.06, 0.02, 5, 0.05, 0.15);

-- 表: risk_models
CREATE TABLE risk_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    max_loss_percent NUMERIC NOT NULL,
    position_size NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO risk_models (id, name, description, max_loss_percent, position_size) VALUES (1, '保守型', '单笔最大亏损不超过总资金的1%', 1, 0.1);
INSERT INTO risk_models (id, name, description, max_loss_percent, position_size) VALUES (2, '平衡型', '单笔最大亏损不超过总资金的2%', 2, 0.2);
INSERT INTO risk_models (id, name, description, max_loss_percent, position_size) VALUES (3, '激进型', '单笔最大亏损不超过总资金的5%', 5, 0.3);

-- 表: scheduled_orders
CREATE TABLE scheduled_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NULL,
    order_type VARCHAR(20) NOT NULL,
    order_price NUMERIC NOT NULL,
    order_quantity INTEGER NOT NULL,
    trigger_price NUMERIC NULL,
    stop_loss_price NUMERIC NULL,
    take_profit_price NUMERIC NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    scheduled_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    triggered_at TIMESTAMPTZ NULL,
    cancelled_at TIMESTAMPTZ NULL,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_scheduled_orders_symbol ON scheduled_orders (symbol);
CREATE INDEX idx_scheduled_orders_status ON scheduled_orders (status);

-- 表: stock_kline_data
CREATE TABLE stock_kline_data (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    period VARCHAR(10) NOT NULL DEFAULT 'daily',
    open NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    volume BIGINT NOT NULL,
    amount NUMERIC NOT NULL,
    bb_upper NUMERIC NULL,
    bb_lower NUMERIC NULL,
    bb_middle NUMERIC NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX stock_kline_data_symbol_date_period_key ON stock_kline_data (symbol, date, period);

-- 表: stock_pool
CREATE TABLE stock_pool (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    market VARCHAR(10) NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    sector VARCHAR(50) NULL,
    current_price NUMERIC NULL,
    change NUMERIC NULL,
    change_percent NUMERIC NULL,
    volume BIGINT NULL,
    market_cap NUMERIC NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL
);
CREATE UNIQUE INDEX stock_pool_symbol_key ON stock_pool (symbol);
INSERT INTO stock_pool (symbol, name, market, exchange, sector) VALUES ('000001', '平安银行', 'cn', '深交所', '银行');
INSERT INTO stock_pool (symbol, name, market, exchange, sector) VALUES ('600036', '招商银行', 'cn', '上交所', '银行');
INSERT INTO stock_pool (symbol, name, market, exchange, sector) VALUES ('600519', '贵州茅台', 'cn', '上交所', '白酒');

-- 表: strategy_records
CREATE TABLE strategy_records (
    id SERIAL PRIMARY KEY,
    strategy_id INTEGER NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL,
    signal_strength NUMERIC NOT NULL,
    execution_price NUMERIC NULL,
    execution_quantity INTEGER NULL,
    profit NUMERIC NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    triggered_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 表: technical_indicators
CREATE TABLE technical_indicators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    icon TEXT NULL,
    tags TEXT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX technical_indicators_name_key ON technical_indicators (name);
INSERT INTO technical_indicators (name, description, tags) VALUES ('MACD', '指数平滑异同移动平均线', '["趋势", "动量"]');
INSERT INTO technical_indicators (name, description, tags) VALUES ('RSI', '相对强弱指数', '["动量", "震荡"]');
INSERT INTO technical_indicators (name, description, tags) VALUES ('KDJ', '随机指标', '["震荡", "短期"]');
INSERT INTO technical_indicators (name, description, tags) VALUES ('BOLL', '布林带', '["趋势", "波动"]');

-- 表: trade_records
CREATE TABLE trade_records (
    id BIGSERIAL PRIMARY KEY,
    trade_number VARCHAR(50) NULL,
    trade_type VARCHAR(20) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NULL,
    buy_order_id BIGINT NULL,
    sell_order_id BIGINT NULL,
    buy_price NUMERIC NULL,
    buy_quantity INTEGER NULL,
    buy_time TIMESTAMPTZ NULL,
    sell_price NUMERIC NULL,
    sell_quantity INTEGER NULL,
    sell_time TIMESTAMPTZ NULL,
    buy_amount VARCHAR(50) NULL,
    sell_amount VARCHAR(50) NULL,
    profit VARCHAR(50) NULL,
    profit_percent VARCHAR(50) NULL,
    hold_duration INTEGER NULL,
    buy_grade VARCHAR(10) NULL,
    sell_grade VARCHAR(10) NULL,
    overall_score NUMERIC NULL,
    buy_channel JSONB NULL,
    sell_channel JSONB NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_trade_records_symbol ON trade_records (symbol);

-- 表: trading_strategies
CREATE TABLE trading_strategies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT NULL,
    conditions JSONB NOT NULL,
    pass_score NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO trading_strategies (name, type, description, conditions, pass_score) VALUES
('趋势突破策略', 'buy', '价格突破关键阻力位', '[{"id":"1","name":"价格突破","weight":0.2,"threshold":70},{"id":"2","name":"成交量配合","weight":0.2,"threshold":70}]', 70),
('回调买入策略', 'buy', '价格回调至支撑位买入', '[{"id":"1","name":"回调位置","weight":0.2,"threshold":70}]', 70),
('止盈策略', 'sell', '达到预期盈利目标', '[{"id":"1","name":"盈利比例","weight":0.2,"threshold":70}]', 70),
('止损策略', 'sell', '跌破止损位及时止损', '[{"id":"1","name":"跌破止损","weight":0.2,"threshold":70}]', 70);

-- 表: transactions
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount NUMERIC NOT NULL,
    balance_after NUMERIC NULL,
    description TEXT NULL,
    transaction_date TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL
);
