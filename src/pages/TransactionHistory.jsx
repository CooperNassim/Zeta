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
  { key: 'createdAt', label: '发生时间', type: 'datetime', width: '16%' },
  { key: 'type', label: '记账类型', type: 'text', width: '10%' },
  { key: 'tradeNumber', label: '交易编号', type: 'text', width: '15%' },
  { key: 'symbol', label: '股票代码', type: 'text', width: '13%' },
  { key: 'name', label: '股票名称', type: 'text', width: '13%' },
  { key: 'description', label: '记账说明', type: 'text', width: '13%' },
  { key: 'amount', label: '记账金额', type: 'text', width: '10%' },
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
  const pageSize = 20

  const transactions = useStore(state => state.transactions)
  const account = useStore(state => state.account)
  const orders = useStore(state => state.orders)
  const addTransaction = useStore(state => state.addTransaction)
  const deleteTransaction = useStore(state => state.deleteTransaction)
  const deleteMultipleTransactions = useStore(state => state.deleteMultipleTransactions)
  const getCurrentStockPositions = useStore(state => state.getCurrentStockPositions)
  const tradeRecords = useStore(state => state.tradeRecords)
  const resetTransactionsData = useStore(state => state.resetTransactionsData)



  // 只使用实盘数据
  const currentTransactions = transactions
  
  // 完全基于金额累积的余额计算：忽略数据库中可能存在的错误balance字段
  const calculateCurrentBalance = () => {
    if (!currentTransactions || currentTransactions.length === 0) {
      return 0
    }
    
// 按时间升序排序（从最早到最新）
const sortedTransactions = currentTransactions
  .filter(t => !t.deleted)
  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

console.log('🕒 [时间排序验证] 交易记录排序结果:')
sortedTransactions.forEach((t, idx) => {
  console.log(`   交易${idx+1}: ${t.createdAt} - ${t.type} - ${t.amount}`)
})
    
  // 纯金额累积计算：忽略任何历史balance字段
  let balance = 0
  console.log('🔍 [余额调试] 开始逐笔交易分析:')
  sortedTransactions.forEach((transaction, index) => {
    const transactionAmount = parseFloat(transaction.amount) || 0
    const oldBalance = balance
    balance += transactionAmount
    
    console.log(`   交易${index+1}: amount=${transactionAmount}, ` +
               `余额变化: ${oldBalance} -> ${balance}, ` +
               `类型: ${transaction.type}, ` +
               `时间: ${transaction.createdAt}`)
  })
  
  console.log('💡 [余额调试] 分析结果:')
  console.log(`   - 交易总数: ${sortedTransactions.length}`)
  console.log(`   - 累计金额: ${balance}`)
  console.log(`   - 累计差额判断: 如果余额异常大，请检查数据源`)
    
    return balance
  }

  const currentBalance = calculateCurrentBalance()

  console.log('🔧 [TransactionHistory] 余额累积计算:')
  console.log('   - 交易记录数量:', currentTransactions.length)
  console.log('   - 当前累积余额:', currentBalance)
  
  // 强制覆盖任何可能错误的store余额，使用我们正确的累计计算值
  const currentAccount = { 
    balance: currentBalance, // 强制使用正确的累计计算结果
    totalInvested: (account.real?.totalInvested || 0),
    totalProfit: (account.real?.totalProfit || 0)
  }

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

    console.log('确认删除, selectedIds:', selectedIds)
    console.log('当前交易数:', transactions.length)

    deleteMultipleTransactions(selectedIds)

    setTimeout(() => {
      console.log('删除后 - 交易数:', transactions.length)
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
    
    // 恢复基于历史记录的余额累积计算
    const transactionAmount = transactionForm.type === 'income' ? parseFloat(transactionForm.amount) : -parseFloat(transactionForm.amount)
    
    // 在现有余额基础上累积计算新余额
    const newBalance = currentBalance + transactionAmount
    
    console.log('🔧 [手动入账] 余额累积计算:')
    console.log('   - 历史余额:', currentBalance)
    console.log('   - 交易金额:', transactionAmount)
    console.log('   - 新余额 (累计):', newBalance)
    
    console.log('💰 [手动入账] 余额计算调试（最终修复）:')
    console.log('   - 当前计算余额:', currentBalance)
    console.log('   - 当前交易金额:', transactionAmount)
    console.log('   - 新余额:', newBalance)
    console.log('   - 交易记录数量:', transactions.length)
    
    addTransaction({
      type: transactionForm.type === 'income' ? '手动入账' : '手动出账',
      symbol: '',  // 🔧 修复：手动记账不应该有股票代码
      name: '',    // 🔧 修复：手动记账不应该有股票名称
      amount: transactionAmount,
      description: transactionForm.description,
      balance: newBalance,
      createdAt: new Date().toISOString()
    }, 'real')
    setShowModal(false)
    setTransactionForm({ type: 'income', amount: '', description: '' })
    setFormErrors({ amount: false, description: false })
  }

  const handleConfirmExport = async () => {
    const headers = FIELDS.map(f => f.label)
    const rows = filteredTransactions.map(data =>
      FIELDS.map(f => {
        if (f.key === 'createdAt') {
          // createdAt 已经是格式化后的字符串
          return data.createdAt || ''
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

      const dateColIndex = headers.findIndex(h => h === '发生时间')
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
          // createdAt 格式为 "年-月-日 时:分:秒"，取日期部分比较
          const transactionDate = t.createdAt ? t.createdAt.split(' ')[0] : ''
          return transactionDate >= startDate && transactionDate <= endDate
        })
      }
    }

    return filtered
  })()

  // 解析日期字符串 "年-月-日 时:分:秒" 为 Date 对象
  const parseDate = (dateStr) => {
    if (!dateStr) return null
    // 将 "2026-04-02 22:48:12" 转换为 "2026-04-02T22:48:12" 以便正确解析
    const isoStr = dateStr.replace(' ', 'T')
    const date = new Date(isoStr)
    return isNaN(date.getTime()) ? null : date
  }

  const totalPages = Math.ceil(filteredTransactions.length / pageSize)
  
  // 按发生时间降序排序，最新的在前
  const sortedTransactions = filteredTransactions.slice().sort((a, b) => {
    const dateA = parseDate(a.createdAt)
    const dateB = parseDate(b.createdAt)
    
    if (!dateA && !dateB) return 0
    if (!dateA) return 1  // a的时间缺失，排到后面
    if (!dateB) return -1 // b的时间缺失，排到前面
    
    return dateB.getTime() - dateA.getTime() // 降序：最新的在前
  })
  
  const paginatedData = sortedTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // 获取当前月份
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // 计算本月数据
  const monthIncome = currentTransactions.filter(t => {
    const date = parseDate(t.createdAt)
    return !t.deleted && t.amount > 0 && date && date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).reduce((sum, t) => sum + t.amount, 0)

  const monthExpense = currentTransactions.filter(t => {
    const date = parseDate(t.createdAt)
    return !t.deleted && t.amount < 0 && date && date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const monthBalance = monthIncome - monthExpense

  // 计算上月数据
  const lastMonthDate = new Date(currentYear, currentMonth, 0) // 上月最后一天
  const lastMonth = lastMonthDate.getMonth()
  const lastMonthYear = lastMonthDate.getFullYear()

  // 计算当前总资产：使用store的getTotalAssets方法确保数据同步
  const getTotalAssets = useStore(state => state.getTotalAssets)
  const currentTotalAssets = getTotalAssets('real')
  
  // 获取上月最后一天的日期（作为查询终点）
  const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)
  
  // 找到上月最后一笔交易记录的余额作为上月总资产
  const lastMonthTransactions = currentTransactions
    .filter(t => {
      const date = parseDate(t.createdAt)
      return !t.deleted && date && date <= lastMonthEnd
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // 按时间倒序，最新的在前
  
  // 使用上月最后一笔交易的余额作为上月总资产基准值
  const lastMonthAssets = lastMonthTransactions.length > 0 
    ? (lastMonthTransactions[0].balance || 100000)
    : 100000

  // 获取上个月所有交易（按时间排序）
  const lastMonthAllTransactions = currentTransactions
    .filter(t => {
      const date = parseDate(t.createdAt)
      return !t.deleted && date && date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // 按时间顺序排序
    
  // 获取上月最后一天的日期
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0) // 上月最后一天
  
  // 获取上月最后一天最后一笔交易的余额作为上月资产值
  const lastDayTransactions = lastMonthAllTransactions.filter(t => {
    const date = parseDate(t.createdAt)
    return date && date.getDate() === lastDayOfMonth.getDate()
  })
  
  // 上月最后一天的余额：使用最后一天的最后一笔交易余额，如果没有则使用默认值
  const lastMonthBalanceLastDay = lastDayTransactions.length > 0 
    ? (lastDayTransactions[lastDayTransactions.length - 1].balance || 100000)
    : 100000
  
  // 上月最后一天的收入：当天所有收入之和
  const lastMonthIncomeLastDay = lastDayTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
  
  // 上月最后一天的支出：当天所有支出之和
  const lastMonthExpenseLastDay = lastDayTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  // 上个月总的收入（整个月）
  const lastMonthIncome = lastMonthAllTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
  
  // 上个月总的支出（整个月）
  const lastMonthExpense = lastMonthAllTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // 计算上月盈亏
  const lastMonthBalanceProfit = lastMonthIncome - lastMonthExpense

  // 计算总资产差值和百分比（对比上月最后一天的总资产）
  const balanceDiff = currentTotalAssets - lastMonthAssets
  const balancePercent = lastMonthAssets > 0 ? ((balanceDiff / lastMonthAssets) * 100) : 0

  // 计算本月收入差值和百分比（对比上月最后一天的收入）
  const incomeDiff = monthIncome - (lastMonthIncomeLastDay || 0)
  const incomePercent = (lastMonthIncomeLastDay || 0) > 0 ? ((incomeDiff / (lastMonthIncomeLastDay || 1)) * 100) : 0

  // 计算本月支出差值和百分比（对比上月最后一天的支出）
  const expenseDiff = monthExpense - (lastMonthExpenseLastDay || 0)
  const expensePercent = (lastMonthExpenseLastDay || 0) > 0 ? ((expenseDiff / (lastMonthExpenseLastDay || 1)) * 100) : 0

  // 计算本月盈亏差值和百分比（对比上月最后一天的盈亏）
  const lastMonthBalanceProfitLastDay = (lastMonthIncomeLastDay || 0) - (lastMonthExpenseLastDay || 0)
  const profitDiff = monthBalance - lastMonthBalanceProfitLastDay
  const profitPercent = lastMonthBalanceProfitLastDay !== 0 ? ((profitDiff / Math.abs(lastMonthBalanceProfitLastDay)) * 100) : 0

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
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '0px', paddingRight: '10px', position: 'relative', paddingBottom: '10px' }}>
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
              {currentTotalAssets.toLocaleString()}
            </p>
            <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '4px' }}>上月</p>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '8px', fontSize: '14px' }}>
                {lastMonthAssets < 0 ? '-' : ''}{Math.abs(lastMonthAssets).toLocaleString()}
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
              {monthIncome.toLocaleString()}
            </p>
            <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '4px' }}>上月</p>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '8px', fontSize: '14px' }}>
                {lastMonthIncomeLastDay < 0 ? '-' : ''}{Math.abs(lastMonthIncomeLastDay).toLocaleString()}
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
              {monthExpense.toLocaleString()}
            </p>
            <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '4px' }}>上月</p>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '8px', fontSize: '14px' }}>
                {lastMonthExpenseLastDay < 0 ? '-' : ''}{Math.abs(lastMonthExpenseLastDay).toLocaleString()}
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
            <p className="text-sm mb-0" style={{ color: '#666' }}>本月收支</p>
            <p className="text-2xl font-bold mb-2" style={{ color: '#0F1419' }}>
              {monthBalance < 0 ? '-' : ''}{Math.abs(monthBalance).toLocaleString()}
            </p>
            <div style={{ borderBottom: '1px dashed #d1d5db', marginBottom: '8px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '4px' }}>上月</p>
              <p className="text-xs font-medium mb-0" style={{ color: '#6b7280', marginRight: '8px', fontSize: '14px' }}>
                {lastMonthBalanceProfitLastDay < 0 ? '-' : ''}{Math.abs(lastMonthBalanceProfitLastDay).toLocaleString()}
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
              placeholder="发生时间"
            />
          </div>
          <div style={{ width: '180px' }}>
            <FilterSelect
              value={filterType === 'all' ? '' : filterType}
              onChange={(value) => {
                setFilterType(value === '' ? 'all' : value)
              }}
              options={[
                { value: '手动入账', label: '手动入账' },
                { value: '手动出账', label: '手动出账' },
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
          className="px-4 py-2 bg-[#0F1419] border-0 rounded text-white hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
        >
          <ArrowUpCircle className="w-4 h-4 text-white" />
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
                // createdAt 已经是格式化后的字符串 "年-月-日 时:分:秒"
                return item.createdAt || '-'
              }
              if (field.key === 'type') {
                const typeMap = { '买入': '买入股票', '卖出': '卖出股票' }
                return <span style={{ color: '#000' }}>{typeMap[item.type] || item.type}</span>
              }
              if (field.key === 'tradeNumber') {
                // 交易编号显示逻辑：手动记账类型留空，股票交易从订单中获取交易编号
                if (item.type === '手动入账' || item.type === '手动出账') {
                  console.log('[Debug TradeNumber] 手动记账类型，返回空值', { id: item.id, type: item.type })
                  return ''
                } else if (item.type === '买入' || item.type === '卖出') {
                  console.log('[Debug TradeNumber] 股票交易类型，开始匹配', { 
                    id: item.id, 
                    type: item.type, 
                    symbol: item.symbol,
                    name: item.name
                  })
                  
                  console.log('[Debug TradeNumber] 所有订单信息:', orders.map(o => ({
                    id: o.id,
                    tradeNumber: o.tradeNumber,
                    type: o.type,
                    symbol: o.symbol,
                    name: o.name
                  })))
                  
                  // 简单直接的逻辑：只要类型匹配就返回第一个相关订单的交易编号
                  const targetType = item.type === '买入' ? 'buy' : 'sell'
                  console.log('[Debug TradeNumber] 目标类型:', targetType)
                  
                  const relatedOrders = orders.filter(order => order.type === targetType)
                  console.log('[Debug TradeNumber] 匹配到的订单数量:', relatedOrders.length)
                  
                  if (relatedOrders.length > 0) {
                    const result = relatedOrders[0].tradeNumber
                    console.log('[Debug TradeNumber] ✅ 返回交易编号:', result)
                    return result
                  }
                  
                  console.log('[Debug TradeNumber] ❌ 没有找到匹配的订单，返回 -')
                  return '-'
                }
                console.log('[Debug TradeNumber] 其他情况，显示原值', { 
                  tradeNumber: item.tradeNumber, 
                  type: item.type 
                })
                return item.tradeNumber || '-'
              }
              if (field.key === 'amount') {
                // 格式化金额：正数取整，有小数点取小数点2位四舍五入，千位分隔符
                const formattedAmount = () => {
                  const amount = parseFloat(item.amount)
                  if (isNaN(amount)) return '0'
                  
                  if (Number.isInteger(amount)) {
                    // 整数：直接使用toLocaleString添加千位分隔符
                    return amount.toLocaleString('zh-CN')
                  } else {
                    // 有小数：四舍五入到2位小数，然后添加千位分隔符
                    const roundedAmount = Math.round(amount * 100) / 100
                    return roundedAmount.toLocaleString('zh-CN', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2 
                    })
                  }
                }
                
                return <span>{formattedAmount()}</span>
              }
              if (field.key === 'balance') {
                // 🔧 **彻底修复：使用累积计算方法替代被污染的数据库balance字段**
                
                // 将交易记录按时间正序排列（从最早到最新）
                const sortedTransactions = [...(currentTransactions || [])]
                  .filter(t => !t.deleted)
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                
                // 找到当前记录在排序后的位置
                const currentIndex = sortedTransactions.findIndex(t => t.id === item.id)
                
                // 计算累积到当前记录的余额
                let runningBalance = 0
                for (let i = 0; i <= currentIndex; i++) {
                  const amount = parseFloat(sortedTransactions[i].amount) || 0
                  runningBalance += amount
                  
                  // 调试信息：显示每一笔计算的详细信息
                  console.log(`🧮 [表格余额计算] 交易${i+1}: ${sortedTransactions[i].type}`)
                  console.log(`   金额: ${sortedTransactions[i].amount}, 累积余额: ${runningBalance}`)
                }
                
                const dbBalance = parseFloat(item.balance) || 0
                
                // 验证结果
                console.log(`✅ [表格余额验证] 最终计算结果:`)
                console.log(`   交易类型: ${item.type}, 金额: ${item.amount}`)
                console.log(`   累积计算余额: ${runningBalance}`)
                console.log(`   数据库balance字段: ${dbBalance}`)
                
                if (Math.abs(runningBalance - dbBalance) > 100) {
                  console.warn(`⚠️ [表格余额修复] 数据库balance字段已污染，使用安全计算值`)
                }
                
                // 使用安全的累积计算值
                const finalBalance = runningBalance
                
                // 格式化显示
                if (Number.isInteger(finalBalance)) {
                  return finalBalance.toLocaleString('zh-CN')
                } else {
                  const roundedBalance = Math.round(finalBalance * 100) / 100
                  return roundedBalance.toLocaleString('zh-CN', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })
                }
              }
              if (field.key === 'description') {
                // 股票交易类型：格式化显示为 "买入xxx股" 或 "卖出xxx股"
                if (item.type === '买入' || item.type === '卖出') {
                  // 直接尝试从原始描述中提取数量
                  let quantity = 0
                  
                  // 首先检查是否有现成的数量字段
                  if (item.quantity) {
                    quantity = item.quantity
                  } else {
                    // 从描述中提取股数信息
                    const descMatch = item.description && item.description.match(/(\d+)股/)
                    if (descMatch) {
                      quantity = parseInt(descMatch[1])
                    }
                  }
                  
                  const formattedQuantity = quantity.toLocaleString('zh-CN')
                  return `${item.type}${formattedQuantity}股`
                }
                
                // 手动记账类型：使用原有的描述
                if (item.type === '手动入账' || item.type === '手动出账') {
                  return item.description || '-';
                }
                
                // 其他情况返回原描述
                return item.description || '-';
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
                  <span className="font-medium">手动入账</span>
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
                  <span className="font-medium">手动出账</span>
                </div>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2"><span className="text-red-500">*</span> 记账金额</label>
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
            <label className="block text-sm text-gray-600 mb-2"><span className="text-red-500">*</span> 记账说明</label>
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
