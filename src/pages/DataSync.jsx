import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Database, RefreshCw, CheckCircle, AlertTriangle, X, Clock,
  Play, Zap, Activity
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

const BUILTIN_PROVIDERS = [
  { value: 'tushare', label: 'Tushare', market: 'A股', icon: '🇨', desc: '专业金融数据API，提供高质量的A股数据' },
  { value: 'akshare', label: 'AKShare', market: 'A股', icon: '️', desc: '免费开源，通过雪球获取实时行情' },
  { value: 'sina', label: '新浪财经', market: 'A股', icon: '️', desc: '新浪财经免费行情，覆盖沪深两市' },
]

const getProviderInfo = (provider) => {
  const p = BUILTIN_PROVIDERS.find(b => b.value === provider?.toLowerCase())
  return p || { label: provider || '未知', market: '-', desc: '自定义数据源' }
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

const ProviderCard = ({ provider, isSelected, onSelect, isSyncing }) => {
  const info = getProviderInfo(provider.value)
  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
        isSelected ? 'border-[#0F1419] bg-gray-50 shadow-sm' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
      } ${isSyncing ? 'opacity-60 cursor-not-allowed' : ''}`}
      onClick={() => !isSyncing && onSelect(provider.value)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{info.icon}</span>
          <span className="text-sm font-bold text-gray-900">{info.label}</span>
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{info.market}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{info.desc}</p>
    </div>
  )
}

export default function DataSync() {
  const [syncHistory, setSyncHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState('tushare')
  const [isSyncing, setIsSyncing] = useState(false)
  const [forceSync, setForceSync] = useState(false)
  const [currentSyncResult, setCurrentSyncResult] = useState(null)
  const [syncType, setSyncType] = useState('full')
  const [useDateRange, setUseDateRange] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [marketFilter, setMarketFilter] = useState('all')
  const [expandedHistoryId, setExpandedHistoryId] = useState(null)
  const pollingTimerRef = useRef(null)
  const activeSyncIdRef = useRef(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

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
    if (!selectedProvider) {
      showToast('请选择数据提供商', 'warning')
      return
    }

    const provider = BUILTIN_PROVIDERS.find(p => p.value === selectedProvider)
    if (!provider) {
      showToast('无效的数据提供商', 'error')
      return
    }

    setIsSyncing(true)
    setCurrentSyncResult(null)

    try {
      const res = await fetch('/api/sync/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: provider.market,
          provider: provider.value,
          sync_type: syncType,
          force: forceSync,
          start_date: useDateRange && startDate ? startDate.replace(/-/g, '') : null,
          end_date: useDateRange && endDate ? endDate.replace(/-/g, '') : null,
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

  const filteredProviders = marketFilter === 'all'
    ? BUILTIN_PROVIDERS
    : BUILTIN_PROVIDERS.filter(p => p.market === marketFilter)

  const marketCounts = {
    'A股': BUILTIN_PROVIDERS.filter(p => p.market === 'A股').length,
    '美股': BUILTIN_PROVIDERS.filter(p => p.market === '美股').length,
    '港股': BUILTIN_PROVIDERS.filter(p => p.market === '港股').length,
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px', background: '#f0f2f5' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '16px', paddingRight: '16px', position: 'relative', paddingBottom: '16px', overflow: 'auto' }}>
        <div className="flex gap-4 flex-1 min-h-0">
          {/* 左侧 - 数据提供商选择 + 同步历史 */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  数据提供商
                </h3>
              </div>

              <div className="p-4">
                {/* 市场筛选 */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-400 mr-1 font-medium">市场筛选</span>
                  {[
                    { key: 'all', label: '全部', count: BUILTIN_PROVIDERS.length },
                    { key: 'A股', label: 'A股', count: marketCounts['A股'] },
                    { key: '美股', label: '美股', count: marketCounts['美股'] },
                    { key: '港股', label: '港股', count: marketCounts['港股'] },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setMarketFilter(item.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        marketFilter === item.key
                          ? 'bg-[#0F1419] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.label}
                      <span className={`ml-1 ${marketFilter === item.key ? 'text-gray-300' : 'text-gray-400'}`}>({item.count})</span>
                    </button>
                  ))}
                </div>

                {/* 提供商列表 */}
                <div className="grid grid-cols-3 gap-3">
                  {filteredProviders.map(provider => (
                    <ProviderCard
                      key={provider.value}
                      provider={provider}
                      isSelected={selectedProvider === provider.value}
                      onSelect={setSelectedProvider}
                      isSyncing={isSyncing}
                    />
                  ))}
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

                {/* 完成时间 */}
                {currentSyncResult && currentSyncResult.completedAt && (
                  <div className="text-xs text-gray-500">
                    完成时间：{formatTime(currentSyncResult.completedAt)}
                  </div>
                )}

                {/* 同步操作 */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-700">同步操作</div>

                  {/* 同步范围选择 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">同步范围</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setUseDateRange(false)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                          !useDateRange
                            ? 'border-[#0F1419] bg-[#0F1419] text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        最近一个交易日
                      </button>
                      <button
                        onClick={() => { setUseDateRange(true); }}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                          useDateRange
                            ? 'border-[#0F1419] bg-[#0F1419] text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        日期区间
                      </button>
                    </div>
                  </div>

                  {/* 日期区间选择器 */}
                  {selectedProvider === 'tushare' && useDateRange && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">选择日期区间</div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">开始日期</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">结束日期</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">将获取区间内所有交易日的行情数据（Tushare专用）</p>
                    </div>
                  )}

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
                      刷新
                    </button>

                    <button
                      onClick={handleExecuteSync}
                      disabled={isSyncing}
                      className="px-3 py-2 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      强制同步
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
