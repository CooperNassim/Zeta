# 股票数据API集成说明

## 概述

已成功集成免费A股数据接口，支持实时行情查询、K线数据获取、股票搜索等功能。

## API来源

### 1. 新浪财经API（实时行情）
- **地址**: http://hq.sinajs.cn/list=
- **特点**: 免费、稳定、数据全面
- **支持**: A股实时行情
- **限制**: 需要处理后端跨域问题（当前使用模拟数据演示）

### 2. 东方财富API（K线数据）
- **地址**: https://push2his.eastmoney.com/api/qt/stock/kline/get
- **特点**: 免费、支持历史K线
- **支持**: 日线、周线、月线
- **限制**: 可能存在跨域问题（当前使用模拟数据演示）

## 功能特性

### ✅ 已实现功能

1. **股票实时行情**
   - 获取当前价格、涨跌幅、成交量等
   - 支持批量查询多只股票
   - 自动更新股票池数据

2. **历史K线数据**
   - 日线、周线、月线数据
   - 包含开盘、收盘、最高、最低、成交量
   - 支持指定时间范围

3. **股票搜索**
   - 支持按股票代码搜索
   - 支持按股票名称搜索
   - 实时显示搜索结果

4. **技术指标计算**
   - EMA（指数移动平均线）
   - 布林通道（BOLL）
   - 埃尔德价格通道
   - 自动计算并缓存

## 使用方法

### 1. 添加股票到股票池

1. 进入"股票池"页面
2. 点击"添加股票"
3. 在"股票代码"输入框中输入关键词搜索
4. 从下拉列表中选择股票
5. 点击"添加"

### 2. 更新股票数据

1. 在股票池页面点击"更新数据"按钮
2. 系统自动获取所有股票的最新行情
3. 实时价格、涨跌幅等信息会自动更新

### 3. 获取K线数据

K线数据会在以下情况自动获取：
- 计算技术指标时
- 生成交易记录评分时
- 显示行情图表时

## API使用示例

### 获取单只股票实时行情

```javascript
import { getStockRealtime } from '../utils/stockApi'

const data = await getStockRealtime('000001')
console.log(data.currentPrice)  // 当前价格
console.log(data.changePercent)  // 涨跌幅
```

### 批量获取股票行情

```javascript
import { getMultipleStocksRealtime } from '../utils/stockApi'

const data = await getMultipleStocksRealtime(['000001', '600000', '000002'])
```

### 获取K线数据

```javascript
import { getStockKline } from '../utils/stockApi'

const klineData = await getStockKline('000001', 'daily', 200)
console.log(klineData)  // K线数组
```

### 搜索股票

```javascript
import { searchStock } from '../utils/stockApi'

const results = await searchStock('平安')
console.log(results)  // 搜索结果数组
```

## 技术说明

### 跨域问题

由于浏览器安全限制，直接从浏览器调用第三方API会遇到跨域问题。当前实现采用了以下方案：

1. **使用模拟数据**: 作为演示和测试
2. **预留代理接口**: 可以部署后端代理服务器

### 推荐的后端代理方案

如果要使用真实的API数据，可以部署一个简单的代理服务器：

```javascript
// Express代理服务器示例
const express = require('express')
const axios = require('axios')
const cors = require('cors')

const app = express()
app.use(cors())

// 代理新浪API
app.get('/api/stock/realtime/:symbol', async (req, res) => {
  const { symbol } = req.params
  const url = `http://hq.sinajs.cn/list=${symbol}`
  
  try {
    const response = await axios.get(url)
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: '获取失败' })
  }
})

app.listen(3001)
```

### 数据格式

#### 实时行情数据

```javascript
{
  symbol: '000001',        // 股票代码
  name: '平安银行',        // 股票名称
  currentPrice: 12.34,     // 当前价格
  openPrice: 12.30,        // 开盘价
  highPrice: 12.45,        // 最高价
  lowPrice: 12.25,         // 最低价
  prevClose: 12.28,        // 昨收价
  change: 0.06,            // 涨跌额
  changePercent: 0.49,     // 涨跌幅(%)
  volume: 12345678,        // 成交量
  amount: 1234567890,      // 成交额
  time: '2026-03-06T10:30:00.000Z'  // 时间戳
}
```

#### K线数据

```javascript
[
  {
    timestamp: 1709769600000,  // 时间戳
    date: '2024-03-06',        // 日期
    open: 12.30,               // 开盘价
    close: 12.34,              // 收盘价
    high: 12.45,               // 最高价
    low: 12.25,                // 最低价
    volume: 12345678,          // 成交量
    amount: 1234567890         // 成交额
  },
  // ...
]
```

## 注意事项

1. **模拟数据**: 当前使用模拟数据，实际使用时需要配置后端代理
2. **频率限制**: 避免过于频繁的API调用，建议至少间隔1秒
3. **数据准确性**: 模拟数据仅用于演示，请以实际API数据为准
4. **更新时间**: A股交易时间 9:30-11:30, 13:00-15:00

## 后续优化建议

1. **部署后端代理**: 解决跨域问题，获取真实数据
2. **缓存机制**: 减少API调用，提升性能
3. **定时更新**: 自动定时更新股票数据
4. **WebSocket**: 实现实时推送行情
5. **数据持久化**: 保存历史数据到本地存储

## 常见问题

### Q1: 为什么显示的数据是模拟的？
A: 由于浏览器跨域限制，无法直接调用第三方API。需要部署后端代理服务器。

### Q2: 如何获取真实的股票数据？
A: 可以：
1. 部署简单的Express代理服务器
2. 使用浏览器插件禁用跨域检查（仅用于开发）
3. 使用Chrome扩展跨域工具

### Q3: API有使用限制吗？
A: 新浪和东方财富的API目前免费且无限制，但建议合理使用，避免频繁调用。

### Q4: 支持哪些市场？
A: 当前主要支持A股（上海、深圳），后续可扩展港股、美股等。

## 技术支持

如有问题，请联系开发人员或查看代码注释。
