# 数据库迁移指南

**从家里电脑迁移数据库到公司电脑，无需使用迁移工具。**

---

## 步骤一：在家庭电脑导出数据库

### 1. 运行导出脚本

在家庭电脑的 `backend` 目录下运行：

```bash
cd backend
node src/scripts/export_schema.js
```

### 2. 查看生成的迁移文件

导出文件会生成在：`backend/migrations/migration_YYYY-MM-DDTHH-MM-SS.sql`

例如：`backend/migrations/migration_2026-03-11T13-40-37.sql`

### 3. 验证导出内容

打开生成的SQL文件，检查包含：
- ✅ 所有表的CREATE TABLE语句
- ✅ 所有表的约束（主键、唯一约束等）
- ✅ 所有索引
- ✅ 所有现有数据的INSERT语句

---

## 步骤二：复制迁移文件到公司电脑

### 方法1：通过Git上传

```bash
git add backend/migrations/
git commit -m "添加数据库迁移文件"
git push origin main
```

### 方法2：通过U盘/云盘复制

直接复制整个 `migrations` 文件夹到公司电脑的相同位置：
`d:/Code/Zeta/backend/migrations/`

---

## 步骤三：在公司电脑导入数据库

### 1. 确保PostgreSQL已安装并运行

检查服务状态：
```bash
psql -U postgres -c "SELECT version();"
```

### 2. 创建数据库（如果不存在）

```bash
psql -U postgres
CREATE DATABASE zeta_trading;
\q
```

### 3. 更新数据库配置

确保 `backend/src/config/database.js` 中的配置正确：

```javascript
module.exports = {
  pool: new Pool({
    host: 'localhost',
    port: 5432,
    database: 'zeta_trading',
    user: 'postgres',
    password: '你的密码'
  })
};
```

### 4. 运行导入脚本

```bash
cd backend
node src/scripts/import_schema.js
```

或指定具体的迁移文件：
```bash
node src/scripts/import_schema.js migrations/migration_2026-03-11T13-40-37.sql
```

### 5. 验证导入结果

查看导入输出：
```
✅ 导入完成！
成功: XXX 条
失败: 0 条
```

---

## 步骤四：验证数据库

### 连接数据库检查

```bash
psql -U postgres -d zeta_trading
```

### 检查所有表

```sql
\dt
```

应该看到16个表：
- account
- account_risk_data
- daily_work_data
- psychological_indicators
- technical_indicators
- trading_strategies
- risk_models
- risk_config
- orders
- transactions
- trade_records
- stock_pool
- stock_kline_data
- strategy_records

### 检查数据

```sql
-- 检查每日功课数据
SELECT COUNT(*) FROM daily_work_data;

-- 检查账户数据
SELECT * FROM account;

-- 检查自选股
SELECT COUNT(*) FROM stock_pool;
```

---

## 📝 更新迁移文件

当数据库有改动时，使用以下方法更新迁移文件：

### 方法一：一键更新（推荐）

**自动备份旧文件并重新生成：**
```bash
cd backend
node src/scripts/update_migration.js
```

这个脚本会：
1. ✅ 自动备份旧的迁移文件到 `migrations/backup/`
2. ✅ 重新生成完整迁移文件
3. ✅ 生成增量迁移文件（仅表结构）
4. ✅ 显示所有迁移文件列表

### 方法二：手动重新生成

```bash
cd backend
node src/scripts/export_schema.js
```

### 方法三：仅生成增量更新

如果只是修改了表结构（添加字段、修改约束等），可以只生成增量迁移：

```bash
cd backend
node src/scripts/export_schema_incremental.js
```

生成的文件包含 `ALTER TABLE` 语句，可以安全地应用到现有数据库而不删除数据。

### 迁移文件说明

生成的文件类型：

| 文件名 | 说明 | 包含内容 | 用途 |
|--------|------|----------|------|
| `migration_YYYY-MM-DDTHH-MM-SS.sql` | 完整迁移 | 表结构 + 所有数据 | 首次导入或完全重建 |
| `migration_incremental_YYYY-MM-DDTHH-MM-SS.sql` | 增量迁移 | 仅表结构（ALTER语句） | 更新表结构 |

