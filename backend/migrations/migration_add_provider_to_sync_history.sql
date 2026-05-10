ALTER TABLE data_sync_history ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
;
COMMENT ON COLUMN data_sync_history.provider IS '数据提供商：tushare/akshare/eastmoney/yahoo/polygon/longport';
