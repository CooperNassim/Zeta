-- Zeta Trading System 数据库迁移脚本
-- 生成时间: 2026-05-03T17:31:54.593Z

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS account_risk_data CASCADE;
DROP TABLE IF EXISTS daily_work_data CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS psychological_indicators CASCADE;
DROP TABLE IF EXISTS psychological_test_indicators CASCADE;
DROP TABLE IF EXISTS psychological_test_results CASCADE;
DROP TABLE IF EXISTS risk_config CASCADE;
DROP TABLE IF EXISTS risk_models CASCADE;
DROP TABLE IF EXISTS scheduled_orders CASCADE;
DROP TABLE IF EXISTS stock_kline_data CASCADE;
DROP TABLE IF EXISTS stock_pool CASCADE;
DROP TABLE IF EXISTS strategy_records CASCADE;
DROP TABLE IF EXISTS technical_indicators CASCADE;
DROP TABLE IF EXISTS trade_orders CASCADE;
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
INSERT INTO account (id, total_balance, available_balance, frozen_balance, total_profit, total_profit_rate, today_profit, today_profit_rate, total_orders, winning_orders, created_at, updated_at) VALUES (1, '100000', '100000', '0', '0', '0', '0', '0', 0, 0, '2026-05-02T04:11:34.586Z', '2026-05-02T04:11:34.586Z');

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

CREATE INDEX daily_work_data_date_idx daily_work_data_date_idx ON public.daily_work_data USING btree (date)

CREATE INDEX daily_work_data_created_at_idx daily_work_data_created_at_idx ON public.daily_work_data USING btree (created_at DESC)

-- 插入数据到 daily_work_data
INSERT INTO daily_work_data (id, date, nasdaq, ftse, dax, n225, hsi, bitcoin, eurusd, usdjpy, usdcny, oil, gold, bond, consecutive, a50, sh_index, sh_2day_power, sh_13day_power, up_count, limit_up, down_count, limit_down, volume, sentiment, prediction, trade_status, review_plan, review_execution, review_result, deleted, deleted_at, created_at, updated_at) VALUES (1, '2026-04-30T16:00:00.000Z', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '过热', '看涨', '积极地', NULL, NULL, NULL, FALSE, NULL, '2026-05-03T13:28:36.052Z', '2026-05-03T13:28:36.052Z');
INSERT INTO daily_work_data (id, date, nasdaq, ftse, dax, n225, hsi, bitcoin, eurusd, usdjpy, usdcny, oil, gold, bond, consecutive, a50, sh_index, sh_2day_power, sh_13day_power, up_count, limit_up, down_count, limit_down, volume, sentiment, prediction, trade_status, review_plan, review_execution, review_result, deleted, deleted_at, created_at, updated_at) VALUES (2, '2026-04-30T16:00:00.000Z', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '微热', '看涨', '积极地', NULL, NULL, NULL, FALSE, NULL, '2026-05-03T15:30:14.287Z', '2026-05-03T15:30:14.287Z');
INSERT INTO daily_work_data (id, date, nasdaq, ftse, dax, n225, hsi, bitcoin, eurusd, usdjpy, usdcny, oil, gold, bond, consecutive, a50, sh_index, sh_2day_power, sh_13day_power, up_count, limit_up, down_count, limit_down, volume, sentiment, prediction, trade_status, review_plan, review_execution, review_result, deleted, deleted_at, created_at, updated_at) VALUES (3, '2026-05-01T16:00:00.000Z', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '过冷', '看涨', '积极地', NULL, NULL, NULL, FALSE, NULL, '2026-05-03T16:06:03.590Z', '2026-05-03T16:06:03.590Z');

