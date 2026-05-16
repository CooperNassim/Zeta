// 回测引擎入口 - 协调各模块完成回测

import { DataLoader } from './DataLoader'
import { SignalGenerator } from './SignalGenerator'
import { OrderExecutor } from './OrderExecutor'
import { PerformanceCalculator } from './PerformanceCalculator'
import { ParameterOptimizer } from './ParameterOptimizer'

export class BacktestEngine {
  constructor() {
    this.dataLoader = new DataLoader()
    this.signalGenerator = new SignalGenerator()
    this.orderExecutor = new OrderExecutor()
  }

  async run(klineData, config) {
    const startTime = performance.now()

    try {
      // 1. 验证数据
      if (!klineData || klineData.length === 0) {
        throw new Error('无回测数据')
      }

      this.dataLoader.validateMinimumData(klineData, 30)

      // 2. 生成信号
      const signals = this.signalGenerator.generate(klineData, {
        indicators: config.indicators || [],
        buyConditions: config.buyConditions || { conditions: [] },
        sellConditions: config.sellConditions || { conditions: [] },
      })

      // 3. 执行交易
      const executionResult = this.orderExecutor.execute(signals, klineData, {
        initialCapital: config.initialCapital || 100000,
        commissionRate: config.commissionRate || 0.0003,
        stopLoss: config.stopLoss,
        takeProfit: config.takeProfit,
        positionSizing: config.positionSizing || { mode: 'FIXED_AMOUNT', params: { amount: 10000 } },
      })

      // 4. 计算绩效
      const performance = PerformanceCalculator.calculate(
        executionResult.trades,
        executionResult.equityCurve,
        config.initialCapital || 100000
      )

      // 5. 计算回撤曲线
      const drawdownCurve = PerformanceCalculator.calculateDrawdownCurve(executionResult.equityCurve)

      const endTime = performance.now()
      const runTime = (endTime - startTime) / 1000

      return {
        success: true,
        trades: executionResult.trades,
        equityCurve: executionResult.equityCurve,
        drawdownCurve,
        performance,
        runTime,
        signalCount: signals.length,
        buySignalCount: signals.filter(s => s.type === 'BUY').length,
        sellSignalCount: signals.filter(s => s.type === 'SELL').length,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async runMultiStock(stockCodes, startDate, endDate, config) {
    const allResults = {}

    for (const code of stockCodes) {
      try {
        const klineData = await this.dataLoader.load(code, startDate, endDate)
        const result = await this.run(klineData, { ...config, stockCode: code })
        allResults[code] = result
      } catch (error) {
        allResults[code] = { success: false, error: error.message }
      }
    }

    return allResults
  }

  createOptimizer(onProgress) {
    return new ParameterOptimizer(onProgress)
  }
}
