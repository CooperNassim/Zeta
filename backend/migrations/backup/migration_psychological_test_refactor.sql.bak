-- ========================================
-- 心理测试模块数据库重构
-- 参考每日功课的设计模式
-- ========================================

-- 1. 备份现有数据
CREATE TABLE IF NOT EXISTS psychological_tests_backup AS
SELECT * FROM psychological_tests;

-- 2. 删除旧表
DROP TABLE IF EXISTS psychological_tests CASCADE;

-- 3. 创建新的心理测试结果表
CREATE TABLE psychological_test_results (
    id SERIAL PRIMARY KEY,
    test_date DATE NOT NULL,
    scores JSONB NOT NULL,  -- 存储所有指标的分数，格式: {"1": 2, "2": 1, "3": 2, ...}
    overall_score NUMERIC(5, 2) NOT NULL,  -- 综合分数，范围 0-10
    notes TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建唯一索引（每个日期只能有一条测试记录）
CREATE UNIQUE INDEX psychological_test_results_test_date_key ON psychological_test_results (test_date);

-- 创建索引
CREATE INDEX idx_psychological_test_results_date ON psychological_test_results (test_date);
CREATE INDEX idx_psychological_test_results_deleted ON psychological_test_results (deleted);

-- 4. 创建心理测试指标配置表
CREATE TABLE psychological_indicators (
    id SERIAL PRIMARY KEY,
    indicator_id VARCHAR(10) NOT NULL UNIQUE,  -- 前端使用的ID，如 "1", "2", "3"...
    name VARCHAR(200) NOT NULL,
    description TEXT,
    min_score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL DEFAULT 2,
    weight NUMERIC(5, 2) NOT NULL DEFAULT 0.2,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_psychological_indicators_active ON psychological_indicators (is_active);
CREATE INDEX idx_psychological_indicators_deleted ON psychological_indicators (deleted);

-- 5. 插入默认指标数据
INSERT INTO psychological_indicators (indicator_id, name, description, min_score, max_score, weight, sort_order) VALUES
('1', '今天身体感觉怎么样？', '0=感觉生病了；1=感觉正常；2=感觉好极了；', 0, 2, 0.2, 1),
('2', '昨天交易如何？', '0=亏损；1=没有交易；2=盈利；', 0, 2, 0.2, 2),
('3', '早上做好计划了吗？', '0=没做；1=无仓位；2=准备得很好；', 0, 2, 0.2, 3),
('4', '早上情绪如何？', '0=低落；1=正常；2=棒极了；', 0, 2, 0.2, 4),
('5', '今天工作量如何？', '0=很忙；1=正常；2=很闲；', 0, 2, 0.2, 5);

-- 6. 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_psychological_test_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_psychological_test_results_updated_at
    BEFORE UPDATE ON psychological_test_results
    FOR EACH ROW
    EXECUTE FUNCTION update_psychological_test_results_updated_at();

CREATE OR REPLACE FUNCTION update_psychological_indicators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_psychological_indicators_updated_at
    BEFORE UPDATE ON psychological_indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_psychological_indicators_updated_at();

-- 7. 创建视图：查询有效的测试结果
CREATE OR REPLACE VIEW v_psychological_test_results_active AS
SELECT
    id,
    test_date,
    scores,
    overall_score,
    notes,
    created_at,
    updated_at
FROM psychological_test_results
WHERE deleted = FALSE
ORDER BY test_date DESC;

-- 8. 创建视图：查询活跃的指标
CREATE OR REPLACE VIEW v_psychological_indicators_active AS
SELECT
    id,
    indicator_id,
    name,
    description,
    min_score,
    max_score,
    weight,
    sort_order,
    created_at,
    updated_at
FROM psychological_indicators
WHERE is_active = TRUE AND deleted = FALSE
ORDER BY sort_order ASC;

-- 9. 添加注释
COMMENT ON TABLE psychological_test_results IS '心理测试结果表，存储每天的测试结果';
COMMENT ON COLUMN psychological_test_results.scores IS 'JSON格式存储各指标的分数';
COMMENT ON COLUMN psychological_test_results.overall_score IS '综合评分，范围0-10';
COMMENT ON TABLE psychological_indicators IS '心理测试指标配置表';
COMMENT ON COLUMN psychological_indicators.weight IS '指标权重，用于计算综合评分';

-- 完成
SELECT '心理测试模块数据库重构完成' AS status;
