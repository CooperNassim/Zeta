// 订单执行器 - 根据信号执行交易，计算持仓和资金变化

import { RiskManager } from './RiskManager'

export class OrderExecutor {
  constructor() {
    this.riskManager = new RiskManager()
  }

  execute(signals, klineData, config) {
    const { initialCapital = 100000, commissionRate = 0.0003 } = config

    let cash = initialCapital
    let position = 0
    let entryPrice = 0
    let entryIndex = 0
    let peakPrice = 0

    const trades = []
    const equityCurve = []

    let signalIndex = 0

    for (let i = 0; i < klineData.length; i++) {
      const price = klineData[i].close
      if (price <= 0) continue

      if (i === 0 || price > peakPrice) {
        peakPrice = price
      }

      // 收集当前所有信号
      const currentSignals = []
      while (signalIndex < signals.length && signals[signalIndex].index <= i) {
        if (signals[signalIndex].index === i) {
          currentSignals.push(signals[signalIndex])
        }
        signalIndex++
      }

      // 检查风控
      const riskAction = this.riskManager.check(position, price, entryPrice, klineData, i, {
        stopLoss: config.stopLoss,
        takeProfit: config.takeProfit,
      })

      // 处理卖出信号（包括风控触发的卖出）
      if ((currentSignals.some(s => s.type === 'SELL') || riskAction.sell) && position > 0) {
        const shares = this.calculateShares(position, config)
        const revenue = shares * price * (1 - commissionRate)
        const cost = shares * entryPrice * (1 + commissionRate)
        const pnl = revenue - cost
        const holdingDays = i - entryIndex

        trades.push({
          type: 'SELL',
          price,
          shares,
          revenue,
          cost,
          pnl,
          pnlPercent: (pnl / cost) * 100,
          date: klineData[i].date,
          holdingDays,
          reason: riskAction.sell ? (riskAction.reason || '风控卖出') : '信号卖出',
        })

        cash += revenue
        position = 0
      }

      // 处理买入信号
      if (currentSignals.some(s => s.type === 'BUY') && position === 0) {
        const shares = this.calculateBuyShares(cash, price, config)
        if (shares > 0) {
          const cost = shares * price * (1 + commissionRate)
          if (cost <= cash) {
            cash -= cost
            position = shares
            entryPrice = price
            entryIndex = i
            peakPrice = price

            trades.push({
              type: 'BUY',
              price,
              shares,
              cost,
              date: klineData[i].date,
              reason: currentSignals.find(s => s.type === 'BUY')?.reason || '信号买入',
            })
          }
        }
      }

      // 记录资金曲线
      const equity = cash + position * price
      equityCurve.push({
        date: klineData[i].date,
        equity,
        cash,
        positionValue: position * price,
        shares: position,
        return: ((equity - initialCapital) / initialCapital) * 100,
      })
    }

    return { trades, equityCurve, finalCash: cash, finalPosition: position }
  }

  calculateBuyShares(cash, price, config) {
    const positionSizing = config.positionSizing || {}
    const mode = positionSizing.mode || 'FIXED_AMOUNT'
    const params = positionSizing.params || {}

    let shares = 0

    switch (mode) {
      case 'FIXED_AMOUNT': {
        const amount = params.amount || 10000
        shares = Math.floor(amount / price / 100) * 100
        break
      }
      case 'FIXED_RATIO': {
        const ratio = params.ratio || 0.5
        shares = Math.floor((cash * ratio) / price / 100) * 100
        break
      }
      case 'FIXED_SHARES': {
        shares = Math.floor((params.shares || 100) / 100) * 100
        break
      }
      case 'KELLY': {
        const winRate = params.winRate || 0.55
        const winLossRatio = params.winLossRatio || 2
        const kellyFraction = (winRate * winLossRatio - (1 - winRate)) / winLossRatio
        const safeFraction = Math.min(kellyFraction, 0.25)
        const amount = cash * Math.max(safeFraction, 0.1)
        shares = Math.floor(amount / price / 100) * 100
        break
      }
      default:
        shares = Math.floor(10000 / price / 100) * 100
    }

    return Math.max(shares, 0)
  }

  calculateShares(position, config) {
    return position
  }
}
