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

  console.log('[PsychologicalTest] RENDERING', { indicators, psychologicalTests, testScores })

  const getTestResultForDate = (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const tests = psychologicalTests || []
      const result = tests.find(test => {
        if (!test || !test.date) return false
        return test.date === dateStr
      })
      console.log('[PsychologicalTest] getTestResultForDate:', { date: dateStr, result })
      return result
    } catch (e) {
      console.error('[PsychologicalTest] getTestResultForDate error:', e)
      return null
    }
  }

  useEffect(() => {
    try {
      const today = new Date()
      const testResult = getTestResultForDate(today)
      if (testResult) {
        console.log('[PsychologicalTest] 初始化: 设置今天的分数', testResult.scores)
        setTestScores(testResult.scores || {})
      } else {
        console.log('[PsychologicalTest] 初始化: 没有今天的测试记录')
        setTestScores({})
      }
    } catch (e) {
      console.error('[PsychologicalTest] useEffect init error:', e)
      setTestScores({})
    }
  }, [])

  useEffect(() => {
    try {
      console.log('[PsychologicalTest] selectedDate 发生变化')
      console.log('[PsychologicalTest] selectedDate:', format(selectedDate, 'yyyy-MM-dd'))
      
      const currentTestResult = getTestResultForDate(selectedDate)
      console.log('[PsychologicalTest] 当前选中日期的测试结果:', currentTestResult)
      
      const isToday = isTodaySelected()
      const hasScores = Object.keys(testScores || {}).length > 0
      
      if (currentTestResult && (!isToday || !hasScores)) {
        console.log('[PsychologicalTest] 同步数据:', currentTestResult.scores)
        setTestScores(currentTestResult.scores || {})
      } else if (!currentTestResult && !isToday) {
        console.log('[PsychologicalTest] 无数据，清空分数')
        setTestScores({})
      }
    } catch (e) {
      console.error('[PsychologicalTest] useEffect selectedDate error:', e)
    }
  }, [selectedDate])

  const handleDateClick = (date) => {
    try {
      console.log('[PsychologicalTest] 切换日期:', date)
      setSelectedDate(date)
      const testResult = getTestResultForDate(date)
      if (testResult) {
        console.log('[PsychologicalTest] 切换日期: 找到测试记录', testResult.scores)
        setTestScores(testResult.scores || {})
      } else {
        console.log('[PsychologicalTest] 切换日期: 没有测试记录')
        setTestScores({})
      }
    } catch (e) {
      console.error('[PsychologicalTest] handleDateClick error:', e)
    }
  }

  const getScoreColor = (score) => {
    try {
      const finalScore = score
      if (finalScore >= 7) return '#22c55e'
      return '#ef4444'
    } catch (e) {
      return '#666'
    }
  }

  const getDotColor = (score) => {
    try {
      const finalScore = score
      if (finalScore >= 7 && finalScore <= 8) return '#22c55e'
      if ((finalScore >= 5 && finalScore <= 6) || (finalScore >= 9 && finalScore <= 10)) return '#f59e0b'
      return '#ef4444'
    } catch (e) {
      return '#666'
    }
  }

  const calculateOverallScore = (scores) => {
    try {
      console.log('[PsychologicalTest] calculateOverallScore called with:', { scores, testScores, indicators })
      
      // 如果 indicators 无效，直接返回 0
      if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
        console.log('[PsychologicalTest] calculateOverallScore: indicators is not a valid array')
        return 0
      }
      
      const scoreData = (scores ?? testScores ?? {})
      
      let totalScore = 0
      
      for (let i = 0; i < indicators.length; i++) {
        const indicator = indicators[i]
        console.log('[PsychologicalTest] calculateOverallScore: processing indicator', i, indicator)
        
        // 彻底检查每个 indicator
        if (!indicator || typeof indicator !== 'object' || indicator === null) {
          console.log('[PsychologicalTest] calculateOverallScore: skipping invalid indicator', i)
          continue
        }
        
        const indicatorId = indicator.id
        const indicatorMinScore = indicator.minScore ?? 0
        
        // 获取分数，优先从传参，其次从testScores，最后从indicator.minScore
        let score = indicatorMinScore
        if (scoreData && typeof scoreData === 'object' && scoreData !== null) {
          if (scoreData[indicatorId] !== undefined && scoreData[indicatorId] !== null) {
            score = scoreData[indicatorId]
          }
        }
        
        // 确保分数是个数字
        const finalScore = parseFloat(score ?? indicatorMinScore ?? 0)
        
        // 直接累加分数（单项0-2分，满分10分）
        totalScore += finalScore
      }
      
      const result = totalScore.toFixed(2)
      console.log('[PsychologicalTest] calculateOverallScore result:', result)
      return parseFloat(result)
    } catch (e) {
      console.error('[PsychologicalTest] calculateOverallScore ERROR:', e)
      return 0
    }
  }

  const handleScoreChange = (indicatorId, value) => {
    try {
      if (!isTodaySelected()) {
        return
      }
      const newScores = { ...(testScores || {}), [indicatorId]: parseInt(value) }
      setTestScores(newScores)
    } catch (e) {
      console.error('[PsychologicalTest] handleScoreChange error:', e)
    }
  }

  const handleReset = () => {
    try {
      if (!isTodaySelected()) {
        showToast('只能重置当天的测试', 'warning')
        return
      }
      setTestScores({})
    } catch (e) {
      console.error('[PsychologicalTest] handleReset error:', e)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!isTodaySelected()) {
        showToast('只能提交当天的测试', 'warning')
        return
      }

      if (Object.keys(testScores || {}).length === 0) {
        showToast('请先完成所有打分项', 'warning')
        return
      }

      setIsSaving(true)
      const currentScores = { ...(testScores || {}) }

      const overallScore = calculateOverallScore()
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const store = useStore.getState()

      const existingTest = (psychologicalTests || []).find(test => {
        if (!test || !test.date) return false
        return test.date === dateStr
      })

      let response
      if (existingTest) {
        response = await store.updatePsychologicalTest(dateStr, {
          scores: currentScores,
          overallScore: parseFloat(overallScore)
        })
      } else {
        response = await store.addPsychologicalTest({
          scores: currentScores,
          overallScore: parseFloat(overallScore),
          date: dateStr
        })
      }

      if (response && response.success) {
        showToast(existingTest ? '测试已更新' : '测试结果已保存', 'success')
        setTestScores(currentScores)
      } else {
        const errorMsg = response?.error || '未知错误'
        console.error('[PsychologicalTest] 保存失败:', errorMsg)
        showToast(`保存失败: ${errorMsg}`, 'error')
      }

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
      for (let index = 0; index < newIndicators.length; index++) {
        const result = await updatePsychologicalIndicator(newIndicators[index].id, newIndicators[index])
        if (!result.success) {
          throw new Error(`更新指标 ${newIndicators[index].name} 失败: ${result.error}`)
        }
      }
      setShowEditModal(false)
      showToast('更新成功', 'success')
    } catch (error) {
      console.error('[PsychologicalTest] 更新指标失败:', error)
      showToast('更新失败', 'error')
    }
  }

  const generateCalendar = () => {
    try {
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDay = firstDay.getDay()
      const daysInMonth = lastDay.getDate()

      const days = []
      for (let i = 0; i < startDay; i++) {
        days.push({ day: null, date: null })
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        days.push({ day, date })
      }
      return days
    } catch (e) {
      console.error('[PsychologicalTest] generateCalendar error:', e)
      return []
    }
  }

  const calendarDays = generateCalendar()

  const changeMonth = (delta) => {
    try {
      const newDate = new Date(selectedDate)
      newDate.setMonth(newDate.getMonth() + delta)
      setSelectedDate(newDate)
    } catch (e) {
      console.error('[PsychologicalTest] changeMonth error:', e)
    }
  }

  const selectedTestResult = getTestResultForDate(selectedDate)
  const overallScore = selectedTestResult?.overallScore !== undefined && selectedTestResult?.overallScore !== null
    ? parseFloat(selectedTestResult.overallScore)
    : calculateOverallScore()
  const scoreColor = getScoreColor(overallScore)

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
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

        const testResult = getTestResultForDate(selectedDate)
        if (testResult) {
          setTestScores(testResult.scores || {})
        } else {
          setTestScores({})
        }

        showToast('数据已刷新', 'success')
      }
    } catch (error) {
      console.error('刷新失败:', error)
      showToast('刷新失败', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getTradeStatus = (score) => {
    try {
      const finalScore = score > 10 ? score / 10 : score
      if (finalScore >= 7 && finalScore <= 8) {
        return { color: '#22c55e', text: '可以交易' }
      }
      if ((finalScore >= 5 && finalScore <= 6) || (finalScore >= 9 && finalScore <= 10)) {
        return { color: '#f59e0b', text: '谨慎交易' }
      }
      return { color: '#ef4444', text: '禁止交易' }
    } catch (e) {
      return { color: '#666', text: '状态未知' }
    }
  }

  const tradeStatus = getTradeStatus(overallScore)

  const isTodaySelected = () => {
    try {
      const today = new Date()
      const selectedStr = format(selectedDate, 'yyyy-MM-dd')
      const todayStr = format(today, 'yyyy-MM-dd')
      return selectedStr === todayStr
    } catch (e) {
      return false
    }
  }

  const showToast = (message, type = 'info') => {
    try {
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
    } catch (e) {
      console.error('[Toast] error:', e)
    }
  }

  const safeIndicators = Array.isArray(indicators) ? indicators : []

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '0px', paddingRight: '10px', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '7.8fr 2.2fr', gap: '10px', marginTop: '10px', flex: 1, minHeight: 0, paddingBottom: '10px' }}>
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

            {Object.keys(testScores || {}).length > 0 && (
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
              <svg viewBox="0 0 1126 1024" version="1.1" width="176" height="176" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.4 }}>
                <path
                  d="M164.6848 768C248.96 898.9184 395.9552 985.6 563.2 985.6c167.2448 0 314.24-86.6944 398.5152-217.6h44.9792C918.1696 921.0496 752.704 1024 563.2 1024c-189.504 0-354.9696-102.9632-443.4944-256h44.9792z m362.5984 80.5504l33.2544 17.7408 33.2928-17.2928-6.464 37.1456 26.752 26.496-37.184 5.0816-16.832 33.6384-16.512-33.9712-37.1072-5.5424 27.0592-26.0864-6.2592-37.2096z m229.3248-48.0768l12.9792 35.4944 36.416 9.5104-29.568 23.1936 2.3936 37.6576-31.2704-21.1712-35.0976 13.6448 10.304-36.16-23.9744-29.12 37.6448-1.28 20.1728-31.7696z m-387.712-11.392l20.416 31.7184 37.632 1.28-23.7056 29.1584 10.6112 36.2624-35.0976-13.696-31.104 21.12 2.0992-37.632-29.8368-23.1296 36.3264-9.5744 12.6592-35.4944zM481.024 768c25.8944 8.32 53.504 12.8 82.176 12.8s56.2816-4.48 82.176-12.8l63.2832 0.0128A293.056 293.056 0 0 1 563.2 806.4c-52.9024 0-102.5536-13.952-145.4592-38.4h63.2832zM1075.2 294.4a51.2 51.2 0 0 1 51.2 51.2v332.8a51.2 51.2 0 0 1-51.2 51.2H51.2a51.2 51.2 0 0 1-51.2-51.2V345.6a51.2 51.2 0 0 1 51.2-51.2h1024z m0 38.4H51.2a12.8 12.8 0 0 0-12.7104 11.3024L38.4 345.6v332.8a12.8 12.8 0 0 0 11.3024 12.7104L51.2 691.2h1024a12.8 12.8 0 0 0 12.7104-11.3024L1088 678.4V345.6a12.8 12.8 0 0 0-12.8-12.8zM563.2 0c189.5168 0 354.9824 102.9632 443.5072 256h-44.992C877.4528 125.0944 730.4576 38.4 563.2 38.4S248.9472 125.0944 164.6848 256H119.68C208.2176 102.9632 373.6832 0 563.2 0z m0 217.6c52.9152 0 102.5664 13.952 145.4848 38.4h-63.2704C619.52 247.68 591.872 243.2 563.2 243.2s-56.3072 4.48-82.2144 12.8h-63.2704c42.9056-24.448 92.5696-38.4 145.4848-38.4z m-215.552-81.792l31.104 21.0944 35.0976-13.6832-10.6112 36.2624 23.7056 29.1584-37.632 1.28-20.416 31.7056-12.672-35.5072-36.3136-9.5616 29.824-23.1424-2.0736-37.6192z m431.1808-11.4176l-2.3936 37.6576 29.568 23.1808-36.416 9.5232-12.9792 35.4944-20.1728-31.7824-37.6448-1.2672 23.9744-29.1328-10.304-36.1472 35.0976 13.6448 31.2704-21.1712zM560.1024 79.36l16.832 33.6256 37.184 5.0816-26.752 26.496 6.464 37.1584-33.2928-17.2928-33.2544 17.728 6.272-37.1968-27.072-26.0864 37.12-5.5424L560.1024 79.36z"
                  fill={tradeStatus.color}
                />
              </svg>
              <div style={{
                fontSize: '24px',
                color: tradeStatus.color,
                fontWeight: 'bold',
                zIndex: 2,
                textShadow: '0 2px 8px rgba(255,255,255,0.8)',
                opacity: 0.4
              }}>
                {overallScore}分{tradeStatus.text}
              </div>
            </div>
            )}

            <div style={{ flex: 1, overflow: 'auto', marginTop: '10px', minHeight: 0, paddingBottom: '0px' }}>
              <div>
                {[...safeIndicators].sort((a, b) => parseInt(a.id) - parseInt(b.id)).map((indicator, index) => {
                  const score = testScores?.[indicator.id]
                  const displayIndex = index + 1

                  return (
                    <div key={indicator.id} style={{ marginBottom: index < safeIndicators.length - 1 ? '17px' : '0px', paddingBottom: '17px', borderBottom: index < safeIndicators.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
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
                          {displayIndex}
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
                  disabled={!isTodaySelected() || isSaving || Object.keys(testScores || {}).length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: isTodaySelected() && !isSaving && Object.keys(testScores || {}).length > 0 ? '#0F1419' : '#d1d5db',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isTodaySelected() && !isSaving && Object.keys(testScores || {}).length > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    marginRight: '20px'
                  }}
                >
                  {isSaving ? '保存中...' : '确定'}
                </motion.button>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            height: 'calc(100vh - 52px - 20px)'
          }}>
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

              <div style={{
                flex: 1,
                overflow: 'auto',
                minHeight: 0
              }}>
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
                  {[...safeIndicators].sort((a, b) => parseInt(a.id) - parseInt(b.id)).map((indicator, index) => {
                    const displayIndex = index + 1
                    return (
                      <div
                        key={indicator.id}
                        style={{
                          padding: '10px 14px',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F1419', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayIndex}. {indicator.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {indicator.description}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                    const newIndicators = safeIndicators.map(indicator => ({
                      ...indicator,
                      name: document.getElementById(`indicator-name-${indicator.id}`)?.value ?? indicator.name,
                      description: document.getElementById(`indicator-desc-${indicator.id}`)?.value ?? indicator.description
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
          {[...safeIndicators].sort((a, b) => parseInt(a.id) - parseInt(b.id)).map((indicator, index) => {
            const displayIndex = index + 1
            return (
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
                    {displayIndex}
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
            )
          })}
        </div>
      </Modal>
    </AnimatePresence>
      </div>
    </div>
  )
}

export default PsychologicalTest