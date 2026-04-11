import React, { useState, useEffect } from 'react'
import { Clock, Plus, Play, Pause, Trash2, Edit3, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

const Scheduler = () => {
  const [tasks, setTasks] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    time: '09:00',
    enabled: true,
    dataSource: 'qmt'
  })

  // 预设任务模板
  const presetTasks = [
    {
      id: 'market-open',
      name: '开盘数据同步',
      description: '交易日开盘时同步实时行情数据',
      frequency: 'daily',
      time: '09:15',
      enabled: true,
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
      status: 'completed'
    },
    {
      id: 'market-close',
      name: '收盘数据归档',
      description: '收盘后归档当日交易数据和K线',
      frequency: 'daily',
      time: '15:30',
      enabled: true,
      lastRun: new Date(Date.now() - 8 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 16 * 60 * 60 * 1000),
      status: 'pending'
    },
    {
      id: 'weekly-report',
      name: '周报数据统计',
      description: '每周生成交易统计和市场分析报告',
      frequency: 'weekly',
      time: '18:00',
      enabled: true,
      lastRun: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: 'pending'
    }
  ]

  useEffect(() => {
    setTasks(presetTasks)
  }, [])

  const handleAddTask = () => {
    if (!newTask.name.trim()) return

    const task = {
      id: Date.now().toString(),
      ...newTask,
      lastRun: null,
      nextRun: calculateNextRun(newTask.frequency, newTask.time),
      status: 'pending'
    }

    setTasks(prev => [...prev, task])
    setNewTask({
      name: '',
      description: '',
      frequency: 'daily',
      time: '09:00',
      enabled: true,
      dataSource: 'qmt'
    })
    setShowAddForm(false)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setNewTask({
      name: task.name,
      description: task.description,
      frequency: task.frequency,
      time: task.time,
      enabled: task.enabled,
      dataSource: task.dataSource || 'qmt'
    })
    setShowAddForm(true)
  }

  const handleUpdateTask = () => {
    setTasks(prev => prev.map(task => 
      task.id === editingTask.id 
        ? { ...task, ...newTask, nextRun: calculateNextRun(newTask.frequency, newTask.time) }
        : task
    ))
    setEditingTask(null)
    setShowAddForm(false)
    setNewTask({
      name: '',
      description: '',
      frequency: 'daily',
      time: '09:00',
      enabled: true,
      dataSource: 'qmt'
    })
  }

  const calculateNextRun = (frequency, time) => {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    
    switch (frequency) {
      case 'daily':
        const nextDaily = new Date(now)
        nextDaily.setHours(hours, minutes, 0, 0)
        if (nextDaily <= now) {
          nextDaily.setDate(nextDaily.getDate() + 1)
        }
        return nextDaily
      
      case 'weekly':
        const nextWeekly = new Date(now)
        nextWeekly.setHours(hours, minutes, 0, 0)
        nextWeekly.setDate(nextWeekly.getDate() + (7 - nextWeekly.getDay()))
        return nextWeekly
      
      case 'monthly':
        const nextMonthly = new Date(now)
        nextMonthly.setHours(hours, minutes, 0, 0)
        nextMonthly.setMonth(nextMonthly.getMonth() + 1)
        nextMonthly.setDate(1)
        return nextMonthly
      
      default:
        return now
    }
  }

  const toggleTaskStatus = (taskId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, enabled: !task.enabled }
        : task
    ))
  }

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const runTaskNow = (taskId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: 'running',
            lastRun: new Date()
          }
        : task
    ))

    // 模拟任务执行
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'completed',
              nextRun: calculateNextRun(task.frequency, task.time)
            }
          : task
      ))
    }, 3000)
  }

  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'daily': return '每日'
      case 'weekly': return '每周'
      case 'monthly': return '每月'
      default: return frequency
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { text: '已完成', color: '#10b981', icon: <CheckCircle size={16} /> }
      case 'running':
        return { text: '执行中', color: '#f59e0b', icon: <Clock size={16} /> }
      case 'pending':
        return { text: '等待中', color: '#6b7280', icon: <Clock size={16} /> }
      case 'failed':
        return { text: '失败', color: '#ef4444', icon: <AlertCircle size={16} /> }
      default:
        return { text: '未知', color: '#6b7280', icon: <AlertCircle size={16} /> }
    }
  }

  return (
    <div style={{ 
      margin: 0, 
      padding: '20px', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={24} />
              定时任务管理
            </h1>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: '10px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} />
              添加任务
            </button>
          </div>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            管理定时数据同步和分析任务
          </p>
        </div>

        {/* 添加/编辑任务表单 */}
        {showAddForm && (
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              {editingTask ? '编辑任务' : '添加新任务'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>任务名称</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="输入任务名称"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>数据源</label>
                <select
                  value={newTask.dataSource}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dataSource: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="qmt">QMT实时行情</option>
                  <option value="tradingview">TradingView数据</option>
                  <option value="akshare">AkShare数据</option>
                  <option value="future">期货数据</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>执行频率</label>
                <select
                  value={newTask.frequency}
                  onChange={(e) => setNewTask(prev => ({ ...prev, frequency: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="daily">每日</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>执行时间</label>
                <input
                  type="time"
                  value={newTask.time}
                  onChange={(e) => setNewTask(prev => ({ ...prev, time: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>任务描述</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
                placeholder="输入任务描述"
              />
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                onClick={editingTask ? handleUpdateTask : handleAddTask}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {editingTask ? '更新任务' : '添加任务'}
              </button>
              
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingTask(null)
                  setNewTask({
                    name: '',
                    description: '',
                    frequency: 'daily',
                    time: '09:00',
                    enabled: true,
                    dataSource: 'qmt'
                  })
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 任务列表 */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            定时任务列表 ({tasks.length})
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            {tasks.map((task) => {
              const statusInfo = getStatusInfo(task.status)
              
              return (
                <div 
                  key={task.id}
                  style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    opacity: task.enabled ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                          {task.name}
                        </h3>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '12px',
                          color: statusInfo.color
                        }}>
                          {statusInfo.icon}
                          {statusInfo.text}
                        </div>
                      </div>
                      
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                        {task.description}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                        <span>频率: {getFrequencyText(task.frequency)} {task.time}</span>
                        <span>数据源: {task.dataSource}</span>
                        {task.lastRun && (
                          <span>最后执行: {task.lastRun.toLocaleString()}</span>
                        )}
                        {task.nextRun && (
                          <span>下次执行: {task.nextRun.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => runTaskNow(task.id)}
                        disabled={task.status === 'running'}
                        style={{
                          padding: '6px 12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: task.status === 'running' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Play size={12} style={{ marginRight: '4px' }} />
                        {task.status === 'running' ? '执行中...' : '立即执行'}
                      </button>
                      
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        style={{
                          padding: '6px 12px',
                          background: task.enabled ? '#f59e0b' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {task.enabled ? <Pause size={12} /> : <Play size={12} />}
                        {task.enabled ? '暂停' : '启用'}
                      </button>
                      
                      <button
                        onClick={() => handleEditTask(task)}
                        style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={12} />
                      </button>
                      
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {tasks.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#6b7280',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>暂无定时任务，点击"添加任务"按钮创建第一个任务</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Scheduler