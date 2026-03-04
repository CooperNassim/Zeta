import React, { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { TrendingUp, TrendingDown, Shield, Activity, Target, Wallet, TrendingDown as RankingDown, Edit as EditIcon, AlertCircle } from 'lucide-react'
import Modal from '../components/Modal'
import CustomInput from '../components/CustomInput'
import ErrorMessage from '../components/ErrorMessage'
import Toast from '../components/Toast'
import EmptyState from '../components/EmptyState'

// 风险额度编辑弹窗
const RiskConfigModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [totalRiskPercent, setTotalRiskPercent] = useState(initialData.totalRiskPercent)
  const [singleRiskPercent, setSingleRiskPercent] = useState(initialData.singleRiskPercent)
  const [errors, setErrors] = useState({ totalRisk: false, singleRisk: false })

  const validateForm = () => {
    const newErrors = {
      totalRisk: totalRiskPercent === '' || totalRiskPercent === undefined || totalRiskPercent === null,
      singleRisk: singleRiskPercent === '' || singleRiskPercent === undefined || singleRiskPercent === null
    }
    setErrors(newErrors)
    return !newErrors.totalRisk && !newErrors.singleRisk
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave({ totalRiskPercent, singleRiskPercent })
      onClose()
    }
  }

  const handleTotalRiskChange = (value) => {
    setTotalRiskPercent(value === '' ? '' : parseFloat(value))
    setErrors({ ...errors, totalRisk: false })
  }

  const handleSingleRiskChange = (value) => {
    setSingleRiskPercent(value === '' ? '' : parseFloat(value))
    setErrors({ ...errors, singleRisk: false })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="风险额度"
      width="max-w-md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#0F1419' }}
          >
            保存
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">* </span>账户风险额度比例 (%)
          </label>
          <CustomInput
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={totalRiskPercent}
            onChange={handleTotalRiskChange}
            placeholder="请输入账户风险额度比例"
            error={errors.totalRisk}
          />
          {errors.totalRisk && (
            <ErrorMessage message="不能为空" showIcon={true} icon={AlertCircle} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">* </span>单笔风险额度比例 (%)
          </label>
          <CustomInput
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={singleRiskPercent}
            onChange={handleSingleRiskChange}
            placeholder="请输入单笔风险额度比例"
            error={errors.singleRisk}
          />
          {errors.singleRisk && (
            <ErrorMessage message="不能为空" showIcon={true} icon={AlertCircle} />
          )}
        </div>
      </div>
    </Modal>
  )
}

// 风险额度配置
const RiskConfig = () => {
  const [totalRiskPercent, setTotalRiskPercent] = useState(6)
  const [singleRiskPercent, setSingleRiskPercent] = useState(2)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleSave = (data) => {
    setTotalRiskPercent(data.totalRiskPercent)
    setSingleRiskPercent(data.singleRiskPercent)
    localStorage.setItem('riskModel_totalRiskPercent', data.totalRiskPercent.toString())
    localStorage.setItem('riskModel_singleRiskPercent', data.singleRiskPercent.toString())
    setShowToast(true)
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield style={{ width: '20px', height: '20px', color: '#0F1419' }} />
          <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0 }}>风险额度</h3>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <EditIcon style={{ width: '16px', height: '16px', color: '#666' }} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>账户风险额度</div>
          <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '20px' }}>
            {totalRiskPercent}%
          </div>
        </div>
        <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>单笔风险额度</div>
          <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '20px' }}>
            {singleRiskPercent}%
          </div>
        </div>
      </div>

      <RiskConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={{ totalRiskPercent, singleRiskPercent }}
        onSave={handleSave}
      />
      {showToast && <Toast type="success" message="保存成功" onClose={() => setShowToast(false)} />}
    </div>
  )
}

