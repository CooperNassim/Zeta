import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Database, Server, HardDrive, Activity, Clock, Power, RotateCcw, Play,
  Download, Upload, Trash2, AlertTriangle, CheckCircle, X, RefreshCw,
  FolderOpen, FileText, Calendar, BarChart3, Layers, Zap,
  ChevronDown, ChevronRight, Search, Wifi, WifiOff, Eye, EyeOff, Copy
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// 格式化运行时间
const formatUptime = (uptime) => {
  if (!uptime) return '—'
  // Handle object like {hours, minutes, seconds}
  if (typeof uptime === 'object' && uptime !== null) {
    if (uptime.hours !== undefined) {
      return `${uptime.hours}h ${uptime.minutes || 0}m`
    }
    return JSON.stringify(uptime)
  }
  const uptimeStr = String(uptime)
  if (uptimeStr.includes(':')) {
    const parts = uptimeStr.split(':')
    return `${parts[0]}h ${parseInt(parts[1] || 0)}m`
  }
  return uptimeStr || '—'
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(1)} ${units[i]}`
}

// 格式化版本号，提取 PostgreSQL 版本
const extractPgVersion = (versionStr) => {
  if (!versionStr) return '-'
  const match = versionStr.match(/PostgreSQL\s+([\d.]+)/)
  return match ? match[1] : versionStr.substring(0, 40)
}

// 状态指示灯组件
const StatusIndicator = ({ status }) => {
  return (
    <span className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      <span className={`text-sm font-medium ${status === 'online' ? 'text-emerald-600' : 'text-red-500'}`}>
        {status === 'online' ? '已连接' : '已断开'}
      </span>
    </span>
  )
}

// 状态卡片组件
const StatCard = ({ icon: Icon, label, value, color = 'blue', subValue }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {subValue && <div className="text-xs text-gray-400 mt-1">{subValue}</div>}
    </div>
  )
}

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
    <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl border shadow-lg flex items-center gap-3 animate-slide-in ${styles[type]}`}>
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
            <div className={`p-3 rounded-full bg-gray-50`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${config.btnClass}`}
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DatabaseManagement() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('db_active_tab') || 'overview')
  const [dbInfo, setDbInfo] = useState(null)
  const [dbStatus, setDbStatus] = useState(null)
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', type: 'warning', onConfirm: null })
  const [expandedTable, setExpandedTable] = useState(null)
  const [dbEnabled, setDbEnabled] = useState(true)
  const fileInputRef = React.useRef(null)

  // 获取认证头
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  const fetchDbInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/database/info', { headers: getAuthHeaders() })
      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return
      }
      const result = await res.json()
      if (result.success) setDbInfo(result.data)
    } catch (e) {
      console.error('获取数据库信息失败', e)
    }
  }, [])

  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/database/status', { headers: getAuthHeaders() })
      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return
      }
      const result = await res.json()
      if (result.success) {
        setDbStatus(result.data)
        if (result.data.enabled !== undefined) setDbEnabled(result.data.enabled)
      }
    } catch (e) {
      setDbStatus({ connected: false, error: '连接失败' })
    }
  }, [])

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch('/api/database/backups', { headers: getAuthHeaders() })
      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return
      }
      const result = await res.json()
      if (result.success) setBackups(result.data)
    } catch (e) {
      console.error('获取备份列表失败', e)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchDbInfo(), fetchDbStatus(), fetchBackups()])
    setLoading(false)
  }, [fetchDbInfo, fetchDbStatus, fetchBackups])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // 数据库操作
  const handleTest = async () => {
    await fetchDbStatus()
    showToast(`测试完成，延迟 ${dbStatus?.latency || '?'}ms`, 'success')
  }

  const handleRestart = async () => {
    try {
      const res = await fetch('/api/database/restart', { method: 'POST', headers: getAuthHeaders() })
      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return
      }
      const result = await res.json()
      if (result.success) {
        showToast('重启成功', 'success')
        await refreshAll()
      } else {
        showToast(`重启失败: ${result.error || '未知错误'}`, 'error')
      }
    } catch (e) {
      showToast('重启失败', 'error')
    }
  }

  const handleToggle = async () => {
    try {
      const res = await fetch('/api/database/toggle', { 
        method: 'POST', 
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled: !dbEnabled })
      })
      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return
      }
      const result = await res.json()
      if (result.success) {
        setDbEnabled(result.enabled)
        showToast(result.enabled ? '数据库已开启' : '数据库已关闭', 'success')
        await refreshAll()
      } else {
        showToast(`切换失败: ${result.message || '未知错误'}`, 'error')
      }
    } catch (e) {
      showToast('切换失败', 'error')
    }
  }

  const handleBackup = async () => {
    try {
      const res = await fetch('/api/database/backup', { method: 'POST', headers: getAuthHeaders() })
      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return
      }
      const result = await res.json()
      if (result.success) {
        showToast(`备份成功：${result.data.fileName}`, 'success')
        await fetchBackups()
      }
    } catch (e) {
      showToast('备份失败', 'error')
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch('/api/database/export', { method: 'POST', headers: getAuthHeaders() })
      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return
      }
      const result = await res.json()
      if (result.success) {
        showToast(`导出成功：${result.data.fileName}`, 'success')
        await fetchBackups()
      }
    } catch (e) {
      showToast('导出失败', 'error')
    }
  }

  const handleRestore = async (filename) => {
    setConfirmModal({
      open: true,
      title: '恢复数据库',
      message: `确定要从备份 "${filename}" 恢复吗？这将覆盖当前数据库中的所有数据。`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }))
        try {
          const res = await fetch('/api/database/restore', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ filename })
          })
          if (res.status === 401) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            window.location.href = '/login'
            return
          }
          const result = await res.json()
          if (result.success) {
            showToast('数据恢复成功', 'success')
            await refreshAll()
          } else {
            showToast(`恢复失败：${result.error}`, 'error')
          }
        } catch (e) {
          showToast('恢复失败', 'error')
        }
      }
    })
  }

  const handleDeleteBackup = async (filename) => {
    setConfirmModal({
      open: true,
      title: '删除备份',
      message: `确定要删除备份 "${filename}" 吗？此操作不可恢复。`,
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }))
        try {
          const res = await fetch(`/api/database/backup/${encodeURIComponent(filename)}`, { method: 'DELETE', headers: getAuthHeaders() })
          if (res.status === 401) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            window.location.href = '/login'
            return
          }
          const result = await res.json()
          if (result.success) {
            showToast('备份文件已删除', 'success')
            await fetchBackups()
          }
        } catch (e) {
          showToast('删除失败', 'error')
        }
      }
    })
  }

  const handleCleanupSoftDeleted = async () => {
    setConfirmModal({
      open: true,
      title: '清理软删除数据',
      message: '将永久删除所有标记为已删除的数据（deleted = true）。此操作不可恢复，确定要继续吗？',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }))
        try {
          const res = await fetch('/api/database/cleanup', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ type: 'soft-deleted' })
          })
          if (res.status === 401) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            window.location.href = '/login'
            return
          }
          const result = await res.json()
          if (result.success) {
            showToast(`已清理 ${result.data.totalDeleted || 0} 条软删除数据`, 'success')
            await refreshAll()
          }
        } catch (e) {
          showToast('清理失败', 'error')
        }
      }
    })
  }

  const handleCleanupAllData = async () => {
    setConfirmModal({
      open: true,
      title: '清空所有数据',
      message: '将清空数据库中所有表的数据（不含表结构）。此操作极度危险且不可恢复！',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }))
        try {
          const res = await fetch('/api/database/cleanup', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ type: 'all-data' })
          })
          if (res.status === 401) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            window.location.href = '/login'
            return
          }
          const result = await res.json()
          if (result.success) {
            showToast('所有数据已清空', 'success')
            await refreshAll()
          }
        } catch (e) {
          showToast('清理失败', 'error')
        }
      }
    })
  }

  // 触发文件选择器
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  // 处理文件选择并上传导入
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.name.endsWith('.sql') && file.type !== 'text/plain') {
      showToast('请选择 SQL 文件', 'error')
      e.target.value = ''
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/database/upload-import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return
      }

      const result = await res.json()
      if (result.success) {
        showToast(result.message || '导入成功', 'success')
        await refreshAll()
      } else {
        showToast(`导入失败: ${result.error || '未知错误'}`, 'error')
      }
    } catch (err) {
      console.error('导入失败:', err)
      showToast('导入失败，请重试', 'error')
    } finally {
      setLoading(false)
      e.target.value = '' // 重置文件输入，允许重复选择同一文件
    }
  }

  // Tab 定义
  const tabs = [
    { id: 'overview', label: '数据概览', icon: BarChart3 },
    { id: 'backup', label: '备份管理', icon: FolderOpen },
    { id: 'cleanup', label: '数据清理', icon: Trash2 },
    { id: 'import-export', label: '导入导出', icon: Download },
  ]

  // 操作按钮
  const actionButtons = [
    { label: '测试连接', icon: Play, onClick: handleTest },
    { label: '重启连接', icon: RotateCcw, onClick: handleRestart },
  ]

  const totalRows = dbInfo?.tables?.reduce((sum, t) => sum + t.totalRows, 0) || 0
  const totalDeleted = dbInfo?.tables?.reduce((sum, t) => sum + t.deletedRows, 0) || 0

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px', background: '#f7f8fa' }}>
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '0px', paddingRight: '10px', paddingTop: '10px', position: 'relative', paddingBottom: '10px', overflow: 'auto' }}>
      <div className="pr-2.5 pb-2.5">
        {/* 顶部行：Tab导航 + 右侧操作 */}
        <div className="flex items-center justify-between mb-2.5">
          {/* Tab 导航 */}
          <div className="flex items-center gap-[10px] bg-white rounded-lg border border-gray-200 p-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    localStorage.setItem('db_active_tab', tab.id)
                  }}
                  className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0F1419] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
          {/* 右侧操作区 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 数据库开关 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{dbEnabled ? '开启' : '关闭'}</span>
              <button
                onClick={handleToggle}
                className={`w-10 h-5 rounded-full transition-colors duration-200 relative overflow-hidden ${dbEnabled ? 'bg-[#0F1419]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${dbEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {/* 刷新按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={refreshAll}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </motion.button>
            {actionButtons.map(btn => (
              <motion.button
                key={btn.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={btn.onClick}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm flex items-center gap-2"
              >
                <btn.icon className="w-4 h-4" />
                {btn.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab 内容 */}
        <div>
          <div>
            {/* ===== 概览 Tab ===== */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 连接信息 + 数据概览 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <Server style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                      <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0, lineHeight: '1' }}>连接信息</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>服务器时间</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{dbStatus?.serverTime ? formatDateTime(dbStatus.serverTime) : '—'}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>连接池大小</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{dbStatus?.poolSize ?? '—'}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>空闲连接</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{dbStatus?.idleCount ?? '—'}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>等待队列</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{dbStatus?.waitingCount ?? 0}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>活跃连接</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{dbInfo?.activeConnections ?? '—'}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <BarChart3 style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                      <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0, lineHeight: '1' }}>数据概览</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>总记录数</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{totalRows.toLocaleString()}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>软删除数</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{totalDeleted.toLocaleString()}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>数据库版本</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{extractPgVersion(dbInfo?.version)}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>数据库大小</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{dbInfo?.size || '—'}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>运行时间</div>
                        <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '14px' }}>{formatUptime(dbInfo?.uptime)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 表详情列表 */}
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                      <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0, lineHeight: '1' }}>数据库表</h3>
                    </div>
                    <span style={{ fontSize: '14px', color: '#0F1419', fontWeight: 'bold' }}>
                      共 {dbInfo?.tables?.length || 0} 个表
                    </span>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', background: '#ffffff' }}>
                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: '500', color: '#999', borderBottom: '1px solid #e5e7eb' }}>表名</th>
                          <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', fontWeight: '500', color: '#999', borderBottom: '1px solid #e5e7eb' }}>中文注释</th>
                          <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: '12px', fontWeight: '500', color: '#999', borderBottom: '1px solid #e5e7eb' }}>总记录</th>
                          <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: '12px', fontWeight: '500', color: '#999', borderBottom: '1px solid #e5e7eb' }}>已删除</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbInfo?.tables?.map((table, idx) => (
                          <tr key={table.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '14px', color: '#333' }}>{table.name}</td>
                            <td style={{ padding: '10px 16px', fontSize: '14px', color: '#666' }}>{table.comment || '-'}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0F1419' }}>{table.totalRows.toLocaleString()}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', color: '#0F1419' }}>{table.deletedRows.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===== 备份管理 Tab ===== */}
            {activeTab === 'backup' && (
              <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                {/* 标题行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <Zap style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                  <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0, lineHeight: '1' }}>备份管理</h3>
                </div>

                {/* 操作按钮 */}
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={handleBackup}
                    style={{ background: '#0F1419', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    立即备份
                  </button>
                </div>

                {backups.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: '#d1d5db' }}>
                    <FolderOpen style={{ width: '48px', height: '48px', marginBottom: '12px' }} />
                    <p style={{ fontSize: '14px' }}>暂无备份</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {backups.map((backup, idx) => (
                      <div key={idx} style={{ padding: '14px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ padding: '8px', background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                            <FileText style={{ width: '16px', height: '16px', color: '#0F1419' }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#0F1419', fontFamily: 'monospace', margin: 0 }}>{backup.name}</p>
                            <p style={{ fontSize: '12px', color: '#999', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar style={{ width: '12px', height: '12px' }} />
                              {formatDateTime(backup.created)}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#999', marginRight: '8px' }}>{formatFileSize(backup.size)}</span>
                          <button
                            onClick={() => handleRestore(backup.name)}
                            style={{ padding: '6px', color: '#9ca3af', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#059669'; e.currentTarget.style.background = '#ecfdf5' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none' }}
                            title="从此备份恢复"
                          >
                            <RotateCcw style={{ width: '14px', height: '14px' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.name)}
                            style={{ padding: '6px', color: '#9ca3af', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none' }}
                            title="删除备份"
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== 数据清理 Tab ===== */}
            {activeTab === 'cleanup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 统计信息 */}
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <BarChart3 style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0 }}>清理统计</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>总记录数</div>
                      <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '20px' }}>{totalRows.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>活跃数据</div>
                      <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '20px' }}>{(totalRows - totalDeleted).toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>软删除</div>
                      <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '20px' }}>{totalDeleted.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>删除占比</div>
                      <div style={{ fontWeight: 'bold', color: '#0F1419', fontSize: '20px' }}>
                        {totalRows > 0 ? ((totalDeleted / totalRows) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* 软删除清理 */}
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <AlertTriangle style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0, lineHeight: '1' }}>清理软删除数据</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>
                        永久删除所有标记为软删除（deleted = true）的数据。当前共有 <span style={{ fontWeight: 'bold' }}>{totalDeleted.toLocaleString()}</span> 条软删除数据。
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#999' }}>影响表：</span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {dbInfo?.tables?.filter(t => t.deletedRows > 0).map(t => t.name).join(', ') || '无'}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCleanupSoftDeleted}
                      style={{ background: '#0F1419', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', flexShrink: 0, marginLeft: '16px' }}
                    >
                      清理
                    </motion.button>
                  </div>
                </div>

                {/* 清空所有数据 */}
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <Trash2 style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0, lineHeight: '1' }}>清空所有数据</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#666', margin: '0 0 4px 0' }}>
                        删除数据库中所有表的全部数据（保留表结构）。此操作不可恢复，请务必备份后再操作！
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#999' }}>影响：</span>
                        <span style={{ fontSize: '12px', color: '#666' }}>共 {totalRows.toLocaleString()} 条记录将被删除</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCleanupAllData}
                      style={{ background: '#0F1419', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', flexShrink: 0, marginLeft: '16px' }}
                    >
                      清空
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== 导入导出 Tab ===== */}
            {activeTab === 'import-export' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 导出 */}
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <Download style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0, lineHeight: '1' }}>导出数据库</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                      将数据库中所有未删除的数据（deleted = false）导出为 SQL 格式文件，保存到 backend/backups 目录。
                    </p>
                    <button
                      onClick={handleExport}
                      style={{ background: '#0F1419', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', flexShrink: 0, marginLeft: '16px', transition: 'opacity 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      导出
                    </button>
                  </div>
                </div>

                {/* 导入 */}
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <Upload style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0, lineHeight: '1' }}>导入数据库</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                      选择本地 SQL 文件进行导入，支持从备份文件恢复数据。
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".sql,text/plain"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={handleImport}
                      style={{ background: '#0F1419', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', flexShrink: 0, marginLeft: '16px', transition: 'opacity 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      选择文件
                    </button>
                  </div>
                </div>

                {/* 备份文件列表 */}
                {backups.length > 0 && (
                  <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <FolderOpen style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                      <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0 }}>可用文件 ({backups.length})</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {backups.map((backup, idx) => (
                        <div key={idx} style={{ padding: '14px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '8px', background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                              <FileText style={{ width: '16px', height: '16px', color: '#0F1419' }} />
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: '600', color: '#0F1419', fontFamily: 'monospace', margin: 0 }}>{backup.name}</p>
                              <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                {formatDateTime(backup.created)} · {formatFileSize(backup.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestore(backup.name)}
                            style={{ background: '#0F1419', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            导入
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 使用说明 */}
                <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <Activity style={{ width: '20px', height: '20px', color: '#0F1419' }} />
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', color: '#0F1419', margin: 0 }}>使用说明</h3>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.8 }}>
                    <p style={{ margin: '0 0 8px 0' }}>1. <strong>导出</strong>：将数据库中所有活跃数据导出为 SQL 文件，自动保存到 backend/backups 目录。</p>
                    <p style={{ margin: '0 0 8px 0' }}>2. <strong>导入</strong>：点击"选择文件导入"按钮，从本地选择 SQL 文件进行导入。</p>
                    <p style={{ margin: '0 0 8px 0' }}>3. <strong>备份</strong>：在"备份管理"tab 中创建备份，备份包含所有数据（含已删除）。</p>
                    <p style={{ margin: 0 }}>4. 支持从备份列表中的文件直接导入，也可上传本地 SQL 文件。</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
