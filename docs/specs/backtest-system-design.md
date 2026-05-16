# 股票回测系统设计规格文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | Zeta 智能交易系统 - 股票回测模块 |
| 设计日期 | 2026-05-16 |
| 设计人员 | AI Assistant |
| 文档版本 | v1.0 |
| 状态 | 待实施 |

---

## 1. 概述

### 1.1 目标

为 Zeta 智能交易系统的"研究院"模块新增**股票回测功能**，提供独立的回测引擎，支持用户自定义技术指标参数、止损止盈条件、仓位管理等，对历史股票数据进行回测分析，并展示详细的绩效指标和可视化结果。

### 1.2 核心定位

- **独立模块**：与现有交易策略、风险模型等模块无关
- **专业回测**：支持多种技术指标、止损止盈类型、仓位管理模式
- **参数优化**：支持参数组合遍历，找出最优参数
- **详细展示**：回测时间、绩效指标、资金曲线、回撤曲线、交易明细

### 1.3 关键约束

- 纯前端回测引擎（JavaScript + Web Worker）
- 复用现有项目架构：React 18 + Vite 7 + Zustand + PostgreSQL
- UI 使用 Tailwind CSS 3 和玻璃拟态设计风格
- 图表使用 Recharts
- 所有 UI 文本使用中文

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────┐
│               BacktestSystem.jsx                 │
│  (回测主页面：条件配置 + 结果展示)                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌───────────────────────────┐ │
│  │ 条件配置面板  │  │ 回测结果展示区              │ │
│  │ - 股票选择   │  │ - 绩效指标卡片             │ │
│  │ - 时间范围   │  │ - 资金曲线图               │ │
│  │ - 技术指标   │  │ - 回撤曲线图               │ │
│  │ - 止损止盈   │  │ - 交易明细表               │ │
│  │ - 仓位管理   │  │ - 参数优化结果             │ │
│  └─────────────┘  └───────────────────────────┘ │
├─────────────────────────────────────────────────┤
│              BacktestEngine.js                    │
│         (纯 JavaScript 回测引擎)                  │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │ 数据加载器│ │ 信号生成器│ │ 订单执行器       │ │
│  │ DataLoader│ │ SignalGen│ │ OrderExecutor   │ │
│  └──────────┘ └──────────┘ └─────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │ 风控管理器│ │ 绩效计算器│ │ 参数优化器       │ │
│  │RiskManager│ │PerfCalc  │ │ ParamOptimizer  │ │
│  └──────────┘ └──────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────┤
│              Web Worker (可选)                    │
│           (大数据量时异步计算)                     │
└─────────────────────────────────────────────────┘
```

### 2.2 数据流

```
用户配置条件 → 信号生成器 → 买卖信号
                   ↓
历史K线数据 → 订单执行器 → 交易记录
                   ↓
            绩效计算器 → 绩效指标
                   ↓
            结果展示组件 → 用户界面
