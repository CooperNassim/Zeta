# Zeta Trading System 数据库迁移指南

## 概述

本文档指导如何从当前数据库结构迁移到最新的 V4 版本。

## 当前数据库状态

### 现有表 (20个)
- account
- account_risk_data
- daily_work_data
- daily_work_data_backup_new
- orders
- psychological_indicators
- psychological_test_indicators
- psychological_test_results
- psychological_tests
- risk_config
- risk_models
- scheduled_orders
- stock_kline_data
- stock_pool
- strategy_records
- technical_indicators
- trade_records
- trading_strategies
- transactions

### 目标结构 (14个标准表)
根据 migration_complete_v4.sql,目标应该有14个表。

## 迁移步骤

### 第一步: 备份当前数据

```bash
cd backend
npm run backup
```

### 第二步: 运行迁移脚本

```bash
# 方式1: 使用 Node.js 脚本执行
node src/scripts/run_migration.js

# 方式2: 直接使用 psql 执行
psql -U postgres -d zeta_trading -f migrations/migration_complete_v4.sql
```

### 第三步: 验证迁移结果

```bash
node src/scripts/verify_migration.js
```

## 迁移脚本说明

### 主要迁移文件

1. **migration_complete_v4.sql** - 完整的 V4 版本数据库结构
   - 包含所有14个标准表
   - 包含所有触发器和函数
   - 包含初始数据
   - 使用 TIMESTAMPTZ 时间类型
   - 支持软删除

2. **migration_incremental_*.sql** - 增量迁移脚本
   - 用于特定场景的增量更新
   - 可选执行

3. **migration_*.sql** - 特定功能的迁移脚本
   - 针对特定表或功能的迁移
   - 可按需执行

### 已整合的迁移内容

以下迁移已经整合到 migration_complete_v4.sql 中:

- ✅ migration_psychological_test_refactor.sql
- ✅ migration_psychological_test_timezone_fix.sql
- ✅ migration_risk_config_simple.sql
- ✅ migration_sync_soft_delete.sql
- ✅ migration_trade_records_complete.sql
- ✅ migration_trade_records_refactor.sql
- ✅ migration_trade_records_sync.sql
- ✅ migration_trading_strategy_refactor.sql
- ✅ migration_trading_strategy_revision_fix.sql
- ✅ migration_utc_time.sql

### 可选的增量迁移

以下迁移可以根据需要单独执行:

- migration_add_trade_fields.sql - 添加额外的交易字段
- migration_fix_order_time.sql - 修复订单时间问题
- migration_trading_strategy_id_trigger.sql - 添加策略ID触发器

## 旧脚本整理

以下脚本已整合,可以归档或删除:

### 可以删除的根目录脚本
- add_buy_order_id_field.js
- add_revision_column.js
- fix_buy_order_id.js
- fix_trade_records_schema.js
- migrate_deleted_fields.js
- migrate_trade_records_sync.js

### 可以归档的迁移脚本
- migration_2026-03-11T13-40-37.sql
- migration_2026-03-11T14-59-11.sql
- migration_2026-03-12T15-38-07.sql
- migration_complete_v3.sql
- migration_complete_v3_fixed.sql

## 迁移注意事项

### 数据迁移

1. **保留现有数据**: 迁移脚本会保留所有现有数据
2. **数据验证**: 迁移后会验证数据完整性
3. **备份恢复**: 如果迁移失败,可以恢复备份

### 表结构变更

1. **删除的表**: daily_work_data_backup_new, psychological_tests_backup
2. **重命名的表**: 无
3. **新增的表**: 无(14个表结构完整)

### 字段变更

1. **时间字段**: 统一使用 TIMESTAMPTZ
2. **软删除**: 所有表都添加 deleted_at 字段
3. **触发器**: 所有表都有 updated_at 触发器

## 回滚方案

如果迁移后出现问题,可以按以下步骤回滚:

```bash
# 1. 停止服务
# 2. 删除数据库
psql -U postgres -c "DROP DATABASE zeta_trading;"

# 3. 重新创建数据库
psql -U postgres -c "CREATE DATABASE zeta_trading;"

# 4. 恢复备份
npm run restore
```

## 版本兼容性

### V4 版本特性

- ✅ 所有表使用 TIMESTAMPTZ
- ✅ 所有表支持软删除
- ✅ 所有表有 updated_at 触发器
- ✅ 完整的索引和约束
- ✅ 完善的注释文档

### 升级路径

- V1 → V4: 直接使用 migration_complete_v4.sql
- V2 → V4: 直接使用 migration_complete_v4.sql
- V3 → V4: 直接使用 migration_complete_v4.sql

## 常见问题

### Q: 迁移会丢失数据吗?
A: 不会。迁移脚本会保留所有现有数据。

### Q: 迁移需要多久?
A: 通常在几秒到几分钟,取决于数据量。

### Q: 可以部分迁移吗?
A: 可以,但建议完整迁移以保证数据一致性。

### Q: 迁移后前端需要修改吗?
A: 不需要,V4 版本与前端完全兼容。

## 联系支持

如有问题,请查看:
- 项目文档: README.md
- API文档: API_README.md
- 问题追踪: GitHub Issues
