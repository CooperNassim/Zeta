import React, { useState, useEffect, useCallback } from 'react'
import {
  Database, Plus, Edit, Trash2, CheckCircle, AlertTriangle, X, RefreshCw,
  Brain, Zap, Eye, EyeOff, Settings, Link, Clock, Info, Cpu, Sparkles
} from 'lucide-react'

// 大模型提供商配置
const PROVIDER_CONFIGS = {
  'OpenAI': [
    { value: 'gpt-4o', label: 'GPT-4o', defaultUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', defaultUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4-turbo', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', defaultUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-3.5-turbo', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'o1-preview', label: 'o1 Preview', defaultUrl: 'https://api.openai.com/v1', defaultModel: 'o1-preview', maxTokens: 32768, maxTokensLabel: '32768' },
    { value: 'custom', label: '自定义模型', defaultUrl: 'https://api.openai.com/v1', defaultModel: '', maxTokens: 4096, maxTokensLabel: '' },
  ],
  'Anthropic': [
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', defaultUrl: 'https://api.anthropic.com', defaultModel: 'claude-3-5-sonnet-latest', maxTokens: 8192, maxTokensLabel: '8192' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus', defaultUrl: 'https://api.anthropic.com', defaultModel: 'claude-3-opus-latest', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku', defaultUrl: 'https://api.anthropic.com', defaultModel: 'claude-3-haiku-latest', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'custom', label: '自定义模型', defaultUrl: 'https://api.anthropic.com', defaultModel: '', maxTokens: 4096, maxTokensLabel: '' },
  ],
  '国内大模型': [
    { value: 'qwen-turbo', label: '通义千问 Turbo', defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-turbo', maxTokens: 8192, maxTokensLabel: '8192' },
    { value: 'qwen-plus', label: '通义千问 Plus', defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus', maxTokens: 8192, maxTokensLabel: '8192' },
    { value: 'qwen-max', label: '通义千问 Max', defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-max', maxTokens: 8192, maxTokensLabel: '8192' },
    { value: 'glm-4', label: '智谱清言 GLM-4', defaultUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'glm-4-flash', label: '智谱 GLM-4 Flash', defaultUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'kimi', label: 'Kimi Moonshot', defaultUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k', maxTokens: 8192, maxTokensLabel: '8192' },
    { value: 'ernie', label: '文心一言 ERNIE', defaultUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop', defaultModel: 'ernie-4.0-8k', maxTokens: 8192, maxTokensLabel: '8192' },
    { value: 'spark', label: '讯飞星火 Spark', defaultUrl: 'https://spark-api-open.xf-yun.com/v1', defaultModel: 'generalv3.5', maxTokens: 8192, maxTokensLabel: '8192' },
    { value: 'hunyuan', label: '腾讯混元 Hunyuan', defaultUrl: 'https://api.hunyuan.cloud.tencent.com/v1', defaultModel: 'hunyuan-standard', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'custom', label: '自定义模型', defaultUrl: '', defaultModel: '', maxTokens: 4096, maxTokensLabel: '' },
  ],
  '其他': [
    { value: 'gemini-pro', label: 'Google Gemini Pro', defaultUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', defaultModel: 'gemini-pro', maxTokens: 8192, maxTokensLabel: '8192' },
    { value: 'deepseek-chat', label: 'DeepSeek Chat', defaultUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'minimax', label: 'MiniMax', defaultUrl: 'https://api.minimax.chat/v1', defaultModel: 'abab6.5-chat', maxTokens: 4096, maxTokensLabel: '4096' },
    { value: 'custom', label: '自定义模型', defaultUrl: '', defaultModel: '', maxTokens: 4096, maxTokensLabel: '' },
  ],
}

// 提供商分类选项
const CATEGORY_OPTIONS = [
  { value: 'OpenAI', label: 'OpenAI', icon: '🟢', desc: 'GPT-4/4o/3.5' },
  { value: 'Anthropic', label: 'Anthropic', icon: '🟣', desc: 'Claude 系列' },
  { value: '国内大模型', label: '国内大模型', icon: '🔵', desc: '通义/智谱/Kimi等' },
  { value: '其他', label: '其他', icon: '🟡', desc: 'Gemini/DeepSeek等' },
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

// 大模型编辑弹窗
const LLModelModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    category: '',
    provider: '',
    name: '',
    modelId: '',
    apiUrl: '',
    apiKey: '',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
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
          category: '',
          provider: '',
          name: '',
          modelId: '',
          apiUrl: '',
          apiKey: '',
          maxTokens: 4096,
          temperature: 0.7,
          topP: 1.0,
          frequencyPenalty: 0,
          presencePenalty: 0,
          isDefault: false,
          status: 'enabled',
          notes: '',
        })
      }
      setShowApiKey(false)
      setErrors({})
    }
  }, [isOpen, initialData])

  const handleCategoryChange = (category) => {
    setFormData({ ...formData, category, provider: '', modelId: '', apiUrl: '' })
  }

  const handleProviderChange = (provider) => {
    const providerConfig = PROVIDER_CONFIGS[formData.category]?.find(p => p.value === provider)
    setFormData({
      ...formData,
      provider,
      modelId: providerConfig?.defaultModel || formData.modelId,
      apiUrl: providerConfig?.defaultUrl || formData.apiUrl,
      maxTokens: providerConfig?.maxTokens || formData.maxTokens,
    })
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.category) newErrors.category = '请选择模型分类'
    if (!formData.provider) newErrors.provider = '请选择模型提供商'
    if (!formData.name) newErrors.name = '请输入模型名称'
    if (!formData.modelId) newErrors.modelId = '请输入模型 ID'
    if (!formData.apiUrl) newErrors.apiUrl = '请输入 API 地址'
    if (!formData.apiKey) newErrors.apiKey = '请输入 API Key'
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

  const currentProviders = PROVIDER_CONFIGS[formData.category] || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{initialData ? '编辑大模型' : '添加大模型'}</h3>
          <p className="text-xs text-gray-400 mt-0.5">配置大语言模型 API 连接信息</p>
        </div>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* 模型分类选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="text-red-500">* </span>模型分类
            </label>
            <div className="grid grid-cols-4 gap-3">
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleCategoryChange(opt.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.category === opt.value
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
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          {/* 模型提供商 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="text-red-500">* </span>模型提供商
            </label>
            <div className="grid grid-cols-4 gap-2">
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

          {/* 模型名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="text-red-500">* </span>模型名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：我的 GPT-4o 模型"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F1419]"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* 模型 ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="text-red-500">* </span>模型 ID
            </label>
            <input
              type="text"
              value={formData.modelId}
              onChange={e => setFormData({ ...formData, modelId: e.target.value })}
              placeholder="gpt-4o / claude-3-5-sonnet-latest 等"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F1419] font-mono"
            />
            {errors.modelId && <p className="text-xs text-red-500 mt-1">{errors.modelId}</p>}
          </div>

          {/* API 地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="text-red-500">* </span>API 地址
            </label>
            <input
              type="text"
              value={formData.apiUrl}
              onChange={e => setFormData({ ...formData, apiUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0F1419] font-mono"
            />
            {errors.apiUrl && <p className="text-xs text-red-500 mt-1">{errors.apiUrl}</p>}
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="text-red-500">* </span>API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
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
            {errors.apiKey && <p className="text-xs text-red-500 mt-1">{errors.apiKey}</p>}
          </div>

          {/* 高级设置 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">生成参数</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">最大 Tokens</label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={e => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 4096 })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0F1419]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.temperature}
                  onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0.7 })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0F1419]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Top P</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.topP}
                  onChange={e => setFormData({ ...formData, topP: parseFloat(e.target.value) || 1.0 })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0F1419]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frequency Penalty</label>
                <input
                  type="number"
                  step="0.1"
                  min="-2"
                  max="2"
                  value={formData.frequencyPenalty}
                  onChange={e => setFormData({ ...formData, frequencyPenalty: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#0F1419]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Presence Penalty</label>
                <input
                  type="number"
                  step="0.1"
                  min="-2"
                  max="2"
                  value={formData.presencePenalty}
                  onChange={e => setFormData({ ...formData, presencePenalty: parseFloat(e.target.value) || 0 })}
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
            <span className="text-sm text-gray-600">设为默认大模型</span>
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

export default function LLModelConfig() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', type: 'warning', onConfirm: null })
  const [showModal, setShowModal] = useState(false)
  const [editingModel, setEditingModel] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [testingId, setTestingId] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/llm-configs')
      const result = await res.json()
      if (result.success) setModels(result.data)
    } catch (e) {
      console.error('获取大模型列表失败', e)
      showToast('获取大模型列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const handleSave = async (formData) => {
    try {
      const method = editingModel ? 'PUT' : 'POST'
      const url = editingModel ? `/api/llm-configs/${editingModel.id}` : '/api/llm-configs'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await res.json()
      if (result.success) {
        showToast(editingModel ? '大模型已更新' : '大模型已添加', 'success')
        fetchModels()
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
      title: '删除大模型',
      message: '确定要删除此大模型配置吗？删除后将无法使用该模型进行 AI 分析。',
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }))
        try {
          const res = await fetch(`/api/llm-configs/${id}`, { method: 'DELETE' })
          const result = await res.json()
          if (result.success) {
            showToast('大模型已删除', 'success')
            fetchModels()
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
      const res = await fetch(`/api/llm-configs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const result = await res.json()
      if (result.success) {
        showToast(`大模型已${newStatus === 'enabled' ? '启用' : '停用'}`, 'success')
        fetchModels()
      } else {
        showToast('操作失败', 'error')
      }
    } catch (e) {
      showToast('操作失败', 'error')
    }
  }

  const handleTest = async (model) => {
    setTestingId(model.id)
    try {
      const res = await fetch(`/api/llm-configs/${model.id}/test`, { method: 'POST' })
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

  const handleEdit = (model) => {
    setEditingModel(model)
    setShowModal(true)
  }

  const filteredModels = filterCategory === 'all'
    ? models
    : models.filter(m => m.category === filterCategory)

  const categoryCounts = {
    'OpenAI': models.filter(m => m.category === 'OpenAI').length,
    'Anthropic': models.filter(m => m.category === 'Anthropic').length,
    '国内大模型': models.filter(m => m.category === '国内大模型').length,
    '其他': models.filter(m => m.category === '其他').length,
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
      <LLModelModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingModel(null) }}
        onSave={handleSave}
        initialData={editingModel}
      />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '0px', paddingRight: '10px', position: 'relative', paddingBottom: '10px', overflow: 'auto' }}>
        {/* 页面头部 */}
        <div className="bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">大模型配置</h1>
                <p className="text-xs text-gray-400 mt-0.5">管理大语言模型 API 配置，支持 Agent 和智能分析调用</p>
              </div>
            </div>
            <button
              onClick={() => { setEditingModel(null); setShowModal(true) }}
              className="px-3.5 py-2 bg-[#0F1419] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              添加大模型
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 分类筛选 */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 mb-5 flex items-center gap-2">
            <span className="text-xs text-gray-400 mr-1 font-medium">分类筛选</span>
            {[
              { key: 'all', label: '全部', count: models.length },
              { key: 'OpenAI', label: 'OpenAI', count: categoryCounts['OpenAI'] },
              { key: 'Anthropic', label: 'Anthropic', count: categoryCounts['Anthropic'] },
              { key: '国内大模型', label: '国内大模型', count: categoryCounts['国内大模型'] },
              { key: '其他', label: '其他', count: categoryCounts['其他'] },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilterCategory(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterCategory === item.key
                    ? 'bg-[#0F1419] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
                <span className={`ml-1 ${filterCategory === item.key ? 'text-gray-300' : 'text-gray-400'}`}>({item.count})</span>
              </button>
            ))}
          </div>

          {/* 大模型列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-16">
              <div className="flex flex-col items-center justify-center text-gray-400">
                <Brain className="w-12 h-12 mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">暂无大模型配置</p>
                <p className="text-xs mt-1 mb-4">点击上方"添加大模型"开始配置</p>
                <button
                  onClick={() => { setEditingModel(null); setShowModal(true) }}
                  className="px-4 py-2 bg-[#0F1419] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  添加第一个大模型
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredModels.map(model => (
                <div
                  key={model.id}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* 分类图标 */}
                      <div className={`p-3 rounded-xl ${
                        model.category === 'OpenAI' ? 'bg-green-50' :
                        model.category === 'Anthropic' ? 'bg-purple-50' :
                        model.category === '国内大模型' ? 'bg-blue-50' : 'bg-amber-50'
                      }`}>
                        <Cpu className={`w-5 h-5 ${
                          model.category === 'OpenAI' ? 'text-green-600' :
                          model.category === 'Anthropic' ? 'text-purple-600' :
                          model.category === '国内大模型' ? 'text-blue-600' : 'text-amber-600'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">{model.name}</h3>
                          {model.isDefault && (
                            <span className="px-1.5 py-0.5 bg-[#0F1419] text-white text-xs rounded">默认</span>
                          )}
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            model.status === 'enabled' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {model.status === 'enabled' ? '启用' : '停用'}
                          </span>
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-mono rounded">{model.modelId}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {model.category} · {model.provider}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-gray-400">
                            <Link className="w-3 h-3" />
                            {model.apiUrl}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            Max Tokens: {model.maxTokens}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Temperature: {model.temperature}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Top P: {model.topP}
                          </span>
                          {model.notes && (
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              {model.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTest(model)}
                        className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        测试
                      </button>
                      <button
                        onClick={() => handleToggleStatus(model.id, model.status)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                          model.status === 'enabled'
                            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {model.status === 'enabled' ? '停用' : '启用'}
                      </button>
                      <button
                        onClick={() => handleEdit(model)}
                        className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
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
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 mt-5">
            <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              使用说明
            </h4>
            <div className="text-xs text-purple-600 space-y-1.5 leading-relaxed">
              <p>1. <strong>模型配置</strong>：支持配置多种大语言模型，包括 OpenAI GPT、Anthropic Claude、通义千问、智谱清言等。</p>
              <p>2. <strong>默认模型</strong>：可设置一个默认大模型，Agent 和智能分析功能将优先使用默认模型。</p>
              <p>3. <strong>连接测试</strong>：点击"测试"按钮可验证 API 配置是否正确，确保能够正常调用模型。</p>
              <p>4. <strong>生成参数</strong>：Temperature 控制随机性（越高越随机），Top P 控制采样范围，Penalty 控制重复度。</p>
              <p>5. <strong>API Key 安全</strong>：API Key 将加密存储，请妥善保管您的密钥信息，切勿泄露给他人。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
