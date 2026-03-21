import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Edit as EditIcon, RefreshCw, RotateCcw, Check } from 'lucide-react'
import useStore from '../store/useStore'
import { format } from 'date-fns'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import { createRoot } from 'react-dom/client'

const PsychologicalTest = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [testScores, setTestScores] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const indicators = useStore(state => state.psychologicalIndicators)
  const psychologicalTests = useStore(state => state.psychologicalTests)
  const updatePsychologicalIndicator = useStore(state => state.updatePsychologicalIndicator)
  const importPsychologicalTestResults = useStore(state => state.importPsychologicalTestResults)
  const importPsychologicalIndicators = useStore(state => state.importPsychologicalIndicators)

  // 获取选中日期的测试结果
  const getTestResultForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return psychologicalTests.find(test => {
      if (!test.date) return false
      // test.date 现在是 DATE 类型（YYYY-MM-DD），直接比较
      return test.date === dateStr
    })
  }

  // 初始化默认分数
  useEffect(() => {
    const today = new Date()
    const testResult = getTestResultForDate(today)
    if (testResult) {
      console.log('[PsychologicalTest] 初始化: 设置今天的分数', testResult.scores)
      setTestScores(testResult.scores)
    } else {
      // 没有测试记录时，不设置任何默认值
      console.log('[PsychologicalTest] 初始化: 没有今天的测试记录')
      setTestScores({})
    }
  }, [indicators])

  // 监听 psychologicalTests 的变化，更新当前选中日期的 testScores
  useEffect(() => {
    if (psychologicalTests.length > 0) {
      console.log('[PsychologicalTest] psychologicalTests 发生变化')
      const currentTestResult = getTestResultForDate(selectedDate)
      console.log('[PsychologicalTest] 当前选中日期的测试结果:', currentTestResult)
      console.log('[PsychologicalTest] 更新前 testScores:', testScores)
      // 自动同步选中日期的数据
      if (currentTestResult) {
        console.log('[PsychologicalTest] 同步数据:', currentTestResult.scores)
        setTestScores(currentTestResult.scores)
      } else {
        console.log('[PsychologicalTest] 无数据，清空分数')
        setTestScores({})
      }
    }
  }, [psychologicalTests, selectedDate])

  const handleDateClick = (date) => {
    console.log('[PsychologicalTest] 切换日期:', date)
    setSelectedDate(date)
    const testResult = getTestResultForDate(date)
    if (testResult) {
      console.log('[PsychologicalTest] 切换日期: 找到测试记录', testResult.scores)
      setTestScores(testResult.scores)
    } else {
      // 没有测试记录时，不设置任何默认值
      console.log('[PsychologicalTest] 切换日期: 没有测试记录')
      setTestScores({})
    }
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
      const weight = parseFloat(indicator.weight)
      const normalizedScore = ((score - indicator.minScore) / (indicator.maxScore - indicator.minScore)) * 10
      totalScore += normalizedScore * weight
      totalWeight += weight
    })

    const result = totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0
    return parseFloat(result)
  }

  const handleScoreChange = (indicatorId, value) => {
    // 只允许当天进行测试
    if (!isTodaySelected()) {
      return
    }

    // 只更新本地状态,不自动保存
    const newScores = { ...testScores, [indicatorId]: parseInt(value) }
    setTestScores(newScores)
  }

  // 重置所有打分项
  const handleReset = () => {
    if (!isTodaySelected()) {
      showToast('只能重置当天的测试', 'warning')
      return
    }
    setTestScores({})
  }

  // 提交心理测试数据
  const handleSubmit = async () => {
    if (!isTodaySelected()) {
      showToast('只能提交当天的测试', 'warning')
      return
    }

    if (Object.keys(testScores).length === 0) {
      showToast('请先完成所有打分项', 'warning')
      return
    }

    setIsSaving(true)

    // 保存当前分数，避免同步后丢失
    const currentScores = { ...testScores }

    try {
      const overallScore = calculateOverallScore()
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const store = useStore.getState()

      console.log('[PsychologicalTest] 提交数据:')
      console.log('[PsychologicalTest] 选中日期:', selectedDate.toISOString())
      console.log('[PsychologicalTest] 日期字符串:', dateStr)
      console.log('[PsychologicalTest] 心理测试记录数:', psychologicalTests.length)
      console.log('[PsychologicalTest] 所有测试记录:', psychologicalTests.map(t => {
        let formattedDate = '无日期'
        if (t.date) {
          // t.date 已经是 YYYY-MM-DD 格式的字符串，直接使用，不需要 new Date()
          if (typeof t.date === 'string' && t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = t.date
          } else {
            try {
              formattedDate = format(new Date(t.date), 'yyyy-MM-dd')
            } catch (error) {
              console.error('[PsychologicalTest] 日期格式错误:', t.date, error)
              formattedDate = '无效日期'
            }
          }
        }
        return {
          id: t.id,
          date: t.date,
          formattedDate
        }
      }))

      // 检查是否已有当天的测试记录
      const existingTest = psychologicalTests.find(test => {
        if (!test.date) return false
        // test.date 现在是 DATE 类型（YYYY-MM-DD），直接比较
        return test.date === dateStr
      })

      console.log('[PsychologicalTest] 找到已有记录:', existingTest ? '是' : '否')

      if (existingTest) {
        // 更新已有记录到数据库
        console.log('[PsychologicalTest] 更新已有记录')
        // 使用本地日期字符串，避免时区问题
        await store.updatePsychologicalTest(dateStr, {
          scores: currentScores,
          overallScore: parseFloat(overallScore)
        })
        showToast('测试已更新', 'success')
      } else {
        // 添加新记录到数据库
        console.log('[PsychologicalTest] 添加新记录')
        await store.addPsychologicalTest({
          scores: currentScores,
          overallScore: parseFloat(overallScore),
          date: dateStr
        })
        showToast('测试结果已保存', 'success')
      }

      // 更新成功后，保持当前分数不变
      setTestScores(currentScores)
    } catch (error) {
      console.error('[PsychologicalTest] 保存失败:', error)
      showToast('保存失败,请重试', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAllIndicators = async (newIndicators) => {
    try {
      // 逐个更新指标到数据库
      for (let index = 0; index < newIndicators.length; index++) {
        const result = await updatePsychologicalIndicator(newIndicators[index].id, newIndicators[index])
        if (!result.success) {
          throw new Error(`更新指标 ${newIndicators[index].name} 失败: ${result.error}`)
        }
      }
      setShowEditModal(false)

      // 显示成功提示
      showToast('更新成功', 'success')
    } catch (error) {
      console.error('[PsychologicalTest] 更新指标失败:', error)
      // 显示错误提示
      showToast('更新失败', 'error')
    }
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
  // 如果有存储的 overallScore，优先使用存储的值；否则重新计算
  const overallScore = selectedTestResult?.overallScore !== undefined && selectedTestResult?.overallScore !== null
    ? parseFloat(selectedTestResult.overallScore)
    : parseFloat(calculateOverallScore())
  const scoreColor = getScoreColor(overallScore)

  console.log('[PsychologicalTest] 总分计算:', {
    selectedDate: format(selectedDate, 'yyyy-MM-dd'),
    hasStoredResult: !!selectedTestResult,
    storedScore: selectedTestResult?.overallScore,
    calculatedScore: calculateOverallScore(),
    finalScore: overallScore
  })

  // 手动刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/sync/all', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const result = await response.json()

      if (result.success && result.data) {
        const { psychological_test_results, psychological_indicators } = result.data

        if (psychological_test_results !== undefined) {
          importPsychologicalTestResults(psychological_test_results)
        }
        if (psychological_indicators !== undefined) {
          importPsychologicalIndicators(psychological_indicators)
        }

        // 刷新当前选中日期的数据
        const testResult = getTestResultForDate(selectedDate)
        if (testResult) {
          setTestScores(testResult.scores)
        } else {
          setTestScores({})
        }

        // 显示成功提示
        showToast('数据已刷新', 'success')
      }
    } catch (error) {
      console.error('刷新失败:', error)
      // 显示失败提示
      showToast('刷新失败', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }

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

  // 显示Toast提示
  const showToast = (message, type = 'info') => {
    if (!document.body) {
      console.warn('[Toast] document.body is not available')
      return
    }

    const toastContainer = document.createElement('div')
    document.body.appendChild(toastContainer)
    const root = createRoot(toastContainer)
    root.render(
      <Toast
        message={message}
        type={type}
        onClose={() => {
          root.unmount()
          if (document.body && document.body.contains(toastContainer)) {
            document.body.removeChild(toastContainer)
          }
        }}
      />
    )
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
              width: '176px',
              height: '176px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <svg viewBox="0 0 1126 1024" width="176" height="176" style={{ position: 'absolute', top: 0, left: 0 }}>
                <path
                  d="M164.6848 768C248.96 898.9184 395.9552 985.6 563.2 985.6c167.2448 0 314.24-86.6944 398.5152-217.6h44.9792C918.1696 921.0496 752.704 1024 563.2 1024c-189.504 0-354.9696-102.9632-443.4944-256h44.9792z m362.5984 80.5504l33.2544 17.7408 33.2928-17.2928-6.464 37.1456 26.752 26.496-37.184 5.0816-16.832 33.6384-16.512-33.9712-37.1072-5.5424 27.0592-26.0864-6.2592-37.2096z m229.3248-48.0768l12.9792 35.4944 36.416 9.5104-29.568 23.1936 2.3936 37.6576-31.2704-21.1712-35.0976 13.6448 10.304-36.16-23.9744-29.12 37.6448-1.28 20.1728-31.7696z m-387.712-11.392l20.416 31.7184 37.632 1.28-23.7056 29.1584 10.6112 36.2624-35.0976-13.696-31.104 21.12 2.0992-37.632-29.8368-23.1296 36.3264-9.5744 12.6592-35.4944zM481.024 768c25.8944 8.32 53.504 12.8 82.176 12.8s56.2816-4.48 82.176-12.8l63.2832 0.0128A293.056 293.056 0 0 1 563.2 806.4c-52.9024 0-102.5536-13.952-145.4592-38.4h63.2832zM1075.2 294.4a51.2 51.2 0 0 1 51.2 51.2v332.8a51.2 51.2 0 0 1-51.2 51.2H51.2a51.2 51.2 0 0 1-51.2-51.2V345.6a51.2 51.2 0 0 1 51.2-51.2h1024z m0 38.4H51.2a12.8 12.8 0 0 0-12.7104 11.3024L38.4 345.6v332.8a12.8 12.8 0 0 0 11.3024 12.7104L51.2 691.2h1024a12.8 12.8 0 0 0 12.7104-11.3024L1088 678.4V345.6a12.8 12.8 0 0 0-12.8-12.8zM563.2 0c189.5168 0 354.9824 102.9632 443.5072 256h-44.992C877.4528 125.0944 730.4576 38.4 563.2 38.4S248.9472 125.0944 164.6848 256H119.68C208.2176 102.9632 373.6832 0 563.2 0z m0 217.6c52.9152 0 102.5664 13.952 145.4848 38.4h-63.2704C619.52 247.68 591.872 243.2 563.2 243.2s-56.3072 4.48-82.2144 12.8h-63.2704c42.9056-24.448 92.5696-38.4 145.4848-38.4z m-215.552-81.792l31.104 21.0944 35.0976-13.6832-10.6112 36.2624 23.7056 29.1584-37.632 1.28-20.416 31.7056-12.672-35.5072-36.3136-9.5616 29.824-23.1424-2.0736-37.6192z m431.1808-11.4176l-2.3936 37.6576 29.568 23.1808-36.416 9.5232-12.9792 35.4944-20.1728-31.7824-37.6448-1.2672 23.9744-29.1328-10.304-36.1472 35.0976 13.6448 31.2704-21.1712zM560.1024 79.36l16.832 33.6256 37.184 5.0816-26.752 26.496 6.464 37.1584-33.2928-17.2928-33.2544 17.728 6.272-37.1968-27.072-26.0864 37.12-5.5424L560.1024 79.36z"
                  fill={tradeStatus.color}
                  opacity="0.3"
                />
              </svg>
              <div style={{
                fontSize: '24px',
                color: tradeStatus.color,
                fontWeight: 'bold',
                zIndex: 2,
                textShadow: '0 2px 8px rgba(255,255,255,0.8)',
                opacity: '0.3'
              }}>
                {overallScore > 10 ? (overallScore / 10).toFixed(1) : overallScore}分{tradeStatus.text}
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
                          {[0, 1, 2].map(value => (
                            <button
                              key={value}
                              onClick={() => handleScoreChange(indicator.id, value)}
                              disabled={!isTodaySelected()}
                              className={`px-4 py-1.5 rounded-lg border border-gray-200 hover:border-gray-900 transition-all text-base font-bold min-w-[60px] h-9 ${
                                isTodaySelected() ? 'cursor-pointer' : 'cursor-not-allowed'
                              }`}
                              style={{
                                background: score === value ? '#0F1419' : '#ffffff',
                                color: score === value ? '#ffffff' : '#000',
                                opacity: isTodaySelected() ? 1 : 0.6,
                                borderColor: score === value ? '#0F1419' : undefined
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

              {/* 操作按钮区域 */}
              <div style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  disabled={!isTodaySelected() || isSaving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isTodaySelected() && !isSaving ? 'pointer' : 'not-allowed',
                    opacity: isTodaySelected() && !isSaving ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                >
                  重置
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!isTodaySelected() || isSaving || Object.keys(testScores).length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: isTodaySelected() && !isSaving && Object.keys(testScores).length > 0 ? '#0F1419' : '#d1d5db',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isTodaySelected() && !isSaving && Object.keys(testScores).length > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    marginRight: '20px'
                  }}
                >
                  {isSaving ? '保存中...' : '确定'}
                </motion.button>
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
                  {[...indicators].sort((a, b) => parseInt(a.id) - parseInt(b.id)).map((indicator, index) => (
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
                        {index + 1}. {indicator.name}
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
        <AnimatePresence mode="wait">
          <Modal
            key="edit-modal"
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
          {[...indicators].sort((a, b) => parseInt(a.id) - parseInt(b.id)).map((indicator, index) => (
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
    </AnimatePresence>
      </div>
    </div>
  )
}

export default PsychologicalTest
