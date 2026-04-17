import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateTradeGrade, calculateOverallScore } from '../utils/technicalIndicators'

// API基础URL
// 使用相对路径，通过 Vite 代理到后端
const API_BASE_URL = ''

// API调用函数
export const apiCall = async (endpoint, method = 'GET', data = null) => {
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
  {
    id: '1',
    name: '注意力集中度',
    description: '交易时保持注意力的能力',
    targetValue: 80,
    unit: '%',
    color: '#3B82F6',
    importance: 5,
    strategies: ['冥想', '定时休息', '减少干扰'],
    icon: null,
    tags: ['注意力', '专注']
  },
  {
    id: '2',
    name: '情绪稳定性',
    description: '面对市场波动时保持情绪稳定的能力',
    targetValue: 85,
    unit: '%',
    color: '#10B981',
    importance: 5,
    strategies: ['情绪记录', '深呼吸', '分散投资'],
    icon: null,
    tags: ['情绪', '风险管理']
 },
  {
    id: '3',
    name: '决策速度',
    description: '分析后做出决策的速度',
    targetValue: 0.5,
    unit: '分钟',
    color: '#EF4444',
    importance: 4,
    strategies: ['预定义标准', '简化决策流程', '排除情绪影响'],
    icon: null,
    tags: ['效率', '决策']
  },
  {
    id: '4',
    name: '风险承受力',
    description: '面对损失时的心理接受能力',
    targetValue: 75,
    unit: '%',
    color: '#F59E0B',
    importance: 4,
    strategies: ['设定止损', '风险分散', '心理准备'],
    icon: null,
    tags: ['风险', '心理承受']
  },
  {
    id: '5',
    name: '纪律执行力',
    description: '严格遵守交易计划的能力',
    targetValue: 90,
    unit: '%',
    color: '#8B5CF6',
    importance: 5,
    strategies: ['交易日志', '自我反省', '执行检查'],
    icon: null,
    tags: ['纪律', '执行力']
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
      strategies: {
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
              { id: '5', name: '止损纪律', weight: 0.2, threshold: 70, description: '严格遵守止损规则' },
            ],
            passScore: 70
          }
        ]
      },

      // 风险配置（从数据库同步）
      riskConfig: {
        real: { totalRiskPercent: 6, singleRiskPercent: 2 },
        virtual: { totalRiskPercent: 6, singleRiskPercent: 2 }
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

      // 技术指标配置
      technicalIndicators: [
        { id: 'rsi', name: 'RSI', enabled: true, params: { period: 14 } },
        { id: 'macd', name: 'MACD', enabled: true, params: { fast: 12, slow: 26, signal: 9 } },
        { id: 'kdj', name: 'KDJ', enabled: true, params: { n: 9, m1: 3, m2: 3 } },
        { id: 'boll', name: '布林带', enabled: true, params: { period: 20, std: 2 } },
        { id: 'ma', name: '移动平均线', enabled: true, params: { periods: [5, 10, 20, 60] } }
      ],

      // 股票池
      stockPool: [],

      // K线数据
      klineData: [],

      // 交易记录（买入卖出订单）
      orders: [],

      // 账单明细记录
      transactions: [],

      // 交易执行记录
      strategyRecords: [],

      // 交易历史记录
      tradeRecords: [],

      // 状态相关的设置和数据
      settings: {
        theme: 'light',
        language: 'zh-CN',
        riskControlEnabled: true,
        autoSync: true
      },

      // 重要：这里是触发器安装功能
      installTransactionsTrigger: async () => {
        console.log('[Store] 开始安装账单明细触发器')
        
        try {
          // 简化SQL字符串，避免模板字符串嵌套问题
          const sqlParts = [
            "CREATE OR REPLACE FUNCTION sync_transactions_from_trade_orders()",
            "RETURNS TRIGGER AS $$",
            "DECLARE",
            "  transaction_amount DECIMAL(18,2);",
            "  transaction_type TEXT;",
            "  transaction_category TEXT;",
            "  account_name TEXT;",
            "  account_num TEXT;",
            "BEGIN",
            "  -- 确定账户信息",
            "  IF NEW.account_type = 'real' THEN",
            "    account_name := '实盘账户';",
            "    account_num := '1001';",
            "  ELSE",
            "    account_name := '虚拟账户';",
            "    account_num := '1002';",
            "  END IF;",
            "  ",
            "  -- 确定交易金额和类型",
            "  IF NEW.order_type = '买入' THEN",
            "    transaction_amount := -1 * (NEW.price * NEW.quantity);",
            "    transaction_type := '出账';",
            "    transaction_category := '买入股票';",
            "  ELSIF NEW.order_type = '卖出' THEN",
            "    transaction_amount := NEW.price * NEW.quantity;",
            "    transaction_type := '入账';",
            "    transaction_category := '卖出股票';",
            "  ELSE",
            "    -- 不是买入或卖出交易，不生成账单记录",
            "    RETURN NEW;",
            "  END IF;",
            "  ",
            "  -- 检查是否已有对应的账单记录",
            "  IF TG_OP = 'INSERT' AND NOT EXISTS (",
            "    SELECT 1 FROM transactions ",
            "    WHERE trade_number = NEW.trade_number ",
            "    AND deleted = false",
            "  ) THEN",
            "    -- 插入新的账单记录",
            "    INSERT INTO transactions (",
            "      amount, transaction_type, description, trade_number, created_at, updated_at, name, balance",
            "    ) VALUES (",
            "      transaction_amount, transaction_type,",
            "      NEW.order_type || ' ' || NEW.stock_code || '(' || NEW.stock_name || ') ' || NEW.quantity || '股',",
            "      NEW.trade_number, NEW.created_at, NEW.updated_at, NEW.stock_name, 0",
            "    );",
            "  END IF;",
            "  ",
            "  -- 更新账户余额（仅处理最新的操作）",
            "  IF TG_OP = 'DELETE' THEN",
            "    -- 删除操作时，反向更新账户余额",
            "    UPDATE account ",
            "    SET balance = balance - transaction_amount",
            "    WHERE name = account_name;",
            "  ELSE",
            "    -- 插入/更新操作时，更新账户余额",
            "    UPDATE account ",
            "    SET balance = balance + transaction_amount",
            "    WHERE name = account_name;",
            "  END IF;",
            "  ",
            "  RETURN NEW;",
            "END;",
            "$$ LANGUAGE plpgsql;",
            "",
            "-- 删除已存在的触发器（如果存在）",
            "DROP TRIGGER IF EXISTS trigger_sync_transactions ON trade_orders;",
            "",
            "-- 创建新的触发器",
            "CREATE TRIGGER trigger_sync_transactions",
            "  AFTER INSERT ON trade_orders",
            "  FOR EACH ROW",
            "  EXECUTE FUNCTION sync_transactions_from_trade_orders();"
          ];
          
          const sql = sqlParts.join('\n');
          
          // 执行SQL
          const result = await apiCall('/api/execute-sql', 'POST', { sql })
          
          if (result.success) {
            console.log('[Store] 账单明细触发器安装成功')
            return { success: true, message: '触发器安装成功' }
          } else {
            console.error('[Store] 触发器安装失败:', result.error)
            return { success: false, error: result.error }
          }
        } catch (error) {
          console.error('[Store] 安装触发器异常:', error)
          return { success: false, error: error.message }
        }
      }
    }),
    {
      name: 'trading-storage',
      partialize: (state) => {
        // 只持久化必要的状态
        return {
          account: state.account,
          dailyWorkData: state.dailyWorkData,
          psychologicalTests: state.psychologicalTests,
          riskConfig: state.riskConfig,
          settings: state.settings,
          // 从数据库中实时同步的关键数据不要持久化
          // orders: []，
          // transactions: [],
          // stockPool: [],
          // klineData: [],
          // strategyRecords: [],
          // tradeRecords: [],
        }
      },
      merge: (persistedState, currentState) => {
        // 从数据库中同步的数据优先级高于本地存储
        const syncFromDb = (currentState?.orders && currentState.orders.length > 0) ||
                           (currentState?.transactions && currentState.transactions.length > 0)
        
        if (syncFromDb) {
          console.log('[Store] 使用数据库同步数据，忽略本地存储')
        } else {
          console.log('[Store] 数据库数据为空，使用本地存储的持久化数据')
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

// 安全的store hook
// 在组件加载时检查store是否已初始化
export const useSafeStore = () => {
  const store = useStore()
  
  // 检查store是否已正确初始化
  const isReady = store && store.account !== undefined && store.orders !== undefined
  
  return {
    store: isReady ? store : null,
    isReady
  }
}