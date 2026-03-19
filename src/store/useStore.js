import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateTradeGrade, calculateOverallScore } from '../utils/technicalIndicators'

// API基础URL
// 使用相对路径，通过 Vite 代理到后端
const API_BASE_URL = ''

// API调用函数
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    if (data) {
      options.body = JSON.stringify(data)
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    return await response.json()
  } catch (error) {
    console.error('API调用失败:', error)
    return { success: false, error: error.message }
  }
}

// 心理测试指标
export const initialPsychologicalIndicators = [
  { id: '1', name: '今天身体感觉怎么样？', description: '0=感觉生病了；1=感觉正常；2=感觉好极了；', minScore: 0, maxScore: 2, weight: 0.2 },
  { id: '2', name: '昨天交易如何？', description: '0=亏损；1=没有交易；2=盈利；', minScore: 0, maxScore: 2, weight: 0.2 },
  { id: '3', name: '早上做好计划了吗？', description: '0=没做；1=无仓位；2=准备得很好；', minScore: 0, maxScore: 2, weight: 0.2 },
  { id: '4', name: '早上情绪如何？', description: '0=低落；1=正常；2=棒极了；', minScore: 0, maxScore: 2, weight: 0.2 },
  { id: '5', name: '今天工作量如何？', description: '0=很忙；1=正常；2=很闲；', minScore: 0, maxScore: 2, weight: 0.2 },
]

// 交易策略模板
export const initialStrategies = {
  buy: [
    {
      id: '1',
      name: '趋势突破策略',
      description: '价格突破关键阻力位',
      conditions: [
        { id: '1', name: '价格突破', weight: 0.2, threshold: 70, description: '价格突破关键位置' },
        { id: '2', name: '成交量配合', weight: 0.2, threshold: 70, description: '成交量放大' },
        { id: '3', name: '技术指标', weight: 0.2, threshold: 70, description: 'RSI、MACD等指标确认' },
        { id: '4', name: '市场情绪', weight: 0.2, threshold: 70, description: '市场整体情绪良好' },
        { id: '5', name: '风险收益比', weight: 0.2, threshold: 70, description: '风险收益比合理' },
      ],
      passScore: 70
    },
    {
      id: '2',
      name: '回调买入策略',
      description: '价格回调至支撑位买入',
      conditions: [
        { id: '1', name: '回调位置', weight: 0.2, threshold: 70, description: '回调至支撑位' },
        { id: '2', name: '支撑有效性', weight: 0.2, threshold: 70, description: '支撑位有效' },
        { id: '3', name: '买入信号', weight: 0.2, threshold: 70, description: '出现买入信号' },
        { id: '4', name: '成交量变化', weight: 0.2, threshold: 70, description: '成交量缩减' },
        { id: '5', name: '时间周期', weight: 0.2, threshold: 70, description: '回调时间充分' },
      ],
      passScore: 70
    }
  ],
  sell: [
    {
      id: '1',
      name: '止盈策略',
      description: '达到预期盈利目标',
      conditions: [
        { id: '1', name: '盈利比例', weight: 0.2, threshold: 70, description: '达到目标盈利比例' },
        { id: '2', name: '市场环境', weight: 0.2, threshold: 70, description: '市场环境良好' },
        { id: '3', name: '技术信号', weight: 0.2, threshold: 70, description: '技术指标确认' },
        { id: '4', name: '资金流动', weight: 0.2, threshold: 70, description: '资金流向正常' },
        { id: '5', name: '风险控制', weight: 0.2, threshold: 70, description: '风险可控' },
      ],
      passScore: 70
    },
    {
      id: '2',
      name: '止损策略',
      description: '跌破止损位及时止损',
      conditions: [
        { id: '1', name: '跌破止损', weight: 0.2, threshold: 70, description: '价格触及止损位' },
        { id: '2', name: '市场趋势', weight: 0.2, threshold: 70, description: '趋势转变' },
        { id: '3', name: '风险控制', weight: 0.2, threshold: 70, description: '风险在可控范围' },
        { id: '4', name: '情绪变化', weight: 0.2, threshold: 70, description: '市场情绪转变' },
        { id: '5', name: '止损计划', weight: 0.2, threshold: 70, description: '按计划执行止损' },
      ],
      passScore: 70
    }
  ]
}

// 风险模型模板
export const initialRiskModels = [
  {
    id: '1',
    name: '保守型',
    description: '单笔最大亏损不超过总资金的1%',
    maxLossPercent: 1,
    positionSize: 0.1
  },
  {
    id: '2',
    name: '平衡型',
    description: '单笔最大亏损不超过总资金的2%',
    maxLossPercent: 2,
    positionSize: 0.2
  },
  {
    id: '3',
    name: '激进型',
    description: '单笔最大亏损不超过总资金的5%',
    maxLossPercent: 5,
    positionSize: 0.3
  }
]

// 技术指标模板
export const initialTechnicalIndicators = [
  {
    id: '1',
    name: 'MACD',
    description: '指数平滑异同移动平均线，用于判断趋势和买卖点',
    icon: null,
    tags: ['趋势', '动量']
  },
  {
    id: '2',
    name: 'RSI',
    description: '相对强弱指数，用于判断超买超卖状态',
    icon: null,
    tags: ['动量', '震荡']
  },
  {
    id: '3',
    name: 'KDJ',
    description: '随机指标，用于判断短期买卖点',
    icon: null,
    tags: ['震荡', '短期']
  },
  {
    id: '4',
    name: 'BOLL',
    description: '布林带，用于判断价格波动范围和突破',
    icon: null,
    tags: ['趋势', '波动']
  }
]

