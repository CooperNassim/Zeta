# 交易策略表重构说明

## 概述

本次重构按照 `daily_work_data` 表的规范,对 `trading_strategies` 表进行了重构,保持数据库结构统一规范。

## 表结构对比

### 旧表结构
```
trading_strategies:
  - id: INTEGER
  - name: VARCHAR(100)
  - type: VARCHAR(20)
  - description: TEXT
  - conditions: JSONB 或 TEXT
  - risk_level: VARCHAR(20)
  - is_active: BOOLEAN
  - created_at, updated_at
```

### 新表结构
```
trading_strategies:
  - id: SERIAL PRIMARY KEY
  - strategy_type: VARCHAR(20) NOT NULL  -- 对应旧的 type
  - name: VARCHAR(200) NOT NULL           -- 对应旧的 name
  - eval_standard_1: TEXT NULL            -- 评估标准Ⅰ
  - eval_standard_2: TEXT NULL            -- 评估标准Ⅱ
  - eval_standard_3: TEXT NULL            -- 评估标准Ⅲ
  - eval_standard_4: TEXT NULL            -- 评估标准Ⅳ
  - eval_standard_5: TEXT NULL            -- 评估标准Ⅴ
  - status: VARCHAR(20) NOT NULL           -- 对应旧的 is_active
  - deleted: BOOLEAN NOT NULL             -- 软删除标记 (参考 daily_work_data)
  - deleted_at: TIMESTAMPTZ NULL           -- 删除时间
  - created_at: TIMESTAMPTZ NULL
  - updated_at: TIMESTAMPTZ NULL
```

## 设计规范 (参考 daily_work_data)

### 1. 主键规范
- 使用 `SERIAL PRIMARY KEY` 而非 `INTEGER DEFAULT nextval()`
- 更简洁且PostgreSQL原生支持

### 2. 时间戳规范
- 使用 `TIMESTAMPTZ` 类型 (带时区的时间戳)
- 默认值为 `CURRENT_TIMESTAMP`
- 添加触发器自动更新 `updated_at` 字段

### 3. 软删除规范
- 添加 `deleted BOOLEAN NOT NULL DEFAULT false` 字段
- 添加 `deleted_at TIMESTAMPTZ NULL` 字段记录删除时间
- 查询时使用 `WHERE deleted = false` 过滤已删除记录
- 创建索引 `idx_trading_strategies_deleted` 提升查询性能

### 4. 字段类型规范
- 评估标准字段使用 `TEXT` 类型 (与 daily_work_data 的各种字段类型一致)
- 避免使用 `JSONB` 类型,保持结构简单
- 使用中文命名字段 (如 `eval_standard_1`),提高可读性

### 5. 索引规范
- 为常用查询字段创建索引:
  - `strategy_type`: 策略类型查询
  - `status`: 状态查询
  - `deleted`: 软删除过滤
  - `created_at DESC`: 时间排序

### 6. 数据注释规范
- 为表和所有字段添加 COMMENT
- 提高数据库可维护性

## 迁移步骤

### 1. 备份现有数据 (重要!)
```sql
-- 备份旧表数据
CREATE TABLE trading_strategies_backup AS SELECT * FROM trading_strategies;
```

### 2. 执行迁移
```bash
cd backend
bash run_trading_strategy_migration.sh
```

或直接执行:
```bash
node src/scripts/run_trading_strategy_migration.js
```

### 3. 验证迁移
```sql
-- 查看新表结构
\d trading_strategies

-- 查看数据
SELECT * FROM trading_strategies WHERE deleted = false;
```

## 字段映射说明

| 旧字段 | 新字段 | 说明 |
|--------|--------|------|
| type | strategy_type | 策略类型 |
| name | name | 策略名称 |
| description | name | 描述合并到名称 |
| conditions | eval_standard_1~5 | 条件拆分为5个评估标准 |
| risk_level | eval_standard_5 | 风险等级合并到评估标准Ⅴ |
| is_active | status | 激活状态转换为状态文本 |

## 示例数据

已预置6条示例数据:

1. **趋势突破策略** (买入) - 启用
2. **回调买入策略** (买入) - 启用
3. **低吸策略** (买入) - 停用
4. **止盈策略** (卖出) - 启用
5. **止损策略** (卖出) - 启用
6. **风险控制策略** (卖出) - 停用

## 代码适配建议

### 前端 (TradingStrategy.jsx)
需要更新的地方:
1. 字段名称: `strategyType` -> `strategy_type`
2. 状态值: `true/false` -> `'启用'/'停用'`
3. 评估标准字段名称: `evalStandard1~5` -> `eval_standard_1~5`
4. 删除操作: 使用软删除 (`deleted = true`)

### 后端 API
需要更新的地方:
1. 查询: 添加 `WHERE deleted = false` 条件
2. 删除: 执行软删除而非 `DELETE`
3. 字段映射: 更新字段名称
4. 时间戳: 使用 `TIMESTAMPTZ` 类型

## 注意事项

1. **软删除**: 所有删除操作应该设置 `deleted = true`, 而非真正删除数据
2. **时区**: `TIMESTAMPTZ` 会自动处理时区,前端显示时注意时区转换
3. **字段长度**: `name` 字段长度从 100 增加到 200,支持更长的策略名称
4. **评估标准**: 使用 TEXT 类型,可以存储较长的评估标准描述

## 回滚方案

如果需要回滚到旧结构:
```sql
-- 删除新表
DROP TABLE IF EXISTS trading_strategies;

-- 恢复旧表结构 (需要根据实际情况调整)
CREATE TABLE trading_strategies (
    -- ... 旧表结构
);
```

## 文件清单

- `backend/migrations/migration_trading_strategy_refactor.sql` - 迁移SQL脚本
- `backend/src/scripts/run_trading_strategy_migration.js` - 迁移执行脚本
- `backend/run_trading_strategy_migration.sh` - 快捷运行脚本
- `TRADING_STRATEGY_MIGRATION.md` - 本说明文档

## 联系方式

如有问题,请联系开发团队。