```

### 2.3 核心模块职责

| 模块 | 文件路径 | 职责 | 输入 | 输出 |
|------|----------|------|------|------|
| DataLoader | `src/utils/backtest/DataLoader.js` | 加载历史K线数据 | 股票代码、时间范围 | OHLCV 数组 |
| SignalGenerator | `src/utils/backtest/SignalGenerator.js` | 根据指标参数生成买卖信号 | K线数据、指标配置 | 买卖信号数组 |
| OrderExecutor | `src/utils/backtest/OrderExecutor.js` | 执行交易，计算持仓和资金 | 信号、止损止盈、仓位规则 | 交易记录、资金曲线 |
| RiskManager | `src/utils/backtest/RiskManager.js` | 风控检查（止损、止盈、仓位限制） | 当前持仓、价格 | 是否触发风控 |
| PerformanceCalculator | `src/utils/backtest/PerformanceCalculator.js` | 计算绩效指标 | 交易记录、资金曲线 | 收益率、回撤、夏普等 |
| ParameterOptimizer | `src/utils/backtest/ParameterOptimizer.js` | 参数优化，遍历参数组合 | 参数范围、优化目标 | 最优参数、对比结果 |
| BacktestEngine | `src/utils/backtest/BacktestEngine.js` | 引擎入口，协调各模块 | 完整回测配置 | 完整回测结果 |

---

## 3. 回测引擎核心算法

### 3.1 信号生成器 (SignalGenerator)

#### 3.1.1 算法流程

```javascript
class SignalGenerator {
  generate(klineData, config) {
    // 1. 计算技术指标
    const indicators = this.calculateIndicators(klineData, config.indicators);
    
    // 2. 生成买卖信号
    const signals = [];
    for (let i = 0; i < klineData.length; i++) {
      const buySignal = this.checkBuyConditions(indicators, i, config.buyConditions);
      const sellSignal = this.checkSellConditions(indicators, i, config.sellConditions);
      
      if (buySignal) signals.push({ type: 'BUY', index: i, ...buySignal });
      if (sellSignal) signals.push({ type: 'SELL', index: i, ...sellSignal });
    }
    
    return signals;
  }
}
```

#### 3.1.2 支持的技术指标条件

| 指标类型 | 买入条件示例 | 卖出条件示例 | 参数 |
|----------|-------------|-------------|------|
| **MA 均线** | 短期 MA 上穿长期 MA（金叉） | 短期 MA 下穿长期 MA（死叉） | 短期周期、长期周期 |
| **MACD** | DIF 上穿 DEA | DIF 下穿 DEA | 快线周期(12)、慢线周期(26)、信号线周期(9) |
| **RSI** | RSI < 超卖阈值（如30） | RSI > 超买阈值（如70） | 周期(14)、超买阈值、超卖阈值 |
| **KDJ** | K 上穿 D | K 下穿 D | N周期(9)、M1(3)、M2(3) |
| **BOLL** | 价格突破下轨 | 价格突破上轨 | 周期(20)、标准差倍数(2) |
| **成交量** | 成交量 > 量比阈值 × MA成交量 | 成交量 < 缩量阈值 × MA成交量 | 量比阈值、均线周期 |

### 3.2 订单执行器 (OrderExecutor)

#### 3.2.1 核心执行逻辑

```javascript
class OrderExecutor {
  execute(signals, klineData, config) {
    let cash = config.initialCapital;
    let position = 0; // 持仓数量
    const trades = [];
    const equityCurve = [];
    
    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      const price = klineData[i].close;
      
      // 检查止损止盈
      const riskAction = this.riskManager.check(position, price, config);
      
      if (signal.type === 'BUY' && position === 0 && !riskAction.sell) {
        // 买入
        const amount = this.positionSizer.calculate(cash, price, config);
        const cost = amount * price * (1 + config.commissionRate);
        if (cost <= cash) {
          cash -= cost;
          position = amount;
          trades.push({ type: 'BUY', price, amount, date: klineData[i].date });
        }
      } else if (signal.type === 'SELL' && position > 0 || riskAction.sell) {
        // 卖出
        const revenue = position * price * (1 - config.commissionRate);
        const pnl = revenue - (trades.find(t => t.type === 'BUY' && !t.closed)?.amount || 0) * price;
        cash += revenue;
        trades.push({ type: 'SELL', price, amount: position, pnl, date: klineData[i].date });
        position = 0;
      }
      
      equityCurve.push({
        date: klineData[i].date,
        equity: cash + position * price,
        cash,
        position
      });
    }
    
