import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, TrendingUp, TrendingDown, Edit2, Target } from 'lucide-react'
import useStore from '../store/useStore'
import ScrollAnimation from '../components/ScrollAnimation'

const TradingStrategy = () => {
  const [activeTab, setActiveTab] = useState('buy')
  const [showModal, setShowModal] = useState(false)
  const [showConditionModal, setShowConditionModal] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState(null)
  const [editingCondition, setEditingCondition] = useState(null)

  const strategies = useStore(state => state.strategies)
  const addStrategy = useStore(state => state.addStrategy)
  const deleteStrategy = useStore(state => state.deleteStrategy)

  const [strategyForm, setStrategyForm] = useState({
    name: '',
    description: '',
    conditions: [],
    passScore: 70
  })

  const [conditionForm, setConditionForm] = useState({
    name: '',
    weight: 0.5,
    threshold: 70,
    description: ''
  })

  const handleAddStrategy = () => {
    setEditingStrategy(null)
    setStrategyForm({
      name: '',
      description: '',
      conditions: [],
      passScore: 70
    })
    setShowModal(true)
  }

  const handleEditStrategy = (strategy) => {
    setEditingStrategy(strategy)
    setStrategyForm({
      name: strategy.name,
      description: strategy.description,
      conditions: [...strategy.conditions],
      passScore: strategy.passScore
    })
    setShowModal(true)
  }

  const handleAddCondition = () => {
    setEditingCondition(null)
    setConditionForm({
      name: '',
      weight: 0.5,
      threshold: 70,
      description: ''
    })
    setShowConditionModal(true)
  }

  const handleEditCondition = (condition) => {
    setEditingCondition(condition)
    setConditionForm({
      name: condition.name,
      weight: condition.weight,
      threshold: condition.threshold,
      description: condition.description
    })
    setShowConditionModal(true)
  }

  const handleSaveCondition = () => {
    const totalWeight = strategyForm.conditions.reduce((sum, c) => sum + c.weight, 0) -
      (editingCondition?.weight || 0) + parseFloat(conditionForm.weight)

    if (totalWeight > 1) {
      alert(`条件权重总和不能超过100%，当前为${(totalWeight * 100).toFixed(1)}%`)
      return
    }

    if (editingCondition) {
      setStrategyForm({
        ...strategyForm,
        conditions: strategyForm.conditions.map(c =>
          c.id === editingCondition.id
            ? { ...conditionForm, id: editingCondition.id, weight: parseFloat(conditionForm.weight), threshold: parseInt(conditionForm.threshold) }
            : c
        )
      })
    } else {
      setStrategyForm({
        ...strategyForm,
        conditions: [
          ...strategyForm.conditions,
          { ...conditionForm, id: Date.now(), weight: parseFloat(conditionForm.weight), threshold: parseInt(conditionForm.threshold) }
        ]
      })
    }
    setShowConditionModal(false)
    setEditingCondition(null)
  }

  const handleDeleteCondition = (conditionId) => {
    setStrategyForm({
      ...strategyForm,
      conditions: strategyForm.conditions.filter(c => c.id !== conditionId)
    })
  }

  const handleSaveStrategy = () => {
    if (editingStrategy) {
      // 编辑模式需要实现更新逻辑
      alert('编辑功能暂未实现')
    } else {
      addStrategy(activeTab, {
        ...strategyForm,
        passScore: parseInt(strategyForm.passScore)
      })
    }
    setShowModal(false)
    setStrategyForm({ name: '', description: '', conditions: [], passScore: 70 })
  }

  const currentStrategies = strategies[activeTab]

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">交易策略</h1>
          <p className="text-gray-600">管理买入和卖出策略，建立评估机制</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddStrategy}
          className="px-6 py-3 bg-primary-500 rounded-lg text-gray-900 font-medium hover:bg-primary-600 transition-all duration-300 inline-flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          添加策略
        </motion.button>
      </motion.div>

      {/* 选项卡 */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('buy')}
          className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'buy'
              ? 'bg-green-500 text-gray-900'
              : 'bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-5 h-5 inline mr-2" />
          买入策略
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('sell')}
          className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'sell'
              ? 'bg-red-500 text-gray-900'
              : 'bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingDown className="w-5 h-5 inline mr-2" />
          卖出策略
        </motion.button>
      </div>

      {/* 策略列表 */}
      <ScrollAnimation delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentStrategies.map((strategy, index) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glass rounded-xl border border-gray-200 overflow-hidden hover:border-primary-200 transition-all"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                    <Target className={`w-5 h-5 mr-2 ${activeTab === 'buy' ? 'text-green-600' : 'text-red-600'}`} />
                    {strategy.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{strategy.description}</p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEditStrategy(strategy)}
                    className="p-2 text-primary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteStrategy(activeTab, strategy.id)}
                    className="p-2 text-red-600 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* 条件列表 */}
              <div className="space-y-3 mb-4">
                {strategy.conditions.map((condition) => (
                  <div key={condition.id} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{condition.name}</span>
                      <span className="text-xs text-gray-600">
                        权重: {(condition.weight * 100).toFixed(0)}% | 阈值: {condition.threshold}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{condition.description}</p>
                  </div>
                ))}
              </div>

              {/* 及格线 */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">及格线</span>
                <span className="text-2xl font-bold text-primary-500">{strategy.passScore}分</span>
              </div>
            </div>
          </motion.div>
        ))}
        </div>
      </ScrollAnimation>

      {/* 添加/编辑策略弹窗 */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowModal(false); setEditingStrategy(null) }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl border border-gray-300 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingStrategy ? '编辑策略' : '添加策略'}
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">策略名称</label>
                  <input
                    type="text"
                    required
                    value={strategyForm.name}
                    onChange={(e) => setStrategyForm({ ...strategyForm, name: e.target.value })}
                    placeholder="例如：趋势突破策略"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">及格分数</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={strategyForm.passScore}
                    onChange={(e) => setStrategyForm({ ...strategyForm, passScore: e.target.value })}
                    placeholder="70"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">策略描述</label>
                <textarea
                  value={strategyForm.description}
                  onChange={(e) => setStrategyForm({ ...strategyForm, description: e.target.value })}
                  placeholder="描述该策略的核心思想和使用场景"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  rows={2}
                />
              </div>

              {/* 条件管理 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">评估条件</h4>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddCondition}
                    className="px-4 py-2 bg-primary-500 rounded-lg text-gray-900 text-sm hover:bg-primary-600 transition-all"
                  >
                    添加条件
                  </motion.button>
                </div>
                {strategyForm.conditions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无评估条件</p>
                ) : (
                  <div className="space-y-3">
                    {strategyForm.conditions.map((condition) => (
                      <div key={condition.id} className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{condition.name}</h5>
                            <p className="text-xs text-gray-500 mt-1">{condition.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEditCondition(condition)}
                              className="p-2 text-primary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteCondition(condition.id)}
                              className="p-2 text-red-600 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>权重: {(condition.weight * 100).toFixed(0)}%</span>
                          <span>阈值: {condition.threshold}</span>
                        </div>
                      </div>
                    ))}
                    <div className="text-center text-sm text-gray-600">
                      当前总权重: {(strategyForm.conditions.reduce((sum, c) => sum + c.weight, 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowModal(false); setEditingStrategy(null) }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                >
                  取消
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveStrategy}
                  className="flex-1 px-4 py-3 bg-primary-500 rounded-lg text-gray-900 font-medium hover:bg-primary-600 transition-all"
                >
                  保存
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 添加/编辑条件弹窗 */}
      {showConditionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowConditionModal(false); setEditingCondition(null) }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl border border-gray-300 w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCondition ? '编辑条件' : '添加条件'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">条件名称</label>
                <input
                  type="text"
                  required
                  value={conditionForm.name}
                  onChange={(e) => setConditionForm({ ...conditionForm, name: e.target.value })}
                  placeholder="例如：价格突破"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">条件描述</label>
                <textarea
                  value={conditionForm.description}
                  onChange={(e) => setConditionForm({ ...conditionForm, description: e.target.value })}
                  placeholder="描述该条件的具体含义"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">权重 (0-1)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    required
                    value={conditionForm.weight}
                    onChange={(e) => setConditionForm({ ...conditionForm, weight: parseFloat(e.target.value) })}
                    placeholder="0.3"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">阈值 (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={conditionForm.threshold}
                    onChange={(e) => setConditionForm({ ...conditionForm, threshold: e.target.value })}
                    placeholder="70"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowConditionModal(false); setEditingCondition(null) }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                >
                  取消
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveCondition}
                  className="flex-1 px-4 py-3 bg-primary-500 rounded-lg text-gray-900 font-medium hover:bg-primary-600 transition-all"
                >
                  保存
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default TradingStrategy
