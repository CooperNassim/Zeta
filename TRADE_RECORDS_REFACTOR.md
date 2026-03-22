# 交易记录表数据库重构方案

## 概述

按照 `daily_work_data` 表的数据库表结构规范，完全重构 `trade_records` 表，确保数据库结构与前端字段完全一致。

## 重构目标

1. **统一表结构规范**: 与 `daily_work_data` 表保持完全一致的规范
2. **完整字段映射**: 包含所有前端使用的42个字段
3. **数据类型标准化**: 使用 SERIAL、TIMESTAMPTZ、JSON 等标准类型
4. **数据完整性**: 添加必要的索引、约束和触发器
5. **字段注释完善**: 为所有字段添加详细注释

## 字段对比

### 前端字段 (camelCase) → 数据库字段 (snake_case)

| 前端字段 | 数据库字段 | 类型 | 约束 | 说明 |
|---------|-----------|------|------|------|
| id | id | SERIAL | PRIMARY KEY | 主键ID（自增） |
| tradeNumber | trade_number | VARCHAR(20) | NOT NULL | 交易编号 |
| tradeType | trade_type | VARCHAR(10) | CHECK | 交易类型（买入/卖出） |
| symbol | symbol | VARCHAR(50) | NOT NULL | 股票代码 |
| name | name | VARCHAR(200) | NOT NULL | 股票名称 |
| buyOrderId | buy_order_id | VARCHAR(50) | | 买入订单ID |
| sellOrderId | sell_order_id | VARCHAR(50) | | 卖出订单ID |
| buyPrice | buy_price | NUMERIC(20,4) | | 买入价格 |
| buyQuantity | buy_quantity | NUMERIC(20,4) | | 买入数量 |
| buyTime | buy_time | TIMESTAMPTZ | | 买入时间 |
| buyOrderPrice | buy_order_price | NUMERIC(20,4) | | 买入订单价格 |
| buyOrderTime | buy_order_time | TIMESTAMPTZ | | 买入订单时间 |
| buyPsychologicalScore | buy_psychological_score | NUMERIC(5,2) | CHECK: 0-10 | 买入心理评分 |
| buyStrategyScore | buy_strategy_score | NUMERIC(5,2) | CHECK: 0-100 | 买入策略评分 |
| buyStrategyId | buy_strategy_id | INTEGER | | 买入策略ID |
| sellPrice | sell_price | NUMERIC(20,4) | | 卖出价格 |
| sellQuantity | sell_quantity | NUMERIC(20,4) | | 卖出数量 |
| sellTime | sell_time | TIMESTAMPTZ | | 卖出时间 |
| sellOrderPrice | sell_order_price | NUMERIC(20,4) | | 卖出订单价格 |
| sellOrderTime | sell_order_time | TIMESTAMPTZ | | 卖出订单时间 |
| sellPsychologicalScore | sell_psychological_score | NUMERIC(5,2) | CHECK: 0-10 | 卖出心理评分 |
| sellStrategyScore | sell_strategy_score | NUMERIC(5,2) | CHECK: 0-100 | 卖出策略评分 |
| sellStrategyId | sell_strategy_id | INTEGER | | 卖出策略ID |
| buyAmount | buy_amount | NUMERIC(20,2) | | 买入金额 |
| sellAmount | sell_amount | NUMERIC(20,2) | | 卖出金额 |
| profit | profit | NUMERIC(20,2) | | 盈亏金额 |
| profitPercent | profit_percent | NUMERIC(10,4) | | 盈亏比例（%） |
| holdDuration | hold_duration | INTEGER | CHECK: >=0 | 持有天数 |
| buyGrade | buy_grade | VARCHAR(10) | CHECK: A/B/C/D | 买入评级 |
| sellGrade | sell_grade | VARCHAR(10) | CHECK: A/B/C/D | 卖出评级 |
| overallScore | overall_score | NUMERIC(5,2) | CHECK: 0-100 | 综合评分 |
| buyChannel | buy_channel | JSON | | 买入通道数据 |
| sellChannel | sell_channel | JSON | | 卖出通道数据 |
| tradeSummary | trade_summary | TEXT | | 交易总结 |
| tradeCommission | trade_commission | NUMERIC(20,2) | | 买入交易佣金 |
| sellTradeCommission | sell_trade_commission | NUMERIC(20,2) | | 卖出交易佣金 |
| otherFees | other_fees | NUMERIC(20,2) | | 买入其他费用 |
| sellOtherFees | sell_other_fees | NUMERIC(20,2) | | 卖出其他费用 |
| fees | fees | NUMERIC(20,2) | | 总手续费 |
| slippage | slippage | NUMERIC(20,2) | | 滑点 |
| netProfit | net_profit | NUMERIC(20,2) | | 净盈亏 |
| netProfitPercent | net_profit_percent | NUMERIC(10,4) | | 净盈亏比例（%） |
| slippageNetProfitRatio | slippage_net_profit_ratio | NUMERIC(10,4) | | 滑净盈比 |
| deleted | deleted | BOOLEAN | DEFAULT false | 软删除标记 |
| deletedAt | deleted_at | TIMESTAMPTZ | | 删除时间 |
| createdAt | created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updatedAt | updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

