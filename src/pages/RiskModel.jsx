import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, Shield, Calculator } from 'lucide-react'
import useStore from '../store/useStore'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'

const RiskModel = () => {
  const [showModal, setShowModal] = useState(false)
  const [editingModel, setEditingModel] = useState(null)
  const [simulation, setSimulation] = useState({
    accountBalance: 100000,
    currentPrice: 100,
    stopLossPrice: 95
  })

  const riskModels = useStore(state => state.riskModels)
  const addRiskModel = useStore(state => state.addRiskModel)
  const deleteRiskModel = useStore(state => state.deleteRiskModel)

  const [modelForm, setModelForm] = useState({
    name: '',
    description: '',
    maxLossPercent: 1,
    positionSize: 0.1
  })

  const handleAddModel = () => {
    setEditingModel(null)
    setModelForm({
      name: '',
      description: '',
      maxLossPercent: 1,
      positionSize: 0.1
    })
    setShowModal(true)
  }

  const handleEditModel = (model) => {
    setEditingModel(model)
    setModelForm({
      name: model.name,
      description: model.description,
      maxLossPercent: model.maxLossPercent,
      positionSize: model.positionSize
    })
    setShowModal(true)
  }

  const handleSaveModel = (e) => {
    e.preventDefault()
    if (editingModel) {
      alert('编辑功能暂未实现')
    } else {
      addRiskModel({
        ...modelForm,
        maxLossPercent: parseFloat(modelForm.maxLossPercent),
        positionSize: parseFloat(modelForm.positionSize)
      })
    }
    setShowModal(false)
    setModelForm({ name: '', description: '', maxLossPercent: 1, positionSize: 0.1 })
  }

  const calculatePositionSize = (model) => {
    const maxLoss = simulation.accountBalance * (model.maxLossPercent / 100)
    const priceDiff = simulation.currentPrice - simulation.stopLossPrice

    if (priceDiff <= 0) {
      return { quantity: 0, amount: 0, message: '止损价必须低于现价' }
    }

    const quantity = Math.floor(maxLoss / priceDiff)
    const amount = quantity * simulation.currentPrice

    return {
      quantity,
      amount,
      maxLoss,
      message: `最大亏损: ¥${maxLoss.toLocaleString()} (${model.maxLossPercent}%)`
    }
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">风险模型</h1>
          <p className="text-gray-600">设定多个风险管控模型，科学控制交易风险</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddModel}
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg text-gray-900 font-medium hover:from-primary-600 hover:to-blue-600 transition-all duration-300 inline-flex items-center shadow-lg shadow-primary-500/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          添加风险模型
        </motion.button>
      </motion.div>

      {/* 风险模型列表 */}
      <ScrollAnimation delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {riskModels.map((model, index) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glass rounded-xl border border-gray-200 overflow-hidden hover:border-primary-200 transition-all"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEditModel(model)}
                    className="p-2 text-primary-600 hover:text-primary-300 hover:bg-primary-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteRiskModel(model.id)}
                    className="p-2 text-red-600 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{model.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{model.description}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">最大亏损比例</span>
                  <span className="font-bold text-red-600">{model.maxLossPercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">最大仓位比例</span>
                  <span className="font-bold text-blue-400">{(model.positionSize * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </motion.div>
          ))}
        </div>
      </ScrollAnimation>

      {/* 仓位计算模拟器 */}
      <ScrollAnimation delay={0.3}>
        <div className="glass rounded-xl border border-gray-200 overflow-hidden hover:border-primary-200 transition-all duration-300">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-primary-600" />
            仓位计算模拟器
          </h2>
          <p className="text-sm text-gray-600 mt-1">输入交易参数，模拟不同风险模型的仓位计算结果</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">账户余额 (¥)</label>
              <input
                type="number"
                value={simulation.accountBalance}
                onChange={(e) => setSimulation({ ...simulation, accountBalance: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">现价 (¥)</label>
              <input
                type="number"
                value={simulation.currentPrice}
                onChange={(e) => setSimulation({ ...simulation, currentPrice: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">止损价 (¥)</label>
              <input
                type="number"
                value={simulation.stopLossPrice}
                onChange={(e) => setSimulation({ ...simulation, stopLossPrice: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div className="flex items-end">
              <div className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-xs text-gray-600">单股风险</p>
                <p className="text-lg font-bold text-gray-900">
                  ¥{(simulation.currentPrice - simulation.stopLossPrice).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* 计算结果 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {riskModels.map((model) => {
              const result = calculatePositionSize(model)
              return (
                <motion.div
                  key={model.id}
                  className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">{model.name}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">建议买入数量</span>
                      <span className="text-lg font-bold text-primary-600">{result.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">交易金额</span>
                      <span className="text-lg font-bold text-gray-900">¥{result.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">占账户比例</span>
                      <span className="text-lg font-bold text-blue-400">
                        {((result.amount / simulation.accountBalance) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{result.message}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
        </div>
      </ScrollAnimation>

      {/* 添加/编辑风险模型弹窗 */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowModal(false); setEditingModel(null) }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl border border-gray-300 w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingModel ? '编辑风险模型' : '添加风险模型'}
            </h3>
            <form onSubmit={handleSaveModel} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">模型名称</label>
                <input
                  type="text"
                  required
                  value={modelForm.name}
                  onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                  placeholder="例如：保守型"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">模型描述</label>
                <textarea
                  value={modelForm.description}
                  onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                  placeholder="描述该风险模型的特点"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">最大亏损比例 (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="10"
                    required
                    value={modelForm.maxLossPercent}
                    onChange={(e) => setModelForm({ ...modelForm, maxLossPercent: e.target.value })}
                    placeholder="1"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">最大仓位比例 (0-1)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1"
                    required
                    value={modelForm.positionSize}
                    onChange={(e) => setModelForm({ ...modelForm, positionSize: e.target.value })}
                    placeholder="0.1"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowModal(false); setEditingModel(null) }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                >
                  取消
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-blue-500 rounded-lg text-gray-900 font-medium hover:from-primary-600 hover:to-blue-600 transition-all"
                >
                  保存
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default RiskModel
