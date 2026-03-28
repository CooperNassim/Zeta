# Zeta Trading System 数据库迁移完整指南

## 快速开始

### 一键迁移(推荐)

```bash
cd backend

# 完整迁移(包含备份)
npm run migrate

# 跳过备份的迁移
npm run migrate:skip-backup

# 验证迁移结果
npm run migrate:verify
```

## 详细步骤

### 步骤1: 备份当前数据

```bash
npm run backup
```

这会创建一个时间戳命名的备份文件在 `backups/` 目录。

### 步骤2: 运行迁移

```bash
# 使用默认迁移文件(migration_complete_v4.sql)
npm run migrate

# 或者指定其他迁移文件
node src/scripts/run_migration.js migration_fix_order_time.sql
```

### 步骤3: 验证迁移

```bash
npm run migrate:verify
```

这会检查:
- 所有表是否存在
- 触发器是否正确创建
- 函数是否正确创建
- 数据是否完整
- V4 规范是否符合

### 步骤4: (可选) 清理旧脚本

```bash
# 预览清理操作
npm run cleanup:scripts

# 执行清理(删除旧脚本)
npm run cleanup:scripts:delete
```

## 迁移文件说明

### 主要迁移文件

| 文件名 | 说明 | 状态 |
|--------|------|------|
| migration_complete_v4.sql | 完整的 V4 版本数据库结构 | ✅ 推荐使用 |
| migration_add_trade_fields.sql | 添加额外的交易字段 | ⚪ 可选 |
| migration_fix_order_time.sql | 修复订单时间问题 | ⚪ 可选 |
| migration_trading_strategy_id_trigger.sql | 添加策略ID触发器 | ⚪ 可选 |

### 已整合的迁移文件

以下迁移已经整合到 `migration_complete_v4.sql` 中:

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

### 已归档的迁移文件

以下迁移文件已移至 `migrations/archive/` 目录,供参考:

- migration_2026-03-11T13-40-37.sql
- migration_2026-03-11T14-59-11.sql
- migration_2026-03-12T15-38-07.sql
- migration_complete_v3.sql
- migration_complete_v3_fixed.sql
- migration_incremental_*.sql

## V4 版本特性

### 数据库规范

1. **时间类型**: 统一使用 `TIMESTAMPTZ`
2. **软删除**: 所有表支持 `deleted_at` 字段
3. **自动更新**: 所有表有 `updated_at` 触发器
4. **索引**: 完善的索引优化查询性能
5. **注释**: 完整的表和字段注释

### 表结构

V4 版本包含以下14个标准表:

1. **account** - 账户信息
2. **account_risk_data** - 账户风险数据
3. **daily_work_data** - 每日功课数据
4. **psychological_indicators** - 心理测试指标
5. **psychological_test_results** - 心理测试结果
6. **psychological_test_indicators** - 心理测试指标详情
7. **trading_strategies** - 交易策略
8. **risk_config** - 风险配置
9. **technical_indicators** - 技术指标
10. **orders** - 预约订单
11. **transactions** - 账单明细
12. **trade_records** - 交易记录
13. **stock_pool** - 股票池
14. **stock_kline_data** - 股票K线数据
15. **strategy_records** - 策略记录
16. **risk_models** - 风险模型

## 迁移前检查清单

- [ ] 已备份数据库
- [ ] 已阅读迁移指南
- [ ] 已停止前端应用
- [ ] 已确认数据库连接正常
- [ ] 已记录当前数据库状态

## 迁移后验证

```bash
# 1. 检查表结构
npm run migrate:verify

# 2. 启动后端服务
npm run dev

# 3. 测试API接口
curl http://localhost:3001/health

# 4. 检查数据完整性
# (手动检查关键数据是否正常)
```

## 故障排查

### 迁移失败

1. **检查错误日志**
   ```bash
   # 查看迁移脚本的输出
   npm run migrate 2>&1 | tee migration.log
   ```

2. **恢复备份**
   ```bash
   npm run restore
   ```

3. **手动执行SQL**
   ```bash
   psql -U postgres -d zeta_trading -f migrations/migration_complete_v4.sql
   ```

### 数据丢失

1. **检查备份文件**
   ```bash
   ls -lh backups/
   ```

2. **恢复最近的备份**
   ```bash
   npm run restore
   ```

### 验证失败

1. **检查缺失的表**
   ```bash
   node check_current_tables.js
   ```

2. **手动添加缺失的表**
   - 查看 migration_complete_v4.sql
   - 执行对应的 CREATE TABLE 语句

## 常见问题

### Q: 迁移会删除我的数据吗?

A: 不会。迁移脚本使用 `DROP TABLE IF EXISTS` 但在重新创建表之前不会删除数据。不过为了安全起见,强烈建议先备份。

### Q: 我可以只迁移部分表吗?

A: 不建议。V4 版本的表之间有关联关系,部分迁移可能导致数据不一致。

### Q: 迁移需要多长时间?

A: 通常在几秒到几分钟,取决于你的数据量。对于大型数据库,可能需要更长时间。

### Q: 迁移后前端需要修改吗?

A: 不需要。V4 版本与前端完全兼容。

### Q: 如何回滚迁移?

A: 恢复之前的备份文件:
   ```bash
   npm run restore -- --file backups/zeta-backup-YYYY-MM-DDTHH-MM-SS.json
   ```

## 高级用法

### 自定义迁移脚本

如果需要创建自定义迁移脚本:

1. 在 `migrations/` 目录创建新的 SQL 文件
2. 命名格式: `migration_YYYY-MM-DDTHH-MM-SS.sql`
3. 使用 V4 规范:
   - 使用 TIMESTAMPTZ
   - 添加 soft delete 支持
   - 创建必要的索引
   - 添加表和字段注释

### 增量迁移

对于大型数据库,可以使用增量迁移:

```bash
# 1. 备份
npm run backup

# 2. 执行增量迁移
psql -U postgres -d zeta_trading -f migrations/migration_incremental_*.sql

# 3. 验证
npm run migrate:verify
```

## 支持和反馈

如有问题或建议,请:

1. 查看项目文档: `README.md`
2. 查看API文档: `API_README.md`
3. 提交Issue到GitHub
4. 联系技术支持

## 版本历史

- **V4** (2026-03-19): 重构交易策略表,完善软删除支持
- **V3** (2026-03-12): 修正时间戳为 TIMESTAMPTZ
- **V2** (2026-03-11): 添加软删除支持
- **V1** (2026-03-11): 初始版本

## 许可证

MIT
