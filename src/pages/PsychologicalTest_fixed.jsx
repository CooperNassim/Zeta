import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Edit as EditIcon } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import { createRoot } from 'react-dom/client'

const PsychologicalTest = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [testScores, setTestScores] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)

  const indicators = useStore(state => state.psychologicalIndicators)
  const psychologicalTests = useStore(state => state.psychologicalTests)
  const addPsychologicalTest = useStore(state => state.addPsychologicalTest)
  const updatePsychologicalIndicator = useStore(state => state.updatePsychologicalIndicator)

  // 初始化默认分数
  useEffect(() => {
    const today = new Date()
    const testResult = getTestResultForDate(today)
    if (testResult) {
      setTestScores(testResult.scores)
    } else {
      // 没有测试记录时，不设置任何默认值
      setTestScores({})
    }
  }, [indicators])

  const handleDateClick = (date) => {
    setSelectedDate(date)
    const testResult = getTestResultForDate(date)
    if (testResult) {
      setTestScores(testResult.scores)
    } else {
      // 没有测试记录时，不设置任何默认值
      setTestScores({})
    }
  }

  // 获取选中日期的测试结果
  const getTestResultForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return psychologicalTests.find(test => format(new Date(test.date), 'yyyy-MM-dd') === dateStr)
  }

  const getScoreColor = (score) => {
    // 兼容旧数据：如果分数大于10，说明是归一化分数（0-100），需要转换
    const finalScore = score > 10 ? score / 10 : score
    if (finalScore >= 7) return '#22c55e'
    return '#ef4444'
  }

  const getDotColor = (score) => {
    // 兼容旧数据：如果分数大于10，说明是归一化分数（0-100），需要转换
    const finalScore = score > 10 ? score / 10 : score
    if (finalScore >= 7 && finalScore <= 8) return '#22c55e' // 绿色 7-8分
    if ((finalScore >= 5 && finalScore <= 6) || (finalScore >= 9 && finalScore <= 10)) return '#f59e0b' // 黄色 5-6分 或 9-10分
    return '#ef4444' // 红色 0-4分
  }

  const calculateOverallScore = (scores = testScores) => {
    let totalScore = 0
    let totalWeight = 0

    indicators.forEach(indicator => {
      const score = scores[indicator.id] || indicator.minScore
      const normalizedScore = ((score - indicator.minScore) / (indicator.maxScore - indicator.minScore)) * 100
      totalScore += normalizedScore * indicator.weight
      totalWeight += indicator.weight
    })

    // 返回 0-10 范围的分数
    return totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) / 10 : 0
  }

  const handleScoreChange = (indicatorId, value) => {
    // 只允许当天进行测试
    if (!isTodaySelected()) {
      return
    }

    const newScores = { ...testScores, [indicatorId]: parseInt(value) }
    setTestScores(newScores)
    // 选中分数后自动保存测试结果
    const overallScore = calculateOverallScore(newScores)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    // 检查是否已有当天的测试记录
    const existingIndex = psychologicalTests.findIndex(test => format(new Date(test.date), 'yyyy-MM-dd') === dateStr)

    if (existingIndex !== -1) {
      // 更新已有记录
      const updatedTests = [...psychologicalTests]
      updatedTests[existingIndex] = {
        ...updatedTests[existingIndex],
        scores: newScores,
        overallScore: parseFloat(overallScore)
      }
      useStore.setState({ psychologicalTests: updatedTests })
    } else {
      // 添加新记录
      addPsychologicalTest({
        scores: newScores,
        overallScore: parseFloat(overallScore),
        date: selectedDate.toISOString()
      })
    }
  }

  const handleSubmitTest = () => {
    const overallScore = calculateOverallScore()
    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    // 检查是否已有当天的测试记录
    const existingIndex = psychologicalTests.findIndex(test => format(new Date(test.date), 'yyyy-MM-dd') === dateStr)

    if (existingIndex !== -1) {
      // 更新已有记录
      const updatedTests = [...psychologicalTests]
      updatedTests[existingIndex] = {
        ...updatedTests[existingIndex],
        scores: { ...testScores },
        overallScore: parseFloat(overallScore)
      }
      useStore.setState({ psychologicalTests: updatedTests })
    } else {
      // 添加新记录
      addPsychologicalTest({
        scores: { ...testScores },
        overallScore: parseFloat(overallScore),
        date: selectedDate.toISOString()
      })
    }
  }

  const handleSaveAllIndicators = (newIndicators) => {
    newIndicators.forEach((newIndicator, index) => {
      updatePsychologicalIndicator(indicators[index].id, newIndicator)
    })
    setShowEditModal(false)

    // 显示成功提示
    const toastContainer = document.createElement('div')
    document.body.appendChild(toastContainer)
    const root = createRoot(toastContainer)
    root.render(
      <Toast
        message="更新成功"
        type="success"
        onClose={() => {
          root.unmount()
          document.body.removeChild(toastContainer)
        }}
      />
    )
  }

  // 生成日历
  const generateCalendar = () => {
    const today = new Date()
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []
    // 填充空白
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, date: null })
    }
    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({ day, date })
    }
    return days
  }

  const calendarDays = generateCalendar()

  const changeMonth = (delta) => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setSelectedDate(newDate)
  }

  const selectedTestResult = getTestResultForDate(selectedDate)
  const overallScore = parseFloat(calculateOverallScore())
  const scoreColor = getScoreColor(overallScore)

  // 根据分数获取交易状态信息
  const getTradeStatus = (score) => {
    const finalScore = score > 10 ? score / 10 : score
    if (finalScore >= 7 && finalScore <= 8) {
      return { color: '#22c55e', text: '可以交易' }
    }
    if ((finalScore >= 5 && finalScore <= 6) || (finalScore >= 9 && finalScore <= 10)) {
      return { color: '#f59e0b', text: '谨慎交易' }
    }
    return { color: '#ef4444', text: '禁止交易' }
  }

  const tradeStatus = getTradeStatus(overallScore)

  // 判断选中的日期是否为今天
  const isTodaySelected = () => {
    const today = new Date()
    const selectedStr = format(selectedDate, 'yyyy-MM-dd')
    const todayStr = format(today, 'yyyy-MM-dd')
    return selectedStr === todayStr
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '10px', paddingRight: '10px', position: 'relative' }}>
        {/* 主内容区域 - 左8右2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '7.8fr 2.2fr', gap: '10px', marginTop: '10px', flex: 1, minHeight: 0, paddingBottom: '10px' }}>
          {/* 左侧卡片 - 测试问卷 */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          height: 'calc(100vh - 52px - 20px)'
        }}>
            {/* 分数显示 - 使用SVG印章图标，居中显示，仅在有测试数据时显示 */}
            {Object.keys(testScores).length > 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '160px',
              height: '160px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <svg viewBox="0 0 1024 1024" width="160" height="160" style={{ position: 'absolute', top: 0, left: 0 }}>
                <circle
                  cx="512"
                  cy="512"
                  r="480"
                  fill={tradeStatus.color}
                  opacity="0.3"
                />
              </svg>
              <div style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: tradeStatus.color,
                lineHeight: '1',
                marginBottom: '4px',
                zIndex: 2,
                textShadow: '0 2px 8px rgba(255,255,255,0.8)'
              }}>
                {overallScore > 10 ? (overallScore / 10).toFixed(1) : overallScore}
              </div>
              <div style={{
                fontSize: '18px',
                color: tradeStatus.color,
                fontWeight: 'bold',
                letterSpacing: '3px',
                zIndex: 2,
                textShadow: '0 2px 8px rgba(255,255,255,0.8)'
              }}>
                {tradeStatus.text}
              </div>
            </div>
            )}

            {/* 试卷内容 */}
            <div style={{ flex: 1, overflow: 'auto', marginTop: '10px', minHeight: 0, paddingBottom: '0px' }}>
              <div>
                {indicators.map((indicator, index) => {
                  const score = testScores[indicator.id]

                  return (
                    <div key={indicator.id} style={{ marginBottom: index < indicators.length - 1 ? '17px' : '0px', paddingBottom: '17px', borderBottom: index < indicators.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      {/* 题目 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: '10px'
                      }}>
                        <span style={{
                          width: '28px',
                          height: '28px',
                          background: '#f3f4f6',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginRight: '12px',
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F1419', marginBottom: '6px' }}>
                            {indicator.name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                            {indicator.description}
                          </div>
                        </div>
                      </div>

                      {/* 评分选择器 */}
                      <div style={{
                        marginLeft: '40px',
                        padding: '17px 21px',
                        background: isTodaySelected() ? '#f9fafb' : '#f3f4f6',
                        borderLeft: `3px solid ${isTodaySelected() ? '#0F1419' : '#d1d5db'}`,
                        borderRadius: '0 6px 6px 0',
                        opacity: isTodaySelected() ? 1 : 0.5
                      }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start' }}>
                          {[indicator.minScore, indicator.minScore + 1, indicator.maxScore].map(value => (
                            <button
                              key={value}
                              onClick={() => handleScoreChange(indicator.id, value)}
                              disabled={!isTodaySelected()}
                              style={{
                                padding: '6px 16px',
                                background: score === value ? '#0F1419' : '#ffffff',
                                border: score === value ? '1px solid #0F1419' : '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: score === value ? '#ffffff' : '#000',
                                cursor: isTodaySelected() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                minWidth: '60px',
                                height: '36px',
                                opacity: isTodaySelected() ? 1 : 0.6
                              }}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 右侧区域 - 日历和指标 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            height: 'calc(100vh - 52px - 20px)'
          }}>
            {/* 日历卡片 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              maxHeight: '50%',
              width: '100%',
              overflow: 'hidden'
            }}>
              {/* 日历标题 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '1px solid #e5e7eb',
                height: '40px',
                position: 'relative'
              }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => changeMonth(-1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <ChevronLeft style={{ width: '20px', height: '20px', color: '#666' }} />
                </motion.button>
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#0F1419',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => changeMonth(1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <ChevronRight style={{ width: '20px', height: '20px', color: '#666' }} />
                </motion.button>
              </div>

              {/* 日历内容区域 - 可滚动 */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                minHeight: 0
              }}>
              {/* 星期标题 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '5px',
                marginBottom: '8px'
              }}>
                {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                  <div key={day} style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#666',
                    padding: '6px 0'
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* 日期格子 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '5px'
              }}>
                {calendarDays.map((item, index) => {
                  const testResult = item.date ? getTestResultForDate(item.date) : null
                  const isSelected = item.date && format(item.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  const isToday = item.date && format(item.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

                  return (
                    <div
                      key={index}
                      onClick={() => item.date && handleDateClick(item.date)}
                      style={{
                        height: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        paddingTop: '4px',
                        cursor: item.date ? 'pointer' : 'default',
                        background: isSelected ? '#0F1419' : isToday ? '#f3f4f6' : '#ffffff',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid #0F1419' : isToday ? '2px solid #0F1419' : '1px solid #e5e7eb',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                    >
                      {item.day && (
                        <>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            color: isSelected ? '#ffffff' : isToday ? '#0F1419' : '#000'
                          }}>
                            {item.day}
                          </span>
                          {testResult && (
                            <div style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: getDotColor(testResult.overallScore),
                              marginTop: '2px'
                            }} />
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              </div>
            </div>

            {/* 测试指标卡片 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              paddingTop: '14px',
              paddingRight: '20px',
              paddingBottom: '20px',
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              flex: 1,
              minHeight: 0,
              maxHeight: '50%'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                paddingBottom: '0px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#0F1419',
                  margin: 0
                }}>
                  指标设置
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEditModal(true)}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <EditIcon style={{ width: '16px', height: '16px', color: '#666' }} />
                </motion.button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', marginTop: '0px', minHeight: 0, paddingBottom: '0px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {indicators.map((indicator, index) => (
                    <div
                      key={indicator.id}
                      style={{
                        padding: '10px 14px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F1419', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {indicator.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {indicator.description}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 编辑指标弹窗 */}
        <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="指标设置"
        width="max-w-3xl"
        footer={
          <>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                const newIndicators = indicators.map(indicator => ({
                  ...indicator,
                  name: document.getElementById(`indicator-name-${indicator.id}`).value,
                  description: document.getElementById(`indicator-desc-${indicator.id}`).value
                }))
                handleSaveAllIndicators(newIndicators)
              }}
              className="px-4 py-2 rounded text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0F1419' }}
            >
              保存
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflow: 'auto' }}>
          {indicators.map((indicator, index) => (
            <div
              key={indicator.id}
              style={{
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{
                  width: '26px',
                  height: '26px',
                  background: '#e5e7eb',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {index + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    defaultValue={indicator.name}
                    id={`indicator-name-${indicator.id}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 transition-colors text-sm font-medium mb-2"
                  />
                  <textarea
                    defaultValue={indicator.description}
                    id={`indicator-desc-${indicator.id}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 transition-colors text-sm resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      </div>
    </div>
  )
}

export default PsychologicalTest
