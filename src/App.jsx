import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, NavLink } from 'react-router-dom'
import { TrendingUp, Brain, Target, Shield, Clock, Receipt, Activity, Home as HomeIcon, ChevronDown, Wallet2, Database } from 'lucide-react'
import Home from './pages/Home'
import DailyWork from './pages/DailyWork'
import PsychologicalTest from './pages/PsychologicalTest'
import TradingStrategy from './pages/TradingStrategy'
import TechnicalIndicators from './pages/TechnicalIndicators'
import RiskModel from './pages/RiskModel'
import OrderManagement from './pages/OrderManagement'
import TransactionHistory from './pages/TransactionHistory'
import TradeRecords from './pages/TradeRecords'
import StockPool from './pages/StockPool'
import DatabaseManagement from './pages/DatabaseManagement'
import useStore from './store/useStore'
import { ToastProvider } from './contexts/ToastContext'

// 缓存版本控制 - 只在版本变化时清除过期数据，不影响用户数据
const CACHE_VERSION_KEY = 'zeta_cache_version'
const CURRENT_CACHE_VERSION = '2026-05-03-v4'

if (typeof window !== 'undefined') {
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
  if (storedVersion !== CURRENT_CACHE_VERSION) {
    console.log('[Cache] 缓存版本升级，清除操作标志...')
    // 只清除操作标志，不清除用户数据
    localStorage.removeItem('is_deleting_orders')
    localStorage.removeItem('is_resetting_transactions')
    localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION)
  }
}

// 使用相对路径，通过 Vite 代理到后端
const API_BASE_URL = ''

