# 导入功能修复说明

## 问题描述

导入功能显示成功,但数据没有保存到数据库中。

## 根本原因

1. **前端Store的 `importStrategyRecords` 函数只是将数据添加到前端状态中,没有调用API保存到数据库**

2. **导入时状态字段被覆盖**: 在验证后会设置 `data.status = '启用'`,覆盖了Excel文件中的状态值

## 修复方案

### 1. 修改 `importStrategyRecords` 函数 (`src/store/useStore.js`)

**修改前**:
```javascript
// 只更新前端状态,不保存到数据库
importStrategyRecords: (dataList) => set((state) => {
  return {
    strategyRecords: [
      ...dataList.map((d, index) => ({
        ...d,
        id: (currentMaxId + index + 1).toString(),
        createdAt: d.createdAt || now,
        updatedAt: now,
        deleted: false,
        deletedAt: null
      }))
    ]
  }
}),
```

**修改后**:
```javascript
// 保存到数据库
importStrategyRecords: async (dataList) => {
  console.log('[Store] 导入交易策略记录, 数量:', dataList.length)

  try {
    const now = new Date().toISOString()

    // 构造数据库数据数组 (snake_case)
    const dbDataArray = dataList.map(record => {
      const dbData = {
        strategy_type: record.strategyType,
        name: record.name,
        eval_standard_1: record.evalStandard1,
        eval_standard_2: record.evalStandard2,
        eval_standard_3: record.evalStandard3,
        eval_standard_4: record.evalStandard4,
        eval_standard_5: record.evalStandard5,
        status: record.status || '启用',
        created_at: now,
        updated_at: now
      }

      // 只有当 revisionVersion 有值时才包含在数据中
      if (record.revisionVersion && record.revisionVersion.trim() !== '') {
        dbData.revision_version = record.revisionVersion
      }

      return dbData
    })

    // 使用批量API保存到数据库
    const res = await apiCall('/api/trading_strategies/bulk', 'POST', dbDataArray)
    console.log('[Store] 批量保存结果:', res)

    // 保存成功后,从数据库重新同步数据
    const syncResponse = await apiCall('/api/sync/all')
    if (syncResponse.success && syncResponse.data && syncResponse.data.trading_strategies !== undefined) {
      const { trading_strategies } = syncResponse.data
      set((state) => {
        state.importTradingStrategies(trading_strategies)
        return {}
      })
    }

    return { success: true, count: dbDataArray.length }
  } catch (error) {
    console.error('[Store] 导入失败:', error)
    throw error
  }
},
```

### 2. 修复导入逻辑中的状态覆盖问题 (`src/pages/TradingStrategy.jsx`)

**修改前**:
```javascript
if (errors.length > 0) {
  errorList.push({ ... })
} else {
  // 导入时默认设置状态为"启用"
  data.status = '启用'  // ❌ 会覆盖Excel中的状态
  dataList.push(data)
}
```

**修改后**:
```javascript
if (errors.length > 0) {
  errorList.push({ ... })
} else {
  // 如果没有设置状态,默认为"启用"
  if (!data.status) {
    data.status = '启用'
  }
  dataList.push(data)
}

// 添加调试日志
console.log('[Import] 解析完成, 成功数据:', dataList.length, '错误数据:', errorList.length)
if (dataList.length > 0) {
  console.log('[Import] 第一条数据示例:', dataList[0])
}
```

### 3. 修改导入调用为异步 (`src/pages/TradingStrategy.jsx`)

**修改前**:
```javascript
if (dataList.length > 0) {
  importStrategyRecords(dataList)  // ❌ 没有await
  // ...
}
```

**修改后**:
```javascript
if (dataList.length > 0) {
  await importStrategyRecords(dataList)  // ✅ 添加await
  // ...
}
```

## 工作流程

### 导入流程

1. 用户选择Excel文件
2. 前端解析Excel文件,验证数据格式
3. 构造数据数组 (camelCase格式)
4. 调用 `importStrategyRecords(dataList)` 异步函数
5. 转换为数据库格式 (snakeCase)
6. 调用批量插入API: `POST /api/trading_strategies/bulk`
7. 后端执行批量插入
8. 返回插入结果
9. 前端从数据库重新同步数据,确保数据一致性

### 数据转换

**前端格式**:
```javascript
{
  revisionVersion: 'V1.0.0',
  strategyType: '买入',
  name: '测试策略',
  evalStandard1: '标准1',
  evalStandard2: '标准2',
  evalStandard3: '标准3',
  evalStandard4: '标准4',
  evalStandard5: '标准5',
  status: '启用'
}
```

**后端格式**:
```javascript
{
  revision_version: 'V1.0.0',
  strategy_type: '买入',
  name: '测试策略',
  eval_standard_1: '标准1',
  eval_standard_2: '标准2',
  eval_standard_3: '标准3',
  eval_standard_4: '标准4',
  eval_standard_5: '标准5',
  status: '启用',
  created_at: '2026-03-19T...',
  updated_at: '2026-03-19T...'
}
```

## 关键特性

### 批量导入
- ✅ 使用批量API `POST /api/trading_strategies/bulk`
- ✅ 一次请求插入多条数据,提高效率
- ✅ 原子性操作,要么全部成功,要么全部失败

### 字段映射
- ✅ 自动处理 camelCase → snake_case 转换
- ✅ `revisionVersion` → `revision_version`
- ✅ `strategyType` → `strategy_type`
- ✅ `evalStandard1-5` → `eval_standard_1-5`

### 默认值处理
- ✅ `status`: 如果Excel中没有,默认为"启用"
- ✅ `revisionVersion`: 可选字段,不提供则为空
- ✅ `created_at`/`updated_at`: 自动设置为当前时间

### 数据同步
- ✅ 导入成功后自动从数据库重新同步
- ✅ 确保前端显示的数据与数据库一致
- ✅ 避免数据不一致问题

## 测试建议

### 导入测试

1. **准备Excel文件**:
   - 包含表头: 修订版本, 策略类型, 名称, 评估标准1-5, 状态
   - 填写测试数据

2. **测试场景**:
   - 正常导入(所有字段都有值)
   - 部分字段缺失(测试默认值)
   - 状态字段缺失(测试默认"启用")
   - 状态字段有值(测试不被覆盖)

3. **验证**:
   - 检查数据库中的数据
   - 检查前端显示的数据
   - 验证字段值是否正确

## 总结

✅ 导入功能现在可以正确保存数据到数据库
✅ 使用批量API提高性能
✅ 修复了状态字段被覆盖的问题
✅ 添加了调试日志方便排查问题
✅ 导入后自动同步确保数据一致性
