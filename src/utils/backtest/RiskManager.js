// 风控管理器 - 止损、止盈、仓位限制检查

export class RiskManager {
  check(position, currentPrice, entryPrice, klineData, currentIndex, config) {
    const result = { sell: false, reason: null }

    if (position <= 0) return result

    const pnl = (currentPrice - entryPrice) / entryPrice

    // 检查止损
    const stopLossResult = this.checkStopLoss(pnl, currentPrice, entryPrice, klineData, currentIndex, config)
    if (stopLossResult.triggered) {
      return { sell: true, reason: stopLossResult.reason }
    }

    // 检查止盈
    const takeProfitResult = this.checkTakeProfit(pnl, currentPrice, entryPrice, klineData, currentIndex, config)
    if (takeProfitResult.triggered) {
      return { sell: true, reason: takeProfitResult.reason }
    }

    return result
  }

  checkStopLoss(pnl, currentPrice, entryPrice, klineData, currentIndex, config) {
    const stopLoss = config.stopLoss
    if (!stopLoss || !stopLoss.type) return { triggered: false }

    switch (stopLoss.type) {
      case 'FIXED': {
        const percentage = stopLoss.params?.percentage || 5
        if (pnl <= -percentage / 100) {
          return { triggered: true, reason: `固定止损触发 (亏损 ${(-pnl * 100).toFixed(2)}% >= ${percentage}%)` }
        }
        break
      }
      case 'TRAILING': {
        const trailPercent = stopLoss.params?.trailPercent || 8
        const peakPrice = this.getPeakPrice(klineData, currentIndex)
        if (peakPrice > 0) {
          const drawdown = (peakPrice - currentPrice) / peakPrice
          if (drawdown >= trailPercent / 100) {
            return { triggered: true, reason: `移动止损触发 (回撤 ${(drawdown * 100).toFixed(2)}% >= ${trailPercent}%)` }
          }
        }
        break
      }
      case 'ATR': {
        const multiplier = stopLoss.params?.multiplier || 2
        const atr = this.calculateATR(klineData, currentIndex)
        if (atr > 0 && (entryPrice - currentPrice) >= atr * multiplier) {
          return { triggered: true, reason: `ATR止损触发 (跌幅 >= ${multiplier}倍ATR)` }
        }
        break
      }
      case 'TIME': {
        const maxDays = stopLoss.params?.maxDays || 10
        const entryIndex = this.findEntryIndex(klineData, currentIndex)
        if (entryIndex >= 0) {
          const holdingDays = currentIndex - entryIndex
          if (holdingDays > maxDays && pnl <= 0) {
            return { triggered: true, reason: `时间止损触发 (持有 ${holdingDays} 天 > ${maxDays} 天且未盈利)` }
          }
        }
        break
      }
      default:
        break
    }

    return { triggered: false }
  }

  checkTakeProfit(pnl, currentPrice, entryPrice, klineData, currentIndex, config) {
    const takeProfit = config.takeProfit
    if (!takeProfit || !takeProfit.type) return { triggered: false }

    switch (takeProfit.type) {
      case 'FIXED': {
        const percentage = takeProfit.params?.percentage || 10
        if (pnl >= percentage / 100) {
          return { triggered: true, reason: `固定止盈触发 (盈利 ${(pnl * 100).toFixed(2)}% >= ${percentage}%)` }
        }
        break
      }
      case 'TRAILING': {
        const trailPercent = takeProfit.params?.trailPercent || 5
        const peakPrice = this.getPeakPrice(klineData, currentIndex)
        if (peakPrice > 0) {
          const drawdown = (peakPrice - currentPrice) / peakPrice
          if (drawdown >= trailPercent / 100 && pnl > 0) {
            return { triggered: true, reason: `跟踪止盈触发 (从峰值回撤 ${(drawdown * 100).toFixed(2)}% >= ${trailPercent}%)` }
          }
        }
        break
      }
      default:
        break
    }

    return { triggered: false }
  }

  getPeakPrice(klineData, currentIndex) {
    let peak = 0
    for (let i = 0; i <= currentIndex; i++) {
      if (klineData[i].high > peak) peak = klineData[i].high
    }
    return peak
  }

  calculateATR(klineData, index, period = 14) {
    if (index < period) return 0

    let atr = 0
    for (let i = index - period + 1; i <= index; i++) {
      const high = klineData[i].high
      const low = klineData[i].low
      const prevClose = klineData[i - 1]?.close || klineData[i].close
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose))
      atr += tr
    }
    return atr / period
  }

  findEntryIndex(klineData, currentIndex) {
    return currentIndex - 1
  }
}
