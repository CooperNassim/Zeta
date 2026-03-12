# 心理测试模块数据库重构总结

## 已完成的工作

### 1. 数据库表结构重构

✅ 创建了新的表结构，与每日功课模块保持一致：
- `psychological_test_results`：存储每天的测试结果
- `psychological_indicators`：存储测试指标配置

### 2. 数据库特性

✅ 添加了以下功能：
- 软删除支持（deleted 字段）
- 自动时间戳更新（触发器）
- 唯一索引（每个日期只能有一条测试记录）
- JSONB 存储分数（支持 JSON 查询）

### 3. 视图和索引

✅ 创建了以下视图：
- `v_psychological_test_results_active`：查询有效的测试结果
- `v_psychological_indicators_active`：查询活跃的指标配置

✅ 创建了以下索引：
- 日期索引
- 删除状态索引
- 唯一索引

### 4. 默认数据

✅ 插入了5个默认指标：
1. 今天身体感觉怎么样？
2. 昨天交易如何？
3. 早上做好计划了吗？
4. 早上情绪如何？
5. 今天工作量如何？

### 5. API 接口更新

✅ 更新了以下接口：
- `/api/sync/all`：同步 `psychological_test_results` 和 `psychological_indicators`
- `/api/export/all`：导出相关数据
- 通用 CRUD 接口自动支持新表

### 6. 前端适配

✅ 更新了 `useStore.js`：
- 添加了 `importPsychologicalTestResults` 函数
- 添加了 `importPsychologicalIndicators` 函数
- 数据字段名映射（snake_case → camelCase）

✅ 更新了 `App.jsx`：
- 同步逻辑中添加了心理测试数据和指标的导入

### 7. 后端配置更新

✅ 更新了 `queries.js`：
- 将 `psychological_test_results` 添加到支持软删除的表列表

## 数据结构对比

### 旧结构（已废弃）

```javascript
// psychological_tests 表（每条记录是一个指标的分数）
{
  id: 1,
  test_date: '2026-03-11',
  indicator_id: 1,
  score: 2,
  notes: null
}
```

### 新结构（当前）

```javascript
// psychological_test_results 表（每条记录是一天的完整测试结果）
{
  id: 1,
  test_date: '2026-03-11',
  scores: {
    "1": 2,
    "2": 1,
    "3": 2,
    "4": 2,
    "5": 1
  },
  overall_score: 8.0,
  notes: null
}

// psychological_indicators 表（指标配置）
{
  id: 1,
  indicator_id: "1",
  name: "今天身体感觉怎么样？",
  description: "0=感觉生病了；1=感觉正常；2=感觉好极了；",
  min_score: 0,
  max_score: 2,
  weight: 0.2,
  sort_order: 1
}
```

## 迁移脚本

执行迁移：
```bash
cd backend
node src/scripts/clear_psychological_tables.js  # 清理旧表
node src/scripts/run_migration.js              # 执行新迁移
```

## 测试验证

1. 检查数据库表是否创建成功：
```bash
node check_psychological_table.js
```

2. 检查默认指标是否插入：
```bash
curl http://localhost:3001/api/psychological_indicators
```

3. 测试同步接口：
```bash
curl http://localhost:3001/api/sync/all | grep psychological
```

## 后续工作建议

1. **前端页面适配**：更新 `PsychologicalTest.jsx` 以使用新的 API 接口
2. **测试功能**：测试添加、修改、删除测试结果的功能
3. **导出功能**：添加心理测试数据的导出功能
4. **导入功能**：添加心理测试数据的批量导入功能

## 文档

详细文档请参考：
- `PSYCHOLOGICAL_TEST_REFACTOR.md`：完整的设计文档
- `backend/migrations/migration_psychological_test_refactor.sql`：迁移脚本