    return { trades, equityCurve };
  }
}
```

### 3.3 止损止盈类型

| 类型 | 描述 | 参数 | 触发条件 |
|------|------|------|----------|
| **固定止损** | 亏损达到固定百分比止损 | 止损百分比（如5%） | `currentPnL / cost <= -stopLoss%` |
| **移动止损** | 从最高点回撤指定百分比止损 | 回撤百分比（如8%） | `(peakPrice - currentPrice) / peakPrice <= -trailingStop%` |
| **ATR 止损** | 基于 ATR 指标动态止损 | ATR 倍数（如2） | `entryPrice - currentPrice >= ATR * multiplier` |
| **时间止损** | 持有超过 N 天未盈利止损 | 最大持有天数 | `holdingDays > maxDays && pnl <= 0` |
| **固定止盈** | 盈利达到固定百分比止盈 | 止盈百分比（如10%） | `currentPnL / cost >= takeProfit%` |
| **跟踪止盈** | 从最高点回撤指定百分比止盈 | 回撤百分比（如5%） | `(peakPrice - currentPrice) / peakPrice >= trailingTakeProfit%` |

### 3.4 仓位管理

| 模式 | 描述 | 参数 | 计算公式 |
|------|------|------|----------|
| **固定金额** | 每次买入固定金额 | 买入金额 | `amount = fixedAmount / price` |
| **固定比例** | 每次买入可用资金的固定比例 | 买入比例 | `amount = (cash * ratio) / price` |
| **固定股数** | 每次买入固定股数 | 买入股数 | `amount = fixedShares` |
| **凯利公式** | 根据胜率和盈亏比计算最优仓位 | 无（自动计算） | `f* = (bp - q) / b` |

---

## 4. 数据库设计

### 4.1 数据库表

#### 4.1.1 `backtest_configs` - 回测配置表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 主键 |
| name | VARCHAR(100) | NOT NULL | 回测名称 |
| description | TEXT | NULL | 描述 |
| stock_codes | TEXT[] | NOT NULL | 股票代码数组 |
| start_date | DATE | NOT NULL | 开始日期 |
| end_date | DATE | NOT NULL | 结束日期 |
| indicators | JSONB | NOT NULL | 技术指标配置 |
| buy_conditions | JSONB | NOT NULL | 买入条件 |
| sell_conditions | JSONB | NOT NULL | 卖出条件 |
| stop_loss | JSONB | NULL | 止损配置 |
| take_profit | JSONB | NULL | 止盈配置 |
| position_sizing | JSONB | NOT NULL | 仓位管理配置 |
| initial_capital | DECIMAL(15,2) | NOT NULL DEFAULT 100000 | 初始资金 |
| commission_rate | DECIMAL(5,4) | NOT NULL DEFAULT 0.0003 | 手续费率 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |
| deleted | BOOLEAN | DEFAULT FALSE | 软删除标记 |

#### 4.1.2 `backtest_results` - 回测结果表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 主键 |
| config_id | UUID | NOT NULL, FK | 关联配置ID |
| total_return | DECIMAL(8,4) | NULL | 总收益率 |
| annual_return | DECIMAL(8,4) | NULL | 年化收益率 |
| max_drawdown | DECIMAL(8,4) | NULL | 最大回撤 |
| sharpe_ratio | DECIMAL(8,4) | NULL | 夏普比率 |
| win_rate | DECIMAL(5,2) | NULL | 胜率 |
| profit_loss_ratio | DECIMAL(8,4) | NULL | 盈亏比 |
| total_trades | INTEGER | NULL | 总交易次数 |
| avg_holding_days | DECIMAL(8,2) | NULL | 平均持仓天数 |
| calmar_ratio | DECIMAL(8,4) | NULL | 卡尔玛比率 |
| sortino_ratio | DECIMAL(8,4) | NULL | 索提诺比率 |
| trades | JSONB | NULL | 交易明细 |
| equity_curve | JSONB | NULL | 资金曲线数据 |
| drawdown_curve | JSONB | NULL | 回撤曲线数据 |
| run_time | INTERVAL | NULL | 回测耗时 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

#### 4.1.3 `backtest_optimizations` - 参数优化结果表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 主键 |
| config_id | UUID | NOT NULL, FK | 关联配置ID |
| param_combinations | JSONB | NOT NULL | 参数组合 |
| results | JSONB | NOT NULL | 每组参数的回测结果 |
| best_params | JSONB | NOT NULL | 最优参数 |
| optimization_target | VARCHAR(50) | NOT NULL | 优化目标 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

### 4.2 数据字典

#### 4.2.1 indicators JSONB 结构

```json
{
  "type": "MACD",
  "params": {
    "fastPeriod": 12,
    "slowPeriod": 26,
    "signalPeriod": 9
  }
}
```

#### 4.2.2 buy_conditions / sell_conditions JSONB 结构

```json
{
  "logic": "AND",
  "conditions": [
    {
      "indicator": "MACD",
      "operator": "CROSS_ABOVE",
      "param1": "DIF",
      "param2": "DEA"
    },
    {
      "indicator": "RSI",
      "operator": "LESS_THAN",
      "value": 30
    }
  ]
}
```

#### 4.2.3 stop_loss / take_profit JSONB 结构

```json
{
  "type": "FIXED",
  "params": {
    "percentage": 5
  }
}
```

#### 4.2.4 position_sizing JSONB 结构

```json
{
  "mode": "FIXED_AMOUNT",
  "params": {
    "amount": 10000
  }
}
```

### 4.3 Zustand Store 状态设计

```javascript
// src/store/useStore.js 中新增

