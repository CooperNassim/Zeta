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
  return `${year}-${month}-${day} ${hours}:${minutes}`
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
  const [filterScore, setFilterScore] = useState('')
  const [filterOverallScore, setFilterOverallScore] = useState('')
  const [filterBuyGrade, setFilterBuyGrade] = useState('')
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

  const tradeRecords = useStore(state => state.tradeRecords)
  const updateTradeRecord = useStore(state => state.updateTradeRecord)
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

    // 卖出评级筛选
    if (filterScore) {
      result = result.filter(r => r.sellGrade === filterScore)
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

    // 买入评级筛选
    if (filterBuyGrade) {
      result = result.filter(r => r.buyGrade === filterBuyGrade)
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
            buyChannel: r.buyChannel
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
            holdDuration: r.holdDuration
          })
        }
        // 更新最新时间和评分
        if (r.createdAt) existing.createdAt = r.createdAt
        if (r.overallScore) existing.overallScore = r.overallScore
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

    const record = tradeRecords.find(r => r.id === selectedIds[0])
    if (!record) return

    setEditingTradeId(selectedIds[0])
    setSummaryFormData({
      buyPrice: record.buyPrice ? formatPrice(record.buyPrice) : '',
      tradeCommission: record.tradeCommission != null ? String(record.tradeCommission) : '',
      otherFees: record.otherFees != null ? String(record.otherFees) : '',
      sellPrice: record.sellPrice ? formatPrice(record.sellPrice) : '',
      sellTradeCommission: record.sellTradeCommission != null ? String(record.sellTradeCommission) : '',
      sellOtherFees: record.sellOtherFees != null ? String(record.sellOtherFees) : '',
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
      // 保存到数据库
      const response = await fetch('/api/trade_records/' + editingTradeId, {
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
        setShowSummaryModal(false)
        setEditingTradeId(null)
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
    // 买入成交价格默认取买入订单价格(buyOrderPrice)，但允许用户手动修改
    const defaultBuyPrice = record.buyOrderPrice 
      ? formatPrice(record.buyOrderPrice) 
      : (record.buyPrice ? formatPrice(record.buyPrice) : '')
    const formData = {
      high: record.buyChannel?.high ? formatAmount(record.buyChannel.high) : '',
      low: record.buyChannel?.low ? formatAmount(record.buyChannel.low) : '',
      buyPrice: defaultBuyPrice,
      buyOrderPrice: record.buyOrderPrice ? formatPrice(record.buyOrderPrice) : '',
      buySlippage: record.buyPrice && record.buyOrderPrice ? formatAmount((record.buyPrice - record.buyOrderPrice) * record.buyQuantity) : '',
      tradeCommission: record.tradeCommission != null ? String(record.tradeCommission) : '',
      otherFees: record.otherFees != null ? String(record.otherFees) : '',
      buyStrategy: getStrategyName(record.buyStrategyId, 'buy'),
      buyTime: formatDate(record.buyTime)
    }
    setBuyDetailFormData(formData)
    setBuyDetailFormErrors({})
    setShowBuyDetailModal(true)
  }

  const handleShowSellDetail = (record) => {
    setDetailRecord(record)
    // 卖出订单价格：优先使用 record.sellOrderPrice，其次从订单中获取
    let sellOrderPriceValue = record.sellOrderPrice
    if (!sellOrderPriceValue && record.sellOrderId) {
      const sellOrder = orders.find(o => String(o.id) === String(record.sellOrderId))
      if (sellOrder && sellOrder.price) {
        sellOrderPriceValue = sellOrder.price
      }
    }
    // 卖出价格和卖出成交价格都默认取股票卖出交易价格(record.sellPrice)
    const defaultSellPrice = record.sellPrice ? formatPrice(record.sellPrice) : ''
    const formData = {
      high: record.sellChannel?.high ? formatAmount(record.sellChannel.high) : '',
      low: record.sellChannel?.low ? formatAmount(record.sellChannel.low) : '',
      sellPrice: defaultSellPrice,
      sellOrderPrice: record.sellPrice ? formatPrice(record.sellPrice) : '',
      sellSlippage: record.sellPrice && record.sellOrderPrice ? formatAmount((record.sellPrice - record.sellOrderPrice) * record.sellQuantity) : '',
      tradeCommission: record.tradeCommission != null ? String(record.tradeCommission) : '',
      otherFees: record.otherFees != null ? String(record.otherFees) : '',
      sellStrategy: getStrategyName(record.sellStrategyId, 'sell'),
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
      label: '买入成交价格',
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
      label: '卖出成交价格',
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
      key: 'high',
      label: '最高点',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'low',
      label: '最低点',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'sellOrderPrice',
      label: '卖出价格',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'sellPrice',
      label: '卖出成交价格',
      type: 'text',
      inputType: 'number',
      placeholder: '请输入',
      required: true,
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
      key: 'tradeCommission',
      label: '卖出佣金',
      type: 'text',
      placeholder: '请输入',
      required: true,
      grid: true
    },
    {
      key: 'otherFees',
      label: '卖出其他费用',
      type: 'text',
      placeholder: '请输入',
      required: true,
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
      key: 'sellTime',
      label: '卖出时间',
      readonly: true,
      notRequired: true,
      grid: true
    }
  ]

  const BUY_DETAIL_FIELDS = [
    {
      key: 'high',
      label: '最高点',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'low',
      label: '最低点',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'buyOrderPrice',
      label: '买入价格',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'buyPrice',
      label: '买入成交价格',
      type: 'text',
      inputType: 'number',
      placeholder: '请输入',
      required: true,
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
      key: 'buyStrategy',
      label: '买入策略',
      readonly: true,
      notRequired: true,
      grid: true
    },
    {
      key: 'buyTime',
      label: '买入时间',
      readonly: true,
      notRequired: true
    }
  ]

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      alert('暂无数据可导出')
      return
    }
    setShowExportModal(true)
  }

  const handleConfirmExport = async () => {
    const headers = [
      '交易编号', '交易类型', '股票代码', '股票名称', '买入价格', '买入数量', '买入时间',
      '卖出价格', '卖出数量', '卖出时间', '持仓天数', '盈亏金额',
      '盈亏比例', '买入评分', '卖出评分', '整体评分', '记录时间'
    ]

    const rows = filteredRecords.map(r => [
      r.tradeNumber,
      r.tradeType,
      r.symbol,
      r.name,
      r.buyPrice,
      r.buyQuantity,
      formatDate(r.buyTime),
      r.sellPrice,
      r.sellQuantity,
      formatDate(r.sellTime),
      `${r.holdDuration}天`,
      r.profit,
      `${r.profitPercent}%`,
      `买${r.buyGrade}`,
      `卖${r.sellGrade}`,
      r.overallScore,
      formatDate(r.createdAt)
    ])

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
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
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
              onChange={setFilterTradeId}
              placeholder="交易编号"
              width="200px"
            />
            <SearchInput
              value={filterSymbol}
              onChange={setFilterSymbol}
              placeholder="股票代码"
              width="200px"
            />
            <SearchInput
              value={filterName}
              onChange={setFilterName}
              placeholder="股票名称"
              width="200px"
            />
            <div style={{ width: '180px' }}>
              <FilterSelect
                value={filterBuyGrade === '' ? '' : filterBuyGrade}
                onChange={(value) => {
                  setFilterBuyGrade(value === '' ? '' : value)
                  setCurrentPage(1)
                }}
                options={[
                  { value: 'A', label: 'A' },
                  { value: 'B', label: 'B' },
                  { value: 'C', label: 'C' },
                  { value: 'D', label: 'D' }
                ]}
                placeholder="买入评级"
              />
            </div>
            <div style={{ width: '180px' }}>
              <FilterSelect
                value={filterScore === '' ? '' : filterScore}
                onChange={(value) => setFilterScore(value === '' ? '' : value)}
                options={[
                  { value: 'A', label: 'A' },
                  { value: 'B', label: 'B' },
                  { value: 'C', label: 'C' },
                  { value: 'D', label: 'D' }
                ]}
                placeholder="卖出评级"
              />
            </div>
            <div style={{ width: '180px' }}>
              <FilterSelect
                value={filterOverallScore === '' ? '' : filterOverallScore}
                onChange={(value) => setFilterOverallScore(value === '' ? '' : value)}
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
                  { key: 'sellBuyQuantity', label: '卖出/买入数量', width: '140px' },
                  { key: 'buyAmount', label: '买入金额', width: '120px' },
                  { key: 'sellAmount', label: '卖出金额', width: '120px' },
                  { key: 'tradeStatus', label: '交易状态', width: '100px' },
                  { key: 'buyGrade', label: '买入评级', width: '100px' },
                  { key: 'sellGrade', label: '卖出评级', width: '100px' },
                  { key: 'profit', label: '盈亏金额', width: '120px' },
                  { key: 'profitPercent', label: '盈亏比例', width: '120px' },
                  { key: 'netProfitPercent', label: '净盈亏比', width: '120px' },
                  { key: 'netProfit', label: '净盈亏额', width: '120px' },
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
                    const profit = parseFloat(item.profit)
                    return <span>{profit >= 0 ? '+' : ''}${profit.toFixed(2)}</span>
                  }
                  if (field.key === 'fees') {
                    return <span>-</span>
                  }
                  if (field.key === 'netProfitPercent') {
                    return <span>-</span>
                  }
                  if (field.key === 'netProfit') {
                    return <span>-</span>
                  }
                  if (field.key === 'slippage') {
                    return <span>-</span>
                  }
                  if (field.key === 'slippageNetProfitRatio') {
                    return <span>-</span>
                  }
                  if (field.key === 'profitPercent') {
                    const percent = parseFloat(item.profitPercent)
                    return <span>{percent >= 0 ? '+' : ''}{percent.toFixed(2)}%</span>
                  }
                  if (field.key === 'sellBuyQuantity') {
                    const sellQty = item.sellQuantity || 0
                    const buyQty = item.buyQuantity || 0
                    return <span>{sellQty}/{buyQty}</span>
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
                    return <span>{item.buyGrade || '-'}</span>
                  }
                  if (field.key === 'sellGrade') {
                    return <span>{item.sellGrade || '-'}</span>
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
                    const score = parseFloat(item.overallScore)
                    let grade = '-'
                    if (score >= 90) grade = 'A'
                    else if (score >= 80) grade = 'B'
                    else if (score >= 70) grade = 'C'
                    else if (score >= 0) grade = 'D'
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
            onPageChange={(page) => setCurrentPage(page)}
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
        width="max-w-md"
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
        width="max-w-md"
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
        width="max-w-md"
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
