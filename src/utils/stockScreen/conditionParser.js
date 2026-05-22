// 选股条件解析器 - 将自然语言解析为结构化选股条件
// 参考同花顺"一句话选股"设计

// 支持的指标类型
export const INDICATOR_TYPES = {
  // 均线类
  MA: 'MA',         // 简单移动平均
  EMA: 'EMA',       // 指数移动平均
  EXPMA: 'EXPMA',   // 指数平滑移动平均（同EMA）
  SMA: 'SMA',       // 平滑移动平均
  
  // 布林带
  BOLL_UPPER: 'BOLL_UPPER',
  BOLL_MID: 'BOLL_MID',
  BOLL_LOWER: 'BOLL_LOWER',
  
  // MACD
  MACD_DIF: 'MACD_DIF',
  MACD_DEA: 'MACD_DEA',
  MACD_HIST: 'MACD_HIST',
  
  // RSI
  RSI: 'RSI',
  
  // KDJ
  KDJ_K: 'KDJ_K',
  KDJ_D: 'KDJ_D',
  KDJ_J: 'KDJ_J',
  
  // 价格相关
  PRICE: 'PRICE',
  HIGH: 'HIGH',
  LOW: 'LOW',
  OPEN: 'OPEN',
  CLOSE: 'CLOSE',
  
  // 成交量
  VOLUME: 'VOLUME',
  AMOUNT: 'AMOUNT',
  
  // 涨跌幅
  CHANGE_PERCENT: 'CHANGE_PERCENT',
  
  // 换手率
  TURNOVER_RATE: 'TURNOVER_RATE',
  
  // 振幅
  AMPLITUDE: 'AMPLITUDE',
}

// 支持的周期
export const PERIODS = {
  D: { label: '日线', value: 'D' },
  W: { label: '周线', value: 'W' },
  M: { label: '月线', value: 'M' },
  '1m': { label: '1分钟', value: '1m' },
  '5m': { label: '5分钟', value: '5m' },
  '15m': { label: '15分钟', value: '15m' },
  '30m': { label: '30分钟', value: '30m' },
  '60m': { label: '60分钟', value: '60m' },
}

// 比较操作符
export const OPERATORS = {
  GT: '>',
  GTE: '>=',
  LT: '<',
  LTE: '<=',
  EQ: '=',
  CROSS_ABOVE: '上穿',
  CROSS_BELOW: '下穿',
}

// 周期描述词映射
const PERIOD_KEYWORDS = {
  '日': 'D', '天': 'D', 'daily': 'D',
  '周': 'W', 'weekly': 'W',
  '月': 'M', 'monthly': 'M',
  '1分钟': '1m', '1分': '1m', '1min': '1m',
  '5分钟': '5m', '5分': '5m', '5min': '5m',
  '15分钟': '15m', '15分': '15m', '15min': '15m',
  '30分钟': '30m', '30分': '30m', '30min': '30m',
  '60分钟': '60m', '60分': '60m', '60min': '60m', '小时': '60m',
}

