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

const OrderManagement = () => {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [orderType, setOrderType] = useState('buy')
  const [evaluationStep, setEvaluationStep] = useState(0)
  const [evaluationResults, setEvaluationResults] = useState({})
  const [selectedFilter, setSelectedFilter] = useState('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState('success')
  const [toastMessage, setToastMessage] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const pageSize = 20

  const orders = useStore(state => state.orders)
  const account = useStore(state => state.account)
  const psychologicalTests = useStore(state => state.psychologicalTests)
  const strategies = useStore(state => state.strategies)
  const riskModels = useStore(state => state.riskModels)
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
    psychologicalScores: {}
  })

  const handleAddOrder = (type) => {
    setOrderType(type)
    setEvaluationStep(0)
    setEvaluationResults({})
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
      psychologicalScores: {}
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
    const strategy = strategies[orderType].find(s => s.id === orderForm.strategyId)
    if (!strategy) {
      alert('请选择交易策略')
      return false
    }

    // 模拟策略评分
    const scores = {}
    let totalScore = 0
    strategy.conditions.forEach(condition => {
      scores[condition.id] = Math.floor(Math.random() * 30) + 70
      totalScore += scores[condition.id] * condition.weight
    })

    const pass = totalScore >= strategy.passScore

    setEvaluationResults({
      ...evaluationResults,
      strategy: {
        pass,
        score: totalScore.toFixed(2),
        passScore: strategy.passScore,
        scores
      }
    })

    if (!pass) {
      alert('策略评估未通过，无法创建订单')
      return false
    }

    setEvaluationStep(2)
    return true
  }

  const handleRiskEvaluation = () => {
    const riskModel = riskModels.find(r => r.id === orderForm.riskModelId)
    if (!riskModel) {
      alert('请选择风险模型')
      return false
    }

    const price = parseFloat(orderForm.price)
    const stopLossPrice = parseFloat(orderForm.stopLossPrice)
    const maxLoss = account.balance * (riskModel.maxLossPercent / 100)
    const maxQuantity = Math.floor(maxLoss / (price - stopLossPrice))

    const pass = true // 风险模型通过

    setEvaluationResults({
      ...evaluationResults,
      risk: {
        pass,
        maxLoss,
        maxQuantity,
        riskModel
      }
    })

    setEvaluationStep(3)
    return true
  }

  const handleSubmitOrder = (e) => {
    e.preventDefault()

    // 将所有分数转换为10分制
    const psychologicalScore10 = evaluationResults.psychological.score > 10 ? evaluationResults.psychological.score / 10 : evaluationResults.psychological.score
    const strategyScore10 = evaluationResults.strategy.score > 10 ? evaluationResults.strategy.score / 10 : evaluationResults.strategy.score / 10
    const riskScore10 = 10

    const overallScore = (
      psychologicalScore10 * 0.3 +
      strategyScore10 * 0.4 +
      riskScore10 * 0.3
    ).toFixed(2)

    addOrder({
      ...orderForm,
      price: parseFloat(orderForm.price),
      stopLossPrice: parseFloat(orderForm.stopLossPrice),
      takeProfitPrice: orderForm.takeProfitPrice ? parseFloat(orderForm.takeProfitPrice) : null,
      quantity: parseInt(orderForm.quantity),
      psychologicalScore: parseFloat(psychologicalScore10),
      strategyScore: parseFloat(strategyScore10),
      riskScore: riskScore10,
      overallScore: parseFloat(overallScore),
      status: 'pending',
      evaluationResults
    })

    setShowModal(false)
    alert('预约单已创建，请在订单列表中选择执行')
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const executedOrders = orders.filter(o => o.status === 'executed')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  const filteredOrders = selectedFilter === 'all' ? orders : orders.filter(o => o.status === selectedFilter)
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
              <p className="text-sm mb-0" style={{ color: '#666' }}>待执行订单</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {pendingOrders.length}
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
              <p className="text-sm mb-0" style={{ color: '#666' }}>已执行订单</p>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>
                {executedOrders.length}
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
          onExecute={() => {
            if (selectedIds.length === 0) {
              alert('请选择要执行的订单')
              return
            }
            selectedIds.forEach(id => executeOrder(id))
            setSelectedIds([])
            setToastType('success')
            setToastMessage('执行成功')
            setShowToast(true)
          }}
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
          canExecute={selectedIds.length > 0}
          canCancel={selectedIds.length > 0}
          canDelete={selectedIds.length > 0}
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
              { key: 'name', label: '资产名称', width: '150px' },
              { key: 'symbol', label: '资产代码', width: '120px' },
              { key: 'type', label: '类型', width: '100px' },
              { key: 'price', label: '价格', width: '120px' },
              { key: 'quantity', label: '数量', width: '100px' },
              { key: 'status', label: '状态', width: '100px' },
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
              if (field.key === 'status') {
                const statusMap = {
                  'pending': { text: '待执行' },
                  'executed': { text: '已执行' },
                  'cancelled': { text: '作废' }
                }
                const status = statusMap[item.status]
                return <span>{status.text}</span>
              }
              if (field.key === 'type') {
                return item.type === 'buy' ? '买入' : '卖出'
              }
              if (field.key === 'createdAt') {
                return format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')
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
        title="预约订单"
      >
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center mb-6">
              {[0, 1, 2].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step === evaluationStep
                      ? 'bg-[#0F1419] text-white'
                      : step < evaluationStep
                      ? 'bg-white border border-[#0F1419] text-gray-900'
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
                  ? 'bg-white border border-[#0F1419] text-gray-900'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                4
              </div>
            </div>

            {/* 步骤内容 */}
            {evaluationStep === 0 && (
              <div>
                <p className="text-gray-600 mb-2">交易心理测试</p>
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200 mb-4">
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">交易策略评估</h3>
                <p className="text-gray-600 mb-6">选择并评估交易策略</p>
                <div className="space-y-3 mb-4">
                  {strategies[orderType].map((strategy) => (
                    <div
                      key={strategy.id}
                      onClick={() => setOrderForm({ ...orderForm, strategyId: strategy.id })}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        orderForm.strategyId === strategy.id
                          ? 'bg-primary-50 border-primary-500'
                          : 'bg-white border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <h4 className="font-bold text-gray-900 mb-1">{strategy.name}</h4>
                      <p className="text-sm text-gray-600">{strategy.description}</p>
                      <p className="text-sm text-gray-500 mt-2">及格线: {strategy.passScore}分</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEvaluationStep(0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    上一步
                  </button>
                  <button
                    onClick={handleStrategyEvaluation}
                    className="flex-1 px-4 py-2 bg-[#0F1419] border border-[#0F1419] rounded text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    下一步
                  </button>
                </div>
              </div>
            )}

            {evaluationStep === 2 && orderType === 'buy' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">风险模型评估</h3>
                <p className="text-gray-600 mb-6">选择风险模型并计算仓位</p>
                <div className="space-y-3 mb-4">
                  {riskModels.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => setOrderForm({ ...orderForm, riskModelId: model.id })}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        orderForm.riskModelId === model.id
                          ? 'bg-primary-50 border-primary-500'
                          : 'bg-white border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <h4 className="font-bold text-gray-900 mb-1">{model.name}</h4>
                      <p className="text-sm text-gray-600">{model.description}</p>
                      <p className="text-sm text-gray-500 mt-2">最大亏损: {model.maxLossPercent}%</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEvaluationStep(1)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    上一步
                  </button>
                  <button
                    onClick={handleRiskEvaluation}
                    className="flex-1 px-4 py-2 bg-[#0F1419] border border-[#0F1419] rounded text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    下一步
                  </button>
                </div>
              </div>
            )}

            {evaluationStep === 3 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">填写订单信息</h3>
                <p className="text-gray-600 mb-6">完成订单详细信息</p>
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">资产代码</label>
                      <input
                        type="text"
                        required
                        value={orderForm.symbol}
                        onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value })}
                        placeholder="例如：AAPL"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">资产名称</label>
                      <input
                        type="text"
                        required
                        value={orderForm.name}
                        onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                        placeholder="例如：苹果公司"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">价格</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={orderForm.price}
                        onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                        placeholder="例如：150.50"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">数量</label>
                      <input
                        type="number"
                        required
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                        placeholder="例如：100"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>
                  {orderType === 'buy' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">止损价</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={orderForm.stopLossPrice}
                            onChange={(e) => setOrderForm({ ...orderForm, stopLossPrice: e.target.value })}
                            placeholder="例如：145.00"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">止盈价</label>
                          <input
                            type="number"
                            step="0.01"
                            value={orderForm.takeProfitPrice}
                            onChange={(e) => setOrderForm({ ...orderForm, takeProfitPrice: e.target.value })}
                            placeholder="例如：160.00"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* 评估结果摘要 */}
                  <div className="p-4 bg-primary-500/10 rounded-lg border border-primary-200">
                    <h4 className="font-bold text-gray-900 mb-2">评估结果</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">心理测试</p>
                        <p className="font-bold text-gray-900">{evaluationResults.psychological?.score || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">策略评估</p>
                        <p className="font-bold text-gray-900">{evaluationResults.strategy?.score || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">风险控制</p>
                        <p className="font-bold text-green-600">通过</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setEvaluationStep(orderType === 'buy' ? 2 : 1)}
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
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#0F1419] border border-[#0F1419] rounded text-white font-medium hover:opacity-90 transition-opacity"
                    >
                      创建预约单
                    </button>
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
      </div>
    </div>
  )
}

export default OrderManagement
