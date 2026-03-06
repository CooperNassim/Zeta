# Zeta 交易系统 - 后端服务

基于 Node.js + PostgreSQL 的交易系统后端服务，支持一键备份和恢复功能。

## 功能特性

- ✅ RESTful API 接口
- ✅ PostgreSQL 数据库
- ✅ 一键数据导出
- ✅ 一键数据导入
- ✅ 支持多设备同步

## 目录结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # 数据库连接配置
│   ├── database/
│   │   ├── init.sql          # 数据库初始化SQL（不要提交到git）
│   │   └── queries.js        # 数据库查询封装
│   ├── routes/
│   │   └── api.js            # API路由
│   ├── scripts/
│   │   ├── initDatabase.js   # 初始化数据库
│   │   ├── backup.js         # 备份数据
│   │   └── restore.js        # 恢复数据
│   └── server.js             # 服务器入口
├── backups/                  # 备份文件目录（不要提交到git）
├── .env                      # 环境变量（不要提交到git）
├── .env.example              # 环境变量示例
└── package.json
```

## 快速开始

### 1. 安装 PostgreSQL

确保你已经安装了 PostgreSQL 数据库：

**Windows:**
- 下载安装：https://www.postgresql.org/download/windows/
- 安装时记住设置的用户名和密码

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. 创建数据库

```bash
# 进入PostgreSQL命令行
psql -U postgres

# 创建数据库
CREATE DATABASE zeta_trading;

# 退出
\q
```

### 3. 安装依赖

```bash
cd backend
npm install
```

### 4. 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3001
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zeta_trading
DB_USER=postgres
DB_PASSWORD=your_password_here

# CORS配置
CORS_ORIGIN=http://localhost:5173

# 备份目录
BACKUP_DIR=./backups
```

### 5. 初始化数据库

```bash
npm run init-db
```

这会创建所有表并插入默认数据。

### 6. 启动服务器

**开发模式（自动重启）：**
```bash
npm run dev
```

**生产模式：**
```bash
npm start
```

服务器将在 `http://localhost:3001` 启动。

## 使用说明

### API 接口

#### 通用 CRUD 接口

```bash
# 获取列表
GET /api/:table?where={"status":"pending"}&orderBy=created_at&limit=10

# 获取单条
GET /api/:table/:id

# 创建
POST /api/:table
Body: {"field1": "value1", "field2": "value2"}

# 批量创建
POST /api/:table/bulk
Body: [{"field1": "value1"}, {"field2": "value2"}]

# 更新
PUT /api/:table/:id
Body: {"field1": "new_value"}

# 删除
DELETE /api/:table/:id

# 批量删除
DELETE /api/:table/bulk
Body: {"ids": [1, 2, 3]}
```

#### 数据同步接口

```bash
# 同步所有数据（从数据库获取）
GET /api/sync/all

# 导出所有数据（下载JSON文件）
GET /api/export/all

# 导入数据
POST /api/import/all
Body: {
  "data": {
    "account": [...],
    "orders": [...],
    ...
  }
}
```

### 一键备份和恢复

#### 备份数据

```bash
npm run backup
```

备份文件会保存在 `backups/` 目录，文件名格式：`zeta-backup-2024-03-06T10-30-00.json`

#### 恢复数据

**恢复最新的备份：**
```bash
npm run restore
```

**恢复指定的备份：**
```bash
npm run restore -- --file backups/zeta-backup-2024-03-06T10-30-00.json
```

## 多设备同步方案

### 公司电脑 → 家里电脑

**步骤1：在公司电脑备份数据**
```bash
cd backend
npm run backup
```

**步骤2：复制备份文件到家里电脑**
- 通过U盘、网盘或邮件等方式将备份文件（`backups/zeta-backup-*.json`）复制到家里电脑的 `backend/backups/` 目录

**步骤3：在恢复数据前，先备份家里电脑的数据**
```bash
cd backend
npm run backup
```

**步骤4：在恢复数据前，先检查恢复的数据，并手动合并后再恢复**
```bash
npm run restore -- --file backups/zeta-backup-2024-03-06T10-30-00.json
```

### 家里电脑 → 公司电脑

操作同上，方向相反。

### 冲突处理

如果两台电脑都有新数据，建议：

1. **手动合并**：
   - 打开两个备份文件
   - 对比差异
   - 手动合并数据
   - 创建新的合并后的备份文件
   - 导入合并后的数据

2. **时间戳优先**：
   - 比较两边的最后更新时间
   - 选择较新的数据覆盖较旧的数据

## 数据库表结构

系统包含以下14张表：

- `account` - 账户信息
- `daily_work_data` - 每日功课数据
- `psychological_indicators` - 心理测试指标
- `psychological_tests` - 心理测试记录
- `trading_strategies` - 交易策略
- `risk_models` - 风险模型
- `risk_config` - 风险配置
- `account_risk_data` - 账户风险数据
- `technical_indicators` - 技术指标
- `orders` - 预约订单
- `transactions` - 账单明细
- `trade_records` - 交易记录
- `stock_pool` - 股票池
- `stock_kline_data` - 股票K线数据
- `strategy_records` - 策略记录

## 安全注意事项

1. **不要提交敏感文件到 Git**：
   - `.env` 文件包含数据库密码
   - `backups/` 目录包含用户数据
   - `src/database/init.sql` 包含数据库结构

2. **保护备份文件**：
   - 备份文件包含所有交易数据
   - 不要将备份文件上传到公开仓库
   - 建议加密备份文件

3. **定期备份**：
   - 建议每天备份一次
   - 保留最近7天的备份文件

## 故障排查

### 数据库连接失败

```bash
# 检查PostgreSQL是否运行
# Windows
services.msc

# Mac/Linux
ps aux | grep postgres

# 检查端口是否被占用
netstat -an | grep 5432
```

### 备份文件损坏

备份文件是JSON格式，可以用文本编辑器打开检查。

### 恢复数据失败

1. 检查备份文件是否完整
2. 检查数据库版本是否兼容
3. 查看错误日志了解具体原因

## API 文档

启动服务器后访问：

- 健康检查：`http://localhost:3001/health`
- 数据库状态：`http://localhost:3001/health/db`

## 开发建议

1. **使用 nodemon**：开发时使用 `npm run dev`，代码修改后自动重启
2. **查看日志**：使用 Morgan 中间件记录所有请求
3. **调试模式**：设置 `NODE_ENV=development` 查看详细日志

## 生产部署

1. 使用 PM2 管理进程：
```bash
npm install -g pm2
pm2 start src/server.js --name zeta-backend
```

2. 配置反向代理（Nginx）

3. 启用 HTTPS

4. 设置定期备份任务（Cron）

## 许可证

MIT
