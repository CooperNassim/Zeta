# Zeta 智能交易系统

## 项目概述

Zeta 是一个基于 React 的智能交易管理系统，集成了心理测试、交易策略、风险模型等智能评估功能。系统采用前后端分离架构，支持模拟交易和实盘交易两种模式。

**注意**: 本项目为**智能交易辅助系统**，仅供学习和研究使用。交易有风险，投资需谨慎。本系统不对使用者的交易损失承担任何责任。

## 技术栈

### 前端
- **React 18** - 前端框架
- **Vite 7** - 构建工具
- **Tailwind CSS** - 样式框架
- **Framer Motion** - 动画库
- **Zustand** - 状态管理
- **Lucide React** - 图标库
- **date-fns** - 日期处理
- **Recharts** - 图表库
- **React Router DOM** - 路由管理

### 后端
- **Node.js** - 运行时环境
- **Express** - Web 框架
- **PostgreSQL** - 关系型数据库
- **pg** - PostgreSQL 客户端

## 项目结构

```
Zeta/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # 数据库配置
│   │   ├── controllers/
│   │   │   └── transactionController.js
│   │   ├── database/
│   │   │   └── queries.js      # 数据库操作封装
│   │   ├── routes/
│   │   │   ├── admin.js        # 管理后台路由
│   │   │   └── api.js          # 核心API路由
│   │   ├── scripts/             # 核心运维脚本
│   │   │   ├── backup.js       # 数据库备份
│   │   │   ├── restore.js      # 数据恢复
│   │   │   ├── initDatabase.js # 初始化数据库
│   │   │   ├── run_migration.js # 运行迁移
│   │   │   ├── migrate.js      # 数据迁移
│   │   │   ├── export_schema.js # 导出数据库结构
│   │   │   └── import_schema.js # 导入数据库结构
│   │   └── server.js           # 服务器入口
│   ├── migrations/              # 数据库迁移文件
│   │   ├── archive/            # 历史迁移归档
│   │   └── *.sql              # 迁移脚本
│   └── package.json
├── src/                        # 前端源码
│   ├── components/             # React 组件
│   │   ├── DataTable.jsx      # 数据表格
│   │   ├── Modal.jsx          # 模态框
│   │   ├── Toast.jsx          # 提示消息
│   │   └── ...
│   ├── contexts/              # React Context
│   │   └── ToastContext.jsx   # Toast状态管理
│   ├── pages/                 # 页面组件
│   │   ├── Home.jsx           # 首页
│   │   ├── DailyWork.jsx      # 每日功课
│   │   ├── PsychologicalTest.jsx # 心理测试
│   │   ├── TradingStrategy.jsx  # 交易策略
│   │   ├── RiskModel.jsx      # 风险模型
│   │   ├── OrderManagement.jsx  # 预约单管理
│   │   ├── TransactionHistory.jsx # 账单明细
│   │   ├── TradeRecords.jsx   # 交易记录
│   │   ├── StockPool.jsx      # 股票池
│   │   ├── TechnicalIndicators.jsx # 技术指标
│   │   └── ...
│   ├── services/              # API服务
│   │   ├── apiClient.js       # API客户端
│   │   ├── akshareApi.js     # AKShare数据源
│   │   ├── tushareApi.js     # TuShare数据源
│   │   └── marketDataService.js # 市场数据服务
│   ├── store/
│   │   └── useStore.js       # Zustand状态管理
│   ├── utils/
│   │   ├── stockApi.js       # 股票API工具
│   │   └── technicalIndicators.js # 技术指标计算
│   ├── App.jsx               # 应用入口
│   └── main.jsx             # React渲染入口
├── public/                   # 静态资源
├── package.json              # 前端依赖
└── docker-compose.yml        # Docker配置
```

## 核心功能模块

### 1. 首页 (Home)
- 机器人动画效果
- 实时统计数据展示
- 核心功能入口

### 2. 每日功课 (DailyWork)
- 维护全球资产价格指数
- 支持股票、加密货币、外汇等类型
- 实时涨跌显示
- 定时刷新功能

### 3. 心理测试 (PsychologicalTest)
- 每日心理状态评估
- 5项指标评分（身体状态、昨日交易、交易计划、情绪状态、工作量）
- 历史记录查询
- 测试结果统计分析

### 4. 交易策略 (TradingStrategy)
- 买入策略管理
- 卖出策略管理
- 多条件评估机制
- 策略评分系统

### 5. 风险模型 (RiskModel)
- 多种风险管控模型（保守型、平衡型、激进型）
- 仓位计算模拟器
- 自动计算建议买入数量
- 实时风控监控

### 6. 预约单 (OrderManagement)
- 智能评估流程：心理测试 → 策略评估 → 风险控制
- 买入/卖出预约
- 执行和取消功能
- 预约单状态追踪

