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
  buy: [],
  sell: []
};

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
          let maxDigits = 3 // 默认3位数
          
          if (result.success && result.data) {
            // 合并所有交易编号来源进行全局最大值的查找
            const allTradeNumbers = []
            
            // 从 trade_orders 获取所有交易编号
            if (result.data.trade_orders) {
              allTradeNumbers.push(...result.data.trade_orders.map(o => o.trade_number).filter(Boolean))
            }
            
            // 从 trade_records 获取所有交易编号
            if (result.data.trade_records) {
              allTradeNumbers.push(...result.data.trade_records.map(r => r.trade_number).filter(Boolean))
            }

            console.log('[Store] 找到的所有交易编号:', allTradeNumbers)

            if (allTradeNumbers.length > 0) {
              // 详细调试每个交易编号的处理过程
              const numberDetails = allTradeNumbers.map(tradeNum => {
                try {
                  const digitsPart = tradeNum.slice(8) // 剔除前8位日期，取第9位开始的数字部分
                  const num = parseInt(digitsPart) || 0
                  const numDigits = digitsPart.replace(/^0+/, '').length
                  return { tradeNum, digitsPart, num, numDigits }
                } catch (e) {
                  return { tradeNum, error: e.message }
                }
              })
              
              console.log('[Store] 交易编号详细分析:', numberDetails)
              
              // 全局查找第9位开始数字部分的最大值
              const globalMax = allTradeNumbers.reduce((max, tradeNum) => {
                try {
                  const digitsPart = tradeNum.slice(8) // 剔除前8位日期，取第9位开始的数字部分
                  const num = parseInt(digitsPart) || 0
                  // 验证数字是否有效（大于0且数字部分长度合理）
                  if (num > max && num < 1000000) {
                    return num
                  }
                  return max
                } catch (e) {
                  return max
                }
              }, 0)
              
              maxNumber = globalMax
              
              // 同时确定最大位数
              maxDigits = allTradeNumbers.reduce((maxDigits, tradeNum) => {
                try {
                  const digitsPart = tradeNum.slice(8)
                  const numDigits = digitsPart.replace(/^0+/, '').length
                  return Math.max(maxDigits, numDigits)
                } catch (e) {
                  return maxDigits
                }
              }, 3)
            } else {
              console.log('[Store] 警告：没有找到任何交易编号记录')
            }
          }

          console.log('[Store] 初始化交易编号计数器调试信息:', {
            maxNumber,
            maxDigits,
            allTradeNumbersCount: result.data?.trade_orders?.length || 0 + result.data?.trade_records?.length || 0
          })

          set((state) => ({
            tradeNumberCounter: {
              ...state.tradeNumberCounter, // 保留原有的计数器状态
              _globalMax: maxNumber        // 更新全局最大值
            },
            tradeNumberDigitLength: Math.min(maxDigits, 6) // 存储当前数字部分的最大位数，限制为6位
          }))

          console.log('[Store] 初始化交易编号计数器完成: 全局最大值 ->', maxNumber, '位数:', maxDigits)
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
        let oldGlobalMax = 0
        
        set((state) => {
          // 直接使用全局最大值
          oldGlobalMax = state.tradeNumberCounter._globalMax || 0
          const newCounter = oldGlobalMax + 1
          
          // 动态确定位数：如果数字超过当前最大位数范围，自动增加位数
          let digitLength = state.tradeNumberDigitLength || 3
          if (newCounter > Math.pow(10, digitLength) - 1) {
            digitLength = Math.min(digitLength + 1, 6) // 最大限制6位数
          }
          
          newTradeNumber = dateStr + String(newCounter).padStart(digitLength, '0')

          return {
            tradeNumberCounter: {
              ...state.tradeNumberCounter, // 保留原有的计数器状态
              _globalMax: newCounter        // 更新全局最大值
            },
            tradeNumberDigitLength: digitLength
          }
        })

        console.log('[Store] 生成的交易编号:', newTradeNumber, '旧全局最大值:', oldGlobalMax, '新全局最大值:', oldGlobalMax + 1)
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
          strategy_id: newOrder.strategyId, // 添加策略ID字段
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
          
          // 修复余额计算：使用最新交易记录的余额加上本次交易金额
          const accountType = newOrder.isVirtual ? 'virtual' : 'real'
          
          // 获取最新的交易记录余额（避免使用可能错误的账户状态）
          const transactions = useStore.getState().transactions
          const latestTransaction = transactions.reduce((latest, t) => {
            if (!latest || new Date(t.createdAt) > new Date(latest.createdAt)) {
              return t
            }
            return latest
          }, null)
          
          // 彻底修复：避免依赖可能错误的历史balance字段
          // 使用安全的账户余额计算：当前账户余额 + 交易金额
          const currentAccountBalance = useStore.getState().account.real?.balance || 0
          const newBalance = currentAccountBalance + amount
          
          console.log('💰 [订单创建] 余额计算调试（安全修复）:')
          console.log('   - 当前账户余额:', currentAccountBalance)
          console.log('   - 当前交易金额:', amount)
          console.log('   - 新余额（安全计算）:', newBalance)
          console.log('🚫 已禁用依赖可能错误的历史balance字段')
          
          const transactionData = {
            type: transactionType,
            symbol: newOrder.symbol,
            name: newOrder.name,
            amount: amount,
            quantity: newOrder.quantity,
            balance: newBalance,  // 使用正确的余额值
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
        
        if (order) {
          // 查找关联的交易记录和账单明细
          Promise.all([
            apiCall(`/api/transactions`, 'GET'),
            apiCall(`/api/trade_records`, 'GET')
          ])
            .then(([transactionsResult, tradeRecordsResult]) => {
              // 处理账单明细：只在删除最后一个同交易编号的订单时才删除账单明细
              if (transactionsResult.success && transactionsResult.data) {
                // 检查是否还有其他同交易编号的未删除订单
                const remainingOrders = state.orders.filter(o => 
                  o.tradeNumber === tradeNumber && 
                  o.id !== id && 
                  !o.deleted
                )
                
                // 如果没有其他同交易编号的订单，才删除账单明细
                if (remainingOrders.length === 0) {
                  const matchedTransactions = transactionsResult.data.filter(t => {
                    if (tradeNumber && (t.trade_number === tradeNumber || t.tradeNumber === tradeNumber)) {
                      return true
                    }
                    if (!tradeNumber && t.type && (t.type === '买入' || t.type === '卖出')) {
                      return t.symbol === order.symbol && 
                             t.name === order.name && 
                             Math.abs(parseFloat(t.amount || 0)) === Math.abs(parseFloat(order.price || 0) * parseFloat(order.quantity || 0))
                    }
                    return false
                  })
                  if (matchedTransactions.length > 0) {
                    const transactionIds = matchedTransactions.map(t => t.id)
                    apiCall('/api/transactions/bulk/delete', 'POST', { ids: transactionIds })
                      .then(() => console.log(`[Store] 删除对应账单明细成功: ${transactionIds.length}条`))
                      .catch(err => console.error('[Store] 删除账单明细失败:', err))
                  }
                } else {
                  console.log(`[Store] 还有其他同交易编号的订单，保留账单明细: ${remainingOrders.length}条`)
                }
              }
              
              // 处理交易记录：只在删除最后一个同交易编号的订单时才删除交易记录
              if (tradeRecordsResult.success && tradeRecordsResult.data) {
                // 检查是否还有其他同交易编号的未删除订单
                const remainingOrders = state.orders.filter(o => 
                  o.tradeNumber === tradeNumber && 
                  o.id !== id && 
                  !o.deleted
                )
                
                // 如果没有其他同交易编号的订单，才删除交易记录
                if (remainingOrders.length === 0) {
                  const matchedTradeRecords = tradeRecordsResult.data.filter(r => {
                    if (tradeNumber && (r.trade_number === tradeNumber || r.tradeNumber === tradeNumber)) {
                      return true
                    }
                    return false
                  })
                  if (matchedTradeRecords.length > 0) {
                    const tradeRecordIds = matchedTradeRecords.map(r => r.id)
                    apiCall('/api/trade_records/bulk/delete', 'POST', { ids: tradeRecordIds })
                      .then(() => console.log(`[Store] 删除对应交易记录成功: ${tradeRecordIds.length}条`))
                      .catch(err => console.error('[Store] 删除交易记录失败:', err))
                  }
                } else {
                  console.log(`[Store] 还有其他同交易编号的订单，保留交易记录: ${remainingOrders.length}条`)
                }
              }
            })
            .catch(err => console.error('[Store] 查找关联记录失败:', err))
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
        // 查找所有要删除的订单
        const ordersToDelete = state.orders.filter(o => ids.includes(o.id))
        
        // 删除关联的账单明细和交易记录
        if (ordersToDelete.length > 0) {
          // 获取所有交易编号
          const tradeNumbers = [...new Set(ordersToDelete.map(o => o.tradeNumber).filter(Boolean))]
          
          // 先通过交易编号删除
          if (tradeNumbers.length > 0) {
            tradeNumbers.forEach(tradeNumber => {
              // 检查是否还有其他同交易编号的未删除订单
              const remainingOrders = state.orders.filter(o => 
                o.tradeNumber === tradeNumber && 
                !ids.includes(o.id) && 
                !o.deleted
              )
              
              // 如果没有其他同交易编号的订单，才删除关联记录
              if (remainingOrders.length === 0) {
                Promise.all([
                  apiCall(`/api/transactions?where=${encodeURIComponent(JSON.stringify({ trade_number: tradeNumber }))}`, 'GET'),
                  apiCall(`/api/trade_records?where=${encodeURIComponent(JSON.stringify({ trade_number: tradeNumber }))}`, 'GET')
                ])
                  .then(([transactionsResult, tradeRecordsResult]) => {
                    // 处理账单明细
                    if (transactionsResult.success && transactionsResult.data) {
                      const matchedTransactions = transactionsResult.data.filter(t => t.trade_number === tradeNumber)
                      if (matchedTransactions.length > 0) {
                        const transactionIds = matchedTransactions.map(t => t.id)
                        apiCall('/api/transactions/bulk/delete', 'POST', { ids: transactionIds })
                          .then(() => console.log(`[Store] 删除对应账单明细成功: ${tradeNumber} -> ${transactionIds.length}条`))
                          .catch(err => console.error('[Store] 删除账单明细失败:', err))
                      }
                    }
                    
                    // 处理交易记录
                    if (tradeRecordsResult.success && tradeRecordsResult.data) {
                      const matchedTradeRecords = tradeRecordsResult.data.filter(r => r.trade_number === tradeNumber)
                      if (matchedTradeRecords.length > 0) {
                        const tradeRecordIds = matchedTradeRecords.map(r => r.id)
                        apiCall('/api/trade_records/bulk/delete', 'POST', { ids: tradeRecordIds })
                          .then(() => console.log(`[Store] 删除对应交易记录成功: ${tradeNumber} -> ${tradeRecordIds.length}条`))
                          .catch(err => console.error('[Store] 删除交易记录失败:', err))
                      }
                    }
                  })
                  .catch(err => console.error('[Store] 查找关联记录失败:', err))
              } else {
                console.log(`[Store] 还有其他同交易编号的订单，保留关联记录: ${tradeNumber} -> ${remainingOrders.length}条`)
              }
            })
          }
          
          // 再处理没有交易编号的订单
          const ordersWithoutTradeNumber = ordersToDelete.filter(o => !o.tradeNumber)
          if (ordersWithoutTradeNumber.length > 0) {
            apiCall(`/api/transactions`, 'GET')
              .then(result => {
                if (result.success && result.data) {
                  const matchedTransactions = result.data.filter(t => {
                    if (t.type && (t.type === '买入' || t.type === '卖出')) {
                      return ordersWithoutTradeNumber.some(order => 
                        t.symbol === order.symbol && 
                        t.name === order.name && 
                        Math.abs(parseFloat(t.amount || 0)) === Math.abs(parseFloat(order.price || 0) * parseFloat(order.quantity || 0))
                      )
                    }
                    return false
                  })
                  if (matchedTransactions.length > 0) {
                    const transactionIds = matchedTransactions.map(t => t.id)
                    apiCall('/api/transactions/bulk/delete', 'POST', { ids: transactionIds })
                      .then(() => console.log(`[Store] 删除无交易编号的账单明细成功: ${transactionIds.length}条`))
                      .catch(err => console.error('[Store] 删除账单明细失败:', err))
                  }
                }
              })
              .catch(err => console.error('[Store] 查找账单明细失败:', err))
          }
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
        // 彻底修复：避免使用传入的balance字段，它可能是错误的历史值
        // 安全的余额计算：state账户余额 + 当前交易金额
        const currentAccountBalance = (state.account.real?.balance || 0)
        const transactionAmount = parseFloat(transaction.amount) || 0
        const newBalance = currentAccountBalance + transactionAmount
        
        const newTransaction = { 
          ...transaction, 
          id: Date.now(), 
          balance: newBalance, // 确保balance字段也被存储
          deleted: false, 
          deletedAt: null 
        }

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

        // 修正余额计算：使用传入的balance字段作为新的账户余额
        console.log('💰 [addTransaction] 余额计算调试（修复后）:')
        console.log('   - 传入的balance:', transaction.balance)
        console.log('   - 新的余额:', newBalance)
        
        return {
          transactions: [...state.transactions, newTransaction],
          account: {
            ...state.account,
            real: {
              ...state.account.real,
              balance: newBalance || state.account.real.balance // 如果新余额为空，保持原余额
            }
          }
        }
      }),

      // 删除账单
      deleteTransaction: (id) => set((state) => {
        apiCall(`/api/transactions/${id}`, 'DELETE')
        
        // 修正余额计算：删除交易后，取最新的未删除交易的余额
        const remainingTransactions = state.transactions.filter(t => t.id !== id && !t.deleted)
        const latestTransaction = remainingTransactions.reduce((latest, t) => {
          if (!latest || new Date(t.createdAt) > new Date(latest.createdAt)) {
            return t
          }
          return latest
        }, null)
        
        // 使用最新交易的余额，如果没有交易则余额为0
        const newBalance = latestTransaction ? latestTransaction.balance || 0 : 0
        
        console.log('💰 [deleteTransaction] 余额计算调试（修复后）:')
        console.log('   - 删除的交易ID:', id)
        console.log('   - 剩余交易数量:', remainingTransactions.length)
        console.log('   - 最新交易余额:', newBalance)
        
        return {
          transactions: state.transactions.map(t =>
            t.id === id ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
          ),
          account: {
            ...state.account,
            real: {
              ...(state.account.real || {}),
              balance: newBalance
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

      // 重置交易记录数据
      resetTransactionsData: () => set((state) => {
        console.log('[Store] 重置交易记录数据')
        return {
          transactions: []
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
            strategyId: o.strategy_id || o.strategyId,
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
        
        const newTransactions = transactions
          .filter(t => !t.deleted) // 过滤掉已删除的记录
          .map(t => ({
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
          // 关键修复：添加交易编号字段映射
          tradeNumber: t.trade_number || t.tradeNumber || null,
          // 添加交易状态字段映射 - 尝试不同的字段名
          status: t.交易状态 || t.trade_status || t.tradeStatus || t.status || null
        }))
        
        // 关键修复：导入数据时需要更新最新的账户余额
        // 找到最新时间的交易记录，使用它的余额作为当前账户余额
        const latestTransaction = newTransactions.reduce((latest, t) => {
          if (!latest || new Date(t.createdAt) > new Date(latest.createdAt)) {
            return t
          }
          return latest
        }, null)
        
        const latestBalance = latestTransaction ? latestTransaction.balance || 0 : 0
        
        console.log('[Store] importTransactions - 使用数据库数据，不与本地合并')
        console.log('[Store] importTransactions - 数据库账单数量:', newTransactions.length)
        console.log('[Store] importTransactions - 最新余额:', latestBalance)
        
        return { 
          transactions: newTransactions,
          account: {
            ...state.account,
            real: {
              ...(state.account.real || {}),
              balance: latestBalance
            }
          }
        }
      }),

      // 批量导入交易记录（从数据库同步）- 直接使用数据库数据，不合并本地数据
      importTradeRecords: (records) => set((state) => {
        if (!records || records.length === 0) {
          // 数据库返回空，不清空本地数据（可能是本地新建的数据还没同步到数据库）
          console.log('[Store] importTradeRecords - 数据库返回空，保留本地数据')
          return state
        }
        
        // 获取当前所有订单，用于策略ID查找
        const allOrders = state.orders || []
        
        const newRecords = records
          .filter(r => !r.deleted) // 过滤掉已删除的记录
          .map(r => {
          // 从数据库获取策略ID字段
          let buyStrategyId = r.buy_strategy_id ? Number(r.buy_strategy_id) : (r.buyStrategyId || null)
          let strategyId = r.strategy_id ? Number(r.strategy_id) : (r.strategyId || null)
          
          // 如果策略ID为空，尝试从相关订单中自动获取
          const tradeNumber = r.trade_number || r.tradeNumber || r.id
          
          // 自动计算买入金额 = 买入数量 * 买入价格
          // 通过遍历订单来计算，确保与股票交易列表中的交易金额一致
          const buyOrders = allOrders.filter(o => o.tradeNumber === tradeNumber && o.type === 'buy')
          let calculatedBuyAmount = 0
          buyOrders.forEach(o => {
            const quantity = parseFloat(o.quantity) || 0
            const price = parseFloat(o.price) || 0
            calculatedBuyAmount += quantity * price
          })
          calculatedBuyAmount = calculatedBuyAmount.toFixed(2)
          console.log('[Store] 计算买入金额:', { buyOrders: buyOrders.length, calculatedBuyAmount, tradeNumber })

          // 自动计算卖出金额 = 卖出数量 * 卖出价格
          // 通过遍历订单来计算，确保与股票交易列表中的交易金额一致
          const sellOrders = allOrders.filter(o => o.tradeNumber === tradeNumber && o.type === 'sell')
          let calculatedSellAmount = 0
          let sellOrderPriceFromOrders = null
          if (sellOrders.length === 1) {
            // 只有一个卖出订单，直接取交易价格
            const price = parseFloat(sellOrders[0].price) || 0
            const quantity = parseFloat(sellOrders[0].quantity) || 0
            calculatedSellAmount = price * quantity
            sellOrderPriceFromOrders = price
          } else if (sellOrders.length > 1) {
            // 多个卖出订单，计算平均价格
            let totalQuantity = 0
            sellOrders.forEach(o => {
              const price = parseFloat(o.price) || 0
              const quantity = parseFloat(o.quantity) || 0
              calculatedSellAmount += price * quantity
              totalQuantity += quantity
            })
            if (totalQuantity > 0) {
              sellOrderPriceFromOrders = calculatedSellAmount / totalQuantity
            }
          }
          calculatedSellAmount = calculatedSellAmount.toFixed(2)
          console.log('[Store] 计算卖出金额:', { sellOrders: sellOrders.length, calculatedSellAmount, tradeNumber, sellOrderPriceFromOrders })
          if (!buyStrategyId && tradeNumber && allOrders.length > 0) {
            // 查找对应交易编号的订单
            const relatedOrders = allOrders.filter(o => o.tradeNumber === tradeNumber)
            const strategyBuyOrders = relatedOrders.filter(o => o.type === 'buy')
            
            if (!buyStrategyId && strategyBuyOrders.length > 0 && strategyBuyOrders[0].strategyId) {
              buyStrategyId = Number(strategyBuyOrders[0].strategyId)
              console.log('[Store] importTradeRecords - 从买入订单自动获取策略ID:', 
                { tradeNumber, buyStrategyId, symbol: r.symbol || r.name })
            }
            
            if (!strategyId && relatedOrders.length > 0 && relatedOrders[0].strategyId) {
              strategyId = Number(relatedOrders[0].strategyId)
              console.log('[Store] importTradeRecords - 从订单自动获取策略ID:', 
                { tradeNumber, strategyId, symbol: r.symbol || r.name })
            }
          }

          return {
            ...r,
            // 确保驼峰格式字段存在（兼容数据库的下划线格式和前端驼峰格式）
            // 买入数量：从订单计算，确保与股票交易列表一致
            buyQuantity: buyOrders.reduce((sum, o) => sum + (parseFloat(o.quantity) || 0), 0),
            // 买入成交价格buy_price：人工手动填写（成交价），从数据库下划线格式读取
            buyPrice: parseFloat(r.buy_price || r.buyPrice) || 0,
            // 买入订单价格buy_order_price：自动从数据库获取，为空时回退到buy_price
            buyOrderPrice: r.buy_order_price ? parseFloat(r.buy_order_price) : (r.buyOrderPrice || parseFloat(r.buy_price) || null),
            buyOrderTime: r.buy_order_time || r.buyOrderTime || null,
            // fillPrice使用buyOrderPrice（订单价格），为空时回退到buy_price
            fillPrice: r.buy_order_price ? parseFloat(r.buy_order_price) : (r.fillPrice || parseFloat(r.buy_price) || null),
            buyTime: r.buy_time || r.buyTime || null,
            buyOrderId: r.buy_order_id ? String(r.buy_order_id) : (r.buyOrderId || null),
            // 卖出数量：从订单计算，确保与股票交易列表一致
            sellQuantity: sellOrders.reduce((sum, o) => sum + (parseFloat(o.quantity) || 0), 0),
            sellPrice: r.sell_price ? parseFloat(r.sell_price) : (r.sellPrice || null),
            // 卖出订单价格sell_order_price：自动从数据库获取，为空时从订单计算
            sellOrderPrice: r.sell_order_price ? parseFloat(r.sell_order_price) : (r.sellOrderPrice !== undefined ? r.sellOrderPrice : (sellOrderPriceFromOrders !== null ? sellOrderPriceFromOrders : null)),
            sellOrderTime: r.sell_order_time || r.sellOrderTime || null,
            sellTime: r.sell_time || r.sellTime || null,
            tradeNumber: tradeNumber,
            // 明确映射股票代码和名称字段（兼容数据库的下划线格式和前端驼峰格式）
            symbol: r.symbol || '-',
            name: r.name || '-',
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
            tradeSummary: r.trade_summary || r.tradeSummary || null,
            // 买入策略字段映射（支持多个可能的字段名，确保当月亏损组件能正确获取）
            buyStrategy: r.buy_strategy || r.buyStrategy || r.strategy || r.trading_strategy || null,
            // 策略ID字段映射（用于跨表查询策略名称）
            buyStrategyId: buyStrategyId,
            strategyId: strategyId,
            // 盈亏金额字段映射（用于当月亏损组件筛选和显示）
            profit: r.profit != null ? parseFloat(r.profit) : (r.profit || 0),
            profitPercent: r.profit_percent != null ? parseFloat(r.profit_percent) : (r.profitPercent || 0),
            // 买入日期字段映射
            buyDate: r.buy_date || r.buyDate || r.buy_time || r.buyTime || null
          }
        })
        // 对交易记录进行去重（按交易编号+创建时间），防止数据重复
        const uniqueRecords = newRecords.reduce((acc, record) => {
          const key = `${record.tradeNumber}_${record.createdAt}`
          if (!acc[key]) {
            acc[key] = record
          } else {
            console.log('[Store] importTradeRecords - 发现重复记录，已去重:', record.tradeNumber)
          }
          return acc
        }, {})
        
        const finalRecords = Object.values(uniqueRecords)
        
        // 智能合并模式：保留本地状态中的记录，用数据库数据更新或补充
        const mergedRecords = state.tradeRecords.map(localRecord => {
          const dbRecord = finalRecords.find(r => r.id === localRecord.id)
          if (dbRecord) {
            // 如果数据库中有对应记录，合并数据（优先使用数据库数据）
            return { ...localRecord, ...dbRecord }
          }
          // 如果数据库中没有，保留本地记录（可能是用户刚修改但还未同步到数据库的数据）
          return localRecord
        })
        
        // 添加数据库中有但本地没有的新记录
        const localIds = new Set(mergedRecords.map(r => r.id))
        const newDbRecords = finalRecords.filter(r => !localIds.has(r.id))
        const completeMergedRecords = [...mergedRecords, ...newDbRecords]
        
        console.log('[Store] importTradeRecords - 智能合并模式')
        console.log('[Store] importTradeRecords - 本地记录数量:', state.tradeRecords.length)
        console.log('[Store] importTradeRecords - 数据库记录数量:', finalRecords.length)
        console.log('[Store] importTradeRecords - 合并后记录数量:', completeMergedRecords.length)
        
        return { tradeRecords: completeMergedRecords }
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
        // 从订单中获取策略ID信息
        const orders = state.orders
        const tradeNumber = tradeRecord.tradeNumber
        
        // 查找对应交易编号的订单
        const relatedOrders = orders.filter(o => o.tradeNumber === tradeNumber)
        const buyOrders = relatedOrders.filter(o => o.type === 'buy')
        const sellOrders = relatedOrders.filter(o => o.type === 'sell')
        
        // 提取策略ID
        let buyStrategyId = tradeRecord.buyStrategyId || null
        let strategyId = tradeRecord.strategyId || null
        
        console.log('[Store] 添加完整交易记录 - 查找策略ID:')
        console.log('   - 交易编号:', tradeNumber)
        console.log('   - 相关订单数量:', relatedOrders.length)
        console.log('   - 买入订单数量:', buyOrders.length)
        console.log('   - 卖出订单数量:', sellOrders.length)
        
        // 如果没有传入策略ID，从订单中自动获取
        if (!buyStrategyId && buyOrders.length > 0 && buyOrders[0].strategyId) {
          buyStrategyId = buyOrders[0].strategyId
          console.log('   - 从买入订单获取策略ID:', buyStrategyId)
        }
        
        if (!strategyId && relatedOrders.length > 0 && relatedOrders[0].strategyId) {
          strategyId = relatedOrders[0].strategyId
          console.log('   - 从订单获取策略ID:', strategyId)
        }
        
        // 创建完整的交易记录
        const newRecord = {
          ...tradeRecord,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          deleted: false,
          deletedAt: null,
          buyStrategyId: buyStrategyId,
          strategyId: strategyId
        }

        console.log('[Store] 添加完整交易记录 - 最终记录:', newRecord)

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
      deleteTradeRecord: async (id) => {
        console.log('[Store] 删除交易记录, id:', id)
        try {
          await apiCall(`/api/trade_records/${id}`, 'DELETE')
          // 从数据库重新同步数据（添加自动刷新机制）
          const syncResponse = await apiCall('/api/sync/all')
          if (syncResponse.success && syncResponse.data && syncResponse.data.trade_records !== undefined) {
            const { trade_records } = syncResponse.data
            set((state) => {
              state.importTradeRecords(trade_records)
              return {}
            })
          }
          return { success: true }
        } catch (err) {
          console.error('[Store] 删除交易记录失败:', err)
          return { success: false, error: err }
        }
      },

      // 批量删除交易记录
      deleteMultipleTradeRecords: async (ids) => {
        console.log('[Store] 批量删除交易记录, ids:', ids)
        try {
          await apiCall(`/api/trade_records/bulk`, 'DELETE', { ids })
          // 从数据库重新同步数据（添加自动刷新机制）
          const syncResponse = await apiCall('/api/sync/all')
          if (syncResponse.success && syncResponse.data && syncResponse.data.trade_records !== undefined) {
            const { trade_records } = syncResponse.data
            set((state) => {
              state.importTradeRecords(trade_records)
              return {}
            })
          }
          return { success: true }
        } catch (err) {
          console.error('[Store] 批量删除交易记录失败:', err)
          return { success: false, error: err }
        }
      },

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
        const profit = (sellOrder.price - buyOrder.price) * sellOrder.quantity
        const profitPercent = (((sellOrder.price - buyOrder.price) / buyOrder.price) * 100).toFixed(2)

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

      // 计算总资产（根据新的规则：持仓市值 + 最新账单明细余额）
      getTotalAssets: (accountType = 'real') => {
        const state = useStore.getState()
        console.log('🚀 [Debug getTotalAssets] 开始计算总资产 - 精确调试')
        
        // 1. 计算持仓市值：交易记录表中交易状态=持仓中的数据，Σ买入金额 - Σ卖出金额
        let holdingMarketValue = 0
        let buyAmountSum = 0
        let sellAmountSum = 0
        
        try {
          const allTradeRecords = (state.tradeRecords || []).filter(r => !r.deleted)
          
          console.log('📊 [Debug getTotalAssets] 交易记录总数:', allTradeRecords.length)
          
          // 调试：显示所有交易记录的详细信息
          console.log('🔍 [Debug getTotalAssets] 所有交易记录详细信息:')
          allTradeRecords.forEach((r, index) => {
            console.log(`   记录${index+1}:`, {
              id: r.id,
              symbol: r.symbol,
              tradeNumber: r.tradeNumber,
              buyQty: r.buyQuantity,
              sellQty: r.sellQuantity,
              buyAmount: r.buyAmount,
              sellAmount: r.sellAmount,
              status: r.status || r.tradeStatus || '未知'
            })
          })
          
          // 筛选持仓中的交易记录：优先按交易编号去重，然后判断持仓状态
          const uniqueRecords = []
          const tradeNumberSet = new Set()
          
          // 先按交易编号去重，保留最新的记录
          const sortedRecords = allTradeRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          sortedRecords.forEach(r => {
            const tradeNum = r.tradeNumber || r.trade_number
            if (tradeNum && !tradeNumberSet.has(tradeNum)) {
              tradeNumberSet.add(tradeNum)
              uniqueRecords.push(r)
            } else if (!tradeNum) {
              // 没有交易编号的记录也保留
              uniqueRecords.push(r)
            }
          })
          
          console.log('🔍 [Debug getTotalAssets] 去重后的交易记录 (按交易编号):', uniqueRecords.length)
          uniqueRecords.forEach((r, index) => {
            console.log(`   记录${index+1}:`, {
              id: r.id,
              tradeNumber: r.tradeNumber || r.trade_number,
              symbol: r.symbol,
              buyQuantity: r.buyQuantity,
              sellQuantity: r.sellQuantity,
              buyAmount: r.buyAmount,
              sellAmount: r.sellAmount,
              status: r.status || r.tradeStatus || '未知'
            })
          })
          
          // 筛选持仓中的交易记录
          const holdingRecords = uniqueRecords.filter(r => {
            // 优先使用交易状态字段（中文）
            const tradeStatus = (r.status || r.tradeStatus || '').toString()
            const sellQty = parseFloat(r.sellQuantity) || 0
            const buyQty = parseFloat(r.buyQuantity) || 0
            
            // 判断是否为持仓中的交易
            let isHolding = false
            if (tradeStatus.includes('持仓中') || tradeStatus === '持仓中') {
              isHolding = true
            } else if (sellQty < buyQty) {
              isHolding = true
            }
            
          console.log(`📈 [Debug getTotalAssets] 单条记录持仓判断:`, {
              tradeNumber: r.tradeNumber || r.trade_number,
              symbol: r.symbol,
              status: tradeStatus,
              buyAmount: r.buyAmount,
              sellAmount: r.sellAmount,
              buyQuantity: r.buyQuantity,
              sellQuantity: r.sellQuantity,
              residualAmount: (parseFloat(r.buyAmount) || 0) - (parseFloat(r.sellAmount) || 0),
              isHolding: isHolding
            })
            
            // 检查：对于有买入且没有卖出的股票交易，应该计入持仓市值
            if (!isHolding && (parseFloat(r.sellAmount) || 0) === 0 && (parseFloat(r.buyAmount) || 0) > 0 && r.symbol) {
              isHolding = true
              console.log(`⚠️ [Debug getTotalAssets] 自动标记为持仓中 - 有买入无卖出:`, { 
                tradeNumber: r.tradeNumber, 
                symbol: r.symbol,
                buyAmount: r.buyAmount
              })
            }
            
            return isHolding
          })
          
          console.log('✅ [Debug getTotalAssets] 持仓中的交易记录数量:', holdingRecords.length)
          
          // 精确计算持仓市值 = Σ((买入数量 - 卖出数量) × 买入均价)
          // 买入均价 = 买入金额 / 买入数量
          if (holdingRecords.length > 0) {
            holdingMarketValue = holdingRecords.reduce((sum, r) => {
              const buyQty = parseFloat(r.buyQuantity) || 0
              const sellQty = parseFloat(r.sellQuantity) || 0
              const buyAmount = parseFloat(r.buyAmount) || 0
              
              // 剩余持仓数量
              const residualQty = buyQty - sellQty
              
              // 买入均价
              const avgBuyPrice = buyQty > 0 ? buyAmount / buyQty : 0
              
              // 持仓市值 = 剩余持仓数量 × 买入均价
              const recordHoldingValue = residualQty * avgBuyPrice
              
              console.log(`   记录持仓市值计算: 交易编号=${r.tradeNumber}, 买入数量=${buyQty}, 卖出数量=${sellQty}, 剩余=${residualQty}, 买入均价=${avgBuyPrice.toFixed(2)}, 单条市值=${recordHoldingValue.toFixed(2)}`)
              
              return sum + recordHoldingValue
            }, 0)
          }
          
          console.log('🧮 [Debug getTotalAssets] 精确计算明细:')
          console.log('   - 持仓市值 (Σ(剩余数量×买入均价)):', holdingMarketValue)
          
        } catch (error) {
          console.log('❌ [Debug getTotalAssets] 持仓市值计算出错:', error)
        }
        
        // 2. 获取余额：账单明细数据库表中发生时间最新的那条数据的余额字段
        let currentBalance = 0
        try {
          const transactions = state.transactions || []
          
          console.log('📋 [Debug getTotalAssets] 账单明细总数:', transactions.length)
          
          if (transactions.length > 0) {
            // 筛选有效交易记录并排序
            const validTransactions = transactions
              .filter(t => !t.deleted)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            
            console.log('📅 [Debug getTotalAssets] 按时间排序的前5条记录:')
            validTransactions.slice(0, 5).forEach((t, index) => {
              console.log(`   记录${index+1}: balance字段=${t.balance}, amount字段=${t.amount}, 类型=${t.type}, 时间=${t.createdAt}`)
            })

            // 🔧 **完全重新计算总余额，避免使用任何数据库balance字段**
            if (validTransactions.length > 0) {
              console.log('🔄 [Debug getTotalAssets] 重新计算总余额（基于amount字段，忽略数据库balance）:')
              
              // 简单地将所有交易的amount加总
              let totalBalance = 0
              
              // 检查数据库中是否已有严重错误的余额值
              const anyWrongBalance = validTransactions.some(t => {
                const dbBalance = parseFloat(t.balance) || 0
                return Math.abs(dbBalance) > 100000
              })
              
              if (anyWrongBalance) {
                console.warn('🚨 [Debug getTotalAssets] 发现数据库中已存在错误balance值，将全面重新计算')
              }
              
              validTransactions.forEach((t, index) => {
                const amount = parseFloat(t.amount) || 0
                const dbBalance = parseFloat(t.balance) || 0
                totalBalance += amount
                
                console.log(`   交易${index+1}: amount=${amount}, 当前累计余额=${totalBalance}, 数据库balance=${dbBalance}, 类型=${t.type}`)
              })
              
              currentBalance = totalBalance
              console.log('✅ [Debug getTotalAssets] 重新计算的正确余额:', currentBalance)
            }
          } else {
            console.log('⚠️ [Debug getTotalAssets] 账单明细为空')
          }
          
          console.log('✅ [Debug getTotalAssets] 提取的最新余额:', currentBalance)
          
        } catch (error) {
          console.log('❌ [Debug getTotalAssets] 余额提取出错:', error)
        }
        
        // 3. 计算总资产 = 持仓市值 + 余额
        const totalAssets = holdingMarketValue + currentBalance
        
        console.log('🔢 [Debug getTotalAssets] 最终计算结果验证:')
        console.log('   - 持仓市值:', holdingMarketValue)
        console.log('   - 最新余额:', currentBalance)
        console.log('   - 总资产 (持仓市值 + 余额):', totalAssets)
        
        // 预期验证：553600 - 77200 = 476400（基于用户提供的实际情况）
        const expectedHoldingValueDebug = 564600 - 11000  // 买入564,600 - 卖出11,000 = 553,600
        const expectedBalanceDebug = -77200  // 实际余额为负数
        const expectedValue = expectedHoldingValueDebug + expectedBalanceDebug
        console.log('🎯 [Debug getTotalAssets] 预期值验证（基于用户数据）:')
        console.log('   - 持仓市值: 188,200×3-11,000 =', expectedHoldingValueDebug)
        console.log('   - 余额:', expectedBalanceDebug)
        console.log('   - 总资产:', expectedHoldingValueDebug, '+', expectedBalanceDebug, '=', expectedValue)
        console.log('🔍 [Debug getTotalAssets] 计算偏差:', totalAssets - expectedValue)
        
        console.log('🔧 [Debug getTotalAssets] 验证结果:')
        console.log('   - 实际计算持仓市值:', holdingMarketValue)
        console.log('   - 实际计算余额:', currentBalance)
        console.log('   - 实际计算总资产:', totalAssets)
        
        return totalAssets
      },

      // 获取持仓占用金额 = Σ((买入价-止损价)×(买入数量-卖出数量)) (风险额度计算)
      // 持仓风险只计算剩余持仓的风险，不计入已卖出的部分
      // 如果止损价无效（为0或大于等于买入价），该订单的风险额度为0
      getHoldingOccupancy: () => {
        const state = useStore.getState()
        
        // 计算持仓占用的风险额度：持仓中交易记录的风险额度计算
        let holdingOccupancy = 0

        try {
          const allTradeRecords = (state.tradeRecords || []).filter(r => !r.deleted)
          const allOrders = (state.orders || []).filter(o => !o.deleted)

          // 筛选持仓中的交易记录：只取交易状态为"持仓中"的记录，并按交易编号去重
          const holdingRecords = []
          const processedTradeNumbers = new Set()
          
          allTradeRecords.forEach(r => {
            const tradeNumber = r.tradeNumber || r.trade_number
            // 跳过已处理过的交易编号
            if (processedTradeNumbers.has(tradeNumber)) {
              return
            }
            
            // 优先使用交易状态字段（中文）
            const tradeStatus = (r.status || r.tradeStatus || '').toString()
            let isHolding = false
            
            if (tradeStatus.includes('持仓中') || tradeStatus === '持仓中') {
              isHolding = true
            } else {
              // 如果交易状态字段不存在或为空，根据买卖数量判断
              const sellQty = r.sellQuantity || 0
              const buyQty = r.buyQuantity || 0
              if (buyQty > 0 && sellQty < buyQty) {
                isHolding = true
              }
            }
            
            if (isHolding) {
              processedTradeNumbers.add(tradeNumber)
              holdingRecords.push(r)
            }
          })
          
          console.log('   - 筛选后的持仓记录:', holdingRecords.length)
          if (holdingRecords.length === 0) {
            console.log('   - 所有交易记录:')
            allTradeRecords.forEach(r => {
              console.log('      ', { tradeNumber: r.tradeNumber, buyQuantity: r.buyQuantity, sellQuantity: r.sellQuantity, status: r.status || r.tradeStatus })
            })
          }

          // 计算持仓占用的风险额度
          console.log('🔍 [getHoldingOccupancy] 开始计算持仓风险')
          console.log('   - 持仓记录数量:', holdingRecords.length)
          
          if (holdingRecords.length > 0) {
            holdingOccupancy = holdingRecords.reduce((sum, r) => {
              const tradeNumber = r.tradeNumber || r.trade_number
              console.log('   - 处理交易记录:', { tradeNumber, buyQuantity: r.buyQuantity, sellQuantity: r.sellQuantity })
              
              // 根据交易编号查找对应的买入订单
              const buyOrders = allOrders.filter(o => 
                o.tradeNumber === tradeNumber && 
                (o.type === 'buy' || o.type === '买入')
              )
              console.log('   - 找到买入订单数量:', buyOrders.length)
              
              // 根据交易编号查找对应的卖出订单
              const sellOrders = allOrders.filter(o => 
                o.tradeNumber === tradeNumber && 
                (o.type === 'sell' || o.type === '卖出')
              )
              console.log('   - 找到卖出订单数量:', sellOrders.length)
              
              // 如果没有找到对应的买入订单，返回0
              if (buyOrders.length === 0) {
                console.log('   - 没有找到买入订单，返回0')
                return sum
              }
              
              // 计算每个买入订单的风险额度：(买入价-止损价)×(买入数量-卖出数量)
              // 持仓风险只计算剩余持仓的风险，不计入已卖出的部分
              let riskAmount = 0
              let hasValidStopLoss = false
              buyOrders.forEach(buyOrder => {
                const buyPrice = parseFloat(buyOrder.price) || 0
                const stopLossPrice = parseFloat(buyOrder.stopLossPrice) || 0
                const buyQty = parseFloat(buyOrder.quantity) || 0
                console.log('   - 买入订单详情:', { buyPrice, stopLossPrice, buyQty })
                
                // 获取该订单对应的卖出数量
                const relatedSellQty = sellOrders.reduce((sellSum, sellOrder) => {
                  return sellSum + (parseFloat(sellOrder.quantity) || 0)
                }, 0)
                console.log('   - 相关卖出数量:', relatedSellQty)
                
                // 剩余持仓数量
                const remainingQty = buyQty - relatedSellQty
                console.log('   - 剩余持仓数量:', remainingQty)
                
                // 风险额度 = (买入价 - 止损价) × 剩余持仓数量
                if (stopLossPrice > 0 && stopLossPrice < buyPrice && remainingQty > 0) {
                  riskAmount += (buyPrice - stopLossPrice) * remainingQty
                  hasValidStopLoss = true
                  console.log('   - 计算风险额度:', (buyPrice - stopLossPrice) * remainingQty)
                } else {
                  console.log('   - 条件不满足: stopLossPrice > 0 && stopLossPrice < buyPrice && remainingQty > 0')
                  console.log('      stopLossPrice > 0:', stopLossPrice > 0)
                  console.log('      stopLossPrice < buyPrice:', stopLossPrice < buyPrice)
                  console.log('      remainingQty > 0:', remainingQty > 0)
                }
              })
              
              // 如果没有有效的止损价设置，风险额度为0
              if (!hasValidStopLoss) {
                riskAmount = 0
                console.log('   - 没有有效的止损价，风险额度设为0')
              }
              
              console.log('   - 本条记录风险额度:', riskAmount)
              return sum + riskAmount
            }, 0)
          }

        } catch (error) {
          console.log('❌ [getHoldingOccupancy] 持仓占用计算出错:', error)
        }

        return holdingOccupancy
      },

    }),
    {
      name: 'trading-system-storage',
      merge: (persistedState, currentState) => {
        console.log('[Store] Merge - persistedState:', persistedState)
        console.log('[Store] Merge - currentState:', currentState)

        // 确保 account 结构正确，并彻底清除可能错误的余额值
        if (persistedState && persistedState.account) {
          if (!persistedState.account.real || 
              typeof persistedState.account.real.balance !== 'number' ||
              Math.abs(persistedState.account.real.balance) > 1000000) { // 清除明显错误的余额值
            persistedState.account.real = { balance: 0, totalInvested: 0, totalProfit: 0 }
            console.log('🔄 [状态恢复] 清除错误的余额值，重置为0')
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
export { apiCall }