// 指标名称映射
const INDICATOR_KEYWORDS = {
  // 均线
  'ma': 'MA', '均线': 'MA', '移动平均': 'MA', 'moving average': 'MA',
  'ema': 'EMA', '指数均线': 'EMA', '指数移动平均': 'EMA', 'exponential': 'EMA',
  'expma': 'EXPMA', '指数平滑': 'EXPMA', 'expmoving': 'EXPMA',
  'sma': 'SMA', '平滑均线': 'SMA', 'simple': 'SMA',
  
  // 布林带
  'boll': 'BOLL_UPPER', '布林': 'BOLL_UPPER', 'bollinger': 'BOLL_UPPER',
  '布林上轨': 'BOLL_UPPER', '布林上': 'BOLL_UPPER', '上轨': 'BOLL_UPPER', 'upper': 'BOLL_UPPER',
  '布林中轨': 'BOLL_MID', '布林中': 'BOLL_MID', '中轨': 'BOLL_MID', 'mid': 'BOLL_MID',
  '布林下轨': 'BOLL_LOWER', '布林下': 'BOLL_LOWER', '下轨': 'BOLL_LOWER', 'lower': 'BOLL_LOWER',
  
  // MACD
  'macd': 'MACD_DIF', 'macd柱': 'MACD_HIST', 'dif': 'MACD_DIF', 'macd_dif': 'MACD_DIF',
  'dea': 'MACD_DEA', 'macd_dea': 'MACD_DEA', 'signal': 'MACD_DEA',
  'hist': 'MACD_HIST', 'macd_hist': 'MACD_HIST', '柱': 'MACD_HIST', 'histogram': 'MACD_HIST',
  
  // RSI
  'rsi': 'RSI', '相对强弱': 'RSI', 'relative': 'RSI',
  
  // KDJ
  'kdj': 'KDJ_K',
  'k': 'KDJ_K', 'kdj_k': 'KDJ_K', 'fastk': 'KDJ_K',
  'd': 'KDJ_D', 'kdj_d': 'KDJ_D', 'slowk': 'KDJ_D', 'slowd': 'KDJ_D',
  'j': 'KDJ_J', 'kdj_j': 'KDJ_J',
  
  // 价格
  '股价': 'PRICE', '价格': 'PRICE', '收盘价': 'CLOSE', '收盘': 'CLOSE',
  '开盘价': 'OPEN', '开盘': 'OPEN', '最高价': 'HIGH', '最高': 'HIGH',
  '最低价': 'LOW', '最低': 'LOW',
  
  // 成交量
  '成交量': 'VOLUME', 'volume': 'VOLUME', 'vol': 'VOLUME', '量': 'VOLUME',
  '成交额': 'AMOUNT', 'amount': 'AMOUNT', '额': 'AMOUNT',
  
  // 涨跌幅
  '涨跌幅': 'CHANGE_PERCENT', '涨幅': 'CHANGE_PERCENT', '涨幅%': 'CHANGE_PERCENT',
  '涨跌': 'CHANGE_PERCENT', 'change': 'CHANGE_PERCENT',
  
  // 换手率
  '换手率': 'TURNOVER_RATE', '换手': 'TURNOVER_RATE', 'turnover': 'TURNOVER_RATE',
  
  // 振幅
  '振幅': 'AMPLITUDE', 'amplitude': 'AMPLITUDE',
}

// 操作符关键词映射
const OPERATOR_KEYWORDS = {
  '>': 'GT', '大于': 'GT', '超过': 'GT', '高于': 'GT', 'greater': 'GT',
  '>=': 'GTE', '大于等于': 'GTE', '不低于': 'GTE', '至少': 'GTE',
  '<': 'LT', '小于': 'LT', '低于': 'LT', '少于': 'LT', 'less': 'LT',
  '<=': 'LTE', '小于等于': 'LTE', '不超过': 'LTE', '至多': 'LTE',
  '=': 'EQ', '等于': 'EQ', '是': 'EQ', 'equals': 'EQ',
  '上穿': 'CROSS_ABOVE', '金叉': 'CROSS_ABOVE', '向上突破': 'CROSS_ABOVE',
  '下穿': 'CROSS_BELOW', '死叉': 'CROSS_BELOW', '向下跌破': 'CROSS_BELOW',
}

// 特殊条件关键词
const SPECIAL_CONDITIONS = {
  '不含北交所': { type: 'exclude_exchange', value: '北交所' },
  '不含北交': { type: 'exclude_exchange', value: '北交所' },
  '排除北交所': { type: 'exclude_exchange', value: '北交所' },
  '不含st': { type: 'exclude_keyword', value: 'ST' },
  '不含st股': { type: 'exclude_keyword', value: 'ST' },
  '排除st': { type: 'exclude_keyword', value: 'ST' },
  '非st': { type: 'exclude_keyword', value: 'ST' },
  '不含科创板': { type: 'exclude_exchange', value: '科创板' },
  '不含创业板': { type: 'exclude_exchange', value: '创业板' },
  '仅主板': { type: 'only_main_board', value: true },
  '连续上涨': { type: 'consecutive_up', value: 3 },
  '连续上涨3天': { type: 'consecutive_up', value: 3 },
  '连续上涨5天': { type: 'consecutive_up', value: 5 },
  '连续下跌': { type: 'consecutive_down', value: 3 },
  '连续下跌3天': { type: 'consecutive_down', value: 3 },
  '连续下跌5天': { type: 'consecutive_down', value: 5 },
  '放量': { type: 'volume_surge', value: 2 },
  '大幅放量': { type: 'volume_surge', value: 3 },
  '缩量': { type: 'volume_shrink', value: 0.5 },
  '涨停': { type: 'limit_up', value: true },
  '跌停': { type: 'limit_down', value: true },
  '创新高': { type: 'new_high', value: 20 },
  '创20日新高': { type: 'new_high', value: 20 },
  '创60日新高': { type: 'new_high', value: 60 },
  '创新低': { type: 'new_low', value: 20 },
  '创20日新低': { type: 'new_low', value: 20 },
}