{
  // 回测配置
  backtestConfigs: [],
  
  // 当前回测配置
  currentBacktestConfig: null,
  
  // 回测结果
  backtestResults: [],
  
  // 当前展示的回测结果
  currentBacktestResult: null,
  
  // 参数优化结果
  optimizationResults: [],
  
  // 回测状态
  backtestStatus: 'idle', // 'idle' | 'running' | 'completed' | 'error'
  backtestProgress: 0, // 0-100
  
  // Actions
  addBacktestConfig: (config) => ...,
  updateBacktestConfig: (id, config) => ...,
  deleteBacktestConfig: (id) => ...,
  setCurrentBacktestConfig: (config) => ...,
  
  runBacktest: (config) => ..., // 运行回测
  setBacktestStatus: (status) => ...,
  setBacktestProgress: (progress) => ...,
  addBacktestResult: (result) => ...,
  setCurrentBacktestResult: (result) => ...,
  
  runOptimization: (config) => ..., // 运行参数优化
  addOptimizationResult: (result) => ...,
  
  // 导入/导出
  importBacktestConfigs: (configs) => ...,
  exportBacktestConfigs: () => ...,
}
```

### 4.4 数据流

```
用户操作 → Zustand Store → 回测引擎计算
                ↓
        (可选) 保存到数据库
                ↓
        结果展示组件
```

---

## 5. 前端页面设计

### 5.1 文件结构

```
src/pages/
└── BacktestSystem.jsx (主页面)

src/components/backtest/
├── ConfigPanel.jsx (条件配置面板)
│   ├── StockSelector.jsx (股票选择器)
│   ├── DateRangeSelector.jsx (日期范围选择器)
│   ├── IndicatorConfig.jsx (指标配置)
│   ├── ConditionBuilder.jsx (条件构建器)
│   ├── RiskConfig.jsx (风控配置)
│   └── PositionConfig.jsx (仓位配置)
├── ResultPanel.jsx (结果展示区)
│   ├── PerformanceCards.jsx (绩效指标卡片)
│   ├── EquityChart.jsx (资金曲线图)
│   ├── DrawdownChart.jsx (回撤曲线图)
│   ├── TradeTable.jsx (交易明细表)
│   └── ParamOptimization.jsx (参数优化结果)
├── SavedConfigs.jsx (已保存配置列表)
└── BacktestHistory.jsx (回测历史)

src/utils/backtest/
├── BacktestEngine.js (引擎入口)
├── DataLoader.js (数据加载器)
├── SignalGenerator.js (信号生成器)
├── OrderExecutor.js (订单执行器)
├── RiskManager.js (风控管理器)
├── PerformanceCalculator.js (绩效计算器)
└── ParameterOptimizer.js (参数优化器)

src/workers/
└── backtest.worker.js (Web Worker)

