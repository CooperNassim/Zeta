import React, { useState, useEffect } from 'react'
import useStore, { apiCall } from '../store/useStore'
import { TrendingUp, TrendingDown, Shield, Activity, Target, Wallet, TrendingDown as RankingDown, Edit as EditIcon, AlertCircle } from 'lucide-react'
import Modal from '../components/Modal'
import CustomInput from '../components/CustomInput'
import ErrorMessage from '../components/ErrorMessage'
import Toast from '../components/Toast'
import EmptyState from '../components/EmptyState'

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 风险额度编辑弹窗
const RiskConfigModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [totalRiskPercent, setTotalRiskPercent] = useState(initialData.totalRiskPercent)
  const [singleRiskPercent, setSingleRiskPercent] = useState(initialData.singleRiskPercent)
  const [errors, setErrors] = useState({ totalRisk: false, singleRisk: false })

  // 监听 initialData 变化，更新 state
  useEffect(() => {
    if (isOpen) {
      setTotalRiskPercent(initialData.totalRiskPercent)
      setSingleRiskPercent(initialData.singleRiskPercent)
    }
  }, [isOpen, initialData])

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
            <span className="text-red-500">* </span>账户风险额度 (%)
          </label>
          <CustomInput
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={totalRiskPercent}
            onChange={handleTotalRiskChange}
            placeholder="请输入"
            error={errors.totalRisk}
          />
          {errors.totalRisk && <ErrorMessage />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">* </span>单笔风险额度 (%)
          </label>
          <CustomInput
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={singleRiskPercent}
            onChange={handleSingleRiskChange}
            placeholder="请输入"
            error={errors.singleRisk}
          />
          {errors.singleRisk && <ErrorMessage />}
        </div>
      </div>
    </Modal>
  )
}

// 风险额度配置
const RiskConfig = () => {
  const riskConfig = useStore(state => state.riskConfig)
  const updateRiskConfig = useStore(state => state.updateRiskConfig)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleSave = (data) => {
    // 默认更新 real 账户的风险配置
    updateRiskConfig('real', data)
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
            {riskConfig?.real?.totalRiskPercent || 6}%
          </div>
        </div>
        <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>单笔风险额度</div>
          <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '20px' }}>
            {riskConfig?.real?.singleRiskPercent || 2}%
          </div>
        </div>
      </div>

      <RiskConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={{ totalRiskPercent: riskConfig?.real?.totalRiskPercent || 6, singleRiskPercent: riskConfig?.real?.singleRiskPercent || 2 }}
        onSave={handleSave}
      />
      {showToast && <Toast type="success" message="保存成功" onClose={() => setShowToast(false)} />}
    </div>
  )
}

// 保存风险模型数据到数据库
const saveRiskModelData = async (startMonthTotal, accountAvailable, singleAvailable) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // 获取账单明细模块的总资产字段最新值
    const getTotalAssets = useStore.getState().getTotalAssets
    const currentTotalAssets = getTotalAssets ? getTotalAssets('real') : 0
    
    // 检查是否已有今天的数据记录
    const existingRecords = await apiCall('/api/account_risk_data')
    // 确保existingRecords是数组
    const recordsArray = Array.isArray(existingRecords) ? existingRecords : []
    const existingRecord = recordsArray.find(r => r.date === today)
    
    // 准备保存到数据库的数据 - 使用账单明细模块的总资产值
    const saveData = {
      date: today,
      start_month_total: startMonthTotal,
      account_available: accountAvailable,
      single_available: singleAvailable,
      snapshot_date: new Date().toISOString(),
      total_assets: currentTotalAssets // 取自账单明细模块的最新总资产值
    }

    if (existingRecord) {
      // 如果已有记录，更新数据
      await apiCall(`/api/account_risk_data/${existingRecord.id}`, 'PUT', saveData)
      console.log('风险模型数据更新成功:', saveData)
    } else {
      // 如果没有记录，创建新数据
      await apiCall('/api/account_risk_data', 'POST', saveData)
      console.log('风险模型数据创建成功:', saveData)
    }
  } catch (error) {
    console.error('保存风险模型数据失败:', error)
  }
}