// 解析单个条件表达式
function parseCondition(expression) {
  const expr = expression.trim()
  
  // 尝试匹配特殊条件
  for (const [keyword, condition] of Object.entries(SPECIAL_CONDITIONS)) {
    if (expr.includes(keyword)) {
      return {
        type: 'special',
        condition,
        raw: expr,
      }
    }
  }
  
  // 匹配指标比较: "13周EMA均线 > 26周EMA均线"
  // 模式: [周期][指标][参数] [操作符] [周期][指标][参数]
  const comparisonRegex = /(.+?)\s*(>|>=|<|<=|=|上穿|下穿|金叉|死叉|向上突破|向下跌破)\s*(.+)/
  const match = expr.match(comparisonRegex)
  
  if (match) {
    const leftRaw = match[1].trim()
    const operatorRaw = match[2].trim()
    const rightRaw = match[3].trim()
    
    // 先判断右侧是否为纯数值，如果是则走数值比较
    const isNumericRight = /^[\d.]+$/.test(rightRaw.replace(/%/g, ''))
    
    if (isNumericRight) {
      // 数值比较: "周MACD < 0"
      const value = parseFloat(rightRaw)
      const left = parseIndicatorExpression(leftRaw)
      const operator = OPERATOR_KEYWORDS[operatorRaw] || 'GT'
      
      if (left) {
        return {
          type: 'value_comparison',
          left,
          operator,
          value,
          raw: expr,
        }
      }
    } else {
      // 指标比较: "5日均线 > 10日均线"
      const left = parseIndicatorExpression(leftRaw)
      const right = parseIndicatorExpression(rightRaw)
      const operator = OPERATOR_KEYWORDS[operatorRaw] || 'GT'
      
      if (left && right) {
        return {
          type: 'comparison',
          left,
          right,
          operator,
          raw: expr,
        }
      }
    }
  }
  
  // 匹配价格和数值比较: "股价 < 13周EMA均线" 或 "涨幅 > 5%"
  const priceComparisonRegex = /(.+?)\s*(>|>=|<|<=|=)\s*([\d.]+)%?/
  const priceMatch = expr.match(priceComparisonRegex)
  
  if (priceMatch) {
    const leftRaw = priceMatch[1].trim()
    const operatorRaw = priceMatch[2].trim()
    const value = parseFloat(priceMatch[3])
    
    const left = parseIndicatorExpression(leftRaw)
    const operator = OPERATOR_KEYWORDS[operatorRaw] || 'GT'
    
    if (left) {
      return {
        type: 'value_comparison',
        left,
        operator,
        value,
        raw: expr,
      }
    }
  }
  
  // 默认返回无法解析的条件
  return {
    type: 'unknown',
    raw: expr,
  }
}

// 解析指标表达式，如 "13周EMA均线"、"26日MA"、"收盘价"
function parseIndicatorExpression(raw) {
  const expr = raw.trim()
  
  // 提取周期
  let period = 'D' // 默认日线
  let periodMatch = null
  
  for (const [keyword, periodValue] of Object.entries(PERIOD_KEYWORDS)) {
    if (expr.includes(keyword)) {
      period = periodValue
      periodMatch = keyword
      break
    }
  }
  
  // 提取数值参数（如13、26）
  const numMatch = expr.match(/(\d+)/)
  const param = numMatch ? parseInt(numMatch[1]) : null
  
  // 提取指标类型
  let indicatorType = null
  let indicatorMatch = null
  
  // 先尝试匹配复合指标名（如"布林上轨"、"macd柱"）
  const compositeKeywords = [
    '布林上轨', '布林中轨', '布林下轨',
    'macd柱', 'macd_dif', 'macd_dea', 'macd_hist',
    '指数移动平均', '指数平滑', '相对强弱',
  ]
  for (const keyword of compositeKeywords) {
    if (expr.toLowerCase().includes(keyword.toLowerCase())) {
      indicatorType = INDICATOR_KEYWORDS[keyword]
      indicatorMatch = keyword
      break
    }
  }
  
  // 再尝试匹配简单指标名
  if (!indicatorType) {
    // 按长度降序排列，优先匹配长关键词
    const sortedKeywords = Object.keys(INDICATOR_KEYWORDS).sort((a, b) => b.length - a.length)
    for (const keyword of sortedKeywords) {
      if (expr.toLowerCase().includes(keyword.toLowerCase())) {
        indicatorType = INDICATOR_KEYWORDS[keyword]
        indicatorMatch = keyword
        break
      }
    }
  }
  
  if (!indicatorType) {
    return null
  }
  
  return {
    type: indicatorType,
    period,
    param,
    raw: expr,
  }
}