backend/migrations/
└── migration_backtest_tables_v1.sql (数据库迁移)
```

### 5.2 主页面布局

```
┌─────────────────────────────────────────────────────────────────┐
│  BacktestSystem.jsx (主页面)                                      │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  ConfigPanel     │          ResultPanel                         │
│  (左侧 30%)      │          (右侧 70%)                          │
│                  │                                              │
│  ┌────────────┐  │  ┌────────────────────────────────────┐     │
│  │ 股票选择   │  │  │ 绩效指标卡片 (横向排列)              │     │
│  │ 日期范围   │  │  │ [总收益] [年化] [最大回撤] [夏普]    │     │
│  │ 技术指标   │  │  │ [胜率] [盈亏比] [交易次数] [持仓]    │     │
│  │ 买入条件   │  │  └────────────────────────────────────┘     │
│  │ 卖出条件   │  │                                              │
│  │ 止损止盈   │  │  ┌────────────────────────────────────┐     │
│  │ 仓位管理   │  │  │ 资金曲线图                           │     │
│  │ 初始资金   │  │  │ [Recharts 折线图]                   │     │
│  │ 手续费率   │  │  │ 日期轴 + 金额轴                      │     │
│  └────────────┘  │  └────────────────────────────────────┘     │
│                  │                                              │
│  [保存配置]      │  ┌────────────────────────────────────┐     │
│  [运行回测]      │  │ 回撤曲线图                           │     │
│  [参数优化]      │  │ [Recharts 面积图]                   │     │
│  [导入/导出]     │  │ 日期轴 + 回撤百分比                  │     │
│                  │  └────────────────────────────────────┘     │
│                  │                                              │
│                  │  ┌────────────────────────────────────┐     │
│                  │  │ 交易明细表 (DataTable)               │     │
│                  │  │ [日期] [类型] [价格] [数量] [盈亏]   │     │
│                  │  │ [佣金] [持仓天数] [收益率]           │     │
│                  │  └────────────────────────────────────┘     │
│                  │                                              │
│                  │  ┌────────────────────────────────────┐     │
│                  │  │ 参数优化结果 (Tab 切换)              │     │
│                  │  │ [参数组合对比表格]                   │     │
│                  │  │ [热力图可视化]                       │     │
│                  │  └────────────────────────────────────┘     │
└──────────────────┴──────────────────────────────────────────────┘
```

### 5.3 路由配置

在 `App.jsx` 中新增路由：

```jsx
// 在研究院左侧导航中新增
{ path: '/research/backtest', name: '股票回测', icon: TrendingUp, component: BacktestSystem }
```

### 5.4 交互流程

```
1. 用户配置回测条件（股票、时间、指标、止损止盈等）
2. 点击"运行回测"
3. 前端显示加载状态和进度条
4. 回测引擎计算（可能使用 Web Worker）
5. 计算完成后，右侧结果区展示：
   - 绩效指标卡片
   - 资金曲线图
   - 回撤曲线图
   - 交易明细表
6. 用户可选择"保存配置"或"运行参数优化"
7. 参数优化时，展示多组参数对比结果
```

---

## 6. 绩效计算和指标

### 6.1 核心绩效指标

| 指标 | 公式 | 说明 | 优秀标准 |
|------|------|------|----------|
| **总收益率** | `(最终资金 - 初始资金) / 初始资金 × 100%` | 回测期间总收益 | > 20% |
| **年化收益率** | `(最终资金/初始资金)^(365/天数) - 1` | 折算成年化收益 | > 15% |
| **最大回撤** | `最大峰值到谷值的跌幅` | 最大亏损幅度 | < 15% |
| **夏普比率** | `(年化收益 - 无风险利率) / 收益标准差` | 风险调整后收益 | > 1.5 |
| **胜率** | `盈利交易次数 / 总交易次数 × 100%` | 盈利概率 | > 55% |
| **盈亏比** | `平均盈利 / 平均亏损` | 盈亏幅度比 | > 2.0 |
| **总交易次数** | `买入+卖出次数` | 交易频率 | 适中（不过频）|
| **平均持仓天数** | `总持仓天数 / 交易次数` | 平均持有时间 | 根据策略类型 |
| **卡尔玛比率** | `年化收益 / 最大回撤` | 回撤调整后收益 | > 2.0 |
| **索提诺比率** | `(年化收益 - 无风险利率) / 下行标准差` | 只考虑下行波动 | > 2.0 |

### 6.2 绩效计算器实现

```javascript
class PerformanceCalculator {
  calculate(trades, equityCurve, initialCapital) {
    const totalReturn = this.calculateTotalReturn(equityCurve, initialCapital);
    const annualReturn = this.calculateAnnualReturn(equityCurve, initialCapital);
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve);
    const sharpeRatio = this.calculateSharpeRatio(equityCurve, annualReturn);
    const winRate = this.calculateWinRate(trades);
    const profitLossRatio = this.calculateProfitLossRatio(trades);
    const totalTrades = trades.filter(t => t.type === 'BUY').length;
    const avgHoldingDays = this.calculateAvgHoldingDays(trades);
    const calmarRatio = annualReturn / Math.abs(maxDrawdown);
    const sortinoRatio = this.calculateSortinoRatio(equityCurve, annualReturn);
    