## 规范对比（与 daily_work_data）

| 规范项 | daily_work_data | trade_records（重构后） |
|--------|----------------|----------------------|
| 主键类型 | SERIAL | ✅ SERIAL |
| 时间类型 | TIMESTAMPTZ | ✅ TIMESTAMPTZ |
| 软删除 | deleted, deleted_at | ✅ deleted, deleted_at |
| 索引 | date, deleted, sentiment, trade_status | ✅ trade_number, symbol, deleted, buy_time, sell_time, buy_grade, sell_grade |
| 触发器 | updated_at | ✅ updated_at |
| CHECK约束 | sentiment, prediction, trade_status | ✅ trade_type, buy_grade, sell_grade, scores, hold_duration |
| 字段注释 | ✅ 完整注释 | ✅ 完整注释 |

## 索引设计

```sql
-- 主键索引（自动创建）
PRIMARY KEY (id)

-- 业务索引
CREATE INDEX idx_trade_records_id ON trade_records (id);
CREATE INDEX idx_trade_records_trade_number ON trade_records (trade_number);
CREATE INDEX idx_trade_records_symbol ON trade_records (symbol);
CREATE INDEX idx_trade_records_trade_type ON trade_records (trade_type);
CREATE INDEX idx_trade_records_buy_time ON trade_records (buy_time DESC);
CREATE INDEX idx_trade_records_sell_time ON trade_records (sell_time DESC);
CREATE INDEX idx_trade_records_deleted ON trade_records (deleted);
CREATE INDEX idx_trade_records_created_at ON trade_records (created_at DESC);
CREATE INDEX idx_trade_records_buy_grade ON trade_records (buy_grade);
CREATE INDEX idx_trade_records_sell_grade ON trade_records (sell_grade);
```

## CHECK 约束

```sql
-- 交易类型约束
CHECK (trade_type IN ('买入', '卖出'))

-- 买入评级约束
CHECK (buy_grade IS NULL OR buy_grade IN ('A', 'B', 'C', 'D'))

-- 卖出评级约束
CHECK (sell_grade IS NULL OR sell_grade IN ('A', 'B', 'C', 'D'))

-- 买入心理评分约束（0-10）
CHECK (buy_psychological_score IS NULL OR (buy_psychological_score >= 0 AND buy_psychological_score <= 10))

-- 卖出心理评分约束（0-10）
CHECK (sell_psychological_score IS NULL OR (sell_psychological_score >= 0 AND sell_psychological_score <= 10))

-- 买入策略评分约束（0-100）
CHECK (buy_strategy_score IS NULL OR (buy_strategy_score >= 0 AND buy_strategy_score <= 100))

-- 卖出策略评分约束（0-100）
CHECK (sell_strategy_score IS NULL OR (sell_strategy_score >= 0 AND sell_strategy_score <= 100))

-- 综合评分约束（0-100）
CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100))

-- 持有天数约束（不能为负数）
CHECK (hold_duration IS NULL OR hold_duration >= 0)
```

## 触发器

```sql
-- 自动更新 updated_at 字段
CREATE TRIGGER update_trade_records_updated_at
    BEFORE UPDATE ON trade_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## JSON 字段说明

### buy_channel 和 sell_channel

这两个字段使用 JSON 类型存储通道数据，结构如下：

```json
{
  "high": 1682.50,           // 最高点
  "low": 1617.50,            // 最低点
  "upperBand": 1702.00,      // 通道上轨
  "lowerBand": 1598.00,      // 通道下轨
  "type": "bollinger"        // 通道类型（如 bollinger、donchian 等）
}
```

## 使用示例

### 1. 执行迁移脚本

```bash
cd backend
psql -U postgres -d zeta_trading -f migrations/migration_trade_records_complete.sql
```

### 2. 验证表结构

```sql
-- 查看表结构
\d trade_records

-- 查看约束
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'trade_records'::regclass;

-- 查看索引
SELECT indexname FROM pg_indexes WHERE tablename = 'trade_records';

