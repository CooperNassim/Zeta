import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Database, RefreshCw, CheckCircle, AlertTriangle, X, Clock,
  ArrowUpCircle, ArrowDownCircle, Play, Zap, Trash2,
  ChevronDown, ChevronUp, Activity, Layers, Star, Info,
  Shield, TrendingUp, BarChart3
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

const ProviderInfo = {
  akshare: { label: 'AKSHARE', desc: '免费开源的证券数据库，提供历史数据', fullName: '开源金融数据库，提供基础的股票信息' },
  baostock: { label: 'BAOSTOCK', desc: '免费开源的证券数据平台，提供历史数据', fullName: '免费开源的证券数据平台，提供历史数据' },
  tushare: { label: 'TUSHARE', desc: '专业金融数据API，提供高质量的A股数据和财务指标', fullName: '专业金融数据API，提供高质量的A股数据和财务指标' },
  eastmoney: { label: '东方财富', desc: '东方财富数据接口', fullName: '东方财富数据接口' },
  alphavantage: { label: 'Alpha Vantage', desc: '全球股票、外汇、加密货币数据', fullName: '全球股票、外汇、加密货币数据' },
  yahoo: { label: 'Yahoo Finance', desc: 'Yahoo 金融数据', fullName: 'Yahoo 金融数据' },
  polygon: { label: 'Polygon.io', desc: '美股实时数据', fullName: '美股实时数据' },
  finnhub: { label: 'Finnhub', desc: '全球金融市场数据', fullName: '全球金融市场数据' },
  futu: { label: 'Futu OpenAPI', desc: '富途开放API', fullName: '富途开放API' },
  tiger: { label: 'Tiger Open API', desc: '老虎证券开放API', fullName: '老虎证券开放API' },
  longport: { label: 'Longport', desc: '长桥证券开放API', fullName: '长桥证券开放API' },
}

const getProviderInfo = (provider) => {
  return ProviderInfo[provider?.toLowerCase()] || { label: provider || '未知', desc: '自定义数据源', fullName: '自定义数据源' }
}

