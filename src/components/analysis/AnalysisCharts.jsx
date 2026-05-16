import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, ZAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

const formatPct = (v) => v != null ? `${v.toFixed(1)}%` : '-'
const formatMoney = (v) => v != null ? `¥${Number(v).toLocaleString()}` : '-'

const PsychScoreImpact = ({ data }) => {
  if (!data || data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">心理得分 vs 盈亏</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="score" tick={{ fontSize: 11 }} label={{ value: '心理总分', position: 'insideBottom', offset: -5, fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatMoney} />
          <Tooltip formatter={(v, name) => name === 'totalProfit' ? [formatMoney(v), '总盈亏'] : [`${v.toFixed(1)}%`, '胜率']} labelFormatter={(v) => `${v}分`} />
          <Bar dataKey="totalProfit" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="总盈亏" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-gray-500">
        {data.map(d => (
          <div key={d.score} className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-gray-700">{d.score}分</div>
            <div>{d.count}笔</div>
            <div className={d.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatMoney(d.totalProfit)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const PsychIndicatorImpact = ({ data }) => {
  if (!data || data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">5项心理指标影响力</h3>
      <div className="space-y-3">
        {data.map((ind, i) => (
          <div key={ind.key} className="flex items-center gap-3">
            <span className="w-16 text-xs text-gray-600 text-right">{ind.name}</span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full flex items-center justify-end px-2 text-xs text-white font-medium ${ind.correlation > 0 ? 'bg-green-500' : ind.correlation < 0 ? 'bg-red-500' : 'bg-gray-400'}`}
                  style={{ width: `${Math.max(Math.abs(ind.correlation) * 100, 10)}%` }}
                >
                  {ind.correlation > 0 ? '+' : ''}{ind.correlation.toFixed(2)}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-400 w-16">相关系数</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-400">相关系数越接近 +1 表示正相关（分数越高越赚钱），越接近 -1 表示负相关</p>
    </div>
  )
}

const StrategyScatter = ({ trades, strategies }) => {
  const strategyMap = {}
  if (strategies) {
    for (const s of strategies) strategyMap[s.id] = s.name || `策略${s.id}`
  }
  
  const data = (trades || []).map(t => ({
    x: t.strategyScore || t.overallScore || 5,
    y: t.netProfit || 0,
    symbol: t.symbol,
    strategy: strategyMap[t.buyStrategyId || t.strategyId] || '未知',
    score: t.strategyScore || t.overallScore || 5,
  }))
  
  if (data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">策略评分 vs 实际盈亏</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="x" type="number" domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: '策略评分', position: 'insideBottom', offset: -5, fontSize: 12 }} />
          <YAxis dataKey="y" type="number" tick={{ fontSize: 11 }} tickFormatter={formatMoney} />
          <Tooltip formatter={(v, name) => name === 'y' ? [formatMoney(v), '盈亏'] : [v, '评分']} />
          <Scatter data={data} fill="#3b82f6" r={4} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

const HoldingDurationStats = ({ stats }) => {
  if (!stats) return null
  
  const order = ['当日', '1-3天', '4-7天', '8-15天', '16-30天', '30天以上']
  const data = order.filter(k => stats[k]).map(k => ({
    range: k,
    ...stats[k],
  }))
  
  if (data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">不同持仓区间胜率对比</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="range" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatPct} domain={[0, 100]} />
          <Tooltip formatter={(v, name) => name === 'winRate' ? [formatPct(v), '胜率'] : [formatMoney(v), '总盈亏']} />
          <Bar dataKey="winRate" fill="#10b981" radius={[4, 4, 0, 0]} name="胜率" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const WeeklyEffect = ({ stats }) => {
  const order = ['周一', '周二', '周三', '周四', '周五']
  const data = order.filter(k => stats[k]).map(k => ({
    day: k,
    ...stats[k],
  }))
  
  if (data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">星期效应分析</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatPct} domain={[0, 100]} />
          <Tooltip formatter={(v, name) => name === 'winRate' ? [formatPct(v), '胜率'] : [formatMoney(v), '总盈亏']} />
          <Bar dataKey="winRate" fill="#f59e0b" radius={[4, 4, 0, 0]} name="胜率" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const StopLossAnalysis = ({ hitRate }) => {
  if (!hitRate) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">止损止盈命中率</h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-red-500">{hitRate.stopLossRate.toFixed(0)}%</div>
          <div className="text-xs text-gray-500 mt-1">止损命中率</div>
          <div className="text-xs text-gray-400">{hitRate.stopLossHit}/{hitRate.stopLossSet} 次触发</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-500">{hitRate.takeProfitRate.toFixed(0)}%</div>
          <div className="text-xs text-gray-500 mt-1">止盈命中率</div>
          <div className="text-xs text-gray-400">{hitRate.takeProfitHit}/{hitRate.takeProfitSet} 次触发</div>
        </div>
      </div>
    </div>
  )
}

const QualityRadar = ({ quality }) => {
  if (!quality) return null
  
  const maxWinRate = 100
  const maxPLRatio = 5
  const maxSharpe = 3
  
  const data = [
    { subject: '胜率', value: (quality.winRate || 0) / maxWinRate * 100, fullMark: 100 },
    { subject: '盈亏比', value: Math.min((quality.profitLossRatio || 0) / maxPLRatio * 100, 100), fullMark: 100 },
    { subject: '持仓效率', value: quality.totalTrades > 0 ? Math.min(quality.totalTrades / 50 * 100, 100) : 0, fullMark: 100 },
    { subject: '风控能力', value: quality.maxDrawdown > 0 ? Math.max(100 - quality.maxDrawdown, 0) : 100, fullMark: 100 },
    { subject: '费用控制', value: quality.totalFees > 0 ? Math.max(100 - quality.totalFees / Math.abs(quality.totalProfit) * 100, 0) : 100, fullMark: 100 },
    { subject: '稳定性', value: quality.winRate > 40 && quality.profitLossRatio > 1 ? 80 : 40, fullMark: 100 },
  ]
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">交易质量雷达图</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar name="能力值" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export { PsychScoreImpact, PsychIndicatorImpact, StrategyScatter, HoldingDurationStats, WeeklyEffect, StopLossAnalysis, QualityRadar, formatMoney, formatPct }
