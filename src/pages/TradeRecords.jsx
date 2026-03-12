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
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const TradeRecords = () => {
  const { showToast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFilter] = useState('all')
  const [filterSymbol, setFilterSymbol] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterTradeType, setFilterTradeType] = useState('')
  const [filterScore, setFilterScore] = useState('')
  const [filterOverallScore, setFilterOverallScore] = useState('')
  const [filterTradeDateRange, setFilterTradeDateRange] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [selectedIds, setSelectedIds] = useState([])
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryFormData, setSummaryFormData] = useState({})
  const [summaryFormErrors, setSummaryFormErrors] = useState({})
  const [editingTradeId, setEditingTradeId] = useState(null)
  const pageSize = 20

  const tradeRecords = useStore(state => state.tradeRecords)
  const updateTradeRecord = useStore(state => state.updateTradeRecord)

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

    // 交易类型筛选
    if (filterTradeType) {
      result = result.filter(r => r.tradeType === filterTradeType)
    }

    // 操作评级筛选
    if (filterScore) {
      result = result.filter(r => {
        const score = parseFloat(r.overallScore)
        let grade = ''
        if (score >= 90) grade = 'A'
        else if (score >= 80) grade = 'B'
        else if (score >= 70) grade = 'C'
        else if (score >= 0) grade = 'D'
        return grade === filterScore
      })
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

    // 交易时间筛选（按买入/卖出时间）
    if (filterTradeDateRange) {
      const [startDate, endDate] = filterTradeDateRange.split('~')
      if (startDate && endDate) {
        result = result.filter(r => {
          const tradeTime = r.tradeType === '买入' ? formatDate(r.buyTime) : formatDate(r.sellTime)
          const recordDate = tradeTime ? tradeTime.split(' ')[0] : ''
          return recordDate >= startDate && recordDate <= endDate
        })
      }
    }

    // 按交易编号分组，确保相同交易编号的记录相邻显示，买入在前
    const groupedRecords = []
    const tradeNumbers = [...new Set(result.map(r => r.tradeNumber))]

    tradeNumbers.forEach(tradeNumber => {
      const group = result.filter(r => r.tradeNumber === tradeNumber)
      const buyRecord = group.find(r => r.tradeType === '买入')
      const sellRecord = group.find(r => r.tradeType === '卖出')

      if (buyRecord) groupedRecords.push(buyRecord)
      if (sellRecord) groupedRecords.push(sellRecord)
    })

    // 按买入记录时间降序排序
    groupedRecords.sort((a, b) => {
      if (a.tradeNumber === b.tradeNumber) {
        return a.tradeType === '买入' ? -1 : 1
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return groupedRecords
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
    setSummaryFormData({ tradeSummary: record.tradeSummary || '' })
    setSummaryFormErrors({})
    setShowSummaryModal(true)
  }

  const handleSummaryFormSubmit = (e) => {
    e.preventDefault()

    const errors = {}
    SUMMARY_FIELDS.forEach(field => {
      if (!summaryFormData[field.key] || summaryFormData[field.key].trim() === '') {
        errors[field.key] = true
      }
    })

    if (Object.keys(errors).length > 0) {
      setSummaryFormErrors(errors)
      return
    }

    updateTradeRecord(editingTradeId, { tradeSummary: summaryFormData.tradeSummary.trim() })
    showToast('保存成功')
    setShowSummaryModal(false)
    setEditingTradeId(null)
    setSummaryFormErrors({})
    setSummaryFormData({})
  }

  const handleSummaryFormDataChange = (newFormData, clearError = null) => {
    setSummaryFormData(newFormData)
    if (clearError) {
      setSummaryFormErrors(prev => ({ ...prev, ...clearError }))
    }
  }

  const SUMMARY_FIELDS = [
    {
      key: 'tradeSummary',
      label: '交易总结',
      type: 'textarea',
      placeholder: '请输入',
      required: true,
      rows: 4
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
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px', position: 'relative' }}>
        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
          {/* 筛选条件 */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px', flexShrink: 0 }}>
            <div style={{ width: '180px' }}>
              <FilterSelect
                value={filterTradeType === '' ? '' : filterTradeType}
                onChange={(value) => setFilterTradeType(value === '' ? '' : value)}
                options={[
                  { value: '买入', label: '买入' },
                  { value: '卖出', label: '卖出' }
                ]}
                placeholder="交易类型"
              />
            </div>
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
            <div style={{ position: 'relative', width: '240px' }}>
              <DateRangePicker
                value={filterTradeDateRange}
                onChange={(value) => {
                  setFilterTradeDateRange(value)
                  setCurrentPage(1)
                }}
                placeholder="交易时间"
                style={{ width: '180px' }}
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
                placeholder="操作评级"
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
            editLabel="交易总结"
          />

          {/* 数据表格 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', paddingBottom: '50px', zIndex: '1', background: 'rgb(249, 250, 251)' }}>
            <div className="overflow-y-auto overflow-x-auto" style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: '1' }}>
              <DataTable
                showCheckbox={true}
                fields={[
                  { key: 'tradeNumber', label: '交易编号', width: '120px' },
                  { key: 'tradeType', label: '交易类型', width: '80px' },
                  { key: 'symbol', label: '股票代码', width: '100px' },
                  { key: 'name', label: '股票名称', width: '120px' },
                  { key: 'tradePrice', label: '交易价格', width: '120px' },
                  { key: 'orderPrice', label: '预约价格', width: '120px' },
                  { key: 'tradeQuantity', label: '交易数量', width: '100px' },
                  { key: 'tradeAmount', label: '交易金额', width: '150px' },
                  { key: 'tradeSlippage', label: '交易滑点', width: '120px' },
                  { key: 'tradeCommission', label: '交易佣金', width: '120px' },
                  { key: 'otherFees', label: '其他费用', width: '120px' },
                  { key: 'tradeStrategy', label: '交易策略', width: '150px' },
                  { key: 'tradeTime', label: '交易时间', width: '180px' },
                  { key: 'grades', label: '操作评级', width: '150px' },
                  { key: 'profitPercent', label: '盈亏比例', width: '120px' },
                  { key: 'profit', label: '盈亏金额', width: '120px' },
                  { key: 'fees', label: '手续费', width: '120px' },
                  { key: 'netProfitPercent', label: '净盈亏比', width: '120px' },
                  { key: 'netProfit', label: '净盈亏额', width: '120px' },
                  { key: 'totalSlippage', label: '滑点', width: '120px' },
                  { key: 'slippageNetProfitRatio', label: '滑净盈比', width: '120px' },
                  { key: 'overallScore', label: '交易评级', width: '120px' },
                  { key: 'tradeSummary', label: '交易总结', width: '200px' }
                ]}
                data={paginatedData}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onSelectOne={handleSelectOne}
                renderCell={(field, item) => {
                  if (field.key === 'tradeType') {
                    return <span>{item.tradeType}</span>
                  }
                  if (field.key === 'tradePrice') {
                    if (item.tradeType === '买入') {
                      const price = item.buyPrice
                      return <span>{price !== null && price !== undefined ? (Number.isInteger(price) ? price : price.toFixed(2)) : '-'}</span>
                    } else {
                      const price = item.sellPrice
                      return <span>{price !== null && price !== undefined ? (Number.isInteger(price) ? price : price.toFixed(2)) : '-'}</span>
                    }
                  }
                  if (field.key === 'orderPrice') {
                    if (item.tradeType === '买入') {
                      const orderPrice = item.buyOrderPrice
                      const tradePrice = item.buyPrice
                      const price = orderPrice !== null && orderPrice !== undefined ? orderPrice : tradePrice
                      return <span>{price !== null && price !== undefined ? (Number.isInteger(price) ? price : price.toFixed(2)) : '-'}</span>
                    } else {
                      const orderPrice = item.sellOrderPrice
                      const tradePrice = item.sellPrice
                      const price = orderPrice !== null && orderPrice !== undefined ? orderPrice : tradePrice
                      return <span>{price !== null && price !== undefined ? (Number.isInteger(price) ? price : price.toFixed(2)) : '-'}</span>
                    }
                  }
                  if (field.key === 'tradeQuantity') {
                    if (item.tradeType === '买入') {
                      return <span>{item.buyQuantity ? item.buyQuantity : '-'}</span>
                    } else {
                      return <span>{item.sellQuantity ? item.sellQuantity : '-'}</span>
                    }
                  }
                  if (field.key === 'tradeAmount') {
                    if (item.tradeType === '买入') {
                      const amount = item.buyAmount ? parseFloat(item.buyAmount) : (item.buyPrice && item.buyQuantity ? item.buyPrice * item.buyQuantity : null)
                      return <span>{amount !== null && amount !== undefined ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span>
                    } else {
                      const amount = item.sellAmount ? parseFloat(item.sellAmount) : (item.sellPrice && item.sellQuantity ? item.sellPrice * item.sellQuantity : null)
                      return <span>{amount !== null && amount !== undefined ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span>
                    }
                  }
                  if (field.key === 'tradeSlippage') {
                    if (item.tradeType === '买入') {
                      const tradePrice = item.buyPrice
                      const orderPrice = item.buyOrderPrice
                      const quantity = item.buyQuantity
                      if (tradePrice !== null && tradePrice !== undefined && orderPrice !== null && orderPrice !== undefined && quantity) {
                        const slippage = (tradePrice - orderPrice) * quantity
                        return <span>{slippage.toFixed(2)}</span>
                      }
                      return <span>-</span>
                    } else {
                      const tradePrice = item.sellPrice
                      const orderPrice = item.sellOrderPrice
                      const quantity = item.sellQuantity
                      if (tradePrice !== null && tradePrice !== undefined && orderPrice !== null && orderPrice !== undefined && quantity) {
                        const slippage = (tradePrice - orderPrice) * quantity
                        return <span>{slippage.toFixed(2)}</span>
                      }
                      return <span>-</span>
                    }
                  }
                  if (field.key === 'tradeCommission') {
                    return <span>-</span>
                  }
                  if (field.key === 'otherFees') {
                    return <span>-</span>
                  }
                  if (field.key === 'tradeStrategy') {
                    if (item.tradeType === '买入') {
                      const strategyId = item.buyStrategyId
                      const strategies = useStore.getState().strategies.buy || []
                      const strategy = strategies.find(s => s.id === strategyId)
                      return <span>{strategy ? strategy.name : '-'}</span>
                    } else {
                      const strategyId = item.sellStrategyId
                      const strategies = useStore.getState().strategies.sell || []
                      const strategy = strategies.find(s => s.id === strategyId)
                      return <span>{strategy ? strategy.name : '-'}</span>
                    }
                  }
                  if (field.key === 'tradeTime') {
                    if (item.tradeType === '买入') {
                      return <span>{item.buyTime ? formatDate(item.buyTime) : '-'}</span>
                    } else {
                      return <span>{item.sellTime ? formatDate(item.sellTime) : '-'}</span>
                    }
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
                  if (field.key === 'totalSlippage') {
                    return <span>-</span>
                  }
                  if (field.key === 'slippageNetProfitRatio') {
                    return <span>-</span>
                  }
                  if (field.key === 'profitPercent') {
                    const percent = parseFloat(item.profitPercent)
                    return <span>{percent >= 0 ? '+' : ''}{percent.toFixed(2)}%</span>
                  }
                  if (field.key === 'grades') {
                    return <span>{item.buyGrade || '-'}</span>
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
        title="交易总结"
        fields={SUMMARY_FIELDS}
        formData={summaryFormData}
        formErrors={summaryFormErrors}
        onFormDataChange={handleSummaryFormDataChange}
        width="max-w-md"
      />
    </div>
  )
}

export default TradeRecords