const DataSourceCard = ({ source, onTest, testingId, isSelected, onSelect }) => {
  const providerInfo = getProviderInfo(source.provider)
  const isTesting = testingId === source.id
  const isEnabled = source.status === 'enabled'

  const priorityText = source.isDefault ? '优先级：最高' : source.rate_limit ? `速率限制：${source.rate_limit}次/分` : ''

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-[#0F1419] shadow-sm'
          : 'border-transparent hover:border-gray-200'
      } ${
        isEnabled
          ? 'bg-emerald-50/50'
          : 'bg-red-50/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
            isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {isEnabled ? '可用' : '不可用'}
          </span>
          <span className="text-sm font-bold text-gray-900">{providerInfo.label}</span>
          {source.isDefault && (
            <span className="px-1.5 py-0.5 bg-[#0F1419] text-white text-xs rounded">默认</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onTest(source) }}
          disabled={isTesting}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          测试
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-2">{providerInfo.fullName}</p>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          {priorityText || `超时：${source.timeout}s`}
        </span>
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          {source.max_retries || 3} 次重试
        </span>
      </div>

      {source.notes && (
        <p className="text-xs text-gray-400 mt-2 italic">{source.notes}</p>
      )}
    </div>
  )
}

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
  const [dataSources, setDataSources] = useState([])
  const [syncHistory, setSyncHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [selectedSourceId, setSelectedSourceId] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [forceSync, setForceSync] = useState(false)
  const [currentSyncResult, setCurrentSyncResult] = useState(null)
  const [testingId, setTestingId] = useState(null)
  const [expandedHistoryId, setExpandedHistoryId] = useState(null)
  const pollingTimerRef = useRef(null)
  const activeSyncIdRef = useRef(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const fetchDataSources = useCallback(async () => {
    try {
      const res = await fetch('/api/data-sources')
      const result = await res.json()
      if (result.success) {
        setDataSources(result.data)
        const defaults = result.data.filter(s => s.is_default && s.status === 'enabled')
        if (defaults.length > 0 && !selectedSourceId) {
          setSelectedSourceId(defaults[0].id)
        } else if (result.data.length > 0 && !selectedSourceId) {
          setSelectedSourceId(result.data[0].id)
        }
      }
    } catch (e) {
      console.error('获取数据源列表失败', e)
      showToast('获取数据源列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast, selectedSourceId])

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
    fetchDataSources()
    fetchSyncHistory()
  }, [fetchDataSources, fetchSyncHistory])

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

  const handleTest = async (source) => {
    setTestingId(source.id)
    try {
      const res = await fetch(`/api/data-sources/${source.id}/test`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        showToast(`连接成功，延迟 ${result.data.latency}ms`, 'success')
      } else {
        showToast(`连接失败：${result.error}`, 'error')
      }
    } catch (e) {
      showToast('测试失败', 'error')
    } finally {
      setTestingId(null)
    }
  }

  const handleExecuteSync = async () => {
    const source = dataSources.find(s => s.id === selectedSourceId)
    if (!source) {
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
          market: source.market,
          data_source_id: source.id,
          sync_type: 'full',
          force: forceSync
        })
      })
      const result = await res.json()

      if (result.success) {
        showToast('同步任务已启动', 'success')
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

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const Y = d.getFullYear()
    const M = String(d.getMonth() + 1).padStart(2, '0')
    const D = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    const s = String(d.getSeconds()).padStart(2, '0')
    return `${Y}-${M}-${D} ${h}:${m}:${s}`
  }

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '-'
    if (seconds < 60) return `${seconds}秒`
    return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
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

  const enabledSources = dataSources.filter(s => s.status === 'enabled')
  const defaultSource = dataSources.find(s => s.is_default && s.status === 'enabled')
  const recommendedSource = defaultSource || enabledSources[0]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px', background: '#f0f2f5' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '16px', paddingRight: '16px', position: 'relative', paddingBottom: '16px', overflow: 'auto' }}>

        {/* 页面头部 */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">数据同步</h1>
              <p className="text-xs text-gray-400 mt-0.5">管理数据源同步任务，同步股票行情数据</p>
            </div>
          </div>
        </div>

        {/* 主内容区域 - 两栏布局 */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* 左侧 - 数据源状态 */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* 数据源状态卡片 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  数据源状态
                </h3>
                <button
                  onClick={fetchDataSources}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  刷新
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : dataSources.length === 0 ? (
                  <div className="py-8 text-center">
                    <Database className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">暂无数据源</p>
                    <p className="text-xs text-gray-400 mt-1">请前往数据源配置添加</p>
                  </div>
                ) : (
                  dataSources.map(source => (
                    <DataSourceCard
                      key={source.id}
                      source={source}
                      onTest={handleTest}
                      testingId={testingId}
                      isSelected={selectedSourceId === source.id}
                      onSelect={() => setSelectedSourceId(source.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 使用建议 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  使用建议
                </h3>
                <button
                  onClick={fetchDataSources}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  刷新
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    推荐主数据源
                  </h4>
                  {recommendedSource ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-emerald-800">
                          {getProviderInfo(recommendedSource.provider).label}
                        </span>
                        <span className="text-xs text-emerald-600">
                          {recommendedSource.isDefault ? '默认数据源' : '可用数据源'}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-600">
                        Highest priority available data source
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-400">
                      暂无可用的数据源，请先配置
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-400 space-y-1">
                  <p>建议优先使用默认数据源进行同步，系统会自动选择优先级最高的可用数据源。</p>
                  <p>当主数据源不可用时，可手动选择备用数据源。</p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧 - 同步控制 */}
          <div className="w-[420px] flex flex-col gap-4 flex-shrink-0">
            {/* 同步控制 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                  同步控制
                </h3>
              </div>

              <div className="p-4 space-y-4">
                {/* 当前状态 */}
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">当前状态</div>
                  <div className="flex items-center gap-2">
                    {currentSyncResult ? (
                      getStatusBadge(currentSyncResult.status)
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500">空闲</span>
                    )}
                  </div>
                </div>

                {/* 同步统计 */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">同步统计</div>
                  {currentSyncResult ? (
                    <div className="grid grid-cols-4 gap-2">
                      <StatCard label="总数" value={currentSyncResult.total} color="blue" />
                      <StatCard label="新增" value={currentSyncResult.new} color="emerald" />
                      <StatCard label="更新" value={currentSyncResult.updated} color="blue" />
                      <StatCard label="错误" value={currentSyncResult.failed} color={currentSyncResult.failed > 0 ? 'red' : 'gray'} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      <StatCard label="总数" value="—" color="gray" />
                      <StatCard label="新增" value="—" color="gray" />
                      <StatCard label="更新" value="—" color="gray" />
                      <StatCard label="错误" value="—" color="gray" />
                    </div>
                  )}
                </div>

                {/* 使用的数据源 */}
                {currentSyncResult && currentSyncResult.completedAt && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      使用的数据源：
                      <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-700">
                        {dataSources.find(s => s.id === selectedSourceId)?.name || '—'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      完成时间：{formatTime(currentSyncResult.completedAt)}
                    </div>
                  </div>
                )}

                {/* 同步操作 */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-700">同步操作</div>

                  {/* 优先数据源选择 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">优先数据源</div>
                    <div className="relative">
                      <select
                        value={selectedSourceId || ''}
                        onChange={(e) => setSelectedSourceId(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 appearance-none pr-8"
                      >
                        <option value="">选择优先使用的数据源（可选）</option>
                        {dataSources.filter(s => s.status === 'enabled').map(source => (
                          <option key={source.id} value={source.id}>
                            {source.name} ({getProviderInfo(source.provider).label})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* 强制同步开关 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">强制同步</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">否</span>
                      <button
                        onClick={() => setForceSync(!forceSync)}
                        className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${forceSync ? 'bg-blue-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${forceSync ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-xs text-gray-400">是</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">强制同步将忽略正在运行的同步任务</p>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleExecuteSync}
                      disabled={isSyncing}
                      className={`flex-1 px-4 py-2 text-xs font-medium text-white rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        isSyncing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          同步中...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          开始同步
                        </>
                      )}
                    </button>

                    <button
                      onClick={fetchSyncHistory}
                      className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      刷新状态
                    </button>

                    <button
                      className="px-3 py-2 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      清空缓存
                    </button>

                    <button
                      onClick={handleExecuteSync}
                      disabled={isSyncing}
                      className="px-3 py-2 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      强制重新同步
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 同步历史 */}
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
                                {item.data_source_name || getProviderInfo(item.provider).label}
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
                              <div>数据提供商：{item.provider || '-'}</div>
                              <div>同步类型：{item.sync_type === 'full' ? '全量同步' : '增量同步'}</div>
                              <div>完成时间：{item.completed_at ? formatTime(item.completed_at) : '-'}</div>
                              {item.error_message && (
                                <div className="text-red-500 font-mono">{item.error_message}</div>
                              )}
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
        </div>
      </div>
    </div>
  )
}
