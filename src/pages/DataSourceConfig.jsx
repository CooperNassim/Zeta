import React, { useState, useEffect, useCallback } from 'react'
import {
  Database, Plus, Edit, Trash2, CheckCircle, AlertTriangle, X, RefreshCw,
  Globe, Activity, Eye, EyeOff, Zap, Settings, Link, Clock, Info
} from 'lucide-react'

// 数据源提供商配置
const PROVIDER_CONFIGS = {
  'A股': [
    { value: 'tushare', label: 'Tushare', defaultUrl: 'https://api.tushare.pro', apiKeyPlaceholder: 'Tushare API Token' },
    { value: 'akshare', label: 'AKShare', defaultUrl: '', apiKeyPlaceholder: '无需 API Key' },
    { value: 'wind', label: 'Wind 万得', defaultUrl: '', apiKeyPlaceholder: 'Wind API Key' },
    { value: 'eastmoney', label: '东方财富', defaultUrl: '', apiKeyPlaceholder: '无需 API Key' },
    { value: 'custom', label: '自定义', defaultUrl: '', apiKeyPlaceholder: '请输入 API Key' },
  ],
  '美股': [
    { value: 'alphavantage', label: 'Alpha Vantage', defaultUrl: 'https://www.alphavantage.co', apiKeyPlaceholder: 'Alpha Vantage API Key' },
    { value: 'polygon', label: 'Polygon.io', defaultUrl: 'https://api.polygon.io', apiKeyPlaceholder: 'Polygon API Key' },
    { value: 'finnhub', label: 'Finnhub', defaultUrl: 'https://finnhub.io/api/v1', apiKeyPlaceholder: 'Finnhub API Key' },
    { value: 'yahoo', label: 'Yahoo Finance', defaultUrl: 'https://query1.finance.yahoo.com', apiKeyPlaceholder: '无需 API Key' },
    { value: 'iex', label: 'IEX Cloud', defaultUrl: 'https://cloud.iexapis.com/v1', apiKeyPlaceholder: 'IEX Token' },
    { value: 'custom', label: '自定义', defaultUrl: '', apiKeyPlaceholder: '请输入 API Key' },
  ],
  '港股': [
    { value: 'futu', label: 'Futu OpenAPI', defaultUrl: '', apiKeyPlaceholder: 'Futu API Key' },
    { value: 'tiger', label: 'Tiger Open API', defaultUrl: 'https://api.tigerbrokers.com', apiKeyPlaceholder: 'Tiger API Key' },
    { value: 'longport', label: 'Longport (富途)', defaultUrl: 'https://openapi.longportapp.com', apiKeyPlaceholder: 'Longport App Key' },
    { value: 'yahoo', label: 'Yahoo Finance', defaultUrl: 'https://query1.finance.yahoo.com', apiKeyPlaceholder: '无需 API Key' },
    { value: 'custom', label: '自定义', defaultUrl: '', apiKeyPlaceholder: '请输入 API Key' },
  ],
}

// 市场类型选项
const MARKET_OPTIONS = [
  { value: 'A股', label: 'A股', icon: '🇨🇳', desc: '沪深京 A 股' },
  { value: '美股', label: '美股', icon: '🇺🇸', desc: '纳斯达克、纽交所' },
  { value: '港股', label: '港股', icon: '🇭🇰', desc: '香港联合交易所' },
]

// Toast 提示组件
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

