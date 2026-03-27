# 交易订单软删除同步功能

## 功能概述

当股票交易列表（`trade_orders`）中的数据被软删除时，对应的交易记录（`trade_records`）也会自动同步软删除。同样，当订单被恢复时，交易记录也会同步恢复。

## 实现原理

### 数据库触发器

通过修改数据库触发器 `trg_sync_trade_order_to_records`，使其支持 `INSERT` 和 `UPDATE` 两种操作：

1. **INSERT 操作**：
   - 创建买入订单时，自动创建对应的交易记录
   - 创建卖出订单时，自动更新对应的交易记录

2. **UPDATE 操作（新增）**：
   - 当订单的 `deleted` 字段从 `false` 变为 `true` 时，同步软删除对应的交易记录
   - 当订单的 `deleted` 字段从 `true` 变为 `false` 时，同步恢复对应的交易记录

## 数据库迁移

### 迁移文件

`backend/migrations/migration_sync_soft_delete.sql`

### 执行迁移

```bash
cd backend
node run_sync_soft_delete_migration.js
```

或者直接执行 SQL：

```bash
cd backend
psql -U postgres -d zeta_trading -f migrations/migration_sync_soft_delete.sql
```

## 功能测试

### 测试脚本

`backend/test_sync_soft_delete.js`

### 运行测试

```bash
cd backend
node test_sync_soft_delete.js
```

### 测试结果

```
✅ 所有测试通过！

测试总结:
   ✅ 创建订单时自动创建交易记录
   ✅ 软删除订单时同步软删除交易记录
   ✅ 恢复订单时同步恢复交易记录
```

## 使用示例

### 前端使用

前端代码无需修改，使用现有的删除和恢复功能即可：

```javascript
// 软删除订单
deleteOrder(id)

// 批量删除订单
deleteMultipleOrders(ids)

// 恢复订单
restoreOrder(id)
```

### 后端 API

使用现有的 API 接口，触发器会自动处理同步：

```bash
# 软删除订单
DELETE /api/trade_orders/:id

# 批量删除
POST /api/trade_orders/bulk/delete
Body: { "ids": [1, 2, 3] }

# 恢复订单
PATCH /api/trade_orders/:id/restore
```

### SQL 示例

```sql
-- 软删除订单
UPDATE trade_orders 
SET deleted = true, deleted_at = NOW() 
WHERE id = 123;
-- 对应的交易记录也会被软删除

-- 恢复订单
UPDATE trade_orders 
SET deleted = false, deleted_at = NULL 
WHERE id = 123;
-- 对应的交易记录也会被恢复
```

## 工作流程

### 删除流程

```
用户删除订单
    ↓
前端调用 deleteOrder(id)
    ↓
发送 DELETE /api/trade_orders/:id
    ↓
后端执行 UPDATE trade_orders SET deleted = true
    ↓
触发器检测到 deleted 变化（false → true）
    ↓
触发器同步更新 trade_records SET deleted = true
    ↓
订单和交易记录都已软删除
```

### 恢复流程

```
用户恢复订单
    ↓
前端调用 restoreOrder(id)
    ↓
发送 PATCH /api/trade_orders/:id/restore
    ↓
后端执行 UPDATE trade_orders SET deleted = false
    ↓
触发器检测到 deleted 变化（true → false）
    ↓
触发器同步更新 trade_records SET deleted = false
    ↓
订单和交易记录都已恢复
```

## 技术细节

### 触发器函数关键代码

```plpgsql
-- 处理更新操作 - 软删除同步
IF TG_OP = 'UPDATE' THEN
    -- 检测软删除操作：deleted 从 false 变为 true
    IF OLD.deleted = false AND NEW.deleted = true THEN
        -- 同步软删除对应的交易记录
        UPDATE trade_records 
        SET deleted = true, 
            deleted_at = NEW.deleted_at,
            updated_at = CURRENT_TIMESTAMP
        WHERE trade_number = NEW.trade_number 
          AND deleted = false;
    END IF;
    
    -- 检测恢复操作：deleted 从 true 变为 false
    IF OLD.deleted = true AND NEW.deleted = false THEN
        -- 同步恢复对应的交易记录
        UPDATE trade_records 
        SET deleted = false, 
            deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE trade_number = NEW.trade_number 
          AND deleted = true;
    END IF;
END IF;
```

### 触发器定义

```sql
CREATE TRIGGER trg_sync_trade_order_to_records
    AFTER INSERT OR UPDATE ON trade_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_trade_order_to_records();
```

## 注意事项

1. **数据一致性**：
   - 软删除同步是自动的，确保了订单和交易记录的状态一致
   - 使用同一个 `deleted_at` 时间戳

2. **性能影响**：
   - 触发器在数据库层面执行，性能开销很小
   - 每次更新订单时会检查 `deleted` 字段的变化

3. **事务安全**：
   - 触发器在同一事务中执行
   - 如果事务回滚，同步操作也会回滚

4. **查询过滤**：
   - 现有的查询函数已经自动过滤 `deleted = false` 的记录
   - 查询结果不受影响

## 相关文件

### 数据库相关
- `backend/migrations/migration_sync_soft_delete.sql` - 迁移脚本
- `backend/run_sync_soft_delete_migration.js` - 执行迁移脚本
- `backend/test_sync_soft_delete.js` - 测试脚本

### 文档
- `TRADE_ORDERS_SOFT_DELETE_SYNC.md` - 本文档

### 前端代码
- `src/store/useStore.js` - 状态管理（无需修改）
- `src/pages/OrderManagement.jsx` - 订单管理页面（无需修改）

### 后端代码
- `backend/src/routes/api.js` - API路由（无需修改）
- `backend/src/database/queries.js` - 数据库查询函数（无需修改）

## 更新日志

- **2026-03-25**: 实现软删除同步功能
  - 修改触发器支持 UPDATE 操作
  - 添加软删除和恢复的同步逻辑
  - 创建测试脚本验证功能
  - 创建使用文档

## 故障排查

### 问题：订单删除后，交易记录没有被软删除

**解决方案**：

1. 检查触发器是否存在：
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_sync_trade_order_to_records';
```

2. 检查触发器函数是否正确：
```sql
SELECT prosrc FROM pg_proc WHERE proname = 'sync_trade_order_to_records';
```

3. 重新执行迁移：
```bash
cd backend
node run_sync_soft_delete_migration.js
```

### 问题：恢复订单后，交易记录没有被恢复

**解决方案**：

检查 `deleted_at` 字段是否正确设置为 NULL，触发器会自动处理恢复操作。

## 未来改进

1. **批量删除优化**：
   - 当前实现每次更新都会触发触发器
   - 批量删除时会触发多次，可以考虑批量触发器优化

2. **日志记录**：
   - 可以添加日志表记录所有软删除和恢复操作

3. **级联删除**：
   - 考虑是否需要支持其他关联表的同步软删除