-- ========================================
-- 表: orders
-- ========================================
CREATE TABLE orders (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('orders_id_seq'::regclass)
    order_type VARCHAR(20) NOT NULL
    symbol VARCHAR(50) NOT NULL
    price NUMERIC NOT NULL
    quantity NUMERIC NOT NULL
    order_date DATE NOT NULL
    order_time VARCHAR(8) NOT NULL
    status VARCHAR(20) NOT NULL DEFAULT 'pending'::character varying
    reason TEXT NULL
    notes TEXT NULL
    account_name VARCHAR(50) NULL
    account_type VARCHAR(20) NULL
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX orders_date_idx orders_date_idx ON public.orders USING btree (order_date DESC)

CREATE INDEX orders_symbol_idx orders_symbol_idx ON public.orders USING btree (symbol)

CREATE INDEX orders_status_idx orders_status_idx ON public.orders USING btree (status)

CREATE INDEX orders_account_name_idx orders_account_name_idx ON public.orders USING btree (account_name)

-- ========================================
-- 表: psychological_indicators
-- ========================================
CREATE TABLE psychological_indicators (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('psychological_indicators_id_seq'::regclass)
    indicator_name VARCHAR(100) NOT NULL
    description TEXT NULL
    scoring_method VARCHAR(50) NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    min_score INTEGER NULL DEFAULT 0
    max_score INTEGER NULL DEFAULT 100
    weight NUMERIC NULL DEFAULT 0.2
    status VARCHAR(20) NULL DEFAULT 'active'::character varying
    deleted BOOLEAN NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    indicator_id VARCHAR(10) NULL
    sort_order INTEGER NULL DEFAULT 0
    is_active BOOLEAN NULL DEFAULT true
);

-- 插入数据到 psychological_indicators
INSERT INTO psychological_indicators (id, indicator_name, description, scoring_method, created_at, updated_at, min_score, max_score, weight, status, deleted, deleted_at, indicator_id, sort_order, is_active) VALUES (1, '今天身体感觉怎么样？', '1', '1-10分', '2026-05-02T04:11:34.586Z', '2026-05-02T15:42:08.530Z', 0, 2, '1.00', 'active', FALSE, NULL, NULL, 0, TRUE);
INSERT INTO psychological_indicators (id, indicator_name, description, scoring_method, created_at, updated_at, min_score, max_score, weight, status, deleted, deleted_at, indicator_id, sort_order, is_active) VALUES (2, '今天情绪状态怎么样？', '2', '1-10分', '2026-05-02T04:11:34.586Z', '2026-05-02T15:42:08.533Z', 0, 2, '1.00', 'active', FALSE, NULL, NULL, 0, TRUE);
INSERT INTO psychological_indicators (id, indicator_name, description, scoring_method, created_at, updated_at, min_score, max_score, weight, status, deleted, deleted_at, indicator_id, sort_order, is_active) VALUES (3, '今天精力怎么样？', '3', '1-10分', '2026-05-02T04:11:34.586Z', '2026-05-02T15:42:08.534Z', 0, 2, '1.00', 'active', FALSE, NULL, NULL, 0, TRUE);
INSERT INTO psychological_indicators (id, indicator_name, description, scoring_method, created_at, updated_at, min_score, max_score, weight, status, deleted, deleted_at, indicator_id, sort_order, is_active) VALUES (4, '今天睡眠质量怎么样？', '4', '1-10分', '2026-05-02T04:11:34.586Z', '2026-05-02T15:42:08.535Z', 0, 2, '1.00', 'active', FALSE, NULL, NULL, 0, TRUE);
INSERT INTO psychological_indicators (id, indicator_name, description, scoring_method, created_at, updated_at, min_score, max_score, weight, status, deleted, deleted_at, indicator_id, sort_order, is_active) VALUES (5, '今天整体状态怎么样？', '5', '1-10分', '2026-05-02T04:11:34.586Z', '2026-05-02T15:42:08.536Z', 0, 2, '1.00', 'active', FALSE, NULL, NULL, 0, TRUE);

-- ========================================
-- 表: psychological_test_indicators
-- ========================================
CREATE TABLE psychological_test_indicators (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('psychological_test_indicators_id_seq'::regclass)
    test_id INTEGER NOT NULL
    indicator_id INTEGER NOT NULL
    score NUMERIC NOT NULL
    notes TEXT NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 表: psychological_test_results
-- ========================================
CREATE TABLE psychological_test_results (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('psychological_test_results_id_seq'::regclass)
    user_id INTEGER NOT NULL
    test_date DATE NOT NULL
    indicators JSON NOT NULL
    total_score NUMERIC NOT NULL
    notes TEXT NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX psychological_test_results_test_date_key ON public.psychological_test_results USING btree (test_date)

CREATE INDEX psych_results_user_idx psych_results_user_idx ON public.psychological_test_results USING btree (user_id)

CREATE INDEX psych_results_date_idx psych_results_date_idx ON public.psychological_test_results USING btree (test_date DESC)

-- 插入数据到 psychological_test_results
INSERT INTO psychological_test_results (id, user_id, test_date, indicators, total_score, notes, created_at, updated_at) VALUES (1, 1, '2026-05-01T16:00:00.000Z', [object Object], '9', NULL, '2026-05-02T15:45:58.062Z', '2026-05-02T15:46:19.506Z');
INSERT INTO psychological_test_results (id, user_id, test_date, indicators, total_score, notes, created_at, updated_at) VALUES (2, 1, '2026-05-02T16:00:00.000Z', [object Object], '9', NULL, '2026-05-03T02:26:21.175Z', '2026-05-03T15:21:56.924Z');
INSERT INTO psychological_test_results (id, user_id, test_date, indicators, total_score, notes, created_at, updated_at) VALUES (7, 1, '2026-05-03T16:00:00.000Z', [object Object], '9', NULL, '2026-05-03T16:06:09.129Z', '2026-05-03T16:06:09.129Z');

-- ========================================
-- 表: risk_config
-- ========================================
CREATE TABLE risk_config (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('risk_config_id_seq'::regclass)
    config_name VARCHAR(100) NOT NULL
    max_position_size NUMERIC NOT NULL
    max_daily_loss NUMERIC NOT NULL
    max_drawdown NUMERIC NOT NULL
    stop_loss_rate NUMERIC NOT NULL
    take_profit_rate NUMERIC NOT NULL
    notes TEXT NULL
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据到 risk_config
INSERT INTO risk_config (id, config_name, max_position_size, max_daily_loss, max_drawdown, stop_loss_rate, take_profit_rate, notes, deleted, deleted_at, created_at, updated_at) VALUES (1, '默认配置', '30', '5', '20', '3', '10', NULL, FALSE, NULL, '2026-05-02T04:11:34.586Z', '2026-05-02T04:11:34.586Z');

-- ========================================
-- 表: risk_models
-- ========================================
CREATE TABLE risk_models (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('risk_models_id_seq'::regclass)
    model_name VARCHAR(100) NOT NULL
    model_type VARCHAR(50) NOT NULL
    parameters TEXT NOT NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 表: scheduled_orders
-- ========================================
CREATE TABLE scheduled_orders (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('scheduled_orders_id_seq'::regclass)
    symbol VARCHAR(50) NOT NULL
    order_type VARCHAR(20) NOT NULL
    price NUMERIC NOT NULL
    quantity NUMERIC NOT NULL
    trigger_price NUMERIC NULL
    trigger_type VARCHAR(20) NOT NULL DEFAULT 'price'::character varying
    scheduled_date DATE NOT NULL
    scheduled_time VARCHAR(8) NOT NULL
    status VARCHAR(20) NOT NULL DEFAULT 'pending'::character varying
    notes TEXT NULL
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX scheduled_orders_date_idx scheduled_orders_date_idx ON public.scheduled_orders USING btree (scheduled_date)

CREATE INDEX scheduled_orders_status_idx scheduled_orders_status_idx ON public.scheduled_orders USING btree (status)

-- ========================================
-- 表: stock_kline_data
-- ========================================
CREATE TABLE stock_kline_data (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('stock_kline_data_id_seq'::regclass)
    symbol VARCHAR(50) NOT NULL
    date DATE NOT NULL
    open_price NUMERIC NOT NULL
    high_price NUMERIC NOT NULL
    low_price NUMERIC NOT NULL
    close_price NUMERIC NOT NULL
    volume NUMERIC NOT NULL
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX kline_symbol_date_idx kline_symbol_date_idx ON public.stock_kline_data USING btree (symbol, date)

-- ========================================
-- 表: stock_pool
-- ========================================
CREATE TABLE stock_pool (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('stock_pool_id_seq'::regclass)
    symbol VARCHAR(50) NOT NULL
    name VARCHAR(200) NOT NULL
    sector VARCHAR(100) NULL
    market VARCHAR(20) NOT NULL
    status VARCHAR(20) NOT NULL DEFAULT 'watching'::character varying
    buy_price NUMERIC NULL
    sell_price NUMERIC NULL
    notes TEXT NULL
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX stock_pool_symbol_idx stock_pool_symbol_idx ON public.stock_pool USING btree (symbol)

CREATE INDEX stock_pool_status_idx stock_pool_status_idx ON public.stock_pool USING btree (status)

CREATE INDEX stock_pool_sector_idx stock_pool_sector_idx ON public.stock_pool USING btree (sector)

-- ========================================
-- 表: strategy_records
-- ========================================
CREATE TABLE strategy_records (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('strategy_records_id_seq'::regclass)
    strategy_id INTEGER NOT NULL
    order_id INTEGER NOT NULL
    eval_score_1 VARCHAR(20) NULL
    eval_score_2 VARCHAR(20) NULL
    eval_score_3 VARCHAR(20) NULL
    eval_score_4 VARCHAR(20) NULL
    eval_score_5 VARCHAR(20) NULL
    total_score NUMERIC NULL
    notes TEXT NULL
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX strategy_records_strategy_idx strategy_records_strategy_idx ON public.strategy_records USING btree (strategy_id)

CREATE INDEX strategy_records_order_idx strategy_records_order_idx ON public.strategy_records USING btree (order_id)

CREATE INDEX strategy_records_created_idx strategy_records_created_idx ON public.strategy_records USING btree (created_at DESC)

-- ========================================
-- 表: technical_indicators
-- ========================================
CREATE TABLE technical_indicators (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('technical_indicators_id_seq'::regclass)
    symbol VARCHAR(50) NOT NULL
    indicator_type VARCHAR(20) NOT NULL
    value NUMERIC NOT NULL
    indicator_date DATE NOT NULL
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX tech_indicators_symbol_idx tech_indicators_symbol_idx ON public.technical_indicators USING btree (symbol)

CREATE INDEX tech_indicators_type_idx tech_indicators_type_idx ON public.technical_indicators USING btree (indicator_type)

CREATE INDEX tech_indicators_date_idx tech_indicators_date_idx ON public.technical_indicators USING btree (indicator_date DESC)

-- ========================================
-- 表: trade_orders
-- ========================================
CREATE TABLE trade_orders (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('trade_orders_id_seq'::regclass)
    trade_number VARCHAR(50) NOT NULL
    stock_code VARCHAR(20) NOT NULL
    stock_name VARCHAR(100) NOT NULL
    direction VARCHAR(10) NOT NULL
    order_type VARCHAR(50) NULL
    price NUMERIC NULL
    quantity INTEGER NOT NULL
    status VARCHAR(20) NULL DEFAULT 'pending'::character varying
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    deleted BOOLEAN NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    stop_loss_price NUMERIC NULL DEFAULT NULL::numeric
    take_profit_price NUMERIC NULL DEFAULT NULL::numeric
    psychological_score NUMERIC NULL DEFAULT NULL::numeric
    strategy_score NUMERIC NULL DEFAULT NULL::numeric
    strategy_id INTEGER NULL
    risk_score NUMERIC NULL DEFAULT NULL::numeric
    overall_score NUMERIC NULL DEFAULT NULL::numeric
    buy_order_id INTEGER NULL
    buy_order_price NUMERIC NULL DEFAULT NULL::numeric
);

-- 插入数据到 trade_orders
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (1, '20260503001', '1', '1', 'buy', '买入', '4.00', 1000, 'executed', '2026-05-03T02:44:56.202Z', '2026-05-03T02:44:56.202Z', TRUE, '2026-05-03T13:29:12.423Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (2, '20260503002', '测试', '测试', 'buy', '买入', '6.00', 600, 'executed', '2026-05-03T13:29:32.708Z', '2026-05-03T13:29:32.708Z', TRUE, '2026-05-03T13:33:57.889Z', '5.00', '7.00', '7.00', '10.00', 1, '10.00', '9.10', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (3, '20260503003', '测试', '测试', 'buy', '买入', '5.00', 800, 'executed', '2026-05-03T13:34:11.203Z', '2026-05-03T13:34:11.203Z', TRUE, '2026-05-03T13:40:17.024Z', '4.00', '6.00', '7.00', '10.00', 1, '10.00', '9.10', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (4, '20260503004', '测试', '测试', 'buy', '买入', '5.00', 800, 'executed', '2026-05-03T13:40:30.045Z', '2026-05-03T13:40:30.045Z', TRUE, '2026-05-03T13:43:08.848Z', '4.00', '6.00', '7.00', '10.00', 1, '10.00', '9.10', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (5, '20260503005', '测试', '测试', 'buy', '买入', '5.00', 800, 'executed', '2026-05-03T13:43:27.634Z', '2026-05-03T13:43:27.634Z', TRUE, '2026-05-03T13:45:16.261Z', '4.00', '6.00', '7.00', '10.00', 1, '10.00', '9.10', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (6, '20260503006', '测试', '测试', 'buy', '买入', '6.00', 600, 'executed', '2026-05-03T13:45:29.763Z', '2026-05-03T13:45:29.763Z', TRUE, '2026-05-03T13:46:49.098Z', '5.00', '5.00', '7.00', '10.00', 1, '10.00', '9.10', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (7, '20260503006', '测试', '测试', 'sell', '卖出', '5.00', 300, 'executed', '2026-05-03T13:45:52.544Z', '2026-05-03T13:45:52.544Z', TRUE, '2026-05-03T14:01:44.744Z', NULL, NULL, '7.00', '10.00', 5, '10.00', '9.10', 6, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (8, '20260503006', '测试', '测试', 'sell', '卖出', '6.00', 300, 'executed', '2026-05-03T13:46:29.553Z', '2026-05-03T13:46:29.553Z', TRUE, '2026-05-03T14:01:44.744Z', NULL, NULL, '7.00', '10.00', 5, '10.00', '9.10', 6, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (9, '20260503001', 'ces', 'ces', 'buy', '买入', '5.00', 4200, 'executed', '2026-05-03T14:51:44.904Z', '2026-05-03T14:51:44.904Z', TRUE, '2026-05-03T14:56:47.175Z', '5.00', '5.00', '10.00', '10.00', 1, '10.00', '10.00', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (10, '20260503007', '55', '55', 'buy', '买入', '5.00', 4200, 'executed', '2026-05-03T14:57:13.080Z', '2026-05-03T14:57:13.080Z', TRUE, '2026-05-03T14:58:20.937Z', '5.00', '5.00', '10.00', '9.00', 1, '10.00', '9.60', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (11, '20260503007', '55', '55', 'sell', '卖出', '5.00', 2300, 'executed', '2026-05-03T14:57:35.381Z', '2026-05-03T14:57:35.381Z', TRUE, '2026-05-03T14:58:40.517Z', NULL, NULL, '10.00', '10.00', 4, '10.00', '10.00', 10, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (12, '20260503007', '55', '55', 'sell', '卖出', '6.00', 1900, 'executed', '2026-05-03T14:57:58.412Z', '2026-05-03T14:57:58.412Z', TRUE, '2026-05-03T14:58:50.554Z', NULL, NULL, '10.00', '10.00', 5, '10.00', '10.00', 10, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (14, '20260503008', '222', '222', 'sell', '卖出', '55.00', 100, 'executed', '2026-05-03T14:59:29.710Z', '2026-05-03T14:59:29.710Z', TRUE, '2026-05-03T14:59:49.892Z', NULL, NULL, '10.00', '10.00', 5, '10.00', '10.00', 13, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (13, '20260503008', '222', '222', 'buy', '买入', '22.00', 100, 'executed', '2026-05-03T14:59:19.379Z', '2026-05-03T14:59:19.379Z', TRUE, '2026-05-03T14:59:55.166Z', '2.00', '22.00', '10.00', '10.00', 1, '10.00', '10.00', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (15, '20260504009', 'aa ', 'a a', 'buy', '买入', '5.00', 4200, 'executed', '2026-05-03T16:06:35.650Z', '2026-05-03T16:06:35.650Z', FALSE, NULL, '4.00', '5.00', '9.00', '10.00', 1, '10.00', '9.70', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (16, '20260504009', 'aa ', 'a a', 'sell', '卖出', '4.00', 4200, 'executed', '2026-05-03T16:06:50.132Z', '2026-05-03T16:06:50.132Z', FALSE, NULL, NULL, NULL, '9.00', '10.00', 5, '10.00', '9.70', 15, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (17, '20260504010', '十大大苏打', '十大大苏打', 'buy', '买入', '5.00', 4200, 'executed', '2026-05-03T16:21:18.451Z', '2026-05-03T16:21:18.451Z', FALSE, NULL, '4.00', '5.00', '9.00', '10.00', 1, '10.00', '9.70', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (18, '20260504011', '啊实打实打算', '啊实打实大苏打', 'buy', '买入', '67.00', 300, 'executed', '2026-05-03T16:21:35.996Z', '2026-05-03T16:21:35.996Z', FALSE, NULL, '55.00', '7.00', '9.00', '10.00', 2, '10.00', '9.70', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (19, '20260504012', '啊撒啊', '啊撒啊', 'buy', '买入', '55.00', 300, 'executed', '2026-05-03T16:21:57.778Z', '2026-05-03T16:21:57.778Z', FALSE, NULL, '44.00', '677.00', '9.00', '10.00', 2, '10.00', '9.70', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (20, '20260504013', '亏损测试', '亏损测试', 'buy', '买入', '5.00', 4200, 'executed', '2026-05-03T16:22:19.516Z', '2026-05-03T16:22:19.516Z', FALSE, NULL, '4.00', '67.00', '9.00', '10.00', 2, '10.00', '9.70', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (21, '20260504014', '亏损测试2', '亏损测试2', 'buy', '买入', '76.00', 200, 'executed', '2026-05-03T16:22:37.931Z', '2026-05-03T16:22:37.931Z', FALSE, NULL, '55.00', '77.00', '9.00', '10.00', 1, '10.00', '9.70', NULL, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (22, '20260504013', '亏损测试', '亏损测试', 'sell', '卖出', '4.00', 4200, 'executed', '2026-05-03T16:23:25.699Z', '2026-05-03T16:23:25.699Z', FALSE, NULL, NULL, NULL, '9.00', '10.00', 4, '10.00', '9.70', 20, NULL);
INSERT INTO trade_orders (id, trade_number, stock_code, stock_name, direction, order_type, price, quantity, status, created_at, updated_at, deleted, deleted_at, stop_loss_price, take_profit_price, psychological_score, strategy_score, strategy_id, risk_score, overall_score, buy_order_id, buy_order_price) VALUES (23, '20260504014', '亏损测试2', '亏损测试2', 'sell', '卖出', '70.00', 200, 'executed', '2026-05-03T16:23:45.002Z', '2026-05-03T16:23:45.002Z', FALSE, NULL, NULL, NULL, '9.00', '10.00', 5, '10.00', '9.70', 21, NULL);

-- ========================================
-- 表: trade_records
-- ========================================
CREATE TABLE trade_records (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('trade_records_id_seq'::regclass)
    order_id INTEGER NULL
    symbol VARCHAR(50) NOT NULL
    entry_price NUMERIC NOT NULL
    exit_price NUMERIC NULL
    entry_date DATE NOT NULL
    exit_date DATE NULL
    quantity NUMERIC NOT NULL
    profit NUMERIC NULL
    profit_rate NUMERIC NULL
    holding_days INTEGER NULL
    notes TEXT NULL
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    trade_number VARCHAR(50) NULL
    buy_order_id INTEGER NULL
    sell_order_ids TEXT NULL
    stock_name VARCHAR(100) NULL
    name VARCHAR(200) NULL
    buy_price NUMERIC NULL
    buy_quantity NUMERIC NULL
    buy_time TIMESTAMPTZ NULL
    buy_order_price NUMERIC NULL
    buy_amount NUMERIC NULL
    sell_price NUMERIC NULL
    sell_quantity NUMERIC NULL
    sell_time TIMESTAMPTZ NULL
    sell_order_price NUMERIC NULL
    sell_amount NUMERIC NULL
);

CREATE INDEX trade_records_order_idx trade_records_order_idx ON public.trade_records USING btree (order_id)

CREATE INDEX trade_records_symbol_idx trade_records_symbol_idx ON public.trade_records USING btree (symbol)

CREATE INDEX trade_records_date_idx trade_records_date_idx ON public.trade_records USING btree (entry_date DESC)

-- 插入数据到 trade_records
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (4, NULL, 'ces', '5', NULL, '2026-05-02T16:00:00.000Z', NULL, '4200', NULL, NULL, NULL, NULL, TRUE, '2026-05-03T14:56:47.162Z', '2026-05-03T14:51:44.997Z', '2026-05-03T14:56:47.162Z', '20260503001', 9, NULL, 'ces', 'ces', '5', '4200', '2026-05-03T14:51:44.915Z', '5', '21000', NULL, NULL, NULL, NULL, NULL);
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (5, NULL, '55', '5', NULL, '2026-05-02T16:00:00.000Z', NULL, '4200', NULL, NULL, NULL, NULL, TRUE, '2026-05-03T14:58:50.553Z', '2026-05-03T14:57:13.096Z', '2026-05-03T14:58:50.553Z', '20260503007', 10, '11,12', '55', '55', '5', '4200', '2026-05-03T14:57:13.091Z', '5', '21000', '5.622950819672131', '6100', '2026-05-03T14:57:58.419Z', '5.622950819672131', '34300');
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (6, NULL, '222', '22', NULL, '2026-05-02T16:00:00.000Z', NULL, '100', NULL, NULL, NULL, NULL, TRUE, '2026-05-03T14:59:55.102Z', '2026-05-03T14:59:19.396Z', '2026-05-03T14:59:55.102Z', '20260503008', 13, '14', '222', '222', '22', '100', '2026-05-03T14:59:19.391Z', '22', '2200', '55', '200', '2026-05-03T14:59:29.721Z', '55', '11000');
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (3, NULL, '测试', '6', NULL, '2026-05-02T16:00:00.000Z', NULL, '600', NULL, NULL, NULL, NULL, TRUE, '2026-05-03T15:33:30.206Z', '2026-05-03T13:45:29.945Z', '2026-05-03T15:33:30.206Z', '20260503006', 6, '7,8', '测试', '测试', '6', '600', '2026-05-03T13:45:29.772Z', '6', '3600', '5.666666666666667', '900', '2026-05-03T13:46:29.561Z', '5.666666666666667', '5100');
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (7, NULL, 'aa ', '5', NULL, '2026-05-02T16:00:00.000Z', NULL, '4200', NULL, NULL, NULL, NULL, FALSE, NULL, '2026-05-03T16:06:35.666Z', '2026-05-03T16:06:50.150Z', '20260504009', 15, '16', 'a a', 'a a', '5', '4200', '2026-05-03T16:06:35.661Z', '5', '21000', '4', '8400', '2026-05-03T16:06:50.142Z', '4', '33600');
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (8, NULL, '十大大苏打', '5', NULL, '2026-05-02T16:00:00.000Z', NULL, '4200', NULL, NULL, NULL, NULL, FALSE, NULL, '2026-05-03T16:21:18.535Z', '2026-05-03T16:21:18.535Z', '20260504010', 17, NULL, '十大大苏打', '十大大苏打', '5', '4200', '2026-05-03T16:21:18.468Z', '5', '21000', NULL, NULL, NULL, NULL, NULL);
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (9, NULL, '啊实打实打算', '67', NULL, '2026-05-02T16:00:00.000Z', NULL, '300', NULL, NULL, NULL, NULL, FALSE, NULL, '2026-05-03T16:21:36.010Z', '2026-05-03T16:21:36.010Z', '20260504011', 18, NULL, '啊实打实大苏打', '啊实打实大苏打', '67', '300', '2026-05-03T16:21:36.005Z', '67', '20100', NULL, NULL, NULL, NULL, NULL);
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (10, NULL, '啊撒啊', '55', NULL, '2026-05-02T16:00:00.000Z', NULL, '300', NULL, NULL, NULL, NULL, FALSE, NULL, '2026-05-03T16:21:57.794Z', '2026-05-03T16:21:57.794Z', '20260504012', 19, NULL, '啊撒啊', '啊撒啊', '55', '300', '2026-05-03T16:21:57.788Z', '55', '16500', NULL, NULL, NULL, NULL, NULL);
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (11, NULL, '亏损测试', '5', NULL, '2026-05-02T16:00:00.000Z', NULL, '4200', NULL, NULL, NULL, NULL, FALSE, NULL, '2026-05-03T16:22:19.532Z', '2026-05-03T16:23:25.713Z', '20260504013', 20, '22', '亏损测试', '亏损测试', '5', '4200', '2026-05-03T16:22:19.526Z', '5', '21000', '4', '8400', '2026-05-03T16:23:25.708Z', '4', '33600');
INSERT INTO trade_records (id, order_id, symbol, entry_price, exit_price, entry_date, exit_date, quantity, profit, profit_rate, holding_days, notes, deleted, deleted_at, created_at, updated_at, trade_number, buy_order_id, sell_order_ids, stock_name, name, buy_price, buy_quantity, buy_time, buy_order_price, buy_amount, sell_price, sell_quantity, sell_time, sell_order_price, sell_amount) VALUES (12, NULL, '亏损测试2', '76', NULL, '2026-05-02T16:00:00.000Z', NULL, '200', NULL, NULL, NULL, NULL, FALSE, NULL, '2026-05-03T16:22:37.945Z', '2026-05-03T16:23:45.021Z', '20260504014', 21, '23', '亏损测试2', '亏损测试2', '76', '200', '2026-05-03T16:22:37.940Z', '76', '15200', '70', '400', '2026-05-03T16:23:45.015Z', '70', '28000');

-- ========================================
-- 表: trading_strategies
-- ========================================
CREATE TABLE trading_strategies (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('trading_strategies_id_seq'::regclass)
    strategy_type VARCHAR(20) NOT NULL
    name VARCHAR(200) NOT NULL
    eval_standard_1 TEXT NULL
    eval_standard_2 TEXT NULL
    eval_standard_3 TEXT NULL
    eval_standard_4 TEXT NULL
    eval_standard_5 TEXT NULL
    status VARCHAR(20) NOT NULL DEFAULT '启用'::character varying
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    revision_version VARCHAR(50) NULL
    creator VARCHAR(100) NULL
);

CREATE INDEX idx_trading_strategies_type idx_trading_strategies_type ON public.trading_strategies USING btree (strategy_type)

CREATE INDEX idx_trading_strategies_status idx_trading_strategies_status ON public.trading_strategies USING btree (status)

CREATE INDEX idx_trading_strategies_deleted idx_trading_strategies_deleted ON public.trading_strategies USING btree (deleted)

CREATE INDEX idx_trading_strategies_created idx_trading_strategies_created ON public.trading_strategies USING btree (created_at DESC)

-- 插入数据到 trading_strategies
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (8, 'test', '????2', NULL, NULL, NULL, NULL, NULL, 'active', TRUE, '2026-05-02T16:22:20.889Z', '2026-05-02T16:15:04.946Z', '2026-05-02T16:22:20.889Z', NULL, NULL);
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (1, '买入', '趋势突破策略', '指标：0=突破阻力位；1=放量确认；2=回踩不破；', '指标：0=MACD金叉；1=RSI强势；2=KDJ超买；', '指标：0=均线多头；1=趋势向上；2=量价配合；', '指标：0=情绪指数高；1=资金流入；2=北向资金增；', '指标：0=盈亏比>2；1=止损<3%；2=仓位<30%；', '启用', FALSE, NULL, '2026-05-02T04:11:34.586Z', '2026-05-02T16:39:23.335Z', 'V1.0.0', NULL);
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (6, '卖出', '风险控制策略', '指标：0=风险过高；1=仓位过大；2=波动剧烈；', '指标：0=系统性风险；1=黑天鹅事件；2=政策利空；', '指标：0=技术破位；1=支撑失效；2=反弹无力；', '指标：0=市场恐慌；1=流动性危机；2=全面下跌；', '指标：0=保护本金；1.降低仓位；2.空仓观望；', '停用', FALSE, NULL, '2026-05-02T04:11:34.586Z', '2026-05-02T16:39:27.223Z', 'V1.0.0', NULL);
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (5, '卖出', '止损策略', '指标：0=跌破止损位；1=放量破位；2=反抽无力；', '指标：0=MACD死叉；1=RSI弱势；2=KDJ高位；', '指标：0=均线空头；1=趋势破坏；2=量能放大；', '指标：0=情绪恐慌；1=恐慌性抛售；2=外资大幅流出；', '指标：0=亏损控制；1=止损线触发；2=坚决止损；', '启用', FALSE, NULL, '2026-05-02T04:11:34.586Z', '2026-05-02T16:39:31.391Z', 'V1.0.0', NULL);
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (4, '卖出', '止盈策略', '指标：0=盈利达标；1=加速上涨；2=量能放大；', '指标：0=MACD顶背离；1=RSI>70；2=KDJ死叉；', '指标：0=跌破均线；1=趋势转弱；2=量能萎缩；', '指标：0=情绪过热；1=获利盘涌出；2=北向资金流出；', '指标：0=收益锁定；1=止盈线触发；2=分批止盈；', '启用', FALSE, NULL, '2026-05-02T04:11:34.586Z', '2026-05-02T16:40:04.999Z', 'V1.0.0', NULL);
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (3, '买入', '低吸策略', '指标：0=超跌反弹；1=底部信号；2=技术背离；', '指标：0=MACD绿柱缩短；1=RSI<30；2=KDJ低位；', '指标：0=长期均线支撑；1=下跌趋势减缓；2=成交量极低；', '指标：0=极度恐慌；1=机构抄底；2=外资大单；', '指标：0=盈亏比>4；1=止损<2%；2=仓位<20%；', '停用', FALSE, NULL, '2026-05-02T04:11:34.586Z', '2026-05-02T16:40:09.424Z', 'V1.0.0', NULL);
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (2, '买入', '回调买入策略', '指标：0=回踩支撑位；1=企稳迹象；2=缩量调整；', '指标：0=MACD底背离；1=RSI超卖；2=KDJ金叉；', '指标：0=均线支撑；1=趋势未破；2=量能萎缩；', '指标：0=恐慌情绪；1=抄底资金；2=北向资金入场；', '指标：0=盈亏比>3；1=止损<2%；2=仓位<40%；', '启用', FALSE, NULL, '2026-05-02T04:11:34.586Z', '2026-05-02T16:40:12.437Z', 'V1.0.0', NULL);
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (10, '买入', '1', '1', '1', '1', '1', '1', '启用', TRUE, '2026-05-03T09:04:17.292Z', '2026-05-02T16:38:18.545Z', '2026-05-03T09:04:17.292Z', 'V1.0.0', '系统');
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (11, '卖出', '2', '1', '1', '1', '1', '1', '启用', TRUE, '2026-05-03T09:04:17.292Z', '2026-05-02T16:38:36.937Z', '2026-05-03T09:04:17.292Z', 'V1.0.1', '系统');
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (12, '买入', '4', '4', '4', '4', '4', '4', '启用', TRUE, '2026-05-03T09:04:17.292Z', '2026-05-02T16:40:21.674Z', '2026-05-03T09:04:17.292Z', 'V1.0.0', '系统');
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (13, '卖出', '5', '7', '5', '56', '56', '56', '启用', TRUE, '2026-05-03T09:04:17.292Z', '2026-05-03T09:03:57.639Z', '2026-05-03T09:04:17.292Z', 'V1.0.0', '系统');
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (14, '买入', '1', '1', '1', '1', '1', '1', '启用', TRUE, '2026-05-03T13:29:03.874Z', '2026-05-03T13:28:58.123Z', '2026-05-03T13:29:03.874Z', 'V1.0.0', '系统');
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (15, '买入', '1', '1', '1', '1', '1', '1', '启用', TRUE, '2026-05-03T15:32:03.155Z', '2026-05-03T14:50:34.489Z', '2026-05-03T15:32:03.155Z', 'V1.0.0', '系统');
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (16, '买入', '1', '1', '1', '1', '1', '1', '启用', TRUE, '2026-05-03T15:32:03.155Z', '2026-05-03T15:30:26.127Z', '2026-05-03T15:32:03.155Z', 'V1.0.0', '系统');
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status, deleted, deleted_at, created_at, updated_at, revision_version, creator) VALUES (9, '测试类型', '测试策略', '标准1', '标准2', '标准3', '标准4', '标准5', '启用', TRUE, '2026-05-03T15:32:06.140Z', '2026-05-02T16:23:32.984Z', '2026-05-03T15:32:06.140Z', 'V1.0.0', NULL);

-- ========================================
-- 表: transactions
-- ========================================
CREATE TABLE transactions (
    PRIMARY KEY (id),
    id INTEGER NOT NULL DEFAULT nextval('transactions_id_seq'::regclass)
    order_id INTEGER NULL
    transaction_type VARCHAR(10) NOT NULL
    symbol VARCHAR(50) NOT NULL
    price NUMERIC NOT NULL
    quantity NUMERIC NOT NULL
    total_price NUMERIC NOT NULL
    transaction_date DATE NOT NULL
    transaction_time VARCHAR(8) NOT NULL
    fee NUMERIC NOT NULL DEFAULT 0
    profit NUMERIC NULL
    account_name VARCHAR(50) NULL
    account_type VARCHAR(20) NOT NULL DEFAULT 'realtime'::character varying
    deleted BOOLEAN NOT NULL DEFAULT false
    deleted_at TIMESTAMPTZ NULL
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    trade_number VARCHAR(50) NULL
    name VARCHAR(200) NULL
);

CREATE INDEX transactions_order_id_idx transactions_order_id_idx ON public.transactions USING btree (order_id)

CREATE INDEX transactions_date_idx transactions_date_idx ON public.transactions USING btree (transaction_date DESC)

CREATE INDEX transactions_symbol_idx transactions_symbol_idx ON public.transactions USING btree (symbol)

CREATE INDEX transactions_account_name_idx transactions_account_name_idx ON public.transactions USING btree (account_name)

CREATE INDEX transactions_account_type_idx transactions_account_type_idx ON public.transactions USING btree (account_type)

-- 插入数据到 transactions
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (3, NULL, '股票买入', '测试', '5', '800', '-4000', '2026-05-02T16:00:00.000Z', '21:40:30', '0', NULL, NULL, 'real', TRUE, '2026-05-03T13:43:08.785Z', '2026-05-03T13:40:30.126Z', '2026-05-03T13:43:08.785Z', '20260503004', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (4, NULL, '股票买入', '测试', '5', '800', '-4000', '2026-05-02T16:00:00.000Z', '21:43:27', '0', NULL, NULL, 'real', TRUE, '2026-05-03T13:45:16.201Z', '2026-05-03T13:43:27.644Z', '2026-05-03T13:45:16.201Z', '20260503005', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (5, NULL, '股票买入', '测试', '6', '600', '-3600', '2026-05-02T16:00:00.000Z', '21:45:29', '0', NULL, NULL, 'real', TRUE, '2026-05-03T13:46:49.097Z', '2026-05-03T13:45:29.773Z', '2026-05-03T13:46:49.097Z', '20260503006', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (6, NULL, '股票卖出', '测试', '5', '300', '1500', '2026-05-02T16:00:00.000Z', '21:45:52', '0', NULL, NULL, 'real', TRUE, '2026-05-03T14:01:44.743Z', '2026-05-03T13:45:52.556Z', '2026-05-03T14:01:44.743Z', '20260503006', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (7, NULL, '股票卖出', '测试', '6', '300', '1800', '2026-05-02T16:00:00.000Z', '21:46:29', '0', NULL, NULL, 'real', TRUE, '2026-05-03T14:01:44.743Z', '2026-05-03T13:46:29.561Z', '2026-05-03T14:01:44.743Z', '20260503006', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (8, NULL, '股票买入', 'ces', '5', '4200', '-21000', '2026-05-02T16:00:00.000Z', '22:51:44', '0', NULL, NULL, 'real', TRUE, '2026-05-03T14:56:47.096Z', '2026-05-03T14:51:44.986Z', '2026-05-03T14:56:47.096Z', '20260503001', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (9, NULL, '股票买入', '55', '5', '4200', '-21000', '2026-05-02T16:00:00.000Z', '22:57:13', '0', NULL, NULL, 'real', TRUE, '2026-05-03T14:58:20.872Z', '2026-05-03T14:57:13.091Z', '2026-05-03T14:58:20.872Z', '20260503007', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (10, NULL, '股票卖出', '55', '5', '2300', '11500', '2026-05-02T16:00:00.000Z', '22:57:35', '0', NULL, NULL, 'real', TRUE, '2026-05-03T14:58:40.516Z', '2026-05-03T14:57:35.391Z', '2026-05-03T14:58:40.516Z', '20260503007', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (11, NULL, '股票卖出', '55', '6', '1900', '11400', '2026-05-02T16:00:00.000Z', '22:57:58', '0', NULL, NULL, 'real', TRUE, '2026-05-03T14:58:40.516Z', '2026-05-03T14:57:58.420Z', '2026-05-03T14:58:40.516Z', '20260503007', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (13, NULL, '股票卖出', '222', '55', '100', '5500', '2026-05-02T16:00:00.000Z', '22:59:29', '0', NULL, NULL, 'real', TRUE, '2026-05-03T14:59:49.830Z', '2026-05-03T14:59:29.721Z', '2026-05-03T14:59:49.830Z', '20260503008', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (12, NULL, '股票买入', '222', '22', '100', '-2200', '2026-05-02T16:00:00.000Z', '22:59:19', '0', NULL, NULL, 'real', TRUE, '2026-05-03T14:59:55.101Z', '2026-05-03T14:59:19.390Z', '2026-05-03T14:59:55.101Z', '20260503008', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (14, NULL, '股票买入', 'aa ', '5', '4200', '-21000', '2026-05-02T16:00:00.000Z', '00:06:35', '0', NULL, NULL, 'real', FALSE, NULL, '2026-05-03T16:06:35.661Z', '2026-05-03T16:06:35.661Z', '20260504009', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (15, NULL, '股票卖出', 'aa ', '4', '4200', '16800', '2026-05-02T16:00:00.000Z', '00:06:50', '0', NULL, NULL, 'real', FALSE, NULL, '2026-05-03T16:06:50.142Z', '2026-05-03T16:06:50.142Z', '20260504009', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (16, NULL, '股票买入', '十大大苏打', '5', '4200', '-21000', '2026-05-02T16:00:00.000Z', '00:21:18', '0', NULL, NULL, 'real', FALSE, NULL, '2026-05-03T16:21:18.468Z', '2026-05-03T16:21:18.468Z', '20260504010', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (17, NULL, '股票买入', '啊实打实打算', '67', '300', '-20100', '2026-05-02T16:00:00.000Z', '00:21:36', '0', NULL, NULL, 'real', FALSE, NULL, '2026-05-03T16:21:36.006Z', '2026-05-03T16:21:36.006Z', '20260504011', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (18, NULL, '股票买入', '啊撒啊', '55', '300', '-16500', '2026-05-02T16:00:00.000Z', '00:21:57', '0', NULL, NULL, 'real', FALSE, NULL, '2026-05-03T16:21:57.787Z', '2026-05-03T16:21:57.787Z', '20260504012', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (19, NULL, '股票买入', '亏损测试', '5', '4200', '-21000', '2026-05-02T16:00:00.000Z', '00:22:19', '0', NULL, NULL, 'real', FALSE, NULL, '2026-05-03T16:22:19.526Z', '2026-05-03T16:22:19.526Z', '20260504013', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (20, NULL, '股票买入', '亏损测试2', '76', '200', '-15200', '2026-05-02T16:00:00.000Z', '00:22:37', '0', NULL, NULL, 'real', FALSE, NULL, '2026-05-03T16:22:37.941Z', '2026-05-03T16:22:37.941Z', '20260504014', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (21, NULL, '股票卖出', '亏损测试', '4', '4200', '16800', '2026-05-02T16:00:00.000Z', '00:23:25', '0', NULL, NULL, 'real', FALSE, NULL, '2026-05-03T16:23:25.708Z', '2026-05-03T16:23:25.708Z', '20260504013', NULL);
INSERT INTO transactions (id, order_id, transaction_type, symbol, price, quantity, total_price, transaction_date, transaction_time, fee, profit, account_name, account_type, deleted, deleted_at, created_at, updated_at, trade_number, name) VALUES (22, NULL, '股票卖出', '亏损测试2', '70', '200', '14000', '2026-05-02T16:00:00.000Z', '00:23:45', '0', NULL, NULL, 'real', FALSE, NULL, '2026-05-03T16:23:45.014Z', '2026-05-03T16:23:45.014Z', '20260504014', NULL);

-- ========================================
-- 迁移完成
-- ========================================