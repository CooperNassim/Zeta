import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateTradeGrade, calculateOverallScore } from '../utils/technicalIndicators'

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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
        singleRiskPercent: 2
      },

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

      // 预约单
      orders: Array.from({ length: 40 }, (_, i) => {
        const types = ['buy', 'sell']
        const statuses = ['pending', 'executed', 'cancelled']
        const isVirtual = Math.random() > 0.5
        const createdAt = new Date(Date.now() - (39 - i) * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000)

        // 生成模拟数据
        const order = {
          id: Date.now() + i,
          tradeNumber: createdAt.getFullYear() +
            String(createdAt.getMonth() + 1).padStart(2, '0') +
            String(createdAt.getDate()).padStart(2, '0') +
            String(i + 1).padStart(3, '0'),
          type: types[Math.floor(Math.random() * types.length)],
          symbol: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'][Math.floor(Math.random() * 6)],
          price: (Math.random() * 200 + 50).toFixed(2),
          quantity: Math.floor(Math.random() * 20 + 1) * 10,
          name: ['苹果公司', '微软', '谷歌', '亚马逊', '特斯拉', '英伟达'][Math.floor(Math.random() * 6)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          isVirtual,
          psychologicalScore: Math.floor(Math.random() * 100),
          strategyScore: Math.floor(Math.random() * 100),
          riskScore: Math.floor(Math.random() * 100),
          overallScore: Math.floor(Math.random() * 100),
          createdAt: createdAt.toISOString(),
          executedAt: null,
          cancelledAt: null
        }

        // 如果已执行或已取消，设置相应的时间
        if (order.status === 'executed') {
          order.executedAt = new Date(new Date(order.createdAt).getTime() + Math.random() * 60 * 60 * 1000).toISOString()
        } else if (order.status === 'cancelled') {
          order.cancelledAt = new Date(new Date(order.createdAt).getTime() + Math.random() * 60 * 60 * 1000).toISOString()
        }

        return order
      }),

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
      tradeRecords: Array.from({ length: 10 }, (_, i) => {
        const isProfit = Math.random() > 0.4
        const basePrice = 50 + Math.random() * 200
        const buyPrice = parseFloat(basePrice.toFixed(2))
        const profitPercent = isProfit ? (Math.random() * 20 + 5) : -(Math.random() * 15 + 3)
        const sellPrice = parseFloat((buyPrice * (1 + profitPercent / 100)).toFixed(2))
        const quantity = Math.floor(Math.random() * 500) + 100
        const buyAmount = buyPrice * quantity
        const sellAmount = sellPrice * quantity
        const profit = sellAmount - buyAmount

        const now = new Date()
        const buyTime = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000)
        const sellTime = new Date(buyTime.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000)

        return {
          id: `trade_${i + 1}`,
          symbol: ['000001', '600036', '600519', '000333', '601318'][i % 5],
          name: ['平安银行', '招商银行', '贵州茅台', '美的集团', '中国平安'][i % 5],
          buyOrderId: `buy_${i + 1}`,
          sellOrderId: `sell_${i + 1}`,
          buyPrice: buyPrice,
          buyQuantity: quantity,
          buyTime: buyTime.toISOString(),
          buyPsychologicalScore: parseFloat((6 + Math.random() * 3).toFixed(1)),
          buyStrategyScore: parseFloat((70 + Math.random() * 25).toFixed(1)),
          buyStrategyId: 1,
          sellPrice: sellPrice,
          sellQuantity: quantity,
          sellTime: sellTime.toISOString(),
          sellPsychologicalScore: parseFloat((6 + Math.random() * 3).toFixed(1)),
          sellStrategyScore: parseFloat((70 + Math.random() * 25).toFixed(1)),
          sellStrategyId: 1,
          buyAmount: buyAmount.toFixed(2),
          sellAmount: sellAmount.toFixed(2),
          profit: profit.toFixed(2),
          profitPercent: profitPercent.toFixed(2),
          holdDuration: Math.floor((sellTime - buyTime) / (1000 * 60 * 60 * 24)),
          buyGrade: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
          sellGrade: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
          overallScore: parseFloat((Math.random() * 100).toFixed(2)),
          buyChannel: {
            high: parseFloat((buyPrice * 1.05).toFixed(2)),
            low: parseFloat((buyPrice * 0.95).toFixed(2)),
            upperBand: parseFloat((buyPrice * 1.08).toFixed(2)),
            lowerBand: parseFloat((buyPrice * 0.92).toFixed(2)),
            type: 'bollinger'
          },
          sellChannel: {
            high: parseFloat((sellPrice * 1.05).toFixed(2)),
            low: parseFloat((sellPrice * 0.95).toFixed(2)),
            upperBand: parseFloat((sellPrice * 1.08).toFixed(2)),
            lowerBand: parseFloat((sellPrice * 0.92).toFixed(2)),
            type: 'bollinger'
          },
          createdAt: sellTime.toISOString()
        }
      }),

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
      addDailyWorkData: (data) => set((state) => ({
        dailyWorkData: [...state.dailyWorkData, { ...data, id: Date.now() }]
      })),

      // 批量导入每日功课数据
      importDailyWorkData: (dataList) => set((state) => ({
        dailyWorkData: [...dataList.map(d => ({ ...d, id: Date.now() + Math.random(), deleted: false, deletedAt: null }))]
      })),

      // 删除每日功课数据
      deleteDailyWorkData: (id) => set((state) => {
        apiCall(`/api/daily_work_data/${id}`, 'DELETE')
        return {
          dailyWorkData: state.dailyWorkData.map(d =>
            d.id === id ? { ...d, deleted: true, deletedAt: new Date().toISOString() } : d
          )
        }
      }),

      // 批量删除每日功课数据
      deleteMultipleDailyWorkData: (ids) => set((state) => {
        apiCall(`/api/daily_work_data/bulk`, 'DELETE', { ids })
        return {
          dailyWorkData: state.dailyWorkData.map(d =>
            ids.includes(d.id) ? { ...d, deleted: true, deletedAt: new Date().toISOString() } : d
          )
        }
      }),

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
      updateDailyWorkData: (id, data) => set((state) => ({
        dailyWorkData: state.dailyWorkData.map(d =>
          d.id === id ? { ...d, ...data } : d
        )
      })),

      // 添加心理测试
      addPsychologicalTest: (test) => set((state) => ({
        psychologicalTests: [...state.psychologicalTests, { ...test, id: Date.now(), deleted: false, deletedAt: null }]
      })),

      // 更新心理测试指标
      updatePsychologicalIndicator: (id, indicator) => set((state) => ({
        psychologicalIndicators: state.psychologicalIndicators.map(i =>
          i.id === id ? indicator : i
        )
      })),

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
      addStrategyRecord: (record) => set((state) => {
        const now = new Date().toISOString()
        const nowDate = new Date()


        return {
          strategyRecords: [
            ...state.strategyRecords,
            {
              ...record,
              createdAt: now,
              updatedAt: now,
              deleted: false,
              deletedAt: null
            }
          ]
        }
      }),

      // 删除交易策略记录
      deleteStrategyRecord: (id) => set((state) => {
        apiCall(`/api/strategy_records/${id}`, 'DELETE')
        return {
          strategyRecords: state.strategyRecords.map(r =>
            r.id === id ? { ...r, deleted: true, deletedAt: new Date().toISOString() } : r
          )
        }
      }),

      // 批量删除交易策略记录
      deleteMultipleStrategyRecords: (ids) => set((state) => {
        apiCall(`/api/strategy_records/bulk`, 'DELETE', { ids })
        return {
          strategyRecords: state.strategyRecords.map(r =>
            ids.includes(r.id) ? { ...r, deleted: true, deletedAt: new Date().toISOString() } : r
          )
        }
      }),

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
      updateStrategyRecord: (id, record) => set((state) => ({
        strategyRecords: state.strategyRecords.map(r =>
          r.id === id ? { ...record, updatedAt: new Date().toISOString() } : r
        )
      })),

      // 导入交易策略记录
      importStrategyRecords: (dataList) => set((state) => {
        const now = new Date().toISOString()
        const currentMaxId = state.strategyRecords.reduce((max, r) => {
          const id = parseInt(r.id) || 0
          return Math.max(max, id)
        }, 0)

        return {
          strategyRecords: [
            ...dataList.map((d, index) => ({
              ...d,
              id: (currentMaxId + index + 1).toString(),
              createdAt: d.createdAt || now,
              updatedAt: now,
              deleted: false,
              deletedAt: null
            }))
          ]
        }
      }),

      // 添加预约单
      addOrder: (order) => set((state) => {
        const tradeNumber = state.generateTradeNumber()
        return {
          orders: [...state.orders, { ...order, id: Date.now(), tradeNumber, createdAt: new Date().toISOString(), deleted: false, deletedAt: null }]
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
      addTransaction: (transaction, accountType = 'real') => set((state) => ({
        transactions: accountType === 'real'
          ? [...state.transactions, { ...transaction, id: Date.now(), deleted: false, deletedAt: null }]
          : state.transactions,
        virtualTransactions: accountType === 'virtual'
          ? [...state.virtualTransactions, { ...transaction, id: Date.now(), deleted: false, deletedAt: null }]
          : state.virtualTransactions,
        account: {
          ...state.account,
          [accountType]: {
            ...state.account[accountType],
            balance: state.account[accountType].balance + transaction.amount
          }
        }
      })),

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
      addStock: (stock) => set((state) => ({
        stockPool: [...state.stockPool, { ...stock, id: Date.now(), createdAt: new Date().toISOString(), deleted: false, deletedAt: null }]
      })),

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
      addCompleteTradeRecord: (tradeRecord) => set((state) => ({
        tradeRecords: [...state.tradeRecords, { ...tradeRecord, id: Date.now(), createdAt: new Date().toISOString(), deleted: false, deletedAt: null }]
      })),

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
