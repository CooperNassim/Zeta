-- ========================================
-- 数据源配置表 (v1)
-- 用途：存储股票行情数据源配置信息
-- 支持市场：A股、美股、港股
-- ========================================

CREATE TABLE data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    market VARCHAR(20) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    api_url TEXT,
    api_key TEXT,
    api_secret TEXT,
    rate_limit INTEGER NOT NULL DEFAULT 60,
    max_retries INTEGER NOT NULL DEFAULT 3,
    timeout INTEGER NOT NULL DEFAULT 10,
    is_default BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'enabled',
    notes TEXT,
    last_tested_at TIMESTAMPTZ,
    last_test_status VARCHAR(20),
    last_test_latency INTEGER,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX data_sources_market_idx ON data_sources (market);
CREATE INDEX data_sources_provider_idx ON data_sources (provider);
CREATE INDEX data_sources_status_idx ON data_sources (status);
CREATE INDEX data_sources_is_default_idx ON data_sources (is_default);
CREATE INDEX data_sources_created_at_idx ON data_sources (created_at DESC);

-- 触发器
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 表注释
COMMENT ON TABLE data_sources IS '数据源配置表';
COMMENT ON COLUMN data_sources.name IS '数据源名称';
COMMENT ON COLUMN data_sources.market IS '市场类型：A股/美股/港股';
COMMENT ON COLUMN data_sources.provider IS '数据提供商';
COMMENT ON COLUMN data_sources.api_url IS 'API 地址';
COMMENT ON COLUMN data_sources.api_key IS 'API Key（加密存储）';
COMMENT ON COLUMN data_sources.api_secret IS 'API Secret（加密存储）';
COMMENT ON COLUMN data_sources.rate_limit IS '速率限制（次/分钟）';
COMMENT ON COLUMN data_sources.max_retries IS '最大重试次数';
COMMENT ON COLUMN data_sources.timeout IS '超时时间（秒）';
COMMENT ON COLUMN data_sources.is_default IS '是否为默认数据源';
COMMENT ON COLUMN data_sources.status IS '状态：enabled/disabled';
COMMENT ON COLUMN data_sources.last_tested_at IS '最后测试时间';
COMMENT ON COLUMN data_sources.last_test_status IS '最后测试结果';
COMMENT ON COLUMN data_sources.last_test_latency IS '最后测试延迟（ms）';