### 使用示例

**场景1：添加新表**
```bash
# 1. 添加新表到数据库
# 2. 更新迁移文件
node src/scripts/update_migration.js

# 3. 在公司电脑导入
node src/scripts/import_schema.js
```

**场景2：添加新字段到现有表**
```bash
# 1. 添加新字段
ALTER TABLE daily_work_data ADD COLUMN new_field VARCHAR(100);

# 2. 更新迁移文件
node src/scripts/update_migration.js

# 3. 在公司电脑可以选择：
#    - 选项A：使用完整迁移（会重建表，删除数据）
node src/scripts/import_schema.js

#    - 选项B：手动编辑增量迁移文件，取消需要的ALTER语句注释
#    - 然后执行
psql -U postgres -d zeta_trading -f migrations/migration_incremental_2026-03-11T13-40-37.sql
```

**场景3：修改字段类型或约束**
```bash
# 1. 修改字段（注意：可能需要数据迁移）
ALTER TABLE daily_work_data ALTER COLUMN nasdaq TYPE VARCHAR(50);

# 2. 更新迁移文件
node src/scripts/update_migration.js

# 3. 在公司电脑执行（注意：会重建表）
node src/scripts/import_schema.js
```

### 迁移历史管理

旧的迁移文件会自动备份到 `migrations/backup/` 目录：

```
migrations/
├── backup/
│   ├── migration_2026-03-10T10-00-00.sql.bak
│   └── migration_2026-03-11T08-30-00.sql.bak
├── migration_2026-03-10T10-00-00.sql
├── migration_2026-03-11T08-30-00.sql
└── migration_2026-03-11T13-40-37.sql (最新)
```

---

## 常见问题

### Q1: 导入时提示表已存在怎么办？

**解决方案：** 迁移脚本会自动删除已存在的表再重建。如果你担心数据丢失，可以先手动备份数据库：

```bash
pg_dump -U postgres zeta_trading > backup_before_migration.sql
```

### Q2: 导入失败怎么办？

**解决方案：**
1. 检查数据库连接配置是否正确
2. 检查PostgreSQL服务是否运行
3. 查看错误日志：`backend/logs/error.log`

### Q3: 如何只迁移表结构，不迁移数据？

**解决方案：** 编辑生成的SQL文件，删除所有 `INSERT INTO` 语句。

### Q4: 两台电脑都有数据，如何合并？

**解决方案：** 需要手动处理数据冲突：
1. 分别导出两台电脑的数据
2. 手动合并SQL文件
3. 处理重复数据（通过DELETE或UPDATE）
4. 导入合并后的SQL文件

### Q5: 后续如何持续同步？

**解决方案：** 创建增量迁移脚本：

```javascript
// backend/src/scripts/export_daily.js
const fs = require('fs');
const { pool } = require('../config/database');

async function exportDailyChanges() {
  // 导出今天新增/修改的数据
  const result = await pool.query(`
    SELECT * FROM daily_work_data
    WHERE DATE(updated_at) = CURRENT_DATE
  `);
  // 保存为SQL文件...
}

exportDailyChanges();
```

---

## 自动化脚本（可选）

### package.json中添加快捷命令

编辑 `backend/package.json`，在 `scripts` 部分添加：

```json
{
  "scripts": {
    "db:export": "node src/scripts/export_schema.js",
    "db:import": "node src/scripts/import_schema.js",
    "db:backup": "pg_dump -U postgres zeta_trading > backups/backup_$(date +%Y%m%d_%H%M%S).sql"
  }
}
```

使用：
```bash
npm run db:export   # 导出
npm run db:import   # 导入
npm run db:backup   # 备份
```

---

## 安全建议

1. **定期备份**：每次修改前先备份
2. **测试导入**：先在测试环境验证迁移脚本
3. **版本控制**：重要的迁移脚本提交到Git
4. **敏感数据**：密码等敏感信息不要包含在迁移文件中

---

## 联系支持

如果遇到问题，请提供：
1. 错误信息
2. 迁移文件内容（敏感信息可脱敏）
3. 数据库版本：`psql --version`
4. Node.js版本：`node --version`
