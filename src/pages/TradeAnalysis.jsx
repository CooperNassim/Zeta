import React, { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import {
  calcOverallStats,
  calcEquityCurve,
  calcProfitDistribution,
  calcMonthlyProfitMatrix,
  calcPsychImpact,
  calcPsychIndicatorImpact,
  calcHoldingRangeStats,
  calcWeeklyEffect,
  calcSymbolRanking,
  calcStopLossHitRate,
  calcTradeQuality,
  calcConsecutiveStreak,
  calcStrategyImpact,
  calcSentimentImpact,
  calcPositionSizeImpact,
} from '../utils/analytics/tradeAnalysis'
import { EquityCurve, MonthlyHeatmap, ProfitDistribution, HoldingScatter, formatMoney, formatPct } from '../components/analysis/DashboardCharts'
import { PsychScoreImpact, PsychIndicatorImpact, StrategyScatter, HoldingDurationStats, WeeklyEffect, StopLossAnalysis, QualityRadar } from '../components/analysis/AnalysisCharts'

// 新增的分析组件
const StrategyComparison = ({ strategies, trades }) => {
  const strategyMap = {}
  if (strategies) {
    for (const s of strategies) strategyMap[s.id] = s.name || `策略${s.id}`
  }
  
  const grouped = {}
  for (const t of trades) {
    const sid = t.buyStrategyId || t.strategyId
    const name = strategyMap[sid] || `未知策略(${sid || '无'})`
    if (!grouped[name]) grouped[name] = { trades: [], profits: [] }
    grouped[name].trades.push(t)
    grouped[name].profits.push(t.netProfit || 0)
  }
  
  const data = Object.entries(grouped).map(([name, g]) => {
    const profits = g.profits
    const wins = profits.filter(p => p > 0)
    return {
      name,
      count: g.trades.length,
      winRate: profits.length > 0 ? (wins.length / profits.length * 100) : 0,
      avgProfit: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
      totalProfit: profits.reduce((a, b) => a + b, 0),
      maxProfit: profits.length > 0 ? Math.max(...profits) : 0,
      maxLoss: profits.length > 0 ? Math.min(...profits) : 0,
    }
  }).sort((a, b) => b.totalProfit - a.totalProfit)
  
  if (data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">策略盈亏对比</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left text-gray-500 font-normal">策略</th>
              <th className="p-2 text-right text-gray-500 font-normal">笔数</th>
              <th className="p-2 text-right text-gray-500 font-normal">胜率</th>
              <th className="p-2 text-right text-gray-500 font-normal">总盈亏</th>
              <th className="p-2 text-right text-gray-500 font-normal">平均盈亏</th>
              <th className="p-2 text-right text-gray-500 font-normal">最大盈利</th>
              <th className="p-2 text-right text-gray-500 font-normal">最大亏损</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 font-medium text-gray-700">{d.name}</td>
                <td className="p-2 text-right">{d.count}</td>
                <td className="p-2 text-right text-blue-600">{d.winRate.toFixed(1)}%</td>
                <td className={`p-2 text-right font-medium ${d.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoney(d.totalProfit)}
                </td>
                <td className={`p-2 text-right ${d.avgProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatMoney(d.avgProfit)}
                </td>
                <td className="p-2 text-right text-green-600">{formatMoney(d.maxProfit)}</td>
                <td className="p-2 text-right text-red-600">{formatMoney(d.maxLoss)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 情绪影响分析
const SentimentImpact = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return null
  
  const sentiments = ['乐观', '中性', '悲观']
  const colors = { '乐观': 'bg-green-500', '中性': 'bg-yellow-500', '悲观': 'bg-red-500' }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">大盘情绪 vs 胜率</h3>
      <div className="grid grid-cols-3 gap-4">
        {sentiments.map(sent => {
          const s = data[sent]
          if (!s) return null
          return (
            <div key={sent} className="text-center p-4 rounded-lg bg-gray-50">
              <div className={`inline-block px-3 py-1 rounded-full text-white text-xs font-medium mb-2 ${colors[sent]}`}>
                {sent}
              </div>
              <div className="text-2xl font-bold text-gray-800">{s.count || 0}笔</div>
              <div className="text-xs text-gray-500 mt-1">胜率 {s.winRate?.toFixed(1) || 0}%</div>
              <div className={`text-sm font-medium mt-1 ${(s.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(s.totalProfit || 0)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 持仓时间vs收益率
const HoldingVsReturn = ({ stats }) => {
  if (!stats) return null
  
  const order = ['当日', '1-3天', '4-7天', '8-15天', '16-30天', '30天以上']
  const data = order.filter(k => stats[k]).map(k => ({
    range: k,
    ...stats[k],
  }))
  
  if (data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">持仓时间 vs 收益率</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left text-gray-500 font-normal">持仓区间</th>
              <th className="p-2 text-right text-gray-500 font-normal">笔数</th>
              <th className="p-2 text-right text-gray-500 font-normal">胜率</th>
              <th className="p-2 text-right text-gray-500 font-normal">总盈亏</th>
              <th className="p-2 text-right text-gray-500 font-normal">平均盈亏</th>
              <th className="p-2 text-right text-gray-500 font-normal">平均持仓</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.range} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 font-medium text-gray-700">{d.range}</td>
                <td className="p-2 text-right">{d.count}</td>
                <td className="p-2 text-right text-blue-600">{d.winRate.toFixed(1)}%</td>
                <td className={`p-2 text-right font-medium ${d.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoney(d.totalProfit)}
                </td>
                <td className={`p-2 text-right ${d.avgProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatMoney(d.avgProfit)}
                </td>
                <td className="p-2 text-right text-gray-600">{d.avgHoldingDays.toFixed(1)}天</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 净盈亏比分布
const NetProfitRatioDistribution = ({ trades }) => {
  if (!trades || trades.length === 0) return null
  
  const ratios = trades.map(t => {
    const buyAmount = Math.abs(t.buyAmount || 0)
    const profit = t.netProfit || 0
    return buyAmount > 0 ? profit / buyAmount * 100 : 0
  }).filter(r => r !== 0)
  
  const bins = {
    '<-10%': ratios.filter(r => r < -10).length,
    '-10%~-5%': ratios.filter(r => r >= -10 && r < -5).length,
    '-5%~-2%': ratios.filter(r => r >= -5 && r < -2).length,
    '-2%~0%': ratios.filter(r => r >= -2 && r < 0).length,
    '0%~2%': ratios.filter(r => r >= 0 && r < 2).length,
    '2%~5%': ratios.filter(r => r >= 2 && r < 5).length,
    '5%~10%': ratios.filter(r => r >= 5 && r < 10).length,
    '>10%': ratios.filter(r => r >= 10).length,
  }
  
  const maxCount = Math.max(...Object.values(bins), 1)
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">净盈亏比分布</h3>
      <div className="space-y-2">
        {Object.entries(bins).map(([range, count]) => {
          const pct = (count / Math.max(ratios.length, 1)) * 100
          const width = (count / maxCount) * 100
          const isProfit = !range.includes('-') || range.startsWith('0')
          return (
            <div key={range} className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-600 text-right">{range}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full flex items-center px-2 text-xs text-white font-medium ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.max(width, 5)}%` }}
                >
                  {count} ({pct.toFixed(0)}%)
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-gray-400">
        分布说明：横条越宽表示该区间的交易占比越高，可观察是否存在"胖尾风险"（极端亏损占比过大）
      </p>
    </div>
  )
}

// 出场理由分析
const ExitReasonAnalysis = ({ trades }) => {
  if (!trades || trades.length === 0) return null
  
  const reasons = {
    '主动止盈': { trades: [], profits: [] },
    '止损离场': { trades: [], profits: [] },
    '清仓离场': { trades: [], profits: [] },
    '其他原因': { trades: [], profits: [] },
  }
  
  for (const t of trades) {
    const sellReason = t.sellReason || '其他原因'
    if (reasons[sellReason]) {
      reasons[sellReason].trades.push(t)
      reasons[sellReason].profits.push(t.netProfit || 0)
    } else {
      reasons['其他原因'].trades.push(t)
      reasons['其他原因'].profits.push(t.netProfit || 0)
    }
  }
  
  const data = Object.entries(reasons).map(([reason, g]) => ({
    reason,
    count: g.trades.length,
    totalProfit: g.profits.reduce((a, b) => a + b, 0),
    avgProfit: g.profits.length > 0 ? g.profits.reduce((a, b) => a + b, 0) / g.profits.length : 0,
    winRate: g.profits.length > 0 ? (g.profits.filter(p => p > 0).length / g.profits.length * 100) : 0,
  }))
  
  const maxCount = Math.max(...data.map(d => d.count), 1)
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">出场理由分析</h3>
      <div className="space-y-3">
        {data.map((d, i) => {
          const width = (d.count / maxCount) * 100
          return (
            <div key={d.reason} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">{d.reason}</span>
                <span className="text-gray-400">{d.count}笔 ({(d.count / Math.max(trades.length, 1) * 100).toFixed(0)}%)</span>
              </div>
              <div className="bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full flex items-center px-2 text-xs text-white font-medium ${d.totalProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.max(width, 5)}%` }}
                >
                  胜率{d.winRate.toFixed(0)}% | {formatMoney(d.totalProfit)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 仓位大小影响
const PositionSizeImpact = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">仓位大小 vs 盈亏</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left text-gray-500 font-normal">仓位区间</th>
              <th className="p-2 text-right text-gray-500 font-normal">笔数</th>
              <th className="p-2 text-right text-gray-500 font-normal">胜率</th>
              <th className="p-2 text-right text-gray-500 font-normal">总盈亏</th>
              <th className="p-2 text-right text-gray-500 font-normal">平均盈亏</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([size, s], i) => (
              <tr key={size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 font-medium text-gray-700">{size}</td>
                <td className="p-2 text-right">{s.count}</td>
                <td className="p-2 text-right text-blue-600">{s.winRate.toFixed(1)}%</td>
                <td className={`p-2 text-right font-medium ${(s.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoney(s.totalProfit || 0)}
                </td>
                <td className={`p-2 text-right ${(s.avgProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatMoney(s.avgProfit || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TradeAnalysis = () => {
  const tradeRecords = useStore(state => state.tradeRecords)
  const psychResults = useStore(state => state.psychologicalTestResults)
  const strategies = useStore(state => state.tradingStrategies)
  const dailyWorkData = useStore(state => state.dailyWorkData)

  const [activeTab, setActiveTab] = useState('performance')

  const closedTrades = useMemo(() => {
    return (tradeRecords || []).filter(t => t.tradeStatus === '结束' && t.netProfit != null)
  }, [tradeRecords])

  const overallStats = useMemo(() => calcOverallStats(closedTrades), [closedTrades])
  const equityCurve = useMemo(() => calcEquityCurve(closedTrades), [closedTrades])
  const profitDist = useMemo(() => calcProfitDistribution(closedTrades), [closedTrades])
  const monthlyMatrix = useMemo(() => calcMonthlyProfitMatrix(closedTrades), [closedTrades])
  const psychImpact = useMemo(() => calcPsychImpact(closedTrades, psychResults), [closedTrades, psychResults])
  const psychIndicator = useMemo(() => calcPsychIndicatorImpact(closedTrades, psychResults), [closedTrades, psychResults])
  const holdingStats = useMemo(() => calcHoldingRangeStats(closedTrades), [closedTrades])
  const weeklyStats = useMemo(() => calcWeeklyEffect(closedTrades), [closedTrades])
  const symbolRanking = useMemo(() => calcSymbolRanking(closedTrades), [closedTrades])
  const stopLossHit = useMemo(() => calcStopLossHitRate(closedTrades), [closedTrades])
  const tradeQuality = useMemo(() => calcTradeQuality(closedTrades), [closedTrades])
  const streak = useMemo(() => calcConsecutiveStreak(closedTrades), [closedTrades])
  const strategyImpact = useMemo(() => calcStrategyImpact(closedTrades, strategies), [closedTrades, strategies])
  const sentimentImpact = useMemo(() => calcSentimentImpact(closedTrades, dailyWorkData), [closedTrades, dailyWorkData])
  const positionImpact = useMemo(() => calcPositionSizeImpact(closedTrades), [closedTrades])

  const tabs = [
    { key: 'performance', label: '① 交易绩效' },
    { key: 'sentiment', label: '② 大盘情绪' },
    { key: 'psychology', label: '③ 心理状态' },
    { key: 'risk', label: '④ 风险控制' },
    { key: 'macro', label: '⑤ 全局宏观' },
  ]

  if (closedTrades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-3">📊</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">暂无交易数据</h2>
          <p className="text-sm text-gray-400">完成至少一笔完整的买入卖出交易后，即可在此查看分析结果</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">交易数据分析</h1>
        <div className="text-sm text-gray-400">
          基于 {closedTrades.length} 笔已完成交易
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {overallStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: '总盈亏', value: formatMoney(overallStats.totalProfit), color: overallStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600' },
                { label: '胜率', value: formatPct(overallStats.winRate), color: 'text-blue-600' },
                { label: '盈亏比', value: overallStats.profitLossRatio.toFixed(2), color: 'text-purple-600' },
                { label: '最大回撤', value: formatMoney(overallStats.maxDrawdown), color: 'text-red-500' },
                { label: '交易次数', value: overallStats.totalTrades, color: 'text-gray-600' },
                { label: '平均盈利', value: formatMoney(overallStats.avgWin), color: 'text-green-500' },
                { label: '平均亏损', value: formatMoney(overallStats.avgLoss), color: 'text-red-500' },
                { label: '平均持仓', value: `${overallStats.avgHoldingDays.toFixed(0)}天`, color: 'text-gray-600' },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-400 mb-1">{card.label}</div>
                  <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                </div>
              ))}
            </div>
          )}

          <EquityCurve data={equityCurve} title="资金权益曲线" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyHeatmap matrix={monthlyMatrix.matrix} monthNames={monthlyMatrix.monthNames} />
            <ProfitDistribution data={profitDist} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StrategyComparison strategies={strategies} trades={closedTrades} />
            <HoldingVsReturn stats={holdingStats} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HoldingScatter trades={closedTrades} />
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">评级 vs 盈亏散点</h3>
              <StrategyScatter trades={closedTrades} strategies={strategies} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sentiment' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">大盘情绪 × 胜率</h3>
            <p className="text-xs text-gray-400 mb-4">分析不同大盘情绪状态下，开仓成功率的差异</p>
            <SentimentImpact data={sentimentImpact} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">仓位大小 vs 盈亏</h3>
            <p className="text-xs text-gray-400 mb-4">不同仓位规模下的交易表现分析</p>
            <PositionSizeImpact data={positionImpact} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">星期效应分析</h3>
            <p className="text-xs text-gray-400 mb-4">一周中不同交易日的胜率表现</p>
            <WeeklyEffect stats={weeklyStats} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">个股盈亏排行</h3>
            <p className="text-xs text-gray-400 mb-4">各股票的累计盈亏和胜率排名</p>
            {symbolRanking && symbolRanking.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-left text-gray-500 font-normal">排名</th>
                      <th className="p-2 text-left text-gray-500 font-normal">股票</th>
                      <th className="p-2 text-right text-gray-500 font-normal">笔数</th>
                      <th className="p-2 text-right text-gray-500 font-normal">胜率</th>
                      <th className="p-2 text-right text-gray-500 font-normal">总盈亏</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbolRanking.slice(0, 15).map((item, i) => (
                      <tr key={item.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-2 text-gray-400">{i + 1}</td>
                        <td className="p-2 font-medium text-gray-700">{item.name}</td>
                        <td className="p-2 text-right">{item.count}</td>
                        <td className="p-2 text-right text-blue-600">{item.winRate.toFixed(1)}%</td>
                        <td className={`p-2 text-right font-medium ${item.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatMoney(item.totalProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'psychology' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">心理得分 × 盈亏</h3>
            <p className="text-xs text-gray-400 mb-4">心理测试分值与当日/次日交易结果的相关性分析</p>
            <PsychScoreImpact data={psychImpact} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">5项心理指标影响力</h3>
            <p className="text-xs text-gray-400 mb-4">各项心理指标与交易盈亏的相关系数</p>
            <PsychIndicatorImpact data={psychIndicator} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">出场理由分析</h3>
            <p className="text-xs text-gray-400 mb-4">主动止盈、止损清仓、恐惧割肉等不同出场原因的频率及结果</p>
            <ExitReasonAnalysis trades={closedTrades} />
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="space-y-6">
          <StopLossAnalysis hitRate={stopLossHit} />

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">净盈亏比分布</h3>
            <p className="text-xs text-gray-400 mb-4">每笔交易净盈亏率的分布形态——胖尾风险、极端亏损占比、正态性评估</p>
            <NetProfitRatioDistribution trades={closedTrades} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">个股盈亏排行</h3>
            {symbolRanking && symbolRanking.length > 0 && (
              <div className="space-y-2">
                {symbolRanking.slice(0, 10).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-400">{item.count}笔</span>
                      <span className="text-gray-400">胜率 {item.winRate.toFixed(0)}%</span>
                      <span className={item.totalProfit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {formatMoney(item.totalProfit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">连赢连亏记录</h3>
            {streak && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{streak.maxWin}</div>
                  <div className="text-xs text-gray-500 mt-1">最长连赢</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{streak.maxLose}</div>
                  <div className="text-xs text-gray-500 mt-1">最长连亏</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${streak.isWin ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-2xl font-bold ${streak.isWin ? 'text-green-600' : 'text-red-600'}`}>
                    {streak.currentStreak}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">当前{streak.isWin ? '连赢' : '连亏'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'macro' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">交易质量雷达图</h3>
            <p className="text-xs text-gray-400 mb-4">多维度评估交易质量</p>
            <QualityRadar quality={tradeQuality} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">交易费用分析</h3>
            {tradeQuality && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">总手续费</span>
                  <span className="font-medium text-gray-700">{formatMoney(tradeQuality.totalFees)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">手续费占利润比</span>
                  <span className="font-medium text-gray-700">
                    {tradeQuality.totalProfit !== 0 ? (tradeQuality.totalFees / Math.abs(tradeQuality.totalProfit) * 100).toFixed(1) : '-'}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">平均滑点</span>
                  <span className="font-medium text-gray-700">{tradeQuality.avgSlippage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">最大滑点</span>
                  <span className="font-medium text-gray-700">{tradeQuality.maxSlippage.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">策略盈亏排行</h3>
            {strategyImpact && Object.keys(strategyImpact).length > 0 && (
              <div className="space-y-2">
                {Object.entries(strategyImpact)
                  .sort(([, a], [, b]) => b.totalProfit - a.totalProfit)
                  .map(([name, s]) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{name}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-400">{s.count}笔</span>
                        <span className="text-gray-400">胜率 {s.winRate.toFixed(0)}%</span>
                        <span className={s.totalProfit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {formatMoney(s.totalProfit)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">持仓区间统计</h3>
            <HoldingDurationStats stats={holdingStats} />
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeAnalysis
