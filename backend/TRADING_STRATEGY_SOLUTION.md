# 交易策略创建问题解决方案

## 问题描述
用户反馈创建交易策略时出现500错误,并且重复的策略名称没有提示。

## 问题1: 创建策略返回500错误

### 根本原因
1. `_id` 字段有唯一约束 `UNIQUE`
2. `_id` 字段的默认值是 `'V1.0.0'`
3. 当前端不提供 `_id` 时,所有新记录都会使用相同的默认值 `'V1.0.0'`
4. 第二次插入时违反唯一约束,返回500错误

### 解决方案

#### 数据库层面修复
1. **移除 `_id` 字段的默认值**
   ```sql
   ALTER TABLE trading_strategies ALTER COLUMN _id DROP DEFAULT
   ```

2. **更新现有记录为唯一值**
   ```sql
   UPDATE trading_strategies
   SET _id = CONCAT('V', LPAD(id::TEXT, 2, '0'), '.0.0')
   WHERE _id = 'V1.0.0' OR _id IS NULL OR _id = ''
   ```

3. **创建自动生成 `_id` 的触发器**
   ```sql
   CREATE OR REPLACE FUNCTION generate_trading_strategy_id()
   RETURNS TRIGGER AS $$
   DECLARE
     next_id INTEGER;
     new_id VARCHAR(20);
   BEGIN
     IF NEW._id IS NULL OR NEW._id = '' THEN
       SELECT COALESCE(MAX(id), 0) + 1 INTO next_id
       FROM trading_strategies;
       new_id := CONCAT('V', LPAD(next_id::TEXT, 2, '0'), '.0.0');
       NEW._id := new_id;
       RAISE NOTICE '自动生成 _id: %', new_id;
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER auto_generate_strategy_id
     BEFORE INSERT ON trading_strategies
     FOR EACH ROW
     EXECUTE FUNCTION generate_trading_strategy_id();
   ```

### 工作原理
- 触发器在插入数据**之前**执行
- 检查 `_id` 是否为空
- 如果为空,自动生成唯一的 `_id` 值(格式: V01.0.0, V02.0.0...)
- 基于当前最大 `id + 1` 来生成,确保唯一性

### 优点
- 前端不需要关心 `_id` 的生成
- 数据库自动确保 `_id` 的唯一性
- 支持前端自定义 `_id`(如果提供)

## 问题2: 重复策略名称没有提示

### 解决方案

在 `handleSubmit` 函数中添加重复名称检查:

```javascript
// 检查重复名称
const existingRecord = strategyRecords.find(
  record => record.name === formData.name && (!isEditMode || record.id !== editingId)
)
if (existingRecord) {
  showToast('策略名称已存在', 'error')
  errors.name = true
}
```

### 逻辑说明
- 检查是否已存在相同名称的策略
- 编辑模式下,排除当前正在编辑的记录
- 如果发现重复,显示错误提示并阻止提交

## 测试验证

### 测试1: 创建新策略(不提供 _id)
```javascript
POST /api/trading_strategies
{
  "strategy_type": "买入",
  "name": "新策略",
  "status": "启用"
}
```

**预期结果**:
- 成功创建
- 自动生成 `_id: V18.0.0` (或其他唯一值)

### 测试2: 创建新策略(提供自定义 _id)
```javascript
POST /api/trading_strategies
{
  "_id": "V99.0.0",
  "strategy_type": "买入",
  "name": "自定义版本策略",
  "status": "启用"
}
```

**预期结果**:
- 成功创建
- 使用提供的 `_id: V99.0.0`

### 测试3: 创建重复名称策略

**第一次创建**:
```javascript
POST /api/trading_strategies
{
  "strategy_type": "买入",
  "name": "重复测试",
  "status": "启用"
}
```
→ 成功

**第二次创建(相同名称)**:
```javascript
POST /api/trading_strategies
{
  "strategy_type": "买入",
  "name": "重复测试",
  "status": "启用"
}
```
→ 显示错误提示 "策略名称已存在",阻止提交

### 测试4: 更新策略(修改为重复名称)

```javascript
PUT /api/trading_strategies/1
{
  "name": "已存在的名称"
}
```
→ 如果其他策略已使用该名称,显示错误提示 "策略名称已存在",阻止更新

## 执行的修复步骤

### 1. 数据库修复 (`fix_id_column.js`)
- 移除 `_id` 字段的默认值
- 更新现有记录为唯一值

### 2. 触发器创建 (`create_trigger.js`)
- 创建自动生成 `_id` 的函数
- 创建 BEFORE INSERT 触发器
- 测试触发器功能

### 3. 前端验证修复 (`src/pages/TradingStrategy.jsx`)
- 添加重复名称检查
- 显示友好的错误提示

### 4. Store层面修复 (`src/store/useStore.js`)
- `addStrategyRecord`: 只在有 `_id` 时才包含
- `updateStrategyRecord`: 只在有 `_id` 时才包含
- `importTradingStrategies`: 空值不设置默认值

## 总结

### 问题根源
- **500错误**: `_id` 唯一约束 + 默认值导致重复键违反
- **无提示**: 前端缺少重复名称验证

### 解决方案
- **数据库**: 使用触发器自动生成唯一 `_id`
- **前端**: 添加重复名称检查和提示

### 最终效果
✅ 创建策略时自动生成唯一修订版本ID
✅ 前端自定义 `_id` 仍然有效
✅ 重复策略名称会显示友好提示
✅ 编辑模式下正确排除当前记录

## 后续建议

1. **数据库唯一约束**: 考虑在 `name` 字段上也添加唯一约束
2. **后端验证**: 在后端API也添加重复名称验证
3. **版本号管理**: 考虑实现更完善的版本号管理策略
