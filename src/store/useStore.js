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
        real: { balance: 100000, totalInvested: 0, totalProfit: 0 }
      },

      // 每日功课数据（26个字段）
      dailyWorkData: [],

      // 心理测试指标
      psychologicalIndicators: [...initialPsychologicalIndicators],

      // 心理测试记录
      psychologicalTests: [],

      // 交易策略
      strategies: { ...initialStrategies },

      // 风险配置（从数据库同步）
      riskConfig: {
        real: { totalRiskPercent: 6, singleRiskPercent: 2 }
      },

      // 实时风控数据（实时计算，不存储）
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

      // 预约单（从数据库加载）
      orders: [],

      // 交易编号计数器 (日期 -> 当前序号)
      tradeNumberCounter: {},

      // 初始化当天交易编号计数器（从数据库同步）
      initializeTradeNumberCounter: async () => {
        try {
          const today = new Date()
          const dateStr = today.getFullYear() +
            String(today.getMonth() + 1).padStart(2, '0') +
            String(today.getDate()).padStart(2, '0')

          // 获取所有数据
          const response = await fetch(`${API_BASE_URL}/api/sync/all`)
          const result = await response.json()

          let maxNumber = 0
          if (result.success && result.data) {
            // 从 trade_orders 中查找今天最大编号
            if (result.data.trade_orders) {
              const todayOrders = result.data.trade_orders.filter(order =>
                order.trade_number && order.trade_number.startsWith(dateStr) && !order.deleted
              )
              if (todayOrders.length > 0) {
                const maxFromOrders = todayOrders.reduce((max, order) => {
                  const num = parseInt(order.trade_number.slice(-3))
                  return num > max ? num : max
                }, 0)
                maxNumber = Math.max(maxNumber, maxFromOrders)
              }
            }

            // 从 trade_records 中查找今天最大编号
            if (result.data.trade_records) {
              const todayRecords = result.data.trade_records.filter(record =>
                record.trade_number && record.trade_number.startsWith(dateStr) && !record.deleted
              )
              if (todayRecords.length > 0) {
                const maxFromRecords = todayRecords.reduce((max, record) => {
                  const num = parseInt(record.trade_number.slice(-3))
                  return num > max ? num : max
                }, 0)
                maxNumber = Math.max(maxNumber, maxFromRecords)
              }
            }
          }

          set((state) => ({
            tradeNumberCounter: {
              ...state.tradeNumberCounter,
              [dateStr]: maxNumber
            }
          }))

          console.log('[Store] 初始化交易编号计数器:', dateStr, '->', maxNumber)
        } catch (error) {
          console.error('[Store] 初始化交易编号计数器失败:', error)
        }
      },

      // 生成交易编号
      generateTradeNumber: () => {
        const today = new Date()
        const dateStr = today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, '0') +
          String(today.getDate()).padStart(2, '0')

        let newTradeNumber
        set((state) => {
          const counter = state.tradeNumberCounter[dateStr] || 0
          const newCounter = counter + 1
          newTradeNumber = dateStr + String(newCounter).padStart(3, '0')

          return {
            tradeNumberCounter: {
              ...state.tradeNumberCounter,
              [dateStr]: newCounter
            }
          }
        })

        console.log('[Store] 生成交易编号:', newTradeNumber)
        return newTradeNumber
      },

      // 账单明细
      transactions: [],

      // 交易记录
      tradeRecords: [],

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
                  state.importPsychologicalTestResults(syncResponse.data.psychological_test_results || [])
                  return {}
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
                  state.importPsychologicalTestResults(syncResponse.data.psychological_test_results || [])
                  return {}
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

        // 参考每日功课的时区处理方式
        const mappedData = dataList.map(item => {
          // 处理日期格式 - 正确处理时区
          let dateStr = item.test_date
          if (item.test_date && typeof item.test_date === 'object') {
            // Date对象：使用本地时区的年月日
            const year = item.test_date.getFullYear()
            const month = String(item.test_date.getMonth() + 1).padStart(2, '0')
            const day = String(item.test_date.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          } else if (item.test_date && typeof item.test_date === 'string') {
            // 字符串：如果是 ISO 格式，需要转换为本地日期
            if (item.test_date.includes('T')) {
              const dateObj = new Date(item.test_date)
              const year = dateObj.getFullYear()
              const month = String(dateObj.getMonth() + 1).padStart(2, '0')
              const day = String(dateObj.getDate()).padStart(2, '0')
              dateStr = `${year}-${month}-${day}`
            } else {
              // 已经是 YYYY-MM-DD 格式，直接使用
              dateStr = item.test_date.split('T')[0].split(' ')[0]
            }
          }

          return {
            ...item,
            date: dateStr, // 使用处理后的日期字符串
            overallScore: item.overall_score
          }
        })
        console.log('[Store] 映射后的心理测试数据:', mappedData.slice(0, 3))
        // 按日期降序排序，最新的在第一个位置
        mappedData.sort((a, b) => new Date(b.date) - new Date(a.date))
        return { psychologicalTests: mappedData }
      }),

      // 批量导入心理测试指标
      importPsychologicalIndicators: (dataList) => set((state) => {
        if (!dataList || dataList === undefined) {
          console.log('[Store] 心理测试指标数据未提供，保持现有数据，当前指标:', state.psychologicalIndicators)
          return {}
        }
        // 确保数值字段是正确的类型
        const mappedData = dataList.map(item => ({
          id: item.id,
          name: item.indicator_name,
          description: item.description,
          minScore: parseFloat(item.min_score) || 0,
          maxScore: parseFloat(item.max_score) || 10,
          weight: parseFloat(item.weight) || 1
        }))
        console.log('[Store] 映射后的心理测试指标数据:', mappedData)
        console.log('[Store] 心理测试指标数量:', mappedData.length)
        return { psychologicalIndicators: mappedData }
      }),

      // 批量导入风险配置
      importRiskConfig: (dataList) => set((state) => {
        if (!dataList || dataList === undefined) {
          console.log('[Store] 风险配置数据未提供，保持现有数据')
          return {}
        }
        // 将数组转换为对象，按账户类型索引
        const config = {}
        dataList.forEach(item => {
          config[item.account_type] = {
            id: item.id,
            totalRiskPercent: parseFloat(item.total_risk_percent) || 6,
            singleRiskPercent: parseFloat(item.single_risk_percent) || 2
          }
        })
        console.log('[Store] 导入风险配置:', config)
        return { riskConfig: config }
      }),

      // 更新心理测试指标（保存到数据库）
      updatePsychologicalIndicator: async (id, indicator) => {
        try {
          // 将前端字段映射为数据库字段
          const dbData = {
            indicator_name: indicator.name,
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
            // 直接更新本地状态，不需要重新同步
            set((state) => ({
              psychologicalIndicators: state.psychologicalIndicators.map(item =>
                item.id === id
                  ? {
                      ...item,
                      name: indicator.name,
                      description: indicator.description,
                      minScore: indicator.minScore,
                      maxScore: indicator.maxScore,
                      weight: indicator.weight
                    }
                  : item
              )
            }))
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

      // 更新风险配置（保存到数据库）
      updateRiskConfig: async (accountType, config) => {
        try {
          // 将前端字段映射为数据库字段
          const dbData = {
            total_risk_percent: config.totalRiskPercent,
            single_risk_percent: config.singleRiskPercent
          }

          // 获取账户类型的配置ID
          const state = useStore.getState()
          const configId = state.riskConfig[accountType]?.id

          if (configId) {
            // 更新
            await apiCall(`/api/risk_config/${configId}`, 'PUT', dbData)
          } else {
            // 创建（理论上不应该发生）
            const insertData = { ...dbData, account_type: accountType }
            await apiCall('/api/risk_config', 'POST', insertData)
          }

          // 更新本地状态
          set((state) => ({
            riskConfig: {
              ...state.riskConfig,
              [accountType]: { ...state.riskConfig[accountType], ...config }
            }
          }))

          return { success: true }
        } catch (error) {
          console.error('[Store] 更新风险配置失败:', error)
          return { success: false, error: error.message }
        }
      },

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
      addOrder: async (order) => {
        console.log('[Store] 开始添加订单:', order)
        
        // 生成交易编号
        let tradeNumber
        const state = useStore.getState()
        if (order.type === 'sell' && order.buyOrderId) {
          const buyOrder = state.orders.find(o => o.id === order.buyOrderId)
          if (buyOrder && buyOrder.tradeNumber) {
            tradeNumber = buyOrder.tradeNumber
          } else {
            tradeNumber = state.generateTradeNumber()
          }
        } else {
          tradeNumber = state.generateTradeNumber()
        }

        const newOrder = { ...order, id: Date.now(), tradeNumber, createdAt: new Date().toISOString(), deleted: false, deletedAt: null }
        console.log('[Store] 生成的订单对象:', newOrder)

        // 映射前端字段名到数据库字段名（camelCase -> snake_case）
        const dbOrder = {
          trade_number: newOrder.tradeNumber,
          order_type: newOrder.type === 'buy' ? '买入' : '卖出', // 转换为中文
          symbol: newOrder.symbol,
          name: newOrder.name,
          price: newOrder.price,
          quantity: newOrder.quantity,
          stop_loss_price: newOrder.stopLossPrice,
          take_profit_price: newOrder.takeProfitPrice,
          psychological_score: newOrder.psychologicalScore,
          strategy_score: newOrder.strategyScore,
          risk_score: newOrder.riskScore,
          overall_score: newOrder.overallScore,
          order_date: new Date().toISOString().split('T')[0],
          order_time: new Date().toISOString(), // 发送完整的ISO时间戳，触发器会自动处理
          status: 'executed',
          is_virtual: newOrder.isVirtual || false,
          buy_order_id: newOrder.buyOrderId || null,
          notes: null,
          deleted: false,
          deleted_at: null
        }
        console.log('[Store] 准备保存到数据库的订单:', dbOrder)

        try {
          // 同步订单到数据库
          // 数据库触发器会自动创建交易记录
          const result = await apiCall('/api/trade_orders', 'POST', dbOrder)
          console.log('[Store] 创建订单API返回:', result)

          if (!result.success) {
            console.error('[Store] 创建订单失败:', result.error)
            return { success: false, error: result.error || '创建订单失败' }
          }

          // 获取数据库返回的真实ID
          const dbOrderId = result.data?.id || newOrder.id
          const finalOrder = { ...newOrder, id: dbOrderId }
          console.log('[Store] 最终订单对象:', finalOrder)

          // 先立即更新本地状态，确保用户能看到数据
          useStore.setState(state => {
            const updatedOrders = [...state.orders, finalOrder]
            console.log('[Store] 立即更新本地订单，数量:', updatedOrders.length)
            return { orders: updatedOrders }
          })

          // 同步创建账单明细记录
          const isBuy = order.type === 'buy'
          const amount = isBuy ? -(newOrder.price * newOrder.quantity) : (newOrder.price * newOrder.quantity)
          const transactionType = isBuy ? '股票买入' : '股票卖出'
          
          // 计算账户余额 - 使用当前账户余额加上本次交易金额
          const accountType = newOrder.isVirtual ? 'virtual' : 'real'
          const currentBalance = useStore.getState().account[accountType]?.balance || 0
          const newBalance = currentBalance + amount
          
          const transactionData = {
            type: transactionType,
            symbol: newOrder.symbol,
            name: newOrder.name,
            amount: amount,
            quantity: newOrder.quantity,
            balance: newBalance,  // 设置实际的余额值
            description: `${transactionType.replace('股票', '')}${newOrder.quantity}股`,
            tradeNumber: tradeNumber // 添加关联的交易编号
          }
          
          console.log('[Store] 创建账单明细记录:', transactionData)
          console.log('[Store] 订单类型:', order.type, '交易编号:', tradeNumber, '金额:', amount)
          
          try {
            await useStore.getState().addTransaction(transactionData, newOrder.isVirtual ? 'virtual' : 'real')
            console.log('[Store] 账单明细创建成功')
          } catch (err) {
            console.error('[Store] 账单明细创建失败:', err)
          }

          // 然后从数据库重新同步数据（延迟500ms，确保数据库已完成写入）
          setTimeout(async () => {
            try {
              console.log('[Store] 延迟500ms后开始同步数据...')
              const syncResponse = await apiCall('/api/sync/all')
              console.log('[Store] 同步数据返回:', syncResponse)
              
              if (syncResponse.success && syncResponse.data) {
                // 更新订单数据
                if (syncResponse.data.trade_orders) {
                  const { trade_orders } = syncResponse.data
                  console.log('[Store] 同步到的订单数量:', trade_orders.length)
                  useStore.setState((state) => {
                    state.importOrders(trade_orders)
                    return {}
                  })
                }

                // 更新交易记录数据
                if (syncResponse.data.trade_records) {
                  const { trade_records } = syncResponse.data
                  console.log('[Store] 同步到的交易记录数量:', trade_records.length)
                  useStore.setState((state) => {
                    state.importTradeRecords(trade_records)
                    return {}
                  })
                }
              }
            } catch (syncErr) {
              console.error('[Store] 延迟同步数据失败:', syncErr)
              // 同步失败不影响订单已创建成功
            }
          }, 500)

          return { success: true, order: finalOrder }
        } catch (err) {
          console.error('[Store] 创建订单异常:', err)
          return { success: false, error: err.message }
        }
      },





      // 删除预约单
      deleteOrder: (id) => set((state) => {
        const order = state.orders.find(o => o.id === id)
        const tradeNumber = order?.tradeNumber
        
        if (tradeNumber) {
          // 使用查询参数根据trade_number查找对应的账单明细，然后删除
          apiCall(`/api/transactions?where=${encodeURIComponent(JSON.stringify({ trade_number: tradeNumber }))}`, 'GET')
            .then(result => {
              if (result.success && result.data) {
                // 查找对应交易编号的账单记录
                const matchedTransactions = result.data.filter(t => t.trade_number === tradeNumber)
                // 批量删除这些账单记录
                if (matchedTransactions.length > 0) {
                  const transactionIds = matchedTransactions.map(t => t.id)
                  apiCall('/api/transactions/bulk/delete', 'POST', { ids: transactionIds })
                    .then(() => console.log(`[Store] 删除对应账单明细成功: ${transactionIds.length}条`))
                    .catch(err => console.error('[Store] 删除账单明细失败:', err))
                }
              }
            })
            .catch(err => console.error('[Store] 查找账单明细失败:', err))
        }
        
        // 删除订单
        apiCall(`/api/trade_orders/${id}`, 'DELETE')
        return {
          orders: state.orders.map(o =>
            o.id === id ? { ...o, deleted: true, deletedAt: new Date().toISOString() } : o
          )
        }
      }),

      // 批量删除预约单
      deleteMultipleOrders: (ids) => set((state) => {
        // 查找所有要删除的订单的交易编号
        const ordersToDelete = state.orders.filter(o => ids.includes(o.id))
        const tradeNumbers = [...new Set(ordersToDelete.map(o => o.tradeNumber).filter(Boolean))]
        
        // 删除关联的账单明细
        if (tradeNumbers.length > 0) {
          tradeNumbers.forEach(tradeNumber => {
            apiCall(`/api/transactions?where=${encodeURIComponent(JSON.stringify({ trade_number: tradeNumber }))}`, 'GET')
              .then(result => {
                if (result.success && result.data) {
                  const matchedTransactions = result.data.filter(t => t.trade_number === tradeNumber)
                  if (matchedTransactions.length > 0) {
                    const transactionIds = matchedTransactions.map(t => t.id)
                    apiCall('/api/transactions/bulk/delete', 'POST', { ids: transactionIds })
                      .then(() => console.log(`[Store] 删除对应账单明细成功: ${tradeNumber} -> ${transactionIds.length}条`))
                      .catch(err => console.error('[Store] 删除账单明细失败:', err))
                  }
                }
              })
              .catch(err => console.error('[Store] 查找账单明细失败:', err))
          })
        }
        
        // 同步到数据库
        apiCall(`/api/trade_orders/bulk/delete`, 'POST', { ids })
          .then(result => console.log('[Store] 删除订单成功:', result))
          .catch(err => console.error('[Store] 删除订单失败:', err))

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

        // 构造数据库格式的数据
        const now = new Date()
        const transactionDate = now.toISOString().split('T')[0] // YYYY-MM-DD
        const transactionTime = now.toTimeString().split(' ')[0].substring(0, 8) // HH:mm:ss

        // 兼容新旧数据库结构：
        // - 旧结构需要：order_id, transaction_type, symbol, price, quantity, total_price
        // - 新结构需要：transaction_type, symbol, name, description, amount, balance
        const dbTransaction = {
          // 新结构字段
          transaction_type: transaction.type || '入账',
          symbol: transaction.symbol || '',
          name: transaction.name || null,
          description: transaction.description || null,
          amount: transaction.amount != null ? String(transaction.amount) : null,
          balance: transaction.balance != null ? String(transaction.balance) : null,
          trade_number: transaction.tradeNumber || null,  // 添加交易编号关联
          transaction_date: transactionDate,
          transaction_time: transactionTime,
          // 旧结构兼容字段（当数据库还没迁移时使用）
          order_id: 0,  // 手动记账没有关联订单，使用0
          price: Math.abs(transaction.amount) || 0,
          quantity: 1,
          total_price: transaction.amount || 0,
          fee: 0,
          profit: null
        }

        // 同步到数据库
        apiCall('/api/transactions', 'POST', dbTransaction)
          .then(result => {
            if (result.success && result.data) {
              console.log('[Store] 账单保存到数据库成功:', result.data)
              // 保存成功后延迟500ms重新获取数据，确保数据库已写入
              setTimeout(async () => {
                try {
                  const syncResult = await apiCall('/api/transactions')
                  if (syncResult.success && syncResult.data) {
                    useStore.getState().importTransactions(syncResult.data)
                    console.log('[Store] 重新同步账单数据成功')
                  }
                } catch (err) {
                  console.error('[Store] 重新同步账单数据失败:', err)
                }
              }, 500)
            } else {
              console.warn('[Store] 账单保存到数据库返回格式异常:', result)
            }
          })
          .catch(err => console.error('[Store] 同步账单到数据库失败:', err))

        return {
          transactions: [...state.transactions, newTransaction],
          account: {
            ...state.account,
            real: {
              ...state.account.real,
              balance: state.account.real.balance + transaction.amount
            }
          }
        }
      }),

      // 删除账单
      deleteTransaction: (id) => set((state) => {
        apiCall(`/api/transactions/${id}`, 'DELETE')
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
      }),

      // 批量删除账单
      deleteMultipleTransactions: (ids) => set((state) => {
        apiCall(`/api/transactions/bulk/delete`, 'POST', { ids })
        console.log('[Store] deleteMultipleTransactions 被调用')
        console.log('[Store] ids:', ids)
        console.log('[Store] 删除前交易数:', state.transactions.length)
        console.log('[Store] account:', state.account)

        const transactionsToDelete = state.transactions.filter(t => ids.includes(t.id))
        const totalAmount = transactionsToDelete.reduce((sum, t) => sum + t.amount, 0)

        console.log('[Store] 删除的交易数:', transactionsToDelete.length)
        console.log('[Store] 总金额:', totalAmount)
        console.log('[Store] state.account.real:', state.account.real)

        const realBalance = (state.account.real && state.account.real.balance) || 0
        console.log('[Store] 原余额:', realBalance)

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

        console.log('[Store] 新余额:', newState.account.real.balance)
        console.log('[Store] 删除后交易数:', newState.transactions.length)

        return newState
      }),

      // 恢复账单
      restoreTransaction: (id) => set((state) => {
        apiCall(`/api/transactions/${id}/restore`, 'PATCH')
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
      }),

      // 永久删除账单
      permanentDeleteTransaction: (id) => set((state) => {
        apiCall(`/api/transactions/${id}/permanent`, 'DELETE')
        return {
          transactions: state.transactions.filter(t => t.id !== id)
        }
      }),

      // 批量恢复账单
      restoreMultipleTransactions: (ids) => set((state) => {
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
        // 过滤掉已删除的订单
        const newOrders = orders
          .filter(o => !o.deleted)  // 过滤掉已删除的订单
          .map(o => ({
            id: o.id?.toString(),
            tradeNumber: o.trade_number || o.tradeNumber || o.id?.toString(),
            type: (o.order_type === '买入' ? 'buy' : (o.order_type === '卖出' ? 'sell' : o.order_type)) || o.type,
            symbol: o.symbol,
            name: o.name,
            price: o.price,
            quantity: o.quantity,
            stopLossPrice: o.stop_loss_price || o.stopLossPrice,
            takeProfitPrice: o.take_profit_price || o.takeProfitPrice,
            psychologicalScore: o.psychological_score || o.psychologicalScore,
            strategyScore: o.strategy_score || o.strategyScore,
            riskScore: o.risk_score || o.riskScore,
            overallScore: o.overall_score || o.overallScore,
            createdAt: o.created_at || o.createdAt || new Date().toISOString(),
            deleted: o.deleted || false,
            deletedAt: o.deleted_at || o.deletedAt || null,
            status: o.status,
            isVirtual: o.is_virtual || o.isVirtual,
            buyOrderId: (o.buy_order_id != null ? String(o.buy_order_id) : (o.buyOrderId != null ? String(o.buyOrderId) : null)),
            buyOrderPrice: o.buy_order_price ? parseFloat(o.buy_order_price) : (o.buyOrderPrice || null),
            notes: o.notes
          }))
        // 直接使用数据库数据，不与本地数据合并
        // 这样可以确保删除后，已删除的订单不会保留在本地状态中
        console.log('[Store] importOrders - 使用数据库数据，不与本地合并')
        console.log('[Store] importOrders - 数据库订单数量:', newOrders.length)
        return { orders: newOrders }
      }),

      // 批量导入账单（从数据库同步）- 直接使用数据库数据
      importTransactions: (transactions) => set((state) => {
        // 格式化时间：年-月-日 时:分:秒
        const formatDateTime = (dateStr) => {
          if (!dateStr) return null
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return null
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const seconds = String(date.getSeconds()).padStart(2, '0')
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        }
        
        const newTransactions = transactions.map(t => ({
          id: t.id,
          type: t.transaction_type || t.type || null,
          symbol: t.symbol || null,
          name: t.name || null,
          description: t.description || null,
          amount: t.amount != null ? parseFloat(t.amount) : (t.amount || null),
          balance: t.balance != null ? parseFloat(t.balance) : (t.balance || null),
          createdAt: formatDateTime(t.created_at) || formatDateTime(t.createdAt) || new Date().toISOString(),
          deleted: t.deleted || false,
          deletedAt: t.deleted_at || t.deletedAt || null,
          // 添加交易状态字段映射 - 尝试不同的字段名
          status: t.交易状态 || t.trade_status || t.tradeStatus || t.status || null
        }))
        // 直接使用数据库数据，不与本地合并
        console.log('[Store] importTransactions - 使用数据库数据，不与本地合并')
        console.log('[Store] importTransactions - 数据库账单数量:', newTransactions.length)
        return { transactions: newTransactions }
      }),

      // 批量导入交易记录（从数据库同步）- 直接使用数据库数据，不合并本地数据
      importTradeRecords: (records) => set((state) => {
        if (!records || records.length === 0) {
          // 数据库返回空，不清空本地数据（可能是本地新建的数据还没同步到数据库）
          console.log('[Store] importTradeRecords - 数据库返回空，保留本地数据')
          return state
        }
        const newRecords = records.map(r => {
          // 自动计算买入金额 = 买入数量 * 买入价格
          const buyQuantity = parseFloat(r.buy_quantity || r.buyQuantity) || 0
          const buyPrice = parseFloat(r.buy_price || r.buyPrice) || 0
          const calculatedBuyAmount = (buyQuantity && buyPrice) ? (buyQuantity * buyPrice).toFixed(2) : null

          // 自动计算卖出金额 = 卖出数量 * 卖出价格
          const sellQuantity = parseFloat(r.sell_quantity || r.sellQuantity) || 0
          const sellPrice = parseFloat(r.sell_price || r.sellPrice) || 0
          const calculatedSellAmount = (sellQuantity && sellPrice) ? (sellQuantity * sellPrice).toFixed(2) : null

          return {
            ...r,
            // 确保驼峰格式字段存在（兼容数据库的下划线格式和前端驼峰格式）
            buyQuantity: r.buy_quantity ? parseFloat(r.buy_quantity) : (r.buyQuantity || 0),
            // 买入成交价格buy_price：人工手动填写（成交价），从数据库下划线格式读取
            buyPrice: r.buy_price != null ? parseFloat(r.buy_price) : (r.buyPrice || null),
            // 买入订单价格buy_order_price：自动从数据库获取，为空时回退到buy_price
            buyOrderPrice: r.buy_order_price ? parseFloat(r.buy_order_price) : (r.buyOrderPrice || parseFloat(r.buy_price) || null),
            buyOrderTime: r.buy_order_time || r.buyOrderTime || null,
            // fillPrice使用buyOrderPrice（订单价格），为空时回退到buy_price
            fillPrice: r.buy_order_price ? parseFloat(r.buy_order_price) : (r.fillPrice || parseFloat(r.buy_price) || null),
            buyTime: r.buy_time || r.buyTime || null,
            buyOrderId: r.buy_order_id ? String(r.buy_order_id) : (r.buyOrderId || null),
            sellQuantity: r.sell_quantity ? parseFloat(r.sell_quantity) : (r.sellQuantity || 0),
            sellPrice: r.sell_price ? parseFloat(r.sell_price) : (r.sellPrice || null),
            sellOrderPrice: r.sell_order_price ? parseFloat(r.sell_order_price) : (r.sellOrderPrice || null),
            sellOrderTime: r.sell_order_time || r.sellOrderTime || null,
            sellTime: r.sell_time || r.sellTime || null,
            tradeNumber: r.trade_number || r.tradeNumber || r.id,
            createdAt: r.created_at || r.createdAt || new Date().toISOString(),
            deleted: r.deleted || false,
            deletedAt: r.deleted_at || r.deletedAt || null,
            buyAmount: calculatedBuyAmount,
            sellAmount: calculatedSellAmount,
            // 佣金和费用字段映射
            tradeCommission: r.trade_commission != null ? r.trade_commission : (r.tradeCommission != null ? r.tradeCommission : null),
            otherFees: r.other_fees != null ? r.other_fees : (r.otherFees != null ? r.otherFees : null),
            sellTradeCommission: r.sell_trade_commission != null ? r.sell_trade_commission : (r.sellTradeCommission != null ? r.sellTradeCommission : null),
            sellOtherFees: r.sell_other_fees != null ? r.sell_other_fees : (r.sellOtherFees != null ? r.sellOtherFees : null),
            // 交易总结字段映射
            tradeSummary: r.trade_summary || r.tradeSummary || null
          }
        })
        // 直接使用数据库数据，不与本地数据合并
        console.log('[Store] importTradeRecords - 使用数据库数据，不与本地合并')
        console.log('[Store] importTradeRecords - 数据库交易记录数量:', newRecords.length)
        return { tradeRecords: newRecords }
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
          overallScore: parseFloat((overallScore * 100).toFixed(2)),

          // 交易字段关联：使用卖出类型
          tradePrice: sellOrder.price,
          tradeQuantity: sellOrder.quantity,
          tradeTime: sellOrder.executedAt || sellOrder.createdAt
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
      }),

      // 计算当前持仓股票资产 - 从交易记录中获取持仓中的买入交易
      getCurrentStockPositions: () => {
        const state = useStore.getState()
        
        console.log('[Debug getCurrentStockPositions] 函数启动，检查交易记录表数据:')
        console.log('[Debug getCurrentStockPositions] state.tradeRecords:', state.tradeRecords)
        console.log('[Debug getCurrentStockPositions] state.tradeRecords 长度:', state.tradeRecords?.length || 0)
        
        // 从交易记录表中获取所有未删除的记录
        const allTradeRecords = state.tradeRecords.filter(r => !r.deleted)
        console.log('[Debug getCurrentStockPositions] 未删除的交易记录数量:', allTradeRecords.length)
        
        if (allTradeRecords.length > 0) {
          console.log('[Debug getCurrentStockPositions] 交易记录表字段样例:', Object.keys(allTradeRecords[0]))
          
          // 显示前3条交易记录的关键字段
          allTradeRecords.slice(0, 3).forEach((r, index) => {
            console.log(`[Debug getCurrentStockPositions] 交易记录${index+1}关键信息:`, {
              id: r.id,
              tradeNumber: r.tradeNumber,
              symbol: r.symbol,
              buyQuantity: r.buyQuantity,
              sellQuantity: r.sellQuantity,
              buyAmount: r.buyAmount,
              sellAmount: r.sellAmount
            })
          })
        }
        
        // 筛选持仓中的交易记录（根据 sellQuantity < buyQuantity 判断）
        const holdingRecords = allTradeRecords.filter(r => {
          const sellQty = r.sellQuantity || 0
          const buyQty = r.buyQuantity || 0
          const isHolding = sellQty < buyQty
          
          console.log(`[Debug getCurrentStockPositions] 交易记录 ${r.id} 状态检查:`, {
            股票: r.symbol,
            买入数量: buyQty,
            卖出数量: sellQty,
            是否持仓中: isHolding,
            买入金额: r.buyAmount
          })
          
          return isHolding
        })
        
        console.log('[Debug getCurrentStockPositions] 持仓中的交易记录数量:', holdingRecords.length)
        console.log('[Debug getCurrentStockPositions] 持仓中的交易记录详情:', holdingRecords.map(r => ({
          id: r.id,
          symbol: r.symbol,
          buyQuantity: r.buyQuantity,
          sellQuantity: r.sellQuantity,
          buyAmount: r.buyAmount
        })))
        
        // 计算总持仓金额（使用买入金额）
        const totalHoldAmount = holdingRecords.reduce((sum, r) => {
          const buyAmount = parseFloat(r.buyAmount) || 0
          return sum + buyAmount
        }, 0)
        
        console.log('[Debug getCurrentStockPositions] 总持仓金额:', totalHoldAmount)
        
        return totalHoldAmount
      },

      // 计算总资产（股票持仓市值 + 最新交易记录余额）
      getTotalAssets: (accountType = 'real') => {
        const state = useStore.getState()
        console.log('[Debug getTotalAssets] 开始计算总资产')
        
        // 先计算持仓市值
        let positionValue = 0
        try {
          positionValue = state.getCurrentStockPositions()
          console.log('[Debug getTotalAssets] 计算得到的持仓市值:', positionValue)
        } catch (error) {
          console.log('[Debug getTotalAssets] 持仓市值计算出错:', error)
        }
        
        // 获取交易记录数据 - 从正确的数据源中获取
        const transactions = state.transactions || []
        
        console.log('[Debug getTotalAssets] 交易记录总数:', transactions.length)
        console.log('[Debug getTotalAssets] 各交易记录的余额情况:', transactions.map(t => ({ 
          id: t.id, 
          accountType: t.accountType, 
          balance: t.balance, 
          createdAt: t.createdAt
        })))
        
        // 获取最新的交易记录余额
        const validTransactions = transactions.filter(t => !t.deleted && (!t.accountType || t.accountType === 'real' || t.accountType === accountType))
        // 获取最新的有效余额记录
        // 策略：优先选择余额为正的股票交易记录，避免选择负数余额的中间过程记录
        const validBalanceTransactions = validTransactions.filter(t => {
          // 选择股票交易记录
          const isStockTransaction = t.type === '买入' || t.type === '卖出'
          // 选择余额为正的大额记录，同时排除手动记账的小额记录
          const isPositiveBalance = t.balance > 1000
          
          return isStockTransaction && isPositiveBalance
        })
        
        console.log('[Debug getTotalAssets] 所有交易记录数量:', validTransactions.length)
        console.log('[Debug getTotalAssets] 优选股票交易记录数量:', validBalanceTransactions.length)
        
        // 获取最新交易记录
        let latestTransaction
        
        if (validBalanceTransactions.length > 0) {
          // 优先使用股票交易记录的余额
          validBalanceTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          latestTransaction = validBalanceTransactions[0]
          console.log('[Debug getTotalAssets] 使用优选股票交易记录作为最新余额')
        } else if (validTransactions.length > 0) {
          // 回退到所有记录中的最新一条
          validTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          latestTransaction = validTransactions[0]
          console.log('[Debug getTotalAssets] 回退到所有记录的最新一条')
        }
        
        // 显示选择过程
        if (latestTransaction) {
          console.log('[Debug getTotalAssets] 最新交易记录详情:', { 
            id: latestTransaction.id, 
            balance: latestTransaction.balance, 
            createdAt: latestTransaction.createdAt,
            type: latestTransaction.type
          })
        }
        
        // 额外调试：显示所有记录的前5条（按时间倒序）
        console.log('[Debug getTotalAssets] 所有记录最新5条:')
        const allTransactionsSorted = [...validTransactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        allTransactionsSorted.slice(0, 5).forEach(t => 
          console.log(`  记录${t.id}: 余额=${t.balance}, 类型=${t.type}, 日期=${t.createdAt}`)
        )
        
        // 获取余额：优先使用最新的有效余额记录
        let currentBalance
        if (latestTransaction && latestTransaction.balance !== undefined) {
          currentBalance = latestTransaction.balance
        } else if (state.account?.real?.balance) {
          // 如果交易记录中没有有效余额，使用账户余额
          currentBalance = state.account.real.balance
        } else {
          currentBalance = 0
        }
        
        console.log('[Debug getTotalAssets] 最新交易记录余额:', currentBalance)
        console.log('[Debug getTotalAssets] 持仓市值:', positionValue)
        
        // 调试：验证公式是否正确
        const totalAssetsBeforeValidation = positionValue + currentBalance
        console.log('[Debug getTotalAssets] 计算公式验证: positionValue + currentBalance =', totalAssetsBeforeValidation)
        
        // 现在检查是否有重复计算的bug
        // 如果计算结果异常，可能需要检查数据源是否有问题
        if (transactions.length > 0) {
          console.log('[Debug getTotalAssets] 检查余额数据重复计算问题:')
          transactions.forEach(t => console.log(`记录 ${t.id}: 余额=${t.balance}, 日期=${t.createdAt}`))
        }
        
        const totalAssets = positionValue + currentBalance
        console.log('[Debug getTotalAssets] 最终总资产:', totalAssets)
        
        return totalAssets
      }
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

        // 过滤掉已删除的订单（deleted: true）
        const cleanOrders = (orders) => {
          if (!orders || !Array.isArray(orders)) return []
          return orders.filter(o => !o.deleted)
        }

        const cleanedPersistedOrders = cleanOrders(persistedState?.orders)
        const cleanedCurrentOrders = cleanOrders(currentState?.orders)

        console.log('[Store] Merge - orders from persisted:', persistedState?.orders?.length, '-> cleaned:', cleanedPersistedOrders.length)
        console.log('[Store] Merge - orders from current:', currentState?.orders?.length, '-> cleaned:', cleanedCurrentOrders.length)

        return {
          ...persistedState,
          ...currentState,
          // 始终使用从数据库同步的 orders（currentState），而不是本地存储的 orders
          // 这样可以确保删除后，其他浏览器能立即看到更新
          orders: cleanedCurrentOrders
        }
      }
    }
  )
)

export default useStore
