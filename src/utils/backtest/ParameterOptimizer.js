// 参数优化器 - 遍历参数组合，找出最优参数

import { BacktestEngine } from './BacktestEngine'

export class ParameterOptimizer {
  constructor(onProgress) {
    this.onProgress = onProgress || (() => {})
    this.engine = new BacktestEngine()
  }

  async optimize(config, paramRanges, targetMetric) {
    const combinations = this.generateCombinations(paramRanges)
    const total = combinations.length
    const results = []

    for (let i = 0; i < combinations.length; i++) {
      const params = combinations[i]
      const backtestConfig = {
        ...config,
        indicators: this.mergeParams(config.indicators, params),
        stopLoss: config.stopLoss ? { ...config.stopLoss, params: { ...config.stopLoss.params, ...this.extractStopLossParams(params) } } : null,
        takeProfit: config.takeProfit ? { ...config.takeProfit, params: { ...config.takeProfit.params, ...this.extractTakeProfitParams(params) } } : null,
      }

      try {
        const result = await this.engine.run(config.klineData, backtestConfig)
        const performance = result.performance

        results.push({
          params: { ...params },
          performance: { ...performance },
          [targetMetric]: performance[targetMetric] || 0,
        })
      } catch (error) {
        console.error(`参数组合 ${i + 1}/${total} 回测失败:`, error)
      }

      this.onProgress((i + 1) / total * 100)
    }

    results.sort((a, b) => b[targetMetric] - a[targetMetric])

    return {
      combinations: results,
      best: results[0] || null,
      targetMetric,
      totalCombinations: total,
      successCount: results.length,
    }
  }

  generateCombinations(paramRanges) {
    const keys = Object.keys(paramRanges)
    if (keys.length === 0) return [{}]

    const combinations = []

    const generate = (current, index) => {
      if (index === keys.length) {
        combinations.push({ ...current })
        return
      }

      const key = keys[index]
      const range = paramRanges[key]

      if (typeof range === 'number') {
        current[key] = range
        generate(current, index + 1)
      } else if (Array.isArray(range)) {
        for (const value of range) {
          current[key] = value
          generate({ ...current }, index + 1)
        }
      } else if (range.min !== undefined && range.max !== undefined) {
        const step = range.step || 1
        for (let value = range.min; value <= range.max; value += step) {
          current[key] = value
          generate({ ...current }, index + 1)
        }
      }
    }

    generate({}, 0)
    return combinations
  }

  mergeParams(indicators, params) {
    if (!indicators) return indicators

    return indicators.map(ind => {
      const merged = { ...ind }
      if (ind.params) {
        merged.params = { ...ind.params }
        for (const key of Object.keys(params)) {
          if (ind.params[key] !== undefined) {
            merged.params[key] = params[key]
          }
        }
      }
      return merged
    })
  }

  extractStopLossParams(params) {
    const stopLossKeys = ['percentage', 'trailPercent', 'multiplier', 'maxDays']
    const result = {}
    for (const key of stopLossKeys) {
      if (params[key] !== undefined) {
        result[key] = params[key]
      }
    }
    return result
  }

  extractTakeProfitParams(params) {
    const takeProfitKeys = ['percentage', 'trailPercent']
    const result = {}
    for (const key of takeProfitKeys) {
      if (params[key] !== undefined) {
        result[key] = params[key]
      }
    }
    return result
  }
}
