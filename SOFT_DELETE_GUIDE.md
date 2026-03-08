# 软删除功能使用指南

## 概述

系统现已全面实现软删除功能，所有删除操作都会标记数据为"已删除"而不是真正删除，这样可以：
1. 支持数据恢复功能
2. 保留操作历史记录
3. 提高数据安全性

## 数据库变更

所有数据表都已添加两个软删除字段：
- `deleted` (BOOLEAN): 删除标记，true表示已删除，false表示未删除
- `deleted_at` (TIMESTAMP WITH TIME ZONE): 删除时间，未删除时为NULL

## API接口

### 软删除（默认删除方式）

```bash
# 单条删除
DELETE /api/:table/:id

# 批量删除
DELETE /api/:table/bulk
Body: { "ids": [1, 2, 3] }
```

### 恢复已删除的数据

```bash
# 恢复单条数据
PATCH /api/:table/:id/restore

# 批量恢复
PATCH /api/:table/bulk/restore
Body: { "ids": [1, 2, 3] }
```

### 永久删除（硬删除）

```bash
# 永久删除单条数据（无法恢复）
DELETE /api/:table/:id/permanent

# 批量永久删除
DELETE /api/:table/bulk/permanent
Body: { "ids": [1, 2, 3] }
```

### 查询接口

```bash
# 查询未删除的数据（默认行为）
GET /api/:table

# 查询所有数据（包括已删除）
GET /api/:table?includeDeleted=true
```

## 前端使用

所有删除函数都已自动同步到后端API，使用方法不变：

```javascript
// 单条删除
deleteDailyWorkData(id)
deleteOrder(id)
deleteTransaction(id, 'real')
deleteTradeRecord(id)
deleteStock(id)
deleteTechnicalIndicator(id)
deleteRiskModel(id)

// 批量删除
deleteMultipleDailyWorkData(ids)
deleteMultipleOrders(ids)
deleteMultipleTransactions(ids, 'real')
deleteMultipleTradeRecords(ids)
deleteMultipleStocks(ids)

// 恢复数据
restoreDailyWorkData(ids)
restoreOrder(id)
restoreTransaction(id, 'real')
restoreTradeRecord(id)
restoreStock(id)
restoreTechnicalIndicator(id)
restoreRiskModel(id)

// 永久删除
permanentDeleteDailyWorkData(ids)
permanentDeleteOrder(id)
permanentDeleteTransaction(id, 'real')
permanentDeleteTradeRecord(id)
permanentDeleteStock(id)
```

## 数据迁移

如果已有数据库，需要执行迁移脚本添加软删除字段：

### 方法1：使用Node.js脚本

```bash
cd backend
node src/scripts/migrate.js
```

### 方法2：直接执行SQL

```bash
psql -U postgres -d zeta_trading -f backend/src/scripts/migrate_soft_delete.sql
```

## 影响的表

以下所有表都已支持软删除：

1. `account` - 账户信息
2. `daily_work_data` - 每日功课数据
3. `psychological_indicators` - 心理测试指标
4. `psychological_tests` - 心理测试记录
5. `trading_strategies` - 交易策略
6. `risk_models` - 风险模型
7. `risk_config` - 风险配置
8. `account_risk_data` - 账户风险数据
9. `technical_indicators` - 技术指标
10. `orders` - 预约订单
11. `transactions` - 账单明细
12. `trade_records` - 交易记录
13. `stock_pool` - 股票池
14. `stock_kline_data` - 股票K线数据
15. `strategy_records` - 策略记录

## 注意事项

1. **查询自动过滤**：所有默认查询都会自动过滤已删除的数据（`deleted = false`）
2. **恢复功能**：所有删除的数据都可以通过恢复功能恢复
3. **永久删除**：只有永久删除才会真正从数据库中删除记录
4. **性能优化**：为所有表的 `deleted` 字段添加了索引以提高查询性能
5. **前端同步**：前端删除操作会自动同步到后端API

## 常见问题

### Q: 如何查看已删除的数据？

A: 使用 `includeDeleted=true` 参数查询所有数据：
```bash
GET /api/transactions?includeDeleted=true
```

### Q: 如何彻底删除数据？

A: 使用永久删除接口：
```bash
DELETE /api/transactions/123/permanent
```

### Q: 删除的数据会占用数据库空间吗？

A: 是的，软删除的数据仍然占用空间。建议定期清理不需要的历史数据。

### Q: 如何批量恢复数据？

A: 使用批量恢复接口：
```javascript
restoreMultipleStocks([1, 2, 3])
```

## 技术实现

### 后端实现

- 查询构建器自动添加 `deleted = false` 条件
- 删除操作使用 `UPDATE` 设置 `deleted = true`
- 恢复操作使用 `UPDATE` 设置 `deleted = false`
- 永久删除使用 `DELETE` 真正删除记录

### 前端实现

- 所有删除函数添加了 API 调用
- 保持原有的前端状态更新逻辑
- 提供恢复和永久删除功能

## 更新日志

- 2025-03-08: 实现全站软删除功能
  - 为所有表添加 deleted 和 deleted_at 字段
  - 修改删除逻辑为软删除
  - 添加恢复功能
  - 添加永久删除功能