    return {
      totalReturn,
      annualReturn,
      maxDrawdown,
      sharpeRatio,
      winRate,
      profitLossRatio,
      totalTrades,
      avgHoldingDays,
      calmarRatio,
      sortinoRatio,
    };
  }
  
  calculateMaxDrawdown(equityCurve) {
    let peak = 0;
    let maxDrawdown = 0;
    
    for (const point of equityCurve) {
      if (point.equity > peak) peak = point.equity;
      const drawdown = (peak - point.equity) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    return maxDrawdown * 100; // 转为百分比
  }
  
  calculateSharpeRatio(equityCurve, annualReturn, riskFreeRate = 0.03) {
    const dailyReturns = this.calculateDailyReturns(equityCurve);
    const stdDev = this.calculateStandardDeviation(dailyReturns);
    const annualizedStdDev = stdDev * Math.sqrt(252); // 年化
    
    return (annualReturn - riskFreeRate) / annualizedStdDev;
  }
  
  calculateWinRate(trades) {
    const closedTrades = this.pairTrades(trades);
    const winningTrades = closedTrades.filter(t => t.pnl > 0).length;
    return (winningTrades / closedTrades.length) * 100;
  }
  
  calculateProfitLossRatio(trades) {
    const closedTrades = this.pairTrades(trades);
    const wins = closedTrades.filter(t => t.pnl > 0).map(t => t.pnl);
    const losses = closedTrades.filter(t => t.pnl < 0).map(t => Math.abs(t.pnl));
    
    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 1;
    
    return avgWin / avgLoss;
  }
}
```

### 6.3 资金曲线和回撤曲线数据格式

```javascript
// 资金曲线数据点
{
  date: '2024-01-15',
  equity: 105000,      // 总资金
  cash: 50000,         // 可用现金
  position: 55000,     // 持仓市值
  return: 0.05         // 累计收益率
}

// 回撤曲线数据点
{
  date: '2024-01-15',
  drawdown: -0.08,     // 当前回撤百分比
  peak: 110000,        // 历史峰值
  isMaxDrawdown: true  // 是否是最大回撤点
}
```

### 6.4 参数优化算法

```javascript
class ParameterOptimizer {
  async optimize(config, paramRanges, targetMetric) {
    const combinations = this.generateCombinations(paramRanges);
    const results = [];
    
    // 遍历所有参数组合
    for (const params of combinations) {
      const backtestConfig = { ...config, ...params };
      const result = await this.runBacktest(backtestConfig);
      const performance = PerformanceCalculator.calculate(result.trades, result.equityCurve, config.initialCapital);
      
      results.push({
        params,
        performance,
        [targetMetric]: performance[targetMetric]
      });
      
      // 更新进度
      this.updateProgress(results.length / combinations.length);
    }
    
    // 按优化目标排序
    results.sort((a, b) => b[targetMetric] - a[targetMetric]);
    
    return {
      combinations: results,
      best: results[0],
      targetMetric
    };
  }
  
  generateCombinations(paramRanges) {
    // 生成所有参数组合（笛卡尔积）
    const keys = Object.keys(paramRanges);
    const combinations = [];
    
    const generate = (current, index) => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }
      
