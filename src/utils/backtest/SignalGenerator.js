// 信号生成器 - 根据技术指标配置生成买卖信号

export class SignalGenerator {
  generate(klineData, config) {
    const indicators = this.calculateIndicators(klineData, config.indicators)
    const signals = []

    for (let i = 0; i < klineData.length; i++) {
      const buySignal = this.checkBuyConditions(indicators, i, config.buyConditions, klineData)
      const sellSignal = this.checkSellConditions(indicators, i, config.sellConditions, klineData)

      if (buySignal) {
        signals.push({ type: 'BUY', index: i, date: klineData[i].date, price: klineData[i].close, reason: buySignal.reason })
      }
      if (sellSignal) {
        signals.push({ type: 'SELL', index: i, date: klineData[i].date, price: klineData[i].close, reason: sellSignal.reason })
      }
    }

    return signals
  }

  calculateIndicators(klineData, indicatorsConfig) {
    const indicators = {}

    if (!indicatorsConfig || indicatorsConfig.length === 0) return indicators

    for (const indConfig of indicatorsConfig) {
      const type = indConfig.type.toUpperCase()
      const params = indConfig.params || {}

      switch (type) {
        case 'MA':
          indicators.MA = this.calculateMA(klineData, params)
          break
        case 'MACD':
          indicators.MACD = this.calculateMACD(klineData, params)
          break
        case 'RSI':
          indicators.RSI = this.calculateRSI(klineData, params)
          break
        case 'KDJ':
          indicators.KDJ = this.calculateKDJ(klineData, params)
          break
        case 'BOLL':
          indicators.BOLL = this.calculateBOLL(klineData, params)
          break
        case 'VOL':
          indicators.VOL = this.calculateVOL(klineData, params)
          break
        default:
          console.warn(`不支持的指标类型: ${type}`)
      }
    }

    return indicators
  }

