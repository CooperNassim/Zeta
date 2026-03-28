# Zeta Trading System 数据库迁移执行计划

## 项目背景

由于项目在家里电脑进行了大量数据库结构修改,产生了多个迁移脚本。当前公司电脑的数据库结构已与项目标准不一致,需要进行完整的数据库迁移和脚本整合优化。

## 目标

1. 将公司电脑数据库迁移到 V4 版本
2. 整合和优化所有迁移脚本
3. 清理过时的脚本文件
4. 建立规范的迁移流程

## 迁移前准备

### 1. 数据库备份

```bash
cd backend

# 创建完整备份
npm run backup

# 验证备份文件
ls -lh backups/
```

### 2. 检查当前状态

```bash
# 查看当前数据库表
node check_current_tables.js

# 记录当前状态
node check_current_tables.js > current_tables.txt
```

### 3. 停止服务

```bash
# 停止后端服务(如果在运行)
# Ctrl+C 或 kill process

# 停止前端服务(如果在运行)
# Ctrl+C 或 kill process
```

### 4. 确认数据库连接

检查 `.env` 文件中的数据库配置:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zeta_trading
DB_USER=postgres
DB_PASSWORD=your_password
```

测试连接:
```bash
node src/scripts/test_db.js
```

## 迁移执行步骤

### 步骤1: 执行迁移

```bash
# 执行完整迁移(包含自动备份)
npm run migrate

# 如果已手动备份,可以跳过备份步骤
npm run migrate:skip-backup
```

**预期输出:**
```
[INFO] 2026-03-28T... Starting database backup...
[INFO] 2026-03-28T... Backup completed: backups/pre-migration-backup-...
[INFO] 2026-03-28T... Reading migration script...
[INFO] 2026-03-28T... Migration script loaded (...)
[INFO] 2026-03-28T... Starting database migration...
[INFO] 2026-03-28T... Migration completed successfully
[INFO] 2026-03-28T... Verifying migration...
[INFO] 2026-03-28T... All expected tables found (14)
[SUCCESS] 2026-03-28T... Migration completed successfully!
```

### 步骤2: 验证迁移

```bash
npm run migrate:verify
```

**预期输出:**
```
========================================
Database Verification Report
========================================

1. Checking tables...
   Found 16 tables
   - account
   - account_risk_data
   ...
   [SUCCESS] All expected tables found (16)

2. Checking triggers...
   Found XX triggers
   ...

6. Validating V4 compliance...
   [SUCCESS] All V4 tables present (16)

========================================
Migration completed successfully!
========================================
```

### 步骤3: 数据验证

```bash
# 检查关键数据行数
node -e "const { Pool } = require('pg'); const pool = new Pool({ ... }); ..."

# 手动检查重要表
psql -U postgres -d zeta_trading -c "SELECT COUNT(*) FROM orders;"
psql -U postgres -d zeta_trading -c "SELECT COUNT(*) FROM trade_records;"
psql -U postgres -d zeta_trading -c "SELECT COUNT(*) FROM transactions;"
```

### 步骤4: 启动服务

```bash
# 启动后端
npm run dev

# 在另一个终端启动前端
cd ..
npm run dev
```

### 步骤5: 功能测试

- [ ] 首页加载正常
- [ ] 每日功课可以查看和编辑
- [ ] 心理测试可以提交
- [ ] 交易策略可以管理
- [ ] 风险模型可以配置
- [ ] 订单管理正常
- [ ] 交易记录正常
- [ ] 数据同步正常

## 迁移脚本整合

### 整合说明

以下迁移脚本已经整合到 `migration_complete_v4.sql`:

1. **psychological_test_refactor.sql** - 心理测试表重构
2. **psychological_test_timezone_fix.sql** - 时区修复
3. **risk_config_simple.sql** - 风险配置简化
4. **sync_soft_delete.sql** - 软删除同步
5. **trade_records_complete.sql** - 交易记录完整版
6. **trade_records_refactor.sql** - 交易记录重构
7. **trade_records_sync.sql** - 交易记录同步
8. **trading_strategy_refactor.sql** - 交易策略重构
9. **trading_strategy_revision_fix.sql** - 策略修订修复
10. **utc_time.sql** - UTC时间

### 脚本分类

#### 保留的脚本(主要)
- `migration_complete_v4.sql` - 完整V4版本
- `migration_add_trade_fields.sql` - 可选:添加额外字段
- `migration_fix_order_time.sql` - 可选:修复订单时间
- `migration_trading_strategy_id_trigger.sql` - 可选:策略ID触发器

#### 已归档的脚本(参考)
移至 `migrations/archive/` 目录:
- 所有带时间戳的迁移文件
- migration_v3 相关文件
- 所有已整合的迁移文件

#### 可删除的根目录脚本
- add_buy_order_id_field.js
- add_revision_column.js
- fix_buy_order_id.js
- fix_trade_records_schema.js
- migrate_deleted_fields.js
- migrate_trade_records_sync.js

## 清理操作

### 预览清理

```bash
npm run cleanup:scripts
```

### 执行清理

```bash
npm run cleanup:scripts:delete
```

**清理内容:**
1. 归档旧迁移脚本到 `migrations/archive/`
2. 归档临时脚本到 `archive/`
3. 删除过时的根目录脚本
4. 生成清理报告

## 回滚方案

### 完全回滚

如果迁移后出现严重问题:

```bash
# 1. 停止服务
# Ctrl+C

