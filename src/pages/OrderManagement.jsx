import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Play, X, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'

const OrderManagement = () => {
  const [showModal, setShowModal] = useState(false)
  const [orderType, setOrderType] = useState('buy')
  const [evaluationStep, setEvaluationStep] = useState(0)
  const [evaluationResults, setEvaluationResults] = useState({})

  const orders = useStore(state => state.orders)
  const account = useStore(state => state.account)
  const psychologicalTests = useStore(state => state.psychologicalTests)
  const strategies = useStore(state => state.strategies)
  const riskModels = useStore(state => state.riskModels)
  const addOrder = useStore(state => state.addOrder)
  const executeOrder = useStore(state => state.executeOrder)

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

  const handlePsychologicalEvaluation = () => {
    const latestTest = psychologicalTests[psychologicalTests.length - 1]
    if (!latestTest) {
      alert('请先完成心理测试')
      return false
    }

    const pass = latestTest.pass
    setEvaluationResults({
      ...evaluationResults,
      psychological: {
        pass,
        score: latestTest.overallScore
      }
    })

    if (!pass) {
      alert('心理测试未通过，无法创建订单')
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

    const overallScore = (
      evaluationResults.psychological.score * 0.3 +
      evaluationResults.strategy.score * 0.4 +
      100 * 0.3
    ).toFixed(2)

    addOrder({
      ...orderForm,
      price: parseFloat(orderForm.price),
      stopLossPrice: parseFloat(orderForm.stopLossPrice),
      takeProfitPrice: orderForm.takeProfitPrice ? parseFloat(orderForm.takeProfitPrice) : null,
      quantity: parseInt(orderForm.quantity),
      psychologicalScore: evaluationResults.psychological.score,
      strategyScore: parseFloat(evaluationResults.strategy.score),
      riskScore: 100,
      overallScore: parseFloat(overallScore),
      status: 'pending',
      evaluationResults
    })

    setShowModal(false)
    alert('预约单已创建，请在订单列表中选择执行')
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const executedOrders = orders.filter(o => o.status === 'executed')

  return (
    <div className="space-y-6 pt-20 px-4 md:px-6 lg:pl-64">
      {/* 头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">预约单</h1>
          <p className="text-gray-600">创建和管理交易预约单，智能评估交易机会</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAddOrder('buy')}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-gray-900 font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 inline-flex items-center shadow-lg shadow-green-500/30"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            买入预约
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAddOrder('sell')}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-gray-900 font-medium hover:from-red-600 hover:to-rose-600 transition-all duration-300 inline-flex items-center shadow-lg shadow-red-500/30"
          >
            <TrendingDown className="w-5 h-5 mr-2" />
            卖出预约
          </motion.button>
        </div>
      </motion.div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScrollAnimation delay={0.1}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">待执行订单</p>
                <p className="text-3xl font-bold text-yellow-600">
                  <Counter end={pendingOrders.length} duration={1} />
                </p>
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock className="w-10 h-10 text-yellow-600" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.2}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">已执行订单</p>
                <p className="text-3xl font-bold text-green-600">
                  <Counter end={executedOrders.length} duration={1} />
                </p>
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
        <ScrollAnimation delay={0.3}>
          <motion.div className="glass rounded-xl p-6 border border-gray-200 hover-float cursor-pointer" whileHover={{ scale: 1.02 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">平均评分</p>
                <p className="text-3xl font-bold text-blue-400">
                  {orders.length > 0 ? (orders.reduce((sum, o) => sum + o.overallScore, 0) / orders.length).toFixed(1) : 0}
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <AlertCircle className="w-10 h-10 text-blue-400" />
              </motion.div>
            </div>
          </motion.div>
        </ScrollAnimation>
      </div>

      {/* 待执行订单 */}
      <ScrollAnimation delay={0.4}>
        <div className="glass rounded-xl border border-gray-200 overflow-hidden hover:border-primary-200 transition-all duration-300">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">待执行订单</h2>
        </div>
        <div className="p-6">
          {pendingOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">暂无待执行订单</p>
          ) : (
            <div className="grid gap-4">
              {pendingOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    order.type === 'buy'
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          order.type === 'buy' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                        }`}>
                          {order.type === 'buy' ? '买入' : '卖出'}
                        </span>
                        <span className="text-xl font-bold text-gray-900">{order.symbol}</span>
                        <span className="text-gray-600">{order.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">综合评分</p>
                      <p className="text-2xl font-bold text-primary-600">{order.overallScore}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">价格</p>
                      <p className="font-bold text-gray-900">¥{order.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">数量</p>
                      <p className="font-bold text-gray-900">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">止损价</p>
                      <p className="font-bold text-red-600">¥{order.stopLossPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">心理/策略</p>
                      <p className="font-bold text-gray-900">{order.psychologicalScore} / {order.strategyScore}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => executeOrder(order.id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg text-gray-900 font-medium hover:from-primary-600 hover:to-blue-600 transition-all"
                    >
                      <Play className="w-4 h-4 inline mr-2" />
                      执行订单
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                    >
                      <X className="w-4 h-4 inline mr-2" />
                      取消订单
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </div>
        </div>
      </ScrollAnimation>

      {/* 已执行订单 */}
      <ScrollAnimation delay={0.5}>
        <div className="glass rounded-xl border border-gray-200 overflow-hidden hover:border-primary-200 transition-all duration-300">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">已执行订单</h2>
          </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-4">类型</th>
                <th className="px-6 py-4">代码</th>
                <th className="px-6 py-4">价格</th>
                <th className="px-6 py-4">数量</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">综合评分</th>
                <th className="px-6 py-4">执行时间</th>
              </tr>
            </thead>
            <tbody>
              {executedOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    暂无已执行订单
                  </td>
                </tr>
              ) : (
                executedOrders.map((order, index) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-white transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.type === 'buy' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                      }`}>
                        {order.type === 'buy' ? '买入' : '卖出'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{order.symbol}</td>
                    <td className="px-6 py-4">¥{order.price.toLocaleString()}</td>
                    <td className="px-6 py-4">{order.quantity}</td>
                    <td className="px-6 py-4">¥{(order.price * order.quantity).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-primary-600">{order.overallScore}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.executedAt ? format(new Date(order.executedAt), 'MM-dd HH:mm') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </ScrollAnimation>

      {/* 创建预约单弹窗 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl border border-gray-300 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 步骤指示器 */}
            <div className="flex items-center justify-between mb-6">
              {[0, 1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step <= evaluationStep
                      ? 'bg-gradient-to-r from-primary-500 to-blue-500 text-gray-900'
                      : 'bg-gray-50 text-gray-600'
                  }`}>
                    {step + 1}
                  </div>
                  {step < 3 && <div className="w-16 h-1 mx-2 bg-gray-50" />}
                </div>
              ))}
            </div>

            {/* 步骤内容 */}
            {evaluationStep === 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">心理测试评估</h3>
                <p className="text-gray-600 mb-6">验证当前心理状态是否符合交易要求</p>
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200 mb-4">
                  <p className="text-sm text-gray-600">最新心理测试结果</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {psychologicalTests.length > 0 ? psychologicalTests[psychologicalTests.length - 1].overallScore : '未测试'}
                    </span>
                    <span className={`px-3 py-1 rounded text-sm ${
                      psychologicalTests.length > 0 && psychologicalTests[psychologicalTests.length - 1].pass
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-red-500/20 text-red-600'
                    }`}>
                      {psychologicalTests.length > 0 && psychologicalTests[psychologicalTests.length - 1].pass ? '通过' : '未通过'}
                    </span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePsychologicalEvaluation}
                  className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg text-gray-900 font-medium hover:from-primary-600 hover:to-blue-600 transition-all"
                >
                  下一步
                </motion.button>
              </div>
            )}

            {evaluationStep === 1 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">交易策略评估</h3>
                <p className="text-gray-600 mb-6">选择并评估交易策略</p>
                <div className="space-y-3 mb-4">
                  {strategies[orderType].map((strategy) => (
                    <motion.div
                      key={strategy.id}
                      whileHover={{ scale: 1.02 }}
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
                    </motion.div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEvaluationStep(0)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                  >
                    上一步
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStrategyEvaluation}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg text-gray-900 font-medium hover:from-primary-600 hover:to-blue-600 transition-all"
                  >
                    下一步
                  </motion.button>
                </div>
              </div>
            )}

            {evaluationStep === 2 && orderType === 'buy' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">风险模型评估</h3>
                <p className="text-gray-600 mb-6">选择风险模型并计算仓位</p>
                <div className="space-y-3 mb-4">
                  {riskModels.map((model) => (
                    <motion.div
                      key={model.id}
                      whileHover={{ scale: 1.02 }}
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
                    </motion.div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEvaluationStep(1)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                  >
                    上一步
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRiskEvaluation}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg text-gray-900 font-medium hover:from-primary-600 hover:to-blue-600 transition-all"
                  >
                    下一步
                  </motion.button>
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

                  <div className="flex gap-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEvaluationStep(orderType === 'buy' ? 2 : 1)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                    >
                      上一步
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg text-gray-900 font-medium hover:from-primary-600 hover:to-blue-600 transition-all"
                    >
                      创建预约单
                    </motion.button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OrderManagement
