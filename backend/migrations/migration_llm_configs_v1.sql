-- ========================================
-- 大模型配置表 (v1)
-- 用途：存储大语言模型 API 配置信息
-- 支持模型：OpenAI GPT、Anthropic Claude、通义千问、智谱清言、Kimi 等
-- ========================================

CREATE TABLE llm_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    max_tokens INTEGER NOT NULL DEFAULT 4096,
    temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.7,
    top_p NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    frequency_penalty NUMERIC(3, 2) NOT NULL DEFAULT 0,
    presence_penalty NUMERIC(3, 2) NOT NULL DEFAULT 0,
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
CREATE INDEX llm_configs_category_idx ON llm_configs (category);
CREATE INDEX llm_configs_provider_idx ON llm_configs (provider);
CREATE INDEX llm_configs_status_idx ON llm_configs (status);
CREATE INDEX llm_configs_is_default_idx ON llm_configs (is_default);
CREATE INDEX llm_configs_model_id_idx ON llm_configs (model_id);
CREATE INDEX llm_configs_created_at_idx ON llm_configs (created_at DESC);

-- 触发器
CREATE TRIGGER update_llm_configs_updated_at BEFORE UPDATE ON llm_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 表注释
COMMENT ON TABLE llm_configs IS '大模型配置表';
COMMENT ON COLUMN llm_configs.name IS '模型名称';
COMMENT ON COLUMN llm_configs.category IS '模型分类：OpenAI/Anthropic/国内大模型/其他';
COMMENT ON COLUMN llm_configs.provider IS '模型提供商';
COMMENT ON COLUMN llm_configs.model_id IS '模型 ID';
COMMENT ON COLUMN llm_configs.api_url IS 'API 地址';
COMMENT ON COLUMN llm_configs.api_key IS 'API Key（加密存储）';
COMMENT ON COLUMN llm_configs.max_tokens IS '最大输出 Token 数';
COMMENT ON COLUMN llm_configs.temperature IS '温度参数（0-2）';
COMMENT ON COLUMN llm_configs.top_p IS 'Top P 参数（0-1）';
COMMENT ON COLUMN llm_configs.frequency_penalty IS '频率惩罚参数（-2 到 2）';
COMMENT ON COLUMN llm_configs.presence_penalty IS '存在惩罚参数（-2 到 2）';
COMMENT ON COLUMN llm_configs.is_default IS '是否为默认大模型';
COMMENT ON COLUMN llm_configs.status IS '状态：enabled/disabled';
COMMENT ON COLUMN llm_configs.last_tested_at IS '最后测试时间';
COMMENT ON COLUMN llm_configs.last_test_status IS '最后测试结果';
COMMENT ON COLUMN llm_configs.last_test_latency IS '最后测试延迟（ms）';