# 2. 删除数据库(谨慎!)
psql -U postgres -c "DROP DATABASE zeta_trading;"

# 3. 重新创建数据库
psql -U postgres -c "CREATE DATABASE zeta_trading;"

# 4. 恢复备份
npm run restore

# 5. 重启服务
npm run dev
```

### 部分回滚

如果只需要回滚特定表:

1. 查看 `migrations/archive/` 中的旧迁移脚本
2. 手动执行对应的 SQL
3. 或者从备份恢复单个表

## 验证清单

### 迁移前验证

- [ ] 数据库已备份
- [ ] 备份文件已验证
- [ ] 服务已停止
- [ ] 数据库连接正常
- [ ] 当前状态已记录

### 迁移后验证

- [ ] 迁移脚本执行成功
- [ ] 所有表已创建
- [ ] 所有触发器已创建
- [ ] 数据完整无丢失
- [ ] 服务启动正常
- [ ] API接口正常
- [ ] 前端功能正常
- [ ] 数据同步正常

## 风险和应对

### 风险1: 数据丢失

**概率**: 低  
**影响**: 高  
**应对**: 
- 迁移前完整备份
- 验证备份文件
- 保留旧备份7天

### 风险2: 迁移失败

**概率**: 中  
**影响**: 中  
**应对**:
- 使用事务执行
- 失败自动回滚
- 详细错误日志

### 风险3: 数据不一致

**概率**: 低  
**影响**: 中  
**应对**:
- 迁移后验证
- 数据对比检查
- 功能测试

### 风险4: 性能下降

**概率**: 低  
**影响**: 低  
**应对**:
- 分析执行计划
- 优化索引
- 监控查询性能

## 时间安排

### 预计时间

| 步骤 | 预计时间 |
|------|----------|
| 备份数据 | 1-2分钟 |
| 执行迁移 | 1-3分钟 |
| 验证迁移 | 1分钟 |
| 数据验证 | 2-5分钟 |
| 服务测试 | 5-10分钟 |
| **总计** | **10-21分钟** |

### 建议时间

- **工作日**: 周末或非交易时段
- **准备时间**: 提前1天准备好环境
- **执行时间**: 选择数据库负载较低时段

## 成功标准

迁移成功的标准:

1. ✅ 所有V4表都存在且结构正确
2. ✅ 所有数据都保留且完整
3. ✅ 所有触发器和函数正常工作
4. ✅ API接口全部正常
5. ✅ 前端功能全部正常
6. ✅ 数据同步功能正常
7. ✅ 无错误日志
8. ✅ 性能无明显下降

## 后续维护

### 定期备份

```bash
# 设置定时任务(cron)
# 每天凌晨2点备份
0 2 * * * cd /path/to/backend && npm run backup
```

### 监控脚本

创建监控脚本检查数据库健康:

```javascript
// monitor_db.js
const { Pool } = require('pg');
const pool = new Pool({ /* config */ });

async function monitor() {
  // 检查表数量
  // 检查数据行数
  // 检查最近错误
  // 发送报告
}
```

### 版本记录

维护一个版本变更日志:

```markdown
## 数据库版本历史

| 日期 | 版本 | 变更内容 | 执行人 |
|------|------|----------|--------|
| 2026-03-28 | V4 | 重构交易策略表,完善软删除 | xxx |
| 2026-03-12 | V3 | 修正时间戳为TIMESTAMPTZ | xxx |
| 2026-03-11 | V2 | 添加软删除支持 | xxx |
```

## 联系和反馈

如有问题或建议,请联系:

- **技术支持**: [邮箱]
- **项目文档**: MIGRATION_README.md
- **迁移指南**: migrations/MIGRATION_GUIDE.md

## 附录

### A. 常用命令速查

```bash
# 备份
npm run backup

# 恢复
npm run restore

# 迁移
npm run migrate

# 验证
npm run migrate:verify

# 清理脚本
npm run cleanup:scripts

# 检查表
node check_current_tables.js

# 连接数据库
psql -U postgres -d zeta_trading
```

### B. 故障排除

详见 `MIGRATION_README.md` 中的故障排查章节。

### C. 参考文档

- PostgreSQL官方文档: https://www.postgresql.org/docs/
- Node.js pg库文档: https://node-postgres.com/
- 项目README: README.md
- API文档: API_README.md

---

**文档版本**: 1.0  
**最后更新**: 2026-03-28  
**维护者**: Zeta Team
