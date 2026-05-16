import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts'

const formatMoney = (v) => {
  if (v == null) return '-'
  return `¥${Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatPct = (v) => {
  if (v == null) return '-'
  return `${v.toFixed(1)}%`
}

const EquityCurve = ({ data, title }) => {
  if (!data || data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{title || '资金权益曲线'}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v ? v.slice(5, 10) : ''} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatMoney} />
          <Tooltip formatter={(v) => [formatMoney(v), '累计盈亏']} labelFormatter={(v) => v} />
          <Area type="monotone" dataKey="profit" stroke={data[data.length - 1]?.profit >= 0 ? '#10b981' : '#ef4444'} fill={data[data.length - 1]?.profit >= 0 ? 'url(#colorProfit)' : 'url(#colorLoss)'} strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const MonthlyHeatmap = ({ matrix, monthNames }) => {
  if (!matrix || matrix.length === 0) return null
  
  const allValues = matrix.flatMap(row => monthNames.map(m => row[m])).filter(v => v != null)
  const maxAbs = Math.max(...allValues.map(Math.abs), 1)
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">月度收益热力图</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-gray-500 font-normal">年份</th>
              {monthNames.map(m => <th key={m} className="p-2 text-gray-500 font-normal">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.map(row => (
              <tr key={row.year}>
                <td className="p-2 font-medium text-gray-700">{row.year}年</td>
                {monthNames.map(m => {
                  const v = row[m] || 0
                  const bg = v >= 0
                    ? `rgba(16, 185, 129, ${Math.min(Math.abs(v) / maxAbs, 1) * 0.7})`
                    : `rgba(239, 68, 68, ${Math.min(Math.abs(v) / maxAbs, 1) * 0.7})`
                  return (
                    <td key={m} className="p-1">
                      <div className="rounded px-2 py-1.5 text-center text-white font-medium" style={{ backgroundColor: bg }}>
                        {v >= 0 ? '+' : ''}{Math.round(v).toLocaleString()}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const ProfitDistribution = ({ data }) => {
  if (!data || data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">盈亏分布</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="range" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v}笔`, '交易次数']} labelFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Area type="monotone" dataKey="count" fill="#8b5cf6" fillOpacity={0.3} stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const HoldingScatter = ({ trades }) => {
  if (!trades || trades.length === 0) return null
  
  const data = trades
    .filter(t => t.holdDuration != null && t.netProfit != null)
    .map(t => ({
      x: t.holdDuration,
      y: t.netProfit,
      symbol: t.symbol,
      profit: t.netProfit,
    }))
  
  if (data.length === 0) return null
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">持仓天数 vs 盈亏</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="x" tick={{ fontSize: 11 }} label={{ value: '持仓天数', position: 'insideBottom', offset: -5, fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatMoney} label={{ value: '盈亏 (元)', angle: -90, position: 'insideLeft', offset: 5, fontSize: 12 }} />
          <Tooltip formatter={(v) => [formatMoney(v), '盈亏']} labelFormatter={(v) => `${v}天`} />
          <Line type="monotone" dataKey="y" stroke="#6366f1" strokeWidth={1.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export { EquityCurve, MonthlyHeatmap, ProfitDistribution, HoldingScatter, formatMoney, formatPct }
