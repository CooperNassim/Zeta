/**
 * 技术指标计算工具函数
 */

/**
 * 计算EMA（指数移动平均线）
 * @param {Array} prices - 价格数组
 * @param {number} period - 周期
 * @returns {Array} EMA数组
 */
export const calculateEMA = (prices, period) => {
  if (!prices || prices.length < period) return []

  const ema = []
  const k = 2 / (period + 1)

  // 第一个EMA值使用SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += prices[i]
  }
  ema[period - 1] = sum / period

  // 计算后续EMA
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * k + ema[i - 1]
  }

  return ema
}

/**
 * 计算标准差
 * @param {Array} data - 数据数组
 * @param {number} period - 周期
 * @param {Array} sma - SMA数组
 * @returns {Array} 标准差数组
 */
export const calculateStandardDeviation = (data, period, sma) => {
  if (!data || data.length < period || !sma) return []

  const std = []
  for (let i = period - 1; i < data.length; i++) {
    let sumSquared = 0
    for (let j = i - period + 1; j <= i; j++) {
      sumSquared += Math.pow(data[j] - sma[i], 2)
    }
    std[i] = Math.sqrt(sumSquared / period)
  }

  return std
}

/**
 * 计算布林通道
 * @param {Array} prices - 价格数组
 * @param {number} period - 周期，默认20
 * @param {number} stdDev - 标准差倍数，默认2
 * @returns {Object} { middle, upper, lower }
 */
export const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  if (!prices || prices.length < period) {
    return { middle: [], upper: [], lower: [] }
  }

  const middle = []
  const upper = []
  const lower = []

  // 计算SMA（中轨）
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j]
    }
    middle[i] = sum / period
  }

  // 计算标准差
  const std = calculateStandardDeviation(prices, period, middle)

  // 计算上下轨
  for (let i = period - 1; i < prices.length; i++) {
    upper[i] = middle[i] + stdDev * std[i]
    lower[i] = middle[i] - stdDev * std[i]
  }

  return { middle, upper, lower }
}

/**
 * 计算埃尔德价格通道
 * @param {Array} prices - 价格数组
 * @param {number} period - EMA周期，默认13
 * @param {number} coveragePercent - 覆盖率，默认95%
 * @returns {Object} { middle, upper, lower }
 */
export const calculateElderChannel = (prices, period = 13, coveragePercent = 95) => {
  if (!prices || prices.length < period) {
    return { middle: [], upper: [], lower: [] }
  }

  // 计算EMA
  const ema = calculateEMA(prices, period)

  // 计算通道宽度（基于价格波动）
  // 使用过去N天的价格波动范围来确定通道宽度
  const volatility = []
  for (let i = period - 1; i < prices.length; i++) {
    let maxRange = 0
    for (let j = Math.max(0, i - period + 1); j <= i; j++) {
      maxRange = Math.max(maxRange, Math.abs(prices[j] - ema[i]))
    }

    // 根据覆盖率计算通道宽度
    // 覆盖95%的价格意味着大约2个标准差的范围
    const channelWidth = maxRange * (coveragePercent / 50) // 简化计算

    volatility[i] = channelWidth
  }

  const upper = []
  const lower = []

  // 计算上下通道
  for (let i = period - 1; i < prices.length; i++) {
    upper[i] = ema[i] + volatility[i]
    lower[i] = ema[i] - volatility[i]
  }

  return { middle: ema, upper, lower }
}

/**
 * 根据通道数据计算操作评分（A/B/C/D）
 * @param {number} price - 操作价格
 * @param {number} high - 当天最高价
 * @param {number} low - 当天最低价
 * @param {string} type - 'buy' 或 'sell'
 * @returns {string} 'A' | 'B' | 'C' | 'D'
 */
export const calculateTradeGrade = (price, high, low, type) => {
  if (!price || !high || !low) return 'C'

  const range = high - low
  if (range <= 0) return 'C'

  // 计算价格在区间中的位置（0-1）
  const position = (price - low) / range

  if (type === 'buy') {
    // 买入：价格越低越好
    if (position < 0.1) return 'A'  // 最低价附近
    if (position < 0.3) return 'B'
    if (position < 0.6) return 'C'
    return 'D'  // 接近最高价
  } else {
    // 卖出：价格越高越好
    if (position > 0.9) return 'A'  // 最高价附近
    if (position > 0.7) return 'B'
    if (position > 0.4) return 'C'
    return 'D'  // 接近最低价
  }
}

/**
 * 计算整体交易评分
 * @param {number} buyPrice - 买入价
 * @param {number} sellPrice - 卖出价
 * @param {number} upperChannel - 上通道价
 * @param {number} lowerChannel - 下通道价
 * @returns {number} 0-1之间的分数
 */
export const calculateOverallScore = (buyPrice, sellPrice, upperChannel, lowerChannel) => {
  if (!buyPrice || !sellPrice || !upperChannel || !lowerChannel) return 0

  const channelRange = upperChannel - lowerChannel
  if (channelRange <= 0) return 0

  const profit = sellPrice - buyPrice
  const score = profit / channelRange

  return Math.max(0, Math.min(1, score))
}

/**
 * 计算多条K线的布林通道
 * @param {Array} klineData - K线数据数组 [{ open, high, low, close, volume, timestamp }]
 * @param {number} period - 周期
 * @param {number} stdDev - 标准差倍数
 * @returns {Array} 带有通道指标的K线数据
 */
export const calculateKlineBollingerBands = (klineData, period = 20, stdDev = 2) => {
  if (!klineData || klineData.length < period) return []

  const closes = klineData.map(k => k.close)
  const { middle, upper, lower } = calculateBollingerBands(closes, period, stdDev)

  return klineData.map((k, i) => ({
    ...k,
    bb_middle: middle[i] || null,
    bb_upper: upper[i] || null,
    bb_lower: lower[i] || null
  }))
}

/**
 * 计算多条K线的埃尔德通道
 * @param {Array} klineData - K线数据数组
 * @param {number} period - EMA周期
 * @param {number} coveragePercent - 覆盖率
 * @returns {Array} 带有通道指标的K线数据
 */
export const calculateKlineElderChannel = (klineData, period = 13, coveragePercent = 95) => {
  if (!klineData || klineData.length < period) return []

  const closes = klineData.map(k => k.close)
  const { middle, upper, lower } = calculateElderChannel(closes, period, coveragePercent)

  return klineData.map((k, i) => ({
    ...k,
    elder_middle: middle[i] || null,
    elder_upper: upper[i] || null,
    elder_lower: lower[i] || null
  }))
}
