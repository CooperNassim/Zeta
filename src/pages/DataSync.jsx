import React, { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Database, Wifi, WifiOff, Clock } from 'lucide-react'

const DataSync = () => {
  const [syncStatus, setSyncStatus] = useState({})
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [dataSources, setDataSources] = useState([
    {
      id: 'qmt',
      name: 'QMT实时行情',
      type: '实时数据',
      status: 'unknown',
      lastSync: null,
      description: '通达信QMT实时行情数据源'
    },
    {
      id: 'tradingview',
      name: 'TradingView数据',
      type: '历史数据',
      status: 'unknown',
      lastSync: null,
      description: 'TradingView图表和技术指标数据'
    },
    {
      id: 'akshare',
      name: 'AkShare数据',
      type: '基础数据',
      status: 'unknown',
      lastSync: null,
      description: 'A股市场基础信息和财务数据'
    },
    {
      id: 'future',
      name: '期货数据',
      type: '期货行情',
      status: 'unknown',
      lastSync: null,
      description: '国内期货市场实时行情数据'
    }
  ])

  // 检查数据源状态
  const checkDataSourceStatus = async () => {
    try {
      setIsSyncing(true)
      
      // 模拟API调用检查数据源状态
      const updatedSources = dataSources.map(source => ({
        ...source,
        status: Math.random() > 0.3 ? 'connected' : 'disconnected',
        lastSync: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      }))

      setDataSources(updatedSources)
      setLastSync(new Date())
      
      // 更新整体同步状态
      const connectedCount = updatedSources.filter(s => s.status === 'connected').length
      setSyncStatus({
        overall: connectedCount === updatedSources.length ? 'success' : 'warning',
        connected: connectedCount,
        total: updatedSources.length
      })
      
    } catch (error) {
      console.error('检查数据源状态失败:', error)
      setSyncStatus({
        overall: 'error',
        connected: 0,
        total: dataSources.length
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // 手动同步单个数据源
  const syncDataSource = async (sourceId) => {
    try {
      setIsSyncing(true)
      
      // 模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setDataSources(prev => prev.map(source => 
        source.id === sourceId 
          ? { ...source, status: 'connected', lastSync: new Date() }
          : source
      ))
      
    } catch (error) {
      console.error(`同步数据源 ${sourceId} 失败:`, error)
    } finally {
      setIsSyncing(false)
    }
  }

  // 批量同步所有数据源
  const syncAllSources = async () => {
    try {
      setIsSyncing(true)
      
      // 模拟批量同步过程
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const updatedSources = dataSources.map(source => ({
        ...source,
        status: 'connected',
        lastSync: new Date()
      }))
      
      setDataSources(updatedSources)
      setLastSync(new Date())
      setSyncStatus({
        overall: 'success',
        connected: updatedSources.length,
        total: updatedSources.length
      })
      
    } catch (error) {
      console.error('批量同步失败:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    checkDataSourceStatus()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={16} color="#10b981" />
      case 'disconnected':
        return <AlertCircle size={16} color="#ef4444" />
      default:
        return <WifiOff size={16} color="#6b7280" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return { text: '已连接', color: '#10b981' }
      case 'disconnected':
        return { text: '未连接', color: '#ef4444' }
      default:
        return { text: '未知', color: '#6b7280' }
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
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <RefreshCw size={24} />
            数据源同步
          </h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            管理多个行情数据源的连接和同步状态
          </p>
        </div>

        {/* 整体状态概览 */}
        <div style={{
          background: syncStatus.overall === 'success' ? '#f0fdf4' : 
                     syncStatus.overall === 'warning' ? '#fffbeb' : '#fef2f2',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: `1px solid ${
            syncStatus.overall === 'success' ? '#bbf7d0' : 
            syncStatus.overall === 'warning' ? '#fed7aa' : '#fecaca'
          }`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                数据源同步状态
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                已连接 {syncStatus.connected || 0} / {syncStatus.total || 0} 个数据源
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {lastSync && (
                <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  最后检查: {lastSync.toLocaleTimeString()}
                </div>
              )}
              
              <button
                onClick={syncAllSources}
                disabled={isSyncing}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: isSyncing ? 'not-allowed' : 'pointer',
                  opacity: isSyncing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? '同步中...' : '同步所有数据源'}
              </button>
            </div>
          </div>
        </div>

        {/* 数据源列表 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            数据源列表
          </h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {dataSources.map((source) => {
              const statusInfo = getStatusText(source.status)
              
              return (
                <div 
                  key={source.id}
                  style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <Database size={20} color="#3b82f6" />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                          {source.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {source.description}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                      <span>类型: {source.type}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {getStatusIcon(source.status)}
                        <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>
                      </div>
                      {source.lastSync && (
                        <span>最后同步: {source.lastSync.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => syncDataSource(source.id)}
                      disabled={isSyncing}
                      style={{
                        padding: '6px 12px',
                        background: source.status === 'connected' ? '#10b981' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: isSyncing ? 'not-allowed' : 'pointer',
                        opacity: isSyncing ? 0.7 : 1
                      }}
                    >
                      {source.status === 'connected' ? '重新同步' : '连接同步'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 同步设置 */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
            同步设置
          </h2>
          
          <div style={{ 
            background: '#f8fafc', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  自动同步间隔
                </label>
                <select style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: 'white'
                }}>
                  <option value="5">每5分钟</option>
                  <option value="15">每15分钟</option>
                  <option value="30">每30分钟</option>
                  <option value="60">每小时</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  失败重试次数
                </label>
                <input 
                  type="number" 
                  defaultValue="3"
                  min="1"
                  max="10"
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
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                保存设置
              </button>
              
              <button style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                恢复默认
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataSync