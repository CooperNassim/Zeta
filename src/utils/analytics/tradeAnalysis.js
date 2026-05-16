// 交易分析工具函数 - 数据处理和计算

export function calculateCorrelation(x, y) {
  const n = Math.min(x.length, y.length)
  if (n === 0) return 0
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumX2 += x[i] * x[i]
    sumY2 += y[i] * y[i]
  }
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  return denominator === 0 ? 0 : numerator / denominator
}

export function groupBy(trades, keyFn) {
  const groups = {}
  for (const t of trades) {
    const key = keyFn(t)
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  return groups
}

export function groupByDate(trades) {
  return groupBy(trades, t => {
    if (!t.buyTime) return '未知'
    const d = new Date(t.buyTime)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

export function groupByWeekday(trades) {
  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return groupBy(trades, t => {
    if (!t.buyTime) return '未知'
    return weekdayNames[new Date(t.buyTime).getDay()]
  })
}

export function groupByMonth(trades) {
  return groupBy(trades, t => {
    if (!t.buyTime) return '未知'
    const d = new Date(t.buyTime)
    return `${d.getFullYear()}年${d.getMonth() + 1}月`
  })
}

export function groupByHoldingRange(trades) {
  return groupBy(trades, t => {
    const days = t.holdDuration || 0
    if (days <= 1) return '当日'
    if (days <= 3) return '1-3天'
    if (days <= 7) return '4-7天'
    if (days <= 15) return '8-15天'
    if (days <= 30) return '16-30天'
    return '30天以上'
  })
}

export function calcGroupStats(groupedTrades) {
  const stats = {}
  for (const [key, trades] of Object.entries(groupedTrades)) {
    const profits = trades.map(t => t.netProfit || 0)
    const winTrades = trades.filter(t => (t.netProfit || 0) > 0)
    const holdDurations = trades.map(t => t.holdDuration || 0).filter(d => d > 0)
    
    stats[key] = {
      count: trades.length,
      winCount: winTrades.length,
      loseCount: trades.length - winTrades.length,
      winRate: trades.length > 0 ? (winTrades.length / trades.length * 100) : 0,
      totalProfit: profits.reduce((a, b) => a + b, 0),
      avgProfit: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
      maxProfit: profits.length > 0 ? Math.max(...profits) : 0,
      minProfit: profits.length > 0 ? Math.min(...profits) : 0,
      avgHoldingDays: holdDurations.length > 0 ? holdDurations.reduce((a, b) => a + b, 0) / holdDurations.length : 0,
    }
  }
  return stats
}

export function calcOverallStats(trades) {
  if (!trades || trades.length === 0) return null
  
  const profits = trades.map(t => t.netProfit || 0)
  const winTrades = trades.filter(t => (t.netProfit || 0) > 0)
  const loseTrades = trades.filter(t => (t.netProfit || 0) < 0)
  
  const totalProfit = profits.reduce((a, b) => a + b, 0)
  const avgWin = winTrades.length > 0 ? winTrades.reduce((a, t) => a + (t.netProfit || 0), 0) / winTrades.length : 0
  const avgLoss = loseTrades.length > 0 ? loseTrades.reduce((a, t) => a + (t.netProfit || 0), 0) / loseTrades.length : 0
  
  let maxDrawdown = 0
  let peak = 0
  let cumulative = 0
  for (const p of profits) {
    cumulative += p
    if (cumulative > peak) peak = cumulative
    const dd = peak - cumulative
    if (dd > maxDrawdown) maxDrawdown = dd
  }
  
  const holdDurations = trades.map(t => t.holdDuration || 0).filter(d => d > 0)
  
  return {
    totalTrades: trades.length,
    winTrades: winTrades.length,
    loseTrades: loseTrades.length,
    winRate: winTrades.length / trades.length * 100,
    totalProfit,
    avgProfit: totalProfit / trades.length,
    avgWin,
    avgLoss: Math.abs(avgLoss),
    profitLossRatio: avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0,
    maxDrawdown,
    maxProfit: Math.max(...profits),
    minProfit: Math.min(...profits),
    avgHoldingDays: holdDurations.length > 0 ? holdDurations.reduce((a, b) => a + b, 0) / holdDurations.length : 0,
    totalFees: trades.reduce((a, t) => a + (t.tradeCommission || 0) + (t.sellTradeCommission || 0) + (t.otherFees || 0) + (t.sellOtherFees || 0), 0),
  }
}

export function calcPsychImpact(trades, psychResults) {
  const impact = {}
  for (const t of trades) {
    const psych = psychResults?.find(p => {
      const psychDate = new Date(p.date)
      const tradeDate = new Date(t.buyTime)
      return psychDate.toDateString() === tradeDate.toDateString()
    })
    
    if (!psych) continue
    
    const score = psych.overallScore || 0
    const profit = t.netProfit || 0
    if (!impact[score]) impact[score] = { profits: [], count: 0 }
    impact[score].profits.push(profit)
    impact[score].count++
  }
  
  const result = []
  for (const [score, data] of Object.entries(impact)) {
    const profits = data.profits
    result.push({
      score: parseInt(score),
      count: data.count,
      avgProfit: profits.reduce((a, b) => a + b, 0) / profits.length,
      winRate: profits.filter(p => p > 0).length / profits.length * 100,
      totalProfit: profits.reduce((a, b) => a + b, 0),
    })
  }
  
  return result.sort((a, b) => a.score - b.score)
}

export function calcPsychIndicatorImpact(trades, psychResults) {
  const indicators = [
    { key: '0', name: '身体状态' },
    { key: '1', name: '昨日交易' },
    { key: '2', name: '计划完成' },
    { key: '3', name: '情绪状态' },
    { key: '4', name: '工作量' },
  ]
  
  const impact = indicators.map(ind => {
    const scores = {}
    for (const t of trades) {
      const psych = psychResults?.find(p => {
        const psychDate = new Date(p.date)
        const tradeDate = new Date(t.buyTime)
        return psychDate.toDateString() === tradeDate.toDateString()
      })
      
      if (!psych || !psych.scores) continue
      
      const score = psych.scores[ind.key] || 0
      const profit = t.netProfit || 0
      if (!scores[score]) scores[score] = []
      scores[score].push(profit)
    }
    
    const correlations = []
    for (const [s, profits] of Object.entries(scores)) {
      const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length
      correlations.push({ score: parseInt(s), avgProfit })
    }
    
    correlations.sort((a, b) => a.score - b.score)
    
    const x = correlations.map(c => c.score)
    const y = correlations.map(c => c.avgProfit)
    const correlation = calculateCorrelation(x, y)
    
    return {
      ...ind,
      correlation,
      details: correlations,
    }
  })
  
  return impact.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
}

export function calcStrategyImpact(trades, strategies) {
  const strategyMap = {}
  if (strategies) {
    for (const s of strategies) {
      strategyMap[s.id] = s.name || `策略${s.id}`
    }
  }
  
  const groups = groupBy(trades, t => {
    const sid = t.buyStrategyId || t.strategyId
    return strategyMap[sid] || `未知策略(${sid || '无'})`
  })
  
  return calcGroupStats(groups)
}

export function calcSymbolRanking(trades) {
  const groups = groupBy(trades, t => `${t.symbol || '未知'} ${t.name || ''}`)
  const stats = calcGroupStats(groups)
  
  return Object.entries(stats)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.totalProfit - a.totalProfit)
}

export function calcConsecutiveStreak(trades) {
  if (!trades || trades.length === 0) return { maxWin: 0, maxLose: 0, currentStreak: 0, isWin: true }
  
  const sorted = [...trades].sort((a, b) => new Date(a.buyTime || 0) - new Date(b.buyTime || 0))
  
  let maxWin = 0, maxLose = 0, currentWin = 0, currentLose = 0
  let lastWasWin = null
  
  for (const t of sorted) {
    const isWin = (t.netProfit || 0) > 0
    if (isWin) {
      currentWin++
      currentLose = 0
      maxWin = Math.max(maxWin, currentWin)
    } else {
      currentLose++
      currentWin = 0
      maxLose = Math.max(maxLose, currentLose)
    }
    lastWasWin = isWin
  }
  
  return {
    maxWin,
    maxLose,
    currentStreak: lastWasWin ? currentWin : currentLose,
    isWin: lastWasWin,
  }
}

export function calcSentimentImpact(trades, dailyWorkData) {
  const groups = {
    '乐观': [],
    '中性': [],
    '悲观': [],
  }
  
  for (const t of trades) {
    const tradeDate = new Date(t.buyTime)
    const dw = dailyWorkData?.find(d => {
      const dwDate = new Date(d.date)
      return dwDate.toDateString() === tradeDate.toDateString()
    })
    
    const sentiment = dw?.sentiment || '中性'
    if (!groups[sentiment]) groups[sentiment] = []
    groups[sentiment].push(t)
  }
  
  return calcGroupStats(groups)
}

export function calcPositionSizeImpact(trades) {
  const groups = {
    '轻仓(<1万)': [],
    '中仓(1-5万)': [],
    '重仓(5-10万)': [],
    '超重仓(>10万)': [],
  }
  
  for (const t of trades) {
    const amount = t.buyAmount || Math.abs(t.profit || 0)
    if (amount < 10000) groups['轻仓(<1万)'].push(t)
    else if (amount < 50000) groups['中仓(1-5万)'].push(t)
    else if (amount < 100000) groups['重仓(5-10万)'].push(t)
    else groups['超重仓(>10万)'].push(t)
  }
  
  return calcGroupStats(groups)
}

export function calcMonthlyProfitMatrix(trades) {
  const months = groupByMonth(trades)
  const years = new Set()
  for (const t of trades) {
    if (t.buyTime) years.add(new Date(t.buyTime).getFullYear())
  }
  
  const yearList = [...years].sort()
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  
  const matrix = []
  for (const y of yearList) {
    const row = { year: y }
    for (let m = 0; m < 12; m++) {
      const key = `${y}年${m + 1}月`
      const monthTrades = months[key] || []
      row[monthNames[m]] = monthTrades.reduce((a, t) => a + (t.netProfit || 0), 0)
    }
    matrix.push(row)
  }
  
  return { matrix, monthNames }
}

export function calcEquityCurve(trades) {
  if (!trades || trades.length === 0) return []
  
  const sorted = [...trades].sort((a, b) => new Date(a.buyTime || 0) - new Date(b.buyTime || 0))
  let cumulative = 0
  const curve = []
  
  for (const t of sorted) {
    cumulative += t.netProfit || 0
    curve.push({
      date: t.buyTime || t.sellTime || '',
      profit: cumulative,
      tradeProfit: t.netProfit || 0,
    })
  }
  
  return curve
}

export function calcProfitDistribution(trades) {
  if (!trades || trades.length === 0) return []
  
  const profits = trades.map(t => t.netProfit || 0)
  const min = Math.floor(Math.min(...profits) / 1000) * 1000
  const max = Math.ceil(Math.max(...profits) / 1000) * 1000
  
  const bins = {}
  for (let i = min; i <= max; i += 1000) {
    bins[i] = 0
  }
  
  for (const p of profits) {
    const bin = Math.floor(p / 1000) * 1000
    if (bins[bin] !== undefined) bins[bin]++
    else bins[bin] = 1
  }
  
  return Object.entries(bins)
    .map(([range, count]) => ({ range: parseInt(range), count }))
    .sort((a, b) => a.range - b.range)
}

export function calcStopLossHitRate(trades) {
  let stopLossSet = 0, stopLossHit = 0
  let takeProfitSet = 0, takeProfitHit = 0
  
  for (const t of trades) {
    if (t.stopLossPrice) {
      stopLossSet++
      if (t.actualSellPrice && t.actualSellPrice <= t.stopLossPrice) {
        stopLossHit++
      }
    }
    if (t.takeProfitPrice) {
      takeProfitSet++
      if (t.actualSellPrice && t.actualSellPrice >= t.takeProfitPrice) {
        takeProfitHit++
      }
    }
  }
  
  return {
    stopLossSet,
    stopLossHit,
    stopLossRate: stopLossSet > 0 ? stopLossHit / stopLossSet * 100 : 0,
    takeProfitSet,
    takeProfitHit,
    takeProfitRate: takeProfitSet > 0 ? takeProfitHit / takeProfitSet * 100 : 0,
  }
}

export function calcTradeQuality(trades) {
  const stats = calcOverallStats(trades)
  if (!stats) return null
  
  const gradeCount = { A: 0, B: 0, C: 0, D: 0 }
  for (const t of trades) {
    if (t.buyGrade) gradeCount[t.buyGrade] = (gradeCount[t.buyGrade] || 0) + 1
  }
  
  const streak = calcConsecutiveStreak(trades)
  const slippages = trades.map(t => Math.abs(t.slippage || 0)).filter(s => s > 0)
  
  return {
    ...stats,
    gradeCount,
    streak,
    avgSlippage: slippages.length > 0 ? slippages.reduce((a, b) => a + b, 0) / slippages.length : 0,
    maxSlippage: slippages.length > 0 ? Math.max(...slippages) : 0,
  }
}

export function calcHoldingRangeStats(trades) {
  const grouped = groupByHoldingRange(trades)
  const stats = calcGroupStats(grouped)
  
  const ordered = ['当日', '1-3天', '4-7天', '8-15天', '16-30天', '30天以上']
  return ordered
    .filter(key => stats[key])
    .map(key => ({ range: key, ...stats[key] }))
}

export function calcWeeklyEffect(trades) {
  const grouped = groupByWeekday(trades)
  const stats = calcGroupStats(grouped)
  
  const ordered = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return ordered
    .filter(key => stats[key])
    .map(key => ({ weekday: key, ...stats[key] }))
}
