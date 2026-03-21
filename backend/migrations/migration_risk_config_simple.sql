-- ========================================
-- 风险配置表重构 - 只存储必要的配置
-- ========================================

-- 1. 删除旧的 risk_config 表
DROP TABLE IF EXISTS risk_config CASCADE;

-- 2. 创建新的风险配置表
CREATE TABLE risk_config (
    id SERIAL PRIMARY KEY,
    account_type VARCHAR(20) NOT NULL DEFAULT 'real', -- 'real' 实盘 或 'virtual' 模拟
    total_risk_percent NUMERIC(5, 2) NOT NULL DEFAULT 6, -- 账户风险额度（%）
    single_risk_percent NUMERIC(5, 2) NOT NULL DEFAULT 2, -- 单笔风险额度（%）
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_account_type UNIQUE (account_type)
);

-- 3. 创建索引
CREATE INDEX idx_risk_config_account_type ON risk_config (account_type);

-- 4. 创建 updated_at 触发器
CREATE TRIGGER update_risk_config_updated_at
    BEFORE UPDATE ON risk_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 插入默认配置
INSERT INTO risk_config (account_type, total_risk_percent, single_risk_percent)
VALUES
    ('real', 6, 2),
    ('virtual', 6, 2)
ON CONFLICT (account_type) DO NOTHING;

-- 6. 添加表注释
COMMENT ON TABLE risk_config IS '风险配置表 - 只存储账户风险额度和单笔风险额度';
COMMENT ON COLUMN risk_config.id IS '主键';
COMMENT ON COLUMN risk_config.account_type IS '账户类型: real=实盘, virtual=模拟';
COMMENT ON COLUMN risk_config.total_risk_percent IS '账户风险额度（百分比）';
COMMENT ON COLUMN risk_config.single_risk_percent IS '单笔风险额度（百分比）';

-- 7. 验证数据
SELECT '风险配置表创建完成' AS status;
SELECT id, account_type, total_risk_percent, single_risk_percent FROM risk_config;
