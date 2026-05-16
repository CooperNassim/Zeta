import React from 'react'
import { TrendingUp, TrendingDown, Activity, Target, DollarSign, Percent, Clock, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import DataTable from '../DataTable'
import EmptyState from '../EmptyState'

const PerformanceCards = ({ performance }) => {
  const cards = [
    { label: '总收益率', value: performance?.totalReturn?.toFixed(2) + '%', icon: TrendingUp, color: performance?.totalReturn >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: '年化收益率', value: performance?.annualReturn?.toFixed(2) + '%', icon: Activity, color: performance?.annualReturn >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: '最大回撤', value: performance?.maxDrawdown?.toFixed(2) + '%', icon: TrendingDown, color: 'text-red-600' },
    { label: '夏普比率', value: performance?.sharpeRatio?.toFixed(2), icon: Target, color: 'text-blue-600' },
    { label: '胜率', value: performance?.winRate?.toFixed(2) + '%', icon: Percent, color: performance?.winRate >= 50 ? 'text-green-600' : 'text-red-600' },
    { label: '盈亏比', value: performance?.profitLossRatio?.toFixed(2), icon: BarChart3, color: performance?.profitLossRatio >= 2 ? 'text-green-600' : 'text-yellow-600' },
    { label: '交易次数', value: performance?.totalTrades || 0, icon: Activity, color: 'text-gray-600' },
    { label: '平均持仓', value: performance?.avgHoldingDays?.toFixed(1) + '天', icon: Clock, color: 'text-gray-600' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <div className={`text-xl font-semibold ${card.color}`}>{card.value}</div>
          </div>
        )
      })}
    </div>
  )
}

const EquityChart = ({ equityCurve }) => {
  if (!equityCurve || equityCurve.length === 0) return null

  const data = equityCurve.map((point, index) => ({
    index,
    date: point.date,
    equity: Math.round(point.equity),
    return: point.return?.toFixed(2) + '%',
  }))

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-4">资金曲线</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
          <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const DrawdownChart = ({ drawdownCurve }) => {
  if (!drawdownCurve || drawdownCurve.length === 0) return null

  const data = drawdownCurve.map((point, index) => ({
    index,
    date: point.date,
    drawdown: point.drawdown?.toFixed(2) + '%',
    isMax: point.isMaxDrawdown,
  }))

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-4">回撤曲线</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const TradeTable = ({ trades }) => {
  if (!trades || trades.length === 0) return null

  const columns = [
    { key: 'date', label: '日期', width: '120px' },
    { key: 'type', label: '类型', width: '80px' },
    { key: 'price', label: '价格', width: '100px' },
    { key: 'shares', label: '数量', width: '100px' },
    { key: 'pnl', label: '盈亏', width: '100px' },
    { key: 'pnlPercent', label: '盈亏%', width: '80px' },
    { key: 'holdingDays', label: '持仓天数', width: '80px' },
  ]

  const displayTrades = trades.map(t => ({
    ...t,
    price: t.price?.toFixed(2),
    pnl: t.pnl?.toFixed(2),
    pnlPercent: t.pnlPercent?.toFixed(2) + '%',
    holdingDays: t.holdingDays || '-',
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 p-4">交易明细</h3>
      <DataTable columns={columns} data={displayTrades} />
    </div>
  )
}

const ResultPanel = ({ status, progress, result, config }) => {
  if (status === 'idle' && !result) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          title="暂无回测结果"
          description="请配置回测条件后点击运行回测"
        />
      </div>
    )
  }

  if (status === 'running') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-64 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">回测中...</span>
            <span className="text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-red-600 text-xl">回测失败</div>
          <div className="text-gray-500">请检查配置后重试</div>
        </div>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="p-6 space-y-6">
      <PerformanceCards performance={result.performance} />
      <EquityChart equityCurve={result.equityCurve} />
      <DrawdownChart drawdownCurve={result.drawdownCurve} />
      <TradeTable trades={result.trades} />
    </div>
  )
}

export default ResultPanel
