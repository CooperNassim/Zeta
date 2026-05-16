-- 股票技术指标预计算结果表
-- 用于存储预计算的技术指标，避免每次打开图表时重新计算
CREATE TABLE IF NOT EXISTS stock_indicators (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,           -- 股票代码
  trade_date VARCHAR(8) NOT NULL,        -- 交易日期 YYYYMMDD
  period VARCHAR(10) NOT NULL DEFAULT 'D', -- 周期: D=日线, W=周线, M=月线
  
  -- MA 均线
  ma5 NUMERIC(12,4),
  ma10 NUMERIC(12,4),
  ma20 NUMERIC(12,4),
  ma30 NUMERIC(12,4),
  ma60 NUMERIC(12,4),
  
  -- BOLL 布林带
  boll_mid NUMERIC(12,4),
  boll_upper NUMERIC(12,4),
  boll_lower NUMERIC(12,4),
  
  -- MACD
  macd_dif NUMERIC(12,4),
  macd_dea NUMERIC(12,4),
  macd_hist NUMERIC(12,4),
  
  -- RSI
  rsi6 NUMERIC(10,4),
  rsi12 NUMERIC(10,4),
  rsi24 NUMERIC(10,4),
  
  -- KDJ
  kdj_k NUMERIC(10,4),
  kdj_d NUMERIC(10,4),
  kdj_j NUMERIC(10,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, trade_date, period)
);

-- 索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_stock_indicators_symbol_date ON stock_indicators(symbol, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_indicators_period ON stock_indicators(period);

COMMENT ON TABLE stock_indicators IS '股票技术指标预计算结果表';
COMMENT ON COLUMN stock_indicators.period IS '周期: D=日线, W=周线, M=月线';
COMMENT ON COLUMN stock_indicators.ma5 IS 'MA5均线';
COMMENT ON COLUMN stock_indicators.ma10 IS 'MA10均线';
COMMENT ON COLUMN stock_indicators.ma20 IS 'MA20均线';
COMMENT ON COLUMN stock_indicators.ma30 IS 'MA30均线';
COMMENT ON COLUMN stock_indicators.ma60 IS 'MA60均线';
COMMENT ON COLUMN stock_indicators.boll_mid IS '布林带中轨';
COMMENT ON COLUMN stock_indicators.boll_upper IS '布林带上轨';
COMMENT ON COLUMN stock_indicators.boll_lower IS '布林带下轨';
COMMENT ON COLUMN stock_indicators.macd_dif IS 'MACD DIF线';
COMMENT ON COLUMN stock_indicators.macd_dea IS 'MACD DEA线';
COMMENT ON COLUMN stock_indicators.macd_hist IS 'MACD柱状图';
COMMENT ON COLUMN stock_indicators.rsi6 IS 'RSI6';
COMMENT ON COLUMN stock_indicators.rsi12 IS 'RSI12';
COMMENT ON COLUMN stock_indicators.rsi24 IS 'RSI24';
COMMENT ON COLUMN stock_indicators.kdj_k IS 'KDJ K值';
COMMENT ON COLUMN stock_indicators.kdj_d IS 'KDJ D值';
COMMENT ON COLUMN stock_indicators.kdj_j IS 'KDJ J值';

-- 创建更新时间触发器
CREATE TRIGGER update_stock_indicators_updated_at
  BEFORE UPDATE ON stock_indicators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
