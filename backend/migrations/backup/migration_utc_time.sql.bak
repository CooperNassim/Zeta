-- ========================================
-- 统一心理测试时间为 UTC 时间格式
-- ========================================

-- 1. 修改 test_date 为 TIMESTAMPTZ 类型
ALTER TABLE psychological_test_results
  ALTER COLUMN test_date TYPE TIMESTAMPTZ USING test_date::TIMESTAMPTZ;

-- 2. 确保现有数据是 UTC 时间（将本地日期转为 UTC 零点时间）
UPDATE psychological_test_results
SET test_date = (test_date::TEXT || 'T00:00:00Z')::TIMESTAMPTZ
WHERE test_date::TEXT NOT LIKE '%T%';

-- 3. 添加注释说明使用 UTC 时间
COMMENT ON COLUMN psychological_test_results.test_date IS '测试日期（UTC时间）';

-- 4. 修改 daily_work_data 的 date 字段为 TIMESTAMPTZ
ALTER TABLE daily_work_data
  ALTER COLUMN date TYPE TIMESTAMPTZ USING date::TIMESTAMPTZ;

UPDATE daily_work_data
SET date = (date::TEXT || 'T00:00:00Z')::TIMESTAMPTZ
WHERE date::TEXT NOT LIKE '%T%';

COMMENT ON COLUMN daily_work_data.date IS '日期（UTC时间）';

SELECT 'UTC时间格式迁移完成' AS status;
