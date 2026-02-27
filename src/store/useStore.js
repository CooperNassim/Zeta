import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 心理测试指标
export const initialPsychologicalIndicators = [
  { id: '1', name: '睡眠质量', description: '昨晚睡眠时长和质量', minScore: 0, maxScore: 100, weight: 0.15 },
  { id: '2', name: '情绪状态', description: '当前情绪稳定性', minScore: 0, maxScore: 100, weight: 0.2 },
  { id: '3', name: '压力水平', description: '当前工作生活压力', minScore: 0, maxScore: 100, weight: 0.15 },
  { id: '4', name: '市场关注度', description: '对市场信息的关注度', minScore: 0, maxScore: 100, weight: 0.1 },
  { id: '5', name: '风险承受意愿', description: '当前风险承受能力', minScore: 0, maxScore: 100, weight: 0.2 },
  { id: '6', name: '决策信心', description: '对当前决策的信心程度', minScore: 0, maxScore: 100, weight: 0.2 },
]

// 交易策略模板
export const initialStrategies = {
  buy: [
    {
      id: '1',
      name: '趋势突破策略',
      description: '价格突破关键阻力位',
      conditions: [
        { id: '1', name: '价格突破', weight: 0.3, threshold: 70, description: '价格突破关键位置' },
        { id: '2', name: '成交量配合', weight: 0.3, threshold: 70, description: '成交量放大' },
        { id: '3', name: '技术指标', weight: 0.4, threshold: 70, description: 'RSI、MACD等指标确认' },
      ],
      passScore: 70
    },
    {
      id: '2',
      name: '回调买入策略',
      description: '价格回调至支撑位买入',
      conditions: [
        { id: '1', name: '回调位置', weight: 0.4, threshold: 70, description: '回调至支撑位' },
        { id: '2', name: '支撑有效性', weight: 0.3, threshold: 70, description: '支撑位有效' },
        { id: '3', name: '买入信号', weight: 0.3, threshold: 70, description: '出现买入信号' },
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
        { id: '1', name: '盈利比例', weight: 0.5, threshold: 70, description: '达到目标盈利比例' },
        { id: '2', name: '市场环境', weight: 0.3, threshold: 70, description: '市场环境良好' },
        { id: '3', name: '技术信号', weight: 0.2, threshold: 70, description: '技术指标确认' },
      ],
      passScore: 70
    },
    {
      id: '2',
      name: '止损策略',
      description: '跌破止损位及时止损',
      conditions: [
        { id: '1', name: '跌破止损', weight: 0.6, threshold: 70, description: '价格触及止损位' },
        { id: '2', name: '市场趋势', weight: 0.4, threshold: 70, description: '趋势转变' },
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

const useStore = create(
  persist(
    (set, get) => ({
      // 账户信息
      account: {
        balance: 100000,
        totalInvested: 0,
        totalProfit: 0
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

      // 预约单
      orders: [],

      // 账单明细
      transactions: [],

      // 交易记录
      tradeRecords: [],

      // 更新账户余额
      updateBalance: (amount) => set((state) => ({
        account: {
          ...state.account,
          balance: state.account.balance + amount
        }
      })),

      // 添加每日功课数据
      addDailyWorkData: (data) => set((state) => ({
        dailyWorkData: [...state.dailyWorkData, { ...data, id: Date.now() }]
      })),

      // 批量导入每日功课数据
      importDailyWorkData: (dataList) => set((state) => ({
        dailyWorkData: [...dataList.map(d => ({ ...d, id: Date.now() + Math.random() }))]
      })),

      // 删除每日功课数据
      deleteDailyWorkData: (id) => set((state) => ({
        dailyWorkData: state.dailyWorkData.filter(d => d.id !== id)
      })),

      // 批量删除每日功课数据
      deleteMultipleDailyWorkData: (ids) => set((state) => ({
        dailyWorkData: state.dailyWorkData.filter(d => !ids.includes(d.id))
      })),

      // 更新每日功课数据
      updateDailyWorkData: (id, data) => set((state) => ({
        dailyWorkData: state.dailyWorkData.map(d =>
          d.id === id ? { ...d, ...data } : d
        )
      })),

      // 添加心理测试
      addPsychologicalTest: (test) => set((state) => ({
        psychologicalTests: [...state.psychologicalTests, { ...test, id: Date.now() }]
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
          [type]: [...state.strategies[type], { ...strategy, id: Date.now() }]
        }
      })),

      // 删除交易策略
      deleteStrategy: (type, id) => set((state) => ({
        strategies: {
          ...state.strategies,
          [type]: state.strategies[type].filter(s => s.id !== id)
        }
      })),

      // 添加风险模型
      addRiskModel: (model) => set((state) => ({
        riskModels: [...state.riskModels, { ...model, id: Date.now() }]
      })),

      // 删除风险模型
      deleteRiskModel: (id) => set((state) => ({
        riskModels: state.riskModels.filter(m => m.id !== id)
      })),

      // 添加预约单
      addOrder: (order) => set((state) => ({
        orders: [...state.orders, { ...order, id: Date.now(), createdAt: new Date().toISOString() }]
      })),

      // 执行预约单
      executeOrder: (id) => set((state) => {
        const order = state.orders.find(o => o.id === id)
        if (!order) return state

        // 创建交易记录
        const tradeRecord = {
          id: Date.now(),
          type: order.type,
          symbol: order.symbol,
          price: order.price,
          quantity: order.quantity,
          amount: order.price * order.quantity,
          psychologicalScore: order.psychologicalScore,
          strategyScore: order.strategyScore,
          riskScore: order.riskScore,
          overallScore: order.overallScore,
          executedAt: new Date().toISOString(),
          profit: 0
        }

        // 创建账单明细
        const transaction = {
          id: Date.now(),
          type: order.type === 'buy' ? '买入' : '卖出',
          symbol: order.symbol,
          amount: order.price * order.quantity,
          balance: order.type === 'buy'
            ? state.account.balance - order.price * order.quantity
            : state.account.balance + order.price * order.quantity,
          createdAt: new Date().toISOString()
        }

        // 更新预约单状态
        const updatedOrders = state.orders.map(o =>
          o.id === id ? { ...o, status: 'executed', executedAt: new Date().toISOString() } : o
        )

        return {
          orders: updatedOrders,
          tradeRecords: [...state.tradeRecords, tradeRecord],
          transactions: [...state.transactions, transaction],
          account: {
            ...state.account,
            balance: order.type === 'buy'
              ? state.account.balance - order.price * order.quantity
              : state.account.balance + order.price * order.quantity
          }
        }
      }),

      // 添加账单
      addTransaction: (transaction) => set((state) => ({
        transactions: [...state.transactions, { ...transaction, id: Date.now() }],
        account: {
          ...state.account,
          balance: state.account.balance + transaction.amount
        }
      })),

      // 计算交易盈亏
      calculateTradeProfit: (tradeId, profit) => set((state) => ({
        tradeRecords: state.tradeRecords.map(t =>
          t.id === tradeId ? { ...t, profit } : t
        )
      })),

      // 重置所有数据
      resetData: () => set({
        account: { balance: 100000, totalInvested: 0, totalProfit: 0 },
        dailyWorkData: [],
        psychologicalTests: [],
        orders: [],
        transactions: [],
        tradeRecords: [],
        psychologicalIndicators: [...initialPsychologicalIndicators],
        strategies: { ...initialStrategies },
        riskModels: [...initialRiskModels]
      })
    }),
    {
      name: 'trading-system-storage'
    }
  )
)

export default useStore