  calculateMA(klineData, params) {
    const { shortPeriod = 5, longPeriod = 20 } = params
    const closes = klineData.map(d => d.close)

    const ma = (data, period) => {
      const result = []
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          result.push(null)
        } else {
          const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
          result.push(sum / period)
        }
      }
      return result
    }

    return {
      short: ma(closes, shortPeriod),
      long: ma(closes, longPeriod),
    }
  }

  calculateMACD(klineData, params) {
    const { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = params
    const closes = klineData.map(d => d.close)

    const ema = (data, period) => {
      const result = []
      const multiplier = 2 / (period + 1)
      let emaValue = data.slice(0, period).reduce((a, b) => a + b, 0) / period
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          result.push(null)
        } else if (i === period - 1) {
          result.push(emaValue)
        } else {
          emaValue = (data[i] - emaValue) * multiplier + emaValue
          result.push(emaValue)
        }
      }
      return result
    }

    const fastEMA = ema(closes, fastPeriod)
    const slowEMA = ema(closes, slowPeriod)
    const dif = fastEMA.map((v, i) => (v !== null && slowEMA[i] !== null) ? v - slowEMA[i] : null)

    const validDif = dif.filter(v => v !== null)
    const deaValues = ema(validDif, signalPeriod)

    const dea = []
    let deaIndex = 0
    for (let i = 0; i < dif.length; i++) {
      if (dif[i] === null) {
        dea.push(null)
      } else {
        dea.push(deaValues[deaIndex] || null)
        deaIndex++
      }
    }

    const macd = dif.map((v, i) => (v !== null && dea[i] !== null) ? (v - dea[i]) * 2 : null)

    return { dif, dea, macd }
  }

  calculateRSI(klineData, params) {
    const { period = 14 } = params
    const closes = klineData.map(d => d.close)

    const rsi = []
    let avgGain = 0
    let avgLoss = 0

    for (let i = 0; i < closes.length; i++) {
      if (i === 0) {
        rsi.push(null)
        continue
      }

      const change = closes[i] - closes[i - 1]
      const gain = change > 0 ? change : 0
      const loss = change < 0 ? Math.abs(change) : 0

      if (i <= period) {
        avgGain = (avgGain * (i - 1) + gain) / i
        avgLoss = (avgLoss * (i - 1) + loss) / i
        if (i === period) {
          rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
        } else {
          rsi.push(null)
        }
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period
        avgLoss = (avgLoss * (period - 1) + loss) / period
        rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
      }
    }

    return { values: rsi }
  }

  calculateKDJ(klineData, params) {
    const { n = 9, m1 = 3, m2 = 3 } = params
    const closes = klineData.map(d => d.close)
    const highs = klineData.map(d => d.high)
    const lows = klineData.map(d => d.low)

    const rsv = []
    for (let i = 0; i < closes.length; i++) {
      if (i < n - 1) {
        rsv.push(null)
      } else {
        const highest = Math.max(...highs.slice(i - n + 1, i + 1))
        const lowest = Math.min(...lows.slice(i - n + 1, i + 1))
        rsv.push(highest === lowest ? 50 : ((closes[i] - lowest) / (highest - lowest)) * 100)
      }
    }

    const k = []
    const d = []
    let kValue = 50
    let dValue = 50

    for (let i = 0; i < rsv.length; i++) {
      if (rsv[i] === null) {
        k.push(null)
        d.push(null)
      } else {
        kValue = ((m1 - 1) * kValue + rsv[i]) / m1
        dValue = ((m2 - 1) * dValue + kValue) / m2
        k.push(kValue)
        d.push(dValue)
      }
    }

    const j = k.map((v, i) => (v !== null && d[i] !== null) ? 3 * v - 2 * d[i] : null)

    return { k, d, j }
  }

  calculateBOLL(klineData, params) {
    const { period = 20, stdDevMultiplier = 2 } = params
    const closes = klineData.map(d => d.close)

    const middle = []
    const upper = []
    const lower = []

    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        middle.push(null)
        upper.push(null)
        lower.push(null)
      } else {
        const slice = closes.slice(i - period + 1, i + 1)
        const mean = slice.reduce((a, b) => a + b, 0) / period
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period
        const stdDev = Math.sqrt(variance)

        middle.push(mean)
        upper.push(mean + stdDevMultiplier * stdDev)
        lower.push(mean - stdDevMultiplier * stdDev)
      }
    }

    return { middle, upper, lower }
  }

  calculateVOL(klineData, params) {
    const { maPeriod = 5 } = params
    const volumes = klineData.map(d => d.volume)

    const maVol = []
    for (let i = 0; i < volumes.length; i++) {
      if (i < maPeriod - 1) {
        maVol.push(null)
      } else {
        const sum = volumes.slice(i - maPeriod + 1, i + 1).reduce((a, b) => a + b, 0)
        maVol.push(sum / maPeriod)
      }
    }

    return { values: volumes, maVol }
  }

  checkBuyConditions(indicators, index, conditions, klineData) {
    return this.evaluateConditions(indicators, index, conditions, klineData, 'BUY')
  }

  checkSellConditions(indicators, index, conditions, klineData) {
    return this.evaluateConditions(indicators, index, conditions, klineData, 'SELL')
  }

  evaluateConditions(indicators, index, conditions, klineData, direction) {
    if (!conditions || !conditions.conditions || conditions.conditions.length === 0) {
      return null
    }

    const logic = conditions.logic || 'AND'
    const results = conditions.conditions.map(c => this.evaluateSingleCondition(indicators, index, c, klineData))

    if (logic === 'AND') {
      const allTrue = results.every(r => r)
      return allTrue ? { reason: this.getConditionReason(conditions, direction) } : null
    } else if (logic === 'OR') {
      const anyTrue = results.some(r => r)
      return anyTrue ? { reason: this.getConditionReason(conditions, direction) } : null
    }

    return null
  }

  evaluateSingleCondition(indicators, index, condition, klineData) {
    try {
      const sourceValue = this.getSourceValue(indicators, index, condition, klineData)
      if (sourceValue === null) return false

      const compareValue = this.getCompareValue(indicators, index, condition, klineData)
      if (compareValue === null) return false

      return this.compareValues(sourceValue, condition.operator, compareValue, condition, index, indicators, klineData)
    } catch {
      return false
    }
  }

  getSourceValue(indicators, index, condition, klineData) {
    const { source, sourceField } = condition

    if (!source || !sourceField) return null

    switch (source) {
      case 'PRICE':
        return this.getPriceValue(sourceField, index, klineData)
      case 'VOLUME':
        if (sourceField === 'VALUE') return klineData[index]?.volume || null
        return null
      case 'INDICATOR':
        return this.getIndicatorValue(indicators, sourceField, index)
      default:
        return null
    }
  }

  getPriceValue(field, index, klineData) {
    const candle = klineData[index]
    if (!candle) return null
    switch (field) {
      case 'CLOSE': return candle.close
      case 'OPEN': return candle.open
      case 'HIGH': return candle.high
      case 'LOW': return candle.low
      default: return candle.close
    }
  }

  getIndicatorValue(indicators, sourceField, index) {
    if (!indicators) return null

    for (const [indType, indData] of Object.entries(indicators)) {
      if (indData === null) continue

      const fieldMap = {
        MACD: { DIF: 'dif', DEA: 'dea', MACD: 'macd' },
        RSI: { VALUE: 'values' },
        KDJ: { K: 'k', D: 'd', J: 'j' },
        BOLL: { UPPER: 'upper', MIDDLE: 'middle', LOWER: 'lower' },
        MA: { SHORT: 'short', LONG: 'long' },
        VOL: { VALUE: 'values', MA_VOL: 'maVol' },
      }

      const map = fieldMap[indType]
      if (map && map[sourceField]) {
        const key = map[sourceField]
        return indData[key]?.[index] || null
      }
    }

    return null
  }

  getCompareValue(indicators, index, condition, klineData) {
    const { compareType, compareValue, compareIndicator, compareField, field1, field2 } = condition

    switch (compareType) {
      case 'FIXED_VALUE':
        return compareValue !== undefined ? compareValue : null

      case 'PREVIOUS_DAYS':
      case 'PREVIOUS_WEEKS':
      case 'PREVIOUS_MONTHS': {
        const n = compareValue || 1
        let daysToLookBack = n
        if (compareType === 'PREVIOUS_WEEKS') daysToLookBack = n * 5
        if (compareType === 'PREVIOUS_MONTHS') daysToLookBack = n * 20
        const prevIndex = index - daysToLookBack
        if (prevIndex < 0) return null
        return this.getSourceValue(indicators, prevIndex, condition, klineData)
      }

      case 'INDICATOR_FIELD':
        if (!compareIndicator || !compareField) return null
        return this.getIndicatorValueByName(indicators, compareIndicator, compareField, index)

      case 'INDICATOR_CROSS':
        return null

      default:
        return null
    }
  }

  getIndicatorValueByName(indicators, indicatorType, field, index) {
    if (!indicators) return null

    const typeUpper = indicatorType.toUpperCase()
    const indData = indicators[typeUpper]
    if (!indData) return null

    const fieldMap = {
      MACD: { DIF: 'dif', DEA: 'dea', MACD: 'macd' },
      RSI: { VALUE: 'values' },
      KDJ: { K: 'k', D: 'd', J: 'j' },
      BOLL: { UPPER: 'upper', MIDDLE: 'middle', LOWER: 'lower' },
      MA: { SHORT: 'short', LONG: 'long' },
      VOL: { VALUE: 'values', MA_VOL: 'maVol' },
    }

    const map = fieldMap[typeUpper]
    if (map && map[field]) {
      const key = map[field]
      return indData[key]?.[index] || null
    }

    return null
  }

  compareValues(sourceValue, operator, compareValue, condition, index, indicators, klineData) {
    if (operator === 'CROSS_ABOVE' || operator === 'CROSS_BELOW') {
      return this.checkCross(indicators, index, condition, operator, klineData)
    }

    if (sourceValue === null || compareValue === null) return false

    switch (operator) {
      case 'GREATER_THAN': return sourceValue > compareValue
      case 'LESS_THAN': return sourceValue < compareValue
      case 'EQUAL': return Math.abs(sourceValue - compareValue) < 0.0001
      default: return false
    }
  }

  checkCross(indicators, index, condition, operator, klineData) {
    if (index < 1) return false

    const prevIndex = index - 1

    if (condition.compareType === 'INDICATOR_CROSS') {
      const { compareIndicator, field1, field2 } = condition
      if (!compareIndicator || !field1 || !field2) return false

      const v1_curr = this.getIndicatorValueByName(indicators, compareIndicator, field1, index)
      const v2_curr = this.getIndicatorValueByName(indicators, compareIndicator, field2, index)
      const v1_prev = this.getIndicatorValueByName(indicators, compareIndicator, field1, prevIndex)
      const v2_prev = this.getIndicatorValueByName(indicators, compareIndicator, field2, prevIndex)

      if (v1_curr === null || v2_curr === null || v1_prev === null || v2_prev === null) return false

      if (operator === 'CROSS_ABOVE') {
        return v1_prev <= v2_prev && v1_curr > v2_curr
      } else {
        return v1_prev >= v2_prev && v1_curr < v2_curr
      }
    }

    return false
  }

  getConditionReason(conditions, direction) {
    const count = conditions.conditions?.length || 0
    return direction === 'BUY' ? `买入信号 (${count}个条件)` : `卖出信号 (${count}个条件)`
  }
}