### 7. 账单明细 (TransactionHistory)
- 自动记录交易流水
- 手动入账/出账
- 资金变动统计
- 账户余额管理

### 8. 交易记录 (TradeRecords)
- 买入/卖出记录
- 评分统计
- 盈亏分析
- 交易编号自动生成

## 数据库设计

### 核心数据表

| 表名 | 说明 | 软删除 |
|------|------|--------|
| account | 账户信息 | 否 |
| daily_work_data | 每日功课数据 | 是 |
| psychological_indicators | 心理测试指标 | 否 |
| psychological_test_results | 心理测试结果 | 是 |
| trading_strategies | 交易策略 | 是 |
| risk_config | 风险配置 | 否 |
| technical_indicators | 技术指标 | 否 |
| trade_orders | 预约单 | 是 |
| transactions | 账单明细 | 是 |
| trade_records | 交易记录 | 是 |
| stock_pool | 股票池 | 是 |
| stock_kline_data | 股票K线数据 | 否 |
| strategy_records | 策略评估记录 | 是 |

### 软删除机制

系统支持软删除机制，主要数据表包含：
- `deleted` (boolean): 是否已删除
- `deleted_at` (timestamp): 删除时间

查询时会自动过滤已删除数据，如需包含已删除数据，可设置 `includeDeleted: true`。

## API 接口

### 基础信息
- 基础路径: `/api`
- 数据格式: JSON
- 认证方式: 无（开发模式）

### 核心接口

#### 同步数据
```
GET /api/sync/all
```
获取所有表的同步数据。

#### 导出数据
```
GET /api/export/all
```
导出所有数据。

#### 预约单 CRUD
```
GET    /api/trade-orders        # 获取预约单列表
POST   /api/trade-orders        # 创建预约单
PUT    /api/trade-orders/:id    # 更新预约单
DELETE /api/trade-orders/:id    # 删除预约单（软删除）
```

#### 交易记录 CRUD
```
GET    /api/trade-records       # 获取交易记录
POST   /api/trade-records       # 创建交易记录
PUT    /api/trade-records/:id   # 更新交易记录
DELETE /api/trade-records/:id   # 删除交易记录
```

#### 账单明细 CRUD
```
GET    /api/transactions        # 获取账单列表
POST   /api/transactions        # 创建账单
PUT    /api/transactions/:id    # 更新账单
DELETE /api/transactions/:id    # 删除账单
```

#### 心理测试 CRUD
```
GET    /api/psychological-tests       # 获取测试结果
POST   /api/psychological-tests       # 创建测试结果
PUT    /api/psychological-tests/:date # 更新指定日期结果
```

#### 交易策略 CRUD
```
GET    /api/strategies           # 获取策略列表
POST   /api/strategies           # 创建策略
PUT    /api/strategies/:id       # 更新策略
DELETE /api/strategies/:id       # 删除策略
```

#### 健康检查
```
GET /health      # 服务健康检查
GET /health/db   # 数据库连接检查
```

## 环境配置

### 前端环境变量 (.env)
```env
VITE_API_URL=http://localhost:3001
```

### 后端环境变量 (backend/.env)
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zeta_trading
DB_USER=postgres
DB_PASSWORD=your_password
NODE_ENV=development
CORS_ORIGIN=true
```

## 开发指南

### 安装依赖

```bash
# 前端
npm install

# 后端
cd backend
npm install
```

### 启动开发服务器

```bash
# 前端开发服务器 (端口 5173)
npm run dev

# 后端开发服务器 (端口 3001)
cd backend
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm run preview
```

## 数据库操作

### 初始化数据库
```bash
cd backend
npm run init-db
```

### 运行迁移
```bash
cd backend
npm run migrate
```

### 验证迁移
```bash
cd backend
npm run migrate:verify
```

### 导出数据库结构
```bash
cd backend
npm run db:export
```

### 增量导出
```bash
cd backend
npm run db:incremental
```

### 导入数据
```bash
cd backend
npm run db:import
```

### 数据库备份
```bash
cd backend
npm run backup
```

### 数据恢复
```bash
cd backend
npm run restore
```

## Docker 部署

### 构建镜像
```bash
docker build -t zeta-trading-system .
```

### 启动容器
```bash
docker-compose up -d
```

### 停止容器
```bash
docker-compose down
```

## 故障排查

### 数据库连接失败
1. 检查 PostgreSQL 服务是否启动
2. 验证 .env 中的数据库配置
3. 确认数据库已创建

### 前端无法连接后端
1. 检查后端服务是否运行在端口 3001
2. 验证 Vite 代理配置 (vite.config.js)
3. 检查 CORS 配置

### 数据同步问题
1. 清除浏览器缓存
2. 检查 localStorage 数据
3. 重启后端服务

## 更新日志

### v1.0.0
- 初始版本发布
- 包含心理测试、交易策略、风险模型等核心功能
- 支持软删除和数据同步

---

*最后更新: 2026-04-26*