// 风险仪表盘组件
const RiskGauge = ({ value, label, riskLimitPercentage = 5 }) => {
  const percentage = Math.min(Math.max(value, 0), 100)
  const circumference = 2 * Math.PI * 50
  const offset = circumference - (percentage / 100) * circumference
  
  // 计算风险比例：已用额度百分比 ÷ 风险额度百分比
  const riskRatio = (percentage / riskLimitPercentage) * 100
  
  // 根据风险比例设置颜色
  const color = riskRatio >= 66 ? '#EF4444' : riskRatio >= 33 ? '#F59E0B' : '#22c55e'

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
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: color, lineHeight: '1', marginBottom: '2px' }}>
              {Math.round(percentage * 100) / 100}%
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>{label}</div>
    </div>
  )
}

// 股票持仓中组件
const CurrentPositions = ({ selectedPosition, onPositionSelect }) => {
  const tradeRecords = useStore(state => state.tradeRecords)
  
  // 筛选交易状态=持仓中的股票，按买入时间降序排列
  const positions = tradeRecords
    .filter(r => !r.deleted) // 排除已删除的记录
    .filter(r => {
      const sellQty = parseFloat(r.sellQuantity) || 0
      const buyQty = parseFloat(r.buyQuantity) || 0
      return sellQty < buyQty // 持仓中状态
    })
    .sort((a, b) => {
      // 按买入时间降序排列（最新的在前面）
      const dateA = new Date(a.buyDate || a.createdAt || a.tradeTime || '1970-01-01')
      const dateB = new Date(b.buyDate || b.createdAt || b.tradeTime || '1970-01-01')
      return dateB - dateA
    })
    .map((record, index) => {
      // 获取实际买入价、止盈价和止损价
      const buyPrice = parseFloat(record.buyPrice) || parseFloat(record.actualBuyPrice) || 0
      const takeProfitPrice = parseFloat(record.takeProfitPrice) || parseFloat(record.takeProfit) || 0
      const stopLossPrice = parseFloat(record.stopLossPrice) || parseFloat(record.stopLoss) || 0
      
      // 计算距离止盈和止损的百分比
      let distanceToTakeProfit = 0
      let distanceToStopLoss = 0
      
      if (buyPrice > 0) {
        if (takeProfitPrice > 0) {
          distanceToTakeProfit = ((takeProfitPrice - buyPrice) / buyPrice) * 100
        }
        if (stopLossPrice > 0) {
          distanceToStopLoss = ((buyPrice - stopLossPrice) / buyPrice) * 100
        }
      }
      
      return {
        id: record.id || index,
        symbol: record.symbol || '',
        name: record.name || '',
        riskAmount: parseFloat(record.riskAmount) || parseFloat(record.buyAmount) || 0,
        riskPercent: parseFloat(record.riskPercent) || 0,
        profitLoss: 0, // 暂时默认为0，后续接入行情信息后再计算
        profitLossPercent: 0, // 暂时默认为0，后续接入行情信息后再计算
        distanceToStopLoss: distanceToStopLoss,
        distanceToTakeProfit: distanceToTakeProfit,
        scheduleTime: record.buyDate || record.createdAt || record.tradeTime || ''
      }
    })

  if (!selectedPosition && positions.length > 0) {
    selectedPosition = positions[0] // 默认选中最新的持仓
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
        <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0 }}>股票持仓中</h3>
        <span style={{ fontSize: '12px', color: '#666' }}>({positions.length}只)</span>
      </div>

      {/* 持仓列表 - 垂直平铺，可滚动 */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {positions.length === 0 ? (
            <EmptyState message="暂无数据" height="100%" />
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
                  {pos.riskAmount.toLocaleString()}
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
                    {pos.profitLoss >= 0 ? '+' : '-'}{Math.abs(pos.profitLoss).toLocaleString()}
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
                  {pos.distanceToTakeProfit ? pos.distanceToTakeProfit.toFixed(2) : '0.00'}%
                </div>
                <div style={{ width: '100%', background: '#E5E7EB', borderRadius: '9999px', height: '4px' }}>
                  <div
                    style={{
                      background: '#22c55e',
                      height: '4px',
                      borderRadius: '9999px',
                      width: `${Math.min((pos.distanceToTakeProfit || 0) * 10, 100)}%`
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '8px', background: '#ffffff', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>
                  距离止损
                </div>
                <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px', marginBottom: '4px' }}>
                  {pos.distanceToStopLoss ? pos.distanceToStopLoss.toFixed(2) : '0.00'}%
                </div>
                <div style={{ width: '100%', background: '#E5E7EB', borderRadius: '9999px', height: '4px' }}>
                  <div
                    style={{
                      background: '#EF4444',
                      height: '4px',
                      borderRadius: '9999px',
                      width: `${Math.min((pos.distanceToStopLoss || 0) * 10, 100)}%`
                    }}
                  />
                </div>
              </div>
              </div>

              <div style={{ fontSize: '11px', color: '#999', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                买入时间: {formatDate(pos.scheduleTime)}
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
  const accountRiskData = useStore(state => state.accountRiskData)
  const getTotalAssets = useStore(state => state.getTotalAssets)
  const getHoldingOccupancy = useStore(state => state.getHoldingOccupancy)
  const currentTotalAssets = getTotalAssets('real')
  const holdingOccupancy = getHoldingOccupancy()
  
  // 获取交易记录来计算本月亏损（交易状态为结束且盈亏金额为负数的绝对值总和）
  const tradeRecords = useStore(state => state.tradeRecords)
  const transactions = useStore(state => state.transactions)
  
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // 计算本月亏损股票：卖出时间为本月且盈亏金额为负数的绝对值总和
  const monthlyLossFiltered = tradeRecords
    .filter(r => !r.deleted) // 排除已删除的记录
    .filter(r => r.tradeStatus === '结束') // 只包含状态为"结束"的记录
    .filter(r => {
      // 1. 卖出时间=当月：使用卖出时间来判断月份（亏损在卖出时确定）
      // 优先使用明确的卖出时间字段
      const sellDateStr = r.sellDate || r.sellTime
      if (!sellDateStr) {
        // 如果没有明确的卖出时间，跳过这条记录
        return false
      }
      const sellDate = new Date(sellDateStr)
      if (isNaN(sellDate.getTime())) {
        // 如果日期无效，跳过这条记录
        return false
      }
      
      // 确保是当前月份
      const isCurrentMonth = sellDate.getMonth() === currentMonth && sellDate.getFullYear() === currentYear
      if (!isCurrentMonth) {
        return false
      }

      // 2. 盈亏金额为负数：亏损记录
      const profit = parseFloat(r.profit) || 0
      const isLoss = profit < 0

      return isCurrentMonth && isLoss
    })
    // 按交易编号去重，确保每个交易编号只计算一次
    .reduce((acc, r) => {
      if (!acc[r.tradeNumber]) {
        acc[r.tradeNumber] = r
      }
      return acc
    }, {})

  // 转换为数组
  const monthlyLossFilteredArray = Object.values(monthlyLossFiltered)

  const monthlyLoss = monthlyLossFilteredArray.reduce((sum, r) => sum + Math.abs(parseFloat(r.profit) || 0), 0)
    
  // 只使用实盘数据（用于计算月初账户总额）
  const currentTransactions = transactions
  
  // 计算月初账户（上月总资产）值：与账单明细逻辑相同
  // 获取上月最后一笔交易记录的余额作为上月总资产
  const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)
  
  const lastMonthTransactions = currentTransactions
    .filter(t => {
      const date = new Date(t.createdAt || t.created_at || t.buyDate || t.buyTime)
      return !t.deleted && date && date <= lastMonthEnd
    })
    .sort((a, b) => new Date(b.createdAt || b.created_at || b.buyDate || b.buyTime) - new Date(a.createdAt || a.created_at || a.buyDate || a.buyTime)) // 按时间倒序，最新的在前
  
  // 使用上月最后一笔交易的余额作为上月总资产基准值
  const startMonthTotal = lastMonthTransactions.length > 0 
    ? (lastMonthTransactions[0].balance || 0)
    : 0

  // 计算已用额度（本月亏损 + 持仓风险）
  const usedRiskAmount = monthlyLoss + holdingOccupancy
  
  // 计算已用额度百分比（(本月亏损 + 持仓风险) / 月初账户）
  const usedRiskPercentage = (usedRiskAmount / startMonthTotal) * 100
  
  // 风险额度百分比（从风险配置数据获取）
  const riskConfig = useStore(state => state.riskConfig)
  const riskLimitPercentage = riskConfig?.real?.totalRiskPercent || 5
  
  // 计算账户可用额度（月初账户总额 × 账户风险额度百分比 - 已用额度）
  const accountAvailable = (startMonthTotal * (riskLimitPercentage / 100)) - usedRiskAmount
  
  // 计算单笔可用额度（月初账户总额 × 单笔风险额度百分比）
  const singleAvailable = startMonthTotal * (accountRiskData.singleRiskPercent || 2) / 100
  
  // 格式化金额：整数取整，有小数点取2位四舍五入，千位分隔符
  const formatAmount = (amount) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '0'
    
    if (Number.isInteger(num)) {
      return num.toLocaleString('zh-CN')
    } else {
      const roundedAmount = Math.round(num * 100) / 100
      return roundedAmount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }
  
  // 保存风险模型数据到数据库
  useEffect(() => {
    if (startMonthTotal > 0 && accountAvailable >= 0 && singleAvailable >= 0) {
      // 保存时取整
      const savedAccountAvailable = Math.round(accountAvailable)
      const savedSingleAvailable = Math.round(singleAvailable)
      
      // 计算当前账户（总资产）
      const currentAccount = startMonthTotal - monthlyLoss
      
      // 计算风险比例（已用额度 / 月初账户）
      const riskRatio = (usedRiskAmount / startMonthTotal) * 100
      
      // 更新 store 中的 accountRiskData
      useStore.getState().updateAccountRiskData({
        monthlyLoss: Math.round(monthlyLoss),
        startMonthTotal: startMonthTotal,
        currentAccount: Math.round(currentAccount),
        riskRatio: Math.round(riskRatio * 100) / 100,
        accountAvailable: savedAccountAvailable,
        singleAvailable: savedSingleAvailable
      })
      
      saveRiskModelData(startMonthTotal, savedAccountAvailable, savedSingleAvailable)
    }
  }, [startMonthTotal, accountAvailable, singleAvailable, monthlyLoss, usedRiskAmount])

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
        <div style={{ flexShrink: 0, marginTop: '-10px', marginBottom: '10px' }}>
           <RiskGauge 
             value={usedRiskPercentage} 
             label={`已用额度：${usedRiskAmount.toLocaleString()}`}
             riskLimitPercentage={riskLimitPercentage}
           />
        </div>
        <div style={{ marginTop: '12px', width: '100%', flex: 1, minHeight: 0 }}>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', rowGap: '10px' }}>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>总资产</div>
              <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '16px' }}>
                 {formatAmount(currentTotalAssets)}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>本月亏损</div>
              <div style={{ fontWeight: 'bold', color: '#EF4444', fontSize: '16px' }}>
                 {formatAmount(monthlyLoss)}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>月初账户</div>
              <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '16px' }}>
                 {formatAmount(startMonthTotal)}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>持仓风险</div>
              <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '16px' }}>
                 {formatAmount(holdingOccupancy)}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>账户可用</div>
              <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '16px' }}>
                {formatAmount(accountAvailable)}
              </div>
            </div>
            <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>单笔可用</div>
              <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '16px' }}>
                {formatAmount(singleAvailable)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 本月亏损股票组件
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
        <h3 style={{ fontWeight: 600, fontSize: '14px', color: '#0F1419' }}>本月亏损股票</h3>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#EF4444', marginBottom: '8px' }}>
            -{monthlyLossData.monthlyLoss.toLocaleString()}
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
            月初账户总额: {monthlyLossData.startMonthTotal.toLocaleString()}
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
            {availableRiskData.available.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            可用于新交易的风险额度
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
            <span>月初账户总额</span>
            <span>{availableRiskData.startMonthTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280' }}>
            <span>总账可用风险额度</span>
            <span>{availableRiskData.totalRiskPercent}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}>
            <span>- 持仓止损预亏</span>
            <span>-{availableRiskData.stopLossPreLoss.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}>
            <span>- 本月亏损股票</span>
            <span>-{availableRiskData.monthlyLoss.toLocaleString()}</span>
          </div>
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#0F1419' }}>
            <span>= 可用额度</span>
            <span>{availableRiskData.available.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 本月亏损股票组件
const StrategyRanking = () => {
  const tradeRecords = useStore(state => state.tradeRecords)
  const strategyRecords = useStore(state => state.strategyRecords)
  const orders = useStore(state => state.orders)
  
  // 获取当前年月
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // 当月亏损列表实时查询交易记录数据表
  
  const lossRankingsFiltered = tradeRecords
    .filter(r => !r.deleted) // 排除已删除的记录
    .filter(r => r.tradeStatus === '结束') // 只包含状态为"结束"的记录
    .filter(r => {
      // 1. 卖出时间=当月：使用卖出时间来判断月份（亏损在卖出时确定）
      // 优先使用明确的卖出时间字段
      const sellDateStr = r.sellDate || r.sellTime
      if (!sellDateStr) {
        // 如果没有明确的卖出时间，跳过这条记录
        return false
      }
      const sellDate = new Date(sellDateStr)
      if (isNaN(sellDate.getTime())) {
        // 如果日期无效，跳过这条记录
        return false
      }
      const isCurrentMonth = sellDate.getMonth() === currentMonth && sellDate.getFullYear() === currentYear

      // 2. 盈亏金额为负数：亏损记录
      // 优先使用r.profit，如果没有则计算：卖出金额 - 买入金额
      const profit = r.profit != null ? parseFloat(r.profit) : (r.sellAmount && r.buyAmount ? parseFloat(r.sellAmount) - parseFloat(r.buyAmount) : 0)
      const isLoss = profit < 0

      return isCurrentMonth && isLoss
    })
    // 按交易编号去重
    .reduce((acc, r) => {
      if (!acc[r.tradeNumber]) {
        acc[r.tradeNumber] = r
      }
      return acc
    }, {})

  // 转换为数组并排序
  const lossRankingsArray = Object.values(lossRankingsFiltered)
    .sort((a, b) => {
      // 按亏损金额降序排列（亏损多的排在前面）
      const profitA = parseFloat(a.profit) || 0
      const profitB = parseFloat(b.profit) || 0
      return profitA - profitB // 降序排列（负数比较：-20000 < -10000，所以-20000排在前面）
    })
    .map((record, index) => {
      // 获取买入策略名称：从同一交易编号的买入订单获取，与交易记录-买入详情保持一致
      let strategyName = '-'
      
      // 从同一交易编号的买入订单获取策略ID
      const buyOrder = orders.find(o => String(o.id) === String(record.buyOrderId))
      const buyOrdersOfSameTrade = orders.filter(o => o.tradeNumber === record.tradeNumber && o.type === 'buy')
      const firstBuyOrderWithStrategy = buyOrdersOfSameTrade.find(o => o.strategyId)
      
      // 使用 strategyRecords 查找策略名称
      const buyStrategiesList = strategyRecords || []
      const strategyIdToUse = buyOrder?.strategyId || firstBuyOrderWithStrategy?.strategyId || record.buyStrategyId
      
      if (strategyIdToUse) {
        const strategy = buyStrategiesList.find(s => String(s.id) === String(strategyIdToUse))
        strategyName = strategy ? strategy.name : '-'
      } else if (record.strategyId) {
        const strategy = strategyRecords.find(s => s.id === record.strategyId)
        strategyName = strategy ? strategy.name : '-'
      } else if (record.buyStrategy) {
        // 如果策略ID为空，但buyStrategy字段有内容，直接使用这个字段
        strategyName = record.buyStrategy || '-'
      } else if (record.strategy) {
        // 尝试从strategy字段获取（兼容更早的字段名）
        strategyName = record.strategy || '-'
      } else if (record.trading_strategy) {
        // 尝试从trading_strategy字段获取
        strategyName = record.trading_strategy || '-'
      } else {
        // 所有策略字段都为空，显示-
        strategyName = '-'
      }
      
      return {
        rank: index + 1,
        symbol: record.symbol || '',              // 股票代码
        name: record.name || '',                  // 股票名称
        strategy: strategyName,                   // 买入策略（直接从交易记录获取）
        loss: Math.abs(parseFloat(record.profit) || 0),      // 盈亏金额（取绝对值）
        lossPercent: Math.abs(parseFloat(record.profitPercent) || 0) // 盈亏比例（取绝对值）
      }
    })

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
        <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0 }}>本月亏损股票</h3>
        <span style={{ fontSize: '12px', color: '#666' }}>({lossRankingsArray.length}只)</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {lossRankingsArray.length === 0 ? (
          <EmptyState message="暂无数据" height="100%" />
        ) : (
          lossRankingsArray.map((item, index) => (
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
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>买入策略</div>
                <div style={{ color: '#0F1419', fontSize: '14px' }}>
                  {item.strategy}
                </div>
              </div>

                <div style={{ padding: '8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)' }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>亏损金额</div>
                  <div style={{ fontWeight: 'bold', color: '#EF4444', fontSize: '14px' }}>
                    -{item.loss.toLocaleString()}
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
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '0px', paddingRight: '10px', position: 'relative' }}>
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

          {/* 右下角：本月亏损股票策略排名 */}
          <div style={{ gridColumn: '3 / 4', gridRow: '1 / 3', minHeight: 0, overflow: 'hidden' }}>
            <StrategyRanking />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiskModel
