-- 交易策略表 _id 字段自动生成触发器
-- 生成时间: 2026-03-06

-- 1. 创建自动生成 _id 的函数
CREATE OR REPLACE FUNCTION generate_trading_strategy_id()
RETURNS TRIGGER AS $$
DECLARE
  next_id INTEGER;
  new_id VARCHAR(20);
BEGIN
  -- 只有当 _id 为 NULL 或空字符串时才自动生成
  IF NEW._id IS NULL OR NEW._id = '' THEN
    -- 获取当前最大 id
    SELECT COALESCE(MAX(id), 0) + 1 INTO next_id
    FROM trading_strategies;

    -- 生成新的 _id (格式: V01.0.0, V02.0.0...)
    new_id := CONCAT('V', LPAD(next_id::TEXT, 2, '0'), '.0.0');
    NEW._id := new_id;

    RAISE NOTICE '自动生成 _id: %', new_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建触发器
DROP TRIGGER IF EXISTS auto_generate_strategy_id ON trading_strategies;
CREATE TRIGGER auto_generate_strategy_id
  BEFORE INSERT ON trading_strategies
  FOR EACH ROW
  EXECUTE FUNCTION generate_trading_strategy_id();

-- 3. 验证触发器
COMMENT ON FUNCTION generate_trading_strategy_id() IS '自动生成交易策略修订版本ID';
COMMENT ON TRIGGER auto_generate_strategy_id ON trading_strategies IS '插入前自动生成唯一_id';
