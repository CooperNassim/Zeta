// 绩效计算器 - 计算回测结果的各项指标

export class PerformanceCalculator {
  static calculate(trades, equityCurve, initialCapital) {
    if (!trades || trades.length === 0 || !equityCurve || equityCurve.length === 0) {
      return this.emptyResult()
    }

    const totalReturn = this.calculateTotalReturn(equityCurve, initialCapital)
    const annualReturn = this.calculateAnnualReturn(equityCurve, initialCapital)
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve)
    const sharpeRatio = this.calculateSharpeRatio(equityCurve, annualReturn)
    const winRate = this.calculateWinRate(trades)
    const profitLossRatio = this.calculateProfitLossRatio(trades)
    const totalTrades = trades.filter(t => t.type === 'BUY').length
    const avgHoldingDays = this.calculateAvgHoldingDays(trades)
    const calmarRatio = maxDrawdown !== 0 ? annualReturn / Math.abs(maxDrawdown / 100) : 0
    const sortinoRatio = this.calculateSortinoRatio(equityCurve, annualReturn)
    const maxConsecutiveLosses = this.calculateMaxConsecutiveLosses(trades)
    const maxConsecutiveWins = this.calculateMaxConsecutiveWins(trades)
    const profitFactor = this.calculateProfitFactor(trades)
    const expectancy = this.calculateExpectancy(trades)

    return {
      totalReturn,
      annualReturn,
      maxDrawdown,
      sharpeRatio,
      winRate,
      profitLossRatio,
      totalTrades,
      avgHoldingDays,
      calmarRatio,
      sortinoRatio,
      maxConsecutiveLosses,
      maxConsecutiveWins,
      profitFactor,
      expectancy,
    }
  }

  static calculateTotalReturn(equityCurve, initialCapital) {
    const finalEquity = equityCurve[equityCurve.length - 1]?.equity || initialCapital
    return ((finalEquity - initialCapital) / initialCapital) * 100
  }

  static calculateAnnualReturn(equityCurve, initialCapital) {
    const finalEquity = equityCurve[equityCurve.length - 1]?.equity || initialCapital
    const startDate = new Date(equityCurve[0]?.date)
    const endDate = new Date(equityCurve[equityCurve.length - 1]?.date)
    const days = (endDate - startDate) / (1000 * 60 * 60 * 24)

    if (days <= 0) return 0

    const annualReturn = (Math.pow(finalEquity / initialCapital, 365 / days) - 1) * 100
    return annualReturn
  }

  static calculateMaxDrawdown(equityCurve) {
    let peak = 0
    let maxDrawdown = 0

    const drawdownCurve = equityCurve.map(point => {
      if (point.equity > peak) peak = point.equity
      const drawdown = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
      return {
        date: point.date,
        drawdown: -drawdown,
        peak,
        isMaxDrawdown: Math.abs(drawdown - maxDrawdown) < 0.001,
      }
    })

    return maxDrawdown
  }

  static calculateDrawdownCurve(equityCurve) {
    let peak = 0
    let maxDrawdown = 0

    return equityCurve.map(point => {
      if (point.equity > peak) peak = point.equity
      const drawdown = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
      return {
        date: point.date,
        drawdown: -drawdown,
        peak,
        isMaxDrawdown: Math.abs(drawdown - maxDrawdown) < 0.001,
      }
    })
  }

  static calculateSharpeRatio(equityCurve, annualReturn, riskFreeRate = 0.03) {
    const dailyReturns = this.calculateDailyReturns(equityCurve)
    if (dailyReturns.length === 0) return 0

    const stdDev = this.calculateStandardDeviation(dailyReturns)
    if (stdDev === 0) return 0

    const annualizedStdDev = stdDev * Math.sqrt(252)
    return (annualReturn / 100 - riskFreeRate) / annualizedStdDev
  }

  static calculateSortinoRatio(equityCurve, annualReturn, riskFreeRate = 0.03) {
    const dailyReturns = this.calculateDailyReturns(equityCurve)
    if (dailyReturns.length === 0) return 0

    const downsideReturns = dailyReturns.filter(r => r < 0)
    if (downsideReturns.length === 0) return 0

    const downsideVariance = downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length
    const downsideStdDev = Math.sqrt(downsideVariance) * Math.sqrt(252)

    if (downsideStdDev === 0) return 0

    return (annualReturn / 100 - riskFreeRate) / downsideStdDev
  }

  static calculateWinRate(trades) {
    const sellTrades = trades.filter(t => t.type === 'SELL')
    if (sellTrades.length === 0) return 0

    const winningTrades = sellTrades.filter(t => t.pnl > 0).length
    return (winningTrades / sellTrades.length) * 100
  }

  static calculateProfitLossRatio(trades) {
    const sellTrades = trades.filter(t => t.type === 'SELL')
    if (sellTrades.length === 0) return 0

    const wins = sellTrades.filter(t => t.pnl > 0).map(t => t.pnl)
    const losses = sellTrades.filter(t => t.pnl < 0).map(t => Math.abs(t.pnl))

    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 1

    return avgLoss === 0 ? 0 : avgWin / avgLoss
  }

  static calculateAvgHoldingDays(trades) {
    const sellTrades = trades.filter(t => t.type === 'SELL' && t.holdingDays !== undefined)
    if (sellTrades.length === 0) return 0

    return sellTrades.reduce((sum, t) => sum + t.holdingDays, 0) / sellTrades.length
  }

  static calculateMaxConsecutiveLosses(trades) {
    const sellTrades = trades.filter(t => t.type === 'SELL')
    let maxConsecutive = 0
    let currentConsecutive = 0

    for (const trade of sellTrades) {
      if (trade.pnl < 0) {
        currentConsecutive++
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
      } else {
        currentConsecutive = 0
      }
    }

    return maxConsecutive
  }

  static calculateMaxConsecutiveWins(trades) {
    const sellTrades = trades.filter(t => t.type === 'SELL')
    let maxConsecutive = 0
    let currentConsecutive = 0

    for (const trade of sellTrades) {
      if (trade.pnl > 0) {
        currentConsecutive++
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
      } else {
        currentConsecutive = 0
      }
    }

    return maxConsecutive
  }

  static calculateProfitFactor(trades) {
    const sellTrades = trades.filter(t => t.type === 'SELL')
    if (sellTrades.length === 0) return 0

    const grossProfit = sellTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0)
    const grossLoss = Math.abs(sellTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0))

    return grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss
  }

  static calculateExpectancy(trades) {
    const sellTrades = trades.filter(t => t.type === 'SELL')
    if (sellTrades.length === 0) return 0

    const totalPnL = sellTrades.reduce((sum, t) => sum + t.pnl, 0)
    return totalPnL / sellTrades.length
  }

  static calculateDailyReturns(equityCurve) {
    const returns = []
    for (let i = 1; i < equityCurve.length; i++) {
      const prev = equityCurve[i - 1].equity
      const curr = equityCurve[i].equity
      if (prev > 0) {
        returns.push((curr - prev) / prev)
      }
    }
    return returns
  }

  static calculateStandardDeviation(values) {
    if (values.length === 0) return 0

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  static emptyResult() {
    return {
      totalReturn: 0,
      annualReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
      profitLossRatio: 0,
      totalTrades: 0,
      avgHoldingDays: 0,
      calmarRatio: 0,
      sortinoRatio: 0,
      maxConsecutiveLosses: 0,
      maxConsecutiveWins: 0,
      profitFactor: 0,
      expectancy: 0,
    }
  }
}
