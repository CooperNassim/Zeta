# 交易记录表重构使用指南

## 快速开始

### 1. 执行数据库迁移

```bash
# 进入后端目录
cd backend

# 执行迁移脚本
psql -U postgres -d zeta_trading -f migrations/migration_trade_records_complete.sql

# 或者使用 Node.js（如果有对应的执行脚本）
node execute_migration.js
```

### 2. 验证迁移结果

```bash
# 运行测试脚本
node test_trade_records_refactor.js
```

### 3. 查看表结构

```sql
-- 连接数据库
psql -U postgres -d zeta_trading

-- 查看表结构
\d trade_records

-- 查看所有字段
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trade_records'
ORDER BY ordinal_position;
```

## 字段映射

### 前端 → 数据库

前端使用 **camelCase** 命名，数据库使用 **snake_case** 命名。

**示例**:
```javascript
// 前端数据结构
const tradeRecord = {
  id: 1,
  tradeNumber: '20240215001',
  tradeType: '买入',
  symbol: '600519',
  name: '贵州茅台',
  buyPrice: 1650.00,
  buyQuantity: 100,
  buyTime: '2024-02-15T09:30:00.000Z',
  buyAmount: 165000.00,
  buyGrade: 'A',
  overallScore: 85.5,
  buyChannel: { high: 1682.50, low: 1617.50 },
  tradeCommission: 50.00,
  otherFees: 10.00
};

// 转换为数据库格式（snake_case）
const dbRecord = {
  id: tradeRecord.id,
  trade_number: tradeRecord.tradeNumber,
  trade_type: tradeRecord.tradeType,
  symbol: tradeRecord.symbol,
  name: tradeRecord.name,
  buy_price: tradeRecord.buyPrice,
  buy_quantity: tradeRecord.buyQuantity,
  buy_time: tradeRecord.buyTime,
  buy_amount: tradeRecord.buyAmount,
  buy_grade: tradeRecord.buyGrade,
  overall_score: tradeRecord.overallScore,
  buy_channel: JSON.stringify(tradeRecord.buyChannel),
  trade_commission: tradeRecord.tradeCommission,
  other_fees: tradeRecord.otherFees
};
```

## API 使用

### 创建交易记录

**请求**:
```http
POST /api/trade_records
Content-Type: application/json

{
  "trade_number": "20240215001",
  "trade_type": "买入",
  "symbol": "600519",
  "name": "贵州茅台",
  "buy_price": 1650.00,
  "buy_quantity": 100,
  "buy_time": "2024-02-15T09:30:00.000Z",
  "buy_amount": 165000.00,
  "buy_grade": "A",
  "overall_score": 85.5,
  "buy_channel": {
    "high": 1682.50,
    "low": 1617.50,
    "upperBand": 1702.00,
    "lowerBand": 1598.00,
    "type": "bollinger"
  },
  "trade_commission": 50.00,
  "other_fees": 10.00
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "trade_number": "20240215001",
    "trade_type": "买入",
    "symbol": "600519",
    "name": "贵州茅台",
    "created_at": "2024-02-15T09:30:00.000Z",
    "updated_at": "2024-02-15T09:30:00.000Z"
  }
}
```

### 获取交易记录列表

**请求**:
```http
GET /api/trade_records?page=1&pageSize=20&tradeType=买入&symbol=600519
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tradeNumber": "20240215001",
      "tradeType": "买入",
      "symbol": "600519",
      "name": "贵州茅台",
      "buyPrice": 1650.00,
      "buyQuantity": 100,
      "buyTime": "2024-02-15T09:30:00.000Z",
      "buyAmount": 165000.00,
      "buyGrade": "A",
      "overallScore": 85.5,
      "buyChannel": { "high": 1682.50, "low": 1617.50 },
      "tradeCommission": 50.00,
      "otherFees": 10.00,
      "deleted": false,
      "createdAt": "2024-02-15T09:30:00.000Z",
      "updatedAt": "2024-02-15T09:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### 更新交易记录

**请求**:
```http
PUT /api/trade_records/1
Content-Type: application/json

{
  "buy_price": 1655.00,
  "trade_summary": "交易总结更新"
}
```

**响应**:
```json
{
  "success": true,
  "message": "更新成功"
}
```

### 删除交易记录（软删除）

**请求**:
```http
DELETE /api/trade_records/1
```

**响应**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

### 恢复已删除的交易记录

**请求**:
```http
PATCH /api/trade_records/1/restore
```

**响应**:
```json
{
  "success": true,
  "message": "恢复成功"
}
```

## 前端使用示例

### 在 React 组件中使用

```javascript
import useStore from '../store/useStore';

