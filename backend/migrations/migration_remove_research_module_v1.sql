-- ========================================
-- 删除研究院模块相关表 (v1)
-- 用途：清理股票行情、技术指标、回测系统等研究院功能的数据表
-- 删除表：stock_pool, stock_kline_data, technical_indicators, 
--         backtest_configs, backtest_results, backtest_optimizations,
--         stock_indicators, stock_daily, stock_weekly, stock_monthly
-- ========================================

-- 删除回测相关表（有外键依赖，需要先删除子表）
DROP TABLE IF EXISTS backtest_optimizations CASCADE;
DROP TABLE IF EXISTS backtest_results CASCADE;
DROP TABLE IF EXISTS backtest_configs CASCADE;

-- 删除股票池和K线数据表
DROP TABLE IF EXISTS stock_pool CASCADE;
DROP TABLE IF EXISTS stock_kline_data CASCADE;

-- 删除技术指标表
DROP TABLE IF EXISTS technical_indicators CASCADE;
DROP TABLE IF EXISTS stock_indicators CASCADE;

-- 删除行情历史表
DROP TABLE IF EXISTS stock_daily CASCADE;
DROP TABLE IF EXISTS stock_weekly CASCADE;
DROP TABLE IF EXISTS stock_monthly CASCADE;
