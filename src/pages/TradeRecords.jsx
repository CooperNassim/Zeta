import React, { useState } from 'react'
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
import StockChartModal from '../components/StockChartModal'
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
  if (!amount || amount === null || amount === undefined) return '-'
  const num = parseFloat(amount)
  if (isNaN(num)) return '-'
  const rounded = Math.round(num * 100) / 100
  const isInteger = Number.isInteger(rounded)
  const formatted = isInteger ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return formatted
}

// 格式化价格，整数显示整数，小数正常显示小数
const formatPrice = (price) => {
  if (!price || price === null || price === undefined) return '-'
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
  if (!value || typeof value !== 'string') return parseFloat(value) || 0
  // 移除千位分隔符和其他非数字字符（保留小数点）
  const cleaned = value.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
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
  const [showStockChartModal, setShowStockChartModal] = useState(false)
  const [chartRecord, setChartRecord] = useState(null)
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
        const sellQty = r.sellQuantity || 0
        const buyQty = r.buyQuantity || 0
        if (filterTradeStatus === 'holding') {
          return sellQty < buyQty
        } else if (filterTradeStatus === 'finished') {
          return sellQty >= buyQty
        }
        return true
      })
    }

    // 按交易编号合并记录，同一交易编号只显示一条记录
    const mergedRecordsMap = new Map()

    result.forEach(r => {
      if (mergedRecordsMap.has(r.tradeNumber)) {
        // 已存在该交易编号的记录，合并信息
        const existing = mergedRecordsMap.get(r.tradeNumber)
        if (r.buyTime && !existing.buyTime) {
          // 更新买入信息
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
        if (r.sellTime && !existing.sellTime) {
          // 更新卖出信息
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
        // 更新最新时间和评分
        if (r.createdAt) existing.createdAt = r.createdAt
        if (r.overallScore) existing.overallScore = r.overallScore
        // 优先取非空的 tradeSummary
        if (r.tradeSummary && !existing.tradeSummary) {
          existing.tradeSummary = r.tradeSummary
        }
      } else {
        // 新建该交易编号的记录
        mergedRecordsMap.set(r.tradeNumber, { ...r })
      }
    })

    // 转换为数组并按时间降序排序
    const mergedRecords = Array.from(mergedRecordsMap.values())
    mergedRecords.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    return mergedRecords
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
    if (selectedIds.length !== 1) return

    // 从合并后的数据中获取记录，确保获取完整的合并数据
    const record = filteredRecords.find(r => r.id === selectedIds[0])
    if (!record) return

    setEditingTradeId(selectedIds[0])
    setSummaryFormData({
      buyPrice: record.buyPrice ? formatPrice(record.buyPrice) : '',
      tradeCommission: formatFee(record.tradeCommission),
      otherFees: formatFee(record.otherFees),
      sellPrice: record.sellPrice ? formatPrice(record.sellPrice) : '',
      sellTradeCommission: formatFee(record.sellTradeCommission),
      sellOtherFees: formatFee(record.sellOtherFees),
      tradeSummary: record.tradeSummary || ''
    })
    setSummaryFormErrors({})
    setShowSummaryModal(true)
  }

  const handleSummaryFormSubmit = async (e) => {
    e.preventDefault()

    const errors = {}
    SUMMARY_FIELDS.forEach(field => {
      if (field.required && (!summaryFormData[field.key] || summaryFormData[field.key].toString().trim() === '')) {
        errors[field.key] = '不能为空'
      }
    })

    if (Object.keys(errors).length > 0) {
      setSummaryFormErrors(errors)
      return
    }

    try {
      // 获取当前记录的交易编号
      const currentRecord = filteredRecords.find(r => r.id === editingTradeId)
      if (!currentRecord) {
        showToast('记录不存在', 'error')
        return
      }
      const tradeNumber = currentRecord.tradeNumber

      // 找到同一交易编号下的所有记录ID
      const sameTradeRecords = tradeRecords.filter(r => r.tradeNumber === tradeNumber && !r.deleted)
      const recordIds = sameTradeRecords.map(r => r.id)

      // 更新同一交易编号下的所有记录
      const updatePromises = recordIds.map(id =>
        fetch('/api/trade_records/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buy_price: parsePrice(summaryFormData.buyPrice),
            trade_commission: summaryFormData.tradeCommission.trim(),
            other_fees: summaryFormData.otherFees.trim(),
            sell_price: parsePrice(summaryFormData.sellPrice),
            sell_trade_commission: summaryFormData.sellTradeCommission.trim(),
            sell_other_fees: summaryFormData.sellOtherFees.trim(),
            trade_summary: summaryFormData.tradeSummary.trim()
          })
        }).then(res => res.json())
      )

      const responses = await Promise.all(updatePromises)
      const allSuccess = responses.every(r => r.success)

      if (allSuccess) {
        // 保存成功，直接更新本地状态避免数据同步覆盖
        const store = useStore.getState()
        const updatedRecords = store.tradeRecords.map(record => {
          if (recordIds.includes(record.id)) {
            return {
              ...record,
              // 更新结案相关字段
              buyPrice: parsePrice(summaryFormData.buyPrice),
              tradeCommission: summaryFormData.tradeCommission.trim(),
              otherFees: summaryFormData.otherFees.trim(),
              sellPrice: parsePrice(summaryFormData.sellPrice),
              sellTradeCommission: summaryFormData.sellTradeCommission.trim(),
              sellOtherFees: summaryFormData.sellOtherFees.trim(),
              tradeSummary: summaryFormData.tradeSummary.trim()
            }
          }
          return record
        })
        store.importTradeRecords(updatedRecords)
        
        showToast('保存成功', 'success')
        setShowSummaryModal(false)
        setEditingTradeId(null)
        setSelectedIds([])  // 清空选中状态
      } else {
        showToast('保存失败', 'error')
      }
    } catch (error) {
      console.error('保存交易结案失败:', error)
      showToast('保存失败', 'error')
    }
  }

  const handleShowBuyDetail = (record) => {
    setDetailRecord(record)
    // 买入成交价格取交易结案弹窗的值(record.buyPrice)
    const buyPriceValue = record.buyPrice ? formatPrice(record.buyPrice) : ''
    // 理想买入价：从股票交易模块获取同一交易编号的买入类型订单
    const buyOrders = orders.filter(o => o.tradeNumber === record.tradeNumber && o.type === 'buy')
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
    // 计算买入滑点：使用精确的理想买入价计算，避免四舍五入误差
    // 成交价格 > 订单价格 = 亏钱（负数），成交价格 < 订单价格 = 赚钱（正数）
    let buySlippage = null
    if (buyOrderPriceExact > 0 &&
        record.buyPrice !== null && record.buyPrice !== undefined &&
        buyOrdersTotalQuantity > 0) {
      const priceDiff = buyOrderPriceExact - parseFloat(record.buyPrice)
      buySlippage = priceDiff * buyOrdersTotalQuantity
    }
    // 获取买入策略名称：从股票交易列表的策略名称取值
    const buyOrder = orders.find(o => String(o.id) === String(record.buyOrderId))
    let buyStrategyValue = ''
    
    console.log('🔍 [Debug Strategy] 查找买入策略:')
    console.log('   - buyOrder:', buyOrder)
    console.log('   - record.buyStrategyId:', record.buyStrategyId)
    console.log('   - strategyRecords长度:', strategyRecords.length)
    
    // 详细记录所有的策略ID
    const strategyIds = strategyRecords.map(s => s.id)
    console.log('   - 所有策略ID:', strategyIds)
    console.log('   - 策略记录详细:', strategyRecords)
    
    // 使用策略记录查找策略名称
    if (buyOrder && buyOrder.strategyId) {
      console.log('   - 从订单策略ID查找:', buyOrder.strategyId, ', ID类型:', typeof buyOrder.strategyId)
      const strategy = strategyRecords.find(s => {
        console.log('     - 比较:', s.id, '(类型:', typeof s.id, ') 与', buyOrder.strategyId, '(类型:', typeof buyOrder.strategyId, ')')
        return s.id === buyOrder.strategyId
      })
      console.log('   - 查找结果:', strategy)
      buyStrategyValue = strategy ? strategy.name : ''
    } else if (record.buyStrategyId) {
      console.log('   - 从交易记录策略ID查找:', record.buyStrategyId, ', ID类型:', typeof record.buyStrategyId)
      const strategy = strategyRecords.find(s => {
        console.log('     - 比较:', s.id, '(类型:', typeof s.id, ') 与', record.buyStrategyId, '(类型:', typeof record.buyStrategyId, ')')
        return s.id === record.buyStrategyId
      })
      console.log('   - 查找结果:', strategy)
      buyStrategyValue = strategy ? strategy.name : ''
    }
    
    console.log('   - 最终策略名称:', buyStrategyValue)
    // 买入金额 = 实际买入价 × 股票交易列表买入数量
    const buyAmountValue = record.buyPrice && buyOrdersTotalQuantity > 0
      ? formatAmount(parseFloat(record.buyPrice) * buyOrdersTotalQuantity)
      : ''

    const formData = {
      high: record.buyChannel?.high ? formatAmount(record.buyChannel.high) : '',
      low: record.buyChannel?.low ? formatAmount(record.buyChannel.low) : '',
      buyQuantity: buyOrdersTotalQuantity || 0,  // 取股票交易列表的Σ交易数量
      buyAmount: buyAmountValue,
      buyPrice: buyPriceValue,
      buyOrderPrice: buyOrderPriceValue ? formatPrice(buyOrderPriceValue) : '',
      buySlippage: buySlippage !== null ? formatSlippage(buySlippage) : '-',
      tradeCommission: formatFee(record.tradeCommission),
      otherFees: formatFee(record.otherFees),
      buyStrategy: buyStrategyValue,
      buyTime: formatDate(record.buyTime)
    }
    setBuyDetailFormData(formData)
    setBuyDetailFormErrors({})
    setShowBuyDetailModal(true)
  }

  const handleShowSellDetail = (record) => {
    setDetailRecord(record)
    // 理想卖出价：从股票交易模块获取同一交易编号的卖出类型订单
    const sellOrders = orders.filter(o => o.tradeNumber === record.tradeNumber && o.type === 'sell')
    let sellOrderPriceValue = ''       // 显示用的理想卖出价（四舍五入）
    let sellOrderPriceExact = 0        // 计算用的精确理想卖出价
    let sellOrdersTotalQuantity = 0    // 股票交易列表的卖出总数量
    let sellOrdersTotalAmount = 0      // 股票交易列表的卖出总金额
    if (sellOrders.length === 1) {
      // 只有一个卖出订单，直接取交易价格
      sellOrderPriceValue = sellOrders[0].price ?? ''
      sellOrderPriceExact = parseFloat(sellOrders[0].price) || 0
      sellOrdersTotalQuantity = parseFloat(sellOrders[0].quantity) || 0
      sellOrdersTotalAmount = (parseFloat(sellOrders[0].price) || 0) * (parseFloat(sellOrders[0].quantity) || 0)
    } else if (sellOrders.length > 1) {
      // 多个卖出订单，计算平均价格：Σ交易金额/交易数量
      // 交易金额 = 交易价格 * 交易数量
      sellOrders.forEach(o => {
        const price = parseFloat(o.price) || 0
        const quantity = parseFloat(o.quantity) || 0
        sellOrdersTotalAmount += price * quantity  // 累加交易金额
        sellOrdersTotalQuantity += quantity         // 累加交易数量
      })
      if (sellOrdersTotalQuantity > 0) {
        sellOrderPriceExact = sellOrdersTotalAmount / sellOrdersTotalQuantity  // 精确值
        // 显示时四舍五入，整数取整，有小数点取小数点2位四舍五入
        const rounded = Math.round(sellOrderPriceExact * 100) / 100
        sellOrderPriceValue = rounded
      }
    }
    // 卖出成交价格取交易结案弹窗的值(record.sellPrice)
    const sellPriceValue = record.sellPrice ? formatPrice(record.sellPrice) : ''
    // 计算卖出滑点：使用精确的理想卖出价计算，避免四舍五入误差
    // 成交价格 < 订单价格 = 亏钱（负数），成交价格 > 订单价格 = 赚钱（正数）
    let sellSlippage = null
    if (sellOrderPriceExact > 0 &&
        record.sellPrice !== null && record.sellPrice !== undefined &&
        sellOrdersTotalQuantity > 0) {
      const priceDiff = parseFloat(record.sellPrice) - sellOrderPriceExact
      sellSlippage = priceDiff * sellOrdersTotalQuantity
    }
    // 获取卖出策略名称：从股票交易列表的策略名称取值
    const sellOrder = orders.find(o => o.tradeNumber === record.tradeNumber && o.type === 'sell')
    let sellStrategyValue = ''
    
    console.log('🔍 [Debug Sell Strategy] 查找卖出策略:')
    console.log('   - sellOrder:', sellOrder)
    console.log('   - record.sellStrategyId:', record.sellStrategyId)
    console.log('   - strategyRecords长度:', strategyRecords.length)
    
    // 详细记录所有的策略ID
    const strategyIds = strategyRecords.map(s => s.id)
    console.log('   - 所有策略ID:', strategyIds)
    console.log('   - 策略记录详细:', strategyRecords)
    
    // 使用策略记录查找策略名称
    if (sellOrder && sellOrder.strategyId) {
      console.log('   - 从订单策略ID查找:', sellOrder.strategyId, ', ID类型:', typeof sellOrder.strategyId)
      const strategy = strategyRecords.find(s => {
        console.log('     - 比较:', s.id, '(类型:', typeof s.id, ') 与', sellOrder.strategyId, '(类型:', typeof sellOrder.strategyId, ')')
        return s.id === sellOrder.strategyId
      })
      console.log('   - 查找结果:', strategy)
      sellStrategyValue = strategy ? strategy.name : ''
    } else if (record.sellStrategyId) {
      console.log('   - 从交易记录策略ID查找:', record.sellStrategyId, ', ID类型:', typeof record.sellStrategyId)
      const strategy = strategyRecords.find(s => {
        console.log('     - 比较:', s.id, '(类型:', typeof s.id, ') 与', record.sellStrategyId, '(类型:', typeof record.sellStrategyId, ')')
        return s.id === record.sellStrategyId
      })
      console.log('   - 查找结果:', strategy)
      sellStrategyValue = strategy ? strategy.name : ''
    }
    
    console.log('   - 最终策略名称:', sellStrategyValue)
    // 卖出金额 = 实际卖出价 × 股票交易列表卖出数量
    const sellAmountValue = record.sellPrice && sellOrdersTotalQuantity > 0
      ? formatAmount(parseFloat(record.sellPrice) * sellOrdersTotalQuantity)
      : ''

    const formData = {
      high: record.sellChannel?.high ? formatAmount(record.sellChannel.high) : '',
      low: record.sellChannel?.low ? formatAmount(record.sellChannel.low) : '',
      sellQuantity: sellOrdersTotalQuantity || 0,  // 取股票交易列表的Σ交易数量
      sellAmount: sellAmountValue,
      sellPrice: sellPriceValue,
      sellOrderPrice: sellOrderPriceValue ? formatPrice(sellOrderPriceValue) : '',
      sellSlippage: sellSlippage !== null ? formatSlippage(sellSlippage) : '-',
      tradeCommission: formatFee(record.sellTradeCommission),
      otherFees: formatFee(record.sellOtherFees),
      sellStrategy: sellStrategyValue,
      sellTime: formatDate(record.sellTime)
    }
    setSellDetailFormData(formData)
    setSellDetailFormErrors({})
    setShowSellDetailModal(true)
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
      // 保存到数据库
      const response = await fetch('/api/trade_records/' + detailRecord.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buy_price: parsePrice(buyDetailFormData.buyPrice),
          trade_commission: buyDetailFormData.tradeCommission.trim(),
          other_fees: buyDetailFormData.otherFees.trim()
        })
      }).then(res => res.json())

      if (response.success) {
        // 从数据库重新同步数据
        await fetch('/api/sync/all')
          .then(res => res.json())
          .then(syncResponse => {
            if (syncResponse.success && syncResponse.data && syncResponse.data.trade_records !== undefined) {
              const { trade_records } = syncResponse.data
              useStore.getState().importTradeRecords(trade_records)
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

  const handleBuyDetailFormDataChange = (newFormData, clearError = null) => {
    // 如果买价格或买入成交价格改变，重新计算买入滑点
    if (newFormData.buyPrice !== undefined || newFormData.buyOrderPrice !== undefined) {
      const buyPrice = parsePrice(newFormData.buyPrice !== undefined ? newFormData.buyPrice : buyDetailFormData.buyPrice)
      const buyOrderPrice = parsePrice(newFormData.buyOrderPrice !== undefined ? newFormData.buyOrderPrice : buyDetailFormData.buyOrderPrice)
      const buyQuantity = detailRecord?.buyQuantity || 0

      if (buyPrice !== null && buyPrice !== undefined && !isNaN(buyPrice) &&
          buyOrderPrice !== null && buyOrderPrice !== undefined && !isNaN(buyOrderPrice) &&
          buyQuantity !== null && buyQuantity !== undefined && !isNaN(buyQuantity)) {
        // 买入滑点：(买入价格 - 买入成交价格) × 买入数量
        // 成交价格 > 订单价格 = 亏钱（负数），成交价格 < 订单价格 = 赚钱（正数）
        const slippageValue = (buyOrderPrice - buyPrice) * buyQuantity
        newFormData.buySlippage = formatSlippage(slippageValue)
      } else {
        newFormData.buySlippage = '-'
      }
    }

    setBuyDetailFormData(newFormData)
    if (clearError) {
      setBuyDetailFormErrors(prev => ({ ...prev, ...clearError }))
    }
  }

  const handleSellDetailSubmit = async (e) => {
    e.preventDefault()

    const errors = {}
    const requiredFields = ['sellPrice', 'tradeCommission', 'otherFees']
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
      // 保存到数据库
      const response = await fetch('/api/trade_records/' + detailRecord.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sell_price: parsePrice(sellDetailFormData.sellPrice),
          sell_trade_commission: sellDetailFormData.tradeCommission?.toString().trim() || '',
          sell_other_fees: sellDetailFormData.otherFees?.toString().trim() || ''
        })
      }).then(res => res.json())

      if (response.success) {
        // 从数据库重新同步数据
        await fetch('/api/sync/all')
          .then(res => res.json())
          .then(syncResponse => {
            if (syncResponse.success && syncResponse.data && syncResponse.data.trade_records !== undefined) {
              const { trade_records } = syncResponse.data
              useStore.getState().importTradeRecords(trade_records)
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

  const handleSellDetailFormDataChange = (newFormData, clearError = null) => {
    // 如果卖出价格或卖出成交价格改变，重新计算卖出滑点
    if (newFormData.sellPrice !== undefined || newFormData.sellOrderPrice !== undefined) {
      const sellPrice = parsePrice(newFormData.sellPrice !== undefined ? newFormData.sellPrice : sellDetailFormData.sellPrice)
      const sellOrderPrice = parsePrice(newFormData.sellOrderPrice !== undefined ? newFormData.sellOrderPrice : sellDetailFormData.sellOrderPrice)
      const sellQuantity = detailRecord?.sellQuantity || 0

      if (sellPrice !== null && sellPrice !== undefined && !isNaN(sellPrice) &&
          sellOrderPrice !== null && sellOrderPrice !== undefined && !isNaN(sellOrderPrice) &&
          sellQuantity !== null && sellQuantity !== undefined && !isNaN(sellQuantity)) {
        // 卖出滑点：(卖出成交价格 - 卖出价格) × 卖出数量
        // 成交价格 < 订单价格 = 亏钱（负数），成交价格 > 订单价格 = 赚钱（正数）
        const slippageValue = (sellPrice - sellOrderPrice) * sellQuantity
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
    setBuyDetailFormData({})
    setBuyDetailFormErrors({})
    setSellDetailFormData({})
    setSellDetailFormErrors({})
  }

  const getStrategyName = (strategyId, type) => {
    const strategyList = strategies[type] || []
    const strategy = strategyList.find(s => s.id === String(strategyId))
    return strategy ? strategy.name : '-'
  }

  const handleSummaryFormDataChange = (newFormData, clearError = null) => {
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
      required: true,
      grid: true
    },
    {
      key: 'tradeCommission',
      label: '买入佣金',
      type: 'text',
      placeholder: '请输入',
      required: true,
      grid: true
    },
    {
      key: 'otherFees',
      label: '买入其他费用',
      type: 'text',
      placeholder: '请输入',
      required: true,
      grid: true
    },
    {
      key: 'sellPrice',
      label: '实际卖出价',
      type: 'text',
      inputType: 'number',
      placeholder: '请输入',
      required: true,
      grid: true
    },
    {
      key: 'sellTradeCommission',
      label: '卖出佣金',
      type: 'text',
      placeholder: '请输入',
      required: true,
      grid: true
    },
    {
      key: 'sellOtherFees',
      label: '卖出其他费用',
      type: 'text',
      placeholder: '请输入',
      required: true,
      grid: true
    },
    {
      key: 'tradeSummary',
      label: '交易总结',
      type: 'textarea',
      placeholder: '请输入',
      required: true,
      rows: 4,
      fullWidth: true
    }
  ]

  const SELL_DETAIL_FIELDS = [
    {
      key: 'sellPrice',
      label: '实际卖出价',
      readonly: true,
      notRequired: true,
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
      key: 'tradeCommission',
      label: '卖出佣金',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'otherFees',
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
    
    let buyQuantity = 0
    let buyOrdersTotalAmount = 0
    buyOrders.forEach(o => {
      buyQuantity += parseFloat(o.quantity) || 0
      buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
    })
    
    let sellQuantity = 0
    let sellOrdersTotalAmount = 0
    sellOrders.forEach(o => {
      sellQuantity += parseFloat(o.quantity) || 0
      sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
    })
    
    const buyPrice = parseFloat(item.buyPrice) || 0
    const sellPrice = parseFloat(item.sellPrice) || 0
    const buyAmount = buyPrice * buyQuantity
    const sellAmount = sellPrice * sellQuantity
    
    // 计算买入滑点
    let buySlippage = 0
    if (buyQuantity > 0 && buyOrdersTotalAmount > 0) {
      const idealBuyPrice = buyOrdersTotalAmount / buyQuantity
      buySlippage = (idealBuyPrice - buyPrice) * buyQuantity
    }
    
    // 计算卖出滑点
    let sellSlippage = 0
    if (sellQuantity > 0 && sellOrdersTotalAmount > 0) {
      const idealSellPrice = sellOrdersTotalAmount / sellQuantity
      sellSlippage = (sellPrice - idealSellPrice) * sellQuantity
    }
    
    const totalSlippage = buySlippage + sellSlippage
    const profit = sellAmount - buyAmount
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
      case 'sellAmount':
        return item.sellAmount ? formatAmount(item.sellAmount) : '-'
      case 'tradeStatus': {
        const sellQty = item.sellQuantity || 0
        const buyQty = item.buyQuantity || 0
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
        return buyQuantity > 0 || sellQuantity > 0 ? formatNum(profit) : '-'
      case 'profitPercent':
        if (buyAmount > 0) {
          const profitPercent = profit / buyAmount * 100
          return formatNum(profitPercent) + '%'
        }
        return '-'
      case 'netProfit':
        return buyQuantity > 0 || sellQuantity > 0 ? formatNum(netProfit) : '-'
      case 'netProfitPercent':
        if (buyAmount > 0) {
          const netProfitPercent = netProfit / buyAmount * 100
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
        return buyQuantity > 0 || sellQuantity > 0 ? formatNum(totalSlippage) : '-'
      case 'slippageNetProfitRatio':
        if (netProfit !== 0) {
          const ratio = totalSlippage / Math.abs(netProfit) * 100
          return formatNum(ratio) + '%'
        }
        return '-'
      case 'upperBand':
        return item.buyChannel?.upperBand ? item.buyChannel.upperBand.toFixed(2) : '-'
      case 'lowerBand':
        return item.buyChannel?.lowerBand ? item.buyChannel.lowerBand.toFixed(2) : '-'
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
                  if (field.key === 'buyAmount') {
                    const amount = item.buyAmount
                    if (!amount || amount === null || amount === undefined) return <span>-</span>
                    return (
                      <button
                        onClick={() => handleShowBuyDetail(item)}
                        className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {formatAmount(amount)}
                      </button>
                    )
                  }
                  if (field.key === 'sellAmount') {
                    const amount = item.sellAmount
                    if (!amount || amount === null || amount === undefined) return <span>-</span>
                    return (
                      <button
                        onClick={() => handleShowSellDetail(item)}
                        className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {formatAmount(amount)}
                      </button>
                    )
                  }
                  if (field.key === 'profit') {
                    // 盈亏金额 = 卖出金额 - 买入金额
                    // 买入金额 = 实际买入价 × 股票交易列表买入数量
                    // 卖出金额 = 实际卖出价 × 股票交易列表卖出数量
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    let buyQuantity = 0
                    buyOrders.forEach(o => {
                      buyQuantity += parseFloat(o.quantity) || 0
                    })
                    
                    let sellQuantity = 0
                    sellOrders.forEach(o => {
                      sellQuantity += parseFloat(o.quantity) || 0
                    })
                    
                    const buyPrice = parseFloat(item.buyPrice) || 0
                    const sellPrice = parseFloat(item.sellPrice) || 0
                    
                    const buyAmount = buyPrice * buyQuantity
                    const sellAmount = sellPrice * sellQuantity
                    const profit = sellAmount - buyAmount
                    
                    // 整数取整，有小数点取小数点2位四舍五入
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
                    // 净盈亏比 = (盈亏金额 - 滑点) / 买入金额 × 100%
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    let buyQuantity = 0
                    let buyOrdersTotalAmount = 0  // 股票交易列表买入总金额（用于计算理想买入价）
                    buyOrders.forEach(o => {
                      buyQuantity += parseFloat(o.quantity) || 0
                      buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    let sellQuantity = 0
                    let sellOrdersTotalAmount = 0  // 股票交易列表卖出总金额（用于计算理想卖出价）
                    sellOrders.forEach(o => {
                      sellQuantity += parseFloat(o.quantity) || 0
                      sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    const buyPrice = parseFloat(item.buyPrice) || 0
                    const sellPrice = parseFloat(item.sellPrice) || 0
                    
                    const buyAmount = buyPrice * buyQuantity
                    const sellAmount = sellPrice * sellQuantity
                    const profit = sellAmount - buyAmount
                    
                    // 计算买入滑点 = (理想买入价 - 实际买入价) × 买入数量
                    let buySlippage = 0
                    if (buyQuantity > 0 && buyOrdersTotalAmount > 0) {
                      const idealBuyPrice = buyOrdersTotalAmount / buyQuantity
                      buySlippage = (idealBuyPrice - buyPrice) * buyQuantity
                    }
                    
                    // 计算卖出滑点 = (实际卖出价 - 理想卖出价) × 卖出数量
                    let sellSlippage = 0
                    if (sellQuantity > 0 && sellOrdersTotalAmount > 0) {
                      const idealSellPrice = sellOrdersTotalAmount / sellQuantity
                      sellSlippage = (sellPrice - idealSellPrice) * sellQuantity
                    }
                    
                    const totalSlippage = buySlippage + sellSlippage
                    
                    if (buyAmount > 0) {
                      const netProfitPercent = (profit - totalSlippage) / buyAmount * 100
                      // 整数取整，有小数点取小数点2位四舍五入
                      const rounded = Math.round(netProfitPercent * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}%</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'netProfit') {
                    // 净盈亏额 = 盈亏金额 - 滑点
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    let buyQuantity = 0
                    let buyOrdersTotalAmount = 0
                    buyOrders.forEach(o => {
                      buyQuantity += parseFloat(o.quantity) || 0
                      buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    let sellQuantity = 0
                    let sellOrdersTotalAmount = 0
                    sellOrders.forEach(o => {
                      sellQuantity += parseFloat(o.quantity) || 0
                      sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    const buyPrice = parseFloat(item.buyPrice) || 0
                    const sellPrice = parseFloat(item.sellPrice) || 0
                    
                    const buyAmount = buyPrice * buyQuantity
                    const sellAmount = sellPrice * sellQuantity
                    const profit = sellAmount - buyAmount
                    
                    // 计算买入滑点
                    let buySlippage = 0
                    if (buyQuantity > 0 && buyOrdersTotalAmount > 0) {
                      const idealBuyPrice = buyOrdersTotalAmount / buyQuantity
                      buySlippage = (idealBuyPrice - buyPrice) * buyQuantity
                    }
                    
                    // 计算卖出滑点
                    let sellSlippage = 0
                    if (sellQuantity > 0 && sellOrdersTotalAmount > 0) {
                      const idealSellPrice = sellOrdersTotalAmount / sellQuantity
                      sellSlippage = (sellPrice - idealSellPrice) * sellQuantity
                    }
                    
                    const totalSlippage = buySlippage + sellSlippage
                    const netProfit = profit - totalSlippage
                    
                    // 整数取整，有小数点取小数点2位四舍五入
                    const rounded = Math.round(netProfit * 100) / 100
                    const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    return <span>{formatted}</span>
                  }
                  if (field.key === 'slippage') {
                    // 滑点 = 买入滑点 + 卖出滑点
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    let buyQuantity = 0
                    let buyOrdersTotalAmount = 0
                    buyOrders.forEach(o => {
                      buyQuantity += parseFloat(o.quantity) || 0
                      buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    let sellQuantity = 0
                    let sellOrdersTotalAmount = 0
                    sellOrders.forEach(o => {
                      sellQuantity += parseFloat(o.quantity) || 0
                      sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    const buyPrice = parseFloat(item.buyPrice) || 0
                    const sellPrice = parseFloat(item.sellPrice) || 0
                    
                    // 计算买入滑点 = (理想买入价 - 实际买入价) × 买入数量
                    let buySlippage = 0
                    if (buyQuantity > 0 && buyOrdersTotalAmount > 0) {
                      const idealBuyPrice = buyOrdersTotalAmount / buyQuantity
                      buySlippage = (idealBuyPrice - buyPrice) * buyQuantity
                    }
                    
                    // 计算卖出滑点 = (实际卖出价 - 理想卖出价) × 卖出数量
                    let sellSlippage = 0
                    if (sellQuantity > 0 && sellOrdersTotalAmount > 0) {
                      const idealSellPrice = sellOrdersTotalAmount / sellQuantity
                      sellSlippage = (sellPrice - idealSellPrice) * sellQuantity
                    }
                    
                    const totalSlippage = buySlippage + sellSlippage
                    // 整数取整，有小数点取小数点2位四舍五入
                    const rounded = Math.round(totalSlippage * 100) / 100
                    const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    return <span>{formatted}</span>
                  }
                  if (field.key === 'slippageNetProfitRatio') {
                    // 滑净盈比 = 滑点 / 净盈亏额 × 100%
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    let buyQuantity = 0
                    let buyOrdersTotalAmount = 0
                    buyOrders.forEach(o => {
                      buyQuantity += parseFloat(o.quantity) || 0
                      buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    let sellQuantity = 0
                    let sellOrdersTotalAmount = 0
                    sellOrders.forEach(o => {
                      sellQuantity += parseFloat(o.quantity) || 0
                      sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    const buyPrice = parseFloat(item.buyPrice) || 0
                    const sellPrice = parseFloat(item.sellPrice) || 0
                    
                    const buyAmount = buyPrice * buyQuantity
                    const sellAmount = sellPrice * sellQuantity
                    const profit = sellAmount - buyAmount
                    
                    // 计算买入滑点
                    let buySlippage = 0
                    if (buyQuantity > 0 && buyOrdersTotalAmount > 0) {
                      const idealBuyPrice = buyOrdersTotalAmount / buyQuantity
                      buySlippage = (idealBuyPrice - buyPrice) * buyQuantity
                    }
                    
                    // 计算卖出滑点
                    let sellSlippage = 0
                    if (sellQuantity > 0 && sellOrdersTotalAmount > 0) {
                      const idealSellPrice = sellOrdersTotalAmount / sellQuantity
                      sellSlippage = (sellPrice - idealSellPrice) * sellQuantity
                    }
                    
                    const totalSlippage = buySlippage + sellSlippage
                    const netProfit = profit - totalSlippage
                    
                    // 滑净盈比 = 滑点 / 净盈亏额 × 100%
                    if (netProfit !== 0) {
                      const ratio = totalSlippage / Math.abs(netProfit) * 100
                      // 整数取整，有小数点取小数点2位四舍五入
                      const rounded = Math.round(ratio * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}%</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'profitPercent') {
                    // 盈亏比例 = 盈亏金额 / 买入金额 × 100%
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    let buyQuantity = 0
                    buyOrders.forEach(o => {
                      buyQuantity += parseFloat(o.quantity) || 0
                    })
                    
                    let sellQuantity = 0
                    sellOrders.forEach(o => {
                      sellQuantity += parseFloat(o.quantity) || 0
                    })
                    
                    const buyPrice = parseFloat(item.buyPrice) || 0
                    const sellPrice = parseFloat(item.sellPrice) || 0
                    
                    const buyAmount = buyPrice * buyQuantity
                    const sellAmount = sellPrice * sellQuantity
                    
                    if (buyAmount > 0) {
                      const profitPercent = (sellAmount - buyAmount) / buyAmount * 100
                      // 整数取整，有小数点取小数点2位四舍五入
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
                    // 买入评级 = (买入当天最高价 - 实际买入价) / (买入当天最高价 - 最低价)
                    // 最高价和最低价需要从行情数据获取，目前还没接入，暂时显示"-"
                    const buyHighPrice = item.buyHighPrice // 买入当天最高价（行情数据）
                    const buyLowPrice = item.buyLowPrice   // 买入当天最低价（行情数据）
                    const actualBuyPrice = parseFloat(item.buyPrice) || 0
                    
                    if (!buyHighPrice || !buyLowPrice || actualBuyPrice === 0) {
                      return <span>-</span>
                    }
                    
                    // 如果最高价等于最低价，无法计算评级
                    if (buyHighPrice === buyLowPrice) {
                      return <span>-</span>
                    }
                    
                    // 计算买入评级
                    const rating = (buyHighPrice - actualBuyPrice) / (buyHighPrice - buyLowPrice)
                    
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
                  if (field.key === 'sellGrade') {
                    // 卖出评级 = (实际卖出价 - 卖出当天最低价) / (卖出当天最高价 - 最低价)
                    // 最高价和最低价需要从行情数据获取，目前还没接入，暂时显示"-"
                    const sellHighPrice = item.sellHighPrice // 卖出当天最高价（行情数据）
                    const sellLowPrice = item.sellLowPrice   // 卖出当天最低价（行情数据）
                    const actualSellPrice = parseFloat(item.sellPrice) || 0
                    
                    if (!sellHighPrice || !sellLowPrice || actualSellPrice === 0) {
                      return <span>-</span>
                    }
                    
                    // 如果最高价等于最低价，无法计算评级
                    if (sellHighPrice === sellLowPrice) {
                      return <span>-</span>
                    }
                    
                    // 计算卖出评级
                    const rating = (actualSellPrice - sellLowPrice) / (sellHighPrice - sellLowPrice)
                    
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
                  if (field.key === 'upperBand') {
                    return <span>{item.buyChannel?.upperBand ? item.buyChannel.upperBand.toFixed(2) : '-'}</span>
                  }
                  if (field.key === 'lowerBand') {
                    return <span>{item.buyChannel?.lowerBand ? item.buyChannel.lowerBand.toFixed(2) : '-'}</span>
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
                  if (field.key === 'chartReview') {
                    return (
                      <button
                        onClick={() => {
                          setChartRecord(item)
                          setShowStockChartModal(true)
                        }}
                        className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        查看
                      </button>
                    )
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

      {/* 图表回顾弹窗 */}
      <StockChartModal
        isOpen={showStockChartModal}
        onClose={() => setShowStockChartModal(false)}
        record={chartRecord}
      />
    </div>
  )
}

export default TradeRecords
