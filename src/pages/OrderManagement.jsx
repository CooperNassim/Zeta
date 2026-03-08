import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import OrderToolbar from '../components/OrderToolbar'
import OrderModal from '../components/OrderModal'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import ExportModal from '../components/ExportModal'
import ScoreButtons from '../components/ScoreButtons'
import FilterSelect from '../components/FilterSelect'
import CustomInput from '../components/CustomInput'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'


const OrderManagement = () => {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [orderType, setOrderType] = useState('buy')
  const [evaluationStep, setEvaluationStep] = useState(0)
  const [evaluationResults, setEvaluationResults] = useState({})
  const [selectedFilter, setSelectedFilter] = useState('executed')  // 默认显示持仓中
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState('success')
  const [toastMessage, setToastMessage] = useState('')
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
  const cancelOrder = useStore(state => state.cancelOrder)
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
    setOrderForm({
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
      isVirtual: false
    })
    setShowModal(true)
  }

  const confirmDelete = () => {
    deleteMultipleOrders(selectedIds)
    setSelectedIds([])
    setShowDeleteModal(false)
    setToastType('success')
    setToastMessage('删除成功')
    setShowToast(true)
  }

  const handleExport = () => {
    setShowExportModal(true)
  }

  const confirmExport = () => {
    // 这里可以添加实际的导出逻辑
    console.log('导出格式:', exportFormat, '导出数据:', filteredOrders)
    setShowExportModal(false)
    setToastType('success')
    setToastMessage('导出成功')
    setShowToast(true)
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

  // 判断当天是否有心理测试
  const hasTodayPsychologicalTest = () => {
    if (psychologicalTests.length === 0) return false
    const latestTest = psychologicalTests[psychologicalTests.length - 1]
    if (!latestTest.date) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const testDate = new Date(latestTest.date)
    testDate.setHours(0, 0, 0, 0)
    return testDate.getTime() === today.getTime()
  }

  const handlePsychologicalEvaluation = () => {
    const latestTest = psychologicalTests[psychologicalTests.length - 1]
    if (!latestTest) {
      setToastType('error')
      setToastMessage('请先完成心理测试')
      setShowToast(true)
      return false
    }

    const score = latestTest.overallScore > 10 ? latestTest.overallScore / 10 : latestTest.overallScore
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
        score: latestTest.overallScore,
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
      setToastType('error')
      setToastMessage('请完成所有评估标准')
      setShowToast(true)
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

    // 计算数量（买入自动计算，卖出手动输入）
    const calculatedQuantity = orderType === 'buy'
      ? (orderForm.price ? Math.floor((accountRiskData?.startMonthTotal * (parseFloat(orderForm.availablePercent || accountRiskData?.singleAvailable || 0) / 100)) / parseFloat(orderForm.price) / 100) * 100 : 0)
      : (orderForm.quantity ? parseInt(orderForm.quantity) : 0)

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
      status: 'pending',  // 创建时为待执行状态
      buyOrderId,  // 卖出订单关联的买入订单ID
      evaluationResults,
      isVirtual: orderForm.isVirtual || false  // 虚拟盘标记
    })

    setShowModal(false)
    setToastType('success')
    setToastMessage('预约成功')
    setShowToast(true)
  }

  // 计算各状态订单数量
  const pendingOrders = orders.filter(o => !o.deleted && o.status === 'pending')
  const executedOrders = orders.filter(o => !o.deleted && o.status === 'executed')
  const cancelledOrders = orders.filter(o => !o.deleted && o.status === 'cancelled')

  // 持仓中：已执行的买入订单
  const holdingOrders = orders.filter(o => !o.deleted && o.type === 'buy' && o.status === 'executed')
  // 已卖出：已执行的卖出订单
  const soldOrders = orders.filter(o => !o.deleted && o.type === 'sell' && o.status === 'executed')
  // 待执行：pending状态的订单
  const pendingCount = orders.filter(o => !o.deleted && o.status === 'pending').length

  // 筛选逻辑
  const filteredOrders = (() => {
    switch (selectedFilter) {
      case 'executed':
        return holdingOrders  // 持仓中
      case 'sell':
        return soldOrders  // 已卖出
      case 'cancelled':
        return cancelledOrders  // 作废订单
      case 'pending':
        return pendingOrders  // 待执行
      case 'all':
      default:
        return orders.filter(o => !o.deleted)  // 全部订单，排除已删除的
    }
  })()

  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const paginatedData = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds([])
  }, [selectedFilter])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px', position: 'relative', paddingBottom: '10px' }}>
      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* 筛选卡片 */}
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'flex-start', marginTop: '10px' }}>
          <div
            onClick={() => setSelectedFilter('pending')}
            style={{
              background: '#ffffff',
              border: selectedFilter === 'pending' ? '1px solid #0F1419' : '1px solid #e5e7eb',
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
              <p className="text-sm mb-0" style={{ color: '#666' }}>待执行</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {pendingCount}
              </p>
            </div>
          </div>
          <div
            onClick={() => setSelectedFilter('executed')}
            style={{
              background: '#ffffff',
              border: selectedFilter === 'executed' ? '1px solid #0F1419' : '1px solid #e5e7eb',
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
              <p className="text-sm mb-0" style={{ color: '#666' }}>持仓中</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {holdingOrders.length}
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
              <p className="text-sm mb-0" style={{ color: '#666' }}>已卖出</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {soldOrders.length}
              </p>
            </div>
          </div>
          <div
            onClick={() => setSelectedFilter('cancelled')}
            style={{
              background: '#ffffff',
              border: selectedFilter === 'cancelled' ? '1px solid #0F1419' : '1px solid #e5e7eb',
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
              <p className="text-sm mb-0" style={{ color: '#666' }}>作废订单</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {cancelledOrders.length}
              </p>
            </div>
          </div>
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
              <p className="text-sm mb-0" style={{ color: '#666' }}>全部订单</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {orders.length}
              </p>
            </div>
          </div>
        </div>

        {/* 功能按钮区域 */}
        <OrderToolbar
          onAdd={() => handleAddOrder('buy')}
          onSell={() => handleAddOrder('sell')}
          onCancel={() => {
            if (selectedIds.length === 0) {
              alert('请选择要作废的订单')
              return
            }
            // 所有订单都可以作废，包括已作废的订单
            const ordersToCancel = selectedIds.map(id => orders.find(o => o.id === id)).filter(Boolean)

            ordersToCancel.forEach(order => {
              // 只有待执行或已执行的订单才更新状态为cancelled
              if (order.status === 'pending' || order.status === 'executed') {
                cancelOrder(order.id)
              }
              // 已作废的订单状态不变，不做处理
            })

            setSelectedIds([])
            setToastType('success')
            setToastMessage('作废成功')
            setShowToast(true)
          }}
          onDelete={() => {
            if (selectedIds.length === 0) {
              alert('请选择要删除的订单')
              return
            }
            setShowDeleteModal(true)
          }}
          onExport={handleExport}
          canSell={selectedIds.length > 0}
          canCancel={selectedIds.length > 0}
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
            zIndex: '1',
            overflowY: 'scroll',
            scrollbarGutter: 'stable'
          }}>
          <DataTable
            fields={[
              { key: 'type', label: '订单类型', width: '100px' },
              { key: 'symbol', label: '资产代码', width: '120px' },
              { key: 'name', label: '资产名称', width: '150px' },
              { key: 'status', label: '状态', width: '100px' },
              { key: 'price', label: '价格', width: '120px' },
              { key: 'quantity', label: '数量', width: '100px' },
              { key: 'stopLossPrice', label: '止损价', width: '120px' },
              { key: 'takeProfitPrice', label: '止盈价', width: '120px' },
              { key: 'availablePercent', label: '可用比例', width: '120px' },
              { key: 'createdAt', label: '创建时间', width: '200px' }
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
              if (field.key === 'status') {
                const statusMap = {
                  'pending': { text: '待执行' },
                  'executed': { text: '已执行' },
                  'cancelled': { text: '作废' }
                }
                const status = statusMap[item.status]
                return <span>{status.text}</span>
              }
              if (field.key === 'createdAt') {
                return format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')
              }
              if (field.key === 'stopLossPrice' || field.key === 'takeProfitPrice') {
                // 只有买入订单显示止损止盈
                return item.type === 'buy' ? (item[field.key] || '-') : '-'
              }
              if (field.key === 'availablePercent') {
                // 只有买入订单显示可用比例
                return item.type === 'buy' ? (item[field.key] || '-') : '-'
              }
              return null
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
        title={orderType === 'buy' ? '买入预约单' : '卖出预约单'}
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
                      {psychologicalTests.length > 0 ? (psychologicalTests[psychologicalTests.length - 1].overallScore > 10 ? Math.round(psychologicalTests[psychologicalTests.length - 1].overallScore / 10) : Math.round(psychologicalTests[psychologicalTests.length - 1].overallScore)) : '未测试'}
                    </span>
                    <span className={`px-3 py-1 rounded text-sm ${
                      (() => {
                        if (psychologicalTests.length === 0) return 'bg-gray-500/20 text-gray-600'
                        const score = psychologicalTests[psychologicalTests.length - 1].overallScore > 10 ? psychologicalTests[psychologicalTests.length - 1].overallScore / 10 : psychologicalTests[psychologicalTests.length - 1].overallScore
                        if (score >= 7 && score <= 8) return 'bg-green-500/20 text-green-600'
                        if ((score >= 5 && score <= 6) || (score >= 9 && score <= 10)) return 'bg-yellow-500/20 text-yellow-600'
                        return 'bg-red-500/20 text-red-600'
                      })()
                    }`}>
                      {(() => {
                        if (psychologicalTests.length === 0) return '未测试'
                        const score = psychologicalTests[psychologicalTests.length - 1].overallScore > 10 ? psychologicalTests[psychologicalTests.length - 1].overallScore / 10 : psychologicalTests[psychologicalTests.length - 1].overallScore
                        if (score >= 7 && score <= 8) return '可以交易'
                        if ((score >= 5 && score <= 6) || (score >= 9 && score <= 10)) return '谨慎交易'
                        return '禁止交易'
                      })()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => hasTodayPsychologicalTest() ? handlePsychologicalEvaluation() : navigate('/psychological-test')}
                    className="px-4 py-2 bg-[#0F1419] border border-[#0F1419] rounded text-white font-medium hover:opacity-90 transition-opacity"
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
                            className={`p-4 rounded-lg cursor-pointer transition-all ${
                              orderForm.strategyId === record.id
                                ? 'bg-[#0F1419]'
                                : 'border border-gray-200 hover:border-gray-900 bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`font-bold mb-1 ${orderForm.strategyId === record.id ? 'text-white' : 'text-gray-900'}`}>{record.name}</h4>
                                <p className={`text-xs ${orderForm.strategyId === record.id ? 'text-gray-300' : 'text-gray-500'}`}>{record._id || '-'}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${orderForm.strategyId === record.id ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'}`}>
                                {record.strategyType}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setEvaluationStep(0)}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    上一步
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleStrategyEvaluation}
                    className="px-4 py-2 bg-[#0F1419] border border-[#0F1419] rounded text-white font-medium hover:opacity-90 transition-opacity"
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

                <div className="flex gap-3 justify-end" style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => setEvaluationStep(1)}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    上一步
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleRiskEvaluation}
                    className="px-4 py-2 bg-[#0F1419] border border-[#0F1419] rounded text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    下一步
                  </button>
                </div>
              </div>
            )}

            {evaluationStep === 3 && (
              <div>
                <p className="text-gray-600 mb-2">填写订单信息</p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <span className="text-red-500">*</span>} 股票代码
                      </label>
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
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        股票名称
                      </label>
                      <CustomInput
                        type="text"
                        value={orderForm.name || ''}
                        onChange={(value) => setOrderForm({ ...orderForm, name: value })}
                        placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '自动获取'}
                        disabled
                      />
                    </div>

                    {/* 虚拟盘勾选 */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={orderForm.isVirtual || false}
                          onChange={(e) => setOrderForm({ ...orderForm, isVirtual: e.target.checked })}
                          className="w-4 h-4 text-[#0F1419] border-gray-300 rounded focus:ring-[#0F1419]"
                        />
                        <span className="text-sm font-medium text-gray-700">虚拟盘</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">勾选后该订单将记录到虚拟账户</p>
                    </div>


                  {orderType === 'buy' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          可用额度(元)
                        </label>
                        <CustomInput
                          type="number"
                          step="0.01"
                          value={(accountRiskData?.startMonthTotal * (parseFloat(orderForm.availablePercent || accountRiskData?.singleAvailable || 0) / 100)).toFixed(2)}
                          disabled
                          placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '自动计算'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <span className="text-red-500">*</span>} 预买入价(元)
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          可买数量(股)
                        </label>
                        <CustomInput
                          type="number"
                          step="1"
                          value={orderForm.price ? Math.floor((accountRiskData?.startMonthTotal * (parseFloat(orderForm.availablePercent || accountRiskData?.singleAvailable || 0) / 100)) / parseFloat(orderForm.price) / 100) * 100 : ''}
                          disabled
                          placeholder={getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail' ? '' : '自动计算'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <span className="text-red-500">*</span>} 止损价(元)
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && <span className="text-red-500">*</span>} 止盈价(元)
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
                </div>

                <form onSubmit={handleSubmitOrder}>
                  {/* 评估结果摘要 */}
                  <div className="p-4 bg-white rounded-lg border border-gray-200" style={{ marginTop: '10px' }}>
                    <h4 className="font-bold text-gray-900 mb-2">评估结果</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">心理测试</p>
                        <p className="font-bold text-gray-900">{evaluationResults.psychological?.score !== undefined ? Math.round(evaluationResults.psychological.score) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">策略评估</p>
                        <p className="font-bold text-gray-900">{evaluationResults.strategy?.score !== undefined ? Math.round(evaluationResults.strategy.score) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">风险控制</p>
                        <p className="font-bold" style={(() => {
                          const status = getRiskControlStatus()
                          if (status === 'unknown') return { color: '#1f2937' }
                          if (status === 'zero' || status === 'fail') {
                            return { color: '#ef4444' }
                          }
                          return { color: '#22c55e' }
                        })()}>
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

                  <div className="flex gap-3 justify-end" style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setEvaluationStep(2)}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      上一步
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    {!(getRiskControlStatus() === 'zero' || getRiskControlStatus() === 'fail') && (
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#0F1419] border border-[#0F1419] rounded text-white font-medium hover:opacity-90 transition-opacity"
                      >
                        确认创建
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
      </OrderModal>
      {showToast && <Toast type={toastType} message={toastMessage} onClose={() => setShowToast(false)} />}
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
