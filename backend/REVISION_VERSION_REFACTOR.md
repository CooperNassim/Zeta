# 修订版本字段重构说明

## 概述
已成功将交易策略表的 `_id` 字段重构为 `revision_version` 字段,作为一个普通的可编辑字段,不再有唯一性约束。

## 数据库变更

### 1. 删除的内容
- ✅ 删除了触发器 `auto_generate_strategy_id`
- ✅ 删除了函数 `generate_trading_strategy_id()`
- ✅ 删除了 `_id` 字段的唯一约束 `trading_strategies__id_key`
- ✅ 删除了旧字段 `_id`

### 2. 新建的内容
- ✅ 创建了新字段 `revision_version` (VARCHAR(50))
- ✅ 为现有记录生成了默认修订版本值 (V01.0.0, V02.0.0...)
- ✅ 恢复了5条示例数据用于测试

### 当前表结构
```sql
CREATE TABLE trading_strategies (
  id                    SERIAL PRIMARY KEY,
  strategy_type         VARCHAR(255),
  name                  VARCHAR(255),
  eval_standard_1       TEXT,
  eval_standard_2       TEXT,
  eval_standard_3       TEXT,
  eval_standard_4       TEXT,
  eval_standard_5       TEXT,
  status                VARCHAR(50),
  deleted               BOOLEAN DEFAULT false,
  deleted_at            TIMESTAMP,
  created_at            TIMESTAMP,
  updated_at            TIMESTAMP,
  revision_version      VARCHAR(50)  -- 新的修订版本字段(普通字段,无唯一约束)
);
```

## 前端变更

### 1. 字段定义 (`src/pages/TradingStrategy.jsx`)
```javascript
// 修改前
{ key: '_id', label: '修订版本', type: 'text', width: '80px' }

// 修改后
{ key: 'revisionVersion', label: '修订版本', type: 'text', width: '100px' }
```

### 2. Store变更 (`src/store/useStore.js`)

#### 添加策略
```javascript
// 修改前
if (record._id && record._id.trim() !== '') {
  dbData._id = record._id
}

// 修改后
if (record.revisionVersion && record.revisionVersion.trim() !== '') {
  dbData.revision_version = record.revisionVersion
}
```

#### 更新策略
```javascript
// 修改前
if (record._id && record._id.trim() !== '') {
  dbData._id = record._id
}

// 修改后
if (record.revisionVersion && record.revisionVersion.trim() !== '') {
  dbData.revision_version = record.revisionVersion
}
```

#### 导入策略
```javascript
// 修改前
_id: d._id || '',

// 修改后
revisionVersion: d.revision_version || '',
```

## 后端变更

### 移除了对 `_id` 的特殊处理 (`backend/src/routes/api.js`)

#### PUT 请求
```javascript
// 修改前: 支持通过 _id 查找记录并更新
if (table === 'trading_strategies' && id.startsWith('V')) {
  const findResult = await pool.query(
    'SELECT id FROM trading_strategies WHERE _id = $1 AND deleted = false',
    [id]
  );
  updateId = findResult.rows[0].id;
}

// 修改后: 直接使用 id 更新
const result = await update(table, id, data);
```

#### DELETE 请求
```javascript
// 修改前: 支持通过 _id 查找记录并删除
if (table === 'trading_strategies' && id.startsWith('V')) {
  const findResult = await pool.query(
    'SELECT id FROM trading_strategies WHERE _id = $1 AND deleted = false',
    [id]
  );
  deleteId = findResult.rows[0].id;
}

// 修改后: 直接使用 id 删除
const result = await remove(table, id);
```

## 使用说明

### 字段特性
- **字段名**: `revision_version` (数据库) / `revisionVersion` (前端)
- **类型**: VARCHAR(50)
- **约束**: 无唯一性约束,可以重复
- **可编辑**: ✅ 是,可以在表单中自由修改
- **必填**: ❌ 否,可以为空

### 前端表单
- 修订版本字段在表单中可见
- 新建策略时,字段为空(不设置默认值)
- 编辑策略时,可以修改修订版本
- 删除策略时,不再支持通过修订版本查找,必须使用主键 `id`

### API调用
```javascript
// 创建策略
POST /api/trading_strategies
{
  "name": "新策略",
  "strategyType": "买入",
  "revisionVersion": "V1.0.0"  // 可选,不提供则为空
}

// 更新策略
PUT /api/trading_strategies/1
{
  "name": "更新策略",
  "revisionVersion": "V1.1.0"  // 可选,可以修改
}

// 删除策略
DELETE /api/trading_strategies/1  // 必须使用主键id
```

## 测试数据

已恢复5条示例数据:
- ID: 1, 名称: 趋势突破策略, 修订版本: V01.0.0
- ID: 2, 名称: 回调买入策略, 修订版本: V02.0.0
- ID: 3, 名称: 低吸策略, 修订版本: V03.0.0
- ID: 4, 名称: 止盈策略, 修订版本: V04.0.0
- ID: 5, 名称: 止损策略, 修订版本: V05.0.0

## 总结

✅ 成功删除了 `_id` 字段及其相关的唯一约束和触发器
✅ 创建了新的 `revision_version` 字段作为普通可编辑字段
✅ 更新了前端和后端代码,使用新的字段名
✅ 移除了所有对 `_id` 的特殊处理逻辑
✅ `revision_version` 现在可以自由编辑,不再有唯一性限制
