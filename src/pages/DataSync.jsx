import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Database, RefreshCw, CheckCircle, AlertTriangle, X, Clock,
  Play, Zap, Activity, TrendingUp, BarChart3
} from 'lucide-react'

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl border shadow-lg flex items-center gap-3 ${styles[type]}`}>
      {type === 'success' && <CheckCircle className="w-4 h-4" />}
      {type === 'error' && <AlertTriangle className="w-4 h-4" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

const SOURCES = [
  { value: 'tushare', label: 'Tushare', desc: '专业金融数据API，提供高质量的A股数据', tag: '推荐', tagColor: 'bg-emerald-50 text-emerald-600' },
  { value: 'akshare', label: 'AKShare', desc: '免费开源，通过雪球获取实时行情', tag: '免费', tagColor: 'bg-blue-50 text-blue-600' },
  { value: 'sina', label: '新浪财经', desc: '新浪财经免费行情，覆盖沪深两市', tag: '免费', tagColor: 'bg-blue-50 text-blue-600' },
]

const StatCard = ({ icon: Icon, label, value, subLabel, color = 'blue' }) => {
  const colorMap = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
      <div className={`text-2xl font-bold ${colorMap[color]} mb-1`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {subLabel && <div className="text-xs text-gray-400 mt-0.5">{subLabel}</div>}
    </div>
  )
}

export default function DataSync() {
  const [syncHistory, setSyncHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [selectedSource, setSelectedSource] = useState('tushare')
  const [isSyncing, setIsSyncing] = useState(false)
  const [forceSync, setForceSync] = useState(false)
  const [currentSyncResult, setCurrentSyncResult] = useState(null)
  const [syncType, setSyncType] = useState('full')
  const [useDateRange, setUseDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedHistoryId, setExpandedHistoryId] = useState(null)
  const pollingTimerRef = useRef(null)
  const activeSyncIdRef = useRef(null)
  const indicatorPollingRef = useRef(null)
  const historicalPollingRef = useRef(null)
  
  // 技术指标计算状态
  const [indicatorTaskId, setIndicatorTaskId] = useState(null)
  const [indicatorTask, setIndicatorTask] = useState(null)
  
  // 历史数据初始化状态
  const [historicalTaskId, setHistoricalTaskId] = useState(null)
  const [historicalTask, setHistoricalTask] = useState(null)

  // 清理定时器
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
      if (indicatorPollingRef.current) clearInterval(indicatorPollingRef.current)
      if (historicalPollingRef.current) clearInterval(historicalPollingRef.current)
    }
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  // 恢复指标计算状态
  useEffect(() => {
    const savedTaskId = localStorage.getItem('indicatorTaskId')
    if (savedTaskId) {
      setIndicatorTaskId(savedTaskId)
      fetchIndicatorProgress(savedTaskId)
    }
  }, [])

  const saveIndicatorTaskId = (taskId) => {
    if (taskId) {
      localStorage.setItem('indicatorTaskId', taskId)
    } else {
      localStorage.removeItem('indicatorTaskId')
    }
  }

  const fetchIndicatorProgress = useCallback(async (taskId) => {
    if (!taskId) return
    try {
      const res = await fetch(`/api/market/calculate-indicators/${taskId}`)
      const result = await res.json()
      if (result.success) {
        setIndicatorTask(result.data)
        if (['completed', 'failed', 'stopped'].includes(result.data.status)) {
          clearInterval(indicatorPollingRef.current)
          indicatorPollingRef.current = null
          saveIndicatorTaskId(null)
          if (result.data.status === 'completed' && !result.data.stopped) {
            showToast(`指标计算完成：成功 ${result.data.successCount}，失败 ${result.data.failedCount}`, 'success')
          } else if (result.data.stopped) {
            showToast(`指标计算已停止：已处理 ${result.data.processed} 只股票`, 'warning')
          } else {
            showToast(`指标计算失败：${result.data.error}`, 'error')
          }
        }
      }
    } catch (e) {
      console.error('获取指标进度失败', e)
    }
  }, [showToast])

  const startIndicatorPolling = useCallback((taskId) => {
    setIndicatorTaskId(taskId)
    saveIndicatorTaskId(taskId)
    fetchIndicatorProgress(taskId)
    indicatorPollingRef.current = setInterval(() => {
      fetchIndicatorProgress(taskId)
    }, 1000)
  }, [fetchIndicatorProgress])

  const stopIndicatorCalculation = useCallback(async () => {
    if (!indicatorTaskId) return
    try {
      await fetch(`/api/market/calculate-indicators/${indicatorTaskId}/stop`, { method: 'POST' })
      showToast('已发送停止请求', 'success')
    } catch (e) {
      showToast('停止失败', 'error')
    }
  }, [indicatorTaskId, showToast])

  // 恢复历史数据初始化状态
  useEffect(() => {
    const savedTaskId = localStorage.getItem('historicalTaskId')
    if (savedTaskId) {
      setHistoricalTaskId(savedTaskId)
      fetchHistoricalProgress(savedTaskId)
    }
  }, [])

  const saveHistoricalTaskId = (taskId) => {
    if (taskId) {
      localStorage.setItem('historicalTaskId', taskId)
    } else {
      localStorage.removeItem('historicalTaskId')
    }
  }

  const fetchHistoricalProgress = useCallback(async (taskId) => {
    if (!taskId) return
    try {
      const res = await fetch(`/api/market/calculate-indicators/${taskId}`)
      const result = await res.json()
      if (result.success) {
        setHistoricalTask(result.data)
        if (['completed', 'failed', 'stopped'].includes(result.data.status)) {
          clearInterval(historicalPollingRef.current)
          historicalPollingRef.current = null
          saveHistoricalTaskId(null)
          if (result.data.status === 'completed' && !result.data.stopped) {
            showToast(`历史数据初始化完成：成功 ${result.data.successCount}，失败 ${result.data.failedCount}`, 'success')
          } else if (result.data.stopped) {
            showToast(`历史数据初始化已停止：已处理 ${result.data.processed} 只股票`, 'warning')
          } else {
            showToast(`历史数据初始化失败：${result.data.error}`, 'error')
          }
        }
      }
    } catch (e) {
      console.error('获取历史数据进度失败', e)
    }
  }, [showToast])

  const startHistoricalPolling = useCallback((taskId) => {
    setHistoricalTaskId(taskId)
    saveHistoricalTaskId(taskId)
    fetchHistoricalProgress(taskId)
    historicalPollingRef.current = setInterval(() => {
      fetchHistoricalProgress(taskId)
    }, 1000)
  }, [fetchHistoricalProgress])

  const stopHistoricalInit = useCallback(async () => {
    if (!historicalTaskId) return
    try {
      await fetch(`/api/market/calculate-indicators/${historicalTaskId}/stop`, { method: 'POST' })
      showToast('已发送停止请求', 'success')
    } catch (e) {
      showToast('停止失败', 'error')
    }
  }, [historicalTaskId, showToast])

  const handleInitHistoricalData = async () => {
    try {
      const res = await fetch('/api/market/init-historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ years: 10, period: 'D', provider: selectedSource }),
      })
      const result = await res.json()
      if (result.success && result.data?.taskId) {
        startHistoricalPolling(result.data.taskId)
        showToast(`历史数据初始化已启动（数据源: ${SOURCES.find(s => s.value === selectedSource)?.label || selectedSource}）`, 'success')
      } else {
        showToast(result.error || '历史数据初始化启动失败', 'error')
      }
    } catch (e) {
      showToast('历史数据初始化请求失败', 'error')
    }
  }

  const fetchSyncHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/sync-history?page=1&pageSize=20')
      const result = await res.json()
      if (result.success) setSyncHistory(result.data)
    } catch (e) {
      console.error('获取同步历史失败', e)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSyncHistory()
  }, [fetchSyncHistory])

  const startSyncPolling = useCallback((historyId) => {
    activeSyncIdRef.current = historyId
    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/sync-history/${historyId}`)
        const result = await res.json()
        if (result.success && result.data) {
          const history = result.data
          if (history.status === 'success' || history.status === 'failed') {
            clearInterval(pollingTimerRef.current)
            setIsSyncing(false)
            activeSyncIdRef.current = null
            setCurrentSyncResult({
              total: history.total_count,
              new: history.new_count,
              updated: history.updated_count,
              failed: history.failed_count,
              status: history.status,
              error: history.error_message,
              duration: history.completed_at && history.started_at
                ? Math.round((new Date(history.completed_at) - new Date(history.started_at)) / 1000)
                : null,
              completedAt: history.completed_at,
              usedSources: history.used_sources || []
            })
            fetchSyncHistory()
          }
        }
      } catch (e) {
        console.error('轮询同步状态失败', e)
      }
    }, 1500)
  }, [fetchSyncHistory])

  const handleExecuteSync = async () => {
    if (!selectedSource) {
      showToast('请选择数据源', 'warning')
      return
    }

    setIsSyncing(true)
    setCurrentSyncResult(null)

    try {
      const res = await fetch('/api/sync/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: 'A股',
          provider: selectedSource,
          sync_type: syncType,
          force: forceSync,
          start_date: useDateRange && startDate ? startDate.replace(/-/g, '') : null,
          end_date: useDateRange && endDate ? endDate.replace(/-/g, '') : null,
        })
      })
      const result = await res.json()

      if (result.success) {
        if (result.data?.indicatorCalcTriggered) {
          showToast('同步任务已启动，技术指标预计算已自动触发', 'success')
        } else {
          showToast('同步任务已启动', 'success')
        }
        startSyncPolling(result.data.history_id)
      } else {
        setIsSyncing(false)
        showToast(result.error || '同步启动失败', 'error')
      }
    } catch (e) {
      setIsSyncing(false)
      showToast('同步请求失败', 'error')
    }
  }

  const handleCalculateIndicators = async () => {
    try {
      const res = await fetch('/api/market/calculate-indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json()
      if (result.success && result.data?.taskId) {
        startIndicatorPolling(result.data.taskId)
        showToast('指标计算已启动', 'success')
      } else {
        showToast(result.error || '指标计算启动失败', 'error')
      }
    } catch (e) {
      showToast('指标计算请求失败', 'error')
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }

  const getStatusBadge = (status) => {
    const config = {
      running: { label: '运行中', class: 'bg-blue-50 text-blue-600', icon: RefreshCw },
      success: { label: '成功', class: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
      failed: { label: '失败', class: 'bg-red-50 text-red-600', icon: X },
    }
    const c = config[status] || { label: status, class: 'bg-gray-100 text-gray-600', icon: Clock }
    return (
      <span className={`px-2 py-0.5 text-xs rounded font-medium flex items-center gap-1 ${c.class}`}>
        <c.icon className="w-3 h-3" />
        {c.label}
      </span>
    )
  }

  const getTaskStatusBadge = (task) => {
    if (!task) return <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500">未开始</span>
    const config = {
      running: { label: '进行中', class: 'bg-blue-50 text-blue-600', icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
      completed: { label: '已完成', class: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle className="w-3 h-3" /> },
      stopped: { label: '已停止', class: 'bg-amber-50 text-amber-600', icon: <X className="w-3 h-3" /> },
      failed: { label: '失败', class: 'bg-red-50 text-red-600', icon: <AlertTriangle className="w-3 h-3" /> },
    }
    const c = config[task.status] || config.running
    return (
      <span className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${c.class}`}>
        {c.icon}{c.label}
      </span>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px', background: '#f0f2f5' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '16px', paddingRight: '16px', position: 'relative', paddingBottom: '16px', overflow: 'auto' }}>
        <div className="flex gap-4 flex-1 min-h-0">
          {/* 左侧 ~60% */}
          <div className="flex-[3] flex flex-col gap-4 min-w-0">
            {/* 第一行：技术指标预计算 + 历史数据初始化 左右并列 */}
            <div className="flex gap-4">
              {/* 技术指标预计算 */}
              <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    技术指标预计算
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">计算状态</div>
                    {getTaskStatusBadge(indicatorTask)}
                  </div>
                  {indicatorTask && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">进度</span>
                        <span className="font-medium text-gray-700">{indicatorTask.processed || 0} / {indicatorTask.total || '-'}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            indicatorTask.status === 'running' ? 'bg-blue-500' :
                            indicatorTask.status === 'completed' ? 'bg-emerald-500' :
                            indicatorTask.status === 'stopped' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${indicatorTask.progress || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">{indicatorTask.progress || 0}%</div>
                      {indicatorTask.status !== 'running' && (
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-white rounded-lg border border-gray-100 p-2 text-center">
                            <div className="text-lg font-bold text-blue-600">{indicatorTask.total || '-'}</div>
                            <div className="text-xs text-gray-400">总数</div>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-100 p-2 text-center">
                            <div className="text-lg font-bold text-emerald-600">{indicatorTask.successCount || 0}</div>
                            <div className="text-xs text-gray-400">成功</div>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-100 p-2 text-center">
                            <div className={`text-lg font-bold ${indicatorTask.failedCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>{indicatorTask.failedCount || 0}</div>
                            <div className="text-xs text-gray-400">失败</div>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-100 p-2 text-center">
                            <div className="text-lg font-bold text-gray-600">{indicatorTask.skippedCount || 0}</div>
                            <div className="text-xs text-gray-400">跳过</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {indicatorTask?.duration && (
                    <div className="text-xs text-gray-500">
                      耗时：{indicatorTask.duration > 1000 ? `${(indicatorTask.duration / 1000).toFixed(1)}秒` : `${indicatorTask.duration}ms`}
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    {indicatorTask?.status === 'running' ? (
                      <button
                        onClick={stopIndicatorCalculation}
                        className="w-full px-3 py-2 text-xs font-medium text-white rounded-lg bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />停止计算
                      </button>
                    ) : (
                      <button
                        onClick={handleCalculateIndicators}
                        className="w-full px-3 py-2 text-xs font-medium text-white rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />计算指标
                      </button>
                    )}
                    <p className="text-xs text-gray-400 mt-1">为所有股票预计算技术指标，每日15:01自动执行</p>
                  </div>
                </div>
              </div>

              {/* 历史数据初始化 */}
              <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-500" />
                    历史数据初始化
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">初始化状态</div>
                    {getTaskStatusBadge(historicalTask)}
                  </div>
                  {historicalTask && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">进度</span>
                        <span className="font-medium text-gray-700">{historicalTask.processed || 0} / {historicalTask.total || '-'}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            historicalTask.status === 'running' ? 'bg-indigo-500' :
                            historicalTask.status === 'completed' ? 'bg-emerald-500' :
                            historicalTask.status === 'stopped' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${historicalTask.progress || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">{historicalTask.progress || 0}%</div>
                      {historicalTask.status !== 'running' && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white rounded-lg border border-gray-100 p-2 text-center">
                            <div className="text-lg font-bold text-emerald-600">{historicalTask.successCount || 0}</div>
                            <div className="text-xs text-gray-400">成功</div>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-100 p-2 text-center">
                            <div className={`text-lg font-bold ${historicalTask.failedCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>{historicalTask.failedCount || 0}</div>
                            <div className="text-xs text-gray-400">失败</div>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-100 p-2 text-center">
                            <div className="text-lg font-bold text-gray-600">{historicalTask.skippedCount || 0}</div>
                            <div className="text-xs text-gray-400">跳过</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {historicalTask?.duration && (
                    <div className="text-xs text-gray-500">
                      耗时：{historicalTask.duration > 60000 ? `${(historicalTask.duration / 60000).toFixed(1)}分钟` : `${(historicalTask.duration / 1000).toFixed(0)}秒`}
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100">
                    {historicalTask?.status === 'running' ? (
                      <button
                        onClick={stopHistoricalInit}
                        className="w-full px-3 py-2 text-xs font-medium text-white rounded-lg bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />停止初始化
                      </button>
                    ) : (
                      <button
                        onClick={handleInitHistoricalData}
                        className="w-full px-3 py-2 text-xs font-medium text-white rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Database className="w-3.5 h-3.5" />初始化10年数据
                      </button>
                    )}
                    <p className="text-xs text-gray-400 mt-1">拉取约10年K线数据，仅首次使用需要</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 第二行：同步历史 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex-1 min-h-0">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  同步历史
                </h3>
              </div>
              <div className="p-2 max-h-[280px] overflow-y-auto">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                ) : syncHistory.length === 0 ? (
                  <div className="py-6 text-center">
                    <Database className="w-6 h-6 text-gray-200 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">暂无同步记录</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {syncHistory.slice(0, 10).map(item => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                      >
                        <div className="px-3 py-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(item.status)}
                              <span className="text-xs font-medium text-gray-700">
                                {item.data_source_name || SOURCES.find(s => s.value === item.provider)?.label || '未知'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">{formatTime(item.started_at)}</span>
                          </div>
                          {item.total_count > 0 && (
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>总 {item.total_count}</span>
                              <span className="text-emerald-600">新增 {item.new_count}</span>
                              <span className="text-blue-600">更新 {item.updated_count}</span>
                              {item.failed_count > 0 && <span className="text-red-600">失败 {item.failed_count}</span>}
                            </div>
                          )}
                          {expandedHistoryId === item.id && (
                            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                              <div>数据源：{item.provider || '-'}</div>
                              <div>同步类型：{item.sync_type === 'full' ? '全量同步' : '增量同步'}</div>
                              <div>完成时间：{item.completed_at ? formatTime(item.completed_at) : '-'}</div>
                              {item.error_message && <div className="text-red-500 font-mono">{item.error_message}</div>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧 ~40% - 同步控制 */}
          <div className="flex-[2] min-w-0 flex flex-col">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                  同步控制
                </h3>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* 数据源选择 */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">数据源</div>
                  <div className="space-y-2">
                    {SOURCES.map(src => (
                      <div
                        key={src.value}
                        className={`rounded-xl border-2 p-3 transition-all cursor-pointer ${
                          selectedSource === src.value
                            ? 'border-[#0F1419] bg-gray-50'
                            : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                        } ${isSyncing ? 'opacity-60 cursor-not-allowed' : ''}`}
                        onClick={() => !isSyncing && setSelectedSource(src.value)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{src.label}</span>
                            <span className={`px-1.5 py-0.5 text-xs rounded ${src.tagColor}`}>{src.tag}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{src.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 当前状态 */}
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">当前状态</div>
                  {currentSyncResult ? getStatusBadge(currentSyncResult.status) : (
                    <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500">空闲</span>
                  )}
                </div>

                {/* 同步统计 */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">同步统计</div>
                  <div className="grid grid-cols-4 gap-2">
                    {currentSyncResult ? (
                      <>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                          <div className="text-xl font-bold text-blue-600">{currentSyncResult.total}</div>
                          <div className="text-xs text-gray-400">总数</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                          <div className="text-xl font-bold text-emerald-600">{currentSyncResult.new}</div>
                          <div className="text-xs text-gray-400">新增</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                          <div className="text-xl font-bold text-blue-600">{currentSyncResult.updated}</div>
                          <div className="text-xs text-gray-400">更新</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                          <div className={`text-xl font-bold ${currentSyncResult.failed > 0 ? 'text-red-600' : 'text-gray-600'}`}>{currentSyncResult.failed}</div>
                          <div className="text-xs text-gray-400">错误</div>
                        </div>
                      </>
                    ) : (
                      ['总数', '新增', '更新', '错误'].map(l => (
                        <div key={l} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                          <div className="text-xl font-bold text-gray-300">—</div>
                          <div className="text-xs text-gray-400">{l}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 同步操作 */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-700">同步设置</div>

                  {/* 同步范围 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">同步范围</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setUseDateRange(false)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                          !useDateRange ? 'border-[#0F1419] bg-[#0F1419] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        最近交易日
                      </button>
                      <button
                        onClick={() => setUseDateRange(true)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                          useDateRange ? 'border-[#0F1419] bg-[#0F1419] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        日期区间
                      </button>
                    </div>
                  </div>

                  {/* 日期区间 */}
                  {selectedSource === 'tushare' && useDateRange && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">开始日期</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">结束日期</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}

                  {/* 强制同步 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">强制同步</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">否</span>
                      <button onClick={() => setForceSync(!forceSync)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${forceSync ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${forceSync ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-xs text-gray-400">是</span>
                    </div>
                  </div>

                  {/* 按钮 */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleExecuteSync} disabled={isSyncing}
                      className={`flex-1 px-4 py-2 text-xs font-medium text-white rounded-lg flex items-center justify-center gap-1.5 ${
                        isSyncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                      }`}>
                      {isSyncing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />同步中...</> : <><Play className="w-3.5 h-3.5" />开始同步</>}
                    </button>
                    <button onClick={fetchSyncHistory}
                      className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" />刷新
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
