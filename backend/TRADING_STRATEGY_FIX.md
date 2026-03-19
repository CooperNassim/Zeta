# 交易策略修订版本(_id)字段修复说明

## 问题描述
用户反馈修订版本(`_id`)字段无法正常更新,只能获取到默认值 `'V1.0.0'`。

## 根本原因
在 `src/store/useStore.js` 的三个地方,代码使用了 `|| 'V1.0.0'` 来设置 `_id` 的默认值:

1. **第991行** - `addStrategyRecord` 函数:
   ```javascript
   _id: record._id || 'V1.0.0',  // ❌ 问题: 如果用户输入空值,会被覆盖
   ```

2. **第1112行** - `updateStrategyRecord` 函数:
   ```javascript
   _id: record._id || 'V1.0.0',  // ❌ 问题: 如果用户修改为空值,会被覆盖
   ```

3. **第1184行** - `importTradingStrategies` 函数:
   ```javascript
   _id: d._id || 'V1.0.0',  // ❌ 问题: 数据库为NULL时,会被设置为默认值
   ```

这种写法的问题是:当 `_id` 的值为空字符串 `''` 时,`'' || 'V1.0.0'` 会返回 `'V1.0.0'`,导致用户输入被覆盖。

## 修复方案

### 1. 数据库层面
- 为所有记录生成了唯一的 `_id` 值 (V01.0.0, V02.0.0, V03.0.0...)
- 添加了 `_id` 字段的唯一约束
- 创建了 `_id` 索引
- 验证了数据库层面可以正常更新 `_id` 字段

### 2. 后端API层面 (`src/routes/api.js`)
- **PUT /api/:table/:id**: 支持通过 `id` 或 `_id` 来更新记录
  - 如果传入的是数字(如 `1`),通过 `id` 查询
  - 如果传入的是修订版本格式(如 `V01.0.0`),先通过 `_id` 找到对应的 `id`,再更新

- **DELETE /api/:table/:id**: 支持通过 `id` 或 `_id` 来删除记录

### 3. 前端Store层面 (`src/store/useStore.js`)

#### 修改1: `addStrategyRecord` 函数
**修改前:**
```javascript
const dbData = {
  _id: record._id || 'V1.0.0',  // ❌
  strategy_type: record.strategyType,
  // ...
}
```

**修改后:**
```javascript
const dbData = {
  strategy_type: record.strategyType,
  // ...
}

// 只有当 _id 有值时才包含在数据中
if (record._id && record._id.trim() !== '') {
  dbData._id = record._id
}
```

#### 修改2: `updateStrategyRecord` 函数
**修改前:**
```javascript
const dbData = {
  _id: record._id || 'V1.0.0',  // ❌
  strategy_type: record.strategyType,
  // ...
}
```

**修改后:**
```javascript
const dbData = {
  strategy_type: record.strategyType,
  // ...
}

// 只有当 _id 有值时才包含在更新数据中
if (record._id && record._id.trim() !== '') {
  dbData._id = record._id
}
```

#### 修改3: `importTradingStrategies` 函数
**修改前:**
```javascript
const newData = activeData.map(d => ({
  id: d.id,
  _id: d._id || 'V1.0.0',  // ❌
  strategyType: d.strategy_type,
  // ...
}))
```

**修改后:**
```javascript
const newData = activeData.map(d => ({
  id: d.id,
  _id: d._id || '',  // ✅ 改为空字符串,不设置默认值
  strategyType: d.strategy_type,
  // ...
}))
```

## 使用说明

### 主键 vs 修订版本

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER(SERIAL) | **主键**,数据库唯一标识,自动递增 (1, 2, 3...) |
| `_id` | VARCHAR(20) | **修订版本**,业务版本标识,格式为 Vxx.xx.xx (V01.0.0, V02.0.0...) |

### API调用示例

#### 创建策略
```javascript
// 不提供 _id,数据库会使用默认值
POST /api/trading_strategies
{
  "strategy_type": "买入",
  "name": "新策略"
}

// 提供自定义 _id
POST /api/trading_strategies
{
  "_id": "V02.0.0",
  "strategy_type": "买入",
  "name": "新策略"
}
```

#### 更新策略

**通过 id 更新:**
```javascript
PUT /api/trading_strategies/1
{
  "name": "更新后的名称",
  "_id": "V01.1.0"  // ✅ 可以修改修订版本
}
```

**通过 _id 更新:**
```javascript
PUT /api/trading_strategies/V01.0.0
{
  "name": "更新后的名称",
  "_id": "V01.1.0"  // ✅ 可以修改修订版本
}
```

#### 删除策略
```javascript
// 通过 id 删除
DELETE /api/trading_strategies/1

// 通过 _id 删除
DELETE /api/trading_strategies/V01.0.0
```

## 测试验证

1. ✅ 数据库层面: `_id` 字段可以正常更新
2. ✅ 后端API: 支持通过 `id` 或 `_id` 进行更新和删除
3. ✅ 前端Store: 不再强制设置默认值,保留用户输入

## 版本控制建议

建议的 `_id` 命名规则:
- 主版本号: 策略重大变更 (如评估标准完全重写)
  - V01 → V02
- 次版本号: 策略调整 (如新增评估标准)
  - V01.0 → V01.1
- 修订号: 小调整 (如文字描述修改)
  - V01.0.0 → V01.0.1

## 总结

**问题核心**: 使用 `|| 'V1.0.0'` 运算符导致空字符串被默认值覆盖

**解决方案**: 改为显式判断 `if (record._id && record._id.trim() !== '')`,只有当用户输入非空值时才包含在数据中

**修复范围**:
- 数据库: 添加唯一约束和索引
- 后端: 支持通过 `_id` 定位记录
- 前端: 修复3个地方的默认值设置逻辑

**注意事项**:
- `id` 仍然是主键,数据库关联使用 `id`
- `_id` 用于业务层面的版本标识
- 前端可以同时使用 `id` 或 `_id` 进行查询和更新
