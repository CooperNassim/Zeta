import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import ExcelJS from 'exceljs'
import { useToast } from '../contexts/ToastContext'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import OrderToolbar from '../components/OrderToolbar'
import OrderModal from '../components/OrderModal'
import ConfirmModal from '../components/ConfirmModal'
import ExportModal from '../components/ExportModal'
import ScoreButtons from '../components/ScoreButtons'
import FilterSelect from '../components/FilterSelect'
import CustomInput from '../components/CustomInput'
import ReadOnlyInput from '../components/ReadOnlyInput'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'


const OrderManagement = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [orderType, setOrderType] = useState('buy')
  const [evaluationStep, setEvaluationStep] = useState(0)
  const [evaluationResults, setEvaluationResults] = useState({})
  const [selectedFilter, setSelectedFilter] = useState('all')  // 默认显示全部订单
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])

  // 格式化数字：整数取整，有小数点保留2位，四舍五入，千位分隔符
  const formatAmount = (amount) => {
    if (!amount || amount === null || amount === undefined) return '-'
    const num = parseFloat(amount)
    if (isNaN(num)) return '-'
    const rounded = Math.round(num * 100) / 100
    const isInteger = Number.isInteger(rounded)
    const formatted = isInteger ? rounded.toLocaleString('en-US') : rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return formatted
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [symbolError, setSymbolError] = useState(false)
  // 第3步风险管控的错误状态
  const [riskErrors, setRiskErrors] = useState({
    availablePercent: false,
    price: false,
    stopLossPrice: false,
    takeProfitPrice: false
  })
  const pageSize = 20

  const orders = useStore(state => state.orders)
  const account = useStore(state => state.account)
  const psychologicalTests = useStore(state => state.psychologicalTests)
  const strategyRecords = useStore(state => state.strategyRecords)
  const riskModels = useStore(state => state.riskModels)
  const riskConfig = useStore(state => state.riskConfig)
  const accountRiskData = useStore(state => state.accountRiskData)
  const addOrder = useStore(state => state.addOrder)
  const executeOrder = useStore(state => state.executeOrder)
  const deleteMultipleOrders = useStore(state => state.deleteMultipleOrders)

  const [orderForm, setOrderForm] = useState({
    symbol: '',
    name: '',
    type: 'buy',
    price: '',
    stopLossPrice: '',
    takeProfitPrice: '',
    quantity: '',
    strategyId: '',
    riskModelId: '',
    strategyScores: {},
    psychologicalScores: {},
    isVirtual: false
  })

  const handleAddOrder = (type) => {
    setOrderType(type)
    setEvaluationStep(0)
    setEvaluationResults({})
    setSymbolError(false)

    // 如果是卖出订单,自动填充选中订单的信息
    let initialForm = {
      symbol: '',
      name: '',
      type,
      price: '',
      stopLossPrice: '',
      takeProfitPrice: '',
      quantity: '',
      strategyId: '',
      riskModelId: '',
      psychologicalScores: {},
      isVirtual: false,
      buyOrderId: null,
      tradeNumber: ''
    }

    // 卖出交易:从选中的买入订单获取信息
    if (type === 'sell') {
      console.log('[handleAddOrder] 选中订单IDs:', selectedIds)
      if (selectedIds.length === 1) {
        const selectedOrder = orders.find(order => order.id === selectedIds[0] && !order.deleted && order.type === 'buy')
        console.log('[handleAddOrder] 找到的买入订单:', selectedOrder)
        if (selectedOrder) {
          // 如果选中了买入订单，使用 buyOrderId 关联
          const buyQuantity = selectedOrder.quantity || 0
          const sellOrders = orders.filter(o =>
            !o.deleted &&
            o.type === 'sell' &&
            o.buyOrderId === selectedOrder.id
          )
          console.log('[handleAddOrder] 关联的卖出订单:', sellOrders)
          const soldQuantity = sellOrders.reduce((sum, o) => sum + (o.quantity || 0), 0)
          const availableQuantity = Math.max(0, buyQuantity - soldQuantity)
          console.log('[handleAddOrder] 计算结果:', { buyQuantity, soldQuantity, availableQuantity })

          initialForm = {
            ...initialForm,
            symbol: selectedOrder.symbol || '',
            name: selectedOrder.name || '',
            quantity: availableQuantity.toString(),
            buyOrderId: selectedOrder.id,
            tradeNumber: selectedOrder.tradeNumber || ''
          }
          console.log('[handleAddOrder] 设置的 initialForm:', initialForm)
        } else {
          // 如果选中了卖出订单，获取其交易编号
          const selectedSellOrder = orders.find(order => order.id === selectedIds[0] && !order.deleted && order.type === 'sell')
          if (selectedSellOrder) {
            // 基于交易编号计算可卖出数量
            const sameTradeOrders = orders.filter(o =>
              !o.deleted &&
              o.tradeNumber === selectedSellOrder.tradeNumber
            )

            const buyQuantity = sameTradeOrders
              .filter(o => o.type === 'buy')
              .reduce((sum, o) => sum + (o.quantity || 0), 0)

            // 卖出数量：只统计关联到未删除买入订单的卖出订单
            const activeBuyOrderIds = new Set(
              sameTradeOrders
                .filter(o => o.type === 'buy')
                .map(o => o.id)
            )

            const soldQuantity = sameTradeOrders
              .filter(o =>
                o.type === 'sell' &&
                (o.buyOrderId === null || activeBuyOrderIds.has(o.buyOrderId))
              )
              .reduce((sum, o) => sum + (o.quantity || 0), 0)

            const availableQuantity = Math.max(0, buyQuantity - soldQuantity)

            initialForm = {
              ...initialForm,
              symbol: selectedSellOrder.symbol || '',
              name: selectedSellOrder.name || '',
              quantity: availableQuantity.toString(),
              tradeNumber: selectedSellOrder.tradeNumber || ''
            }
          }
        }
      } else if (selectedIds.length > 1) {
        // 如果选中了多个订单，且它们都有相同的交易编号，使用该编号
        const selectedOrders = orders.filter(order =>
          selectedIds.includes(order.id) && !order.deleted
        )

        if (selectedOrders.length > 0) {
          const tradeNumbers = [...new Set(selectedOrders.map(o => o.tradeNumber))]
          if (tradeNumbers.length === 1) {
            // 所有选中的订单都有相同的交易编号
            const tradeNumber = tradeNumbers[0]
            const sameTradeOrders = orders.filter(o =>
              !o.deleted &&
              o.tradeNumber === tradeNumber
            )

            const buyQuantity = sameTradeOrders
              .filter(o => o.type === 'buy')
              .reduce((sum, o) => sum + (o.quantity || 0), 0)

            // 卖出数量：只统计关联到未删除买入订单的卖出订单
            const activeBuyOrderIds = new Set(
              sameTradeOrders
                .filter(o => o.type === 'buy')
                .map(o => o.id)
            )

            const soldQuantity = sameTradeOrders
              .filter(o =>
                o.type === 'sell' &&
                (o.buyOrderId === null || activeBuyOrderIds.has(o.buyOrderId))
              )
              .reduce((sum, o) => sum + (o.quantity || 0), 0)

            const availableQuantity = Math.max(0, buyQuantity - soldQuantity)

            initialForm = {
              ...initialForm,
              symbol: selectedOrders[0].symbol || '',
              name: selectedOrders[0].name || '',
              quantity: availableQuantity.toString(),
              tradeNumber
            }
          }
        }
      }
    }

    setOrderForm(initialForm)
    setShowModal(true)
  }

  const confirmDelete = () => {
    deleteMultipleOrders(selectedIds)
    setSelectedIds([])
    setShowDeleteModal(false)
    showToast('删除成功')
  }

  const handleExport = () => {
    setShowExportModal(true)
  }

  const confirmExport = async () => {
    const headers = [
      '交易编号',
      '交易类型',
      '股票代码',
      '股票名称',
      '交易价格',
      '交易数量',
      '止损价',
      '止盈价',
      '心理测试',
      '策略评估',
      '交易时间'
    ]

    const rows = filteredOrders.map(order => {
      const date = order.createdAt ? new Date(order.createdAt) : null
      const dateStr = date && !isNaN(date.getTime()) ? format(date, 'yyyy-MM-dd HH:mm:ss') : '-'

      return [
        order.tradeNumber || order.id?.toString() || '-',
        order.type === 'buy' ? '买入' : '卖出',
        order.symbol || '-',
        order.name || '-',
        order.price || '-',
        order.quantity || '-',
        order.type === 'buy' ? (order.stopLossPrice || '-') : '-',
        order.type === 'buy' ? (order.takeProfitPrice || '-') : '-',
        order.psychologicalScore !== undefined && order.psychologicalScore !== null ? order.psychologicalScore : '-',
        order.strategyScore !== undefined && order.strategyScore !== null ? order.strategyScore : '-',
        dateStr
      ]
    })

    if (exportFormat === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('股票交易记录')

      worksheet.columns = headers.map(header => ({
        header: header,
        key: header,
        width: 18
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
      a.download = `股票交易记录_${format(new Date(), 'yyyyMMdd')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `股票交易记录_${format(new Date(), 'yyyyMMdd')}.csv`
      link.click()
    }

    showToast('导出成功')
    setShowExportModal(false)
  }

  // 判断风险控制状态
  const getRiskControlStatus = () => {
    if (!evaluationResults.strategy?.score) return 'unknown'
    const scores = evaluationResults.strategy.scores || {}
    const hasZeroScore = Object.values(scores).some(s => s === 0)
    if (hasZeroScore) return 'zero'
    const strategyScore = evaluationResults.strategy.score
    if (strategyScore < 7) return 'fail'
    return 'pass'
  }

  // 当风险控制状态变化时，清除错误状态
  React.useEffect(() => {
    const riskStatus = getRiskControlStatus()
    if (riskStatus === 'zero' || riskStatus === 'fail') {
      setRiskErrors({
        availablePercent: false,
        price: false,
        stopLossPrice: false,
        takeProfitPrice: false
      })
      setSymbolError(false)
    }
  }, [evaluationResults.strategy, orderForm.strategyScores])

  // 获取当天的心理测试结果
  const getTodayPsychologicalTest = () => {
    if (psychologicalTests.length === 0) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return psychologicalTests.find(test => {
      if (!test.date) return false
      const testDate = new Date(test.date)
      testDate.setHours(0, 0, 0, 0)
      return testDate.getTime() === today.getTime()
    }) || null
  }

  // 判断当天是否有心理测试
  const hasTodayPsychologicalTest = () => {
    return getTodayPsychologicalTest() !== null
  }

  const handlePsychologicalEvaluation = () => {
    const todayTest = getTodayPsychologicalTest()

    if (!todayTest) {
      setToastType('error')
      setToastMessage('请先完成今天的心理测试')
      setShowToast(true)
      return false
    }

    const score = todayTest.overallScore > 10 ? todayTest.overallScore / 10 : todayTest.overallScore
    // 根据心理测试的分数判断是否可以交易
    let pass = false
    let status = ''
    if (score >= 5) {
      pass = true
      status = score >= 7 ? '可以交易' : '谨慎交易'
    } else {
      pass = false
      status = '禁止交易'
    }

    setEvaluationResults({
      ...evaluationResults,
      psychological: {
        pass,
        score: todayTest.overallScore,
        status
      }
    })

    if (!pass) {
      setToastType('error')
      setToastMessage(status)
      setShowToast(true)
      return false
    }

    setEvaluationStep(1)
    return true
  }

  const handleStrategyEvaluation = () => {
    const strategy = strategyRecords.find(s => s.id === orderForm.strategyId)
    if (!strategy) {
      setToastType('error')
      setToastMessage('请选择交易策略')
      setShowToast(true)
      return false
    }

    setEvaluationStep(2)
    return true
  }

  const handleRiskEvaluation = () => {
    // 检查是否所有评估标准都已评分
    const evalStandardKeys = ['evalStandard1', 'evalStandard2', 'evalStandard3', 'evalStandard4', 'evalStandard5']
    const allRated = evalStandardKeys.every(key =>
      orderForm.strategyScores.hasOwnProperty(key) &&
      orderForm.strategyScores[key] !== undefined
    )

    if (!allRated) {
      showToast('请完成所有评估标准', 'error')
      return false
    }

    // 计算策略评分（总分）
    const scores = orderForm.strategyScores
    let totalScore = 0
    evalStandardKeys.forEach(key => {
      const score = scores[key] || 0
      totalScore += score
    })

    // 保存评估结果
    setEvaluationResults({
      ...evaluationResults,
      strategy: {
        pass: true,
        score: totalScore,
        passScore: 10,
        scores
      }
    })

    setEvaluationStep(3)
    return true
  }

  // 计算可卖出数量（实时计算：同编号的买入交易数量-同编号卖出数量）
  const calculateAvailableQuantity = () => {
    // 优先使用 buyOrderId 关联，如果没有则使用 tradeNumber
    let buyQuantity = 0
    let soldQuantity = 0

    console.log('[calculateAvailableQuantity] orderForm:', { buyOrderId: orderForm.buyOrderId, tradeNumber: orderForm.tradeNumber })

    if (orderForm.buyOrderId) {
      // 方式1：通过 buyOrderId 关联（精确匹配某个买入订单）
      const buyOrder = orders.find(order => order.id === orderForm.buyOrderId && !order.deleted && order.type === 'buy')
      console.log('[calculateAvailableQuantity] 找到买入订单:', buyOrder)
      if (buyOrder) {
        buyQuantity = buyOrder.quantity || 0
        const sellOrders = orders.filter(o =>
          !o.deleted &&
          o.type === 'sell' &&
          o.buyOrderId === orderForm.buyOrderId
        )
        console.log('[calculateAvailableQuantity] 关联的卖出订单:', sellOrders)
        soldQuantity = sellOrders.reduce((sum, o) => sum + (o.quantity || 0), 0)
      }
    } else if (orderForm.tradeNumber) {
      // 方式2：通过 tradeNumber 关联（同一交易编号的所有订单）
      // 关键修复：只统计未删除的订单
      const sameTradeOrders = orders.filter(o =>
        !o.deleted &&
        o.tradeNumber === orderForm.tradeNumber
      )

      // 买入数量：只统计未删除的买入订单
      buyQuantity = sameTradeOrders
        .filter(o => o.type === 'buy')
        .reduce((sum, o) => sum + (o.quantity || 0), 0)

      // 卖出数量：只统计关联到未删除买入订单的卖出订单
      // 修复：如果卖出订单关联的买入订单已被删除,则不计入
      const activeBuyOrderIds = new Set(
        sameTradeOrders
          .filter(o => o.type === 'buy')
          .map(o => o.id)
      )

      soldQuantity = sameTradeOrders
        .filter(o =>
          o.type === 'sell' &&
          (o.buyOrderId === null || activeBuyOrderIds.has(o.buyOrderId))
        )
        .reduce((sum, o) => sum + (o.quantity || 0), 0)
    }

    return Math.max(0, buyQuantity - soldQuantity)
  }

  const handleSubmitOrder = (e) => {
    console.log('handleSubmitOrder被调用了')
    e.preventDefault()

    // 检查股票代码是否为空
    const isSymbolEmpty = !orderForm.symbol || orderForm.symbol.trim() === ''

    // 如果是买入订单，验证风险管控必填项
    if (orderType === 'buy') {
      // availablePercent可能使用默认值，所以检查是否有实际值（包括默认值）
      const hasAvailablePercent = orderForm.availablePercent || accountRiskData?.singleAvailable
      const newRiskErrors = {
        availablePercent: !hasAvailablePercent || hasAvailablePercent === '' || hasAvailablePercent === undefined || hasAvailablePercent === null,
        price: !orderForm.price || orderForm.price === '',
        stopLossPrice: !orderForm.stopLossPrice || orderForm.stopLossPrice === '',
        takeProfitPrice: !orderForm.takeProfitPrice || orderForm.takeProfitPrice === ''
      }

      // 设置股票代码错误
      setSymbolError(isSymbolEmpty)

      // 如果有错误，显示并返回
      if (isSymbolEmpty || Object.values(newRiskErrors).some(error => error)) {
        setRiskErrors(newRiskErrors)
        return
      }
    } else if (orderType === 'sell') {
      // 卖出订单，验证必填项
      const newRiskErrors = {
        price: !orderForm.price || orderForm.price === '',
        quantity: !orderForm.quantity || orderForm.quantity === ''
      }

      setSymbolError(isSymbolEmpty)

      if (isSymbolEmpty || Object.values(newRiskErrors).some(error => error)) {
        setRiskErrors(newRiskErrors)
        return
      }
    } else {
      // 非买入订单，只检查股票代码
      if (isSymbolEmpty) {
        setSymbolError(true)
        return
      }
    }

    // 将所有分数转换为10分制
    const psychologicalScore10 = evaluationResults.psychological.score > 10 ? evaluationResults.psychological.score / 10 : evaluationResults.psychological.score
    const strategyScore10 = evaluationResults.strategy.score
    const riskScore10 = 10

    const overallScore = (
      psychologicalScore10 * 0.3 +
      strategyScore10 * 0.4 +
      riskScore10 * 0.3
    ).toFixed(2)

    // 计算数量（买入自动计算，卖出手动输入并验证）
    const calculatedQuantity = orderType === 'buy'
      ? (orderForm.price ? Math.floor((accountRiskData?.startMonthTotal * (parseFloat(orderForm.availablePercent || accountRiskData?.singleAvailable || 0) / 100)) / parseFloat(orderForm.price) / 100) * 100 : 0)
      : (() => {
          const inputQuantity = parseInt(orderForm.quantity) || 0
          const maxQuantity = calculateAvailableQuantity()
          return Math.min(inputQuantity, maxQuantity)
        })()

    // 卖出订单需要关联买入订单
    let buyOrderId = null
    if (orderType === 'sell') {
      // 如果用户选择了要卖的持仓，则关联该买入订单
      buyOrderId = orderForm.buyOrderId || null
    }

    addOrder({
      ...orderForm,
      type: orderType,
      price: parseFloat(orderForm.price),
      stopLossPrice: orderType === 'buy' ? parseFloat(orderForm.stopLossPrice) : null,
      takeProfitPrice: orderType === 'buy' ? (orderForm.takeProfitPrice ? parseFloat(orderForm.takeProfitPrice) : null) : null,
      quantity: calculatedQuantity,
      psychologicalScore: parseFloat(psychologicalScore10),
      strategyScore: parseFloat(strategyScore10),
      riskScore: riskScore10,
      overallScore: parseFloat(overallScore),
      buyOrderId,  // 卖出订单关联的买入订单ID
      evaluationResults,
      isVirtual: orderForm.isVirtual || false  // 虚拟盘标记
    })

    setShowModal(false)
    showToast(orderType === 'sell' ? '卖出成功' : '买入成功')
  }

  // 持仓中：买入订单
  const holdingOrders = orders.filter(o => !o.deleted && o.type === 'buy')
  // 已卖出：卖出订单
  const soldOrders = orders.filter(o => !o.deleted && o.type === 'sell')

  // 筛选逻辑
  const filteredOrders = (() => {
    let baseOrders = []
    switch (selectedFilter) {
      case 'buy':
        baseOrders = orders.filter(o => !o.deleted && o.type === 'buy')  // 买入订单
        break
      case 'sell':
        baseOrders = orders.filter(o => !o.deleted && o.type === 'sell')  // 卖出订单
        break
      case 'all':
      default:
        baseOrders = orders.filter(o => !o.deleted)  // 全部订单，排除已删除的
        break
    }

    // 按交易编号分组，然后按每组最大日期降序排序
    // 1. 按交易编号分组
    const groupedMap = new Map()
    baseOrders.forEach(order => {
      const tradeNumber = order.tradeNumber || order.id?.toString()
      if (!groupedMap.has(tradeNumber)) {
        groupedMap.set(tradeNumber, [])
      }
      groupedMap.get(tradeNumber).push(order)
    })

    // 2. 计算每组（交易编号）的最大日期
    const groupWithMaxDate = Array.from(groupedMap.entries()).map(([tradeNumber, orderList]) => {
      const maxDate = orderList.reduce((max, order) => {
        const orderDate = new Date(order.createdAt || 0)
        return orderDate > max ? orderDate : max
      }, new Date(0))
      return { tradeNumber, maxDate, orderList }
    })

    // 3. 按最大日期降序排序
    groupWithMaxDate.sort((a, b) => b.maxDate - a.maxDate)

    // 4. 展平数组，保持组内顺序（按创建时间降序）
    const sortedOrders = groupWithMaxDate.flatMap(group => {
      return group.orderList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    })

    return sortedOrders
  })()

  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const paginatedData = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds([])
  }, [selectedFilter])

  // 当卖出交易的选择变化时,重新计算可卖出数量并填充（仅初始化或刚打开弹窗时）
  useEffect(() => {
    console.log('[useEffect] 触发计算可卖出数量:', { orderType, tradeNumber: orderForm.tradeNumber, buyOrderId: orderForm.buyOrderId, selectedIds })
    if (orderType === 'sell' && (orderForm.tradeNumber || orderForm.buyOrderId)) {
      // 只有当quantity为空或刚打开弹窗时才自动填充，避免覆盖用户输入
      if (orderForm.quantity === '' || orderForm.quantity === undefined || orderForm.quantity === null) {
        const availableQuantity = calculateAvailableQuantity()
        console.log('[useEffect] 初始化可卖出数量:', availableQuantity)

        // 计算出的可卖出数量默认填入卖出数量字段
        // 为0时显示0
        setOrderForm(prev => ({
          ...prev,
          quantity: availableQuantity.toString()
        }))
      }
    }
  }, [orderForm.tradeNumber, orderForm.buyOrderId, orderType, selectedIds])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '0px', paddingRight: '10px', position: 'relative', paddingBottom: '10px' }}>
      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* 筛选卡片 */}
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'flex-start', marginTop: '10px' }}>
          <div
            onClick={() => setSelectedFilter('all')}
            style={{
              background: '#ffffff',
              border: selectedFilter === 'all' ? '1px solid #0F1419' : '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px 25px',
              minHeight: '55px',
              width: '180px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div>
              <p className="text-sm mb-0" style={{ color: '#666' }}>全部交易</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {orders.length}
              </p>
            </div>
          </div>
          <div
            onClick={() => setSelectedFilter('buy')}
            style={{
              background: '#ffffff',
              border: selectedFilter === 'buy' ? '1px solid #0F1419' : '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px 25px',
              minHeight: '55px',
              width: '180px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div>
              <p className="text-sm mb-0" style={{ color: '#666' }}>买入交易</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {orders.filter(o => !o.deleted && o.type === 'buy').length}
              </p>
            </div>
          </div>
          <div
            onClick={() => setSelectedFilter('sell')}
            style={{
              background: '#ffffff',
              border: selectedFilter === 'sell' ? '1px solid #0F1419' : '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px 25px',
              minHeight: '55px',
              width: '180px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div>
              <p className="text-sm mb-0" style={{ color: '#666' }}>卖出交易</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {soldOrders.length}
              </p>
            </div>
          </div>
        </div>

        {/* 功能按钮区域 */}
        <OrderToolbar
          onAdd={() => handleAddOrder('buy')}
          onSell={() => handleAddOrder('sell')}
          onDelete={() => {
            if (selectedIds.length === 0) {
              alert('请选择要删除的订单')
              return
            }
            setShowDeleteModal(true)
          }}
          onExport={handleExport}
          canSell={(() => {
            // 卖出交易条件：
            // 1) 只能选择一个订单
            // 2) 选中的必须是买入类型的订单
            // 3) 订单不能是已删除的
            if (selectedIds.length !== 1) return false
            
            // 找到选中的订单
            const selectedOrder = orders.find(order => order.id === selectedIds[0] && !order.deleted)
            
            // 检查订单是否存在且是买入类型
            return selectedOrder && selectedOrder.type === 'buy'
          })()}
          canDelete={selectedIds.length > 0}
          canExport={filteredOrders.length > 0}
          totalCount={filteredOrders.length}
        />

        {/* 订单列表 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative',
          paddingBottom: '50px',
          zIndex: '1',
          background: 'rgb(249, 250, 251)'
        }}>
          <div className="overflow-y-auto overflow-x-auto" style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            zIndex: '1'
          }}>
          <DataTable
            fields={[
              { key: 'tradeNumber', label: '交易编号', width: '120px' },
              { key: 'type', label: '交易类型', width: '100px' },
              { key: 'symbol', label: '股票代码', width: '120px' },
              { key: 'name', label: '股票名称', width: '150px' },
              { key: 'price', label: '交易价格', width: '120px' },
              { key: 'quantity', label: '交易数量', width: '100px' },
              { key: 'stopLossPrice', label: '止损价', width: '120px' },
              { key: 'takeProfitPrice', label: '止盈价', width: '120px' },
              { key: 'psychologicalScore', label: '心理测试', width: '100px' },
              { key: 'strategyScore', label: '策略评估', width: '100px' },
              { key: 'createdAt', label: '交易时间', width: '200px' }
            ]}
            data={paginatedData}
            selectedIds={selectedIds}
            onSelectAll={(ids) => setSelectedIds(ids)}
            onSelectOne={(id, checked) => {
              if (checked) {
                setSelectedIds([...selectedIds, id])
              } else {
                setSelectedIds(selectedIds.filter(id => id !== id))
              }
            }}
            renderCell={(field, item) => {
              if (field.key === 'type') {
                return item.type === 'buy' ? '买入' : '卖出'
              }
              if (field.key === 'createdAt') {
                const date = item.createdAt ? new Date(item.createdAt) : null
                return date && !isNaN(date.getTime()) ? format(date, 'yyyy-MM-dd HH:mm:ss') : '-'
              }
              if (field.key === 'stopLossPrice' || field.key === 'takeProfitPrice') {
                // 只有买入订单显示止损止盈
                return item.type === 'buy' ? (item[field.key] || '-') : '-'
              }
              if (field.key === 'psychologicalScore') {
                // 显示心理测试分数（10分制）
                return item.psychologicalScore !== undefined && item.psychologicalScore !== null ? item.psychologicalScore : '-'
              }
              if (field.key === 'strategyScore') {
                // 显示策略评估分数（10分制）
                return item.strategyScore !== undefined && item.strategyScore !== null ? item.strategyScore : '-'
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

        {/* 分页器 */}
        <div style={{ position: 'absolute', right: '0', bottom: '0', height: '50px', zIndex: '10', width: '100%' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            selectedCount={selectedIds.length}
            totalCount={filteredOrders.length}
          />
        </div>
      </div>

      {/* 创建预约单弹窗 */}
      <OrderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={orderType === 'buy' ? '买入交易' : '卖出交易'}
      >
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center mb-6">
              {[0, 1, 2].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step === evaluationStep
                      ? 'bg-[#0F1419] text-white'
                      : step < evaluationStep
                      ? 'bg-gray-400 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step + 1}
                  </div>
                  <div className="flex-1 h-[1px] mx-2 bg-gray-300" />
                </div>
              ))}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                3 === evaluationStep
                  ? 'bg-[#0F1419] text-white'
                  : 3 < evaluationStep
                  ? 'bg-gray-400 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                4
              </div>
            </div>

            {/* 步骤内容 */}
            {evaluationStep === 0 && (
              <div>
                <p className="text-gray-600 mb-2">交易心理测试</p>
                <div className="p-4 bg-white rounded-lg border border-gray-200 mb-4">
                  <p className="text-sm text-gray-600">测试结果</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {(() => {
                        const todayTest = getTodayPsychologicalTest()
                        if (!todayTest) return '未测试'
                        return todayTest.overallScore > 10 ? Math.round(todayTest.overallScore / 10) : Math.round(todayTest.overallScore)
                      })()}
                    </span>
                    <span className={`px-3 py-1 rounded text-sm ${
                      (() => {
                        const todayTest = getTodayPsychologicalTest()
                        if (!todayTest) return 'bg-gray-500/20 text-gray-600'
                        const score = todayTest.overallScore > 10 ? todayTest.overallScore / 10 : todayTest.overallScore
                        if (score >= 7 && score <= 8) return 'bg-green-500/20 text-green-600'
                        if ((score >= 5 && score <= 6) || (score >= 9 && score <= 10)) return 'bg-yellow-500/20 text-yellow-600'
                        return 'bg-red-500/20 text-red-600'
                      })()
                    }`}>
                      {(() => {
                        const todayTest = getTodayPsychologicalTest()
                        if (!todayTest) return '未测试'
                        const score = todayTest.overallScore > 10 ? todayTest.overallScore / 10 : todayTest.overallScore
                        if (score >= 7 && score <= 8) return '可以交易'
                        if ((score >= 5 && score <= 6) || (score >= 9 && score <= 10)) return '谨慎交易'
                        return '禁止交易'
                      })()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => hasTodayPsychologicalTest() ? handlePsychologicalEvaluation() : navigate('/psychological-test')}
                    className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity text-sm"
                    style={{ backgroundColor: '#0F1419' }}
                  >
                    {hasTodayPsychologicalTest() ? '下一步' : '去测试'}
                  </button>
                </div>
              </div>
            )}

            {evaluationStep === 1 && (
              <div>
                <p className="text-gray-600 mb-2">选择交易策略</p>
                <div className="mb-4 overflow-auto" style={{ maxHeight: '400px' }}>
                  {strategyRecords
                    .filter(record => record.status === '启用' && record.strategyType === (orderType === 'buy' ? '买入' : '卖出')).length === 0 ? (
                    <EmptyState message="暂无数据" height="200px" containerStyle={{ marginLeft: '0' }} />
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {strategyRecords
                        .filter(record => record.status === '启用' && record.strategyType === (orderType === 'buy' ? '买入' : '卖出'))
                        .map((record) => (
                          <div
                            key={record.id}
                            onClick={() => setOrderForm({ ...orderForm, strategyId: record.id, strategyScores: {} })}
                            className={`p-4 rounded-lg cursor-pointer border ${
                              orderForm.strategyId === record.id
                                ? 'bg-[#0F1419] border-[#0F1419]'
                                : 'border-gray-200 hover:border-gray-900 bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`font-bold mb-1 ${orderForm.strategyId === record.id ? 'text-white' : 'text-gray-900'}`}>{record.name}</h4>
                                <p className={`text-xs ${orderForm.strategyId === record.id ? 'text-gray-300' : 'text-gray-500'}`}>{record.revisionVersion || '-'}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${orderForm.strategyId === record.id ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'}`}>
                                {record.strategyType}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEvaluationStep(0)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm"
                  >
                    上一步
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleStrategyEvaluation}
                    className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity text-sm"
                    style={{ backgroundColor: '#0F1419' }}
                  >
                    下一步
                  </button>
                </div>
              </div>
            )}

            {evaluationStep === 2 && (
              <div>
                <p className="text-gray-600 mb-2">客观评估标准化</p>
                {(() => {
                  const selectedStrategy = strategyRecords.find(s => s.id === orderForm.strategyId)
                  const evalStandards = [
                    { key: 'evalStandard1', label: '评估标准Ⅰ' },
                    { key: 'evalStandard2', label: '评估标准Ⅱ' },
                    { key: 'evalStandard3', label: '评估标准Ⅲ' },
                    { key: 'evalStandard4', label: '评估标准Ⅳ' },
                    { key: 'evalStandard5', label: '评估标准Ⅴ' },
                  ]
                  return (
                    <div className="space-y-2 overflow-auto" style={{ maxHeight: '400px' }}>
                        {evalStandards.map((standard, index) => {
                          const content = selectedStrategy?.[standard.key] || ''
                          const [name, description] = content.split('：')
                          return (
                            <div key={standard.key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <p className="font-medium text-gray-900 mb-3">
                                {standard.label}：{name || standard.label}
                              </p>
                              {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
                              <ScoreButtons
                                selectedScore={orderForm.strategyScores[standard.key]}
                                onChange={(score) => {
                                  setOrderForm({
                                    ...orderForm,
                                    strategyScores: {
                                      ...orderForm.strategyScores,
                                      [standard.key]: score
                                    }
                                  })
                                }}
                                name={`condition-${standard.key}`}
                              />
                            </div>
                          )
                        })}
                    </div>
                  )
                })()}

                <div className="flex gap-2 justify-end" style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => setEvaluationStep(1)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm"
                  >
                    上一步
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleRiskEvaluation}
                    className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity text-sm"
                    style={{ backgroundColor: '#0F1419' }}
                  >
                    下一步
                  </button>
                </div>
              </div>
            )}

            {evaluationStep === 3 && (
              <div>
                <p className="text-gray-600 mb-2">填写买入信息</p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' || orderType === 'sell') && <span className="text-red-500">*</span>} 股票代码
                      </label>
                      {orderType === 'sell' ? (
                        <ReadOnlyInput
                          value={orderForm.symbol || ''}
                          placeholder=""
                        />
                      ) : (
                        <>
                          <CustomInput
                            type="text"
                            value={orderForm.symbol || ''}
                            onChange={(value) => {
                              setOrderForm({ ...orderForm, symbol: value })
                              setSymbolError(false)
                              // TODO: 根据股票代码查询股票名称
                            }}
                            placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '请输入'}
                            error={symbolError && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail')}
                            disabled={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail'}
                          />
                          {symbolError && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && (
                            <ErrorMessage message="不能为空" showIcon={true} />
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        股票名称
                      </label>
                      <ReadOnlyInput
                        value={orderForm.name || ''}
                        placeholder={orderType === 'sell' ? '' : (getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '自动获取')}
                      />
                    </div>

                  {orderType === 'buy' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <span className="text-red-500">*</span>} 可用比例(%)
                        </label>
                        <CustomInput
                          type="number"
                          step="0.01"
                          value={orderForm.availablePercent || accountRiskData?.singleAvailable}
                          onChange={(value) => {
                            setOrderForm({ ...orderForm, availablePercent: value })
                            if (riskErrors.availablePercent) {
                              setRiskErrors({ ...riskErrors, availablePercent: false })
                            }
                          }}
                          placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '请输入'}
                          error={riskErrors.availablePercent && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail')}
                          disabled={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail'}
                        />
                        {riskErrors.availablePercent && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <ErrorMessage message="不能为空" />}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          可用额度
                        </label>
                        <ReadOnlyInput
                          value={formatAmount(accountRiskData?.startMonthTotal * (parseFloat(orderForm.availablePercent || accountRiskData?.singleAvailable || 0) / 100))}
                          placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '自动计算'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <span className="text-red-500">*</span>} 买入价格
                        </label>
                        <CustomInput
                          type="number"
                          step="0.01"
                          value={orderForm.price || ''}
                          onChange={(value) => {
                            setOrderForm({ ...orderForm, price: value })
                            if (riskErrors.price) {
                              setRiskErrors({ ...riskErrors, price: false })
                            }
                          }}
                          placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '请输入'}
                          error={riskErrors.price && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail')}
                          disabled={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail'}
                        />
                        {riskErrors.price && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <ErrorMessage message="不能为空" />}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          买入数量
                        </label>
                        <ReadOnlyInput
                          value={orderForm.price ? Math.floor((accountRiskData?.startMonthTotal * (parseFloat(orderForm.availablePercent || accountRiskData?.singleAvailable || 0) / 100)) / parseFloat(orderForm.price) / 100) * 100 : ''}
                          placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '自动计算'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <span className="text-red-500">*</span>} 止损价
                        </label>
                        <CustomInput
                          type="number"
                          step="0.01"
                          value={orderForm.stopLossPrice || ''}
                          onChange={(value) => {
                            setOrderForm({ ...orderForm, stopLossPrice: value })
                            if (riskErrors.stopLossPrice) {
                              setRiskErrors({ ...riskErrors, stopLossPrice: false })
                            }
                          }}
                          placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '请输入'}
                          error={riskErrors.stopLossPrice && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail')}
                          disabled={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail'}
                        />
                        {riskErrors.stopLossPrice && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <ErrorMessage message="不能为空" />}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <span className="text-red-500">*</span>} 止盈价
                        </label>
                        <CustomInput
                          type="number"
                          step="0.01"
                          value={orderForm.takeProfitPrice || ''}
                          onChange={(value) => {
                            setOrderForm({ ...orderForm, takeProfitPrice: value })
                            if (riskErrors.takeProfitPrice) {
                              setRiskErrors({ ...riskErrors, takeProfitPrice: false })
                            }
                          }}
                          placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '请输入'}
                          error={riskErrors.takeProfitPrice && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail')}
                          disabled={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail'}
                        />
                        {riskErrors.takeProfitPrice && !(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <ErrorMessage message="不能为空" />}
                      </div>
                    </>
                  )}

                  {orderType === 'sell' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="text-red-500">*</span> 卖出价格
                        </label>
                        <CustomInput
                          type="number"
                          step="0.01"
                          value={orderForm.price || ''}
                          onChange={(value) => {
                            setOrderForm({ ...orderForm, price: value })
                            if (riskErrors.price) {
                              setRiskErrors({ ...riskErrors, price: false })
                            }
                          }}
                          placeholder="请输入"
                          error={riskErrors.price}
                        />
                        {riskErrors.price && <ErrorMessage message="不能为空" />}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="text-red-500">*</span> 卖出数量
                        </label>
                        <CustomInput
                          type="number"
                          step="1"
                          value={orderForm.quantity ?? ''}
                          onChange={(value) => {
                            // 验证并限制数量不超过最大可卖出数量
                            const maxQuantity = calculateAvailableQuantity()
                            const inputQuantity = parseInt(value) || 0

                            // 如果输入的数量超过最大值,自动设为最大值
                            // 如果为0,显示0
                            let clampedQuantity = inputQuantity
                            if (inputQuantity > maxQuantity) {
                              clampedQuantity = maxQuantity
                            }
                            if (inputQuantity < 0) {
                              clampedQuantity = 0
                            }

                            setOrderForm(prev => ({
                              ...prev,
                              quantity: clampedQuantity.toString()
                            }))
                            if (riskErrors.quantity) {
                              setRiskErrors({ ...riskErrors, quantity: false })
                            }
                          }}
                          onBlur={() => {
                            // 失去焦点时,如果为空或0,保持为0显示
                            const currentQuantity = parseInt(orderForm.quantity) || 0
                            setOrderForm(prev => ({
                              ...prev,
                              quantity: currentQuantity.toString()
                            }))
                          }}
                          placeholder={`可卖出: ${calculateAvailableQuantity()}`}
                          error={riskErrors.quantity}
                        />
                        {riskErrors.quantity && <ErrorMessage message="不能为空" />}
                      </div>
                    </>
                  )}
                </div>

                <form onSubmit={handleSubmitOrder}>
                  {/* 评估结果摘要 */}
                  <div className="bg-white rounded-lg border border-gray-200" style={{ marginTop: '10px', marginBottom: '10px', padding: '10px 0' }}>
                    <div className="grid grid-cols-3 gap-2">
                      <div style={{ textAlign: 'center' }}>
                        <p className="text-gray-600" style={{ fontSize: '14px', margin: '0 0 4px 0' }}>心理测试</p>
                        <p className="font-bold text-gray-900" style={{ fontSize: '14px', margin: '0' }}>{evaluationResults.psychological?.score !== undefined ? Math.round(evaluationResults.psychological.score) : '-'}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p className="text-gray-600" style={{ fontSize: '14px', margin: '0 0 4px 0' }}>策略评估</p>
                        <p className="font-bold text-gray-900" style={{ fontSize: '14px', margin: '0' }}>{evaluationResults.strategy?.score !== undefined ? Math.round(evaluationResults.strategy.score) : '-'}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p className="text-gray-600" style={{ fontSize: '14px', margin: '0 0 4px 0' }}>风险控制</p>
                        <p style={{
                          fontSize: '14px',
                          margin: '0',
                          color: (() => {
                            const status = getRiskControlStatus()
                            if (status === 'unknown') return '#1f2937'
                            if (status === 'zero' || status === 'fail') return '#ef4444'
                            return '#22c55e'
                          })()
                        }}>
                          {(() => {
                            const status = getRiskControlStatus()
                            if (status === 'unknown') return '-'
                            if (status === 'zero') return '单项为0'
                            if (status === 'fail') return '不通过'
                            return '通过'
                        })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between" style={{ marginTop: '8px' }}>
                    {/* 虚拟盘勾选 */}
                    <div>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={orderForm.isVirtual || false}
                          onChange={(e) => setOrderForm({ ...orderForm, isVirtual: e.target.checked })}
                          className="w-4 h-4 text-[#0F1419] border-gray-300 rounded focus:ring-[#0F1419]"
                        />
                        <span className="text-xs font-medium text-gray-700">虚拟盘</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">勾选后记录到虚拟账单</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEvaluationStep(2)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm"
                      >
                        上一步
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm"
                      >
                        取消
                      </button>
                      {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && (
                        <button
                          type="submit"
                          className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#0F1419' }}
                          disabled={orderType === 'sell' && (!orderForm.quantity || parseInt(orderForm.quantity) <= 0)}
                        >
                          {orderType === 'sell' ? '卖出' : '买入'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            )}
      </OrderModal>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="删除"
        message={`确认删除${selectedIds.length}条数据吗？`}
      />
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={confirmExport}
        exportFormat={exportFormat}
        onFormatChange={setExportFormat}
        totalCount={filteredOrders.length}
      />
      </div>
    </div>
  )
}

export default OrderManagement