      const key = keys[index];
      const range = paramRanges[key];
      for (let value = range.min; value <= range.max; value += range.step) {
        current[key] = value;
        generate(current, index + 1);
      }
    };
    
    generate({}, 0);
    return combinations;
  }
}
```

### 6.5 可视化设计

#### 6.5.1 绩效指标卡片

- 8 个卡片横向排列，每个显示：
  - 指标名称（小字）
  - 指标值（大字，颜色区分：收益绿色、亏损红色）
  - 与基准的对比（可选）

#### 6.5.2 资金曲线图

- **X 轴**：日期
- **Y 轴**：资金金额
- **折线**：总资金曲线
- **标注点**：买入（绿色三角）、卖出（红色倒三角）
- **工具提示**：日期、资金、收益率

#### 6.5.3 回撤曲线图

- **X 轴**：日期
- **Y 轴**：回撤百分比（0% 到负值）
- **面积图**：回撤区域填充红色
- **标注点**：最大回撤点

#### 6.5.4 参数优化热力图

- **X 轴**：参数 1 的值
- **Y 轴**：参数 2 的值
- **颜色**：收益率或夏普比率（绿色高、红色低）
- **标注**：最优参数点

---

## 7. 错误处理和性能优化

### 7.1 错误处理

| 错误类型 | 处理方式 | 用户提示 |
|----------|----------|----------|
| **数据不足** | 检测 K 线数据是否满足指标计算所需最小周期 | "数据不足，需要至少 N 天数据" |
| **参数错误** | 验证参数范围和类型 | "参数 X 的值超出有效范围" |
| **计算超时** | Web Worker 超时中断（30 秒） | "回测超时，请减少数据量或简化条件" |
| **内存溢出** | 检测内存使用，超过阈值时中断 | "内存不足，请减少回测范围" |
| **网络错误** | 数据加载失败时重试（3 次） | "数据加载失败，请检查网络" |
| **配置错误** | 验证条件逻辑（如没有买入条件） | "请至少配置一个买入条件" |

### 7.2 性能优化策略

| 策略 | 实现方式 |
|------|----------|
| **Web Worker** | 回测计算在 Worker 线程执行，不阻塞 UI |
| **数据缓存** | 缓存已计算的指标结果 |
| **增量计算** | 参数优化时复用已计算的指标 |
| **分批处理** | 大数据量时分批计算，避免内存溢出 |
| **懒加载** | 图表数据按需加载，不一次性渲染 |
| **虚拟化列表** | 交易明细表使用虚拟滚动 |

### 7.3 Web Worker 实现

```javascript
// src/workers/backtest.worker.js
self.onmessage = function(e) {
  const { klineData, config, indicators } = e.data;
  
  try {
    // 执行回测
    const result = runBacktest(klineData, config);
    
    // 返回结果
    self.postMessage({ type: 'success', result });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};
```

---

## 8. 技术栈和依赖

### 8.1 现有技术栈

- React 18 + Vite 7
- Zustand（状态管理）
- React Router v6
- Tailwind CSS 3
- Recharts（图表）
- Framer Motion（动画）
- date-fns（日期处理）
- Lucide React（图标）

### 8.2 新增依赖

无新增依赖。所有功能使用现有依赖实现。

---

## 9. 实施计划

### 9.1 阶段一：数据库和基础设施

1. 创建数据库迁移文件
2. 创建回测引擎核心模块
3. 创建 Zustand Store 状态管理

### 9.2 阶段二：前端页面和组件

1. 创建主页面 BacktestSystem.jsx
2. 创建条件配置面板
3. 创建结果展示组件

### 9.3 阶段三：回测引擎实现

1. 实现信号生成器
2. 实现订单执行器
3. 实现风控管理器
4. 实现绩效计算器

### 9.4 阶段四：参数优化和可视化

1. 实现参数优化器
2. 实现资金曲线和回撤曲线
3. 实现热力图可视化

### 9.5 阶段五：集成和测试

1. 路由配置和导航集成
2. Web Worker 集成
3. 错误处理完善
4. 性能优化

---

## 10. 风险和注意事项

### 10.1 技术风险

- **大数据量回测**：前端计算能力有限，大量股票或长时间回测可能导致性能问题
- **内存限制**：浏览器内存限制可能影响大数据量的回测结果存储

### 10.2 缓解措施

- 使用 Web Worker 进行异步计算
- 数据分批处理
- 限制单次回测的股票数量和时间范围
- 提供进度反馈，避免用户等待焦虑

---

## 11. 附录

### 11.1 术语表

| 术语 | 说明 |
|------|------|
| **OHLCV** | Open, High, Low, Close, Volume（开高低收量） |
| **K线** | 蜡烛图，用于展示股票价格变化 |
| **金叉** | 短期均线上穿长期均线，看涨信号 |
| **死叉** | 短期均线下穿长期均线，看跌信号 |
| **回撤** | 资金从峰值到谷值的跌幅 |
| **夏普比率** | 风险调整后的收益率指标 |
| **盈亏比** | 平均盈利与平均亏损的比值 |

### 11.2 参考资料

- 现有代码库结构和约定
- AGENTS.md 项目规范
- CLAUDE.md 架构文档
