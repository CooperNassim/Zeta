-- 为 account_risk_data 表清理旧字段并添加风险模型相关字段

-- 删除旧的风险指标字段
ALTER TABLE account_risk_data DROP COLUMN IF EXISTS net_assets;
ALTER TABLE account_risk_data DROP COLUMN IF EXISTS max_assets;
ALTER TABLE account_risk_data DROP COLUMN IF EXISTS current_drawdown;
ALTER TABLE account_risk_data DROP COLUMN IF EXISTS max_drawdown;
ALTER TABLE account_risk_data DROP COLUMN IF EXISTS daily_return;
ALTER TABLE account_risk_data DROP COLUMN IF EXISTS volatility;
ALTER TABLE account_risk_data DROP COLUMN IF EXISTS sharpe_ratio;

-- 添加风险模型关键字段
ALTER TABLE account_risk_data 
ADD COLUMN start_month_total NUMERIC(15,2) NULL,
ADD COLUMN account_available NUMERIC(15,2) NULL,
ADD COLUMN single_available NUMERIC(15,2) NULL,
ADD COLUMN used_risk_percentage NUMERIC(5,2) NULL,
ADD COLUMN used_risk_amount NUMERIC(15,2) NULL,
ADD COLUMN monthly_loss NUMERIC(15,2) NULL,
ADD COLUMN holding_occupancy NUMERIC(15,2) NULL,
ADD COLUMN snapshot_date DATE NULL;

COMMENT ON COLUMN account_risk_data.start_month_total IS '月初账户';
COMMENT ON COLUMN account_risk_data.account_available IS '账户可用';
COMMENT ON COLUMN account_risk_data.single_available IS '单笔可用';
COMMENT ON COLUMN account_risk_data.used_risk_percentage IS '已用比例';
COMMENT ON COLUMN account_risk_data.used_risk_amount IS '已用额度';
COMMENT ON COLUMN account_risk_data.monthly_loss IS '本月亏损';
COMMENT ON COLUMN account_risk_data.holding_occupancy IS '持仓风险';
COMMENT ON COLUMN account_risk_data.snapshot_date IS '快照日期，用于月初数据保留';

-- 创建索引优化查询性能
CREATE INDEX idx_account_risk_data_snapshot_date ON account_risk_data(snapshot_date);