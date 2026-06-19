import React, { useState, useEffect, useCallback } from 'react'
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
  const [activeTab, setActiveTab] = useState('overview')
  const [dbInfo, setDbInfo] = useState(null)
  const [dbStatus, setDbStatus] = useState(null)
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', type: 'warning', onConfirm: null })
  const [expandedTable, setExpandedTable] = useState(null)
  const [dbEnabled, setDbEnabled] = useState(true)

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
      if (result.success) setDbStatus(result.data)
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

  const handleImport = async () => {
    showToast('请先将 SQL 文件放入 backend/backups 目录，然后从下方列表选择导入', 'info')
  }

  // Tab 定义
  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3 },
    { id: 'backup', label: '备份管理', icon: FolderOpen },
    { id: 'cleanup', label: '数据清理', icon: Trash2 },
    { id: 'import-export', label: '导入导出', icon: Download },
  ]

  // 操作按钮
  const actionButtons = [
    { label: '测试连接', icon: Play, onClick: handleTest, color: 'bg-emerald-600 hover:bg-emerald-700', textColor: 'text-white' },
    { label: '重启连接', icon: RotateCcw, onClick: handleRestart, color: 'bg-amber-600 hover:bg-amber-700', textColor: 'text-white' },
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
        {/* 顶部行：左侧Tab卡片 + 右侧快捷操作 */}
        <div className="flex items-start gap-2.5 mb-2.5">
          {/* 左侧：四个Tab卡片导航 */}
          <div className="flex gap-2.5 flex-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: '#ffffff',
                    border: isActive ? '1px solid #0F1419' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '10px 25px',
                    minHeight: '55px',
                    width: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" style={{ color: '#0F1419' }} />
                    <p className="text-sm mb-0" style={{ color: '#0F1419' }}>{tab.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {/* 右侧：快捷操作 */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-2 flex-wrap shrink-0">
            <span className="text-xs text-gray-400 mr-1 font-medium">快捷操作</span>
            {/* 数据库开关 */}
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-gray-500">{dbEnabled ? '开启' : '关闭'}</span>
              <button
                onClick={() => setDbEnabled(!dbEnabled)}
                className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${dbEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${dbEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {/* 刷新按钮 */}
            <button
              onClick={refreshAll}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
            {actionButtons.map(btn => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className={`px-3.5 py-1.5 ${btn.color} ${btn.textColor} text-xs font-medium rounded-lg transition-all flex items-center gap-1.5`}
              >
                <btn.icon className="w-3.5 h-3.5" />
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 内容 */}
        <div>
          <div>
            {/* ===== 概览 Tab ===== */}
            {activeTab === 'overview' && (
              <div className="space-y-2.5">
                {/* 连接信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="bg-white rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      连接信息
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-sm">服务器时间</span>
                        <span className="text-gray-700 text-sm">{dbStatus?.serverTime ? formatDateTime(dbStatus.serverTime) : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-sm">连接池大小</span>
                        <span className="text-gray-700 text-sm">{dbStatus?.poolSize ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-sm">空闲连接</span>
                        <span className="text-gray-700 text-sm">{dbStatus?.idleCount ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-sm">等待队列</span>
                        <span className={`font-medium text-sm text-gray-700`}>
                          {dbStatus?.waitingCount ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-sm">活跃连接</span>
                        <span className="text-gray-700 text-sm">{dbInfo?.activeConnections ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      数据概览
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-sm">总记录数</span>
                        <span className="text-gray-700 font-medium text-sm">{totalRows.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-sm">软删除数</span>
                        <span className="font-medium text-sm text-gray-700">{totalDeleted.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-sm">数据库版本</span>
                        <span className="text-gray-700 text-sm">{extractPgVersion(dbInfo?.version)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-sm">数据库大小</span>
                        <span className="text-gray-700 text-sm">{dbInfo?.size || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                      <span className="text-gray-700 text-sm">运行时间</span>
                      <span className="text-gray-700 text-sm">{formatUptime(dbInfo?.uptime)}</span>
                    </div>
                    </div>
                  </div>
                </div>

                {/* 表详情列表 */}
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                      数据表结构
                    </h3>
                    <span className="text-sm text-gray-900">
                      共 {dbInfo?.tables?.length || 0} 个表
                    </span>
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-2.5 text-sm font-medium text-gray-500">表名</th>
                          <th className="text-right px-4 py-2.5 text-sm font-medium text-gray-500">总记录</th>
                          <th className="text-right px-4 py-2.5 text-sm font-medium text-gray-500">已删除</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbInfo?.tables?.map((table, idx) => (
                          <tr key={table.name} className="border-t border-gray-50">
                            <td className="px-4 py-2.5 font-mono text-sm text-gray-700">{table.name}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-900">{table.totalRows.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-900">{table.deletedRows.toLocaleString()}</td>
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
              <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">备份列表</h3>
                    <p className="text-xs text-gray-400 mt-0.5">手动备份数据库，支持恢复和删除</p>
                  </div>
                  <button
                    onClick={handleBackup}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    立即备份
                  </button>
                </div>

                {backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <FolderOpen className="w-12 h-12 mb-3 text-gray-200" />
                    <p className="text-sm">暂无备份</p>
                    <p className="text-xs mt-1">点击上方按钮创建第一个备份</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backups.map((backup, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <FileText className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 font-mono">{backup.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {formatDateTime(backup.created)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 mr-2">{formatFileSize(backup.size)}</span>
                          <button
                            onClick={() => handleRestore(backup.name)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="从此备份恢复"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="删除备份"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
              <div className="space-y-2.5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">数据清理</h3>
                  <p className="text-xs text-gray-400 mb-4">清理不需要的数据以释放空间</p>
                </div>

                {/* 软删除清理 */}
                <div className="border border-amber-100 bg-amber-50/50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h4 className="text-sm font-semibold text-amber-800">清理软删除数据</h4>
                      </div>
                      <p className="text-xs text-amber-600 mt-1">
                        永久删除所有标记为软删除（deleted = true）的数据。当前共有 <span className="font-bold">{totalDeleted.toLocaleString()}</span> 条软删除数据。
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-amber-500">影响表：</span>
                        <span className="text-xs text-amber-600">
                          {dbInfo?.tables?.filter(t => t.deletedRows > 0).map(t => t.name).join(', ') || '无'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleCleanupSoftDeleted}
                      className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors ml-4 flex-shrink-0"
                    >
                      清理
                    </button>
                  </div>
                </div>

                {/* 清空所有数据 */}
                <div className="border border-red-100 bg-red-50/50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Trash2 className="w-4 h-4 text-red-500" />
                        <h4 className="text-sm font-semibold text-red-700">清空所有数据</h4>
                      </div>
                      <p className="text-xs text-red-500 mt-1">
                        删除数据库中所有表的全部数据（保留表结构）。此操作不可恢复，请务必备份后再操作！
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-400">影响：</span>
                        <span className="text-xs text-red-500">共 {totalRows.toLocaleString()} 条记录将被删除</span>
                      </div>
                    </div>
                    <button
                      onClick={handleCleanupAllData}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors ml-4 flex-shrink-0"
                    >
                      清空
                    </button>
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    清理统计
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">总记录数</div>
                      <div className="text-lg font-bold text-gray-800">{totalRows.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">活跃数据</div>
                      <div className="text-lg font-bold text-emerald-600">{(totalRows - totalDeleted).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">软删除</div>
                      <div className="text-lg font-bold text-amber-600">{totalDeleted.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">删除占比</div>
                      <div className="text-lg font-bold text-gray-800">
                        {totalRows > 0 ? ((totalDeleted / totalRows) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== 导入导出 Tab ===== */}
            {activeTab === 'import-export' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* 导出 */}
                  <div className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-blue-50 rounded-xl">
                        <Download className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">导出数据库</h3>
                        <p className="text-xs text-gray-400 mt-0.5">导出所有活跃数据为 SQL 文件</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      将数据库中所有未删除的数据（deleted = false）导出为 SQL 格式文件，保存到 backend/backups 目录。
                    </p>
                    <button
                      onClick={handleExport}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      导出数据
                    </button>
                  </div>

                  {/* 导入 */}
                  <div className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-emerald-50 rounded-xl">
                        <Upload className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">导入数据库</h3>
                        <p className="text-xs text-gray-400 mt-0.5">从 SQL 文件恢复数据</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      从 backend/backups 目录中的 SQL 文件导入数据。请先将需要导入的文件放入该目录。
                    </p>
                    <button
                      onClick={handleImport}
                      className="w-full px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      选择文件导入
                    </button>
                  </div>
                </div>

                {/* 备份文件列表（也作为导入源） */}
                {backups.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      可用文件 ({backups.length})
                    </h3>
                    <div className="space-y-2">
                      {backups.map((backup, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800 font-mono">{backup.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatDateTime(backup.created)} · {formatFileSize(backup.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestore(backup.name)}
                            className="px-3 py-1.5 bg-white text-gray-600 text-xs font-medium rounded-lg border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            导入
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 使用说明 */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    使用说明
                  </h4>
                  <div className="text-xs text-blue-600 space-y-1.5 leading-relaxed">
                    <p>1. <strong>导出</strong>：将数据库中所有活跃数据导出为 SQL 文件，自动保存到 backend/backups 目录。</p>
                    <p>2. <strong>导入</strong>：从 backups 目录中的 SQL 文件导入数据，覆盖现有数据。</p>
                    <p>3. <strong>备份</strong>：在"备份管理"tab 中创建备份，备份包含所有数据（含已删除）。</p>
                    <p>4. SQL 文件可以直接放入 backend/backups 目录，然后在此页面中选择导入。</p>
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
