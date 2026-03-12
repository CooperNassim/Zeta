import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Download, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import ExcelJS from 'exceljs'
import Modal from '../components/Modal'
import DateRangePicker from '../components/DateRangePicker'
import FilterSelect from '../components/FilterSelect'
import DataTable from '../components/DataTable'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import ExportModal from '../components/ExportModal'
import ConfirmModal from '../components/ConfirmModal'
import CustomInput from '../components/CustomInput'
import ErrorMessage from '../components/ErrorMessage'
import { useToast } from '../contexts/ToastContext'

// 字段定义
const FIELDS = [
  { key: 'createdAt', label: '时间', type: 'datetime', width: '18%' },
  { key: 'type', label: '记账类型', type: 'text', width: '13%' },
  { key: 'symbol', label: '股票代码', type: 'text', width: '15%' },
  { key: 'name', label: '股票名称', type: 'text', width: '17%' },
  { key: 'description', label: '描述', type: 'text', width: '17%' },
  { key: 'amount', label: '金额', type: 'text', width: '10%' },
  { key: 'balance', label: '余额', type: 'text', width: '10%' }
]

const TransactionHistory = () => {
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [accountType, setAccountType] = useState('real')
  const pageSize = 20

  const transactions = useStore(state => state.transactions)
  const virtualTransactions = useStore(state => state.virtualTransactions)
  const account = useStore(state => state.account)
  const addTransaction = useStore(state => state.addTransaction)
  const deleteMultipleTransactions = useStore(state => state.deleteMultipleTransactions)
  const orders = useStore(state => state.orders)

  // 根据账户类型获取对应的数据
  const currentTransactions = accountType === 'real' ? transactions : virtualTransactions
  const currentAccount = account[accountType] || { balance: 0, totalInvested: 0, totalProfit: 0 }

  const handleSelectAll = (ids) => {
    setSelectedIds(ids)
  }

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id))
    }
  }

  const [transactionForm, setTransactionForm] = useState({
    type: 'income',
    amount: '',
    description: ''
  })
  const [formErrors, setFormErrors] = useState({
    amount: false,
    description: false
  })

  // 从预约订单中获取股票信息
  const getStockInfoFromOrders = () => {
    // 查找最近的买入或卖出订单
    const recentOrder = orders.find(order =>
      order.type === 'buy' || order.type === 'sell'
    )
    if (recentOrder) {
      return {
        symbol: recentOrder.symbol,
        name: recentOrder.name
      }
    }
    return {
      symbol: '',
      name: ''
    }
  }

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      alert('暂无数据可导出')
      return
    }
    setShowExportModal(true)
  }

  const handleDelete = () => {
    if (selectedIds.length === 0) return
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    // 检查是否有选中"买入股票"或"卖出股票"类型的记录
    const hasStockTransaction = selectedIds.some(id => {
      const transaction = currentTransactions.find(t => t.id === id)
      return transaction && (transaction.type === '买入' || transaction.type === '卖出')
    })

    if (hasStockTransaction) {
      showToast('只可删除手动记账', 'error')
      setShowDeleteModal(false)
      return
    }

    console.log('确认删除, selectedIds:', selectedIds, 'accountType:', accountType)
    console.log('当前实盘交易数:', transactions.length)
    console.log('当前虚拟盘交易数:', virtualTransactions.length)

    deleteMultipleTransactions(selectedIds, accountType)

    setTimeout(() => {
      console.log('删除后 - 实盘交易数:', transactions.length)
      console.log('删除后 - 虚拟盘交易数:', virtualTransactions.length)
    }, 100)

    setSelectedIds([])
    setShowDeleteModal(false)
    showToast('删除成功')
  }

  const validateForm = () => {
    const errors = {
      amount: !transactionForm.amount || transactionForm.amount.trim() === '',
      description: !transactionForm.description || transactionForm.description.trim() === ''
    }
    setFormErrors(errors)
    return !errors.amount && !errors.description
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const stockInfo = getStockInfoFromOrders()
    addTransaction({
      type: transactionForm.type === 'income' ? '入账' : '出账',
      symbol: stockInfo.symbol,
      name: stockInfo.name,
      amount: transactionForm.type === 'income' ? parseFloat(transactionForm.amount) : -parseFloat(transactionForm.amount),
      description: transactionForm.description,
      balance: currentAccount.balance + (transactionForm.type === 'income' ? parseFloat(transactionForm.amount) : -parseFloat(transactionForm.amount)),
      createdAt: new Date().toISOString()
    }, accountType)
    setShowModal(false)
    setTransactionForm({ type: 'income', amount: '', description: '' })
    setFormErrors({ amount: false, description: false })
  }

  const handleConfirmExport = async () => {
    const headers = FIELDS.map(f => f.label)
    const rows = filteredTransactions.map(data =>
      FIELDS.map(f => {
        if (f.key === 'createdAt') {
          return format(new Date(data.createdAt), 'yyyy-MM-dd HH:mm:ss')
        }
        if (f.key === 'amount') {
          return data.amount
        }
        return data[f.key] || ''
      })
    )

    if (exportFormat === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('账单明细')

      worksheet.columns = headers.map(header => ({
        header: header,
        key: header,
        width: 20
      }))

      rows.forEach(row => {
        worksheet.addRow(row)
      })

      const dateColIndex = headers.findIndex(h => h === '时间')
      if (dateColIndex !== -1) {
        const dateColumn = worksheet.getColumn(dateColIndex + 1)
        dateColumn.numFmt = 'yyyy-mm-dd hh:mm:ss'
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `账单明细_${format(new Date(), 'yyyyMMdd')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `账单明细_${format(new Date(), 'yyyyMMdd')}.csv`
      link.click()
    }

    setShowExportModal(false)
  }

  const filteredTransactions = (() => {
    let filtered = currentTransactions

    // 过滤已删除的数据
    filtered = filtered.filter(t => !t.deleted)

    // 类型筛选
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType)
    }

    // 日期筛选
    if (filterDateRange) {
      const [startDate, endDate] = filterDateRange.split('~')
      if (startDate && endDate) {
        filtered = filtered.filter(t => {
          const transactionDate = format(new Date(t.createdAt), 'yyyy-MM-dd')
          return transactionDate >= startDate && transactionDate <= endDate
        })
      }
    }

    return filtered
  })()

  const totalPages = Math.ceil(filteredTransactions.length / pageSize)
  const paginatedData = filteredTransactions.slice().reverse().slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // 获取当前月份
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // 计算本月数据
  const monthIncome = currentTransactions.filter(t => {
    const date = new Date(t.createdAt)
    return !t.deleted && t.amount > 0 && date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).reduce((sum, t) => sum + t.amount, 0)

  const monthExpense = currentTransactions.filter(t => {
    const date = new Date(t.createdAt)
    return !t.deleted && t.amount < 0 && date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const monthBalance = monthIncome - monthExpense

  // 计算上月数据
  const lastMonthDate = new Date(currentYear, currentMonth, 0) // 上月最后一天
  const lastMonth = lastMonthDate.getMonth()
  const lastMonthYear = lastMonthDate.getFullYear()

  // 计算上月最后一秒的总资产（当前余额减去本月收支）
  const lastMonthBalance = currentAccount.balance - monthIncome + monthExpense

  // 计算上月收入
  const lastMonthIncome = currentTransactions.filter(t => {
    const date = new Date(t.createdAt)
    return !t.deleted && t.amount > 0 && date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
  }).reduce((sum, t) => sum + t.amount, 0)

  // 计算上月支出
  const lastMonthExpense = currentTransactions.filter(t => {
    const date = new Date(t.createdAt)
    return !t.deleted && t.amount < 0 && date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
  }).reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // 计算上月盈亏
  const lastMonthBalanceProfit = lastMonthIncome - lastMonthExpense

  // 计算总资产差值和百分比
  const balanceDiff = currentAccount.balance - lastMonthBalance
  const balancePercent = lastMonthBalance > 0 ? ((balanceDiff / lastMonthBalance) * 100) : 0

  // 计算本月收入差值和百分比
  const incomeDiff = monthIncome - lastMonthIncome
  const incomePercent = lastMonthIncome > 0 ? ((incomeDiff / lastMonthIncome) * 100) : 0

  // 计算本月支出差值和百分比
  const expenseDiff = monthExpense - lastMonthExpense
  const expensePercent = lastMonthExpense > 0 ? ((expenseDiff / lastMonthExpense) * 100) : 0

  // 计算本月盈亏差值和百分比
  const profitDiff = monthBalance - lastMonthBalanceProfit
  const profitPercent = lastMonthBalanceProfit !== 0 ? ((profitDiff / Math.abs(lastMonthBalanceProfit)) * 100) : 0

  // 百分比格式化：整数时不显示小数点，有小数时显示2位（四舍五入）
  const formatPercent = (percent) => {
    const absPercent = Math.abs(percent)
    return absPercent === Math.round(absPercent)
      ? Math.round(percent)
      : parseFloat(percent.toFixed(2))
  }

  const formattedPercent = formatPercent(balancePercent)
  const formattedIncomePercent = formatPercent(incomePercent)
  const formattedExpensePercent = formatPercent(expensePercent)
  const formattedProfitPercent = formatPercent(profitPercent)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px', position: 'relative', paddingBottom: '10px' }}>
        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'flex-start', marginTop: '10px' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px 25px',
            minHeight: '55px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div>
            <p className="text-sm mb-0" style={{ color: '#666' }}>总资产</p>
            <p className="text-2xl font-bold mb-2" style={{ color: '#0F1419' }}>
              ¥{currentAccount.balance.toLocaleString()}
            </p>
            <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '4px' }}>上月</p>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '8px', fontSize: '14px' }}>
                ¥{lastMonthBalance.toLocaleString()}
              </p>
              {balanceDiff >= 0 ? (
                <span style={{ color: '#22c55e', fontSize: '14px', display: 'inline-block', marginRight: '4px' }}>▲</span>
              ) : (
                <span style={{ color: '#ef4444', fontSize: '14px', display: 'inline-block', marginRight: '4px' }}>▼</span>
              )}
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', fontSize: '14px' }}>
                {formattedPercent > 0 ? '+' : ''}{formattedPercent}%
              </p>
            </div>
          </div>
        </div>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px 25px',
            minHeight: '55px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div>
            <p className="text-sm mb-0" style={{ color: '#666' }}>本月收入</p>
            <p className="text-2xl font-bold mb-2" style={{ color: '#0F1419' }}>
              ¥{monthIncome.toLocaleString()}
            </p>
            <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '4px' }}>上月</p>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '8px', fontSize: '14px' }}>
                ¥{lastMonthIncome.toLocaleString()}
              </p>
              {incomeDiff >= 0 ? (
                <span style={{ color: '#22c55e', fontSize: '14px', display: 'inline-block', marginRight: '4px' }}>▲</span>
              ) : (
                <span style={{ color: '#ef4444', fontSize: '14px', display: 'inline-block', marginRight: '4px' }}>▼</span>
              )}
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', fontSize: '14px' }}>
                {formattedIncomePercent > 0 ? '+' : ''}{formattedIncomePercent}%
              </p>
            </div>
          </div>
        </div>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px 25px',
            minHeight: '55px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div>
            <p className="text-sm mb-0" style={{ color: '#666' }}>本月支出</p>
            <p className="text-2xl font-bold mb-2" style={{ color: '#0F1419' }}>
              ¥{monthExpense.toLocaleString()}
            </p>
            <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '4px' }}>上月</p>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '8px', fontSize: '14px' }}>
                ¥{lastMonthExpense.toLocaleString()}
              </p>
              {expenseDiff >= 0 ? (
                <span style={{ color: '#22c55e', fontSize: '14px', display: 'inline-block', marginRight: '4px' }}>▲</span>
              ) : (
                <span style={{ color: '#ef4444', fontSize: '14px', display: 'inline-block', marginRight: '4px' }}>▼</span>
              )}
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', fontSize: '14px' }}>
                {formattedExpensePercent > 0 ? '+' : ''}{formattedExpensePercent}%
              </p>
            </div>
          </div>
        </div>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px 25px',
            minHeight: '55px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div>
            <p className="text-sm mb-0" style={{ color: '#666' }}>本月盈亏</p>
            <p className="text-2xl font-bold mb-2" style={{ color: '#0F1419' }}>
              {monthBalance > 0 ? '+' : ''}{monthBalance < 0 ? '-' : ''}¥{Math.abs(monthBalance).toLocaleString()}
            </p>
            <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '4px' }}>上月</p>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '8px', fontSize: '14px' }}>
                {lastMonthBalanceProfit > 0 ? '+' : ''}{lastMonthBalanceProfit < 0 ? '-' : ''}¥{Math.abs(lastMonthBalanceProfit).toLocaleString()}
              </p>
              {profitDiff >= 0 ? (
                <span style={{ color: '#22c55e', fontSize: '14px', display: 'inline-block', marginRight: '4px' }}>▲</span>
              ) : (
                <span style={{ color: '#ef4444', fontSize: '14px', display: 'inline-block', marginRight: '4px' }}>▼</span>
              )}
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', fontSize: '14px' }}>
                {formattedProfitPercent > 0 ? '+' : ''}{formattedProfitPercent}%
              </p>
            </div>
          </div>
        </div>
      </div>






      {/* 筛选器和功能按钮 */}
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center', marginTop: '10px', marginBottom: '0', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '240px' }}>
            <DateRangePicker
              value={filterDateRange}
              onChange={(value) => {
                setFilterDateRange(value)
                setCurrentPage(1)
              }}
              placeholder="时间"
            />
          </div>
          <div style={{ width: '180px' }}>
            <FilterSelect
              value={filterType === 'all' ? '' : filterType}
              onChange={(value) => {
                setFilterType(value === '' ? 'all' : value)
              }}
              options={[
                { value: '入账', label: '入账' },
                { value: '出账', label: '出账' },
                { value: '买入', label: '买入股票' },
                { value: '卖出', label: '卖出股票' }
              ]}
              placeholder="记账类型"
            />
          </div>
          <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          手动记账
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          disabled={filteredTransactions.length === 0}
          className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          导出
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDelete}
          disabled={selectedIds.length === 0}
          className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          删除
        </motion.button>
        </div>
        {/* 实盘/虚拟切换 */}
        <div style={{ display: 'flex', gap: '0', background: '#f3f4f6', borderRadius: '99px', padding: '2px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAccountType('real')}
            className="px-4 py-2 rounded text-sm transition-all"
            style={{
              borderRadius: '99px 0 0 99px',
              background: accountType === 'real' ? '#0F1419' : '#ffffff',
              border: accountType === 'real' ? 'none' : '1px solid #000000',
              color: accountType === 'real' ? '#ffffff' : '#000000',
              fontWeight: accountType === 'real' ? '500' : '400'
            }}
          >
            实盘
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAccountType('virtual')}
            className="px-4 py-2 rounded text-sm transition-all"
            style={{
              borderRadius: '0 99px 99px 0',
              background: accountType === 'virtual' ? '#0F1419' : '#ffffff',
              border: accountType === 'virtual' ? 'none' : '1px solid #000000',
              color: accountType === 'virtual' ? '#ffffff' : '#000000',
              fontWeight: accountType === 'virtual' ? '500' : '400'
            }}
          >
            虚拟
          </motion.button>
        </div>
      </div>





      {/* 交易记录列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', marginTop: '10px', paddingBottom: '50px', zIndex: '1', background: 'rgb(249, 250, 251)' }}>
        <div className="overflow-y-auto overflow-x-auto" style={{ flex: 1, minHeight: 0, position: 'relative', zIndex: '1', overflowY: 'scroll', scrollbarGutter: 'stable' }}>
          <DataTable
            fields={FIELDS}
            data={paginatedData}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            renderCell={(field, item) => {
              if (field.key === 'createdAt') {
                const date = item.createdAt ? new Date(item.createdAt) : null
                return date && !isNaN(date.getTime()) ? format(date, 'yyyy-MM-dd HH:mm:ss') : '-'
              }
              if (field.key === 'type') {
                const typeMap = { '买入': '买入股票', '卖出': '卖出股票' }
                return <span style={{ color: '#000' }}>{typeMap[item.type] || item.type}</span>
              }
              if (field.key === 'amount') {
                const isNegative = item.type === '买入' || item.type === '出账'
                return <span style={{ color: isNegative ? '#ef4444' : '#22c55e' }}>{isNegative ? '-' : '+'}¥{Math.abs(item.amount).toLocaleString()}</span>
              }
              if (field.key === 'balance') {
                return `¥${(item.balance || currentAccount.balance).toLocaleString()}`
              }
              return item[field.key] || '-'
            }}
            emptyStateProps={{
              Component: EmptyState,
              props: { message: '暂无数据' }
            }}
          />
        </div>
      </div>

      {/* 分页器 */}
      <div style={{ position: 'absolute', right: '0', bottom: '0', height: '50px', zIndex: '10', width: '100%' }}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          selectedCount={selectedIds.length}
          totalCount={filteredTransactions.length}
        />
      </div>

      {/* 手动记账弹窗 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="手动记账"
        width="max-w-md"
        footer={
          <>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              form="transactionForm"
              className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0F1419' }}
            >
              保存
            </button>
          </>
        }
      >
        <form id="transactionForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">类型</label>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={transactionForm.type === 'income'}
                  onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                  className="hidden"
                />
                <div className={`p-4 rounded-lg border text-center transition-all ${
                  transactionForm.type === 'income'
                    ? 'border-green-500 bg-green-500/20 text-green-600'
                    : 'border-gray-300 text-gray-600 hover:border-green-500/50'
                }`}>
                  <ArrowUpCircle className="w-6 h-6 inline-block mr-4" />
                  <span className="font-medium">入账</span>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={transactionForm.type === 'expense'}
                  onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                  className="hidden"
                />
                <div className={`p-4 rounded-lg border text-center transition-all ${
                  transactionForm.type === 'expense'
                    ? 'border-red-500 bg-red-500/20 text-red-600'
                    : 'border-gray-300 text-gray-600 hover:border-red-500/50'
                }`}>
                  <ArrowDownCircle className="w-6 h-6 inline-block mr-4" />
                  <span className="font-medium">出账</span>
                </div>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2"><span className="text-red-500">*</span> 金额 (¥)</label>
            <CustomInput
              type="number"
              step="0.01"
              min="0.01"
              value={transactionForm.amount}
              onChange={(value) => {
                setTransactionForm({ ...transactionForm, amount: value })
                if (value && value.trim() !== '') {
                  setFormErrors({ ...formErrors, amount: false })
                }
              }}
              placeholder="请输入"
              error={formErrors.amount}
            />
            {formErrors.amount && <ErrorMessage />}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2"><span className="text-red-500">*</span> 描述</label>
            <CustomInput
              type="textarea"
              value={transactionForm.description}
              onChange={(value) => {
                setTransactionForm({ ...transactionForm, description: value })
                if (value && value.trim() !== '') {
                  setFormErrors({ ...formErrors, description: false })
                }
              }}
              placeholder="请输入"
              rows={2}
              error={formErrors.description}
            />
            {formErrors.description && <ErrorMessage />}
          </div>
        </form>
      </Modal>

      {/* 导出弹窗 */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleConfirmExport}
        exportFormat={exportFormat}
        onFormatChange={(format) => setExportFormat(format)}
        totalCount={filteredTransactions.length}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="删除"
        message={`确认删除${selectedIds.length}条数据吗？`}
      />
      </div>
    </div>
  )
}

export default TransactionHistory
