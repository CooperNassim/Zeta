-- 交易策略修订版本(_id)字段修复
-- 生成时间: 2026-03-06

-- 1. 确保 _id 字段存在
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trading_strategies' AND column_name = '_id'
  ) THEN
    ALTER TABLE trading_strategies
    ADD COLUMN _id VARCHAR(20) DEFAULT 'V1.0.0';
    RAISE NOTICE '已添加 _id 字段';
  ELSE
    RAISE NOTICE '_id 字段已存在';
  END IF;
END $$;

-- 2. 为现有的空 _id 设置默认值
UPDATE trading_strategies
SET _id = 'V1.0.0'
WHERE _id IS NULL OR _id = '';

-- 3. 为所有记录生成唯一的 _id 值(基于现有数据)
UPDATE trading_strategies
SET _id = CONCAT('V', id, '.', SUBSTRING(MD5(name)::text, 1, 3))
WHERE _id = 'V1.0.0';

-- 4. 添加唯一约束(如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trading_strategies__id_key'
  ) THEN
    ALTER TABLE trading_strategies
    ADD CONSTRAINT trading_strategies__id_key UNIQUE (_id);
    RAISE NOTICE '已添加 _id 唯一约束';
  ELSE
    RAISE NOTICE '_id 唯一约束已存在';
  END IF;
END $$;

-- 5. 创建索引(如果不存在)
CREATE INDEX IF NOT EXISTS idx_trading_strategies__id
ON trading_strategies (_id);

-- 6. 添加注释
COMMENT ON COLUMN trading_strategies._id IS '修订版本ID(格式: V1.0.0)';