// 数据同步组件 - 只在首次加载和页面可见时同步
function DataSync() {
  const syncedRef = useRef(false)
  const isReadyRef = useRef(false)
  // 防抖：记录上次同步时间，防止过于频繁的同步（10秒内最多同步一次）
  const lastFullSyncTimeRef = useRef(0)
  const store = useStore()

  // 检查后端是否就绪
  const checkBackendReady = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response.ok
    } catch (e) {
      // ERR_ABORTED 表示请求被取消，不是真正的错误，视为后端未就绪
      if (e.name === 'AbortError' || (e instanceof TypeError && e.message.includes('ERR_ABORTED'))) {
        console.log('[DataSync] 健康检查请求被取消，后端可能未就绪')
        return false
      }
      return false
    }
  }

  const syncData = useCallback(async () => {
    // 检查是否正在同步中（避免并发请求）- 尽早设置锁
    if (syncedRef.current) {
      console.log('[DataSync] 正在同步中，跳过本次请求')
      return
    }
    // 防抖：10秒内最多同步一次
    const now = Date.now()
    if (now - lastFullSyncTimeRef.current < 10000) {
      console.log('[DataSync] 距离上次同步不足10秒，跳过')
      return
    }
    syncedRef.current = true // 立即设置锁，防止并发请求

    // 检查是否在删除操作过程中，如果是则跳过同步
    const isDeleting = localStorage.getItem('is_deleting_orders') === 'true'
    if (isDeleting) {
      console.log('[DataSync] ⚠️ 检测到删除操作，跳过同步以防止数据不一致')
      localStorage.removeItem('is_deleting_orders')
      syncedRef.current = false
      return
    }

    // 等待后端就绪（最多等待5秒）
    let backendReady = await checkBackendReady()
    let readyAttempts = 0
    while (!backendReady && readyAttempts < 5) {
      readyAttempts++
      console.log(`[DataSync] 等待后端就绪 (${readyAttempts}/5)...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      backendReady = await checkBackendReady()
    }

    if (!backendReady) {
      console.warn('[DataSync] 后端未就绪，跳过本次同步')
      isReadyRef.current = false
      syncedRef.current = false
      return
    }

    isReadyRef.current = true

    console.log('[DataSync] 从数据库同步数据...')

    let retryCount = 0
    const maxRetries = 2
    const retryDelay = 1000

    const attemptSync = async () => {
      try {
        console.log('[DataSync] 正在请求 /api/sync/all...')
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        const response = await fetch(`${API_BASE_URL}/api/sync/all`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('[DataSync] 原始响应:', result)

        if (result.success && result.data) {
          const { trade_orders, transactions, trade_records, stock_pool, daily_work_data, psychological_test_results, psychological_indicators, trading_strategies, risk_config } = result.data

          console.log('[DataSync] 数据库返回数据:', {
            trade_orders: trade_orders?.length || 0,
            transactions: transactions?.length || 0,
            trade_records: trade_records?.length || 0,
            stock_pool: stock_pool?.length || 0,
            daily_work_data: daily_work_data?.length || 0,
            psychological_test_results: psychological_test_results?.length || 0,
            psychological_indicators: psychological_indicators?.length || 0,
            trading_strategies: trading_strategies?.length || 0,
            risk_config: risk_config?.length || 0
          })

          // 总是导入数据，即使数据为空也会清空本地旧数据
          try { if (trade_orders) store.importOrders(trade_orders); } catch(e) { console.error('[DataSync] importOrders 失败:', e) }
          try { if (transactions) store.importTransactions(transactions); } catch(e) { console.error('[DataSync] importTransactions 失败:', e) }
          try { if (trade_records) store.importTradeRecords(trade_records, trade_orders); } catch(e) { console.error('[DataSync] importTradeRecords 失败:', e) }
          try { if (stock_pool !== null) store.importStocks(stock_pool); } catch(e) { console.error('[DataSync] importStocks 失败:', e) }
          try { if (daily_work_data !== null && daily_work_data !== undefined) store.importDailyWorkData(daily_work_data); } catch(e) { console.error('[DataSync] importDailyWorkData 失败:', e) }
          try { store.importPsychologicalTestResults(psychological_test_results); } catch(e) { console.error('[DataSync] importPsychologicalTestResults 失败:', e) }
          try { if (psychological_indicators !== null && psychological_indicators !== undefined) store.importPsychologicalIndicators(psychological_indicators); } catch(e) { console.error('[DataSync] importPsychologicalIndicators 失败:', e) }
          try { if (trading_strategies !== null && trading_strategies !== undefined) store.importTradingStrategies(trading_strategies); } catch(e) { console.error('[DataSync] importTradingStrategies 失败:', e) }
          try { if (risk_config !== null && risk_config !== undefined) store.importRiskConfig(risk_config); } catch(e) { console.error('[DataSync] importRiskConfig 失败:', e) }

          // 初始化交易编号计数器
          await store.initializeTradeNumberCounter()

          // 更新上次同步时间
          lastFullSyncTimeRef.current = Date.now()
          console.log('[DataSync] 同步完成')
        } else {
          throw new Error(result.error || '同步响应格式错误')
        }
      } catch (error) {
        // 无论成功、失败还是取消，都更新防抖时间戳
        lastFullSyncTimeRef.current = Date.now()
        if (error.name === 'AbortError' || error.name === 'TypeError') {
          console.log('[DataSync] 请求已取消或超时')
          return
        }
        console.error('[DataSync] 数据同步失败:', error.message || error)
        retryCount++
        if (retryCount < maxRetries) {
          console.log(`[DataSync] ${retryDelay / 1000}秒后重试 (${retryCount}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return attemptSync()
        } else {
          console.warn('[DataSync] 同步失败，将使用本地数据或等待下次同步')
        }
      } finally {
        // 同步完成或失败后，重置锁
        syncedRef.current = false
      }
    }

    await attemptSync()
  }, [store])

  useEffect(() => {
    // 首次加载时同步
    syncData()

    // 监听页面可见性变化，切换回来时同步（2秒内最多同步一次）
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[DataSync] 页面可见，重新同步...')
        syncData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncData])

  return null
}

