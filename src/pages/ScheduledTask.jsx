import React, { useState, useEffect } from 'react'
import {
  Clock, Play, Pause, Edit, Eye, RefreshCw, CheckCircle, XCircle, AlertCircle,
  RotateCcw, X, Search, List, Trash2
} from 'lucide-react'

const STATUS_CONFIG = {
  running: { label: '运行中', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  paused: { label: '已暂停', color: 'bg-amber-100 text-amber-700', icon: Pause },
  failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: XCircle },
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500)
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
      {type === 'error' && <XCircle className="w-4 h-4" />}
      {type === 'warning' && <AlertCircle className="w-4 h-4" />}
      {type === 'info' && <Clock className="w-4 h-4" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600', icon: Clock }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${config.color}`}>
      <config.icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

function Modal({ title, onClose, children, width = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} mx-4 max-h-[90vh] overflow-auto`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function formatDuration(ms) {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatDateTime(isoStr) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })
}

export default function ScheduledTask() {
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [historyTab, setHistoryTab] = useState('auto')
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [triggering, setTriggering] = useState(false)

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const showToast = (message, type = 'success') => setToast({ message, type })

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scheduled-tasks`)
      const data = await res.json()
      if (data.success) {
        setTasks(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }

  const fetchLogs = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/api/scheduled-tasks/${taskId}/logs?limit=100`)
      const data = await res.json()
      if (data.success) {
        setLogs(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchTasks()
      setLoading(false)
    }
    loadData()
  }, [])

  const runningCount = tasks.filter(t => t.status === 'running').length
  const pausedCount = tasks.filter(t => t.status === 'paused').length

  const filteredTasks = tasks.filter(task => {
    const matchSearch = !searchKeyword || task.name.includes(searchKeyword) || task.task_id.includes(searchKeyword)
    const matchStatus = statusFilter === 'all' || task.status === statusFilter
    return matchSearch && matchStatus
  })

  const filteredLogs = logs.filter(item => {
    const matchStatus = historyStatusFilter === 'all' || item.status === historyStatusFilter
    return matchStatus
  })

  const handlePause = async (task) => {
    try {
      const res = await fetch(`${API_BASE}/api/scheduled-tasks/${task.task_id}/pause`, { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        await fetchTasks()
        showToast(`任务已暂停`, 'warning')
      }
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  const handleResume = async (task) => {
    try {
      const res = await fetch(`${API_BASE}/api/scheduled-tasks/${task.task_id}/resume`, { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        await fetchTasks()
        showToast(`任务已恢复`, 'success')
      }
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  const handleTrigger = async (task) => {
    setTriggering(true)
    try {
      const res = await fetch(`${API_BASE}/api/scheduled-tasks/${task.task_id}/trigger`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await fetchTasks()
        showToast(`执行成功: 新增 ${data.data?.newCount || 0}, 更新 ${data.data?.updatedCount || 0}`, 'success')
      } else {
        showToast(data.error || '执行失败', 'error')
      }
    } catch (err) {
      showToast('执行失败: ' + err.message, 'error')
    } finally {
      setTriggering(false)
    }
  }

  const handleDeleteLog = async (logId) => {
    try {
      const res = await fetch(`${API_BASE}/api/scheduled-tasks/logs/${logId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        if (modal?.type === 'history') {
          setLogs(prev => prev.filter(l => l.id !== logId))
        }
      }
    } catch (err) {
      showToast('删除失败', 'error')
    }
  }

  const openHistory = async (task) => {
    setModal({ type: 'history', task })
    await fetchLogs(task.task_id)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '52px', paddingLeft: '166px', background: '#f0f2f5' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', paddingLeft: '16px', paddingRight: '16px', position: 'relative', paddingBottom: '16px', overflow: 'auto' }}>

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                定时任务管理
              </h2>
              <p className="text-xs text-gray-400 mt-1">管理系统中的所有定时任务，支持暂停、恢复和手动触发</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{tasks.length}</div>
                <div className="text-xs text-gray-400">总任务数</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600">{runningCount}</div>
                <div className="text-xs text-gray-400">运行中</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-600">{pausedCount}</div>
                <div className="text-xs text-gray-400">已暂停</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => fetchTasks()} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              刷新
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-400 font-medium whitespace-nowrap">任务名称</label>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                <input
                  type="text"
                  placeholder="搜索任务名称"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 font-medium whitespace-nowrap">状态</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">全部状态</option>
                <option value="running">运行中</option>
                <option value="paused">已暂停</option>
              </select>
            </div>
            <button onClick={() => { setSearchKeyword(''); setStatusFilter('all'); }} className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              重置
            </button>
          </div>
        </div>

        {/* Task Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Clock className="w-8 h-8 mb-2" />
              <p className="text-sm">暂无定时任务</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">任务名称</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">触发器</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">上次执行</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">下次执行</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 w-48">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={task.status} />
                          <span className="font-medium text-gray-700">{task.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">{task.cron_expression}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {task.last_run_at ? (
                          <div>
                            <div>{formatDateTime(task.last_run_at)}</div>
                            {task.last_run_status && (
                              <span className={`text-[10px] ${task.last_run_status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {task.last_run_status === 'success' ? '成功' : '失败'} · {formatDuration(task.last_run_duration)}
                              </span>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDateTime(task.next_run_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {task.status === 'running' ? (
                            <button onClick={() => handlePause(task)} className="p-1.5 rounded hover:bg-amber-50 transition-colors text-amber-600" title="暂停">
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => handleResume(task)} className="p-1.5 rounded hover:bg-emerald-50 transition-colors text-emerald-600" title="恢复">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleTrigger(task)} disabled={triggering} className="p-1.5 rounded hover:bg-blue-50 transition-colors text-blue-600 disabled:opacity-50" title="立即执行">
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openHistory(task)} className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600" title="执行历史">
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setModal({ type: 'detail', task })} className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600" title="详情">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {modal?.type === 'detail' && (
        <Modal title="任务详情" onClose={() => setModal(null)} width="max-w-lg">
          <div className="space-y-3 text-xs">
            <div className="flex">
              <span className="w-24 text-gray-400 flex-shrink-0">任务ID</span>
              <span className="text-gray-700 font-mono">{modal.task.task_id}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-400 flex-shrink-0">任务名称</span>
              <span className="text-gray-700">{modal.task.name}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-400 flex-shrink-0">状态</span>
              <StatusBadge status={modal.task.status} />
            </div>
            <div className="flex">
              <span className="w-24 text-gray-400 flex-shrink-0">触发器</span>
              <span className="text-gray-700 font-mono">{modal.task.cron_expression}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-400 flex-shrink-0">下次执行时间</span>
              <span className="text-gray-700">{formatDateTime(modal.task.next_run_at)}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-gray-400 flex-shrink-0">上次执行</span>
              <span className="text-gray-700">{modal.task.last_run_at ? formatDateTime(modal.task.last_run_at) : '-'}</span>
            </div>
            {modal.task.last_error && (
              <div className="flex">
                <span className="w-24 text-gray-400 flex-shrink-0">错误信息</span>
                <span className="text-red-600 font-mono">{modal.task.last_error}</span>
              </div>
            )}
            <div className="flex">
              <span className="w-24 text-gray-400 flex-shrink-0">描述</span>
              <span className="text-gray-700">{modal.task.description || '-'}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              关闭
            </button>
            <button onClick={() => { setModal(null); openHistory(modal.task); }} className="px-4 py-2 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
              查看执行历史
            </button>
          </div>
        </Modal>
      )}

      {/* History Modal */}
      {modal?.type === 'history' && (
        <Modal title={`执行历史 - ${modal.task.name}`} onClose={() => setModal(null)} width="max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">状态</label>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white"
              >
                <option value="all">全部状态</option>
                <option value="success">成功</option>
                <option value="failed">失败</option>
              </select>
            </div>
            <button onClick={() => fetchLogs(modal.task.task_id)} className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              刷新
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">暂无执行记录</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-semibold text-gray-600">状态</th>
                    <th className="text-left py-2 font-semibold text-gray-600">开始时间</th>
                    <th className="text-left py-2 font-semibold text-gray-600">结束时间</th>
                    <th className="text-left py-2 font-semibold text-gray-600">执行时长</th>
                    <th className="text-left py-2 font-semibold text-gray-600">错误信息</th>
                    <th className="text-left py-2 font-semibold text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(item => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.status === 'success' ? 'bg-emerald-100 text-emerald-600' : item.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {item.status === 'success' ? '成功' : item.status === 'failed' ? '失败' : '执行中'}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">{formatDateTime(item.started_at)}</td>
                      <td className="py-2 text-gray-500">{item.finished_at ? formatDateTime(item.finished_at) : '-'}</td>
                      <td className="py-2 text-gray-500">{formatDuration(item.duration)}</td>
                      <td className="py-2 text-gray-400 max-w-[200px] truncate" title={item.error_message}>{item.error_message || '-'}</td>
                      <td className="py-2">
                        <button onClick={() => handleDeleteLog(item.id)} className="text-red-400 hover:text-red-600 text-[10px]">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              关闭
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
