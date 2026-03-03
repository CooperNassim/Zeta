import React, { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Shield, DollarSign, Activity, Target } from 'lucide-react'

// 风险额度配置
const RiskConfig = () => {
  const [totalRiskPercent, setTotalRiskPercent] = useState(5)
  const [singleRiskPercent, setSingleRiskPercent] = useState(1)
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    // 保存配置到 store 或 localStorage
    localStorage.setItem('riskModel_totalRiskPercent', totalRiskPercent.toString())
    localStorage.setItem('riskModel_singleRiskPercent', singleRiskPercent.toString())
    setIsEditing(false)
    alert('风险额度设置已保存')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: '#0F1419' }} />
          <h3 className="font-semibold text-sm">风险额度配置</h3>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
          style={{ color: '#0F1419', borderColor: '#0F1419' }}
        >
          {isEditing ? '取消' : '编辑'}
        </button>
      </div>

      {!isEditing ? (
        <div className="space-y-3 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">总账可用风险额度</span>
            <span className="font-semibold text-lg" style={{ color: '#0F1419' }}>
              {totalRiskPercent}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">单笔可用风险额度</span>
            <span className="font-semibold text-lg" style={{ color: '#0F1419' }}>
              {singleRiskPercent}%
            </span>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
            <p>• 总账：月初账户总额 × (1 - 总账可用风险额度)</p>
            <p>• 单笔：每笔交易最大风险占比</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm text-gray-600 mb-2">总账可用风险额度 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={totalRiskPercent}
              onChange={(e) => setTotalRiskPercent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded text-sm"
              style={{ borderColor: '#0F1419' }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">单笔可用风险额度 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={singleRiskPercent}
              onChange={(e) => setSingleRiskPercent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded text-sm"
              style={{ borderColor: '#0F1419' }}
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-2 rounded text-white text-sm"
            style={{ backgroundColor: '#0F1419' }}
          >
            保存配置
          </button>
        </div>
      )}
    </div>
  )
}

// 风险仪表盘组件
const RiskGauge = ({ value, label }) => {
  const percentage = Math.min(Math.max(value, 0), 100)
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (percentage / 100) * circumference
  const color = percentage > 80 ? '#EF4444' : percentage > 60 ? '#F59E0B' : '#10B981'

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="120" height="120" className="transform -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke="#E5E7EB"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center transform rotate-90">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: color }}>
              {percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600">{label}</div>
    </div>
  )
}

// 当前持仓股票组件
const CurrentPositions = ({ selectedPosition, onPositionSelect }) => {
  // 模拟持仓数据
  const positions = [
    {
      id: 1,
      symbol: 'AAPL',
      name: '苹果',
      riskAmount: 5000,
      riskPercent: 2.5,
      profitLoss: 1200,
      profitLossPercent: 6.0,
      distanceToStopLoss: 3.5,
      distanceToTakeProfit: 8.5,
      scheduleTime: '2024-01-15 09:30:00'
    },
    {
      id: 2,
      symbol: 'MSFT',
      name: '微软',
      riskAmount: 3500,
      riskPercent: 1.8,
      profitLoss: -500,
      profitLossPercent: -2.5,
      distanceToStopLoss: 1.2,
      distanceToTakeProfit: 6.8,
      scheduleTime: '2024-01-15 10:00:00'
    },
    {
      id: 3,
      symbol: 'GOOGL',
      name: '谷歌',
      riskAmount: 4200,
      riskPercent: 2.1,
      profitLoss: 800,
      profitLossPercent: 4.2,
      distanceToStopLoss: 2.8,
      distanceToTakeProfit: 7.2,
      scheduleTime: '2024-01-15 10:30:00'
    }
  ]

  if (!selectedPosition) {
    selectedPosition = positions[0] // 默认选中执行最早的
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5" style={{ color: '#0F1419' }} />
        <h3 className="font-semibold text-sm">当前持仓</h3>
        <span className="text-xs text-gray-500">({positions.length}只)</span>
      </div>

      {/* 股票选择器 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {positions.map((pos, index) => (
          <button
            key={pos.id}
            onClick={() => onPositionSelect(pos)}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-all ${
              selectedPosition?.id === pos.id
                ? 'text-white'
                : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: selectedPosition?.id === pos.id ? '#0F1419' : 'transparent'
            }}
          >
            {pos.symbol}
          </button>
        ))}
      </div>

      {/* 选中股票详情 */}
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-center pb-2 border-b">
          <div>
            <div className="font-semibold text-lg" style={{ color: '#0F1419' }}>
              {selectedPosition.symbol}
            </div>
            <div className="text-xs text-gray-500">{selectedPosition.name}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-500 mb-1">占用风险额度</div>
            <div className="font-semibold" style={{ color: '#0F1419' }}>
              ¥{selectedPosition.riskAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {selectedPosition.riskPercent}%
            </div>
          </div>

          <div className={`p-3 rounded ${
            selectedPosition.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="text-xs text-gray-500 mb-1">盈亏</div>
            <div className={`font-semibold ${
              selectedPosition.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {selectedPosition.profitLoss >= 0 ? '+' : ''}
              ¥{selectedPosition.profitLoss.toLocaleString()}
            </div>
            <div className={`text-xs ${
              selectedPosition.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {selectedPosition.profitLossPercent >= 0 ? '+' : ''}
              {selectedPosition.profitLossPercent}%
            </div>
          </div>

          <div className="p-3 bg-orange-50 rounded">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              距止损线
            </div>
            <div className="font-semibold text-orange-600">
              {selectedPosition.distanceToStopLoss}%
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              距止盈线
            </div>
            <div className="font-semibold text-blue-600">
              {selectedPosition.distanceToTakeProfit}%
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-2">
          预约执行时间: {selectedPosition.scheduleTime}
        </div>
      </div>
    </div>
  )
}

// 账户风险组件
const AccountRisk = () => {
  // 模拟数据
  const accountRiskData = {
    stopLossPreLoss: 8500,
    monthlyLoss: 3200,
    startMonthTotal: 200000,
    riskRatio: 5.85
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5" style={{ color: '#0F1419' }} />
        <h3 className="font-semibold text-sm">账户风险</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <RiskGauge value={accountRiskData.riskRatio} label="风险占比" />
        <div className="mt-4 text-center">
          <div className="text-xs text-gray-500 mb-1">计算公式</div>
          <div className="text-xs text-gray-400">
            (持仓止损预亏 + 当月亏损) / 月初账户总额
          </div>
        </div>
        <div className="mt-3 w-full grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-xs text-gray-500">持仓止损预亏</div>
            <div className="font-semibold text-red-600 text-sm">
              ¥{accountRiskData.stopLossPreLoss.toLocaleString()}
            </div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-xs text-gray-500">当月亏损</div>
            <div className="font-semibold text-red-600 text-sm">
              ¥{accountRiskData.monthlyLoss.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 当月亏损组件
const MonthlyLoss = () => {
  const monthlyLossData = {
    monthlyLoss: 3200,
    startMonthTotal: 200000,
    lossPercent: 1.6
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-sm">当月亏损</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-red-600 mb-2">
            -¥{monthlyLossData.monthlyLoss.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            占月初总额 {monthlyLossData.lossPercent}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${monthlyLossData.lossPercent}%` }}
            />
          </div>
          <div className="text-xs text-gray-400">
            月初账户总额: ¥{monthlyLossData.startMonthTotal.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

// 可用风险额度组件
const AvailableRisk = () => {
  const availableRiskData = {
    totalRiskPercent: 5,
    startMonthTotal: 200000,
    stopLossPreLoss: 8500,
    monthlyLoss: 3200,
    available: 85300
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5" style={{ color: '#0F1419' }} />
        <h3 className="font-semibold text-sm">可用风险额度</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2" style={{ color: '#0F1419' }}>
            ¥{availableRiskData.available.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            可用于新交易的风险额度
          </div>
        </div>

        <div className="w-full space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>月初账户总额</span>
            <span>¥{availableRiskData.startMonthTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>总账可用风险额度</span>
            <span>{availableRiskData.totalRiskPercent}%</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>- 持仓止损预亏</span>
            <span>-¥{availableRiskData.stopLossPreLoss.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>- 当月亏损</span>
            <span>-¥{availableRiskData.monthlyLoss.toLocaleString()}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold" style={{ color: '#0F1419' }}>
            <span>= 可用额度</span>
            <span>¥{availableRiskData.available.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 当月亏损策略排名组件
const StrategyRanking = () => {
  const strategyRankings = [
    { rank: 1, name: '突破策略', loss: 2500, lossPercent: 1.25 },
    { rank: 2, name: '趋势策略', loss: 500, lossPercent: 0.25 },
    { rank: 3, name: '震荡策略', loss: 200, lossPercent: 0.10 }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-sm">当月亏损策略排名</h3>
      </div>

      <div className="flex-1 space-y-2">
        {strategyRankings.map((item, index) => (
          <div
            key={item.rank}
            className={`p-3 rounded border transition-all ${
              index === 0 ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index === 0
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {item.rank}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#0F1419' }}>
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.lossPercent}%
                  </div>
                </div>
              </div>
              <div className="text-red-600 font-semibold">
                -¥{item.loss.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const RiskModel = () => {
  const [selectedPosition, setSelectedPosition] = useState(null)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '16px',
          padding: '16px',
          height: 'calc(100vh - 52px)'
        }}
      >
        {/* 左上角：当前持仓 */}
        <div className="row-span-2">
          <CurrentPositions
            selectedPosition={selectedPosition}
            onPositionSelect={setSelectedPosition}
          />
        </div>

        {/* 中间上方：账户风险 */}
        <div>
          <AccountRisk />
        </div>

        {/* 中间下方：当月亏损 */}
        <div>
          <MonthlyLoss />
        </div>

        {/* 右上角：可用风险额度 */}
        <div>
          <AvailableRisk />
        </div>

        {/* 右下角：当月亏损策略排名 */}
        <div>
          <StrategyRanking />
        </div>
      </div>
    </div>
  )
}

export default RiskModel