// 主解析函数：将自然语言解析为结构化条件数组
export function parseStockScreenConditions(text) {
  if (!text || !text.trim()) return []
  
  const conditions = []
  
  // 按分号、逗号、分号+空格分割条件
  const parts = text.split(/[；;,，]+/).map(p => p.trim()).filter(p => p)
  
  for (const part of parts) {
    const condition = parseCondition(part)
    if (condition) {
      conditions.push(condition)
    }
  }
  
  return conditions
}

// 将结构化条件转换为可读文本
export function conditionsToText(conditions) {
  return conditions.map(c => c.raw || '').join('；')
}

// 将结构化条件转换为展示用的文本
export function conditionToDisplayText(condition) {
  if (condition.type === 'special') {
    return condition.raw
  }
  
  if (condition.type === 'comparison') {
    const leftText = indicatorToText(condition.left)
    const rightText = indicatorToText(condition.right)
    const opMap = {
      GT: '>', GTE: '>=', LT: '<', LTE: '<=', EQ: '=',
      CROSS_ABOVE: '上穿', CROSS_BELOW: '下穿',
    }
    const op = opMap[condition.operator] || condition.operator
    return `${leftText} ${op} ${rightText}`
  }
  
  if (condition.type === 'value_comparison') {
    const leftText = indicatorToText(condition.left)
    return `${leftText} ${condition.operator} ${condition.value}`
  }
  
  return condition.raw || '未知条件'
}

// 指标转换为文本
function indicatorToText(indicator) {
  if (!indicator) return ''
  
  const typeMap = {
    MA: '均线', EMA: 'EMA均线', EXPMA: 'EXPMA均线', SMA: 'SMA均线',
    BOLL_UPPER: '布林上轨', BOLL_MID: '布林中轨', BOLL_LOWER: '布林下轨',
    MACD_DIF: 'DIF', MACD_DEA: 'DEA', MACD_HIST: 'MACD柱',
    RSI: 'RSI',
    KDJ_K: 'K', KDJ_D: 'D', KDJ_J: 'J',
    PRICE: '股价', CLOSE: '收盘价', OPEN: '开盘价', HIGH: '最高价', LOW: '最低价',
    VOLUME: '成交量', AMOUNT: '成交额',
    CHANGE_PERCENT: '涨跌幅',
    TURNOVER_RATE: '换手率',
    AMPLITUDE: '振幅',
  }
  
  const periodMap = {
    D: '日', W: '周', M: '月',
    '1m': '1分钟', '5m': '5分钟', '15m': '15分钟',
    '30m': '30分钟', '60m': '60分钟',
  }
  
  const typeName = typeMap[indicator.type] || indicator.type
  const periodName = periodMap[indicator.period] || ''
  const paramText = indicator.param ? indicator.param : ''
  
  if (paramText && periodName) {
    return `${paramText}${periodName}${typeName}`
  }
  if (paramText) {
    return `${paramText}${typeName}`
  }
  if (periodName) {
    return `${periodName}${typeName}`
  }
  return typeName
}

// 验证条件是否合法
export function validateConditions(conditions) {
  const errors = []
  
  for (const condition of conditions) {
    if (condition.type === 'unknown') {
      errors.push({ condition: condition.raw, error: '无法解析此条件' })
    }
    
    if (condition.type === 'comparison') {
      if (!condition.left) {
        errors.push({ condition: condition.raw, error: '左侧指标无法识别' })
      }
      if (!condition.right) {
        errors.push({ condition: condition.raw, error: '右侧指标无法识别' })
      }
    }
    
    if (condition.type === 'value_comparison') {
      if (!condition.left) {
        errors.push({ condition: condition.raw, error: '指标无法识别' })
      }
      if (isNaN(condition.value)) {
        errors.push({ condition: condition.raw, error: '数值无效' })
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
