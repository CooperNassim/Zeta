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
  const [recentlySavedTradeData, setRecentlySavedTradeData] = useState({})
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

  // 当 tradeRecords 变化时，清理最近保存的数据，确保使用最新的数据库数据
  useEffect(() => {
    if (tradeRecords.length > 0) {
      console.log('[Debug] tradeRecords 变化，清理 recentlySavedTradeData')
      setRecentlySavedTradeData({})
    }
  }, [tradeRecords])

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
    const mergedRecordsMap = new Map()

    // 先处理未删除的记录，确保基础信息正确
    result.forEach(r => {
      if (!r.deleted) {
        if (mergedRecordsMap.has(r.tradeNumber)) {
          const existing = mergedRecordsMap.get(r.tradeNumber)
          // 更新记录保持最新的未删除状态
          Object.assign(existing, r)
        } else {
          // 新增未删除记录
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
    
    // 从tradeRecords获取基础数据
    const selectedRecord = tradeRecords.find(r => r.id === selectedIds[0])
    console.log('[Debug] handleEditSummary - selected record:', selectedRecord)
    if (!selectedRecord) return
    
    const tradeNumber = selectedRecord.tradeNumber
    console.log('[Debug] handleEditSummary - tradeNumber:', tradeNumber)
    
    // 找到同一交易编号下的所有记录
    const sameTradeRecords = tradeRecords.filter(r => r.tradeNumber === tradeNumber && !r.deleted)
    console.log('[Debug] handleEditSummary - 同一交易编号下的记录数量:', sameTradeRecords.length)
    console.log('[Debug] handleEditSummary - 同一交易编号下的记录:', sameTradeRecords.map(r => ({ id: r.id, buyPrice: r.buyPrice, updated_at: r.updated_at })))
    
    // 找到同一交易编号下最新的记录（按更新时间排序）
    const latestRecord = sameTradeRecords.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.updatedAt || 0)
      const dateB = new Date(b.updated_at || b.updatedAt || 0)
      return dateB - dateA
    })[0]
    console.log('[Debug] handleEditSummary - 最新的记录:', latestRecord)
    console.log('[Debug] handleEditSummary - 最新记录的buyPrice:', latestRecord?.buyPrice)
    console.log('[Debug] handleEditSummary - 最新记录的sellPrice:', latestRecord?.sellPrice)
    console.log('[Debug] handleEditSummary - 最新记录的updated_at:', latestRecord?.updated_at)
    
    setEditingTradeId(selectedIds[0])
    
    // 从股票交易列表获取同一交易编号的订单数据来计算买入卖出信息
    const buyOrders = orders.filter(o => o.tradeNumber === tradeNumber && o.type === 'buy')
    const sellOrders = orders.filter(o => o.tradeNumber === tradeNumber && o.type === 'sell')
    console.log('[Debug] handleEditSummary - buyOrders:', buyOrders)
    console.log('[Debug] handleEditSummary - sellOrders:', sellOrders)

    // 检查是否有最近保存的数据
    const recentData = recentlySavedTradeData[tradeNumber]
    console.log('[Debug] handleEditSummary - 最近保存的数据:', recentData);
    console.log('[Debug] handleEditSummary - 最近保存的buyPrice:', recentData?.buyPrice);
    console.log('[Debug] handleEditSummary - 最近保存的sellPrice:', recentData?.sellPrice);

    // 计算买入相关字段
    let buyTotalAmount = 0
    let buyTotalQuantity = 0
    buyOrders.forEach(o => {
      const quantity = parseFloat(o.quantity) || 0
      const price = parseFloat(o.price) || 0
      buyTotalAmount += price * quantity
      buyTotalQuantity += quantity
    })
    const calculatedBuyPrice = buyTotalQuantity > 0 ? (buyTotalAmount / buyTotalQuantity) : 0
    console.log('[Debug] handleEditSummary - calculatedBuyPrice:', calculatedBuyPrice)

    // 计算卖出相关字段
    let sellTotalAmount = 0
    let sellTotalQuantity = 0
    sellOrders.forEach(o => {
      const quantity = parseFloat(o.quantity) || 0
      const price = parseFloat(o.price) || 0
      sellTotalAmount += price * quantity
      sellTotalQuantity += quantity
    })
    const calculatedSellPrice = sellTotalQuantity > 0 ? (sellTotalAmount / sellTotalQuantity) : 0
    console.log('[Debug] handleEditSummary - calculatedSellPrice:', calculatedSellPrice)

    // 查看latestRecord中的值
    console.log('[Debug] handleEditSummary - latest record buyPrice:', latestRecord?.buyPrice)
    console.log('[Debug] handleEditSummary - latest record sellPrice:', latestRecord?.sellPrice)
    console.log('[Debug] handleEditSummary - latest record tradeCommission:', latestRecord?.tradeCommission)
    console.log('[Debug] handleEditSummary - latest record otherFees:', latestRecord?.otherFees)
    console.log('[Debug] handleEditSummary - latest record sellTradeCommission:', latestRecord?.sellTradeCommission)
    console.log('[Debug] handleEditSummary - latest record sellOtherFees:', latestRecord?.sellOtherFees)
    console.log('[Debug] handleEditSummary - latest record tradeSummary:', latestRecord?.tradeSummary)

    // 格式化交易结案的字段取值逻辑：
    // 1.实际买入价：优先用最近保存的数据，其次用latestRecord的值，最后用计算值（理想买入价）
    // 2.实际卖出价：优先用最近保存的数据，其次用latestRecord的值，最后用计算值
    // 3.交易总结：从latestRecord获取
    const finalBuyPrice = recentData?.buyPrice != null ? recentData.buyPrice : (latestRecord?.buyPrice != null ? latestRecord.buyPrice : (calculatedBuyPrice > 0 ? calculatedBuyPrice : ''))
    const finalSellPrice = recentData?.sellPrice != null ? recentData.sellPrice : (latestRecord?.sellPrice != null ? latestRecord.sellPrice : (calculatedSellPrice > 0 ? calculatedSellPrice : ''))
    console.log('[Debug] handleEditSummary - 最终确定的buyPrice:', finalBuyPrice, '(recentData:', recentData?.buyPrice, 'latestRecord:', latestRecord?.buyPrice, 'calculated:', calculatedBuyPrice, ')')
    console.log('[Debug] handleEditSummary - 最终确定的sellPrice:', finalSellPrice, '(recentData:', recentData?.sellPrice, 'latestRecord:', latestRecord?.sellPrice, 'calculated:', calculatedSellPrice, ')')
    
    setSummaryFormData({
      // 买入相关字段 - 优先使用最近保存的数据
      buyPrice: finalBuyPrice,
      tradeCommission: formatFeeForDisplay(recentData?.tradeCommission != null ? recentData.tradeCommission : (latestRecord?.tradeCommission != null ? latestRecord.tradeCommission : '')),
      otherFees: formatFeeForDisplay(recentData?.otherFees != null ? recentData.otherFees : (latestRecord?.otherFees != null ? latestRecord.otherFees : '')),

      // 卖出相关字段 - 优先使用最近保存的数据
      sellPrice: finalSellPrice,
      sellTradeCommission: formatFeeForDisplay(recentData?.sellTradeCommission != null ? recentData.sellTradeCommission : (latestRecord?.sellTradeCommission != null ? latestRecord.sellTradeCommission : '')),
      sellOtherFees: formatFeeForDisplay(recentData?.sellOtherFees != null ? recentData.sellOtherFees : (latestRecord?.sellOtherFees != null ? latestRecord.sellOtherFees : '')),

      // 交易总结：从latestRecord获取
      tradeSummary: (latestRecord?.tradeSummary || selectedRecord.tradeSummary) || ''
    })
    console.log('[Debug] handleEditSummary - formData set to:', summaryFormData)
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
      console.log('[Debug] handleSummaryFormSubmit - summaryFormData:', summaryFormData)

      // 获取当前记录的交易编号
      const currentRecord = tradeRecords.find(r => r.id === editingTradeId)
      if (!currentRecord) {
        showToast('记录不存在', 'error')
        return
      }
      const tradeNumber = currentRecord.tradeNumber

      // 找到同一交易编号下的所有记录ID
      const sameTradeRecords = tradeRecords.filter(r => r.tradeNumber === tradeNumber && !r.deleted)
      const recordIds = sameTradeRecords.map(r => r.id)
      console.log('[Debug] 同一交易编号下的记录ID:', recordIds)
      console.log('[Debug] 同一交易编号下的记录详情:', sameTradeRecords.map(r => ({ id: r.id, buyPrice: r.buyPrice, tradeNumber: r.tradeNumber })))

      // 更新同一交易编号下的所有记录
      const requestBody = {
        buy_price: summaryFormData.buyPrice != null && summaryFormData.buyPrice !== '' ? parsePrice(summaryFormData.buyPrice) : (summaryFormData.buyPrice === '' ? null : undefined),
        trade_commission: summaryFormData.tradeCommission != null && summaryFormData.tradeCommission !== '' ? parseFloat(summaryFormData.tradeCommission.trim()) : (summaryFormData.tradeCommission === '' ? null : undefined),
        other_fees: summaryFormData.otherFees != null && summaryFormData.otherFees !== '' ? parseFloat(summaryFormData.otherFees.trim()) : (summaryFormData.otherFees === '' ? null : undefined),
        sell_price: summaryFormData.sellPrice != null && summaryFormData.sellPrice !== '' ? parsePrice(summaryFormData.sellPrice) : (summaryFormData.sellPrice === '' ? null : undefined),
        sell_trade_commission: summaryFormData.sellTradeCommission != null && summaryFormData.sellTradeCommission !== '' ? parseFloat(summaryFormData.sellTradeCommission.trim()) : (summaryFormData.sellTradeCommission === '' ? null : undefined),
        sell_other_fees: summaryFormData.sellOtherFees != null && summaryFormData.sellOtherFees !== '' ? parseFloat(summaryFormData.sellOtherFees.trim()) : (summaryFormData.sellOtherFees === '' ? null : undefined),
        trade_summary: summaryFormData.tradeSummary ? summaryFormData.tradeSummary.trim() : (summaryFormData.tradeSummary === '' ? '' : undefined)
      }
      console.log('[Debug] PUT request body:', requestBody)

      const updatePromises = recordIds.map(id =>
        fetch('/api/trade_records/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }).then(res => res.json())
      )

      const responses = await Promise.all(updatePromises)
      console.log('[Debug] PUT responses:', responses)
      console.log('[Debug] PUT responses details:', responses.map(r => ({ success: r.success, message: r.message, error: r.error })))
      const allSuccess = responses.every(r => r.success)

      if (allSuccess) {
        // 存储最新保存的交易数据，供Buy Detail弹窗使用
        const tradeNumber = currentRecord.tradeNumber
        console.log('[Debug] 存储临时数据 - tradeNumber:', tradeNumber);
        console.log('[Debug] 存储临时数据 - summaryFormData.buyPrice:', summaryFormData.buyPrice);
        console.log('[Debug] 存储临时数据 - parsePrice结果:', parsePrice(summaryFormData.buyPrice));
        
        setRecentlySavedTradeData(prev => {
          const newData = {
            ...prev,
            [tradeNumber]: {
              buyPrice: parsePrice(summaryFormData.buyPrice),
              sellPrice: parsePrice(summaryFormData.sellPrice),
              tradeCommission: summaryFormData.tradeCommission,
              otherFees: summaryFormData.otherFees,
              sellTradeCommission: summaryFormData.sellTradeCommission,
              sellOtherFees: summaryFormData.sellOtherFees,
              tradeSummary: summaryFormData.tradeSummary
            }
          };
          console.log('[Debug] 存储临时数据 - 新数据:', newData);
          return newData;
        })
        
        // 从数据库重新同步数据，确保数据一致性
        await fetch('/api/sync/all')
          .then(res => res.json())
          .then(syncResponse => {
            if (syncResponse.success && syncResponse.data && syncResponse.data.trade_records !== undefined) {
              const { trade_records, trade_orders } = syncResponse.data
              useStore.getState().importTradeRecords(trade_records, trade_orders)
              // 不要立即清空临时数据，让Buy Detail有机会使用
              // setRecentlySavedTradeData({})
            }
          })
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
    console.log('🔍 [Debug Buy Detail] 传入的record:', record);
    console.log('🔍 [Debug Buy Detail] record.buyPrice:', record.buyPrice);
    console.log('🔍 [Debug Buy Detail] record.id:', record.id);
    console.log('🔍 [Debug Buy Detail] record.tradeNumber:', record.tradeNumber);
    
    const tradeNumber = record.tradeNumber;
    console.log('🔍 [Debug Buy Detail] tradeNumber:', tradeNumber);
    
    let recordWithLatestData;
    
    // 检查是否有最近保存的交易数据（优先使用）
    console.log('🔍 [Debug Buy Detail] recentlySavedTradeData:', recentlySavedTradeData);
    const recentData = recentlySavedTradeData[tradeNumber];
    console.log('🔍 [Debug Buy Detail] 最近保存的数据:', recentData);
    console.log('🔍 [Debug Buy Detail] 最近保存的buyPrice:', recentData?.buyPrice);
    
    if (recentData) {
      // 如果有最近保存的数据，使用它
      recordWithLatestData = {
        ...record,
        buyPrice: recentData.buyPrice,
        tradeCommission: recentData.tradeCommission,
        otherFees: recentData.otherFees
      };
      console.log('🔍 [Debug Buy Detail] 使用最近保存的数据:', recordWithLatestData);
      console.log('🔍 [Debug Buy Detail] 使用最近保存的buyPrice:', recordWithLatestData.buyPrice);
      setDetailRecord(recordWithLatestData);
    } else {
      // 从最新的 tradeRecords 中获取同一交易编号下的所有记录
      const sameTradeRecords = tradeRecords.filter(r => r.tradeNumber === tradeNumber && !r.deleted);
      console.log('🔍 [Debug Buy Detail] 同一交易编号下的记录数量:', sameTradeRecords.length);
      console.log('🔍 [Debug Buy Detail] 同一交易编号下的记录:', sameTradeRecords.map(r => ({ id: r.id, buyPrice: r.buyPrice })));
      
      // 找到同一交易编号下最新的记录（按更新时间排序）
      const latestRecord = sameTradeRecords.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.updatedAt || 0);
        const dateB = new Date(b.updated_at || b.updatedAt || 0);
        return dateB - dateA;
      })[0];
      console.log('🔍 [Debug Buy Detail] 最新的记录:', latestRecord);
      console.log('🔍 [Debug Buy Detail] 最新记录的buyPrice:', latestRecord?.buyPrice);
      
      // 使用最新记录的数据
      recordWithLatestData = latestRecord || record;
      console.log('🔍 [Debug Buy Detail] 最终使用的数据:', recordWithLatestData);
      console.log('🔍 [Debug Buy Detail] 最终使用的buyPrice:', recordWithLatestData.buyPrice);
      setDetailRecord(recordWithLatestData);
    }
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
    // 买入成交价格取交易结案弹窗的值(record.buyPrice)，如果未填写则默认使用理想买入价
    // 实际买入价使用用户输入的值
    const userBuyPrice = recordWithLatestData.buyPrice != null ? recordWithLatestData.buyPrice : null
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
      tradeCommission: formatFee(recordWithLatestData.tradeCommission) || (buyOrders.length > 0 ? '' : '-'),
      otherFees: formatFee(recordWithLatestData.otherFees) || (buyOrders.length > 0 ? '' : '-'),
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
    
    const tradeNumber = record.tradeNumber;
    console.log('🔍 [Debug Sell Detail] tradeNumber:', tradeNumber);
    
    let recordWithLatestDataForSell;
    
    // 检查是否有最近保存的交易数据（优先使用）
    console.log('🔍 [Debug Sell Detail] recentlySavedTradeData:', recentlySavedTradeData);
    const recentData = recentlySavedTradeData[tradeNumber];
    console.log('🔍 [Debug Sell Detail] 最近保存的数据:', recentData);
    console.log('🔍 [Debug Sell Detail] 最近保存的sellPrice:', recentData?.sellPrice);
    
    if (recentData) {
      // 如果有最近保存的数据，使用它
      recordWithLatestDataForSell = {
        ...record,
        sellPrice: recentData.sellPrice,
        sellTradeCommission: recentData.sellTradeCommission,
        sellOtherFees: recentData.sellOtherFees
      };
      console.log('🔍 [Debug Sell Detail] 使用最近保存的数据:', recordWithLatestDataForSell);
      console.log('🔍 [Debug Sell Detail] 使用最近保存的sellPrice:', recordWithLatestDataForSell.sellPrice);
      setDetailRecord(recordWithLatestDataForSell);
    } else {
      // 从最新的 tradeRecords 中获取同一交易编号下的所有记录
      const sameTradeRecords = tradeRecords.filter(r => r.tradeNumber === tradeNumber && !r.deleted);
      console.log('🔍 [Debug Sell Detail] 同一交易编号下的记录数量:', sameTradeRecords.length);
      console.log('🔍 [Debug Sell Detail] 同一交易编号下的记录:', sameTradeRecords.map(r => ({ id: r.id, sellPrice: r.sellPrice })));
      
      // 找到同一交易编号下最新的记录（按更新时间排序）
      const latestRecord = sameTradeRecords.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.updatedAt || 0);
        const dateB = new Date(b.updated_at || b.updatedAt || 0);
        return dateB - dateA;
      })[0];
      console.log('🔍 [Debug Sell Detail] 最新的记录:', latestRecord);
      console.log('🔍 [Debug Sell Detail] 最新记录的sellPrice:', latestRecord?.sellPrice);
      
      // 使用最新记录的数据
      recordWithLatestDataForSell = latestRecord || record;
      console.log('🔍 [Debug Sell Detail] 最终使用的数据:', recordWithLatestDataForSell);
      console.log('🔍 [Debug Sell Detail] 最终使用的sellPrice:', recordWithLatestDataForSell.sellPrice);
      setDetailRecord(recordWithLatestDataForSell);
    }
    // 理想卖出价：从股票交易模块获取同一交易编号的卖出类型订单
    const sellOrders = orders.filter(o => o.tradeNumber === record.tradeNumber && o.type === 'sell')
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
    
    console.log('🔍 [Debug Strategy] 查找卖出策略:')
    console.log('   - sellOrders数量:', sellOrders.length)
    console.log('   - record.sellStrategyId:', (recordWithLatestDataForSell || record).sellStrategyId)
    console.log('   - strategyRecords长度:', strategyRecords.length)
    
    // 使用策略记录查找策略名称
    if (sellOrders.length > 0 && sellOrders[0].strategyId) {
      console.log('   - 从卖出订单策略ID查找:', sellOrders[0].strategyId, ', ID类型:', typeof sellOrders[0].strategyId)
      const strategy = strategyRecords.find(s => {
        console.log('     - 比较:', s.id, '(类型:', typeof s.id, ') 与', sellOrders[0].strategyId, '(类型:', typeof sellOrders[0].strategyId, ')')
        return s.id === sellOrders[0].strategyId
      })
      console.log('   - 查找结果:', strategy)
      sellStrategyValue = strategy ? strategy.name : ''
    } else if ((fullRecord || record).sellStrategyId) {
      console.log('   - 从交易记录策略ID查找:', (fullRecord || record).sellStrategyId, ', ID类型:', typeof (fullRecord || record).sellStrategyId)
      const strategy = strategyRecords.find(s => {
        console.log('     - 比较:', s.id, '(类型:', typeof s.id, ') 与', (fullRecord || record).sellStrategyId, '(类型:', typeof (fullRecord || record).sellStrategyId, ')')
        return s.id === (fullRecord || record).sellStrategyId
      })
      console.log('   - 查找结果:', strategy)
      sellStrategyValue = strategy ? strategy.name : ''
    }
    
    console.log('   - 最终策略名称:', sellStrategyValue)
    
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
    console.log('   - record.sellPrice:', (recordWithLatestDataForSell || record).sellPrice);
    console.log('   - sellOrderPriceValue:', sellOrderPriceValue);
    console.log('   - sellOrders.length:', sellOrders.length);
    
    // 计算滑点：(实际卖出价 - 理想卖出价) × 卖出数量
    // 实际卖出价 = 用户在交易结案中输入的值
    // 理想卖出价 = sellOrderPriceExact（从订单动态计算的平均价）
    let sellSlippageValue = '';
    const idealSellPrice = sellOrderPriceExact;  // 理想卖出价从当前订单动态计算
    const userInputSellPrice = recordWithLatestDataForSell.sellPrice != null ? recordWithLatestDataForSell.sellPrice : 0;
    const sellQuantity = sellOrdersTotalQuantity;

    if (idealSellPrice > 0 && userInputSellPrice > 0 && sellQuantity > 0) {
      const slippageValue = (userInputSellPrice - idealSellPrice) * sellQuantity;
      // 格式化：整数取整，有小数点取小数点2位四舍五入，千位分隔符
      sellSlippageValue = formatSlippage(slippageValue);
    } else {
      sellSlippageValue = sellOrders.length > 0 ? '计算失败' : '-';
    }

    // 检查记录中是否有卖出时间数据，使用格式化为年-月-日 时:分:秒
    const sellTimeValue = sellOrders.length > 0 ? (record.sellTime ? formatDate(record.sellTime) : '未设置时间') : '-';

    // 计算实际卖出价默认值：优先使用用户保存的实际卖出价，否则使用理想卖出价
    const defaultSellPrice = recordWithLatestDataForSell.sellPrice != null ? formatPrice(recordWithLatestDataForSell.sellPrice) : (sellOrderPriceValue !== '' ? formatPrice(sellOrderPriceValue) : (sellOrders.length > 0 ? '' : '-'));
    console.log('   - 计算出的实际卖出价默认值:', defaultSellPrice);
    
    // 计算卖出金额：使用实际卖出价 × 卖出数量，这样可以更准确反映实际卖出金额
    const calculatedSellAmount = userInputSellPrice > 0 && sellQuantity > 0 ? userInputSellPrice * sellQuantity : (sellOrdersTotalAmount > 0 ? sellOrdersTotalAmount : 0);
    
    // 设置表单数据，使用格式化函数确保整数不显示.00
    const formData = {
      sellPrice: defaultSellPrice,  // 实际卖出价从记录获取，未填写时使用理想卖出价
      sellQuantity: sellOrdersTotalQuantity > 0 ? formatAmount(sellOrdersTotalQuantity) : '-',  // 数量使用千位分隔符
      sellAmount: calculatedSellAmount > 0 ? formatAmount(calculatedSellAmount) : '-',  // 使用实际卖出价 × 卖出数量
      sellOrderPrice: sellOrderPriceValue !== '' ? formatPrice(sellOrderPriceValue) : '-',  // 使用计算出的理想卖出价
      sellTime: sellTimeValue,
      sellSlippage: sellSlippageValue,  // 已在计算逻辑中使用了千位分隔符
      sellStrategy: sellStrategyValue,  // 使用从orders获取的策略名称
      sellTradeCommission: recordWithLatestDataForSell.sellTradeCommission ? formatFee(recordWithLatestDataForSell.sellTradeCommission) : '-',
      sellOtherFees: recordWithLatestDataForSell.sellOtherFees ? formatFee(recordWithLatestDataForSell.sellOtherFees) : '-',
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
      // 保存到数据库
      const response = await fetch('/api/trade_records/' + detailRecord.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sell_price: parsePrice(sellDetailFormData.sellPrice),
          sell_trade_commission: sellDetailFormData.sellTradeCommission?.toString().trim() || '',
          sell_other_fees: sellDetailFormData.sellOtherFees?.toString().trim() || ''
        })
      }).then(res => res.json())

      if (response.success) {
        // 从数据库重新同步数据
        await fetch('/api/sync/all')
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
      // 保存到数据库
      const response = await fetch('/api/trade_records/' + detailRecord.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buy_price: parsePrice(buyDetailFormData.buyPrice),
          trade_commission: buyDetailFormData.tradeCommission?.toString().trim() || '',
          other_fees: buyDetailFormData.otherFees?.toString().trim() || ''
        })
      }).then(res => res.json())

      if (response.success) {
        // 从数据库重新同步数据
        await fetch('/api/sync/all')
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
        // 使用实际卖出价 × 卖出数量计算，与卖出详情弹窗保持一致
        // 使用订单中的卖出数量，而不是数据库中的sellQuantity
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
                  if (field.key === 'profit') {
                    // 盈亏金额 = (实际卖出价 - 实际买入价) × 卖出数量
                    // 由于数据库只存储金额不存储单价，需要通过金额和数量反推价格
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (sellQuantity === 0) {
                      return <span>0</span>
                    }
                    
                    // 使用用户输入的实际买入价/卖出价，如果为空则使用从订单反推的价格
                    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
                    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
                    
                    // 计算已卖出部分的盈亏
                    const profit = (sellPrice - buyPrice) * sellQuantity
                    
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
                    // 净盈亏比 = (盈亏金额 - 总手续费) / (实际买入价 × 卖出数量) × 100%
                    // 对于部分卖出的情况，分母使用已卖出部分的成本
                    // 由于数据库只存储金额不存储单价，需要通过金额和数量反推价格
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    // 使用item中的数量和金额
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    // 使用用户输入的实际买入价/卖出价，如果为空则使用从订单反推的价格
                    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
                    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
                    
                    let buyOrdersTotalAmount = 0
                    buyOrders.forEach(o => {
                      buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    let sellOrdersTotalAmount = 0  // 股票交易列表卖出总金额（用于计算理想卖出价）
                    sellOrders.forEach(o => {
                      sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    
                    // 计算已卖出部分的盈亏
                    const profit = (sellPrice - buyPrice) * sellQuantity
                    
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
                    // 计算总手续费
                    const tradeCommission = parseFloat(item.tradeCommission) || 0
                    const otherFees = parseFloat(item.otherFees) || 0
                    const sellTradeCommission = parseFloat(item.sellTradeCommission) || 0
                    const sellOtherFees = parseFloat(item.sellOtherFees) || 0
                    const totalFees = tradeCommission + sellTradeCommission + otherFees + sellOtherFees
                    // 净盈亏额 = 盈亏金额 - 总手续费
                    const netProfit = profit - totalFees
                    
                    // 已卖出部分的成本
                    const soldCost = buyPrice * sellQuantity
                    
                    if (soldCost > 0) {
                      const netProfitPercent = netProfit / soldCost * 100
                      // 整数取整，有小数点取小数点2位四舍五入
                      const rounded = Math.round(netProfitPercent * 100) / 100
                      const formatted = Number.isInteger(rounded) ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      return <span>{formatted}%</span>
                    }
                    return <span>-</span>
                  }
                  if (field.key === 'netProfit') {
                    // 净盈亏额 = 盈亏金额 - 手续费
                    // 盈亏金额 = (实际卖出价 - 实际买入价) × 卖出数量
                    // 由于数据库只存储金额不存储单价，需要通过金额和数量反推价格
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    // 使用item中的数量和金额
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (sellQuantity === 0) {
                      return <span>0</span>
                    }
                    
                    // 使用用户输入的实际买入价/卖出价，如果为空则使用从订单反推的价格
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
                    
                    // 计算已卖出部分的盈亏
                    const profit = (sellPrice - buyPrice) * sellQuantity
                    
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
                    // 计算总手续费
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
                    // 滑点 = 买入滑点 + 卖出滑点
                    // 由于数据库只存储金额不存储单价，需要通过金额和数量反推价格
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    // 使用item中的数量和金额
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (sellQuantity === 0) {
                      return <span>0</span>
                    }
                    
                    // 使用用户输入的实际买入价/卖出价，如果为空则使用从订单反推的价格
                    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
                    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
                    
                    // 计算买入滑点 = (理想买入价 - 实际买入价) × 买入数量
                    let buySlippage = 0
                    if (buyQuantity > 0 && buyAmount > 0) {
                      const idealBuyPrice = buyAmount / buyQuantity  // 理想买入价也是从订单计算
                      buySlippage = (idealBuyPrice - buyPrice) * buyQuantity
                    }
                    
                    // 计算卖出滑点 = (实际卖出价 - 理想卖出价) × 卖出数量
                    let sellSlippage = 0
                    if (sellQuantity > 0 && sellAmount > 0) {
                      const idealSellPrice = sellAmount / sellQuantity  // 理想卖出价也是从订单计算
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
                    // 由于数据库只存储金额不存储单价，需要通过金额和数量反推价格
                    const buyOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'buy')
                    const sellOrders = orders.filter(o => o.tradeNumber === item.tradeNumber && o.type === 'sell')
                    
                    // 使用item中的数量和金额
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (sellQuantity === 0) {
                      return <span>-</span>
                    }
                    
                    // 使用用户输入的实际买入价/卖出价，如果为空则使用从订单反推的价格
                    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
                    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
                    
                    // 计算已卖出部分的盈亏
                    const profit = (sellPrice - buyPrice) * sellQuantity
                    
                    // 计算滑点：理想价和实际价都从订单计算
                    // 买入滑点 = (理想买入价 - 实际买入价) × 买入数量
                    // 理想买入价从订单的加权平均价计算
                    let buyOrdersTotalAmount = 0
                    buyOrders.forEach(o => {
                      buyOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    const idealBuyPrice = buyQuantity > 0 ? buyOrdersTotalAmount / buyQuantity : 0
                    const actualBuyPrice = buyPrice
                    const buySlippage = (idealBuyPrice - actualBuyPrice) * buyQuantity
                    
                    // 卖出滑点 = (实际卖出价 - 理想卖出价) × 卖出数量
                    let sellOrdersTotalAmount = 0
                    sellOrders.forEach(o => {
                      sellOrdersTotalAmount += (parseFloat(o.price) || 0) * (parseFloat(o.quantity) || 0)
                    })
                    const idealSellPrice = sellQuantity > 0 ? sellOrdersTotalAmount / sellQuantity : 0
                    const actualSellPrice = sellPrice
                    const sellSlippage = (actualSellPrice - idealSellPrice) * sellQuantity
                    
                    const totalSlippage = buySlippage + sellSlippage
                    // 计算总手续费
                    const tradeCommission = parseFloat(item.tradeCommission) || 0
                    const otherFees = parseFloat(item.otherFees) || 0
                    const sellTradeCommission = parseFloat(item.sellTradeCommission) || 0
                    const sellOtherFees = parseFloat(item.sellOtherFees) || 0
                    const totalFees = tradeCommission + sellTradeCommission + otherFees + sellOtherFees
                    // 净盈亏额 = 盈亏金额 - 总手续费
                    const netProfit = profit - totalFees
                    
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
                    // 盈亏比例 = (实际卖出价 - 实际买入价) / 实际买入价 × 100%
                    // 由于数据库只存储金额不存储单价，需要通过金额和数量反推价格
                    const buyAmount = parseFloat(item.buyAmount) || 0
                    const sellAmount = parseFloat(item.sellAmount) || 0
                    const buyQuantity = parseFloat(item.buyQuantity) || 0
                    const sellQuantity = parseFloat(item.sellQuantity) || 0
                    
                    if (sellQuantity === 0) {
                      return <span>-</span>
                    }
                    
                    // 使用用户输入的实际买入价/卖出价，如果为空则使用从订单反推的价格
                    const buyPrice = item.buyPrice != null ? item.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
                    const sellPrice = item.sellPrice != null ? item.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
                    
                    if (buyPrice > 0) {
                      const profitPercent = (sellPrice - buyPrice) / buyPrice * 100
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
