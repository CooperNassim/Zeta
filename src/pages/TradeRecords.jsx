import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import DateRangePicker from '../components/DateRangePicker'
import FilterSelect from '../components/FilterSelect'
import SearchInput from '../components/SearchInput'
import ExportModal from '../components/ExportModal'
import FormModal from '../components/FormModal'
import Modal from '../components/Modal'
import Toolbar from '../components/Toolbar'
import ErrorMessage from '../components/ErrorMessage'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import ExcelJS from 'exceljs'
import { useToast } from '../contexts/ToastContext'

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

// 格式化金额，整数取整，有小数点保留小数点后2位四舍五入，使用千位分隔符
const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '-'
  const num = parseFloat(amount)
  if (isNaN(num)) return '-'
  const rounded = Math.round(num * 100) / 100
  const isInteger = Number.isInteger(rounded)
  const formatted = isInteger ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return formatted
}

// 格式化价格，整数显示整数，小数正常显示小数
const formatPrice = (price) => {
  if (price === null || price === undefined) return '-'
  const num = parseFloat(price)
  if (isNaN(num)) return '-'
  const rounded = Math.round(num * 100) / 100
  if (Number.isInteger(rounded)) {
    return rounded.toLocaleString('en-US')
  }
  return rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 格式化滑点，整数取整，有小数点显示2位小数四舍五入
const formatSlippage = (slippage) => {
  if (slippage === null || slippage === undefined) return '-'
  const num = parseFloat(slippage)
  if (isNaN(num)) return '-'
  const rounded = Math.round(num * 100) / 100
  if (Number.isInteger(rounded)) {
    return rounded.toLocaleString('en-US')
  }
  return rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 格式化费用，整数取整，小数保留2位（用于输入框显示）
const formatFee = (fee) => {
  if (fee === null || fee === undefined || fee === '') return ''
  const num = parseFloat(fee)
  if (isNaN(num)) return ''
  const rounded = Math.round(num * 100) / 100
  if (Number.isInteger(rounded)) {
    return String(rounded)
  }
  return rounded.toFixed(2)
}

// 解析价格（支持千位分隔符格式）
const parsePrice = (value) => {
  if (value === '' || value === null) return null
  if (typeof value !== 'string') return value != null ? parseFloat(value) : null
  // 移除千位分隔符和其他非数字字符（保留小数点）
  const cleaned = value.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

// 格式化佣金/费用用于显示：整数取整，有小数点取小数点2位四舍五入
const formatFeeForDisplay = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const num = parseFloat(value)
  if (isNaN(num)) return ''
  const rounded = Math.round(num * 100) / 100
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2)
}

const TradeRecords = () => {
  const { showToast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFilter] = useState('all')
  const [filterSymbol, setFilterSymbol] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterTradeId, setFilterTradeId] = useState('')
  const [filterOverallScore, setFilterOverallScore] = useState('')
  const [filterTradeStatus, setFilterTradeStatus] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [selectedIds, setSelectedIds] = useState([])
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [showBuyDetailModal, setShowBuyDetailModal] = useState(false)
  const [showSellDetailModal, setShowSellDetailModal] = useState(false)
  const [summaryFormData, setSummaryFormData] = useState({})
  const [summaryFormErrors, setSummaryFormErrors] = useState({})
  const [buyDetailFormData, setBuyDetailFormData] = useState({})
  const [buyDetailFormErrors, setBuyDetailFormErrors] = useState({})
  const [sellDetailFormData, setSellDetailFormData] = useState({})
  const [sellDetailFormErrors, setSellDetailFormErrors] = useState({})
  const [editingTradeId, setEditingTradeId] = useState(null)
  const [detailRecord, setDetailRecord] = useState(null)
  const pageSize = 20

  // 筛选条件改变时清空选中状态
  const handleFilterChange = (setter) => (value) => {
    setter(value)
    setSelectedIds([])
    setCurrentPage(1)
  }

  const tradeRecords = useStore(state => state.tradeRecords)
  const updateTradeRecord = useStore(state => state.updateTradeRecord)
  const strategyRecords = useStore(state => state.strategyRecords)
  const strategies = useStore(state => state.strategies)
  const orders = useStore(state => state.orders)

  // 筛选交易记录
  const filteredRecords = (() => {
    // 先过滤删除标记
    let result = tradeRecords.filter(r => !r.deleted)

    // 盈亏筛选
    switch (selectedFilter) {
      case 'profit':
        result = result.filter(r => parseFloat(r.profit) > 0)
        break
      case 'loss':
        result = result.filter(r => parseFloat(r.profit) < 0)
        break
      case 'all':
      default:
        break
    }

    // 股票代码模糊搜索
    if (filterSymbol) {
      result = result.filter(r => r.symbol.toLowerCase().includes(filterSymbol.toLowerCase()))
    }

    // 股票名称模糊搜索
    if (filterName) {
      result = result.filter(r => r.name.toLowerCase().includes(filterName.toLowerCase()))
    }

    // 交易编号筛选
    if (filterTradeId) {
      result = result.filter(r => r.tradeNumber && r.tradeNumber.toString().includes(filterTradeId))
    }

    // 交易评级筛选
    if (filterOverallScore) {
      result = result.filter(r => {
        const score = parseFloat(r.overallScore)
        let grade = ''
        if (score >= 90) grade = 'A'
        else if (score >= 80) grade = 'B'
        else if (score >= 70) grade = 'C'
        else if (score >= 0) grade = 'D'
        return grade === filterOverallScore
      })
    }

    // 交易状态筛选
    if (filterTradeStatus) {
      result = result.filter(r => {
        const sellQty = parseFloat(r.sellQuantity) || 0
        const buyQty = parseFloat(r.buyQuantity) || 0
        if (filterTradeStatus === 'holding') {
          return sellQty < buyQty
        } else if (filterTradeStatus === 'finished') {
          return sellQty >= buyQty
        }
        return true
      })
    }

    // 按交易编号合并记录，同一交易编号只显示一条记录
    // 注意：买入记录和卖出记录需要分别处理，不能整体覆盖
    const mergedRecordsMap = new Map()

    // 处理未删除的记录
    result.forEach(r => {
      if (!r.deleted) {
        if (mergedRecordsMap.has(r.tradeNumber)) {
          const existing = mergedRecordsMap.get(r.tradeNumber)
          // 区分买入记录和卖出记录，更新对应类型的字段
          // 关键：不管 existing 是什么类型，都应该更新对应类型的字段
          // 这样合并后的记录会同时包含买入和卖出字段
          if (r.buy_order_id || r.buyOrderId) {
            // 买入记录：更新买入相关字段
            existing.buyOrderId = r.buyOrderId
            existing.buyPrice = r.buyPrice
            existing.buyQuantity = r.buyQuantity
            existing.buyTime = r.buyTime
            existing.buyOrderPrice = r.buyOrderPrice
            existing.buyOrderTime = r.buyOrderTime
            existing.buyPsychologicalScore = r.buyPsychologicalScore
            existing.buyStrategyScore = r.buyStrategyScore
            existing.buyStrategyId = r.buyStrategyId
            existing.buyGrade = r.buyGrade
            existing.buyAmount = r.buyAmount
            existing.buyChannel = r.buyChannel
            existing.tradeCommission = r.tradeCommission
            existing.otherFees = r.otherFees
          }
          if (r.sell_order_id || r.sellOrderId) {
            // 卖出记录：更新卖出相关字段
            existing.sellOrderId = r.sellOrderId
            existing.sellPrice = r.sellPrice
            existing.sellQuantity = r.sellQuantity
            existing.sellTime = r.sellTime
            existing.sellOrderPrice = r.sellOrderPrice
            existing.sellOrderTime = r.sellOrderTime
            existing.sellPsychologicalScore = r.sellPsychologicalScore
            existing.sellStrategyScore = r.sellStrategyScore
            existing.sellStrategyId = r.sellStrategyId
            existing.sellGrade = r.sellGrade
            existing.sellChannel = r.sellChannel
            existing.sellAmount = r.sellAmount
            existing.profit = r.profit
            existing.profitPercent = r.profitPercent
            existing.holdDuration = r.holdDuration
            existing.sellTradeCommission = r.sellTradeCommission
            existing.sellOtherFees = r.sellOtherFees
          }
          // 保留原有的通用字段（tradeSummary等）
          if (r.tradeSummary && !existing.tradeSummary) {
            existing.tradeSummary = r.tradeSummary
          }
          if (!existing.createdAt && r.createdAt) {
            existing.createdAt = r.createdAt
          }
          if (!existing.overallScore && r.overallScore) {
            existing.overallScore = r.overallScore
          }
        } else {
          // 新增记录
          mergedRecordsMap.set(r.tradeNumber, { ...r })
        }
      }
    })

    // 再处理已删除的记录，只为了补齐缺失的关联信息
    result.forEach(r => {
      if (r.deleted && mergedRecordsMap.has(r.tradeNumber)) {
        const existing = mergedRecordsMap.get(r.tradeNumber)
        
        // 如果现有记录缺失买入信息，从删除记录补充
        if (r.buyTime && !existing.buyTime) {
          Object.assign(existing, {
            buyOrderId: r.buyOrderId,
            buyPrice: r.buyPrice,
            buyQuantity: r.buyQuantity,
            buyTime: r.buyTime,
            buyOrderPrice: r.buyOrderPrice,
            buyOrderTime: r.buyOrderTime,
            buyPsychologicalScore: r.buyPsychologicalScore,
            buyStrategyScore: r.buyStrategyScore,
            buyStrategyId: r.buyStrategyId,
            buyGrade: r.buyGrade,
            buyAmount: r.buyAmount,
            buyChannel: r.buyChannel,
            tradeCommission: r.tradeCommission,
            otherFees: r.otherFees
          })
        }
        
        // 如果现有记录缺失卖出信息，从删除记录补充
        if (r.sellTime && !existing.sellTime) {
          Object.assign(existing, {
            sellOrderId: r.sellOrderId,
            sellPrice: r.sellPrice,
            sellQuantity: r.sellQuantity,
            sellTime: r.sellTime,
            sellOrderPrice: r.sellOrderPrice,
            sellOrderTime: r.sellOrderTime,
            sellPsychologicalScore: r.sellPsychologicalScore,
            sellStrategyScore: r.sellStrategyScore,
            sellStrategyId: r.sellStrategyId,
            sellGrade: r.sellGrade,
            sellChannel: r.sellChannel,
            sellAmount: r.sellAmount,
            profit: r.profit,
            profitPercent: r.profitPercent,
            holdDuration: r.holdDuration,
            sellTradeCommission: r.sellTradeCommission,
            sellOtherFees: r.sellOtherFees
          })
        }
        
        // 优先保留现有记录的时间信息，不覆盖
        if (!existing.createdAt && r.createdAt) existing.createdAt = r.createdAt
        if (!existing.overallScore && r.overallScore) existing.overallScore = r.overallScore
        if (r.tradeSummary && !existing.tradeSummary) {
          existing.tradeSummary = r.tradeSummary
        }
      }
    })

    // 转换为数组并按时间降序排序
    const mergedRecords = Array.from(mergedRecordsMap.values())

    // 调试：查看合并后的数据
    console.log('🔍 [Debug Merge] 合并后 tradeNumber=20260422026 的记录:');
    const merged20260422026 = mergedRecords.find(r => r.tradeNumber === '20260422026');
    if (merged20260422026) {
      console.log('   - id:', merged20260422026.id);
      console.log('   - buyPrice:', merged20260422026.buyPrice);
      console.log('   - sellPrice:', merged20260422026.sellPrice);
      console.log('   - buyOrderId:', merged20260422026.buyOrderId);
      console.log('   - sellOrderId:', merged20260422026.sellOrderId);
    } else {
      console.log('   - 未找到 tradeNumber=20260422026 的记录');
    }

    // 最终过滤掉依然标记为删除的记录（可能是只有删除记录的交易）
    const finalRecords = mergedRecords.filter(r => !r.deleted)
    finalRecords.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    return finalRecords
  })()

  const totalPages = Math.ceil(filteredRecords.length / pageSize)
  const paginatedData = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSelectAll = (ids) => {
    setSelectedIds(ids)
  }

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    }
  }

  const handleEditSummary = () => {
    console.log('[Debug] handleEditSummary - selectedIds:', selectedIds)
    if (selectedIds.length !== 1) return

    const tradeId = selectedIds[0]
    setEditingTradeId(tradeId)

    // 从 filteredRecords 中读取现有数据（filteredRecords 是合并后的记录，包含所有字段）
    const currentRecord = filteredRecords.find(r => r.id === tradeId)
    if (currentRecord) {
      // 实际卖出价：优先使用 actualSellPrice（用户录入的券商成交价）
      // 没有时从 trade_orders 实时计算（和卖出详情弹窗保持一致）
      const sellOrders = orders.filter(o => o.tradeNumber === currentRecord.tradeNumber && o.type === 'sell' && !o.deleted)
      let calculatedSellPrice = null
      if (sellOrders.length === 1) {
        calculatedSellPrice = parseFloat(sellOrders[0].price) || null
      } else if (sellOrders.length > 1) {
        let totalAmount = 0
        let totalQuantity = 0
        sellOrders.forEach(o => {
          totalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
          totalQuantity += parseFloat(o.quantity) || 0
        })
        calculatedSellPrice = totalQuantity > 0 ? totalAmount / totalQuantity : null
      }

      const effectiveSellPrice = currentRecord.actualSellPrice != null ? currentRecord.actualSellPrice : calculatedSellPrice

      // 格式化价格字段：整数取整，有小数点取小数点2位四舍五入
      const formatField = (val) => {
        if (val === null || val === undefined || val === '') return ''
        const num = parseFloat(val)
        if (isNaN(num)) return ''
        const rounded = Math.round(num * 100) / 100
        return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
      }

      setSummaryFormData({
        buyPrice: formatField(currentRecord.buyPrice),
        tradeCommission: formatField(currentRecord.tradeCommission),
        otherFees: formatField(currentRecord.otherFees),
        sellPrice: formatField(effectiveSellPrice),
        sellTradeCommission: formatField(currentRecord.sellTradeCommission),
        sellOtherFees: formatField(currentRecord.sellOtherFees),
        upperBand: formatField(currentRecord.upperBand),
        lowerBand: formatField(currentRecord.lowerBand),
        tradeSummary: currentRecord.tradeSummary || ''
      })
    } else {
      console.log('[Debug] handleEditSummary - record not found, using empty values')
      setSummaryFormData({
        buyPrice: '',
        tradeCommission: '',
        otherFees: '',
        sellPrice: '',
        sellTradeCommission: '',
        sellOtherFees: '',
        upperBand: '',
        lowerBand: '',
        tradeSummary: ''
      })
    }
    setSummaryFormErrors({})
    setShowSummaryModal(true)
  }

  const handleSummaryFormSubmit = async (e) => {
    e.preventDefault()

    const errors = {}
    SUMMARY_FIELDS.forEach(field => {
      // 仅验证必填字段
      if (field.required) {
        const value = summaryFormData[field.key]
        // 检查值是否存在且不为空字符串
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || value === '') {
          errors[field.key] = '不能为空'
        }
      }
    })

    if (Object.keys(errors).length > 0) {
      setSummaryFormErrors(errors)
      return
    }

    try {
      // 获取当前记录（新模型：每个交易编号只有一条记录）
      const currentRecord = filteredRecords.find(r => r.id === editingTradeId)
      if (!currentRecord) {
        showToast('记录不存在', 'error')
        return
      }

      // 更新单条记录，同时包含买入和卖出字段
      const buyPrice = summaryFormData.buyPrice != null && summaryFormData.buyPrice !== '' ? parsePrice(summaryFormData.buyPrice) : null
      const sellPrice = summaryFormData.sellPrice != null && summaryFormData.sellPrice !== '' ? parsePrice(summaryFormData.sellPrice) : null

      // 计算数量：从实际订单获取，而不是用可能过时的 sell_quantity 字段
      const tradeNum = currentRecord.tradeNumber || currentRecord.trade_number
      const actualBuyOrders = (orders || []).filter(o => (o.tradeNumber === tradeNum || o.trade_number === tradeNum) && (o.type === 'buy' || o.order_type === '买入') && !o.deleted)
      const actualSellOrders = (orders || []).filter(o => (o.tradeNumber === tradeNum || o.trade_number === tradeNum) && (o.type === 'sell' || o.order_type === '卖出') && !o.deleted)
      
      const buyQuantity = actualBuyOrders.reduce((sum, o) => sum + (parseFloat(o.quantity) || 0), 0) || parseFloat(currentRecord.buy_quantity || currentRecord.quantity || 0)
      const sellQuantity = actualSellOrders.reduce((sum, o) => sum + (parseFloat(o.quantity) || 0), 0) || parseFloat(currentRecord.sell_quantity || 0)
      
      const newBuyAmount = (buyPrice !== null && buyQuantity > 0) ? -(buyPrice * buyQuantity) : null
      const newSellAmount = (sellPrice !== null && sellQuantity > 0) ? (sellPrice * sellQuantity) : null

      // 重新计算盈亏金额和盈亏比例
      // 盈亏 = 卖出金额 - 买入金额（两个都是正数）
      const absBuyAmount = newBuyAmount !== null ? Math.abs(newBuyAmount) : null
      const profitValue = (absBuyAmount !== null && newSellAmount !== null) ? newSellAmount - absBuyAmount : 0
      const profitPercentValue = (absBuyAmount !== null && absBuyAmount > 0 && newSellAmount !== null) ? ((newSellAmount - absBuyAmount) / absBuyAmount * 100) : 0

      // 计算净盈亏额和净盈亏比（扣除手续费）
      const tradeCommission = summaryFormData.tradeCommission != null && summaryFormData.tradeCommission !== '' ? parseFloat(summaryFormData.tradeCommission.trim()) : 0
      const otherFees = summaryFormData.otherFees != null && summaryFormData.otherFees !== '' ? parseFloat(summaryFormData.otherFees.trim()) : 0
      const sellTradeCommission = summaryFormData.sellTradeCommission != null && summaryFormData.sellTradeCommission !== '' ? parseFloat(summaryFormData.sellTradeCommission.trim()) : 0
      const sellOtherFees = summaryFormData.sellOtherFees != null && summaryFormData.sellOtherFees !== '' ? parseFloat(summaryFormData.sellOtherFees.trim()) : 0
      const totalFees = tradeCommission + sellTradeCommission + otherFees + sellOtherFees
      const netProfitValue = profitValue - totalFees
      const netProfitPercentValue = (absBuyAmount !== null && absBuyAmount > 0) ? (netProfitValue / absBuyAmount * 100) : 0

      // 计算滑点 = 买入滑点 + 卖出滑点
      // 理想买入价 = 订单的加权平均价（从 orders 数组计算）
      // 理想卖出价 = 订单的加权平均价（从 orders 数组计算）
      let buySlippageValue = 0
      let sellSlippageValue = 0
      if (sellQuantity > 0) {
        // 从 orders 中计算买入订单的加权平均价
        const buyOrdersForSlippage = orders.filter(o => (o.tradeNumber === tradeNum || o.trade_number === tradeNum) && o.type === 'buy' && !o.deleted)
        const sellOrdersForSlippage = orders.filter(o => (o.tradeNumber === tradeNum || o.trade_number === tradeNum) && o.type === 'sell' && !o.deleted)

        let buyOrdersTotalAmount = 0
        let buyOrdersTotalQuantity = 0
        buyOrdersForSlippage.forEach(o => {
          buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
          buyOrdersTotalQuantity += parseFloat(o.quantity) || 0
        })
        const idealBuyPrice = buyOrdersTotalQuantity > 0 ? buyOrdersTotalAmount / buyOrdersTotalQuantity : 0

        let sellOrdersTotalAmount = 0
        let sellOrdersTotalQuantity = 0
        sellOrdersForSlippage.forEach(o => {
          sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
          sellOrdersTotalQuantity += parseFloat(o.quantity) || 0
        })
        const idealSellPrice = sellOrdersTotalQuantity > 0 ? sellOrdersTotalAmount / sellOrdersTotalQuantity : 0

        // 买入滑点 = (理想买入价 - 实际买入价) × 卖出数量
        buySlippageValue = (idealBuyPrice - (buyPrice || 0)) * sellQuantity
        // 卖出滑点 = (实际卖出价 - 理想卖出价) × 卖出数量
        sellSlippageValue = ((sellPrice || 0) - idealSellPrice) * sellQuantity
      }
      const slippageValue = buySlippageValue + sellSlippageValue

      // 计算滑净盈比 = 滑点 / |净盈亏额| × 100%
      const slippageNetProfitRatioValue = (netProfitValue !== 0) ? (slippageValue / Math.abs(netProfitValue) * 100) : 0

      // === 评级字段计算框架（预留，等待行情数据接入后启用） ===
      // 买入评级、卖出评级、交易评级需要行情数据（当天最高价/最低价/通道上下轨）
      // 目前数据表中对应的 buy_high_price、buy_low_price、sell_high_price、sell_low_price、upper_band、lower_band 字段为空
      // 未来接入行情数据后，在此处取消注释并实现计算逻辑
      
      // TODO: 行情数据接入后实现以下计算
      // const buyHighPrice = null // 从行情数据获取买入当天最高价
      // const buyLowPrice = null  // 从行情数据获取买入当天最低价
      // const sellHighPrice = null // 从行情数据获取卖出当天最高价
      // const sellLowPrice = null  // 从行情数据获取卖出当天最低价
      // const upperBand = null     // 从行情数据获取通道上轨
      // const lowerBand = null     // 从行情数据获取通道下轨
      
      // 买入评级计算（ABCD 归一化）
      // const buyGradeValue = (buyHighPrice && buyLowPrice && buyPrice && buyHighPrice !== buyLowPrice)
      //   ? (buyHighPrice - buyPrice) / (buyHighPrice - buyLowPrice) : null
      // const buyGrade = buyGradeValue != null
      //   ? (buyGradeValue >= 0.75 ? 'A' : buyGradeValue >= 0.5 ? 'B' : buyGradeValue >= 0.25 ? 'C' : 'D') : null

      // 卖出评级计算（ABCD 归一化）
      // const sellGradeValue = (sellHighPrice && sellLowPrice && sellPrice && sellHighPrice !== sellLowPrice)
      //   ? (sellPrice - sellLowPrice) / (sellHighPrice - sellLowPrice) : null
      // const sellGrade = sellGradeValue != null
      //   ? (sellGradeValue >= 0.75 ? 'A' : sellGradeValue >= 0.5 ? 'B' : sellGradeValue >= 0.25 ? 'C' : 'D') : null

      // 交易评级计算（ABCD 归一化）
      // const overallScoreValue = (sellPrice && buyPrice && upperBand && lowerBand && upperBand !== lowerBand)
      //   ? (sellPrice - buyPrice) / (upperBand - lowerBand) : null
      // const overallScore = overallScoreValue != null
      //   ? (overallScoreValue >= 0.75 ? 'A' : overallScoreValue >= 0.5 ? 'B' : overallScoreValue >= 0.25 ? 'C' : 'D') : null

      const updateRequest = {
        buy_price: buyPrice,
        trade_commission: summaryFormData.tradeCommission != null && summaryFormData.tradeCommission !== '' ? parseFloat(summaryFormData.tradeCommission.trim()) : null,
        other_fees: summaryFormData.otherFees != null && summaryFormData.otherFees !== '' ? parseFloat(summaryFormData.otherFees.trim()) : null,
        actual_sell_price: sellPrice,
        sell_trade_commission: summaryFormData.sellTradeCommission != null && summaryFormData.sellTradeCommission !== '' ? parseFloat(summaryFormData.sellTradeCommission.trim()) : null,
        sell_other_fees: summaryFormData.sellOtherFees != null && summaryFormData.sellOtherFees !== '' ? parseFloat(summaryFormData.sellOtherFees.trim()) : null,
        upper_band: summaryFormData.upperBand != null && summaryFormData.upperBand !== '' ? parseFloat(summaryFormData.upperBand.trim()) : null,
        lower_band: summaryFormData.lowerBand != null && summaryFormData.lowerBand !== '' ? parseFloat(summaryFormData.lowerBand.trim()) : null,
        trade_summary: summaryFormData.tradeSummary != null ? summaryFormData.tradeSummary.trim() : null,
        // 同时更新金额、盈亏、滑点字段
        buy_amount: newBuyAmount,
        sell_amount: newSellAmount,
        profit: Math.round(profitValue * 100) / 100,
        profit_percent: Math.round(profitPercentValue * 100) / 100,
        net_profit: Math.round(netProfitValue * 100) / 100,
        net_profit_percent: Math.round(netProfitPercentValue * 100) / 100,
        slippage: Math.round(slippageValue * 100) / 100,
        slippage_net_profit_ratio: Math.round(slippageNetProfitRatioValue * 100) / 100
      }

      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/trade_records/' + currentRecord.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updateRequest)
      }).then(res => res.json())

      if (response.success) {
        // === 更新账单明细：直接使用 trade_records 的 buy_amount 和 sell_amount 作为数据源 ===
        const tradeNumber = currentRecord.tradeNumber || currentRecord.trade_number
        const buyAmount = response.data?.buy_amount != null ? parseFloat(response.data.buy_amount) : null
        const sellAmount = response.data?.sell_amount != null ? parseFloat(response.data.sell_amount) : null

        // 获取所有账单明细
        const allTransactions = useStore.getState().transactions
        if (allTransactions && allTransactions.length > 0 && (buyAmount !== null || sellAmount !== null)) {
          // 找到当前交易编号相关的账单
          const relatedTransactions = allTransactions.filter(t =>
            (t.tradeNumber === tradeNumber || t.trade_number === tradeNumber) && !t.deleted
          )

          console.log('[交易结案] 找到', relatedTransactions.length, '条相关账单')

          // 按交易类型分组
          const buyTransactions = relatedTransactions.filter(t => {
            const tt = (t.type || t.transaction_type || '')
            return (tt === '买入' || tt === '股票买入') && !tt.includes('佣金') && !tt.includes('费用')
          })
          const sellTransactions = relatedTransactions.filter(t => {
            const tt = (t.type || t.transaction_type || '')
            return (tt === '卖出' || tt === '股票卖出') && !tt.includes('佣金') && !tt.includes('费用')
          })

          console.log('[交易结案] 买入账单', buyTransactions.length, '条，卖出账单', sellTransactions.length, '条')

          // 批量更新账单
          const updatePromises = []

          // 更新买入账单：将 buy_amount 按各买入账单的原始占比分配
          if (buyAmount !== null && buyTransactions.length > 0) {
            // 计算原始买入总金额（所有买入账单的 amount 绝对值之和）
            const originalBuyTotal = buyTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
            console.log('[交易结案] 原始买入总金额:', originalBuyTotal, '新买入金额:', buyAmount)

            if (originalBuyTotal > 0) {
              buyTransactions.forEach(t => {
                const originalAmount = Math.abs(parseFloat(t.amount) || 0)
                const ratio = originalAmount / originalBuyTotal
                const newAmount = buyAmount * ratio // buyAmount 已为负数

                updatePromises.push(
                  fetch('/api/transactions/' + t.id, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ total_price: newAmount })
                  }).then(res => res.json())
                    .then(r => console.log('[交易结案] 更新买入账单', t.id, ':', newAmount))
                    .catch(err => console.error('[交易结案] 更新失败', t.id, err))
                )
              })
            }
          }

          // 更新卖出账单：按股数比例分配总卖出金额
          if (sellAmount !== null && sellTransactions.length > 0) {
            // 计算总卖出股数
            const totalSellQuantity = sellTransactions.reduce((sum, t) => sum + (parseFloat(t.quantity) || 0), 0)
            console.log('[交易结案] 总卖出股数:', totalSellQuantity, '新卖出金额:', sellAmount)

            if (totalSellQuantity > 0) {
              sellTransactions.forEach(t => {
                const quantity = parseFloat(t.quantity) || 0
                const ratio = quantity / totalSellQuantity // 按股数占比分配
                const newAmount = sellAmount * ratio // 卖出为正

                updatePromises.push(
                  fetch('/api/transactions/' + t.id, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ total_price: newAmount })
                  }).then(res => res.json())
                    .then(r => console.log('[交易结案] 更新卖出账单', t.id, ':', newAmount))
                    .catch(err => console.error('[交易结案] 更新失败', t.id, err))
                )
              })
            }
          }

          await Promise.all(updatePromises)

          // === 新增/更新4种费用类型账单 ===
          const tradeCommission = summaryFormData.tradeCommission != null && summaryFormData.tradeCommission !== '' ? parseFloat(summaryFormData.tradeCommission.trim()) : null
          const otherFees = summaryFormData.otherFees != null && summaryFormData.otherFees !== '' ? parseFloat(summaryFormData.otherFees.trim()) : null
          const sellTradeCommission = summaryFormData.sellTradeCommission != null && summaryFormData.sellTradeCommission !== '' ? parseFloat(summaryFormData.sellTradeCommission.trim()) : null
          const sellOtherFees = summaryFormData.sellOtherFees != null && summaryFormData.sellOtherFees !== '' ? parseFloat(summaryFormData.sellOtherFees.trim()) : null

          const feeTypes = [
            { type: '买入佣金', value: tradeCommission, key: 'tradeCommission' },
            { type: '买入其他费用', value: otherFees, key: 'otherFees' },
            { type: '卖出佣金', value: sellTradeCommission, key: 'sellTradeCommission' },
            { type: '卖出其他费用', value: sellOtherFees, key: 'sellOtherFees' }
          ]

          const stockInfoFromOrders = orders.find(o => (o.tradeNumber === tradeNumber || o.trade_number === tradeNumber) && !o.deleted)
          const symbol = stockInfoFromOrders?.symbol || currentRecord.symbol || ''
          const name = stockInfoFromOrders?.name || currentRecord.name || currentRecord.stock_name || ''

          // 从交易记录中获取买入/卖出数量
          const buyQuantity = currentRecord.buyQuantity || stockInfoFromOrders?.buyQuantity || 0
          const sellQuantity = currentRecord.sellQuantity || stockInfoFromOrders?.sellQuantity || 0

          const feePromises = []
          for (const fee of feeTypes) {
            const feeAmount = fee.value != null ? fee.value : null
            // 费用以负数记录
            const negativeAmount = feeAmount != null ? -Math.abs(feeAmount) : null

            // 根据费用类型确定记账说明中的数量
            const descriptionQuantity = (fee.key === 'tradeCommission' || fee.key === 'otherFees') ? buyQuantity : sellQuantity

            // 查找是否已存在该交易编号+类型的账单
            const existingFeeTransaction = allTransactions.find(t =>
              (t.tradeNumber === tradeNumber || t.trade_number === tradeNumber) &&
              (t.type === fee.type || t.transaction_type === fee.type) &&
              !t.deleted
            )

            if (negativeAmount != null) {
              if (existingFeeTransaction) {
                // 已存在，覆盖更新
                console.log('[交易结案] 更新费用账单:', fee.type, existingFeeTransaction.id, negativeAmount)
                feePromises.push(
                  fetch('/api/transactions/' + existingFeeTransaction.id, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ total_price: negativeAmount, quantity: descriptionQuantity })
                  }).catch(err => console.error('[交易结案] 更新费用账单失败', fee.type, err))
                )
              } else {
                // 不存在，新建
                const now = new Date()
                const transactionDate = now.toISOString().split('T')[0]
                const transactionTime = now.toTimeString().split(' ')[0].substring(0, 8)

                console.log('[交易结案] 新建费用账单:', fee.type, negativeAmount)
                feePromises.push(
                  fetch('/api/transactions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                      transaction_type: fee.type,
                      symbol: symbol,
                      price: 0,
                      quantity: descriptionQuantity,
                      total_price: negativeAmount,
                      transaction_date: transactionDate,
                      transaction_time: transactionTime,
                      fee: 0,
                      trade_number: tradeNumber,
                      deleted: false,
                      deleted_at: null
                    })
                  }).catch(err => console.error('[交易结案] 新建费用账单失败', fee.type, err))
                )
              }
            } else if (existingFeeTransaction) {
              // 值为空但已存在账单，将其标记为删除
              console.log('[交易结案] 删除费用账单:', fee.type, existingFeeTransaction.id)
              feePromises.push(
                fetch('/api/transactions/' + existingFeeTransaction.id, {
                  method: 'DELETE',
                  headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                  }
                }).catch(err => console.error('[交易结案] 删除费用账单失败', fee.type, err))
              )
            }
          }
          await Promise.all(feePromises)
        }

        // 从数据库重新同步数据，确保数据一致性
        const syncResponse = await fetch('/api/sync/all', {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        })
        const syncData = await syncResponse.json()
        if (syncData.success && syncData.data) {
          if (syncData.data.trade_records !== undefined) {
            const { trade_records, trade_orders } = syncData.data
            useStore.getState().importTradeRecords(trade_records, trade_orders)
          }
          if (syncData.data.transactions !== undefined) {
            useStore.getState().importTransactions(syncData.data.transactions)
          }
        }
        showToast('保存成功', 'success')
        setShowSummaryModal(false)
        setEditingTradeId(null)
        setSelectedIds([])
      } else {
        showToast('保存失败', 'error')
      }
    } catch (error) {
      console.error('保存交易结案失败:', error)
      showToast('保存失败', 'error')
    }
  }

  const handleShowBuyDetail = (record) => {
    console.log('🔍 [Debug Buy Detail] 传入的record:', record);
    console.log('🔍 [Debug Buy Detail] record.buyPrice:', record.buyPrice);
    console.log('🔍 [Debug Buy Detail] record.id:', record.id);
    console.log('🔍 [Debug Buy Detail] record.tradeNumber:', record.tradeNumber);

    // 直接用传入的record.id查找对应的记录，确保获取的是正确的记录
    // 并且该记录不能是软删除状态
    const recordWithLatestData = tradeRecords.find(r => r.id === record.id && !r.deleted) || record;
    console.log('🔍 [Debug Buy Detail] 最终使用的数据:', recordWithLatestData);
    console.log('🔍 [Debug Buy Detail] 最终使用的buyPrice:', recordWithLatestData.buyPrice);
    setDetailRecord(recordWithLatestData);
    // 理想买入价：从股票交易模块获取同一交易编号的买入类型订单（过滤软删除）
    const buyOrders = orders.filter(o => o.tradeNumber === record.tradeNumber && o.type === 'buy' && !o.deleted)
    let buyOrderPriceValue = ''       // 显示用的理想买入价（四舍五入）
    let buyOrderPriceExact = 0        // 计算用的精确理想买入价
    let buyOrdersTotalQuantity = 0    // 股票交易列表的买入总数量
    let buyOrdersTotalAmount = 0      // 股票交易列表的买入总金额
    if (buyOrders.length === 1) {
      // 只有一个买入订单，直接取交易价格
      buyOrderPriceValue = buyOrders[0].price ?? ''
      buyOrderPriceExact = parseFloat(buyOrders[0].price) || 0
      buyOrdersTotalQuantity = parseFloat(buyOrders[0].quantity) || 0
      buyOrdersTotalAmount = (parseFloat(buyOrders[0].price) || 0) * (parseFloat(buyOrders[0].quantity) || 0)
    } else if (buyOrders.length > 1) {
      // 多个买入订单，计算平均价格：Σ交易金额/交易数量
      buyOrders.forEach(o => {
        const price = parseFloat(o.price) || 0
        const quantity = parseFloat(o.quantity) || 0
        buyOrdersTotalAmount += price * quantity  // 累加交易金额
        buyOrdersTotalQuantity += quantity         // 累加交易数量
      })
      if (buyOrdersTotalQuantity > 0) {
        buyOrderPriceExact = buyOrdersTotalAmount / buyOrdersTotalQuantity  // 精确值
        const rounded = Math.round(buyOrderPriceExact * 100) / 100
        buyOrderPriceValue = rounded
      }
    }
    // 买入成交价格取交易结案弹窗的值(record.buyPrice)，如果未填写则默认使用理想买入价
    // 实际买入价使用用户输入的值
    const userBuyPrice = record.buyPrice != null ? record.buyPrice : null
    console.log('🔍 [Debug Buy Detail] userBuyPrice:', userBuyPrice);
    const buyPriceValue = userBuyPrice != null ? formatPrice(userBuyPrice) : (buyOrderPriceValue ? formatPrice(buyOrderPriceValue) : '')
    console.log('🔍 [Debug Buy Detail] buyPriceValue:', buyPriceValue);
    // 计算买入滑点：(理想买入价 - 实际买入价) × 买入数量
    // 成交价格 > 订单价格 = 亏钱（负数），成交价格 < 订单价格 = 赚钱（正数）
    let buySlippage = null
    if (buyOrderPriceExact > 0 && userBuyPrice != null && buyOrdersTotalQuantity > 0) {
      const priceDiff = buyOrderPriceExact - userBuyPrice
      buySlippage = priceDiff * buyOrdersTotalQuantity
    }
    // 获取买入策略名称：从同一交易编号的买入订单获取
    const buyOrder = orders.find(o => String(o.id) === String(record.buyOrderId))
    const buyOrdersOfSameTrade = orders.filter(o => o.tradeNumber === record.tradeNumber && o.type === 'buy')
    const firstBuyOrderWithStrategy = buyOrdersOfSameTrade.find(o => o.strategyId)
    let buyStrategyValue = ''

    // 使用 strategyRecords 查找策略名称
    const buyStrategiesList = strategyRecords || []
    const strategyIdToUse = buyOrder?.strategyId || firstBuyOrderWithStrategy?.strategyId || record.buyStrategyId

    if (strategyIdToUse) {
      const strategy = buyStrategiesList.find(s => String(s.id) === String(strategyIdToUse))
      buyStrategyValue = strategy ? strategy.name : ''
    }
    // 计算买入金额：使用实际买入价 × 买入数量，这样可以更准确反映实际买入金额
    const calculatedBuyAmount = userBuyPrice > 0 && buyOrdersTotalQuantity > 0 ? userBuyPrice * buyOrdersTotalQuantity : (buyOrdersTotalAmount > 0 ? buyOrdersTotalAmount : 0);
    // 买入金额 = 股票交易列表买入总金额（与交易记录列表一致的取值逻辑）
    const buyAmountValue = calculatedBuyAmount > 0
      ? formatAmount(calculatedBuyAmount)
      : ''

    // 买入实际时间 = 股票交易列表-买入类型-交易时间
    let buyTimeValue = ''
    if (buyOrders.length > 0) {
      // 从股票交易列表的买入订单中获取交易时间
      const buyOrder = buyOrders[0]
      if (buyOrder.created_at || buyOrder.createdAt) {
        buyTimeValue = formatDate(buyOrder.created_at || buyOrder.createdAt)
      }
    }

    const formData = {
      high: record.buyChannel?.high ? formatAmount(record.buyChannel.high) : (buyOrders.length > 0 ? '' : '-'),
      low: record.buyChannel?.low ? formatAmount(record.buyChannel.low) : (buyOrders.length > 0 ? '' : '-'),
      buyQuantity: buyOrdersTotalQuantity > 0 ? formatAmount(buyOrdersTotalQuantity) : (buyOrders.length > 0 ? '' : '-'),
      buyAmount: buyAmountValue || (buyOrders.length > 0 ? '' : '-'),
      buyPrice: buyPriceValue || '-',
      buyOrderPrice: buyOrderPriceValue ? formatPrice(buyOrderPriceValue) : (buyOrders.length > 0 ? '' : '-'),
      buySlippage: buySlippage !== null ? formatSlippage(buySlippage) : (buyOrders.length > 0 ? '-' : '-'),
      tradeCommission: formatFee(record.tradeCommission) || (buyOrders.length > 0 ? '' : '-'),
      otherFees: formatFee(record.otherFees) || (buyOrders.length > 0 ? '' : '-'),
      buyStrategy: buyStrategyValue || (buyOrders.length > 0 ? '' : '-'),
      buyTime: buyTimeValue || (buyOrders.length > 0 ? '' : '-')
    }
    console.log('🔍 [Debug Buy Detail] formData:', formData);
    // 不要保留旧值，总是使用新计算的值
    setBuyDetailFormData(formData)
    setBuyDetailFormErrors({})
    setShowBuyDetailModal(true)
  }

  const handleShowSellDetail = (record) => {
    console.log('handleShowSellDetail record:', record);
    console.log('Record keys:', Object.keys(record));
    console.log('🔍 [Debug Sell Detail] record.sellPrice:', record.sellPrice);
    console.log('🔍 [Debug Sell Detail] record.id:', record.id);
    console.log('🔍 [Debug Sell Detail] record.tradeNumber:', record.tradeNumber);

    // 直接用传入的record.id查找对应的记录，确保获取的是正确的记录
    // 并且该记录不能是软删除状态
    const recordWithLatestDataForSell = tradeRecords.find(r => r.id === record.id && !r.deleted) || record;
    console.log('🔍 [Debug Sell Detail] 查找结果:');
    console.log('   - record.id:', record.id);
    console.log('   - recordWithLatestDataForSell.id:', recordWithLatestDataForSell.id);
    console.log('   - recordWithLatestDataForSell.sellPrice:', recordWithLatestDataForSell.sellPrice);
    console.log('   - recordWithLatestDataForSell.sellOrderId:', recordWithLatestDataForSell.sellOrderId);
    console.log('   - recordWithLatestDataForSell.buyOrderId:', recordWithLatestDataForSell.buyOrderId);
    console.log('🔍 [Debug Sell Detail] 最终使用的数据:', recordWithLatestDataForSell);
    console.log('🔍 [Debug Sell Detail] 最终使用的sellPrice:', recordWithLatestDataForSell.sellPrice);
    setDetailRecord(recordWithLatestDataForSell);
    // 理想卖出价：从股票交易模块获取同一交易编号的卖出类型订单（过滤软删除）
    const sellOrders = orders.filter(o => o.tradeNumber === record.tradeNumber && o.type === 'sell' && !o.deleted)
    console.log('sellOrders:', sellOrders);
    
    // 调试：打印所有订单，确认是否有卖出订单
    console.log('🔍 [Debug Orders] 所有订单:');
    orders.forEach(order => {
      if (order.tradeNumber === record.tradeNumber) {
        console.log('   - 订单:', { id: order.id, type: order.type, tradeNumber: order.tradeNumber, price: order.price, quantity: order.quantity });
      }
    });
    
    let sellOrderPriceValue = ''       // 显示用的理想卖出价（四舍五入）
    let sellOrderPriceExact = 0        // 计算用的精确理想卖出价
    let sellOrdersTotalQuantity = 0    // 股票交易列表的卖出总数量
    let sellOrdersTotalAmount = 0      // 股票交易列表的卖出总金额
    
    // 从订单计算理想卖出价（动态计算，删除卖出交易单后会更新）
    if (sellOrders.length === 1) {
      // 只有一个卖出订单，直接取交易价格
      const price = parseFloat(sellOrders[0].price) || 0
      const quantity = parseFloat(sellOrders[0].quantity) || 0
      sellOrderPriceValue = price.toFixed(2)
      sellOrderPriceExact = price
      sellOrdersTotalQuantity = quantity
      sellOrdersTotalAmount = price * quantity
    } else if (sellOrders.length > 1) {
      // 多个卖出订单，计算平均价格：Σ交易金额/交易数量
      // 交易金额 = 交易价格 * 交易数量
      sellOrders.forEach(o => {
        const price = parseFloat(o.price) || 0
        const quantity = parseFloat(o.quantity) || 0
        sellOrdersTotalAmount += price * quantity  // 累加交易金额
        sellOrdersTotalQuantity += quantity         // 累加交易数量
      })
      
      // 计算平均价格
      if (sellOrdersTotalQuantity > 0) {
        sellOrderPriceExact = sellOrdersTotalAmount / sellOrdersTotalQuantity;
        sellOrderPriceValue = sellOrderPriceExact.toFixed(2);
      }
    }
    console.log('🔍 [Debug Sell Price] 动态计算理想卖出价:', sellOrderPriceValue);
    
    // 已在前面计算过卖出总数量和总金额
    
    // 获取卖出策略：参考买入详情弹窗的逻辑
    let sellStrategyValue = ''
    
    // 使用策略记录查找策略名称
    if (sellOrders.length > 0 && sellOrders[0].strategyId) {
      const strategy = strategyRecords.find(s => {
        return s.id === sellOrders[0].strategyId
      })
      sellStrategyValue = strategy ? strategy.name : ''
    } else if (record.sellStrategyId) {
      const strategy = strategyRecords.find(s => {
        return s.id === record.sellStrategyId
      })
      sellStrategyValue = strategy ? strategy.name : ''
    }
    
    // 如果仍然为空，设置默认值
    if (!sellStrategyValue) {
      sellStrategyValue = sellOrders.length > 0 ? '未设置策略' : '-'
    }
    
    // 如果卖出策略为空，设置默认值
    if (!sellStrategyValue) {
      sellStrategyValue = sellOrders.length > 0 ? '未设置策略' : '-';
    }
    
    // 调试日志
    console.log('🔍 [Debug Sell Price] 卖出价格信息:');
    console.log('   - record.sellPrice (理想卖出价):', record.sellPrice);
    console.log('   - record.actualSellPrice (实际卖出价):', record.actualSellPrice);
    console.log('   - sellOrderPriceValue:', sellOrderPriceValue);
    console.log('   - sellOrders.length:', sellOrders.length);
    
    // 实际卖出价：用户手动录入的券商成交价
    const actualSellPrice = record.actualSellPrice != null ? parseFloat(record.actualSellPrice) : null
    
    // 计算滑点：(实际卖出价 - 理想卖出价) × 卖出数量
    // 实际卖出价未录入时默认取理想卖出价，此时滑点为0
    let sellSlippageValue = '-'
    const idealSellPrice = sellOrderPriceExact
    const effectiveSellPrice = actualSellPrice != null ? actualSellPrice : idealSellPrice
    const sellQuantity = sellOrdersTotalQuantity

    if (idealSellPrice > 0 && sellQuantity > 0) {
      const slippageValue = (effectiveSellPrice - idealSellPrice) * sellQuantity
      sellSlippageValue = formatSlippage(slippageValue)
    }

    // 检查记录中是否有卖出时间数据，使用格式化为年-月-日 时:分:秒
    const sellTimeValue = sellOrders.length > 0 ? (record.sellTime ? formatDate(record.sellTime) : '未设置时间') : '-'

    // 计算卖出金额：使用有效卖出价（实际价优先，否则理想价）× 卖出数量
    const calculatedSellAmount = effectiveSellPrice > 0 && sellQuantity > 0 ? effectiveSellPrice * sellQuantity : (sellOrdersTotalAmount > 0 ? sellOrdersTotalAmount : 0)
    
    // 设置表单数据，使用格式化函数确保整数不显示.00
    const formData = {
      // 实际卖出价：有则显示实际价，无则显示理想价（方便用户参考）
      sellPrice: actualSellPrice != null ? formatPrice(actualSellPrice) : (sellOrderPriceValue !== '' ? formatPrice(sellOrderPriceValue) : '-'),
      sellQuantity: sellOrdersTotalQuantity > 0 ? formatAmount(sellOrdersTotalQuantity) : '-',  // 数量使用千位分隔符
      sellAmount: calculatedSellAmount > 0 ? formatAmount(calculatedSellAmount) : '-',  // 使用有效卖出价 × 卖出数量
      sellOrderPrice: sellOrderPriceValue !== '' ? formatPrice(sellOrderPriceValue) : '-',  // 理想卖出价（只读，从订单动态计算）
      sellTime: sellTimeValue,
      sellSlippage: sellSlippageValue,  // 已在计算逻辑中使用了千位分隔符
      sellStrategy: sellStrategyValue,  // 使用从orders获取的策略名称
      sellTradeCommission: record.sellTradeCommission ? formatFee(record.sellTradeCommission) : '-',
      sellOtherFees: record.sellOtherFees ? formatFee(record.sellOtherFees) : '-',
      high: record.buyChannel?.high ? formatAmount(record.buyChannel.high) : (sellOrders.length > 0 ? '-' : '-'),
      low: record.buyChannel?.low ? formatAmount(record.buyChannel.low) : (sellOrders.length > 0 ? '-' : '-')
    }

    // 不要保留旧值，总是使用新计算的值
    setSellDetailFormData(formData);
    setSellDetailFormErrors({});
    setShowSellDetailModal(true);
  }

  const handleBuyDetailFormDataChange = function(newFormData, clearError) {
    if (clearError === null || clearError === undefined) {
      clearError = null;
    }
    
    try {
      if (newFormData.buyPrice !== undefined || newFormData.buyOrderPrice !== undefined) {
        var p1 = newFormData.buyPrice !== undefined ? newFormData.buyPrice : buyDetailFormData.buyPrice;
        var p2 = newFormData.buyOrderPrice !== undefined ? newFormData.buyOrderPrice : buyDetailFormData.buyOrderPrice;
        var price1 = parsePrice(p1);
        var price2 = parsePrice(p2);
        var qty = detailRecord && detailRecord.buyQuantity ? detailRecord.buyQuantity : 0;

        if (price1 && price2 && qty) {
          var val = (price2 - price1) * qty;
          newFormData.buySlippage = formatSlippage(val);
        } else {
          newFormData.buySlippage = '-';
        }
      }
    } catch (error) {
      console.error(error);
    }
    
    setBuyDetailFormData(newFormData);
    if (clearError) {
      setBuyDetailFormErrors(prev => ({ ...prev, ...clearError }));
    }
  };

  const handleSellDetailSubmit = async (e) => {
    e.preventDefault()

    const errors = {}
    const requiredFields = ['sellPrice', 'sellTradeCommission', 'sellOtherFees']
    requiredFields.forEach(field => {
      if (!sellDetailFormData[field] || sellDetailFormData[field].toString().trim() === '') {
        errors[field] = '不能为空'
      }
    })

    if (Object.keys(errors).length > 0) {
      setSellDetailFormErrors(errors)
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      // 保存到数据库
      const response = await fetch('/api/trade_records/' + detailRecord.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
            actual_sell_price: parsePrice(sellDetailFormData.sellPrice),
            sell_trade_commission: sellDetailFormData.sellTradeCommission?.toString().trim() || '',
            sell_other_fees: sellDetailFormData.sellOtherFees?.toString().trim() || ''
          })
      }).then(res => res.json())

      if (response.success) {
        // 从数据库重新同步数据
        await fetch('/api/sync/all', {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        })
          .then(res => res.json())
          .then(syncResponse => {
            if (syncResponse.success && syncResponse.data && syncResponse.data.trade_records !== undefined) {
              const { trade_records, trade_orders } = syncResponse.data
              useStore.getState().importTradeRecords(trade_records, trade_orders)
            }
          })
        showToast('保存成功', 'success')
        setShowSellDetailModal(false)
        setDetailRecord(null)
      } else {
        showToast('保存失败', 'error')
      }
    } catch (error) {
      console.error('保存卖出详情失败:', error)
      showToast('保存失败', 'error')
    }
  }

  const handleBuyDetailSubmit = async (e) => {
    e.preventDefault()

    const errors = {}
    const requiredFields = ['buyPrice', 'tradeCommission', 'otherFees']
    requiredFields.forEach(field => {
      if (!buyDetailFormData[field] || buyDetailFormData[field].toString().trim() === '') {
        errors[field] = '不能为空'
      }
    })

    if (Object.keys(errors).length > 0) {
      setBuyDetailFormErrors(errors)
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      // 保存到数据库
      const response = await fetch('/api/trade_records/' + detailRecord.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          buy_price: parsePrice(buyDetailFormData.buyPrice),
          trade_commission: buyDetailFormData.tradeCommission?.toString().trim() || '',
          other_fees: buyDetailFormData.otherFees?.toString().trim() || ''
        })
      }).then(res => res.json())

      if (response.success) {
        // 从数据库重新同步数据
        await fetch('/api/sync/all', {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        })
          .then(res => res.json())
          .then(syncResponse => {
            if (syncResponse.success && syncResponse.data && syncResponse.data.trade_records !== undefined) {
              const { trade_records, trade_orders } = syncResponse.data
              useStore.getState().importTradeRecords(trade_records, trade_orders)
            }
          })
        showToast('保存成功', 'success')
        setShowBuyDetailModal(false)
        setDetailRecord(null)
      } else {
        showToast('保存失败', 'error')
      }
    } catch (error) {
      console.error('保存买入详情失败:', error)
      showToast('保存失败', 'error')
    }
  }

  const handleSellDetailFormDataChange = (newFormData, clearError = null) => {
    // 如果实际卖出价或理想卖出价改变，重新计算卖出滑点
    if (newFormData.sellPrice !== undefined || newFormData.sellOrderPrice !== undefined) {
      // 解析用户输入的实际卖出价
      const userInputSellPrice = newFormData.sellPrice !== undefined ? newFormData.sellPrice : sellDetailFormData.sellPrice
      const actualSellPrice = parsePrice(userInputSellPrice)
      // 解析理想卖出价
      const idealSellPrice = parsePrice(newFormData.sellOrderPrice !== undefined ? newFormData.sellOrderPrice : sellDetailFormData.sellOrderPrice)
      const sellQuantity = detailRecord?.sellQuantity || 0

      if (actualSellPrice !== null && actualSellPrice !== undefined && !isNaN(actualSellPrice) &&
          idealSellPrice !== null && idealSellPrice !== undefined && !isNaN(idealSellPrice) &&
          sellQuantity !== null && sellQuantity !== undefined && !isNaN(sellQuantity) && sellQuantity > 0) {
        // 卖出滑点 = (实际卖出价 - 理想卖出价) × 数量
        const slippageValue = (actualSellPrice - idealSellPrice) * sellQuantity
        // 格式化：整数取整，有小数点取小数点2位四舍五入，千位分隔符
        newFormData.sellSlippage = formatSlippage(slippageValue)
      } else {
        newFormData.sellSlippage = '-'
      }
    }

    setSellDetailFormData(newFormData)
    if (clearError) {
      setSellDetailFormErrors(prev => ({ ...prev, ...clearError }))
    }
  }

  const handleDetailModalClose = () => {
    setShowBuyDetailModal(false)
    setShowSellDetailModal(false)
    setDetailRecord(null)
    // 关闭详情弹窗时不立即清空 formData，保留数据以便交易结案弹窗获取
    // 只有在真正需要清空时才清空
    // setBuyDetailFormData({})
    // setBuyDetailFormErrors({})
    // setSellDetailFormData({})
    // setSellDetailFormErrors({})
  }

  const clearDetailFormData = () => {
    setBuyDetailFormData({})
    setBuyDetailFormErrors({})
    setSellDetailFormData({})
    setSellDetailFormErrors({})
  }

  const getStrategyName = (strategyId, type) => {
    if (!strategyId) return '-'
    const strategyList = strategies[type] || []
    const strategy = strategyList.find(s => String(s.id) === String(strategyId))
    return strategy ? strategy.name : '-'
  }

  const handleSummaryFormDataChange = (newFormData, clearError = null) => {
    // 如果实际卖出价改变，格式化为：整数取整，有小数点取小数点2位四舍五入
    if (newFormData.sellPrice !== undefined) {
      const rawValue = newFormData.sellPrice
      if (rawValue !== '' && rawValue !== null && rawValue !== undefined) {
        const num = parseFloat(rawValue)
        if (!isNaN(num)) {
          const rounded = Math.round(num * 100) / 100
          newFormData.sellPrice = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
        }
      }
    }
    // 如果实际买入价改变，同样格式化
    if (newFormData.buyPrice !== undefined) {
      const rawValue = newFormData.buyPrice
      if (rawValue !== '' && rawValue !== null && rawValue !== undefined) {
        const num = parseFloat(rawValue)
        if (!isNaN(num)) {
          const rounded = Math.round(num * 100) / 100
          newFormData.buyPrice = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
        }
      }
    }
    // 如果卖出佣金改变，格式化
    if (newFormData.sellTradeCommission !== undefined) {
      const rawValue = newFormData.sellTradeCommission
      if (rawValue !== '' && rawValue !== null && rawValue !== undefined) {
        const num = parseFloat(rawValue)
        if (!isNaN(num)) {
          const rounded = Math.round(num * 100) / 100
          newFormData.sellTradeCommission = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
        }
      }
    }
    // 如果卖出其他费用改变，格式化
    if (newFormData.sellOtherFees !== undefined) {
      const rawValue = newFormData.sellOtherFees
      if (rawValue !== '' && rawValue !== null && rawValue !== undefined) {
        const num = parseFloat(rawValue)
        if (!isNaN(num)) {
          const rounded = Math.round(num * 100) / 100
          newFormData.sellOtherFees = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
        }
      }
    }
    // 如果买入佣金改变，格式化
    if (newFormData.tradeCommission !== undefined) {
      const rawValue = newFormData.tradeCommission
      if (rawValue !== '' && rawValue !== null && rawValue !== undefined) {
        const num = parseFloat(rawValue)
        if (!isNaN(num)) {
          const rounded = Math.round(num * 100) / 100
          newFormData.tradeCommission = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
        }
      }
    }
    // 如果买入其他费用改变，格式化
    if (newFormData.otherFees !== undefined) {
      const rawValue = newFormData.otherFees
      if (rawValue !== '' && rawValue !== null && rawValue !== undefined) {
        const num = parseFloat(rawValue)
        if (!isNaN(num)) {
          const rounded = Math.round(num * 100) / 100
          newFormData.otherFees = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
        }
      }
    }
    console.log('[Debug] handleSummaryFormDataChange:', { newFormData, oldFormData: summaryFormData })
    setSummaryFormData(newFormData)
    if (clearError) {
      setSummaryFormErrors(prev => ({ ...prev, ...clearError }))
    }
  }

  const SUMMARY_FIELDS = [
    {
      key: 'buyPrice',
      label: '实际买入价',
      type: 'text',
      inputType: 'number',
      placeholder: '请输入',
      required: false,
      grid: true
    },
    {
      key: 'tradeCommission',
      label: '买入佣金',
      type: 'text',
      placeholder: '请输入',
      required: false,
      grid: true
    },
    {
      key: 'otherFees',
      label: '买入其他费用',
      type: 'text',
      placeholder: '请输入',
      required: false,
      grid: true
    },
    {
      key: 'sellPrice',
      label: '实际卖出价',
      type: 'text',
      inputType: 'number',
      placeholder: '请输入',
      required: false,
      grid: true
    },
    {
      key: 'sellTradeCommission',
      label: '卖出佣金',
      type: 'text',
      placeholder: '请输入',
      required: false,
      grid: true
    },
    {
      key: 'sellOtherFees',
      label: '卖出其他费用',
      type: 'text',
      placeholder: '请输入',
      required: false,
      grid: true
    },
    {
      key: 'upperBand',
      label: '通道上轨',
      type: 'text',
      inputType: 'number',
      placeholder: '请输入',
      required: false,
      grid: true
    },
    {
      key: 'lowerBand',
      label: '通道下轨',
      type: 'text',
      inputType: 'number',
      placeholder: '请输入',
      required: false,
      grid: true
    },
    {
      key: 'tradeSummary',
      label: '交易总结',
      type: 'textarea',
      placeholder: '请输入',
      required: false,
      rows: 4,
      fullWidth: true
    }
  ]

  const SELL_DETAIL_FIELDS = [
    {
      key: 'sellPrice',
      label: '实际卖出价',
      readonly: true,
      grid: true
    },
    {
      key: 'sellOrderPrice',
      label: '理想卖出价',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'sellSlippage',
      label: '卖出滑点',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'sellStrategy',
      label: '卖出策略',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'sellQuantity',
      label: '卖出数量',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'sellAmount',
      label: '卖出金额',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'sellTradeCommission',
      label: '卖出佣金',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'sellOtherFees',
      label: '卖出其他费用',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'sellTime',
      label: '卖出时间',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'high',
      label: '最高价',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'low',
      label: '最低价',
      readonly: true,
      notRequired: true,
      grid: true
    }
  ]

  const BUY_DETAIL_FIELDS = [
    {
      key: 'buyPrice',
      label: '实际买入价',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'buyOrderPrice',
      label: '理想买入价',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'buySlippage',
      label: '买入滑点',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'buyStrategy',
      label: '买入策略',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'buyQuantity',
      label: '买入数量',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'buyAmount',
      label: '买入金额',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'tradeCommission',
      label: '买入佣金',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'otherFees',
      label: '买入其他费用',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'buyTime',
      label: '买入时间',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'high',
      label: '最高价',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'low',
      label: '最低价',
      readonly: true,
      notRequired: true,
      grid: true
    }
  ]

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      alert('暂无数据可导出')
      return
    }
    setShowExportModal(true)
  }

  // 获取字段值的辅助函数（用于导出）
  const getFieldValue = (item, fieldKey) => {
    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
    
    // 使用item中的数量，确保与显示一致
    const buyQuantity = parseFloat(item.buyQuantity) || 0
    const sellQuantity = parseFloat(item.sellQuantity) || 0
    
    let buyOrdersTotalAmount = 0
    buyOrders.forEach(o => {
      buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
    })
    
    let sellOrdersTotalAmount = 0
    sellOrders.forEach(o => {
      sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
    })
    
    // 反推买入价和卖出价，因为数据库只存储金额不存储单价
    const buyAmountFromRecord = parseFloat(item.buyAmount) || 0
    const sellAmountFromRecord = parseFloat(item.sellAmount) || 0
    // 使用用户输入的实际买入价/卖出价，如果为空则使用从订单反推的价格
    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmountFromRecord / buyQuantity : 0)
    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmountFromRecord / sellQuantity : 0)
    const buyAmount = buyAmountFromRecord
    const sellAmount = sellAmountFromRecord
    
    // 计算买入滑点：使用用户输入的实际买入价
    let buySlippage = 0
    if (buyQuantity > 0 && buyOrdersTotalAmount > 0) {
      const idealBuyPrice = buyOrdersTotalAmount / buyQuantity
      buySlippage = (idealBuyPrice - buyPrice) * buyQuantity
    }
    
    // 计算卖出滑点：使用用户输入的实际卖出价
    let sellSlippage = 0
    if (sellQuantity > 0 && sellOrdersTotalAmount > 0) {
      const idealSellPrice = sellOrdersTotalAmount / sellQuantity
      sellSlippage = (sellPrice - idealSellPrice) * sellQuantity
    }
    
    const totalSlippage = buySlippage + sellSlippage
    const profit = (sellPrice - buyPrice) * sellQuantity
    const netProfit = profit - totalSlippage
    
    // 格式化数字：整数取整，有小数点取小数点2位四舍五入
    const formatNum = (num) => {
      const rounded = Math.round(num * 100) / 100
      return Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    
    switch (fieldKey) {
      case 'tradeNumber':
        return item.tradeNumber || '-'
      case 'symbol':
        return item.symbol || '-'
      case 'name':
        return item.name || '-'
      case 'buyAmount':
        return item.buyAmount ? formatAmount(item.buyAmount) : '-'
      case 'sellAmount': {
        // 如果有实际卖出价，直接使用已保存的实际卖出金额（与交易结案弹窗保存的金额一致）
        if (item.actualSellPrice != null && item.sellAmount != null && item.sellAmount > 0) {
          return (
            <button
              onClick={() => handleShowSellDetail(item)}
              className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              {formatAmount(item.sellAmount)}
            </button>
          )
        }
        // 没有实际卖出价时，使用理想卖出价计算（从订单获取）
        const sellOrdersForItem = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
        let sellOrdersTotalQuantity = 0
        sellOrdersForItem.forEach(o => {
          sellOrdersTotalQuantity += parseFloat(o.quantity) || 0
        })
        const sellQty = sellOrdersTotalQuantity > 0 ? sellOrdersTotalQuantity : (parseFloat(item.sellQuantity) || 0)
        const sellPrice = item.sellPrice != null ? item.sellPrice : 0
        const calculatedSellAmount = sellQty > 0 && sellPrice > 0 ? sellQty * sellPrice : (item.sellAmount || 0)
        if (!calculatedSellAmount || calculatedSellAmount === 0) return <span>-</span>
        return (
          <button
            onClick={() => handleShowSellDetail(item)}
            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            {formatAmount(calculatedSellAmount)}
          </button>
        )
      }
      case 'tradeStatus': {
        const sellQty = parseFloat(item.sellQuantity) || 0
        const buyQty = parseFloat(item.buyQuantity) || 0
        if (sellQty === 0 && buyQty === 0) return '-'
        return sellQty >= buyQty ? '结束' : '持仓中'
      }
      case 'buyGrade': {
        const buyHighPrice = item.buyHighPrice
        const buyLowPrice = item.buyLowPrice
        if (!buyHighPrice || !buyLowPrice || buyPrice === 0 || buyHighPrice === buyLowPrice) return '-'
        const rating = (buyHighPrice - buyPrice) / (buyHighPrice - buyLowPrice)
        if (rating >= 0.75) return 'A'
        if (rating >= 0.5) return 'B'
        if (rating >= 0.25) return 'C'
        return 'D'
      }
      case 'sellGrade': {
        const sellHighPrice = item.sellHighPrice
        const sellLowPrice = item.sellLowPrice
        if (!sellHighPrice || !sellLowPrice || sellPrice === 0 || sellHighPrice === sellLowPrice) return '-'
        const rating = (sellPrice - sellLowPrice) / (sellHighPrice - sellLowPrice)
        if (rating >= 0.75) return 'A'
        if (rating >= 0.5) return 'B'
        if (rating >= 0.25) return 'C'
        return 'D'
      }
      case 'profit':
        return sellQuantity > 0 ? formatNum(profit) : '0'
      case 'profitPercent':
        if (buyPrice > 0 && sellQuantity > 0) {
          const profitPercent = (sellPrice - buyPrice) / buyPrice * 100
          return formatNum(profitPercent) + '%'
        }
        return '-'
      case 'netProfit':
        return sellQuantity > 0 ? formatNum(netProfit) : '0'
      case 'netProfitPercent':
        if (buyPrice > 0 && sellQuantity > 0) {
          const netProfitPercent = netProfit / (buyPrice * sellQuantity) * 100
          return formatNum(netProfitPercent) + '%'
        }
        return '-'
      case 'fees': {
        const tradeCommission = parseFloat(item.tradeCommission) || 0
        const sellTradeCommission = parseFloat(item.sellTradeCommission) || 0
        const otherFees = parseFloat(item.otherFees) || 0
        const sellOtherFees = parseFloat(item.sellOtherFees) || 0
        const totalFees = tradeCommission + sellTradeCommission + otherFees + sellOtherFees
        return formatNum(totalFees)
      }
      case 'slippage':
        return sellQuantity > 0 ? formatNum(totalSlippage) : '0'
      case 'slippageNetProfitRatio':
        if (netProfit !== 0 && sellQuantity > 0) {
          const ratio = totalSlippage / Math.abs(netProfit) * 100
          return formatNum(ratio) + '%'
        }
        return '-'
      case 'upperBand': {
        const val = item.upperBand != null ? parseFloat(item.upperBand) : (item.buyChannel?.upperBand != null ? parseFloat(item.buyChannel.upperBand) : null)
        if (val == null) return '-'
        const rounded = Math.round(val * 100) / 100
        return Number.isInteger(rounded) ? rounded : rounded.toFixed(2)
      }
      case 'lowerBand': {
        const val = item.lowerBand != null ? parseFloat(item.lowerBand) : (item.buyChannel?.lowerBand != null ? parseFloat(item.buyChannel.lowerBand) : null)
        if (val == null) return '-'
        const rounded = Math.round(val * 100) / 100
        return Number.isInteger(rounded) ? rounded : rounded.toFixed(2)
      }
      case 'overallScore': {
        const upperBand = item.buyChannel?.upperBand ? parseFloat(item.buyChannel.upperBand) : 0
        const lowerBand = item.buyChannel?.lowerBand ? parseFloat(item.buyChannel.lowerBand) : 0
        if (upperBand === 0 || lowerBand === 0 || upperBand === lowerBand || buyPrice === 0 || sellPrice === 0) return '-'
        const rating = (sellPrice - buyPrice) / (upperBand - lowerBand)
        if (rating >= 0.75) return 'A'
        if (rating >= 0.5) return 'B'
        if (rating >= 0.25) return 'C'
        return 'D'
      }
      case 'tradeSummary':
        return item.tradeSummary || '-'
      default:
        return '-'
    }
  }

  const handleConfirmExport = async () => {
    // 当前列表字段
    const headers = [
      '交易编号', '股票代码', '股票名称', '买入金额', '卖出金额', '交易状态',
      '买入评级', '卖出评级', '盈亏金额', '盈亏比例', '净盈亏额', '净盈亏比',
      '手续费', '滑点', '滑净盈比', '通道上轨', '通道下轨', '交易评级', '交易总结'
    ]

    const fieldKeys = [
      'tradeNumber', 'symbol', 'name', 'buyAmount', 'sellAmount', 'tradeStatus',
      'buyGrade', 'sellGrade', 'profit', 'profitPercent', 'netProfit', 'netProfitPercent',
      'fees', 'slippage', 'slippageNetProfitRatio', 'upperBand', 'lowerBand', 'overallScore', 'tradeSummary'
    ]

    const rows = filteredRecords.map(r => fieldKeys.map(key => getFieldValue(r, key)))

    if (exportFormat === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('交易记录')

      worksheet.columns = headers.map(header => ({
        header: header,
        key: header,
        width: 20
      }))

      rows.forEach(row => {
        worksheet.addRow(row)
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `交易记录_${format(new Date(), 'yyyyMMdd')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      // CSV导出：每个字段用双引号包裹，避免逗号导致错列
      const escapeCsvField = (field) => {
        const str = String(field || '')
        // 如果包含逗号、双引号或换行符，需要用双引号包裹
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          // 双引号需要转义为两个双引号
          return '"' + str.replace(/"/g, '""') + '"'
        }
        return str
      }
      const csvContent = [headers, ...rows].map(row => row.map(escapeCsvField).join(',')).join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `交易记录_${format(new Date(), 'yyyyMMdd')}.csv`
      link.click()
    }

    setShowExportModal(false)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingRight: '10px', position: 'relative' }}>
        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
          {/* 筛选条件 */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px', flexShrink: 0 }}>
            <SearchInput
              value={filterTradeId}
              onChange={handleFilterChange(setFilterTradeId)}
              placeholder="交易编号"
              width="200px"
            />
            <SearchInput
              value={filterSymbol}
              onChange={handleFilterChange(setFilterSymbol)}
              placeholder="股票代码"
              width="200px"
            />
            <SearchInput
              value={filterName}
              onChange={handleFilterChange(setFilterName)}
              placeholder="股票名称"
              width="200px"
            />
            <div style={{ width: '180px' }}>
              <FilterSelect
                value={filterTradeStatus}
                onChange={handleFilterChange(setFilterTradeStatus)}
                options={[
                  { value: 'holding', label: '持仓中' },
                  { value: 'finished', label: '已结束' }
                ]}
                placeholder="交易状态"
              />
            </div>
            <div style={{ width: '180px' }}>
              <FilterSelect
                value={filterOverallScore === '' ? '' : filterOverallScore}
                onChange={handleFilterChange(setFilterOverallScore)}
                options={[
                  { value: 'A', label: 'A' },
                  { value: 'B', label: 'B' },
                  { value: 'C', label: 'C' },
                  { value: 'D', label: 'D' }
                ]}
                placeholder="交易评级"
              />
            </div>
          </div>

          {/* 工具栏 */}
          <Toolbar
            onEdit={handleEditSummary}
            onExport={handleExport}
            canEdit={selectedIds.length === 1}
            canExport={filteredRecords.length > 0}
            totalCount={filteredRecords.length}
            hideAdd={true}
            hideImport={true}
            hideDelete={true}
            editLabel="交易结案"
          />

          {/* 数据表格 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', paddingBottom: '50px', zIndex: '1', background: 'rgb(249, 250, 251)' }}>
            <div className="overflow-y-auto overflow-x-auto" style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: '1' }}>
              <DataTable
                showCheckbox={true}
                fields={[
                  { key: 'tradeNumber', label: '交易编号', width: '120px' },
                  { key: 'symbol', label: '股票代码', width: '100px' },
                  { key: 'name', label: '股票名称', width: '100px' },
                  { key: 'buyAmount', label: '买入金额', width: '120px' },
                  { key: 'sellAmount', label: '卖出金额', width: '120px' },
                  { key: 'tradeStatus', label: '交易状态', width: '100px' },
                  { key: 'buyGrade', label: '买入评级', width: '100px' },
                  { key: 'sellGrade', label: '卖出评级', width: '100px' },

                  { key: 'profit', label: '盈亏金额', width: '120px' },
                  { key: 'profitPercent', label: '盈亏比例', width: '120px' },
                  { key: 'netProfit', label: '净盈亏额', width: '120px' },
                  { key: 'netProfitPercent', label: '净盈亏比', width: '120px' },
                  { key: 'fees', label: '手续费', width: '120px' },
                  { key: 'slippage', label: '滑点', width: '120px' },
                  { key: 'slippageNetProfitRatio', label: '滑净盈比', width: '120px' },
                  { key: 'upperBand', label: '通道上轨', width: '120px' },
                  { key: 'lowerBand', label: '通道下轨', width: '120px' },
                  { key: 'overallScore', label: '交易评级', width: '120px' },
                  { key: 'chartReview', label: '图表回顾', width: '100px' },
                  { key: 'tradeSummary', label: '交易总结', width: '200px' }
                ]}
                data={paginatedData}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelectOne={handleSelectOne}
                renderCell={(field, item) => {
                  if (field.key === 'tradeNumber') {
                    return <span>{item.tradeNumber || '-'}</span>
                  }
                  if (field.key === 'symbol') {
                    return <span>{item.symbol || '-'}</span>
                  }
                  if (field.key === 'name') {
                    return <span>{item.name || '-'}</span>
                  }
                  if (field.key === 'buyAmount') {
                    // 使用实际买入价 × 买入数量计算，与买入详情弹窗保持一致
                    const buyOrdersForItem = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    let buyOrdersTotalQuantity = 0
                    buyOrdersForItem.forEach(o => {
                      buyOrdersTotalQuantity += parseFloat(o.quantity) || 0
                    })
                    const buyQty = buyOrdersTotalQuantity > 0 ? buyOrdersTotalQuantity : (parseFloat(item.buyQuantity) || 0)
                    const buyPrice = item.buyPrice != null ? item.buyPrice : 0
                    const calculatedBuyAmount = buyQty > 0 && buyPrice > 0 ? buyQty * buyPrice : (item.buyAmount || 0)
                    if (!calculatedBuyAmount || calculatedBuyAmount === 0) return <span>-</span>
                    return (
                      <button
                        onClick={() => handleShowBuyDetail(item)}
                        className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {formatAmount(calculatedBuyAmount)}
                      </button>
                    )
                  }
                  if (field.key === 'sellAmount') {
                    // 使用实际卖出价 × 卖出数量计算，与卖出详情弹窗保持一致
                    const sellOrdersForItem = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    let sellOrdersTotalQuantity = 0
                    sellOrdersForItem.forEach(o => {
                      sellOrdersTotalQuantity += parseFloat(o.quantity) || 0
                    })
                    const sellQty = sellOrdersTotalQuantity > 0 ? sellOrdersTotalQuantity : (parseFloat(item.sellQuantity) || 0)
                    // 优先使用实际卖出价，没有时用理想卖出价
                    const sellPrice = item.actualSellPrice != null ? item.actualSellPrice : (item.sellPrice != null ? item.sellPrice : 0)
                    const calculatedSellAmount = sellQty > 0 && sellPrice > 0 ? sellQty * sellPrice : (item.sellAmount || 0)
                    if (!calculatedSellAmount || calculatedSellAmount === 0) return <span>-</span>
                    return (
                      <button
                        onClick={() => handleShowSellDetail(item)}
                        className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {formatAmount(calculatedSellAmount)}
                      </button>
                    )
                  }
                  if (field.key === 'profit') {
                    // 优先使用数据库已计算的 profit 字段
                    const dbProfit = item.profit != null ? parseFloat(item.profit) : null
                    if (dbProfit != null) {
                      const rounded = Math.round(dbProfit * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}</span>
                    }
                    // 回退：从订单数据计算
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (sellQuantity === 0) {
                      return <span>0</span>
                    }
                    
                    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
                    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
                    
                    const profit = (sellPrice - buyPrice) * sellQuantity
                    
                    const rounded = Math.round(profit * 100) / 100
                    const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    return <span>{formatted}</span>
                  }
                  if (field.key === 'fees') {
                    // 手续费 = 买入佣金 + 卖出佣金 + 买入其他费用 + 卖出其他费用
                    const tradeCommission = parseFloat(item.tradeCommission) || 0
                    const sellTradeCommission = parseFloat(item.sellTradeCommission) || 0
                    const otherFees = parseFloat(item.otherFees) || 0
                    const sellOtherFees = parseFloat(item.sellOtherFees) || 0
                    
                    const totalFees = tradeCommission + sellTradeCommission + otherFees + sellOtherFees
                    // 整数取整，有小数点取小数点2位四舍五入
                    const rounded = Math.round(totalFees * 100) / 100
                    const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    return <span>{formatted}</span>
                  }
                  if (field.key === 'netProfitPercent') {
                    // 优先使用数据库已计算的净盈亏比字段
                    const dbNetProfitPercent = item.netProfitPercent != null ? parseFloat(item.netProfitPercent) : null
                    if (dbNetProfitPercent != null) {
                      const rounded = Math.round(dbNetProfitPercent * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}%</span>
                    }
                    // 回退：从数据库已计算的净盈亏额反推
                    const dbNetProfit = item.netProfit != null ? parseFloat(item.netProfit) : null
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (dbNetProfit != null && sellQuantity > 0) {
                      const netProfitPercent = (dbNetProfit / sellAmount) * 100
                      const rounded = Math.round(netProfitPercent * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}%</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'netProfit') {
                    // 优先使用数据库已计算的净盈亏额字段
                    const dbNetProfit = item.netProfit != null ? parseFloat(item.netProfit) : null
                    if (dbNetProfit != null) {
                      const rounded = Math.round(dbNetProfit * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}</span>
                    }
                    // 回退：从订单数据计算
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (sellQuantity === 0) {
                      return <span>0</span>
                    }
                    
                    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
                    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
                    
                    let buyOrdersTotalAmount = 0
                    buyOrders.forEach(o => {
                      buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    let sellOrdersTotalAmount = 0
                    sellOrders.forEach(o => {
                      sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    const profit = (sellPrice - buyPrice) * sellQuantity
                    
                    let buySlippage = 0
                    if (buyQuantity > 0 && buyOrdersTotalAmount > 0) {
                      const idealBuyPrice = buyOrdersTotalAmount / buyQuantity
                      buySlippage = (idealBuyPrice - buyPrice) * buyQuantity
                    }
                    
                    let sellSlippage = 0
                    if (sellQuantity > 0 && sellOrdersTotalAmount > 0) {
                      const idealSellPrice = sellOrdersTotalAmount / sellQuantity
                      sellSlippage = (sellPrice - idealSellPrice) * sellQuantity
                    }
                    
                    const totalSlippage = buySlippage + sellSlippage
                    const tradeCommission = parseFloat(item.tradeCommission) || 0
                    const otherFees = parseFloat(item.otherFees) || 0
                    const sellTradeCommission = parseFloat(item.sellTradeCommission) || 0
                    const sellOtherFees = parseFloat(item.sellOtherFees) || 0
                    const totalFees = tradeCommission + sellTradeCommission + otherFees + sellOtherFees
                    // 净盈亏额 = 盈亏金额 - 总手续费
                    const netProfit = profit - totalFees
                    
                    // 整数取整，有小数点取小数点2位四舍五入
                    const rounded = Math.round(netProfit * 100) / 100
                    const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    return <span>{formatted}</span>
                  }
                  if (field.key === 'slippage') {
                    // 优先使用数据库已计算的滑点字段
                    const dbSlippage = item.slippage != null ? parseFloat(item.slippage) : null
                    if (dbSlippage != null) {
                      const rounded = Math.round(dbSlippage * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}</span>
                    }
                    // 回退：从订单数据计算
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (sellQuantity === 0) {
                      return <span>0</span>
                    }
                    
                    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
                    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
                    
                    let buySlippage = 0
                    if (buyQuantity > 0 && buyAmount > 0) {
                      const idealBuyPrice = buyAmount / buyQuantity
                      buySlippage = (idealBuyPrice - buyPrice) * sellQuantity
                    }
                    
                    let sellSlippage = 0
                    if (sellQuantity > 0 && sellAmount > 0) {
                      const idealSellPrice = sellAmount / sellQuantity
                      sellSlippage = (sellPrice - idealSellPrice) * sellQuantity
                    }
                    
                    const totalSlippage = buySlippage + sellSlippage
                    const rounded = Math.round(totalSlippage * 100) / 100
                    const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    return <span>{formatted}</span>
                  }
                  if (field.key === 'slippageNetProfitRatio') {
                    // 优先使用数据库已计算的滑净盈比字段
                    const dbRatio = item.slippageNetProfitRatio != null ? parseFloat(item.slippageNetProfitRatio) : null
                    if (dbRatio != null) {
                      const rounded = Math.round(dbRatio * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}%</span>
                    }
                    // 回退：从数据库已计算的滑点和净盈亏额反推
                    const dbSlippage = item.slippage != null ? parseFloat(item.slippage) : 0
                    const dbNetProfit = item.netProfit != null ? parseFloat(item.netProfit) : null
                    
                    if (dbNetProfit != null && dbNetProfit !== 0) {
                      const ratio = dbSlippage / Math.abs(dbNetProfit) * 100
                      const adjustedRatio = Math.max(0, ratio)
                      const rounded = Math.round(adjustedRatio * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}%</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'profitPercent') {
                    // 优先使用数据库已计算的盈亏比例字段
                    const dbProfitPercent = item.profitPercent != null ? parseFloat(item.profitPercent) : null
                    if (dbProfitPercent != null) {
                      const rounded = Math.round(dbProfitPercent * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}%</span>
                    }
                    // 回退：从订单数据计算
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (sellQuantity === 0) {
                      return <span>-</span>
                    }
                    
                    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
                    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
                    
                    if (buyPrice > 0) {
                      const profitPercent = (sellPrice - buyPrice) / buyPrice * 100
                      const rounded = Math.round(profitPercent * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}%</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'name') {
                    return <span>{item.name || '-'}</span>
                  }
                  if (field.key === 'tradeStatus') {
                    const sellQty = item.sellQuantity || 0
                    const buyQty = item.buyQuantity || 0
                    if (sellQty === 0 && buyQty === 0) {
                      return <span>-</span>
                    }
                    const status = sellQty >= buyQty ? '结束' : '持仓中'
                    return <span>{status}</span>
                  }
                  if (field.key === 'buyGrade') {
                    // 优先使用数据库已计算的买入评级字段
                    if (item.buyGrade) {
                      return <span>{item.buyGrade}</span>
                    }
                    // 回退：从行情数据计算（未来行情数据接入后启用）
                    const buyHighPrice = item.buyHighPrice
                    const buyLowPrice = item.buyLowPrice
                    const actualBuyPrice = parseFloat(item.buyPrice) || 0
                    
                    if (!buyHighPrice || !buyLowPrice || actualBuyPrice === 0) {
                      return <span>-</span>
                    }
                    
                    if (buyHighPrice === buyLowPrice) {
                      return <span>-</span>
                    }
                    
                    const rating = (buyHighPrice - actualBuyPrice) / (buyHighPrice - buyLowPrice)
                    let grade = '-'
                    if (rating >= 0.75) grade = 'A'
                    else if (rating >= 0.5) grade = 'B'
                    else if (rating >= 0.25) grade = 'C'
                    else grade = 'D'
                    
                    return <span>{grade}</span>
                  }
                  if (field.key === 'sellGrade') {
                    // 优先使用数据库已计算的卖出评级字段
                    if (item.sellGrade) {
                      return <span>{item.sellGrade}</span>
                    }
                    // 回退：从行情数据计算（未来行情数据接入后启用）
                    const sellHighPrice = item.sellHighPrice
                    const sellLowPrice = item.sellLowPrice
                    const actualSellPrice = parseFloat(item.sellPrice) || 0
                    
                    if (!sellHighPrice || !sellLowPrice || actualSellPrice === 0) {
                      return <span>-</span>
                    }
                    
                    if (sellHighPrice === sellLowPrice) {
                      return <span>-</span>
                    }
                    
                    const rating = (actualSellPrice - sellLowPrice) / (sellHighPrice - sellLowPrice)
                    let grade = '-'
                    if (rating >= 0.75) grade = 'A'
                    else if (rating >= 0.5) grade = 'B'
                    else if (rating >= 0.25) grade = 'C'
                    else grade = 'D'
                    
                    return <span>{grade}</span>
                  }
                  if (field.key === 'upperBand') {
                    // 优先使用数据库通道上轨字段
                    const dbUpperBand = item.upperBand != null ? parseFloat(item.upperBand) : null
                    if (dbUpperBand != null) {
                      const rounded = Math.round(dbUpperBand * 100) / 100
                      return <span>{Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}</span>
                    }
                    // 回退：从 buyChannel 对象获取
                    const fallback = item.buyChannel?.upperBand
                    if (fallback != null) {
                      const rounded = Math.round(parseFloat(fallback) * 100) / 100
                      return <span>{Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'lowerBand') {
                    // 优先使用数据库通道下轨字段
                    const dbLowerBand = item.lowerBand != null ? parseFloat(item.lowerBand) : null
                    if (dbLowerBand != null) {
                      const rounded = Math.round(dbLowerBand * 100) / 100
                      return <span>{Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}</span>
                    }
                    // 回退：从 buyChannel 对象获取
                    const fallback = item.buyChannel?.lowerBand
                    if (fallback != null) {
                      const rounded = Math.round(parseFloat(fallback) * 100) / 100
                      return <span>{Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'tradeSummary') {
                    return <span>{item.tradeSummary || '-'}</span>
                  }
                  if (field.key === 'overallScore') {
                    // 交易评级 = (实际卖出价 - 实际买入价) / (通道上轨 - 通道下轨)
                    const actualBuyPrice = parseFloat(item.buyPrice) || 0
                    const actualSellPrice = parseFloat(item.sellPrice) || 0
                    const upperBand = item.buyChannel?.upperBand ? parseFloat(item.buyChannel.upperBand) : 0
                    const lowerBand = item.buyChannel?.lowerBand ? parseFloat(item.buyChannel.lowerBand) : 0
                    
                    // 如果通道上下轨相等或为0，无法计算评级
                    if (upperBand === 0 || lowerBand === 0 || upperBand === lowerBand) {
                      return <span>-</span>
                    }
                    
                    if (actualBuyPrice === 0 || actualSellPrice === 0) {
                      return <span>-</span>
                    }
                    
                    // 计算交易评级
                    const rating = (actualSellPrice - actualBuyPrice) / (upperBand - lowerBand)
                    
                    // ABCD归一化：A级是最高评级
                    let grade = '-'
                    if (rating >= 0.75) {
                      grade = 'A'
                    } else if (rating >= 0.5) {
                      grade = 'B'
                    } else if (rating >= 0.25) {
                      grade = 'C'
                    } else {
                      grade = 'D'
                    }
                    
                    return <span>{grade}</span>
                  }
                  if (field.key === 'buyStrategyName') {
                    // 获取第2选择的买入策略名称
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    if (buyOrders.length > 0) {
                      // 使用第2个买入订单的策略作为"第2选择的策略"
                      const secondBuyOrder = buyOrders.length >= 2 ? buyOrders[1] : buyOrders[0]
                      if (secondBuyOrder && secondBuyOrder.strategyId) {
                        const strategyName = getStrategyName(secondBuyOrder.strategyId, '买入')
                        return <span>{strategyName}</span>
                      }
                    }
                    // 如果没有找到第2选择，则使用tradeRecord中的策略ID
                    if (item.buyStrategyId) {
                      const strategyName = getStrategyName(item.buyStrategyId, '买入')
                      return <span>{strategyName}</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'buyStrategyScore') {
                    // 获取买入策略评估分数
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    if (buyOrders.length > 0) {
                      // 使用第2个买入订单的策略分数作为"第2选择的策略评估"
                      const secondBuyOrder = buyOrders.length >= 2 ? buyOrders[1] : buyOrders[0]
                      return <span>{secondBuyOrder.strategyScore !== undefined ? secondBuyOrder.strategyScore : ''}</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'sellStrategyName') {
                    // 获取第2选择的卖出策略名称
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    if (sellOrders.length > 0) {
                      // 使用第2个卖出订单的策略作为"第2选择的策略"
                      const secondSellOrder = sellOrders.length >= 2 ? sellOrders[1] : sellOrders[0]
                      if (secondSellOrder && secondSellOrder.strategyId) {
                        const strategyName = getStrategyName(secondSellOrder.strategyId, '卖出')
                        return <span>{strategyName}</span>
                      }
                    }
                    // 如果没有找到第2选择，则使用tradeRecord中的策略ID
                    if (item.sellStrategyId) {
                      const strategyName = getStrategyName(item.sellStrategyId, '卖出')
                      return <span>{strategyName}</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'sellStrategyScore') {
                    // 获取卖出策略评估分数
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    if (sellOrders.length > 0) {
                      // 使用第2个卖出订单的策略分数作为"第2选择的策略评估"
                      const secondSellOrder = sellOrders.length >= 2 ? sellOrders[1] : sellOrders[0]
                      return <span>{secondSellOrder.strategyScore !== undefined ? secondSellOrder.strategyScore : ''}</span>
                    }
                    return <span>-</span>
                  }
                  return null
                }}
                emptyStateProps={{
                  Component: EmptyState,
                  props: { message: '暂无数据' }
                }}
              />
            </div>
          </div>
        </div>

        {/* 分页器 */}
        <div style={{ position: 'absolute', right: '0', bottom: '0', height: '50px', zIndex: '10', width: '100%' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page)
              setSelectedIds([])
            }}
            selectedCount={selectedIds.length}
            totalCount={filteredRecords.length}
          />
        </div>
      </div>

      {/* 导出弹窗 */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleConfirmExport}
        exportFormat={exportFormat}
        onFormatChange={(format) => setExportFormat(format)}
        totalCount={filteredRecords.length}
      />

      {/* 交易总结弹窗 */}
      <FormModal
        isOpen={showSummaryModal}
        onClose={() => {
          setShowSummaryModal(false)
          setEditingTradeId(null)
          setSummaryFormErrors({})
          setSummaryFormData({})
        }}
        onSubmit={handleSummaryFormSubmit}
        title="交易结案"
        fields={SUMMARY_FIELDS}
        formData={summaryFormData}
        formErrors={summaryFormErrors}
        onFormDataChange={handleSummaryFormDataChange}
        width="max-w-2xl"
      />

      {/* 买入详情弹窗 */}
      <FormModal
        isOpen={showBuyDetailModal}
        onClose={handleDetailModalClose}
        onSubmit={handleBuyDetailSubmit}
        title="买入详情"
        fields={BUY_DETAIL_FIELDS}
        formData={buyDetailFormData}
        formErrors={buyDetailFormErrors}
        onFormDataChange={handleBuyDetailFormDataChange}
        width="max-w-2xl"
        hideButtons={true}
      />

      {/* 卖出详情弹窗 */}
      <FormModal
        isOpen={showSellDetailModal}
        onClose={handleDetailModalClose}
        onSubmit={handleSellDetailSubmit}
        title="卖出详情"
        fields={SELL_DETAIL_FIELDS}
        formData={sellDetailFormData}
        formErrors={sellDetailFormErrors}
        onFormDataChange={handleSellDetailFormDataChange}
        width="max-w-2xl"
        hideButtons={true}
      />
    </div>
  )
}

export default TradeRecords
