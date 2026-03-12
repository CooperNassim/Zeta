-- Zeta Trading System 数据库迁移脚本
-- 生成时间: 2026-03-12T15:38:07.238Z

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS account_risk_data CASCADE;
DROP TABLE IF EXISTS daily_work_data CASCADE;
DROP TABLE IF EXISTS daily_work_data_backup CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS psychological_indicators CASCADE;
DROP TABLE IF EXISTS psychological_test_results CASCADE;
DROP TABLE IF EXISTS psychological_tests_backup CASCADE;
DROP TABLE IF EXISTS risk_config CASCADE;
DROP TABLE IF EXISTS risk_models CASCADE;
DROP TABLE IF EXISTS stock_kline_data CASCADE;
DROP TABLE IF EXISTS stock_pool CASCADE;
DROP TABLE IF EXISTS strategy_records CASCADE;
DROP TABLE IF EXISTS technical_indicators CASCADE;
DROP TABLE IF EXISTS trade_records CASCADE;
DROP TABLE IF EXISTS trading_strategies CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

-- ========================================
-- 表: account
-- ========================================
CREATE TABLE account (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('account_id_seq'::regclass)
    total_balance NUMERIC NOT NULL DEFAULT 0
    available_balance NUMERIC NOT NULL DEFAULT 0
    frozen_balance NUMERIC NOT NULL DEFAULT 0
    total_profit NUMERIC NOT NULL DEFAULT 0
    total_profit_rate NUMERIC NOT NULL DEFAULT 0
    today_profit NUMERIC NOT NULL DEFAULT 0
    today_profit_rate NUMERIC NOT NULL DEFAULT 0
    total_orders INTEGER NOT NULL DEFAULT 0
    winning_orders INTEGER NOT NULL DEFAULT 0
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据到 account
INSERT INTO account (id, total_balance, available_balance, frozen_balance, total_profit, total_profit_rate, today_profit, today_profit_rate, total_orders, winning_orders, created_at, updated_at) VALUES (1, '100000.00', '100000.00', '0.00', '0.00', '0.0000', '0.00', '0.0000', 0, 0, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');

-- ========================================
-- 表: account_risk_data
-- ========================================
CREATE TABLE account_risk_data (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('account_risk_data_id_seq'::regclass)
    date DATE NOT NULL
    total_assets NUMERIC NOT NULL
    net_assets NUMERIC NOT NULL
    max_assets NUMERIC NOT NULL
    current_drawdown NUMERIC NOT NULL
    max_drawdown NUMERIC NOT NULL
    daily_return NUMERIC NOT NULL
    volatility NUMERIC NOT NULL
    sharpe_ratio NUMERIC NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX account_risk_data_date_key ON public.account_risk_data USING btree (date)

CREATE INDEX idx_account_risk_data_date idx_account_risk_data_date ON public.account_risk_data USING btree (date)

-- ========================================
-- 表: daily_work_data
-- ========================================
CREATE TABLE daily_work_data (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('daily_work_data_id_seq'::regclass)
    date DATE NOT NULL
    nasdaq TEXT NULL
    ftse TEXT NULL
    dax TEXT NULL
    n225 TEXT NULL
    hsi TEXT NULL
    bitcoin TEXT NULL
    eurusd TEXT NULL
    usdjpy TEXT NULL
    usdcny TEXT NULL
    oil TEXT NULL
    gold TEXT NULL
    bond TEXT NULL
    consecutive TEXT NULL
    a50 TEXT NULL
    sh_index TEXT NULL
    sh_2day_power TEXT NULL
    sh_13day_power TEXT NULL
    up_count TEXT NULL
    limit_up TEXT NULL
    down_count TEXT NULL
    limit_down TEXT NULL
    volume TEXT NULL
    sentiment TEXT NULL
    prediction TEXT NULL
    trade_status TEXT NULL
    review_plan TEXT NULL
    review_execution TEXT NULL
    review_result TEXT NULL
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX daily_work_data_date_key ON public.daily_work_data USING btree (date)

CREATE INDEX idx_daily_work_date idx_daily_work_date ON public.daily_work_data USING btree (date)

CREATE INDEX idx_daily_work_deleted idx_daily_work_deleted ON public.daily_work_data USING btree (deleted)

CREATE INDEX idx_daily_work_sentiment idx_daily_work_sentiment ON public.daily_work_data USING btree (sentiment)

CREATE INDEX idx_daily_work_trade_status idx_daily_work_trade_status ON public.daily_work_data USING btree (trade_status)

-- ========================================
-- 表: daily_work_data_backup
-- ========================================
CREATE TABLE daily_work_data_backup (
    id INTEGER NULL
    date DATE NULL
    nasdaq TEXT NULL
    ftse TEXT NULL
    dax TEXT NULL
    n225 TEXT NULL
    hsi TEXT NULL
    bitcoin TEXT NULL
    eurusd TEXT NULL
    usdjpy TEXT NULL
    usdcny TEXT NULL
    oil TEXT NULL
    gold TEXT NULL
    bond TEXT NULL
    consecutive TEXT NULL
    a50 TEXT NULL
    sh_index TEXT NULL
    sh_2day_power TEXT NULL
    sh_13day_power TEXT NULL
    up_count TEXT NULL
    limit_up TEXT NULL
    down_count TEXT NULL
    limit_down TEXT NULL
    volume TEXT NULL
    sentiment TEXT NULL
    prediction TEXT NULL
    trade_status TEXT NULL
    review_plan TEXT NULL
    review_execution TEXT NULL
    review_result TEXT NULL
    deleted BOOLEAN NULL
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL
    updated_at TIMESTAMPTZ NULL
);

-- 插入数据到 daily_work_data_backup
INSERT INTO daily_work_data_backup (id, date, nasdaq, ftse, dax, n225, hsi, bitcoin, eurusd, usdjpy, usdcny, oil, gold, bond, consecutive, a50, sh_index, sh_2day_power, sh_13day_power, up_count, limit_up, down_count, limit_down, volume, sentiment, prediction, trade_status, review_plan, review_execution, review_result, deleted, deleted_at, created_at, updated_at) VALUES (1, '2026-03-09T16:00:00.000Z', '16500', '8200', '18200', '39500', '18500', '68000', '1.09', '150.5', '7.19', '85', '2180', '120', '15', '12800', '3050', '-120', '800', '2800', '80', '2100', '15', '8500', '微热', '看涨', '积极地', NULL, NULL, NULL, FALSE, NULL, '2026-03-10T13:01:34.125Z', '2026-03-10T13:01:34.125Z');
INSERT INTO daily_work_data_backup (id, date, nasdaq, ftse, dax, n225, hsi, bitcoin, eurusd, usdjpy, usdcny, oil, gold, bond, consecutive, a50, sh_index, sh_2day_power, sh_13day_power, up_count, limit_up, down_count, limit_down, volume, sentiment, prediction, trade_status, review_plan, review_execution, review_result, deleted, deleted_at, created_at, updated_at) VALUES (2, '2026-03-08T16:00:00.000Z', '16400', '8150', '18100', '39300', '18400', '67200', '1.08', '149.8', '7.18', '84', '2170', '119', '12', '12700', '3030', '-130', '750', '2600', '65', '2300', '18', '8200', '微冷', '看跌', '保守地', NULL, NULL, NULL, FALSE, NULL, '2026-03-10T13:01:34.125Z', '2026-03-10T13:01:34.125Z');

-- ========================================
-- 表: orders
-- ========================================
CREATE TABLE orders (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('orders_id_seq'::regclass)
    symbol VARCHAR(20) NOT NULL
    name VARCHAR(100) NULL
    order_type VARCHAR(20) NOT NULL
    order_price NUMERIC NULL
    order_quantity INTEGER NOT NULL
    trigger_price NUMERIC NULL
    stop_loss_price NUMERIC NULL
    take_profit_price NUMERIC NULL
    status VARCHAR(20) NOT NULL DEFAULT 'pending'::character varying
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    triggered_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_orders_symbol idx_orders_symbol ON public.orders USING btree (symbol)

CREATE INDEX idx_orders_status idx_orders_status ON public.orders USING btree (status)

CREATE INDEX idx_orders_created_at idx_orders_created_at ON public.orders USING btree (created_at)

-- ========================================
-- 表: psychological_indicators
-- ========================================
CREATE TABLE psychological_indicators (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('psychological_indicators_id_seq'::regclass)
    indicator_id VARCHAR(10) NOT NULL
    name VARCHAR(200) NOT NULL
    description TEXT NULL
    min_score INTEGER NOT NULL DEFAULT 0
    max_score INTEGER NOT NULL DEFAULT 2
    weight NUMERIC NOT NULL DEFAULT 0.2
    sort_order INTEGER NOT NULL DEFAULT 0
    is_active BOOLEAN NULL DEFAULT true
    deleted BOOLEAN NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX psychological_indicators_indicator_id_key ON public.psychological_indicators USING btree (indicator_id)

CREATE INDEX idx_psychological_indicators_active idx_psychological_indicators_active ON public.psychological_indicators USING btree (is_active)

CREATE INDEX idx_psychological_indicators_deleted idx_psychological_indicators_deleted ON public.psychological_indicators USING btree (deleted)

-- 插入数据到 psychological_indicators
INSERT INTO psychological_indicators (id, indicator_id, name, description, min_score, max_score, weight, sort_order, is_active, deleted, deleted_at, created_at, updated_at) VALUES (1, '1', '今天身体感觉怎么样？', '今天身体感觉怎么样？', 0, 2, '0.20', 1, TRUE, FALSE, NULL, '2026-03-12T09:23:38.091Z', '2026-03-12T11:25:58.284Z');
INSERT INTO psychological_indicators (id, indicator_id, name, description, min_score, max_score, weight, sort_order, is_active, deleted, deleted_at, created_at, updated_at) VALUES (2, '2', '昨天交易如何？', '0=亏损；1=没有交易；2=盈利；0=感觉生病了；1=感觉正常；2=感觉好极了；', 0, 2, '0.20', 2, TRUE, FALSE, NULL, '2026-03-12T09:23:38.091Z', '2026-03-12T11:25:58.300Z');
INSERT INTO psychological_indicators (id, indicator_id, name, description, min_score, max_score, weight, sort_order, is_active, deleted, deleted_at, created_at, updated_at) VALUES (3, '3', '早上做好计划了吗？', '0=很忙；1=正常；2=很闲；', 0, 2, '0.20', 3, TRUE, FALSE, NULL, '2026-03-12T09:23:38.091Z', '2026-03-12T11:25:58.312Z');
INSERT INTO psychological_indicators (id, indicator_id, name, description, min_score, max_score, weight, sort_order, is_active, deleted, deleted_at, created_at, updated_at) VALUES (4, '4', '早上情绪如何？', '0=很忙；1=正常；2=很闲；', 0, 2, '0.20', 4, TRUE, FALSE, NULL, '2026-03-12T09:23:38.091Z', '2026-03-12T11:25:58.325Z');
INSERT INTO psychological_indicators (id, indicator_id, name, description, min_score, max_score, weight, sort_order, is_active, deleted, deleted_at, created_at, updated_at) VALUES (5, '5', '今天工作量如何？', '0=很忙；1=正常；2=很闲；', 0, 2, '0.20', 5, TRUE, FALSE, NULL, '2026-03-12T09:23:38.091Z', '2026-03-12T11:25:58.337Z');

-- ========================================
-- 表: psychological_test_results
-- ========================================
CREATE TABLE psychological_test_results (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('psychological_test_results_id_seq'::regclass)
    test_date DATE NOT NULL
    scores JSONB NOT NULL
    overall_score NUMERIC NOT NULL
    notes TEXT NULL
    deleted BOOLEAN NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX psychological_test_results_test_date_key ON public.psychological_test_results USING btree (test_date)

CREATE INDEX idx_psychological_test_results_date idx_psychological_test_results_date ON public.psychological_test_results USING btree (test_date)

CREATE INDEX idx_psychological_test_results_deleted idx_psychological_test_results_deleted ON public.psychological_test_results USING btree (deleted)

-- 插入数据到 psychological_test_results
INSERT INTO psychological_test_results (id, test_date, scores, overall_score, notes, deleted, deleted_at, created_at, updated_at) VALUES (1, '2026-03-11T16:00:00.000Z', [object Object], '9.00', '', FALSE, NULL, '2026-03-12T11:06:27.521Z', '2026-03-12T14:31:10.469Z');

-- ========================================
-- 表: psychological_tests_backup
-- ========================================
CREATE TABLE psychological_tests_backup (
    id INTEGER NULL
    test_date DATE NULL
    indicator_id INTEGER NULL
    score INTEGER NULL
    notes TEXT NULL
    created_at TIMESTAMPTZ NULL
    updated_at TIMESTAMPTZ NULL
);

-- ========================================
-- 表: risk_config
-- ========================================
CREATE TABLE risk_config (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('risk_config_id_seq'::regclass)
    total_risk_ratio NUMERIC NOT NULL
    single_trade_risk_ratio NUMERIC NOT NULL
    max_positions INTEGER NOT NULL
    stop_loss_ratio NUMERIC NOT NULL
    take_profit_ratio NUMERIC NOT NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据到 risk_config
INSERT INTO risk_config (id, total_risk_ratio, single_trade_risk_ratio, max_positions, stop_loss_ratio, take_profit_ratio, created_at, updated_at) VALUES (1, '0.0600', '0.0200', 5, '0.0500', '0.1500', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');

-- ========================================
-- 表: risk_models
-- ========================================
CREATE TABLE risk_models (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('risk_models_id_seq'::regclass)
    name VARCHAR(100) NOT NULL
    description TEXT NULL
    max_position_ratio NUMERIC NOT NULL
    max_single_loss_ratio NUMERIC NOT NULL
    max_drawdown_ratio NUMERIC NOT NULL
    is_active BOOLEAN NOT NULL DEFAULT true
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据到 risk_models
INSERT INTO risk_models (id, name, description, max_position_ratio, max_single_loss_ratio, max_drawdown_ratio, is_active, created_at, updated_at) VALUES (1, '保守型', '低风险偏好，注重本金安全', '0.1500', '0.0200', '0.1000', TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO risk_models (id, name, description, max_position_ratio, max_single_loss_ratio, max_drawdown_ratio, is_active, created_at, updated_at) VALUES (2, '稳健型', '中等风险偏好，平衡收益和风险', '0.2500', '0.0300', '0.1500', TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO risk_models (id, name, description, max_position_ratio, max_single_loss_ratio, max_drawdown_ratio, is_active, created_at, updated_at) VALUES (3, '激进型', '高风险偏好，追求高收益', '0.4000', '0.0500', '0.2500', TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');

-- ========================================
-- 表: stock_kline_data
-- ========================================
CREATE TABLE stock_kline_data (
    PRIMARY KEY (id),
    id BIGINT NOT NULL DEFAULT nextval('stock_kline_data_id_seq'::regclass)
    symbol VARCHAR(20) NOT NULL
    date DATE NOT NULL
    period VARCHAR(10) NOT NULL DEFAULT 'daily'::character varying
    open NUMERIC NOT NULL
    close NUMERIC NOT NULL
    high NUMERIC NOT NULL
    low NUMERIC NOT NULL
    volume BIGINT NOT NULL
    amount NUMERIC NOT NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX stock_kline_data_symbol_date_period_key ON public.stock_kline_data USING btree (symbol, date, period)

CREATE INDEX idx_stock_kline_data_symbol_date idx_stock_kline_data_symbol_date ON public.stock_kline_data USING btree (symbol, date)

-- ========================================
-- 表: stock_pool
-- ========================================
CREATE TABLE stock_pool (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('stock_pool_id_seq'::regclass)
    symbol VARCHAR(20) NOT NULL
    name VARCHAR(100) NOT NULL
    market VARCHAR(10) NOT NULL
    exchange VARCHAR(20) NOT NULL
    sector VARCHAR(50) NULL
    current_price NUMERIC NULL
    change_percent NUMERIC NULL
    volume BIGINT NULL
    market_cap NUMERIC NULL
    reason TEXT NULL
    is_watched BOOLEAN NOT NULL DEFAULT true
    added_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX stock_pool_symbol_key ON public.stock_pool USING btree (symbol)

CREATE INDEX idx_stock_pool_symbol idx_stock_pool_symbol ON public.stock_pool USING btree (symbol)

-- 插入数据到 stock_pool
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (1, '000001', '平安银行', 'sz', '深交所', '银行', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (2, '000002', '万科A', 'sz', '深交所', '房地产', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (3, '000333', '美的集团', 'sz', '深交所', '家电', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (4, '000651', '格力电器', 'sz', '深交所', '家电', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (5, '000725', '京东方A', 'sz', '深交所', '电子', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (6, '000858', '五粮液', 'sz', '深交所', '白酒', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (7, '600000', '浦发银行', 'sh', '上交所', '银行', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (8, '600036', '招商银行', 'sh', '上交所', '银行', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (9, '600519', '贵州茅台', 'sh', '上交所', '白酒', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (10, '600900', '长江电力', 'sh', '上交所', '电力', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (11, '601318', '中国平安', 'sh', '上交所', '保险', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (12, '601398', '工商银行', 'sh', '上交所', '银行', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (13, '601857', '中国石油', 'sh', '上交所', '石油', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (14, '601988', '中国银行', 'sh', '上交所', '银行', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (15, '002594', '比亚迪', 'sz', '深交所', '汽车', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (16, '300750', '宁德时代', 'sz', '深交所', '电池', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO stock_pool (id, symbol, name, market, exchange, sector, current_price, change_percent, volume, market_cap, reason, is_watched, added_at, updated_at) VALUES (17, '600030', '中信证券', 'sh', '上交所', '证券', NULL, NULL, NULL, NULL, NULL, TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');

-- ========================================
-- 表: strategy_records
-- ========================================
CREATE TABLE strategy_records (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('strategy_records_id_seq'::regclass)
    strategy_id INTEGER NOT NULL
    symbol VARCHAR(20) NOT NULL
    action VARCHAR(20) NOT NULL
    signal_strength NUMERIC NOT NULL
    execution_price NUMERIC NULL
    execution_quantity INTEGER NULL
    profit NUMERIC NULL
    status VARCHAR(20) NOT NULL DEFAULT 'pending'::character varying
    triggered_at TIMESTAMPTZ NOT NULL
    executed_at TIMESTAMPTZ NULL
    notes TEXT NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strategy_records_strategy_id idx_strategy_records_strategy_id ON public.strategy_records USING btree (strategy_id)

CREATE INDEX idx_strategy_records_symbol idx_strategy_records_symbol ON public.strategy_records USING btree (symbol)

-- ========================================
-- 表: technical_indicators
-- ========================================
CREATE TABLE technical_indicators (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('technical_indicators_id_seq'::regclass)
    name VARCHAR(100) NOT NULL
    category VARCHAR(50) NOT NULL
    description TEXT NULL
    formula TEXT NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX technical_indicators_name_key ON public.technical_indicators USING btree (name)

-- 插入数据到 technical_indicators
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (1, 'MA5', '趋势', '5日简单移动平均线', '过去5日收盘价的平均值', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (2, 'MA10', '趋势', '10日简单移动平均线', '过去10日收盘价的平均值', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (3, 'MA20', '趋势', '20日简单移动平均线', '过去20日收盘价的平均值', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (4, 'MA60', '趋势', '60日简单移动平均线', '过去60日收盘价的平均值', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (5, 'MACD', '趋势', '异同移动平均线', 'DIF = EMA12 - EMA26, DEA = EMA(DIF,9)', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (6, 'RSI', '震荡', '相对强弱指标', '计算一定时期内涨跌幅的比率', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (7, 'KDJ', '震荡', '随机指标', 'K值、D值、J值的组合指标', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (8, 'BOLL', '趋势', '布林线', '中轨±标准差构成上下轨', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (9, 'VOL', '成交量', '成交量', '一定时期内的成交总量', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO technical_indicators (id, name, category, description, formula, created_at, updated_at) VALUES (10, 'ATR', '波动', '平均真实波幅', '衡量价格波动幅度', '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');

-- ========================================
-- 表: trade_records
-- ========================================
CREATE TABLE trade_records (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('trade_records_id_seq'::regclass)
    symbol VARCHAR(20) NOT NULL
    name VARCHAR(100) NULL
    trade_type VARCHAR(20) NOT NULL
    price NUMERIC NOT NULL
    quantity INTEGER NOT NULL
    amount NUMERIC NOT NULL
    fee NUMERIC NOT NULL DEFAULT 0
    profit NUMERIC NULL
    profit_rate NUMERIC NULL
    trade_date TIMESTAMPTZ NOT NULL
    strategy_id INTEGER NULL
    notes TEXT NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trade_records_symbol idx_trade_records_symbol ON public.trade_records USING btree (symbol)

CREATE INDEX idx_trade_records_trade_date idx_trade_records_trade_date ON public.trade_records USING btree (trade_date)

-- ========================================
-- 表: trading_strategies
-- ========================================
CREATE TABLE trading_strategies (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('trading_strategies_id_seq'::regclass)
    name VARCHAR(100) NOT NULL
    type VARCHAR(20) NOT NULL
    description TEXT NULL
    conditions TEXT NOT NULL
    risk_level VARCHAR(20) NOT NULL
    is_active BOOLEAN NOT NULL DEFAULT true
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据到 trading_strategies
INSERT INTO trading_strategies (id, name, type, description, conditions, risk_level, is_active, created_at, updated_at) VALUES (1, '均线突破买入', 'buy', '价格突破均线时买入', '收盘价 > 5日均线 且 成交量放大', 'medium', TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO trading_strategies (id, name, type, description, conditions, risk_level, is_active, created_at, updated_at) VALUES (2, 'MACD金叉买入', 'buy', 'MACD金叉信号买入', 'DIF上穿DEA', 'medium', TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO trading_strategies (id, name, type, description, conditions, risk_level, is_active, created_at, updated_at) VALUES (3, 'RSI超卖买入', 'buy', 'RSI超卖时买入', 'RSI < 30 且出现底背离', 'high', TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO trading_strategies (id, name, type, description, conditions, risk_level, is_active, created_at, updated_at) VALUES (4, '趋势跟随卖出', 'sell', '跌破趋势线卖出', '价格跌破20日均线', 'medium', TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO trading_strategies (id, name, type, description, conditions, risk_level, is_active, created_at, updated_at) VALUES (5, 'RSI超买卖出', 'sell', 'RSI超买卖出', 'RSI > 70 且出现顶背离', 'high', TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');
INSERT INTO trading_strategies (id, name, type, description, conditions, risk_level, is_active, created_at, updated_at) VALUES (6, '止盈止损卖出', 'sell', '达到止盈或止损位卖出', '价格达到预设止盈或止损位', 'low', TRUE, '2026-03-07T14:59:50.097Z', '2026-03-07T14:59:50.097Z');

-- ========================================
-- 表: transactions
-- ========================================
CREATE TABLE transactions (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('transactions_id_seq'::regclass)
    transaction_type VARCHAR(20) NOT NULL
    amount NUMERIC NOT NULL
    balance_after NUMERIC NOT NULL
    description TEXT NULL
    transaction_date TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 迁移完成
-- ========================================