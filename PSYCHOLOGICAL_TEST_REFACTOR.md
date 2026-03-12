# 心理测试模块数据库重构说明

## 概述

本次重构将心理测试模块的数据库结构优化为与每日功课模块相似的设计模式，提高了数据的可维护性和查询效率。

## 数据库表结构

### 1. psychological_test_results（心理测试结果表）

存储每天的测试结果，每个日期只能有一条记录。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键 |
| test_date | DATE | 测试日期（唯一） |
| scores | JSONB | 各指标的分数，格式：`{"1": 2, "2": 1, "3": 2, ...}` |
| overall_score | NUMERIC(5,2) | 综合评分（0-10） |
| notes | TEXT | 备注 |
| deleted | BOOLEAN | 是否删除（软删除标记） |
| deleted_at | TIMESTAMPTZ | 删除时间 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**索引**：
- `psychological_test_results_test_date_key`：唯一索引，确保每个日期只有一条记录
- `idx_psychological_test_results_date`：日期索引，便于按日期查询
- `idx_psychological_test_results_deleted`：删除状态索引

### 2. psychological_indicators（心理测试指标配置表）

存储测试指标的配置信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键 |
| indicator_id | VARCHAR(10) | 指标ID（前端使用，如"1"、"2"、"3"...） |
| name | VARCHAR(200) | 指标名称 |
| description | TEXT | 指标描述 |
| min_score | INTEGER | 最小分数 |
| max_score | INTEGER | 最大分数 |
| weight | NUMERIC(5,2) | 权重（用于计算综合评分） |
| sort_order | INTEGER | 排序顺序 |
| is_active | BOOLEAN | 是否活跃 |
| deleted | BOOLEAN | 是否删除（软删除标记） |
| deleted_at | TIMESTAMPTZ | 删除时间 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**索引**：
- `psychological_indicators_indicator_id_key`：唯一索引
- `idx_psychological_indicators_active`：活跃状态索引
- `idx_psychological_indicators_deleted`：删除状态索引

## 视图

### 1. v_psychological_test_results_active
查询有效的测试结果（已删除的记录会被过滤掉）

### 2. v_psychological_indicators_active
查询活跃的指标配置

## 触发器

自动更新 `updated_at` 字段的触发器：
- `trigger_update_psychological_test_results_updated_at`
- `trigger_update_psychological_indicators_updated_at`

## 默认数据

系统初始化时会插入5个默认指标：

1. 今天身体感觉怎么样？(0-2分，权重0.2)
2. 昨天交易如何？(0-2分，权重0.2)
3. 早上做好计划了吗？(0-2分，权重0.2)
4. 早上情绪如何？(0-2分，权重0.2)
5. 今天工作量如何？(0-2分，权重0.2)

## API 接口

### GET /api/psychological_test_results
获取所有测试结果（默认过滤已删除的）

### GET /api/psychological_test_results?includeDeleted=true
获取所有测试结果（包括已删除的）

### GET /api/psychological_test_results/:id
根据ID获取测试结果

### POST /api/psychological_test_results
创建新的测试结果

### PUT /api/psychological_test_results/:id
更新测试结果

### DELETE /api/psychological_test_results/:id
软删除测试结果

### GET /api/psychological_indicators
获取所有指标配置

### POST /api/psychological_indicators
创建新的指标

### PUT /api/psychological_indicators/:id
更新指标

### DELETE /api/psychological_indicators/:id
软删除指标

## 数据同步

`/api/sync/all` 接口会同步以下表：
- `psychological_indicators`：指标配置
- `psychological_test_results`：测试结果

## 迁移脚本

迁移文件位置：`backend/migrations/migration_psychological_test_refactor.sql`

执行迁移：
```bash
cd backend
node src/scripts/run_migration.js
```

## 优势

1. **更清晰的数据结构**：将测试结果和指标配置分离
2. **更好的查询性能**：使用 JSONB 存储分数，支持 JSON 查询
3. **软删除支持**：与每日功课模块保持一致
4. **自动时间戳**：触发器自动更新 `updated_at`
5. **灵活的指标配置**：可以动态添加、修改、删除指标
6. **唯一的测试记录**：每个日期只能有一条测试记录

## 前端适配

前端需要适配的数据结构变化：

**旧结构**（psychological_tests 表）：
```javascript
{
  id: 1,
  test_date: '2026-03-11',
  indicator_id: 1,
  score: 2,
  notes: null
}
```

**新结构**（psychological_test_results 表）：
```javascript
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
```

前端需要修改 `useStore` 中的数据映射逻辑。