// 确认弹窗组件
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'warning' }) => {
  if (!isOpen) return null
  const typeConfig = {
    warning: { icon: AlertTriangle, iconColor: 'text-amber-500', btnClass: 'bg-amber-600 hover:bg-amber-700' },
    danger: { icon: Trash2, iconColor: 'text-red-500', btnClass: 'bg-red-600 hover:bg-red-700' },
  }
  const config = typeConfig[type] || typeConfig.warning
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-gray-50">
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              取消
            </button>
            <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${config.btnClass}`}>
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 数据源编辑弹窗
const DataSourceModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    market: '',
    provider: '',
    name: '',
    apiUrl: '',
    apiKey: '',
    apiSecret: '',
    rateLimit: 60,
    maxRetries: 3,
    timeout: 10,
    isDefault: false,
    status: 'enabled',
    notes: '',
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData })
      } else {
        setFormData({
          market: '',
          provider: '',
          name: '',
          apiUrl: '',
          apiKey: '',
          apiSecret: '',
          rateLimit: 60,
          maxRetries: 3,
          timeout: 10,
          isDefault: false,
          status: 'enabled',
          notes: '',
        })
      }
      setShowApiKey(false)
      setErrors({})
    }
  }, [isOpen, initialData])

  const handleMarketChange = (market) => {
    setFormData({ ...formData, market, provider: '' })
  }

  const handleProviderChange = (provider) => {
    const providerConfig = PROVIDER_CONFIGS[formData.market]?.find(p => p.value === provider)
    setFormData({
      ...formData,
      provider,
      apiUrl: providerConfig?.defaultUrl || formData.apiUrl,
    })
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.market) newErrors.market = '请选择市场类型'
    if (!formData.provider) newErrors.provider = '请选择数据提供商'
    if (!formData.name) newErrors.name = '请输入数据源名称'
    if (!formData.apiUrl && formData.provider !== 'akshare' && formData.provider !== 'eastmoney' && formData.provider !== 'yahoo') {
      newErrors.apiUrl = '请输入 API 地址'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validate()) {
      onSave(formData)
      onClose()
    }
  }

  if (!isOpen) return null

  const currentProviders = PROVIDER_CONFIGS[formData.market] || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{initialData ? '编辑数据源' : '添加数据源'}</h3>
          <p className="text-xs text-gray-400 mt-0.5">配置股票行情数据源连接信息</p>
        </div>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* 市场类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="text-red-500">* </span>市场类型
            </label>
            <div className="grid grid-cols-3 gap-3">
              {MARKET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleMarketChange(opt.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.market === opt.value
                      ? 'border-[#0F1419] bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">{opt.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-400">{opt.desc}</div>
                </button>
              ))}
            </div>
            {errors.market && <p className="text-xs text-red-500 mt-1">{errors.market}</p>}
          </div>

          {/* 数据提供商 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="text-red-500">* </span>数据提供商
            </label>
            <div className="grid grid-cols-5 gap-2">
              {currentProviders.map(p => (
                <button
                  key={p.value}
                  onClick={() => handleProviderChange(p.value)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    formData.provider === p.value
                      ? 'border-[#0F1419] bg-[#0F1419] text-white'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {errors.provider && <p className="text-xs text-red-500 mt-1">{errors.provider}</p>}
          </div>

          {/* 数据源名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="text-red-500">* </span>数据源名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：我的 Tushare 数据源"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F1419]"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* API 地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              API 地址
            </label>
            <input
              type="text"
              value={formData.apiUrl}
              onChange={e => setFormData({ ...formData, apiUrl: e.target.value })}
              placeholder={PROVIDER_CONFIGS[formData.market]?.find(p => p.value === formData.provider)?.apiKeyPlaceholder || 'https://api.example.com'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F1419] font-mono"
            />
          </div>

          {/* API Key / Secret */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F1419] font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                API Secret
              </label>
              <input
                type="password"
                value={formData.apiSecret}
                onChange={e => setFormData({ ...formData, apiSecret: e.target.value })}
                placeholder="API Secret（可选）"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F1419] font-mono"
              />
            </div>
          </div>

          {/* 高级设置 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">高级设置</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">速率限制（次/分钟）</label>
                <input
                  type="number"
                  value={formData.rateLimit}
                  onChange={e => setFormData({ ...formData, rateLimit: parseInt(e.target.value) || 60 })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0F1419]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">最大重试次数</label>
                <input
                  type="number"
                  value={formData.maxRetries}
                  onChange={e => setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 3 })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0F1419]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">超时时间（秒）</label>
                <input
                  type="number"
                  value={formData.timeout}
                  onChange={e => setFormData({ ...formData, timeout: parseInt(e.target.value) || 10 })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0F1419]"
                />
              </div>
            </div>
          </div>

          {/* 设为默认 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${formData.isDefault ? 'bg-[#0F1419]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${formData.isDefault ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-600">设为默认数据源</span>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              备注
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="可选备注信息"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F1419] resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#0F1419' }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// 连接测试状态
const ConnectionStatus = ({ status, latency }) => {
  if (status === 'testing') {
    return <span className="flex items-center gap-1.5 text-xs text-blue-600"><RefreshCw className="w-3 h-3 animate-spin" />测试中...</span>
  }
  if (status === 'success') {
    return <span className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle className="w-3 h-3" />已连接 · {latency}ms</span>
  }
  if (status === 'error') {
    return <span className="flex items-center gap-1.5 text-xs text-red-600"><X className="w-3 h-3" />连接失败</span>
  }
  return <span className="text-xs text-gray-400">未测试</span>
}

export default function DataSourceConfig() {
  const [dataSources, setDataSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', type: 'warning', onConfirm: null })
  const [showModal, setShowModal] = useState(false)
  const [editingSource, setEditingSource] = useState(null)
  const [filterMarket, setFilterMarket] = useState('all')
  const [testingId, setTestingId] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const fetchDataSources = useCallback(async () => {
    try {
      const res = await fetch('/api/data-sources')
      const result = await res.json()
      if (result.success) setDataSources(result.data)
    } catch (e) {
      console.error('获取数据源列表失败', e)
      showToast('获取数据源列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchDataSources()
  }, [fetchDataSources])

  const handleSave = async (formData) => {
    try {
      const method = editingSource ? 'PUT' : 'POST'
      const url = editingSource ? `/api/data-sources/${editingSource.id}` : '/api/data-sources'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await res.json()
      if (result.success) {
        showToast(editingSource ? '数据源已更新' : '数据源已添加', 'success')
        fetchDataSources()
      } else {
        showToast(result.error || '操作失败', 'error')
      }
    } catch (e) {
      showToast('操作失败', 'error')
    }
  }

  const handleDelete = (id) => {
    setConfirmModal({
      open: true,
      title: '删除数据源',
      message: '确定要删除此数据源吗？删除后将无法使用该数据源下载行情数据。',
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }))
        try {
          const res = await fetch(`/api/data-sources/${id}`, { method: 'DELETE' })
          const result = await res.json()
          if (result.success) {
            showToast('数据源已删除', 'success')
            fetchDataSources()
          } else {
            showToast(result.error || '删除失败', 'error')
          }
        } catch (e) {
          showToast('删除失败', 'error')
        }
      }
    })
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled'
    try {
      const res = await fetch(`/api/data-sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const result = await res.json()
      if (result.success) {
        showToast(`数据源已${newStatus === 'enabled' ? '启用' : '停用'}`, 'success')
        fetchDataSources()
      } else {
        showToast('操作失败', 'error')
      }
    } catch (e) {
      showToast('操作失败', 'error')
    }
  }

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

  const handleEdit = (source) => {
    setEditingSource(source)
    setShowModal(true)
  }

  const filteredSources = filterMarket === 'all'
    ? dataSources
    : dataSources.filter(s => s.market === filterMarket)

  const marketCounts = {
    'A股': dataSources.filter(s => s.market === 'A股').length,
    '美股': dataSources.filter(s => s.market === '美股').length,
    '港股': dataSources.filter(s => s.market === '港股').length,
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px', background: '#f7f8fa' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
      <DataSourceModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingSource(null) }}
        onSave={handleSave}
        initialData={editingSource}
      />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '0px', paddingRight: '10px', position: 'relative', paddingBottom: '10px', overflow: 'auto' }}>
        {/* 页面头部 */}
        <div className="bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">数据源配置</h1>
                <p className="text-xs text-gray-400 mt-0.5">管理股票行情数据源，支持 A股 / 美股 / 港股</p>
              </div>
            </div>
            <button
              onClick={() => { setEditingSource(null); setShowModal(true) }}
              className="px-3.5 py-2 bg-[#0F1419] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              添加数据源
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 市场筛选 */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 mb-5 flex items-center gap-2">
            <span className="text-xs text-gray-400 mr-1 font-medium">市场筛选</span>
            {[
              { key: 'all', label: '全部', count: dataSources.length },
              { key: 'A股', label: 'A股', count: marketCounts['A股'] },
              { key: '美股', label: '美股', count: marketCounts['美股'] },
              { key: '港股', label: '港股', count: marketCounts['港股'] },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilterMarket(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMarket === item.key
                    ? 'bg-[#0F1419] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
                <span className={`ml-1 ${filterMarket === item.key ? 'text-gray-300' : 'text-gray-400'}`}>({item.count})</span>
              </button>
            ))}
          </div>

          {/* 数据源列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-16">
              <div className="flex flex-col items-center justify-center text-gray-400">
                <Database className="w-12 h-12 mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">暂无数据源</p>
                <p className="text-xs mt-1 mb-4">点击上方"添加数据源"开始配置</p>
                <button
                  onClick={() => { setEditingSource(null); setShowModal(true) }}
                  className="px-4 py-2 bg-[#0F1419] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  添加第一个数据源
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSources.map(source => (
                <div
                  key={source.id}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* 市场图标 */}
                      <div className={`p-3 rounded-xl ${
                        source.market === 'A股' ? 'bg-red-50' :
                        source.market === '美股' ? 'bg-blue-50' : 'bg-green-50'
                      }`}>
                        <span className="text-xl">
                          {source.market === 'A股' ? '🇨🇳' : source.market === '美股' ? '🇺🇸' : '🇭🇰'}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">{source.name}</h3>
                          {source.isDefault && (
                            <span className="px-1.5 py-0.5 bg-[#0F1419] text-white text-xs rounded">默认</span>
                          )}
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            source.status === 'enabled' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {source.status === 'enabled' ? '启用' : '停用'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {source.market} · {source.provider}
                          </span>
                          {source.apiUrl && (
                            <span className="flex items-center gap-1 font-mono text-gray-400">
                              <Link className="w-3 h-3" />
                              {source.apiUrl}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            速率限制：{source.rateLimit} 次/分钟
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            超时：{source.timeout}s · 重试：{source.maxRetries} 次
                          </span>
                          {source.notes && (
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              {source.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTest(source)}
                        className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        测试
                      </button>
                      <button
                        onClick={() => handleToggleStatus(source.id, source.status)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                          source.status === 'enabled'
                            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {source.status === 'enabled' ? '停用' : '启用'}
                      </button>
                      <button
                        onClick={() => handleEdit(source)}
                        className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 使用说明 */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mt-5">
            <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              使用说明
            </h4>
            <div className="text-xs text-blue-600 space-y-1.5 leading-relaxed">
              <p>1. <strong>数据源配置</strong>：为不同市场（A股/美股/港股）配置对应的数据提供商和连接信息。</p>
              <p>2. <strong>默认数据源</strong>：每个市场最多只能设置一个默认数据源，行情下载时将优先使用默认数据源。</p>
              <p>3. <strong>连接测试</strong>：点击"测试"按钮可验证数据源配置是否正确，确保能够正常连接。</p>
              <p>4. <strong>速率限制</strong>：建议根据数据提供商的 API 限制设置合理的速率，避免请求被拒绝。</p>
              <p>5. <strong>API Key 安全</strong>：API Key 和 Secret 将加密存储，请妥善保管您的密钥信息。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