// 风险仪表盘组件
const RiskGauge = ({ value, label }) => {
  const percentage = Math.min(Math.max(value, 0), 100)
  const circumference = 2 * Math.PI * 50
  const offset = circumference - (percentage / 100) * circumference
  const color = percentage > 4 ? '#EF4444' : percentage > 2 ? '#F59E0B' : '#22c55e'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative' }}>
        <svg width="132" height="132" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="66"
            cy="66"
            r="50"
            stroke="#E5E7EB"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="66"
            cy="66"
            r="50"
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: color }}>
              {percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>{label}</div>
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
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        <Activity style={{ width: '20px', height: '20px', color: '#0F1419' }} />
        <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0 }}>当前持仓</h3>
        <span style={{ fontSize: '12px', color: '#666' }}>({positions.length}只)</span>
      </div>

      {/* 持仓列表 - 垂直平铺，可滚动 */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {positions.length === 0 ? (
          <EmptyState message="暂无持仓数据" height="100%" />
        ) : (
          positions.map((pos, index) => (
            <div
              key={pos.id}
              style={{
                padding: '14px',
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}
            >
            {/* 股票名称和代码 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F1419' }}>
                  {pos.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>{pos.symbol}</div>
              </div>
            </div>

            {/* 风险信息网格 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '8px', background: '#ffffff', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>持仓占用</div>
                <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>
                  ¥{pos.riskAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {pos.riskPercent}%
                </div>
              </div>

                <div style={{
                  padding: '8px',
                  borderRadius: '4px',
                  background: pos.profitLoss >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>交易盈亏</div>
                  <div style={{
                    fontWeight: 'bold',
                    color: pos.profitLoss >= 0 ? '#22c55e' : '#ef4444',
                    fontSize: '14px'
                  }}>
                    {pos.profitLoss >= 0 ? '+' : '-'}¥{Math.abs(pos.profitLoss).toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: pos.profitLossPercent >= 0 ? '#22c55e' : '#ef4444'
                  }}>
                    {pos.profitLossPercent >= 0 ? '+' : ''}{pos.profitLossPercent}%
                  </div>
                </div>

              <div style={{ padding: '8px', background: '#ffffff', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>
                  距离止盈
                </div>
                <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px', marginBottom: '4px' }}>
                  {pos.distanceToTakeProfit}%
                </div>
                <div style={{ width: '100%', background: '#E5E7EB', borderRadius: '9999px', height: '4px' }}>
                  <div
                    style={{
                      background: '#22c55e',
                      height: '4px',
                      borderRadius: '9999px',
                      width: `${Math.min(pos.distanceToTakeProfit * 10, 100)}%`
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '8px', background: '#ffffff', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>
                  距离止损
                </div>
                <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px', marginBottom: '4px' }}>
                  {pos.distanceToStopLoss}%
                </div>
                <div style={{ width: '100%', background: '#E5E7EB', borderRadius: '9999px', height: '4px' }}>
                  <div
                    style={{
                      background: '#EF4444',
                      height: '4px',
                      borderRadius: '9999px',
                      width: `${Math.min(pos.distanceToStopLoss * 10, 100)}%`
                    }}
                  />
                </div>
              </div>
              </div>

              <div style={{ fontSize: '11px', color: '#999', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                执行时间: {pos.scheduleTime}
              </div>
            </div>
          ))
        )}
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

  // 计算可用风险额度
  const availableRisk = accountRiskData.startMonthTotal - (accountRiskData.stopLossPreLoss + accountRiskData.monthlyLoss)

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        <Wallet style={{ width: '20px', height: '20px', color: '#0F1419' }} />
        <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0 }}>账户风险</h3>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto', minHeight: 0 }}>
        <div style={{ flexShrink: 0 }}>
          <RiskGauge value={accountRiskData.riskRatio} label={`已用额度：¥${availableRisk.toLocaleString()}`} />
        </div>
        <div style={{ marginTop: '12px', width: '100%', flex: 1, minHeight: 0 }}>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', rowGap: '10px' }}>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>账户金额</div>
              <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '16px' }}>
                ¥{accountRiskData.startMonthTotal.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>可用额度</div>
              <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '16px' }}>
                ¥{availableRisk.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>持仓占用</div>
              <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '16px' }}>
                ¥{accountRiskData.stopLossPreLoss.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>当月亏损</div>
              <div style={{ fontWeight: 'bold', color: '#EF4444', fontSize: '16px' }}>
                ¥{accountRiskData.monthlyLoss.toLocaleString()}
              </div>
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
    <div style={{ background: 'rgb(249, 250, 251)', borderRadius: '8px', padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <TrendingDown style={{ width: '20px', height: '20px', color: '#EF4444' }} />
        <h3 style={{ fontWeight: 600, fontSize: '14px', color: '#0F1419' }}>当月亏损</h3>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#EF4444', marginBottom: '8px' }}>
            -¥{monthlyLossData.monthlyLoss.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            占月初总额 {monthlyLossData.lossPercent}%
          </div>
          <div style={{ width: '100%', background: '#E5E7EB', borderRadius: '9999px', height: '8px', marginBottom: '8px' }}>
            <div
              style={{
                background: '#EF4444',
                height: '8px',
                borderRadius: '9999px',
                transition: 'width 0.3s',
                width: `${monthlyLossData.lossPercent}%`
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
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
    <div style={{ background: 'rgb(249, 250, 251)', borderRadius: '8px', padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Shield style={{ width: '20px', height: '20px', color: '#0F1419' }} />
        <h3 style={{ fontWeight: 600, fontSize: '14px', color: '#0F1419' }}>可用风险额度</h3>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0F1419', marginBottom: '8px' }}>
            ¥{availableRiskData.available.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            可用于新交易的风险额度
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
            <span>月初账户总额</span>
            <span>¥{availableRiskData.startMonthTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
            <span>总账可用风险额度</span>
            <span>{availableRiskData.totalRiskPercent}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}>
            <span>- 持仓止损预亏</span>
            <span>-¥{availableRiskData.stopLossPreLoss.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}>
            <span>- 当月亏损</span>
            <span>-¥{availableRiskData.monthlyLoss.toLocaleString()}</span>
          </div>
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#0F1419' }}>
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
  const lossRankings = [
    { rank: 1, symbol: 'AAPL', name: '苹果', strategy: '突破策略', loss: 2500, lossPercent: 1.25 },
    { rank: 2, symbol: 'TSLA', name: '特斯拉', strategy: '趋势策略', loss: 500, lossPercent: 0.25 },
    { rank: 3, symbol: 'NFLX', name: '奈飞', strategy: '震荡策略', loss: 200, lossPercent: 0.10 },
    { rank: 4, symbol: 'MSFT', name: '微软', strategy: '波段策略', loss: 180, lossPercent: 0.09 },
    { rank: 5, symbol: 'GOOGL', name: '谷歌', strategy: '反转策略', loss: 150, lossPercent: 0.08 },
    { rank: 6, symbol: 'AMZN', name: '亚马逊', strategy: '突破策略', loss: 120, lossPercent: 0.06 },
    { rank: 7, symbol: 'META', name: 'Meta', strategy: '趋势策略', loss: 100, lossPercent: 0.05 },
    { rank: 8, symbol: 'NVDA', name: '英伟达', strategy: '震荡策略', loss: 80, lossPercent: 0.04 }
  ]

  const getRankColor = (rank) => {
    return '#F3F4F6'
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        <TrendingDown style={{ width: '20px', height: '20px', color: '#0F1419' }} />
        <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0 }}>当月亏损排名</h3>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {lossRankings.length === 0 ? (
          <EmptyState message="暂无亏损数据" height="100%" />
        ) : (
          lossRankings.map((item, index) => (
            <div
              key={item.rank}
              style={{
                padding: '14px',
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}
            >
            {/* 股票名称和代码 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F1419' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>{item.symbol}</div>
              </div>
              <div style={{
                padding: '4px 12px',
                background: getRankColor(item.rank),
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#0F1419',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.rank}
              </div>
            </div>

            {/* 交易策略和亏损信息 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '8px', background: '#ffffff', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>交易策略</div>
                <div style={{ color: '#0F1419', fontSize: '14px' }}>
                  {item.strategy}
                </div>
              </div>

                <div style={{ padding: '8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)' }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>亏损金额</div>
                  <div style={{ fontWeight: 'bold', color: '#EF4444', fontSize: '14px' }}>
                    -¥{item.loss.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#EF4444' }}>
                    {item.lossPercent}%
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const RiskModel = () => {
  const [selectedPosition, setSelectedPosition] = useState(null)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px', position: 'relative' }}>
        {/* 主内容区域 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.7fr 1.2fr', gridTemplateRows: '6fr 4fr', gap: '10px', marginTop: '10px', flex: 1, minHeight: 0, paddingBottom: '10px' }}>
          {/* 左上角：账户风险 */}
          <div style={{ gridColumn: '1 / 2', minHeight: 0, overflow: 'hidden' }}>
            <AccountRisk />
          </div>

          {/* 左下角：风险额度配置 */}
          <div style={{ gridColumn: '1 / 2', minHeight: 0, overflow: 'hidden' }}>
            <RiskConfig />
          </div>

          {/* 左侧：当前持仓 - 跨两行 */}
          <div style={{ gridRow: '1 / 3', gridColumn: '2 / 3', minHeight: 0, overflow: 'hidden' }}>
            <CurrentPositions
              selectedPosition={selectedPosition}
              onPositionSelect={setSelectedPosition}
            />
          </div>

          {/* 右下角：当月亏损策略排名 */}
          <div style={{ gridColumn: '3 / 4', gridRow: '1 / 3', minHeight: 0, overflow: 'hidden' }}>
            <StrategyRanking />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiskModel
