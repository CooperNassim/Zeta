-- ========================================
-- 心理测试模块重构 - 彻底解决时区问题
-- 参考 daily_work_data 的时区处理方式
-- ========================================

-- 1. 备份现有数据
CREATE TABLE IF NOT EXISTS psychological_test_results_backup AS
SELECT * FROM psychological_test_results;

-- 2. 删除旧表
DROP TABLE IF EXISTS psychological_test_indicators CASCADE;
DROP TABLE IF EXISTS psychological_test_results CASCADE;
DROP TABLE IF EXISTS psychological_indicators CASCADE;

-- 3. 创建心理测试结果表（参考 daily_work_data 的时区规范）
CREATE TABLE psychological_test_results (
    id SERIAL PRIMARY KEY,
    test_date DATE NOT NULL,  -- 使用 DATE 类型，不带时区
    scores JSON NOT NULL,       -- 存储所有指标的分数 {indicatorId: score}
    total_score NUMERIC NOT NULL DEFAULT 0,  -- 总分
    overall_score NUMERIC,      -- 综合评分 (0-10)
    notes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. 创建索引
CREATE INDEX psych_results_date_idx ON psychological_test_results (test_date DESC);
CREATE INDEX psych_results_created_idx ON psychological_test_results (created_at DESC);
CREATE INDEX psych_results_deleted_idx ON psychological_test_results (deleted);

-- 5. 创建心理指标表
CREATE TABLE psychological_indicators (
    id SERIAL PRIMARY KEY,
    indicator_name VARCHAR(100) NOT NULL,
    description TEXT,
    min_score NUMERIC NOT NULL DEFAULT 0,
    max_score NUMERIC NOT NULL DEFAULT 10,
    weight NUMERIC NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. 创建索引
CREATE INDEX psych_indicators_status_idx ON psychological_indicators (status);
CREATE INDEX psych_indicators_deleted_idx ON psychological_indicators (deleted);

-- 7. 插入默认心理指标
INSERT INTO psychological_indicators (id, indicator_name, description, min_score, max_score, weight, status) VALUES
(1, '心态稳定性', '评估投资者在面对市场波动时的心理稳定性', 0, 10, 1.0, 'active'),
(2, '风险承受能力', '评估投资者对风险的承受意愿和能力', 0, 10, 1.0, 'active'),
(3, '决策果断性', '评估投资决策的果断程度和执行力', 0, 10, 1.0, 'active'),
(4, '情绪控制力', '评估投资者情绪对交易决策的影响程度', 0, 10, 1.0, 'active'),
(5, '纪律性', '评估投资者遵守交易纪律的情况', 0, 10, 1.0, 'active');

-- 8. 添加表注释
COMMENT ON TABLE psychological_test_results IS '心理测试结果表 - 使用 DATE 类型存储日期，避免时区问题';
COMMENT ON COLUMN psychological_test_results.test_date IS '测试日期（DATE类型，无时区）';
COMMENT ON COLUMN psychological_test_results.scores IS '各指标分数 JSON: {1: 5, 2: 7, ...}';
COMMENT ON COLUMN psychological_test_results.total_score IS '总分';
COMMENT ON COLUMN psychological_test_results.overall_score IS '综合评分 (0-10分制)';
COMMENT ON TABLE psychological_indicators IS '心理指标配置表';
COMMENT ON COLUMN psychological_indicators.min_score IS '最小分数';
COMMENT ON COLUMN psychological_indicators.max_score IS '最大分数';
COMMENT ON COLUMN psychological_indicators.weight IS '权重';

-- 9. 创建 updated_at 触发器
CREATE TRIGGER update_psychological_test_results_updated_at 
    BEFORE UPDATE ON psychological_test_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psychological_indicators_updated_at 
    BEFORE UPDATE ON psychological_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. 恢复备份的数据（如果需要）
-- 注意：需要根据实际情况调整数据映射
INSERT INTO psychological_test_results (test_date, scores, total_score, overall_score, notes, deleted, created_at)
SELECT 
    test_date::DATE,  -- 确保转换为 DATE 类型
    COALESCE(indicators, '{}'::JSON)::JSON as scores,
    COALESCE(total_score, 0),
    NULL as overall_score,
    notes,
    COALESCE(deleted, false),
    created_at
FROM psychological_test_results_backup
WHERE test_date IS NOT NULL;

-- 11. 验证数据
SELECT 
    '心理测试结果' as table_name,
    COUNT(*) as record_count
FROM psychological_test_results
UNION ALL
SELECT 
    '心理指标' as table_name,
    COUNT(*) as record_count
FROM psychological_indicators;

SELECT '心理测试表重构完成 - 已使用 DATE 类型解决时区问题' AS status;