-- 查看触发器
SELECT tgname FROM pg_trigger WHERE tgrelid = 'trade_records'::regclass;
```

### 3. 插入示例数据

```sql
INSERT INTO trade_records (
    trade_number, trade_type, symbol, name,
    buy_price, buy_quantity, buy_time,
    buy_amount, buy_grade, overall_score,
    buy_channel, trade_commission, other_fees
) VALUES (
    '20240215001', '买入', '600519', '贵州茅台',
    1650.00, 100, '2024-02-15T09:30:00.000Z',
    165000.00, 'A', 85.5,
    '{"high": 1682.50, "low": 1617.50, "upperBand": 1702.00, "lowerBand": 1598.00, "type": "bollinger"}'::json,
    50.00, 10.00
);
```

### 4. 查询示例

```sql
-- 查询所有买入记录
SELECT * FROM trade_records
WHERE trade_type = '买入' AND deleted = false
ORDER BY buy_time DESC;

-- 查询特定股票的交易记录
SELECT * FROM trade_records
WHERE symbol = '600519' AND deleted = false
ORDER BY buy_time DESC;

-- 查询买入评级为A的记录
SELECT * FROM trade_records
WHERE buy_grade = 'A' AND deleted = false
ORDER BY buy_time DESC;

-- 统计盈亏
SELECT
    symbol,
    name,
    SUM(profit) as total_profit,
    AVG(profit_percent) as avg_profit_percent,
    COUNT(*) as trade_count
FROM trade_records
WHERE trade_type = '卖出' AND deleted = false
GROUP BY symbol, name;
```

## 前端 API 调用示例

### 创建交易记录

```javascript
// 前端字段 → 数据库字段映射
const payload = {
  trade_number: '20240215001',
  trade_type: '买入',
  symbol: '600519',
  name: '贵州茅台',
  buy_price: 1650.00,
  buy_quantity: 100,
  buy_time: '2024-02-15T09:30:00.000Z',
  buy_amount: 165000.00,
  buy_grade: 'A',
  overall_score: 85.5,
  buy_channel: {
    high: 1682.50,
    low: 1617.50,
    upperBand: 1702.00,
    lowerBand: 1598.00,
    type: 'bollinger'
  },
  trade_commission: 50.00,
  other_fees: 10.00
};

await fetch('/api/trade_records', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

### 更新交易记录

```javascript
await fetch('/api/trade_records/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    buy_price: 1655.00,
    trade_summary: '交易总结更新'
  })
});
```

### 删除交易记录（软删除）

```javascript
await fetch('/api/trade_records/1', {
  method: 'DELETE'
});
```

## 迁移注意事项

1. **数据备份**: 执行迁移前会自动创建 `trade_records_backup_complete` 备份表
2. **字段映射**: 由于字段结构变化较大，建议手动重新导入数据
3. **索引优化**: 根据实际查询需求，可以适当调整或增加索引
4. **约束验证**: 如果现有数据不满足新的 CHECK 约束，需要先清理或修正数据

## 验证清单

执行迁移后，请验证以下项目：

- [ ] 表创建成功，包含42个字段
- [ ] 主键为 SERIAL 类型，自动增长
- [ ] 所有时间字段为 TIMESTAMPTZ 类型
- [ ] 包含 deleted、deleted_at 软删除字段
- [ ] 所有索引创建成功
- [ ] 所有 CHECK 约束创建成功
- [ ] updated_at 触发器创建成功
- [ ] 所有字段注释添加成功
- [ ] 测试 CRUD 操作正常
- [ ] 测试软删除功能正常
- [ ] 测试字段类型验证正常

## 故障排查

### 问题1: 迁移失败，提示表已存在

**解决方案**:
```sql
-- 手动删除表
DROP TABLE IF EXISTS trade_records CASCADE;

-- 然后重新执行迁移脚本
```

### 问题2: CHECK 约束冲突

**解决方案**:
```sql
-- 查看冲突的数据
SELECT * FROM trade_records
WHERE trade_type NOT IN ('买入', '卖出');

-- 修正数据后重新执行
UPDATE trade_records SET trade_type = '买入' WHERE trade_type NOT IN ('买入', '卖出');
```

### 问题3: 触发器函数不存在

**解决方案**:
```sql
-- 确保触发器函数存在
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 然后重新执行迁移脚本
```

## 总结

✅ **完全按照 daily_work_data 表的规范重构**
✅ **包含所有前端使用的42个字段**
✅ **统一使用 SERIAL、TIMESTAMPTZ、JSON 等标准类型**
✅ **添加完整的索引、约束和触发器**
✅ **为所有字段添加详细注释**
✅ **提供完整的前后端字段映射表**
✅ **包含使用示例和故障排查指南**

**重构完成后，trade_records 表将与 daily_work_data 表保持完全一致的规范！**