function TradeRecords() {
  const tradeRecords = useStore(state => state.tradeRecords);
  const updateTradeRecord = useStore(state => state.updateTradeRecord);
  const deleteTradeRecord = useStore(state => state.deleteTradeRecord);

  // 获取交易记录
  const handleGetTradeRecords = async () => {
    const response = await fetch('/api/trade_records');
    const result = await response.json();
    if (result.success) {
      console.log('交易记录:', result.data);
    }
  };

  // 创建交易记录
  const handleCreateTradeRecord = async (data) => {
    const response = await fetch('/api/trade_records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) {
      console.log('创建成功，ID:', result.data.id);
    }
  };

  // 更新交易记录
  const handleUpdateTradeRecord = async (id, data) => {
    const response = await fetch(`/api/trade_records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) {
      console.log('更新成功');
    }
  };

  // 删除交易记录
  const handleDeleteTradeRecord = async (id) => {
    const response = await fetch(`/api/trade_records/${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (result.success) {
      console.log('删除成功');
    }
  };

  return (
    <div>
      {/* JSX 内容 */}
    </div>
  );
}

export default TradeRecords;
```

## 常见查询

### 查询所有买入记录

```sql
SELECT
  id, trade_number, symbol, name,
  buy_price, buy_quantity, buy_time,
  buy_amount, buy_grade, overall_score,
  created_at, updated_at
FROM trade_records
WHERE trade_type = '买入' AND deleted = false
ORDER BY buy_time DESC;
```

### 查询特定股票的交易记录

```sql
SELECT
  id, trade_number, trade_type,
  symbol, name,
  buy_price, sell_price,
  buy_time, sell_time,
  profit, profit_percent
FROM trade_records
WHERE symbol = '600519' AND deleted = false
ORDER BY buy_time DESC;
```

### 查询买入评级为A的记录

```sql
SELECT
  id, trade_number, symbol, name,
  buy_price, buy_quantity, buy_time,
  buy_amount, buy_grade, overall_score,
  buy_channel, trade_summary
FROM trade_records
WHERE buy_grade = 'A' AND deleted = false
ORDER BY buy_time DESC;
```

### 统计盈亏

```sql
SELECT
  symbol,
  name,
  COUNT(*) as trade_count,
  SUM(profit) as total_profit,
  AVG(profit_percent) as avg_profit_percent,
  MAX(profit) as max_profit,
  MIN(profit) as min_profit
FROM trade_records
WHERE trade_type = '卖出' AND deleted = false
GROUP BY symbol, name
ORDER BY total_profit DESC;
```

### 按交易类型分组统计

```sql
SELECT
  trade_type,
  COUNT(*) as count,
  SUM(buy_amount) as total_buy_amount,
  SUM(sell_amount) as total_sell_amount,
  SUM(profit) as total_profit
FROM trade_records
WHERE deleted = false
GROUP BY trade_type;
```

## 性能优化建议

### 1. 使用索引

```sql
-- 确保查询使用索引
EXPLAIN ANALYZE
SELECT * FROM trade_records
WHERE symbol = '600519' AND deleted = false;
```

### 2. 避免使用 SELECT *

```sql
-- 推荐：只选择需要的字段
SELECT id, trade_number, symbol, buy_price
FROM trade_records
WHERE deleted = false;

-- 不推荐：选择所有字段
SELECT * FROM trade_records
WHERE deleted = false;
```

### 3. 使用分页

```sql
-- 推荐：使用分页查询
SELECT * FROM trade_records
WHERE deleted = false
ORDER BY buy_time DESC
LIMIT 20 OFFSET 0;
```

### 4. 使用 JSON 字段时注意性能

```sql
-- 推荐：直接查询 JSON 字段中的值
SELECT * FROM trade_records
WHERE buy_channel->>'type' = 'bollinger';

-- 不推荐：使用复杂的 JSON 路径查询
SELECT * FROM trade_records
WHERE buy_channel->'metadata'->>'custom' IS NOT NULL;
```

## 故障排查

### 问题1: 插入数据时提示 CHECK 约束冲突

**错误信息**:
```
ERROR: new row for relation "trade_records" violates check constraint "chk_trade_records_trade_type"
```

**解决方案**:
确保 `trade_type` 只能是 `买入` 或 `卖出`。

### 问题2: JSON 字段插入失败

**错误信息**:
```
ERROR: invalid input syntax for type json
```

**解决方案**:
确保 JSON 字段的数据格式正确，或者使用字符串格式并添加 `::json` 类型转换。

```sql
-- 正确方式
INSERT INTO trade_records (..., buy_channel, ...)
VALUES (..., '{"high": 1682.50, "low": 1617.50}'::json, ...);
```

### 问题3: updated_at 没有自动更新

**可能原因**:
- 触发器函数 `update_updated_at_column()` 不存在

**解决方案**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

## 下一步

1. ✅ 执行数据库迁移
2. ✅ 运行测试脚本
3. ✅ 更新后端 API 代码
4. ✅ 更新前端代码
5. ⏳ 进行端到端测试(建议手动在浏览器中测试)

## 完成状态

- ✅ 数据库迁移完成 (2026-03-22)
- ✅ 表结构验证通过 (47个字段, 11个索引, 9个约束)
- ✅ 所有测试通过 (详见 TRADE_RECORDS_MIGRATION_COMPLETE.md)
- ✅ 后端API兼容 (通用CRUD完全支持)
- ✅ 前端代码兼容 (TradeRecords.jsx已适配)

## 相关文档

- [数据库重构方案](./TRADE_RECORDS_REFACTOR.md)
- [迁移脚本](./backend/migrations/migration_trade_records_complete.sql)
- [测试脚本](./backend/test_trade_records_refactor.js)
- [完成报告](./TRADE_RECORDS_MIGRATION_COMPLETE.md)
- [每日功课数据库规范](./DAILY_WORK_FIX.md)
