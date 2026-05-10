-- 股票日线行情历史表
-- 用于存储每日行情快照，支持后续趋势分析、技术指标计算等
CREATE TABLE IF NOT EXISTS stock_daily (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,          -- 股票代码（不含交易所前缀）
  trade_date VARCHAR(8) NOT NULL,       -- 交易日期 YYYYMMDD
  open_price NUMERIC(12,4),             -- 开盘价
  high_price NUMERIC(12,4),             -- 最高价
  low_price NUMERIC(12,4),              -- 最低价
  close_price NUMERIC(12,4),            -- 收盘价
  pre_close NUMERIC(12,4),              -- 昨收价
  change_amount NUMERIC(12,4),          -- 涨跌额
  change_percent NUMERIC(10,4),         -- 涨跌幅(%)
  volume BIGINT,                        -- 成交量(手)
  amount NUMERIC(20,2),                 -- 成交额(千元)
  created_at TIMESTAMPTZ DEFAULT NOW(), -- 数据入库时间
  updated_at TIMESTAMPTZ DEFAULT NOW(), -- 数据更新时间
  UNIQUE(symbol, trade_date)
);

-- 索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_stock_daily_symbol ON stock_daily(symbol, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_daily_date ON stock_daily(trade_date DESC);

COMMENT ON TABLE stock_daily IS '股票日线行情历史表';
COMMENT ON COLUMN stock_daily.symbol IS '股票代码';
COMMENT ON COLUMN stock_daily.trade_date IS '交易日期 YYYYMMDD';
COMMENT ON COLUMN stock_daily.volume IS '成交量(手)';
COMMENT ON COLUMN stock_daily.amount IS '成交额(千元)';

-- 股票周线行情历史表
CREATE TABLE IF NOT EXISTS stock_weekly (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,          -- 股票代码
  week_date VARCHAR(10) NOT NULL,       -- 周起始日期 YYYY-MM-DD
  open_price NUMERIC(12,4),             -- 周开盘价
  high_price NUMERIC(12,4),             -- 周最高价
  low_price NUMERIC(12,4),              -- 周最低价
  close_price NUMERIC(12,4),            -- 周收盘价
  volume BIGINT,                        -- 周成交量
  amount NUMERIC(20,2),                 -- 周成交额
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, week_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_weekly_symbol ON stock_weekly(symbol, week_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_weekly_date ON stock_weekly(week_date DESC);

COMMENT ON TABLE stock_weekly IS '股票周线行情历史表';
COMMENT ON COLUMN stock_weekly.week_date IS '周起始日期 YYYY-MM-DD';

-- 股票月线行情历史表
CREATE TABLE IF NOT EXISTS stock_monthly (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,          -- 股票代码
  month_date VARCHAR(7) NOT NULL,       -- 月份 YYYY-MM
  open_price NUMERIC(12,4),             -- 月开盘价
  high_price NUMERIC(12,4),             -- 月最高价
  low_price NUMERIC(12,4),              -- 月最低价
  close_price NUMERIC(12,4),            -- 月收盘价
  volume BIGINT,                        -- 月成交量
  amount NUMERIC(20,2),                 -- 月成交额
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, month_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_monthly_symbol ON stock_monthly(symbol, month_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_monthly_date ON stock_monthly(month_date DESC);

COMMENT ON TABLE stock_monthly IS '股票月线行情历史表';
COMMENT ON COLUMN stock_monthly.month_date IS '月份 YYYY-MM';

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为三个历史表添加更新时间触发器
CREATE TRIGGER update_stock_daily_updated_at
  BEFORE UPDATE ON stock_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_weekly_updated_at
  BEFORE UPDATE ON stock_weekly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_monthly_updated_at
  BEFORE UPDATE ON stock_monthly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