const useStore = create(
  persist(
    (set, get) => ({
      // 账户信息
      account: {
        real: { balance: 0, totalInvested: 0, totalProfit: 0 },
        virtual: { balance: 0, totalInvested: 0, totalProfit: 0 }
      },

      // 每日功课数据（26个字段）
      dailyWorkData: [],

      // 心理测试指标
      psychologicalIndicators: [...initialPsychologicalIndicators],

      // 心理测试记录
      psychologicalTests: [],

      // 交易策略
      strategies: { ...initialStrategies },

      // 风险模型
      riskModels: [...initialRiskModels],

      // 风险配置
      riskConfig: {
        totalRiskPercent: 6,
        singleRiskPercent: 2,
        // 单笔风控
        singleOrder: {
          maxQuantity: 10000,
          maxAmount: 1000000,
          minQuantity: 100,
        },
        // 单股风控
        singleStock: {
          maxPositionRatio: 0.3,
          maxPositionAmount: 500000,
        },
        // 单日风控
        daily: {
          maxTrades: 10,
          maxLoss: 50000,
          maxBuyAmount: 2000000,
          maxSellAmount: 2000000,
        },
        // 熔断机制
        circuitBreaker: {
          enabled: true,
          consecutiveLosses: 3,
          pauseDuration: 30,
        }
      },

      // 实时风控数据
      riskData: {
        todayTrades: 0,
        todayBuyAmount: 0,
        todayLoss: 0,
        consecutiveLosses: 0,
        isCircuitBroken: false,
        breakUntil: null,
      },

      // 止损止盈订单列表
      stopOrders: [],

      // 账户风险数据
      accountRiskData: {
        stopLossPreLoss: 8500,
        monthlyLoss: 3200,
        startMonthTotal: 200000,
        currentAccount: 191800,
        riskRatio: 5.85,
        accountAvailable: 95.9,
        singleAvailable: 94.15
      },

      // 技术指标
      technicalIndicators: [...initialTechnicalIndicators],

      // 交易策略记录（扁平化存储，用于表格展示）
      strategyRecords: [],

      // 预约单（固定数据）
      orders: [
        { id: 1700000000001, tradeNumber: '20240101001', type: 'buy', symbol: '600519', name: '贵州茅台', price: '1650.00', quantity: 100, status: 'executed', isVirtual: false, psychologicalScore: 75, strategyScore: 82, riskScore: 88, overallScore: 82, createdAt: '2024-01-01T09:30:00.000Z', executedAt: '2024-01-01T09:30:00.000Z', cancelledAt: null },
        { id: 1700000000002, tradeNumber: '20240101002', type: 'sell', symbol: '600519', name: '贵州茅台', price: '1725.00', quantity: 100, status: 'executed', isVirtual: false, psychologicalScore: 80, strategyScore: 85, riskScore: 90, overallScore: 85, createdAt: '2024-01-02T10:15:00.000Z', executedAt: '2024-01-02T10:15:00.000Z', cancelledAt: null },
        { id: 1700000000003, tradeNumber: '20240102001', type: 'buy', symbol: '000333', name: '美的集团', price: '62.50', quantity: 200, status: 'pending', isVirtual: true, psychologicalScore: 70, strategyScore: 78, riskScore: 85, overallScore: 78, createdAt: '2024-01-03T14:00:00.000Z', executedAt: null, cancelledAt: null },
        { id: 1700000000004, tradeNumber: '20240103001', type: 'buy', symbol: '601318', name: '中国平安', price: '45.20', quantity: 300, status: 'executed', isVirtual: false, psychologicalScore: 65, strategyScore: 75, riskScore: 80, overallScore: 73, createdAt: '2024-01-04T11:00:00.000Z', executedAt: '2024-01-04T11:00:00.000Z', cancelledAt: null },
        { id: 1700000000005, tradeNumber: '20240104001', type: 'sell', symbol: '601318', name: '中国平安', price: '46.80', quantity: 300, status: 'executed', isVirtual: false, psychologicalScore: 85, strategyScore: 88, riskScore: 92, overallScore: 88, createdAt: '2024-01-05T13:30:00.000Z', executedAt: '2024-01-05T13:30:00.000Z', cancelledAt: null },
        { id: 1700000000006, tradeNumber: '20240105001', type: 'buy', symbol: '600036', name: '招商银行', price: '35.00', quantity: 500, status: 'pending', isVirtual: true, psychologicalScore: 72, strategyScore: 80, riskScore: 86, overallScore: 79, createdAt: '2024-01-06T09:15:00.000Z', executedAt: null, cancelledAt: null },
        { id: 1700000000007, tradeNumber: '20240106001', type: 'buy', symbol: '000001', name: '平安银行', price: '10.20', quantity: 1000, status: 'cancelled', isVirtual: false, psychologicalScore: 60, strategyScore: 70, riskScore: 75, overallScore: 68, createdAt: '2024-01-07T10:00:00.000Z', executedAt: null, cancelledAt: '2024-01-07T10:05:00.000Z' },
        { id: 1700000000008, tradeNumber: '20240107001', type: 'sell', symbol: '000333', name: '美的集团', price: '65.00', quantity: 200, status: 'pending', isVirtual: true, psychologicalScore: 78, strategyScore: 82, riskScore: 88, overallScore: 83, createdAt: '2024-01-08T14:30:00.000Z', executedAt: null, cancelledAt: null },
        { id: 1700000000009, tradeNumber: '20240108001', type: 'buy', symbol: 'AAPL', name: '苹果公司', price: '185.50', quantity: 50, status: 'executed', isVirtual: true, psychologicalScore: 88, strategyScore: 90, riskScore: 92, overallScore: 90, createdAt: '2024-01-09T08:00:00.000Z', executedAt: '2024-01-09T08:00:00.000Z', cancelledAt: null },
        { id: 1700000000010, tradeNumber: '20240109001', type: 'sell', symbol: 'AAPL', name: '苹果公司', price: '192.00', quantity: 50, status: 'executed', isVirtual: true, psychologicalScore: 82, strategyScore: 86, riskScore: 90, overallScore: 86, createdAt: '2024-01-10T09:30:00.000Z', executedAt: '2024-01-10T09:30:00.000Z', cancelledAt: null },
        { id: 1700000000011, tradeNumber: '20240110001', type: 'buy', symbol: 'MSFT', name: '微软', price: '375.00', quantity: 30, status: 'pending', isVirtual: false, psychologicalScore: 75, strategyScore: 80, riskScore: 85, overallScore: 80, createdAt: '2024-01-11T10:00:00.000Z', executedAt: null, cancelledAt: null },
        { id: 1700000000012, tradeNumber: '20240111001', type: 'sell', symbol: 'MSFT', name: '微软', price: '385.00', quantity: 30, status: 'pending', isVirtual: false, psychologicalScore: 80, strategyScore: 85, riskScore: 88, overallScore: 84, createdAt: '2024-01-12T11:00:00.000Z', executedAt: null, cancelledAt: null },
        { id: 1700000000013, tradeNumber: '20240112001', type: 'buy', symbol: 'GOOGL', name: '谷歌', price: '140.00', quantity: 40, status: 'executed', isVirtual: true, psychologicalScore: 70, strategyScore: 78, riskScore: 82, overallScore: 77, createdAt: '2024-01-13T09:00:00.000Z', executedAt: '2024-01-13T09:00:00.000Z', cancelledAt: null },
        { id: 1700000000014, tradeNumber: '20240113001', type: 'sell', symbol: 'GOOGL', name: '谷歌', price: '145.00', quantity: 40, status: 'cancelled', isVirtual: true, psychologicalScore: 65, strategyScore: 72, riskScore: 78, overallScore: 72, createdAt: '2024-01-14T10:30:00.000Z', executedAt: null, cancelledAt: '2024-01-14T10:35:00.000Z' },
        { id: 1700000000015, tradeNumber: '20240114001', type: 'buy', symbol: 'AMZN', name: '亚马逊', price: '155.00', quantity: 35, status: 'pending', isVirtual: false, psychologicalScore: 78, strategyScore: 82, riskScore: 86, overallScore: 82, createdAt: '2024-01-15T13:00:00.000Z', executedAt: null, cancelledAt: null },
        { id: 1700000000016, tradeNumber: '20240115001', type: 'sell', symbol: 'AMZN', name: '亚马逊', price: '160.00', quantity: 35, status: 'pending', isVirtual: false, psychologicalScore: 83, strategyScore: 87, riskScore: 90, overallScore: 87, createdAt: '2024-01-16T14:00:00.000Z', executedAt: null, cancelledAt: null },
        { id: 1700000000017, tradeNumber: '20240116001', type: 'buy', symbol: 'TSLA', name: '特斯拉', price: '245.00', quantity: 25, status: 'executed', isVirtual: true, psychologicalScore: 90, strategyScore: 92, riskScore: 95, overallScore: 92, createdAt: '2024-01-17T08:30:00.000Z', executedAt: '2024-01-17T08:30:00.000Z', cancelledAt: null },
        { id: 1700000000018, tradeNumber: '20240117001', type: 'sell', symbol: 'TSLA', name: '特斯拉', price: '260.00', quantity: 25, status: 'executed', isVirtual: true, psychologicalScore: 85, strategyScore: 88, riskScore: 92, overallScore: 88, createdAt: '2024-01-18T09:00:00.000Z', executedAt: '2024-01-18T09:00:00.000Z', cancelledAt: null },
        { id: 1700000000019, tradeNumber: '20240118001', type: 'buy', symbol: 'NVDA', name: '英伟达', price: '520.00', quantity: 20, status: 'pending', isVirtual: false, psychologicalScore: 92, strategyScore: 95, riskScore: 98, overallScore: 95, createdAt: '2024-01-19T10:00:00.000Z', executedAt: null, cancelledAt: null },
        { id: 1700000000020, tradeNumber: '20240119001', type: 'sell', symbol: 'NVDA', name: '英伟达', price: '550.00', quantity: 20, status: 'pending', isVirtual: false, psychologicalScore: 88, strategyScore: 91, riskScore: 94, overallScore: 91, createdAt: '2024-01-20T11:00:00.000Z', executedAt: null, cancelledAt: null }
      ],

      // 交易编号计数器 (日期 -> 当前序号)
      tradeNumberCounter: {},

      // 生成交易编号
      generateTradeNumber: () => {
        const today = new Date()
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0')

        set((state) => {
          const counter = state.tradeNumberCounter[dateStr] || 0
          const newCounter = counter + 1
          const tradeNumber = dateStr + String(newCounter).padStart(3, '0')

          return {
            tradeNumberCounter: {
              ...state.tradeNumberCounter,
              [dateStr]: newCounter
            }
          }
        })

        const state = get()
        const counter = state.tradeNumberCounter[dateStr] || 0
        return dateStr + String(counter).padStart(3, '0')
      },

      // 账单明细（实盘）
      transactions: [],

      // 虚拟盘账单明细
      virtualTransactions: [],

      // 交易记录
      tradeRecords: [
        {
          id: 'trade_001',
          tradeNumber: '20240215001',
          tradeType: '买入',
          symbol: '600519',
          name: '贵州茅台',
          buyOrderId: 'buy_001',
          sellOrderId: 'sell_001',
          buyPrice: 1650.00,
          buyQuantity: 100,
          buyTime: '2024-02-15T09:30:00.000Z',
          buyOrderPrice: 1645.00,
          buyOrderTime: '2024-02-14T15:00:00.000Z',
          buyPsychologicalScore: 7.5,
          buyStrategyScore: 85.2,
          buyStrategyId: 1,
          sellPrice: null,
          sellQuantity: null,
          sellTime: null,
          sellOrderPrice: null,
          sellOrderTime: null,
          sellPsychologicalScore: null,
          sellStrategyScore: null,
          sellStrategyId: null,
          buyAmount: '165000.00',
          sellAmount: null,
          profit: null,
          profitPercent: null,
          holdDuration: 0,
          buyGrade: 'A',
          sellGrade: null,
          overallScore: 85.5,
          buyChannel: { high: 1682.50, low: 1617.50, upperBand: 1702.00, lowerBand: 1598.00, type: 'bollinger' },
          sellChannel: null,
          tradeSummary: null,
          createdAt: '2024-02-15T09:30:00.000Z'
        },
        {
          id: 'trade_001_sell',
          tradeNumber: '20240215001',
          tradeType: '卖出',
          symbol: '600519',
          name: '贵州茅台',
          buyOrderId: 'buy_001',
          sellOrderId: 'sell_001',
          buyPrice: 1650.00,
          buyQuantity: 100,
          buyTime: '2024-02-15T09:30:00.000Z',
          buyOrderPrice: 1645.00,
          buyOrderTime: '2024-02-14T15:00:00.000Z',
          buyPsychologicalScore: 7.5,
          buyStrategyScore: 85.2,
          buyStrategyId: 1,
          sellPrice: 1725.00,
          sellQuantity: 100,
          sellTime: '2024-03-01T10:15:00.000Z',
          sellOrderPrice: 1720.00,
          sellOrderTime: '2024-02-28T14:30:00.000Z',
          sellPsychologicalScore: 8.0,
          sellStrategyScore: 88.5,
          sellStrategyId: 1,
          buyAmount: '165000.00',
          sellAmount: '172500.00',
          profit: '7500.00',
          profitPercent: '4.55',
          holdDuration: 15,
          buyGrade: 'A',
          sellGrade: 'A',
          overallScore: 85.5,
          buyChannel: { high: 1682.50, low: 1617.50, upperBand: 1702.00, lowerBand: 1598.00, type: 'bollinger' },
          sellChannel: { high: 1761.25, low: 1688.75, upperBand: 1783.00, lowerBand: 1667.00, type: 'bollinger' },
          tradeSummary: null,
          createdAt: '2024-03-01T10:15:00.000Z'
        }
      ],

      // 股票池数据
      stockPool: [
        { id: 1, symbol: '000001', name: '平安银行', market: 'cn', exchange: '深交所', sector: '银行', currentPrice: 10.50, change: 0.15, changePercent: 1.45, volume: 52000000, createdAt: new Date().toISOString(), deleted: false, deletedAt: null },
        { id: 2, symbol: '600036', name: '招商银行', market: 'cn', exchange: '上交所', sector: '银行', currentPrice: 35.20, change: 0.50, changePercent: 1.44, volume: 28000000, createdAt: new Date().toISOString(), deleted: false, deletedAt: null },
        { id: 3, symbol: '600519', name: '贵州茅台', market: 'cn', exchange: '上交所', sector: '白酒', currentPrice: 1680.00, change: -12.00, changePercent: -0.71, volume: 2500000, createdAt: new Date().toISOString(), deleted: false, deletedAt: null },
        { id: 4, symbol: '000333', name: '美的集团', market: 'cn', exchange: '深交所', sector: '家电', currentPrice: 62.80, change: 1.20, changePercent: 1.95, volume: 35000000, createdAt: new Date().toISOString(), deleted: false, deletedAt: null },
        { id: 5, symbol: '601318', name: '中国平安', market: 'cn', exchange: '上交所', sector: '保险', currentPrice: 45.60, change: -0.80, changePercent: -1.72, volume: 48000000, createdAt: new Date().toISOString(), deleted: false, deletedAt: null }
      ],

      // 股票K线数据（按symbol存储）
      stockKlineData: {},

      // 更新账户余额
      updateBalance: (amount, accountType = 'real') => set((state) => ({
        account: {
          ...state.account,
          [accountType]: {
            ...state.account[accountType],
            balance: state.account[accountType].balance + amount
          }
        }
      })),

      // 获取指定类型的账户
      getAccount: (accountType = 'real') => (state) => state.account[accountType],

      // 添加每日功课数据
      addDailyWorkData: async (data) => {
        console.log('[Store] 添加每日功课数据:', data)

        // 直接发送完整的前端数据到数据库
        const now = new Date().toISOString()
        const dbData = {
          date: data.date || null,
          nasdaq: data.nasdaq || null,
          ftse: data.ftse || null,
          dax: data.dax || null,
          n225: data.n225 || null,
          hsi: data.hsi || null,
          bitcoin: data.bitcoin || null,
          eurusd: data.eurusd || null,
          usdjpy: data.usdjpy || null,
          usdcny: data.usdcny || null,
          oil: data.oil || null,
          gold: data.gold || null,
          bond: data.bond || null,
          consecutive: data.consecutive || null,
          a50: data.a50 || null,
          sh_index: data.shIndex || null,
          sh_2day_power: data.sh2dayPower || null,
          sh_13day_power: data.sh13dayPower || null,
          up_count: data.upCount || null,
          limit_up: data.limitUp || null,
          down_count: data.downCount || null,
          limit_down: data.limitDown || null,
          volume: data.volume || null,
          sentiment: data.sentiment || null,
          prediction: data.prediction || null,
          trade_status: data.tradeStatus || null,
          review_plan: data.reviewPlan || null,
          review_execution: data.reviewExecution || null,
          review_result: data.reviewResult || null,
          deleted: false,
          deleted_at: null,
          created_at: now,
          updated_at: now
        }

        try {
          // 等待数据库保存完成
          const res = await apiCall('/api/daily_work_data', 'POST', dbData)
          console.log('[Store] 每日功课保存到数据库结果:', res)

          if (res.success && res.data && res.data.id) {
            // 保存成功后，从数据库重新同步数据，确保数据一致性
            const syncResponse = await apiCall('/api/sync/all')
            if (syncResponse.success && syncResponse.data && syncResponse.data.daily_work_data !== undefined) {
              const { daily_work_data } = syncResponse.data
              set((state) => {
                // 使用 importDailyWorkData 来更新数据
                state.importDailyWorkData(daily_work_data)
                return {}
              })
            }
            return { ...data, id: res.data.id }
          } else {
            console.warn('[Store] 数据库返回数据不完整')
            // 即使返回数据不完整，也同步一次以确保状态一致
            const syncResponse = await apiCall('/api/sync/all')
            if (syncResponse.success && syncResponse.data && syncResponse.data.daily_work_data !== undefined) {
              const { daily_work_data } = syncResponse.data
              set((state) => {
                state.importDailyWorkData(daily_work_data)
                return {}
              })
            }
            return data
          }
        } catch (error) {
          console.error('[Store] 保存每日功课到数据库失败:', error)
          throw error
        }
      },

      // 批量导入每日功课数据（从数据库同步）
      importDailyWorkData: (dataList) => set((state) => {
        console.log('[Store] 从数据库导入的每日功课数据:', dataList)

        // 如果 dataList 为 null 或 undefined，保持现有数据不变
        if (dataList === null || dataList === undefined) {
          console.log('[Store] 数据未提供，保持现有数据')
          return {}
        }

        // 过滤已删除的数据
        const activeData = dataList.filter(d => d.deleted !== true)
        console.log('[Store] 过滤已删除后的数据:', activeData.map(d => d.date))

        // 如果数据库返回空数组，清空本地数据
        if (activeData.length === 0) {
          console.log('[Store] 数据库返回空数组，清空本地数据')
          return { dailyWorkData: [] }
        }

        // 转换数据库字段名 (snake_case -> camelCase)
        const newData = activeData.map(d => {
          // 处理日期格式 - 正确处理时区
          let dateStr = d.date
          if (d.date && typeof d.date === 'object') {
            // Date对象：使用本地时区的年月日
            const year = d.date.getFullYear()
            const month = String(d.date.getMonth() + 1).padStart(2, '0')
            const day = String(d.date.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          } else if (d.date && typeof d.date === 'string') {
            // 字符串：可能是ISO格式，需要转换为本地日期
            if (d.date.includes('T')) {
              // ISO格式字符串，如 "2026-03-01T16:00:00.000Z"
              const dateObj = new Date(d.date)
              const year = dateObj.getFullYear()
              const month = String(dateObj.getMonth() + 1).padStart(2, '0')
              const day = String(dateObj.getDate()).padStart(2, '0')
              dateStr = `${year}-${month}-${day}`
            } else {
              // 已经是简单日期格式，如 "2026-03-01"
              dateStr = d.date.split('T')[0].split(' ')[0]
            }
          }

          return {
            id: d.id,
            date: dateStr,
            // 数据库字段 (snake_case) -> 前端字段 (camelCase)
            nasdaq: d.nasdaq || '',
            ftse: d.ftse || '',
            dax: d.dax || '',
            n225: d.n225 || '',
            hsi: d.hsi || '',
            bitcoin: d.bitcoin || '',
            eurusd: d.eurusd || '',
            usdjpy: d.usdjpy || '',
            usdcny: d.usdcny || '',
            oil: d.oil || '',
            gold: d.gold || '',
            bond: d.bond || '',
            consecutive: d.consecutive || '',
            a50: d.a50 || '',
            shIndex: d.sh_index || '',
            sh2dayPower: d.sh_2day_power || '',
            sh13dayPower: d.sh_13day_power || '',
            upCount: d.up_count || '',
            limitUp: d.limit_up || '',
            downCount: d.down_count || '',
            limitDown: d.limit_down || '',
            volume: d.volume || '',
            sentiment: d.sentiment || '',
            prediction: d.prediction || '',
            tradeStatus: d.trade_status || '',
            reviewPlan: d.review_plan || '',
            reviewExecution: d.review_execution || '',
            reviewResult: d.review_result || '',
            createdAt: d.created_at || new Date().toISOString(),
            updatedAt: d.updated_at || new Date().toISOString(),
            deleted: d.deleted || false,
            deletedAt: d.deleted_at || null
          }
        })

        // 使用 Map 按日期去重，数据库数据优先
        const dataMap = new Map()
        // 只加数据库数据（不再合并本地数据）
        newData.forEach(d => {
          if (d.date) dataMap.set(d.date, d)
        })

        const mergedData = Array.from(dataMap.values())
        // 按日期降序排序
        mergedData.sort((a, b) => new Date(b.date) - new Date(a.date))

        console.log('[Store] 合并后的数据:', mergedData.map(d => d.date))
        return { dailyWorkData: mergedData }
      }),

      // 删除每日功课数据
      deleteDailyWorkData: async (id) => {
        console.log('[Store] 删除每日功课，id:', id)
        try {
          await apiCall(`/api/daily_work_data/${id}`, 'DELETE')
          set((state) => ({
            dailyWorkData: state.dailyWorkData.filter(d => d.id !== id)
          }))
          return { success: true }
        } catch (err) {
          console.error('[Store] 删除失败:', err)
          return { success: false, error: err }
        }
      },

      // 批量删除每日功课数据（使用ID删除）
      deleteMultipleDailyWorkData: async (ids) => {
        console.log('[Store] 删除每日功课，接收到的ids:', ids)

        try {
          // 按ID逐条删除
          const deleteResults = []
          for (const id of ids) {
            console.log('[Store] 删除ID:', id)
            const result = await apiCall(`/api/daily_work_data/${id}`, 'DELETE')
            deleteResults.push(result)
          }

          console.log('[Store] 所有删除结果:', deleteResults)

          // 从数据库重新同步数据（确保删除已生效）
          const syncResponse = await apiCall('/api/sync/all')
          if (syncResponse.success && syncResponse.data && syncResponse.data.daily_work_data !== undefined) {
            const { daily_work_data } = syncResponse.data
            set((state) => {
              // 使用 importDailyWorkData 来更新数据
              state.importDailyWorkData(daily_work_data)
              return {}
            })
          }

          return { success: true, results: deleteResults }
        } catch (err) {
          console.error('[Store] 删除失败:', err)
          return { success: false, error: err }
        }
      },

      // 恢复每日功课数据
      restoreDailyWorkData: (ids) => set((state) => {
        apiCall(`/api/daily_work_data/bulk/restore`, 'PATCH', { ids })
        return {
          dailyWorkData: state.dailyWorkData.map(d =>
            ids.includes(d.id) ? { ...d, deleted: false, deletedAt: null } : d
          )
        }
      }),

      // 永久删除每日功课数据
      permanentDeleteDailyWorkData: (ids) => set((state) => {
        apiCall(`/api/daily_work_data/bulk/permanent`, 'DELETE', { ids })
        return {
          dailyWorkData: state.dailyWorkData.filter(d => !ids.includes(d.id))
        }
      }),

      // 更新每日功课数据
      updateDailyWorkData: async (id, data) => {
        console.log('[Store] 更新每日功课数据:', id, data)

        // 构造数据库更新数据 - 使用下划线命名
        const dbData = {
          date: data.date || null,
          nasdaq: data.nasdaq || null,
          ftse: data.ftse || null,
          dax: data.dax || null,
          n225: data.n225 || null,
          hsi: data.hsi || null,
          bitcoin: data.bitcoin || null,
          eurusd: data.eurusd || null,
          usdjpy: data.usdjpy || null,
          usdcny: data.usdcny || null,
          oil: data.oil || null,
          gold: data.gold || null,
          bond: data.bond || null,
          consecutive: data.consecutive || null,
          a50: data.a50 || null,
          sh_index: data.shIndex || null,
          sh_2day_power: data.sh2dayPower || null,
          sh_13day_power: data.sh13dayPower || null,
          up_count: data.upCount || null,
          limit_up: data.limitUp || null,
          down_count: data.downCount || null,
          limit_down: data.limitDown || null,
          volume: data.volume || null,
          sentiment: data.sentiment || null,
          prediction: data.prediction || null,
          trade_status: data.tradeStatus || null,
          review_plan: data.reviewPlan || null,
          review_execution: data.reviewExecution || null,
          review_result: data.reviewResult || null,
          updated_at: new Date().toISOString()
        }

        try {
          // 更新数据库
          const res = await apiCall(`/api/daily_work_data/${id}`, 'PUT', dbData)
          console.log('[Store] 更新数据库结果:', res)

          // 更新后从数据库重新同步数据，确保数据一致性
          const syncResponse = await apiCall('/api/sync/all')
          if (syncResponse.success && syncResponse.data && syncResponse.data.daily_work_data !== undefined) {
            const { daily_work_data } = syncResponse.data
            set((state) => {
              // 使用 importDailyWorkData 来更新数据
              state.importDailyWorkData(daily_work_data)
              return {}
            })
          }
        } catch (error) {
          console.error('[Store] 更新数据库失败:', error)
          throw error
        }
      },

      // 添加心理测试
      // 添加心理测试结果（保存到数据库）
      addPsychologicalTest: async (test) => {
        try {
          // 将前端字段 date 映射为数据库字段 test_date
          const dbData = {
            test_date: test.date,
            scores: test.scores,
            overall_score: test.overallScore
          }

          const response = await fetch(`${API_BASE_URL}/api/psychological_test_results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
          }).then(res => res.json())

          if (response.success) {
            // 保存成功后，从数据库重新同步数据
            await apiCall('/api/sync/all').then(syncResponse => {
              if (syncResponse.success && syncResponse.data) {
                set((state) => {
                  const mappedData = (syncResponse.data.psychological_test_results || []).map(item => ({
                    ...item,
                    date: item.test_date,
                    overallScore: item.overall_score
                  }))
                  return { psychologicalTests: mappedData }
                })
              }
            })
          }
          return response
        } catch (error) {
          console.error('[Store] 添加心理测试失败:', error)
          return { success: false, error: error.message }
        }
      },

      // 更新心理测试结果（保存到数据库）
      updatePsychologicalTest: async (dateStr, testData) => {
        try {
          // 使用test_date作为查询条件，直接使用SQL更新
          const dbData = {
            scores: testData.scores,
            overall_score: testData.overallScore
          }

          const response = await fetch(`${API_BASE_URL}/api/psychological_test_results/by-date/${dateStr}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
          }).then(res => res.json())

          if (response.success) {
            // 更新成功后，从数据库重新同步数据
            await apiCall('/api/sync/all').then(syncResponse => {
              if (syncResponse.success && syncResponse.data) {
                set((state) => {
                  const mappedData = (syncResponse.data.psychological_test_results || []).map(item => ({
                    ...item,
                    date: item.test_date,
                    overallScore: item.overall_score
                  }))
                  return { psychologicalTests: mappedData }
                })
              }
            })
          }
          return response
        } catch (error) {
          console.error('[Store] 更新心理测试失败:', error)
          return { success: false, error: error.message }
        }
      },

      // 批量导入心理测试结果
      importPsychologicalTestResults: (dataList) => set((state) => {
        if (!dataList || dataList === undefined) {
          console.log('[Store] 心理测试结果数据未提供，保持现有数据')
          return {}
        }
        // 将数据库字段映射为前端字段
        const mappedData = dataList.map(item => ({
          ...item,
          date: item.test_date, // 映射 test_date -> date
          overallScore: item.overall_score // 映射 overall_score -> overallScore
        }))
        console.log('[Store] 映射后的心理测试数据:', mappedData.slice(0, 3))
        return { psychologicalTests: mappedData }
      }),

      // 批量导入心理测试指标
      importPsychologicalIndicators: (dataList) => set((state) => {
        if (!dataList || dataList === undefined) {
          console.log('[Store] 心理测试指标数据未提供，保持现有数据')
          return {}
        }
        // 确保数值字段是正确的类型
        const mappedData = dataList.map(item => ({
          ...item,
          minScore: parseInt(item.min_score),
          maxScore: parseInt(item.max_score),
          weight: parseFloat(item.weight)
        }))
        console.log('[Store] 映射后的心理测试指标数据:', mappedData)
        return { psychologicalIndicators: mappedData }
      }),

      // 更新心理测试指标（保存到数据库）
      updatePsychologicalIndicator: async (id, indicator) => {
        try {
          // 将前端字段映射为数据库字段
          const dbData = {
            indicator_id: indicator.indicatorId || indicator.id,
            name: indicator.name,
            description: indicator.description,
            min_score: indicator.minScore || indicator.min_score,
            max_score: indicator.maxScore || indicator.max_score,
            weight: indicator.weight
          }

          // 使用通用PUT API更新（使用id）
          const response = await fetch(`${API_BASE_URL}/api/psychological_indicators/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
          }).then(res => res.json())

          if (response.success) {
            // 更新成功后，从数据库重新同步数据
            await apiCall('/api/sync/all').then(syncResponse => {
              if (syncResponse.success && syncResponse.data) {
                set((state) => {
                  const mappedData = (syncResponse.data.psychological_indicators || []).map(item => ({
                    ...item,
                    minScore: parseInt(item.min_score),
                    maxScore: parseInt(item.max_score),
                    weight: parseFloat(item.weight)
                  }))
                  return { psychologicalIndicators: mappedData }
                })
              }
            })
          }
          return response
        } catch (error) {
          console.error('[Store] 更新心理测试指标失败:', error)
          return { success: false, error: error.message }
        }
      },

      // 添加交易策略
      addStrategy: (type, strategy) => set((state) => ({
        strategies: {
          ...state.strategies,
          [type]: [...state.strategies[type], { ...strategy, id: Date.now(), deleted: false, deletedAt: null }]
        }
      })),

      // 删除交易策略
      deleteStrategy: (type, id) => set((state) => {
        apiCall(`/api/trading_strategies/${id}`, 'DELETE')
        return {
          strategies: {
            ...state.strategies,
            [type]: state.strategies[type].map(s =>
              s.id === id ? { ...s, deleted: true, deletedAt: new Date().toISOString() } : s
            )
          }
        }
      }),

      // 恢复交易策略
      restoreStrategy: (type, id) => set((state) => {
        apiCall(`/api/trading_strategies/${id}/restore`, 'PATCH')
        return {
          strategies: {
            ...state.strategies,
            [type]: state.strategies[type].map(s =>
              s.id === id ? { ...s, deleted: false, deletedAt: null } : s
            )
          }
        }
      }),

      // 永久删除交易策略
      permanentDeleteStrategy: (type, id) => set((state) => {
        apiCall(`/api/trading_strategies/${id}/permanent`, 'DELETE')
        return {
          strategies: {
            ...state.strategies,
            [type]: state.strategies[type].filter(s => s.id !== id)
          }
        }
      }),

      // 添加风险模型
      addRiskModel: (model) => set((state) => ({
        riskModels: [...state.riskModels, { ...model, id: Date.now(), deleted: false, deletedAt: null }]
      })),

      // 删除风险模型
      deleteRiskModel: (id) => set((state) => {
        apiCall(`/api/risk_models/${id}`, 'DELETE')
        return {
          riskModels: state.riskModels.map(m =>
            m.id === id ? { ...m, deleted: true, deletedAt: new Date().toISOString() } : m
          )
        }
      }),

      // 恢复风险模型
      restoreRiskModel: (id) => set((state) => {
        apiCall(`/api/risk_models/${id}/restore`, 'PATCH')
        return {
          riskModels: state.riskModels.map(m =>
            m.id === id ? { ...m, deleted: false, deletedAt: null } : m
          )
        }
      }),

      // 永久删除风险模型
      permanentDeleteRiskModel: (id) => set((state) => {
        apiCall(`/api/risk_models/${id}/permanent`, 'DELETE')
        return {
          riskModels: state.riskModels.filter(m => m.id !== id)
        }
      }),

      // 更新风险配置
      updateRiskConfig: (config) => set((state) => ({
        riskConfig: { ...state.riskConfig, ...config }
      })),

      // 更新账户风险数据
      updateAccountRiskData: (data) => set((state) => ({
        accountRiskData: { ...state.accountRiskData, ...data }
      })),

      // 添加技术指标
      addTechnicalIndicator: (indicator) => set((state) => ({
        technicalIndicators: [...state.technicalIndicators, { ...indicator, id: Date.now(), deleted: false, deletedAt: null }]
      })),

      // 更新技术指标
      updateTechnicalIndicator: (id, indicator) => set((state) => ({
        technicalIndicators: state.technicalIndicators.map(i =>
          i.id === id ? indicator : i
        )
      })),

      // 删除技术指标
      deleteTechnicalIndicator: (id) => set((state) => {
        apiCall(`/api/technical_indicators/${id}`, 'DELETE')
        return {
          technicalIndicators: state.technicalIndicators.map(i =>
            i.id === id ? { ...i, deleted: true, deletedAt: new Date().toISOString() } : i
          )
        }
      }),

      // 恢复技术指标
      restoreTechnicalIndicator: (id) => set((state) => {
        apiCall(`/api/technical_indicators/${id}/restore`, 'PATCH')
        return {
          technicalIndicators: state.technicalIndicators.map(i =>
            i.id === id ? { ...i, deleted: false, deletedAt: null } : i
          )
        }
      }),

      // 永久删除技术指标
      permanentDeleteTechnicalIndicator: (id) => set((state) => {
        apiCall(`/api/technical_indicators/${id}/permanent`, 'DELETE')
        return {
          technicalIndicators: state.technicalIndicators.filter(i => i.id !== id)
        }
      }),

      // 添加交易策略记录
      addStrategyRecord: async (record) => {
        console.log('[Store] 添加交易策略记录:', record)

        const now = new Date().toISOString()

        // 构造数据库数据 (snake_case)
        const dbData = {
          strategy_type: record.strategyType,
          name: record.name,
          eval_standard_1: record.evalStandard1,
          eval_standard_2: record.evalStandard2,
          eval_standard_3: record.evalStandard3,
          eval_standard_4: record.evalStandard4,
          eval_standard_5: record.evalStandard5,
          status: record.status || '启用',
          created_at: now,
          updated_at: now
        }

        // 只有当 revisionVersion 有值时才包含在数据中
        if (record.revisionVersion && record.revisionVersion.trim() !== '') {
          dbData.revision_version = record.revisionVersion
        }

        try {
          // 保存到数据库
          const res = await apiCall('/api/trading_strategies', 'POST', dbData)
          console.log('[Store] 交易策略保存到数据库结果:', res)

          if (res.success && res.data && res.data.id) {
            // 保存成功后,从数据库重新同步数据,确保数据一致性
            const syncResponse = await apiCall('/api/sync/all')
            if (syncResponse.success && syncResponse.data && syncResponse.data.trading_strategies !== undefined) {
              const { trading_strategies } = syncResponse.data
              set((state) => {
                // 使用 importTradingStrategies 来更新数据
                state.importTradingStrategies(trading_strategies)
                return {}
              })
            }
            return { ...record, id: res.data.id }
          } else {
            console.warn('[Store] 数据库返回数据不完整')
            return record
          }
        } catch (error) {
          console.error('[Store] 保存交易策略到数据库失败:', error)
          throw error
        }
      },

      // 删除交易策略记录
      deleteStrategyRecord: async (id) => {
        console.log('[Store] 删除交易策略记录, id:', id)
        try {
          await apiCall(`/api/trading_strategies/${id}`, 'DELETE')
          // 从数据库重新同步数据
          const syncResponse = await apiCall('/api/sync/all')
          if (syncResponse.success && syncResponse.data && syncResponse.data.trading_strategies !== undefined) {
            const { trading_strategies } = syncResponse.data
            set((state) => {
              state.importTradingStrategies(trading_strategies)
              return {}
            })
          }
          return { success: true }
        } catch (err) {
          console.error('[Store] 删除失败:', err)
          return { success: false, error: err }
        }
      },

      // 批量删除交易策略记录
      deleteMultipleStrategyRecords: async (ids) => {
        console.log('[Store] 批量删除交易策略记录, ids:', ids)
        try {
          await apiCall(`/api/trading_strategies/bulk/delete`, 'POST', { ids })
          // 从数据库重新同步数据
          const syncResponse = await apiCall('/api/sync/all')
          if (syncResponse.success && syncResponse.data && syncResponse.data.trading_strategies !== undefined) {
            const { trading_strategies } = syncResponse.data
            set((state) => {
              state.importTradingStrategies(trading_strategies)
              return {}
            })
          }
          return { success: true }
        } catch (err) {
          console.error('[Store] 批量删除失败:', err)
          return { success: false, error: err }
        }
      },

      // 恢复交易策略记录
      restoreStrategyRecord: (id) => set((state) => {
        apiCall(`/api/strategy_records/${id}/restore`, 'PATCH')
        return {
          strategyRecords: state.strategyRecords.map(r =>
            r.id === id ? { ...r, deleted: false, deletedAt: null } : r
          )
        }
      }),

      // 永久删除交易策略记录
      permanentDeleteStrategyRecord: (id) => set((state) => {
        apiCall(`/api/strategy_records/${id}/permanent`, 'DELETE')
        return {
          strategyRecords: state.strategyRecords.filter(r => r.id !== id)
        }
      }),

      // 批量恢复交易策略记录
      restoreMultipleStrategyRecords: (ids) => set((state) => {
        apiCall(`/api/strategy_records/bulk/restore`, 'PATCH', { ids })
        return {
          strategyRecords: state.strategyRecords.map(r =>
            ids.includes(r.id) ? { ...r, deleted: false, deletedAt: null } : r
          )
        }
      }),

      // 批量永久删除交易策略记录
      permanentDeleteMultipleStrategyRecords: (ids) => set((state) => ({
        strategyRecords: state.strategyRecords.filter(r => !ids.includes(r.id))
      })),

      // 更新交易策略记录
      updateStrategyRecord: async (id, record) => {
        console.log('[Store] 更新交易策略记录:', id, record)

        // 构造数据库更新数据 (snake_case)
        const dbData = {
          strategy_type: record.strategyType,
          name: record.name,
          eval_standard_1: record.evalStandard1,
          eval_standard_2: record.evalStandard2,
          eval_standard_3: record.evalStandard3,
          eval_standard_4: record.evalStandard4,
          eval_standard_5: record.evalStandard5,
          status: record.status,
          updated_at: new Date().toISOString()
        }

        // 只有当 revisionVersion 有值时才包含在更新数据中
        if (record.revisionVersion && record.revisionVersion.trim() !== '') {
          dbData.revision_version = record.revisionVersion
        }

        try {
          // 更新数据库
          const res = await apiCall(`/api/trading_strategies/${id}`, 'PUT', dbData)
          console.log('[Store] 更新数据库结果:', res)

          // 更新后从数据库重新同步数据,确保数据一致性
          const syncResponse = await apiCall('/api/sync/all')
          if (syncResponse.success && syncResponse.data && syncResponse.data.trading_strategies !== undefined) {
            const { trading_strategies } = syncResponse.data
            set((state) => {
              state.importTradingStrategies(trading_strategies)
              return {}
            })
          }
        } catch (error) {
          console.error('[Store] 更新数据库失败:', error)
          throw error
        }
      },

      // 导入交易策略记录
      importStrategyRecords: async (dataList) => {
        console.log('[Store] 导入交易策略记录, 数量:', dataList.length)

        try {
          const now = new Date().toISOString()

          // 构造数据库数据数组 (snake_case)
          const dbDataArray = dataList.map(record => {
            const dbData = {
              strategy_type: record.strategyType,
              name: record.name,
              eval_standard_1: record.evalStandard1,
              eval_standard_2: record.evalStandard2,
              eval_standard_3: record.evalStandard3,
              eval_standard_4: record.evalStandard4,
              eval_standard_5: record.evalStandard5,
              status: record.status || '启用',
              created_at: now,
              updated_at: now
            }

            // 只有当 revisionVersion 有值时才包含在数据中
            if (record.revisionVersion && record.revisionVersion.trim() !== '') {
              dbData.revision_version = record.revisionVersion
            }

            return dbData
          })

          console.log('[Store] 准备批量保存, 数据:', dbDataArray.length)

          // 使用批量API保存到数据库
          const res = await apiCall('/api/trading_strategies/bulk', 'POST', dbDataArray)
          console.log('[Store] 批量保存结果:', res)

          // 保存成功后,从数据库重新同步数据
          const syncResponse = await apiCall('/api/sync/all')
          if (syncResponse.success && syncResponse.data && syncResponse.data.trading_strategies !== undefined) {
            const { trading_strategies } = syncResponse.data
            set((state) => {
              state.importTradingStrategies(trading_strategies)
              return {}
            })
          }

          return { success: true, count: dbDataArray.length }
        } catch (error) {
          console.error('[Store] 导入失败:', error)
          throw error
        }
      },

      // 导入交易策略 (从数据库同步)
      importTradingStrategies: (dataList) => set((state) => {
        if (!dataList || dataList === undefined) {
          console.log('[Store] 交易策略数据未提供,保持现有数据')
          return {}
        }

        // 过滤已删除的数据
        const activeData = dataList.filter(d => d.deleted !== true)
        console.log('[Store] 过滤已删除后的交易策略数据:', activeData.length)

        // 转换数据库字段名 (snake_case -> camelCase)
        const newData = activeData.map(d => ({
          id: d.id,
          revisionVersion: d.revision_version || '', // 修订版本
          strategyType: d.strategy_type,
          name: d.name,
          evalStandard1: d.eval_standard_1,
          evalStandard2: d.eval_standard_2,
          evalStandard3: d.eval_standard_3,
          evalStandard4: d.eval_standard_4,
          evalStandard5: d.eval_standard_5,
          status: d.status,
          createdAt: d.created_at || new Date().toISOString(),
          updatedAt: d.updated_at || new Date().toISOString(),
          deleted: d.deleted || false,
          deletedAt: d.deleted_at || null
        }))

        console.log('[Store] 导入的交易策略数据:', newData.map(d => ({ id: d.id, name: d.name })))
        return { strategyRecords: newData }
      }),

      // 添加预约单
      addOrder: (order) => set((state) => {
        const tradeNumber = state.generateTradeNumber()
        const newOrder = { ...order, id: Date.now(), tradeNumber, createdAt: new Date().toISOString(), deleted: false, deletedAt: null }

        // 同步到数据库
        apiCall('/api/orders', 'POST', newOrder).catch(err => console.error('同步订单到数据库失败:', err))

        return {
          orders: [...state.orders, newOrder]
        }
      }),

      // 执行预约单
      executeOrder: (id) => set((state) => {
        const order = state.orders.find(o => o.id === id)
        if (!order) return state

        const accountType = order.isVirtual ? 'virtual' : 'real'
        const currentAccount = state.account[accountType]

        let newTradeRecords = []

        if (order.type === 'buy') {
          // 执行买入：同时创建买入和卖出记录
          const buyRecord = {
            id: Date.now(),
            tradeNumber: order.tradeNumber,
            tradeType: '买入',
            symbol: order.symbol,
            name: order.name || '',
            buyPrice: parseFloat(order.price),
            buyQuantity: parseInt(order.quantity),
            buyTime: new Date().toISOString(),
            sellPrice: null,
            sellQuantity: null,
            sellTime: null,
            holdDuration: 0,
            profit: 0,
            profitPercent: 0,
            buyGrade: order.overallScore >= 70 ? 'A' : order.overallScore >= 40 ? 'B' : 'C',
            sellGrade: null,
            overallScore: order.overallScore,
            psychologicalScore: order.psychologicalScore,
            strategyScore: order.strategyScore,
            riskScore: order.riskScore,
            createdAt: new Date().toISOString()
          }

          const sellRecord = {
            id: Date.now() + 1,
            tradeNumber: order.tradeNumber,
            tradeType: '卖出',
            symbol: order.symbol,
            name: order.name || '',
            buyPrice: parseFloat(order.price),
            buyQuantity: parseInt(order.quantity),
            buyTime: new Date().toISOString(),
            sellPrice: null,
            sellQuantity: null,
            sellTime: null,
            holdDuration: 0,
            profit: 0,
            profitPercent: 0,
            buyGrade: order.overallScore >= 70 ? 'A' : order.overallScore >= 40 ? 'B' : 'C',
            sellGrade: null,
            overallScore: order.overallScore,
            psychologicalScore: order.psychologicalScore,
            strategyScore: order.strategyScore,
            riskScore: order.riskScore,
            createdAt: new Date().toISOString()
          }

          newTradeRecords = [buyRecord, sellRecord]
        } else {
          // 执行卖出：找到对应的买入记录并更新卖出信息
          const buyRecord = state.tradeRecords.find(t =>
            t.tradeType === '买入' &&
            t.symbol === order.symbol &&
            t.sellPrice === null &&
            t.sellQuantity === null
          )

          if (buyRecord) {
            // 更新买入记录的卖出信息
            const sellPrice = parseFloat(order.price)
            const buyPrice = buyRecord.buyPrice
            const quantity = buyRecord.buyQuantity
            const profit = (sellPrice - buyPrice) * quantity
            const profitPercent = ((sellPrice - buyPrice) / buyPrice) * 100
            const buyTime = new Date(buyRecord.buyTime)
            const sellTime = new Date()
            const holdDuration = Math.ceil((sellTime - buyTime) / (1000 * 60 * 60 * 24))

            const updatedBuyRecord = {
              ...buyRecord,
              sellPrice,
              sellQuantity: quantity,
              sellTime: sellTime.toISOString(),
              holdDuration,
              profit,
              profitPercent,
              sellGrade: order.overallScore >= 70 ? 'A' : order.overallScore >= 40 ? 'B' : 'C',
              overallScore: ((buyRecord.overallScore + order.overallScore) / 2).toFixed(1)
            }

            // 更新对应的卖出记录
            const sellRecord = state.tradeRecords.find(t =>
              t.tradeNumber === buyRecord.tradeNumber &&
              t.tradeType === '卖出'
            )

            const updatedSellRecord = sellRecord ? {
              ...sellRecord,
              sellPrice,
              sellQuantity: quantity,
              sellTime: sellTime.toISOString(),
              holdDuration,
              profit,
              profitPercent,
              sellGrade: order.overallScore >= 70 ? 'A' : order.overallScore >= 40 ? 'B' : 'C',
              overallScore: ((buyRecord.overallScore + order.overallScore) / 2).toFixed(1)
            } : null

            newTradeRecords = state.tradeRecords.map(t =>
              t.id === buyRecord.id ? updatedBuyRecord :
                updatedSellRecord && t.id === updatedSellRecord.id ? updatedSellRecord :
                t
            )
          }
        }

        // 创建账单明细
        const transaction = {
          id: Date.now(),
          type: order.type === 'buy' ? '买入' : '卖出',
          symbol: order.symbol,
          name: order.name || '',
          amount: order.price * order.quantity * (order.type === 'buy' ? -1 : 1),
          balance: order.type === 'buy'
            ? currentAccount.balance - order.price * order.quantity
            : currentAccount.balance + order.price * order.quantity,
          createdAt: new Date().toISOString()
        }

        // 更新预约单状态
        const updatedOrders = state.orders.map(o =>
          o.id === id ? { ...o, status: 'executed', executedAt: new Date().toISOString() } : o
        )

        return {
          orders: updatedOrders,
          tradeRecords: order.type === 'buy'
            ? [...state.tradeRecords, ...newTradeRecords]
            : newTradeRecords,
          transactions: accountType === 'real'
            ? [...state.transactions, transaction]
            : state.transactions,
          virtualTransactions: accountType === 'virtual'
            ? [...state.virtualTransactions, transaction]
            : state.virtualTransactions,
          account: {
            ...state.account,
            [accountType]: {
              ...currentAccount,
              balance: order.type === 'buy'
                ? currentAccount.balance - order.price * order.quantity
                : currentAccount.balance + order.price * order.quantity
            }
          }
        }
      }),

      // 作废预约单
      cancelOrder: (id) => set((state) => {
        const order = state.orders.find(o => o.id === id)
        if (!order) return state

        // 更新预约单状态
        const updatedOrders = state.orders.map(o =>
          o.id === id ? { ...o, status: 'cancelled', cancelledAt: new Date().toISOString() } : o
        )

        return {
          orders: updatedOrders
        }
      }),

      // 删除预约单
      deleteOrder: (id) => set((state) => {
        apiCall(`/api/orders/${id}`, 'DELETE')
        return {
          orders: state.orders.map(o =>
            o.id === id ? { ...o, deleted: true, deletedAt: new Date().toISOString() } : o
          )
        }
      }),

      // 批量删除预约单
      deleteMultipleOrders: (ids) => set((state) => {
        apiCall(`/api/orders/bulk`, 'DELETE', { ids })
        return {
          orders: state.orders.map(o =>
            ids.includes(o.id) ? { ...o, deleted: true, deletedAt: new Date().toISOString() } : o
          )
        }
      }),

      // 添加止损止盈订单
      addStopOrder: (order) => set((state) => {
        const orderId = 'SO' + Date.now()
        return {
          stopOrders: [...state.stopOrders, {
            ...order,
            id: orderId,
            orderId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            activatedAt: null,
            executedAt: null,
            cancelledAt: null,
          }]
        }
      }),

      // 更新止损止盈订单
      updateStopOrder: (id, data) => set((state) => ({
        stopOrders: state.stopOrders.map(o =>
          o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString() } : o
        )
      })),

      // 删除止损止盈订单
      deleteStopOrder: (id) => set((state) => ({
        stopOrders: state.stopOrders.filter(o => o.id !== id)
      })),

      // 触发止损止盈订单（系统调用）
      triggerStopOrder: (id, triggerPrice, triggerType) => set((state) => {
        const order = state.stopOrders.find(o => o.id === id)
        if (!order) return state

        return {
          stopOrders: state.stopOrders.map(o =>
            o.id === id ? {
              ...o,
              status: 'executed',
              triggerPrice,
              triggerType,
              executedAt: new Date().toISOString()
            } : o
          )
        }
      }),

      // 取消止损止盈订单
      cancelStopOrder: (id) => set((state) => ({
        stopOrders: state.stopOrders.map(o =>
          o.id === id ? { ...o, status: 'cancelled', cancelledAt: new Date().toISOString() } : o
        )
      })),

      // 更新风控数据
      updateRiskData: (data) => set((state) => ({
        riskData: { ...state.riskData, ...data }
      })),

      // 重置熔断
      resetCircuitBreaker: () => set((state) => ({
        riskData: {
          ...state.riskData,
          isCircuitBroken: false,
          breakUntil: null
        }
      })),

      // 恢复预约单
      restoreOrder: (id) => set((state) => {
        apiCall(`/api/orders/${id}/restore`, 'PATCH')
        return {
          orders: state.orders.map(o =>
            o.id === id ? { ...o, deleted: false, deletedAt: null } : o
          )
        }
      }),

      // 永久删除预约单
      permanentDeleteOrder: (id) => set((state) => {
        apiCall(`/api/orders/${id}/permanent`, 'DELETE')
        return {
          orders: state.orders.filter(o => o.id !== id)
        }
      }),

      // 批量恢复预约单
      restoreMultipleOrders: (ids) => set((state) => {
        apiCall(`/api/orders/bulk/restore`, 'PATCH', { ids })
        return {
          orders: state.orders.map(o =>
            ids.includes(o.id) ? { ...o, deleted: false, deletedAt: null } : o
          )
        }
      }),

      // 批量永久删除预约单
      permanentDeleteMultipleOrders: (ids) => set((state) => {
        apiCall(`/api/orders/bulk/permanent`, 'DELETE', { ids })
        return {
          orders: state.orders.filter(o => !ids.includes(o.id))
        }
      }),

      // 添加账单
      addTransaction: (transaction, accountType = 'real') => set((state) => {
        const newTransaction = { ...transaction, id: Date.now(), deleted: false, deletedAt: null }

        // 同步到数据库
        apiCall('/api/transactions', 'POST', newTransaction).catch(err => console.error('同步账单到数据库失败:', err))

        return {
          transactions: accountType === 'real'
            ? [...state.transactions, newTransaction]
            : state.transactions,
          virtualTransactions: accountType === 'virtual'
            ? [...state.virtualTransactions, newTransaction]
            : state.virtualTransactions,
          account: {
            ...state.account,
            [accountType]: {
              ...state.account[accountType],
              balance: state.account[accountType].balance + transaction.amount
            }
          }
        }
      }),

      // 删除账单
      deleteTransaction: (id, accountType = 'real') => set((state) => {
        apiCall(`/api/transactions/${id}`, 'DELETE')
        if (accountType === 'real') {
          const transaction = state.transactions.find(t => t.id === id)
          const realBalance = (state.account.real && state.account.real.balance) || 0
          return {
            transactions: state.transactions.map(t =>
              t.id === id ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
            ),
            account: {
              ...state.account,
              real: {
                ...(state.account.real || {}),
                balance: transaction
                  ? realBalance - transaction.amount
                  : realBalance
              }
            }
          }
        } else {
          const transaction = state.virtualTransactions.find(t => t.id === id)
          const virtualBalance = (state.account.virtual && state.account.virtual.balance) || 0
          return {
            virtualTransactions: state.virtualTransactions.map(t =>
              t.id === id ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
            ),
            account: {
              ...state.account,
              virtual: {
                ...(state.account.virtual || {}),
                balance: transaction
                  ? virtualBalance - transaction.amount
                  : virtualBalance
              }
            }
          }
        }
      }),

      // 批量删除账单
      deleteMultipleTransactions: (ids, accountType = 'real') => set((state) => {
        apiCall(`/api/transactions/bulk`, 'DELETE', { ids })
        console.log('[Store] deleteMultipleTransactions 被调用')
        console.log('[Store] ids:', ids)
        console.log('[Store] accountType:', accountType)
        console.log('[Store] 删除前实盘交易数:', state.transactions.length)
        console.log('[Store] 删除前虚拟盘交易数:', state.virtualTransactions.length)
        console.log('[Store] account:', state.account)

        if (accountType === 'real') {
          const transactionsToDelete = state.transactions.filter(t => ids.includes(t.id))
          const totalAmount = transactionsToDelete.reduce((sum, t) => sum + t.amount, 0)

          console.log('[Store] 实盘 - 删除的交易数:', transactionsToDelete.length)
          console.log('[Store] 实盘 - 总金额:', totalAmount)
          console.log('[Store] 实盘 - state.account.real:', state.account.real)

          const realBalance = (state.account.real && state.account.real.balance) || 0
          console.log('[Store] 实盘 - 原余额:', realBalance)

          const newState = {
            transactions: state.transactions.map(t =>
              ids.includes(t.id) ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
            ),
            account: {
              ...state.account,
              real: {
                ...(state.account.real || {}),
                balance: realBalance - totalAmount
              }
            }
          }

          console.log('[Store] 实盘 - 新余额:', newState.account.real.balance)
          console.log('[Store] 实盘 - 删除后交易数:', newState.transactions.length)

          return newState
        } else {
          const transactionsToDelete = state.virtualTransactions.filter(t => ids.includes(t.id))
          const totalAmount = transactionsToDelete.reduce((sum, t) => sum + t.amount, 0)

          console.log('[Store] 虚拟盘 - 删除的交易数:', transactionsToDelete.length)
          console.log('[Store] 虚拟盘 - 总金额:', totalAmount)
          console.log('[Store] 虚拟盘 - state.account.virtual:', state.account.virtual)

          const virtualBalance = (state.account.virtual && state.account.virtual.balance) || 0
          console.log('[Store] 虚拟盘 - 原余额:', virtualBalance)

          const newState = {
            virtualTransactions: state.virtualTransactions.map(t =>
              ids.includes(t.id) ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
            ),
            account: {
              ...state.account,
              virtual: {
                ...(state.account.virtual || {}),
                balance: virtualBalance - totalAmount
              }
            }
          }

          console.log('[Store] 虚拟盘 - 新余额:', newState.account.virtual.balance)
          console.log('[Store] 虚拟盘 - 删除后交易数:', newState.virtualTransactions.length)

          return newState
        }
      }),

      // 恢复账单
      restoreTransaction: (id, accountType = 'real') => set((state) => {
        apiCall(`/api/transactions/${id}/restore`, 'PATCH')
        if (accountType === 'real') {
          const transaction = state.transactions.find(t => t.id === id && t.deleted === true)
          const realBalance = (state.account.real && state.account.real.balance) || 0
          return {
            transactions: state.transactions.map(t =>
              t.id === id ? { ...t, deleted: false, deletedAt: null } : t
            ),
            account: {
              ...state.account,
              real: {
                ...(state.account.real || {}),
                balance: transaction ? realBalance + transaction.amount : realBalance
              }
            }
          }
        } else {
          const transaction = state.virtualTransactions.find(t => t.id === id && t.deleted === true)
          const virtualBalance = (state.account.virtual && state.account.virtual.balance) || 0
          return {
            virtualTransactions: state.virtualTransactions.map(t =>
              t.id === id ? { ...t, deleted: false, deletedAt: null } : t
            ),
            account: {
              ...state.account,
              virtual: {
                ...(state.account.virtual || {}),
                balance: transaction ? virtualBalance + transaction.amount : virtualBalance
              }
            }
          }
        }
      }),

      // 永久删除账单
      permanentDeleteTransaction: (id, accountType = 'real') => set((state) => {
        apiCall(`/api/transactions/${id}/permanent`, 'DELETE')
        if (accountType === 'real') {
          return {
            transactions: state.transactions.filter(t => t.id !== id)
          }
        } else {
          return {
            virtualTransactions: state.virtualTransactions.filter(t => t.id !== id)
          }
        }
      }),

      // 批量恢复账单
      restoreMultipleTransactions: (ids, accountType = 'real') => set((state) => {
        if (accountType === 'real') {
          const transactionsToRestore = state.transactions.filter(t => ids.includes(t.id) && t.deleted === true)
          const totalAmount = transactionsToRestore.reduce((sum, t) => sum + t.amount, 0)
          const realBalance = (state.account.real && state.account.real.balance) || 0
          return {
            transactions: state.transactions.map(t =>
              ids.includes(t.id) ? { ...t, deleted: false, deletedAt: null } : t
            ),
            account: {
              ...state.account,
              real: {
                ...(state.account.real || {}),
                balance: realBalance + totalAmount
              }
            }
          }
        } else {
          const transactionsToRestore = state.virtualTransactions.filter(t => ids.includes(t.id) && t.deleted === true)
          const totalAmount = transactionsToRestore.reduce((sum, t) => sum + t.amount, 0)
          const virtualBalance = (state.account.virtual && state.account.virtual.balance) || 0
          return {
            virtualTransactions: state.virtualTransactions.map(t =>
              ids.includes(t.id) ? { ...t, deleted: false, deletedAt: null } : t
            ),
            account: {
              ...state.account,
              virtual: {
                ...(state.account.virtual || {}),
                balance: virtualBalance + totalAmount
              }
            }
          }
        }
      }),

      // 批量永久删除账单
      permanentDeleteMultipleTransactions: (ids, accountType = 'real') => set((state) => {
        if (accountType === 'real') {
          return {
            transactions: state.transactions.filter(t => !ids.includes(t.id))
          }
        } else {
          return {
            virtualTransactions: state.virtualTransactions.filter(t => !ids.includes(t.id))
          }
        }
      }),

      // 计算交易盈亏
      calculateTradeProfit: (tradeId, profit) => set((state) => ({
        tradeRecords: state.tradeRecords.map(t =>
          t.id === tradeId ? { ...t, profit } : t
        )
      })),

      // 清除今天的测试记录
      clearTodayTest: () => set((state) => {
        const today = new Date()
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
        return {
          psychologicalTests: state.psychologicalTests.filter(test => {
            const testDate = new Date(test.date)
            const testDateStr = testDate.getFullYear() + '-' + String(testDate.getMonth() + 1).padStart(2, '0') + '-' + String(testDate.getDate()).padStart(2, '0')
            return testDateStr !== todayStr
          })
        }
      }),

      // 重置所有数据
      resetData: () => set({
        account: {
          real: { balance: 100000, totalInvested: 0, totalProfit: 0 },
          virtual: { balance: 100000, totalInvested: 0, totalProfit: 0 }
        },
        dailyWorkData: [],
        psychologicalTests: [],
        orders: [],
        transactions: [],
        virtualTransactions: [],
        tradeRecords: [],
        psychologicalIndicators: [...initialPsychologicalIndicators],
        strategies: { ...initialStrategies },
        riskModels: [...initialRiskModels],
        technicalIndicators: [...initialTechnicalIndicators],
        strategyRecords: [],
        riskConfig: { totalRiskPercent: 6, singleRiskPercent: 2 },
        accountRiskData: {
          stopLossPreLoss: 8500,
          monthlyLoss: 3200,
          startMonthTotal: 200000,
          currentAccount: 191800,
          riskRatio: 5.85,
          accountAvailable: 95.9,
          singleAvailable: 94.15
        },
        stockPool: [],
        stockKlineData: {}
      }),

      // ====== 股票池相关 ======

      // 添加股票到股票池
      addStock: (stock) => set((state) => {
        const newStock = { ...stock, id: Date.now(), createdAt: new Date().toISOString(), deleted: false, deletedAt: null }

        // 同步到数据库
        apiCall('/api/stock_pool', 'POST', newStock).catch(err => console.error('同步股票到数据库失败:', err))

        return {
          stockPool: [...state.stockPool, newStock]
        }
      }),

      // 批量导入订单（从数据库同步）- 合并去重，优先使用数据库数据
      importOrders: (orders) => set((state) => {
        // 转换数据库字段名 (snake_case -> camelCase)
        const newOrders = orders.map(o => ({
          ...o,
          id: o.id?.toString(),
          tradeNumber: o.tradeNumber || o.order_id || o.id?.toString(),
          createdAt: o.created_at || o.createdAt || new Date().toISOString(),
          executedAt: o.executed_at || o.executedAt || null,
          deleted: o.deleted || false,
          deletedAt: o.deleted_at || o.deletedAt || null
        }))
        // 如果本地没有订单，直接使用数据库数据
        if (state.orders.length === 0) {
          return { orders: newOrders }
        }
        // 合并去重：使用 tradeNumber 作为唯一标识
        // 优先使用数据库数据（更新），同时清理本地重复数据
        const orderMap = new Map()
        // 先添加本地订单（如果本地有重复，后面的会覆盖前面的，只保留一条）
        state.orders.forEach(o => {
          const key = o.tradeNumber || o.id?.toString()
          if (key) orderMap.set(key, o)
        })
        // 再添加数据库订单（覆盖本地旧数据，确保最新）
        newOrders.forEach(o => {
          const key = o.tradeNumber || o.id?.toString()
          if (key) {
            orderMap.set(key, o)
          }
        })
        const mergedOrders = Array.from(orderMap.values())
        // 按创建时间排序
        mergedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        return { orders: mergedOrders }
      }),

      // 批量导入账单（从数据库同步）- 合并到现有数据
      importTransactions: (transactions) => set((state) => {
        const newTransactions = transactions.map(t => ({
          ...t,
          createdAt: t.created_at || t.createdAt || new Date().toISOString(),
          deleted: t.deleted || false,
          deletedAt: t.deleted_at || t.deletedAt || null
        }))
        // 按 id 去重
        const existingIds = new Set(state.transactions.map(t => t.id))
        const mergedTransactions = [...state.transactions]
        newTransactions.forEach(t => {
          if (!existingIds.has(t.id)) {
            mergedTransactions.push(t)
          }
        })
        return { transactions: mergedTransactions }
      }),

      // 批量导入交易记录（从数据库同步）- 合并到现有数据
      importTradeRecords: (records) => set((state) => {
        const newRecords = records.map(r => ({
          ...r,
          tradeNumber: r.tradeNumber || r.id,
          createdAt: r.created_at || r.createdAt || new Date().toISOString(),
          deleted: r.deleted || false,
          deletedAt: r.deleted_at || r.deletedAt || null
        }))
        // 按 tradeNumber 去重
        const existingTradeNumbers = new Set(state.tradeRecords.map(r => r.tradeNumber))
        const mergedRecords = [...state.tradeRecords]
        newRecords.forEach(r => {
          if (!existingTradeNumbers.has(r.tradeNumber)) {
            mergedRecords.push(r)
          }
        })
        return { tradeRecords: mergedRecords }
      }),

      // 批量导入股票（从数据库同步）- 合并到现有数据
      importStocks: (stocks) => set((state) => {
        const newStocks = stocks.map(s => ({
          ...s,
          createdAt: s.created_at || s.createdAt || new Date().toISOString(),
          updatedAt: s.updated_at || s.updatedAt || null,
          deleted: s.deleted || false,
          deletedAt: s.deleted_at || s.deletedAt || null
        }))
        // 按 symbol 去重
        const existingSymbols = new Set(state.stockPool.map(s => s.symbol))
        const mergedStocks = [...state.stockPool]
        newStocks.forEach(s => {
          if (!existingSymbols.has(s.symbol)) {
            mergedStocks.push(s)
          }
        })
        return { stockPool: mergedStocks }
      }),

      // 更新股票信息
      updateStock: (id, data) => set((state) => ({
        stockPool: state.stockPool.map(s =>
          s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
        )
      })),

      // 删除股票
      deleteStock: (id) => set((state) => {
        apiCall(`/api/stock_pool/${id}`, 'DELETE')
        return {
          stockPool: state.stockPool.map(s =>
            s.id === id ? { ...s, deleted: true, deletedAt: new Date().toISOString() } : s
          )
        }
      }),

      // 批量删除股票
      deleteMultipleStocks: (ids) => set((state) => {
        apiCall(`/api/stock_pool/bulk`, 'DELETE', { ids })
        return {
          stockPool: state.stockPool.map(s =>
            ids.includes(s.id) ? { ...s, deleted: true, deletedAt: new Date().toISOString() } : s
          )
        }
      }),

      // 恢复股票
      restoreStock: (id) => set((state) => {
        apiCall(`/api/stock_pool/${id}/restore`, 'PATCH')
        return {
          stockPool: state.stockPool.map(s =>
            s.id === id ? { ...s, deleted: false, deletedAt: null } : s
          )
        }
      }),

      // 永久删除股票
      permanentDeleteStock: (id) => set((state) => {
        apiCall(`/api/stock_pool/${id}/permanent`, 'DELETE')
        return {
          stockPool: state.stockPool.filter(s => s.id !== id)
        }
      }),

      // 批量恢复股票
      restoreMultipleStocks: (ids) => set((state) => {
        apiCall(`/api/stock_pool/bulk/restore`, 'PATCH', { ids })
        return {
          stockPool: state.stockPool.map(s =>
            ids.includes(s.id) ? { ...s, deleted: false, deletedAt: null } : s
          )
        }
      }),

      // 批量永久删除股票
      permanentDeleteMultipleStocks: (ids) => set((state) => {
        apiCall(`/api/stock_pool/bulk/permanent`, 'DELETE', { ids })
        return {
          stockPool: state.stockPool.filter(s => !ids.includes(s.id))
        }
      }),

      // 批量导入股票
      importStocks: (stocks) => set((state) => {
        const now = new Date().toISOString()
        return {
          stockPool: [
            ...state.stockPool,
            ...stocks.map(s => ({ ...s, id: Date.now() + Math.random(), createdAt: now, deleted: false, deletedAt: null }))
          ]
        }
      }),

      // 更新股票K线数据
      updateStockKlineData: (symbol, klineData) => set((state) => ({
        stockKlineData: {
          ...state.stockKlineData,
          [symbol]: klineData
        }
      })),

      // 获取股票的K线数据
      getStockKlineData: (symbol) => {
        const state = get()
        return state.stockKlineData[symbol] || []
      },

      // ====== 完整交易记录相关 ======

      // 添加完整交易记录（买入和卖出都完成后自动生成）
      addCompleteTradeRecord: (tradeRecord) => set((state) => {
        const newRecord = { ...tradeRecord, id: Date.now(), createdAt: new Date().toISOString(), deleted: false, deletedAt: null }

        // 同步到数据库
        apiCall('/api/trade_records', 'POST', newRecord).catch(err => console.error('同步交易记录到数据库失败:', err))

        return {
          tradeRecords: [...state.tradeRecords, newRecord]
        }
      }),

      // 更新交易记录
      updateTradeRecord: (id, data) => set((state) => ({
        tradeRecords: state.tradeRecords.map(t =>
          t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
        )
      })),

      // 删除交易记录
      deleteTradeRecord: (id) => set((state) => {
        apiCall(`/api/trade_records/${id}`, 'DELETE')
        return {
          tradeRecords: state.tradeRecords.map(t =>
            t.id === id ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
          )
        }
      }),

      // 批量删除交易记录
      deleteMultipleTradeRecords: (ids) => set((state) => {
        apiCall(`/api/trade_records/bulk`, 'DELETE', { ids })
        return {
          tradeRecords: state.tradeRecords.map(t =>
            ids.includes(t.id) ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
          )
        }
      }),

      // 恢复交易记录
      restoreTradeRecord: (id) => set((state) => {
        apiCall(`/api/trade_records/${id}/restore`, 'PATCH')
        return {
          tradeRecords: state.tradeRecords.map(t =>
            t.id === id ? { ...t, deleted: false, deletedAt: null } : t
          )
        }
      }),

      // 永久删除交易记录
      permanentDeleteTradeRecord: (id) => set((state) => {
        apiCall(`/api/trade_records/${id}/permanent`, 'DELETE')
        return {
          tradeRecords: state.tradeRecords.filter(t => t.id !== id)
        }
      }),

      // 批量恢复交易记录
      restoreMultipleTradeRecords: (ids) => set((state) => {
        apiCall(`/api/trade_records/bulk/restore`, 'PATCH', { ids })
        return {
          tradeRecords: state.tradeRecords.map(t =>
            ids.includes(t.id) ? { ...t, deleted: false, deletedAt: null } : t
          )
        }
      }),

      // 批量永久删除交易记录
      permanentDeleteMultipleTradeRecords: (ids) => set((state) => ({
        tradeRecords: state.tradeRecords.filter(t => !ids.includes(t.id))
      })),

      // 检查并自动生成交易记录（当卖出订单执行后）
      checkAndGenerateTradeRecord: (sellOrder) => set((state) => {
        if (!sellOrder.buyOrderId) return state

        const buyOrder = state.orders.find(o => o.id === sellOrder.buyOrderId)
        if (!buyOrder || buyOrder.status !== 'executed') return state

        // 计算持仓天数
        const buyTime = new Date(buyOrder.executedAt || buyOrder.createdAt)
        const sellTime = new Date(sellOrder.executedAt || sellOrder.createdAt)
        const holdDuration = Math.ceil((sellTime - buyTime) / (1000 * 60 * 60 * 24))

        // 获取K线数据用于计算评分
        const buyKline = state.stockKlineData[buyOrder.symbol] || []
        const sellKline = state.stockKlineData[sellOrder.symbol] || []

        // 获取买入当天的价格通道数据
        const buyDateKline = buyKline.find(k => {
          const kDate = new Date(k.timestamp)
          const buyDate = new Date(buyOrder.executedAt || buyOrder.createdAt)
          return kDate.toDateString() === buyDate.toDateString()
        })

        // 获取卖出当天的价格通道数据
        const sellDateKline = sellKline.find(k => {
          const kDate = new Date(k.timestamp)
          const sellDate = new Date(sellOrder.executedAt || sellOrder.createdAt)
          return kDate.toDateString() === sellDate.toDateString()
        })

        // 计算买入评分
        let buyGrade = 'C'
        let buyChannel = null
        if (buyDateKline) {
          const high = buyDateKline.bb_upper || buyDateKline.high
          const low = buyDateKline.bb_lower || buyDateKline.low
          buyGrade = calculateTradeGrade(buyOrder.price, high, low, 'buy')
          buyChannel = {
            high: buyDateKline.high,
            low: buyDateKline.low,
            upperBand: buyDateKline.bb_upper,
            lowerBand: buyDateKline.bb_lower,
            type: 'bollinger'
          }
        }

        // 计算卖出评分
        let sellGrade = 'C'
        let sellChannel = null
        if (sellDateKline) {
          const high = sellDateKline.bb_upper || sellDateKline.high
          const low = sellDateKline.bb_lower || sellDateKline.low
          sellGrade = calculateTradeGrade(sellOrder.price, high, low, 'sell')
          sellChannel = {
            high: sellDateKline.high,
            low: sellDateKline.low,
            upperBand: sellDateKline.bb_upper,
            lowerBand: sellDateKline.bb_lower,
            type: 'bollinger'
          }
        }

        // 计算盈亏
        const buyAmount = buyOrder.price * buyOrder.quantity
        const sellAmount = sellOrder.price * sellOrder.quantity
        const profit = sellAmount - buyAmount
        const profitPercent = ((profit / buyAmount) * 100).toFixed(2)

        // 计算整体评分
        let overallScore = 0
        if (buyChannel && sellChannel) {
          overallScore = calculateOverallScore(
            buyOrder.price,
            sellOrder.price,
            buyChannel.upperBand,
            buyChannel.lowerBand
          )
        }

        const tradeRecord = {
          symbol: buyOrder.symbol,
          name: buyOrder.name,

          // 买入信息
          buyOrderId: buyOrder.id,
          buyPrice: buyOrder.price,
          buyQuantity: buyOrder.quantity,
          buyTime: buyOrder.executedAt || buyOrder.createdAt,
          buyPsychologicalScore: buyOrder.psychologicalScore,
          buyStrategyScore: buyOrder.strategyScore,
          buyStrategyId: buyOrder.strategyId,

          // 卖出信息
          sellOrderId: sellOrder.id,
          sellPrice: sellOrder.price,
          sellQuantity: sellOrder.quantity,
          sellTime: sellOrder.executedAt || sellOrder.createdAt,
          sellPsychologicalScore: sellOrder.psychologicalScore,
          sellStrategyScore: sellOrder.strategyScore,
          sellStrategyId: sellOrder.strategyId,

          // 价格通道数据
          buyChannel,
          sellChannel,

          // 交易明细
          totalBuyQuantity: buyOrder.quantity,
          totalSellQuantity: sellOrder.quantity,
          buyAmount: buyAmount.toFixed(2),
          sellAmount: sellAmount.toFixed(2),
          profit: profit.toFixed(2),
          profitPercent: profitPercent,
          holdDuration: holdDuration,

          // 评分
          buyGrade,
          sellGrade,
          overallScore: parseFloat((overallScore * 100).toFixed(2))
        }

        // 检查是否已存在该交易记录
        const existingRecord = state.tradeRecords.find(t =>
          t.buyOrderId === buyOrder.id && t.sellOrderId === sellOrder.id
        )

        if (existingRecord) {
          return state
        }

        return {
          tradeRecords: [...state.tradeRecords, { ...tradeRecord, id: Date.now(), createdAt: new Date().toISOString() }]
        }
      })
    }),
    {
      name: 'trading-system-storage',
      merge: (persistedState, currentState) => {
        console.log('[Store] Merge - persistedState:', persistedState)
        console.log('[Store] Merge - currentState:', currentState)

        // 确保 account 结构正确
        if (persistedState && persistedState.account) {
          if (!persistedState.account.real || typeof persistedState.account.real.balance !== 'number') {
            persistedState.account.real = { balance: 100000, totalInvested: 0, totalProfit: 0 }
          }
          if (!persistedState.account.virtual || typeof persistedState.account.virtual.balance !== 'number') {
            persistedState.account.virtual = { balance: 100000, totalInvested: 0, totalProfit: 0 }
          }
        }

        return {
          ...currentState,
          ...persistedState
        }
      }
    }
  )
)

export default useStore