function Navigation() {
  const location = useLocation()
  const account = useStore(state => state.account)

  const tradingMenuItems = [
    { id: 'daily', icon: TrendingUp, label: '每日功课', path: '/daily-work', customIcon: 'daily' },
    { id: 'psych', icon: Brain, label: '心理测试', path: '/psychological-test', customIcon: 'psych' },
    { id: 'strategy', icon: Target, label: '交易策略', path: '/trading-strategy', customIcon: 'strategy' },
    { id: 'risk', icon: Shield, label: '风险模型', path: '/risk-model', customIcon: 'risk' },
    { id: 'order', icon: Clock, label: '股票交易', path: '/order-management', customIcon: 'order' },
    { id: 'record', icon: Activity, label: '交易记录', path: '/trade-records', customIcon: 'record' },
    { id: 'transaction', icon: Receipt, label: '账单明细', path: '/transaction-history', customIcon: 'transaction' },
  ]

  const researchMenuItems = [
    { id: 'stockpool', icon: Database, label: '股票行情', path: '/stock-pool', customIcon: 'stockpool' },
    { id: 'technical', icon: Target, label: '技术指标', path: '/technical-indicators', customIcon: 'technical' },
  ]

  const settingsMenuItems = [
    { id: 'database', icon: Database, label: '数据库', path: '/database-management', customIcon: 'database' },
  ]

  const isTradingPage = tradingMenuItems.some(item => item.path === location.pathname)
  const isResearchPage = researchMenuItems.some(item => item.path === location.pathname)
  const isSettingsPage = settingsMenuItems.some(item => item.path === location.pathname)

  return (
    <>
      {/* 顶部导航栏 */}
      <nav
        className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50"
      >
        <div className="w-full px-5">
          <div className="flex items-center justify-between h-[52px]">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img src="/Zeta.png" alt="Zeta Logo" style={{ height: 'clamp(20px, 3vw, 26.4px)', width: 'auto', marginLeft: 'clamp(10px, 2vw, 20px)' }} />
              </Link>
            </div>

            {/* 导航菜单 */}
            <div className="flex items-center flex-1 justify-start" style={{ paddingLeft: 'clamp(10px, 3vw, 32px)', gap: 'clamp(10px, 2.5vw, 20px)' }}>
              <div>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center py-2 text-base font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 relative ${isActive ? 'text-gray-900' : ''}`
                  }
                  style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', paddingLeft: 'clamp(10px, 1.5vw, 18px)', paddingRight: 'clamp(10px, 1.5vw, 18px)' }}
                >
                  {({ isActive }) => (
                    <>
                      首页
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: 'clamp(10px, 1.5vw, 18px)',
                            right: 'clamp(10px, 1.5vw, 18px)',
                            height: '2px',
                            backgroundColor: '#0F1419',
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </div>

              <div>
                <NavLink
                  to="/daily-work"
                  className={({ isActive }) =>
                    `flex items-center py-2 text-base font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 relative ${isActive || isTradingPage ? 'text-gray-900' : ''}`
                  }
                  style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', paddingLeft: 'clamp(8px, 1vw, 12px)', paddingRight: 'clamp(8px, 1vw, 12px)' }}
                >
                  {({ isActive }) => (
                    <>
                      交易
                      {(isActive || isTradingPage) && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: 'clamp(8px, 1vw, 12px)',
                            right: 'clamp(8px, 1vw, 12px)',
                            height: '2px',
                            backgroundColor: '#0F1419',
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </div>

              <div>
                <NavLink
                  to="/stock-pool"
                  className={({ isActive }) =>
                    `flex items-center py-2 text-base font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 relative ${isActive || isResearchPage ? 'text-gray-900' : ''}`
                  }
                  style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', paddingLeft: 'clamp(8px, 1vw, 12px)', paddingRight: 'clamp(8px, 1vw, 12px)' }}
                >
                  {({ isActive }) => (
                    <>
                      研究院
                      {(isActive || isResearchPage) && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: 'clamp(8px, 1vw, 12px)',
                            right: 'clamp(8px, 1vw, 12px)',
                            height: '2px',
                            backgroundColor: '#0F1419',
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </div>

              <div>
                <NavLink
                  to="/database-management"
                  className={({ isActive }) =>
                    `flex items-center py-2 text-base font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 relative ${isActive || isSettingsPage ? 'text-gray-900' : ''}`
                  }
                  style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', paddingLeft: 'clamp(8px, 1vw, 12px)', paddingRight: 'clamp(8px, 1vw, 12px)' }}
                >
                  {({ isActive }) => (
                    <>
                      设置
                      {(isActive || isSettingsPage) && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: 'clamp(8px, 1vw, 12px)',
                            right: 'clamp(8px, 1vw, 12px)',
                            height: '2px',
                            backgroundColor: '#0F1419',
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 左侧边栏 - 仅在交易页面显示 */}
      {isTradingPage && (
        <aside
          className="fixed left-0 top-[52px] bottom-0 w-[166px] bg-white border-r border-gray-200 overflow-y-auto z-40 pt-0"
          style={{ width: 'clamp(140px, 15vw, 166px)' }}
        >
          <div className="px-3 pt-2.5 space-y-2.5">
            {tradingMenuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center h-[42px] px-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    item.id === 'daily' ? 'mt-2.5' : ''
                  } ${
                    isActive
                      ? 'bg-gray-100 text-[#0F1419]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.customIcon === 'daily' ? (
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="#0F1419">
                      {isActive ? (
                        <path d="M862.841905 485.254095l51.443809 51.785143-367.640381 364.909714-16.749714-16.822857 16.822857 16.969143H495.420952v-51.760762L862.841905 485.254095zM292.327619 121.904762v778.483809H231.497143A72.996571 72.996571 0 0 1 158.47619 827.392V194.876952A72.996571 72.996571 0 0 1 231.497143 121.904762h60.830476z m474.550857 0a72.996571 72.996571 0 0 1 73.020953 72.97219l-0.024381 218.965334-474.550858 474.38019V121.904762h401.554286z m-146.017524 291.937524H426.179048v72.97219h194.681904v-72.97219z m73.020953-145.968762H426.179048v72.97219h267.702857v-72.97219z"></path>
                      ) : (
                        <path d="M862.841905 485.254095l51.443809 51.785143-367.640381 364.909714-16.749714-16.822857 16.822857 16.969143H495.420952v-51.760762L862.841905 485.254095zM766.878476 121.904762a72.996571 72.996571 0 0 1 73.020953 72.97219l-0.024381 218.965334-72.996572 72.97219V194.876952h-401.554286v632.515048h60.854858l-72.996572 72.97219H231.497143A72.996571 72.996571 0 0 1 158.47619 827.416381V194.876952A72.996571 72.996571 0 0 1 231.497143 121.904762h535.405714zM292.327619 194.876952H231.497143v632.515048h60.806095V194.876952z m328.557714 218.940953v72.996571H426.179048v-72.97219h194.681904z m73.020953-145.944381v72.97219H426.179048v-72.97219h267.702857z"></path>
                      )}
                    </svg>
                  ) : item.customIcon === 'psych' ? (
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="#0F1419">
                      {isActive ? (
                        <path d="M512 97.52381c228.912762 0 414.47619 185.563429 414.47619 414.47619s-185.563429 414.47619-414.47619 414.47619S97.52381 740.912762 97.52381 512 283.087238 97.52381 512 97.52381z m185.002667 450.876952c-69.046857 192.219429-319.366095 192.219429-369.054477 3.072l-70.753523 18.578286c68.559238 260.87619 416.036571 260.87619 508.659809 3.072l-68.851809-24.722286zM414.47619 341.333333a48.761905 48.761905 0 0 0-48.761904 48.761905v73.142857a48.761905 48.761905 0 1 0 97.523809 0v-73.142857a48.761905 48.761905 0 0 0-48.761905-48.761905z m195.04762 0a48.761905 48.761905 0 0 0-48.761905 48.761905v73.142857a48.761905 48.761905 0 1 0 97.523809 0v-73.142857a48.761905 48.761905 0 0 0-48.761904-48.761905z"></path>
                      ) : (
                        <path d="M512 97.52381c228.912762 0 414.47619 185.563429 414.47619 414.47619s-185.563429 414.47619-414.47619 414.47619S97.52381 740.912762 97.52381 512 283.087238 97.52381 512 97.52381z m0 73.142857C323.486476 170.666667 170.666667 323.486476 170.666667 512s152.81981 341.333333 341.333333 341.333333 341.333333-152.81981 341.333333-341.333333S700.513524 170.666667 512 170.666667z m185.002667 377.734095l68.851809 24.722286c-92.647619 257.80419-440.100571 257.80419-508.659809-3.072l70.753523-18.578286c49.688381 189.147429 300.007619 189.147429 369.054477-3.072zM414.47619 341.333333a48.761905 48.761905 0 0 1 48.761905 48.761905v73.142857a48.761905 48.761905 0 1 1-97.523809 0v-73.142857a48.761905 48.761905 0 0 1 48.761904-48.761905z m195.04762 0a48.761905 48.761905 0 0 1 48.761904 48.761905v73.142857a48.761905 48.761905 0 1 1-97.523809 0v-73.142857a48.761905 48.761905 0 0 1 48.761905-48.761905z"></path>
                      )}
                    </svg>
                  ) : item.customIcon === 'strategy' ? (
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="#0F1419">
                      {isActive ? (
                        <path d="M512 97.52381c175.055238 0 316.952381 141.897143 316.952381 316.95238 0 128.365714-76.312381 238.933333-186.051048 288.74362L668.038095 828.952381H755.809524v73.142857H268.190476v-73.142857h87.771429l25.161143-125.708191C271.384381 653.409524 195.047619 542.866286 195.047619 414.47619 195.047619 239.420952 336.944762 97.52381 512 97.52381z m0 146.285714a170.666667 170.666667 0 1 0 0 341.333333 170.666667 170.666667 0 0 0 0-341.333333z m0 73.142857a97.52381 97.52381 0 1 1 0 195.047619 97.52381 97.52381 0 0 1 0-195.047619z"></path>
                      ) : (
                        <path d="M512 97.52381c175.055238 0 316.952381 141.897143 316.952381 316.95238 0 128.365714-76.312381 238.933333-186.051048 288.74362L668.038095 828.952381H755.809524v73.142857H268.190476v-73.142857h87.771429l25.161143-125.708191C271.384381 653.409524 195.047619 542.866286 195.047619 414.47619 195.047619 239.420952 336.944762 97.52381 512 97.52381z m61.927619 633.904761h-123.855238l-19.504762 97.52381h162.864762l-19.504762-97.52381zM512 170.666667c-134.656 0-243.809524 109.153524-243.809524 243.809523s109.153524 243.809524 243.809524 243.809524 243.809524-109.153524 243.809524-243.809524S646.656 170.666667 512 170.666667z m0 73.142857a170.666667 170.666667 0 1 1 0 341.333333 170.666667 170.666667 0 0 1 0-341.333333z m0 73.142857a97.52381 97.52381 0 1 0 0 195.047619 97.52381 97.52381 0 0 0 0-195.047619z"></path>
                      )}
                    </svg>
                  ) : item.customIcon === 'risk' ? (
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="#0F1419">
                      {isActive ? (
                        <path d="M530.846476 99.986286l316.952381 84.528762A73.142857 73.142857 0 0 1 902.095238 255.195429v400.847238a73.142857 73.142857 0 0 1-29.891048 59.001904l-316.95238 232.423619a73.142857 73.142857 0 0 1-86.50362 0l-316.95238-232.448A73.142857 73.142857 0 0 1 121.904762 656.042667V255.195429a73.142857 73.142857 0 0 1 54.296381-70.680381l316.952381-84.528762a73.142857 73.142857 0 0 1 37.692952 0z m126.098286 212.796952l-210.16381 208.042667-79.603809-79.579429-51.687619 51.736381 131.072 130.998857 261.851428-259.218285-51.46819-51.980191z"></path>
                      ) : (
                        <path d="M530.846476 99.986286l316.952381 84.528762A73.142857 73.142857 0 0 1 902.095238 255.195429v400.847238a73.142857 73.142857 0 0 1-29.891048 59.001904l-316.95238 232.423619a73.142857 73.142857 0 0 1-86.50362 0l-316.95238-232.448A73.142857 73.142857 0 0 1 121.904762 656.042667V255.195429a73.142857 73.142857 0 0 1 54.296381-70.680381l316.952381-84.528762a73.142857 73.142857 0 0 1 37.692952 0zM512 170.666667L195.047619 255.195429v400.847238l316.952381 232.448 316.952381-232.448V255.195429L512 170.666667z m144.944762 142.140952l51.443809 51.95581-261.851428 259.218285-131.047619-130.998857 51.687619-51.736381 79.62819 79.579429 210.139429-208.042667z"></path>
                      )}
                    </svg>
                  ) : item.customIcon === 'order' ? (
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="#0F1419">
                      {isActive ? (
                        <path d="M314.63619 196.900571c13.165714 2.681905 25.478095 9.313524 35.181715 19.017143l154.819047 154.819048 0.292572-0.292572L758.247619 624.542476l-168.935619 168.96c-48.761905 48.761905-130.340571 46.250667-182.223238-5.632L92.452571 473.234286c-25.916952-25.916952-27.184762-66.730667-2.803809-91.111619a59.904 59.904 0 0 1 34.06019-16.871619l103.399619-14.701715 14.701715-103.399619c4.973714-34.864762 37.571048-57.392762 72.825904-50.249143z m516.876191 58.953143l101.595429 101.595429a64.316952 64.316952 0 0 1-0.146286 90.965333l-145.091048 145.066667L535.259429 340.114286l84.016761-83.919238c58.684952-58.709333 153.721905-58.855619 212.236191-0.341334z"></path>
                      ) : (
                        <path d="M313.880381 196.754286a69.973333 69.973333 0 0 1 35.230476 19.139047l155.501714 155.526096 0.902096-0.926477 44.958476 45.446096-0.658286 0.682666 122.368 122.368 86.308572 87.259429-167.740953 167.765333c-48.566857 48.542476-130.096762 45.714286-182.125714-6.339047L92.94019 472.015238c-26.014476-26.038857-27.452952-66.80381-3.169523-91.062857 9.069714-9.094095 20.943238-14.921143 33.962666-16.725333l103.277715-14.287238 14.287238-103.277715c4.827429-34.840381 37.302857-57.173333 72.557714-49.907809z m-11.385905 62.902857l-18.70019 147.065905-147.041524 18.675809 318.098286 318.122667c26.233905 26.233905 66.876952 28.111238 90.794666 4.193524l122.441143-122.441143-365.592381-365.592381z m529.359238-4.534857l101.10781 101.107809c24.966095 24.966095 24.746667 65.682286-0.487619 90.916572l-146.285715 146.212571-44.934095-45.446095 146.017524-145.968762-101.13219-101.10781c-33.28-33.28-87.527619-32.987429-121.173334 0.658286l-84.187428 84.163048-44.958477-45.470476 83.919239-83.870477c58.904381-58.904381 153.84381-59.440762 212.114285-1.194666z"></path>
                      )}
                    </svg>
                  ) : item.customIcon === 'record' ? (
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="#0F1419">
                      {isActive ? (
                        <path d="M914.285714 512c0 211.017143-161.231238 384.24381-366.787047 402.285714v-212.23619h-70.997334V914.285714C270.969905 896.24381 109.714286 723.017143 109.714286 512c0-211.017143 161.231238-384.24381 366.787047-402.285714v212.23619h70.997334V109.714286C753.030095 127.75619 914.285714 300.982857 914.285714 512z m-264.240762 23.747048H373.955048l-27.599238 95.036952h331.28838l-27.599238-95.036952z m27.599238-142.531048H346.35581l27.599238 95.036952h276.089904l27.599238-95.036952z"></path>
                      ) : (
                        <path d="M512 109.714286c222.183619 0 402.285714 180.102095 402.285714 402.285714S734.183619 914.285714 512 914.285714 109.714286 734.183619 109.714286 512 289.816381 109.714286 512 109.714286z m35.498667 72.874666v140.092953h-70.997334V182.613333C310.223238 200.289524 180.711619 341.016381 180.711619 512c0 170.983619 129.511619 311.710476 295.789714 329.411048v-140.092953h70.997334v140.092953c166.278095-17.700571 295.789714-158.427429 295.789714-329.411048 0-170.983619-129.511619-311.710476-295.789714-329.411048z m102.546285 353.084953l27.599238 94.646857H346.35581l27.599238-94.646857h276.089904z m27.599238-141.994667l-27.599238 94.646857H373.955048l-27.599238-94.646857h331.28838z"></path>
                      )}
                    </svg>
                  ) : item.customIcon === 'transaction' ? (
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-2" fill="#0F1419">
                      {isActive ? (
                        <path d="M926.47619 341.333333v170.666667h-108.787809l0.975238-0.926476-120.685714-120.685714-206.896762 206.87238L609.52381 715.678476V853.333333H170.666667a73.142857 73.142857 0 0 1-73.142857-73.142857V341.333333h828.95238z m-228.522666 118.00381l51.736381 51.712L699.952762 560.761905 780.190476 560.761905a146.285714 146.285714 0 1 1 0 292.571428h-121.904762v-73.142857h121.904762a73.142857 73.142857 0 0 0 4.291048-146.163809L780.190476 633.904762l-80.067047-0.024381 49.566476 49.566476-51.736381 51.736381-137.898667-137.923048 137.898667-137.923047zM414.47619 438.857143H219.428571v73.142857h195.047619v-73.142857zM853.333333 170.666667a73.142857 73.142857 0 0 1 73.142857 73.142857v48.761905H97.52381v-48.761905a73.142857 73.142857 0 0 1 73.142857-73.142857h682.666666z"></path>
                      ) : (
                        <path d="M853.333333 170.666667a73.142857 73.142857 0 0 1 73.142857 73.142857v268.190476h-73.142857v-146.285714H170.666667v414.47619h438.857143v73.142857H170.666667c-40.399238 0-73.142857-31.378286-73.142857-70.095238V243.809524a73.142857 73.142857 0 0 1 73.142857-73.142857h682.666666z m-155.379809 288.670476l51.736381 51.712L699.952762 560.761905 780.190476 560.761905a146.285714 146.285714 0 1 1 0 292.571428h-121.904762v-73.142857h121.904762a73.142857 73.142857 0 0 0 4.291048-146.163809L780.190476 633.904762l-80.067047-0.024381 49.566476 49.566476-51.736381 51.736381-137.898667-137.923048 137.898667-137.923047zM414.47619 414.47619v73.142858H219.428571v-73.142858h195.047619z m438.857143-170.666666H170.666667v48.761905h682.666666v-48.761905z"></path>
                      )}
                    </svg>
                  ) : (
                    <item.icon className="w-6 h-6 mr-2" style={{ color: isActive ? '#0F1419' : '#9CA3AF' }} />
                  )}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </aside>
      )}

      {/* 左侧边栏 - 仅在研究室页面显示 */}
      {isResearchPage && (
        <aside
          className="fixed left-0 top-[52px] bottom-0 w-[166px] bg-white border-r border-gray-200 overflow-y-auto z-40 pt-0"
          style={{ width: 'clamp(140px, 15vw, 166px)' }}
        >
          <div className="px-3 pt-2.5 space-y-2.5">
            {researchMenuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center h-[42px] px-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    item.id === 'stockpool' ? 'mt-2.5' : ''
                  } ${
                    isActive
                      ? 'bg-gray-100 text-[#0F1419]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.customIcon === 'stockpool' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 mr-2"
                      fill="#0F1419"
                    >
                      {isActive ? (
                        <path d="M682.666667 804.571429v73.142857H341.333333v-73.142857h341.333334z m170.666666-658.285715a73.142857 73.142857 0 0 1 73.142857 73.142857v463.238096a73.142857 73.142857 0 0 1-73.142857 73.142857H170.666667a73.142857 73.142857 0 0 1-73.142857-73.142857V219.428571a73.142857 73.142857 0 0 1 73.142857-73.142857h682.666666z m-170.666666 268.190476H341.333333v73.142858h341.333334v-73.142858z"></path>
                      ) : (
                        <path d="M853.333333 146.285714a73.142857 73.142857 0 0 1 73.142857 73.142857v463.238096a73.142857 73.142857 0 0 1-73.142857 73.142857H170.666667a73.142857 73.142857 0 0 1-73.142857-73.142857V219.428571a73.142857 73.142857 0 0 1 73.142857-73.142857h682.666666z m0 73.142857H170.666667v463.238096h682.666666V219.428571z m-170.666666 195.047619v73.142858H341.333333v-73.142858h341.333334zM341.333333 804.571429h341.333334v73.142857H341.333333z"></path>
                      )}
                    </svg>
                  ) : item.customIcon === 'technical' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 mr-2"
                      fill="#0F1419"
                    >
                      {isActive ? (
                        <path d="M772.437333 90.136381l51.712 51.712-136.094476 136.094476h132.973714a71.094857 71.094857 0 0 1 71.314286 70.89981v472.600381a71.094857 71.094857 0 0 1-71.314286 70.899809H202.971429A71.094857 71.094857 0 0 1 131.657143 821.443048V348.842667A71.094857 71.094857 0 0 1 202.971429 277.942857h132.949333L199.850667 141.848381l51.712-51.712 187.806476 187.806476h145.237333L772.437333 90.136381zM548.571429 414.47619h-73.142858v341.333334h73.142858V414.47619zM414.47619 487.619048h-73.142857v195.047619h73.142857v-195.047619z m268.190477 24.380952h-73.142857v146.285714h73.142857v-146.285714z"></path>
                      ) : (
                        <path d="M772.437333 97.52381l51.712 51.712-126.342095 126.342095H828.952381a73.142857 73.142857 0 0 1 73.142857 73.142857v487.619048a73.142857 73.142857 0 0 1-73.142857 73.142857H195.047619a73.142857 73.142857 0 0 1-73.142857-73.142857v-487.619048a73.142857 73.142857 0 0 1 73.142857-73.142857h131.120762L199.850667 149.23581 251.562667 97.52381l178.054095 178.054095h164.742095L772.437333 97.52381zM828.952381 348.720762H195.047619v487.619048h633.904762v-487.619048z m-280.380952 73.142857v341.333333h-73.142858v-341.333333h73.142858z m-134.095239 73.142857v195.047619h-73.142857v-195.047619h73.142857z m268.190477 24.380953v146.285714h-73.142857v-146.285714h73.142857z"></path>
                      )}
                    </svg>
                  ) : (
                    <item.icon className="w-6 h-6 mr-2" style={{ color: isActive ? '#0F1419' : '#9CA3AF' }} />
                  )}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </aside>
      )}

      {/* 左侧边栏 - 仅在设置页面显示 */}
      {isSettingsPage && (
        <aside
          className="fixed left-0 top-[52px] bottom-0 w-[166px] bg-white border-r border-gray-200 overflow-y-auto z-40 pt-0"
          style={{ width: 'clamp(140px, 15vw, 166px)' }}
        >
          <div className="px-3 pt-2.5 space-y-2.5">
            {settingsMenuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center h-[42px] px-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    item.id === 'database' ? 'mt-2.5' : ''
                  } ${
                    isActive
                      ? 'bg-gray-100 text-[#0F1419]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.customIcon === 'database' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-[22px] h-[22px] mr-2"
                      fill="#0F1419"
                      style={{ flexShrink: 0 }}
                    >
                      {isActive ? (
                        <path d="M828.952381 121.904762a73.142857 73.142857 0 0 1 73.142857 73.142857v633.904762a73.142857 73.142857 0 0 1-73.142857 73.142857H195.047619a73.142857 73.142857 0 0 1-73.142857-73.142857V195.047619a73.142857 73.142857 0 0 1 73.142857-73.142857h633.904762zM316.952381 719.238095H195.047619V828.952381h121.904762v-109.714286z m512 0H390.095238V828.952381h438.857143v-109.714286zM316.952381 536.380952H195.047619v109.714286h121.904762V536.380952z m512 0H390.095238v109.714286h438.857143V536.380952z m-512-182.857142H195.047619V463.238095h121.904762v-109.714285z m512 0H390.095238V463.238095h438.857143v-109.714285z"></path>
                      ) : (
                        <path d="M828.952381 121.904762a73.142857 73.142857 0 0 1 73.142857 73.142857v633.904762a73.142857 73.142857 0 0 1-73.142857 73.142857H195.047619a73.142857 73.142857 0 0 1-73.142857-73.142857V195.047619a73.142857 73.142857 0 0 1 73.142857-73.142857h633.904762zM316.952381 719.238095H195.047619V828.952381h121.904762v-109.714286z m512 0H390.095238V828.952381h438.857143v-109.714286zM316.952381 536.380952H195.047619v109.714286h121.904762V536.380952z m512 0H390.095238v109.714286h438.857143V536.380952zM195.047619 353.52381V463.238095h121.904762v-109.714285H195.047619zM828.952381 195.047619H195.047619v85.333333h633.904762V195.047619zM390.095238 463.238095h438.857143v-109.714285H390.095238V463.238095z"></path>
                      )}
                    </svg>
                  ) : (
                    <item.icon className="w-6 h-6 mr-2" style={{ color: isActive ? '#0F1419' : '#9CA3AF' }} />
                  )}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </aside>
      )}
    </>
  )
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  )
}

function AppContent() {
  const location = useLocation()
  const tradingMenuItems = [
    { path: '/daily-work' },
    { path: '/psychological-test' },
    { path: '/trading-strategy' },
    { path: '/risk-model' },
    { path: '/order-management' },
    { path: '/trade-records' },
    { path: '/transaction-history' },
  ]
  const researchMenuItems = [
    { path: '/stock-pool' },
    { path: '/technical-indicators' },
  ]
  const settingsMenuItems = [
    { path: '/database-management' },
  ]

  const isTradingPage = tradingMenuItems.some(item => item.path === location.pathname)
  const isResearchPage = researchMenuItems.some(item => item.path === location.pathname)
  const isSettingsPage = settingsMenuItems.some(item => item.path === location.pathname)

  return (
    <div className="h-screen bg-gray-50 overflow-hidden" style={{ margin: '0', padding: '0' }}>
          <DataSync />
          <Navigation />
          <main
            className="w-full"
            style={{
              padding: '0',
              margin: '0',
              height: 'calc(100vh)',
              position: 'relative',
              marginLeft: (isTradingPage || isResearchPage || isSettingsPage) ? '10px' : '0'
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/daily-work" element={<DailyWork />} />
              <Route path="/psychological-test" element={<PsychologicalTest />} />
              <Route path="/trading-strategy" element={<TradingStrategy />} />
              <Route path="/technical-indicators" element={<TechnicalIndicators />} />
              <Route path="/risk-model" element={<RiskModel />} />
              <Route path="/stock-pool" element={<StockPool />} />
              <Route path="/order-management" element={<OrderManagement />} />
              <Route path="/transaction-history" element={<TransactionHistory />} />
              <Route path="/trade-records" element={<TradeRecords />} />
              <Route path="/database-management" element={<DatabaseManagement />} />
            </Routes>
          </main>
        </div>
  )
}

export default App
