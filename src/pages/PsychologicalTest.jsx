import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import useStore from '../store/useStore'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'

const PsychologicalTest = () => {
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState(null)
  const [testScores, setTestScores] = useState({})

  const indicators = useStore(state => state.psychologicalIndicators)
  const psychologicalTests = useStore(state => state.psychologicalTests)
  const addPsychologicalTest = useStore(state => state.addPsychologicalTest)
  const updatePsychologicalIndicator = useStore(state => state.updatePsychologicalIndicator)

  const [indicatorForm, setIndicatorForm] = useState({
    name: '',
    description: '',
    minScore: 0,
    maxScore: 100,
    weight: 0.1
  })

  const handleEditIndicator = (indicator) => {
    setEditingIndicator(indicator)
    setIndicatorForm({
      name: indicator.name,
      description: indicator.description,
      minScore: indicator.minScore,
      maxScore: indicator.maxScore,
      weight: indicator.weight
    })
    setShowIndicatorModal(true)
  }

  const handleUpdateIndicator = (e) => {
    e.preventDefault()
    const totalWeight = indicators.reduce((sum, i) => sum + i.weight, 0) - indicators.find(i => i.id === editingIndicator.id).weight + parseFloat(indicatorForm.weight)

    if (Math.abs(totalWeight - 1) > 0.01) {
      alert(`权重总和必须为100%，当前为${(totalWeight * 100).toFixed(1)}%`)
      return
    }

    updatePsychologicalIndicator(editingIndicator.id, {
      ...indicatorForm,
      weight: parseFloat(indicatorForm.weight),
      minScore: parseInt(indicatorForm.minScore),
      maxScore: parseInt(indicatorForm.maxScore)
    })
    setShowIndicatorModal(false)
    setEditingIndicator(null)
    setIndicatorForm({ name: '', description: '', minScore: 0, maxScore: 100, weight: 0.1 })
  }

  const calculateOverallScore = () => {
    let totalScore = 0
    let totalWeight = 0

    indicators.forEach(indicator => {
      const score = testScores[indicator.id] || 0
      const normalizedScore = ((score - indicator.minScore) / (indicator.maxScore - indicator.minScore)) * 100
      totalScore += normalizedScore * indicator.weight
      totalWeight += indicator.weight
    })

    return totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0
  }

  const handleSubmitTest = (e) => {
    e.preventDefault()
    const overallScore = calculateOverallScore()
    const pass = overallScore >= 70

    addPsychologicalTest({
      scores: { ...testScores },
      overallScore: parseFloat(overallScore),
      pass,
      date: new Date().toISOString()
    })

    alert(`心理测试${pass ? '通过' : '未通过'}！\n总分：${overallScore}\n及格线：70分`)
    setShowTestModal(false)
    setTestScores({})
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">心理测试</h1>
          <p className="text-gray-600">评估当前心理状态，确保交易决策时的情绪稳定</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTestModal(true)}
            className="px-6 py-3 bg-green-500 rounded-lg text-gray-900 font-medium hover:bg-green-600 transition-all duration-300 inline-flex items-center"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            开始测试
          </motion.button>
        </div>
      </motion.div>

      {/* 测试指标管理 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScrollAnimation delay={0.1}>
          {/* 指标列表 */}
          <motion.div className="glass rounded-xl border border-gray-200 overflow-hidden hover:border-primary-200 transition-all duration-300">
        {/* 指标列表 */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <AlertCircle className="w-5 h-5 mr-2 text-primary-500" />
                </motion.div>
                测试指标
              </h2>
              <p className="text-sm text-gray-600 mt-1">灵活设置心理测试指标和评分标准</p>
            </div>
          <div className="p-6 space-y-4">
            {indicators.map((indicator, index) => (
              <motion.div
                key={indicator.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{indicator.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{indicator.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>范围: {indicator.minScore}-{indicator.maxScore}</span>
                      <span className="px-2 py-1 bg-primary-50 text-primary-500 rounded">
                        权重: {(indicator.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditIndicator(indicator)}
                      className="p-2 text-primary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          </motion.div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>

          {/* 历史记录 */}
          <motion.div className="glass rounded-xl border border-gray-200 overflow-hidden hover:border-primary-200 transition-all duration-300">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">测试记录</h2>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {psychologicalTests.length === 0 ? (
              <p className="text-center text-gray-500 py-8">暂无测试记录</p>
            ) : (
              psychologicalTests.slice().reverse().map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    test.pass ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      {new Date(test.date).toLocaleString('zh-CN')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      test.pass ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                    }`}>
                      {test.pass ? '通过' : '未通过'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{test.overallScore}</span>
                    <div className="w-32 h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          test.pass ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(test.overallScore, 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          </motion.div>
        </ScrollAnimation>
      </div>

      {/* 编辑指标弹窗 */}
      {showIndicatorModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowIndicatorModal(false); setEditingIndicator(null) }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl border border-gray-300 w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">编辑测试指标</h3>
            <form onSubmit={handleUpdateIndicator} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">指标名称</label>
                <input
                  type="text"
                  required
                  value={indicatorForm.name}
                  onChange={(e) => setIndicatorForm({ ...indicatorForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">描述</label>
                <textarea
                  value={indicatorForm.description}
                  onChange={(e) => setIndicatorForm({ ...indicatorForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">最小分数</label>
                  <input
                    type="number"
                    required
                    value={indicatorForm.minScore}
                    onChange={(e) => setIndicatorForm({ ...indicatorForm, minScore: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">最大分数</label>
                  <input
                    type="number"
                    required
                    value={indicatorForm.maxScore}
                    onChange={(e) => setIndicatorForm({ ...indicatorForm, maxScore: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">权重 (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  required
                  value={indicatorForm.weight}
                  onChange={(e) => setIndicatorForm({ ...indicatorForm, weight: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">当前总权重: {(indicators.reduce((sum, i) => sum + i.weight, 0) - (editingIndicator?.weight || 0) + indicatorForm.weight * 100).toFixed(1)}%</p>
              </div>
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowIndicatorModal(false); setEditingIndicator(null) }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                >
                  取消
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-primary-500 rounded-lg text-gray-900 font-medium hover:bg-primary-600 transition-all"
                >
                  保存
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* 开始测试弹窗 */}
      {showTestModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowTestModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl border border-gray-300 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">心理测试</h3>
            <form onSubmit={handleSubmitTest} className="space-y-6">
              {indicators.map((indicator) => (
                <div key={indicator.id} className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{indicator.name}</h4>
                      <p className="text-sm text-gray-600">{indicator.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        评分范围: {indicator.minScore}-{indicator.maxScore} | 权重: {(indicator.weight * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={indicator.minScore}
                      max={indicator.maxScore}
                      value={testScores[indicator.id] || indicator.minScore}
                      onChange={(e) => setTestScores({ ...testScores, [indicator.id]: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-50 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{indicator.minScore}</span>
                      <span className="text-2xl font-bold text-primary-500">
                        {testScores[indicator.id] || indicator.minScore}
                      </span>
                      <span className="text-sm text-gray-500">{indicator.maxScore}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 总分显示 */}
              <div className="p-6 bg-gray-100 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">综合评分</p>
                    <p className="text-4xl font-bold text-gray-900">{calculateOverallScore()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${calculateOverallScore() >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateOverallScore() >= 70 ? '通过' : '未通过'}
                    </p>
                    <p className="text-sm text-gray-600">及格线: 70分</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                >
                  取消
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-green-500 rounded-lg text-gray-900 font-medium hover:bg-green-600 transition-all"
                >
                  提交测试
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default PsychologicalTest
