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
import useStore from './store/useStore'
import { ToastProvider } from './contexts/ToastContext'

// 清除localStorage缓存
const CLEAR_CACHE_KEY = 'zeta_cache_cleared_v2'
const CURRENT_CACHE_VERSION = '2026-03-12-v3'

if (typeof window !== 'undefined') {
  const lastCleared = localStorage.getItem(CLEAR_CACHE_KEY)
  if (lastCleared !== CURRENT_CACHE_VERSION) {
    console.log('[Cache] 清除localStorage缓存...')
    localStorage.clear()
    localStorage.setItem(CLEAR_CACHE_KEY, CURRENT_CACHE_VERSION)
    console.log('[Cache] 缓存已清除')
  }
}

// 使用相对路径，通过 Vite 代理到后端
const API_BASE_URL = ''

// 数据同步组件 - 只在首次加载和页面可见时同步
function DataSync() {
  const syncedRef = useRef(false)
  const isReadyRef = useRef(false)
  const lastSyncTimeRef = useRef(0)
  const store = useStore()

  // 检查后端是否就绪
  const checkBackendReady = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        cache: 'no-store'
      })
      return response.ok
    } catch {
      return false
    }
  }

  const syncData = useCallback(async () => {
    // 检查是否正在同步中（避免并发请求）
    if (syncedRef.current) {
      console.log('[DataSync] 正在同步中，跳过本次请求')
      return
    }

    // 检查是否距离上次同步太近（避免频繁同步）
    const now = Date.now()
    if (lastSyncTimeRef.current && now - lastSyncTimeRef.current < 1000) {
      console.log('[DataSync] 距离上次同步时间太短，跳过本次请求')
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
    syncedRef.current = true // 标记为正在同步

    console.log('[DataSync] 从数据库同步数据...')

    let retryCount = 0
    const maxRetries = 2
    const retryDelay = 1000

    const attemptSync = async () => {
      try {
        console.log('[DataSync] 正在请求 /api/sync/all...')
        const response = await fetch(`${API_BASE_URL}/api/sync/all`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })

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

          // 总是导入数据，即使是空数组也会清空本地旧数据
          if (trade_orders) store.importOrders(trade_orders)
          if (transactions) store.importTransactions(transactions)
          if (trade_records) store.importTradeRecords(trade_records)
          if (stock_pool) store.importStocks(stock_pool)
          if (daily_work_data !== undefined) store.importDailyWorkData(daily_work_data)
          if (psychological_test_results !== undefined) store.importPsychologicalTestResults(psychological_test_results)
          if (psychological_indicators !== undefined) store.importPsychologicalIndicators(psychological_indicators)
          if (trading_strategies !== undefined) store.importTradingStrategies(trading_strategies)
          if (risk_config !== undefined) store.importRiskConfig(risk_config)

          // 更新上次同步时间
          lastSyncTimeRef.current = Date.now()
          console.log('[DataSync] 同步完成')
        } else {
          throw new Error(result.error || '同步响应格式错误')
        }
      } catch (error) {
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

    // 监听页面可见性变化，切换回来时同步
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[DataSync] 页面可见，重新同步...')
        syncedRef.current = false // 重置同步锁，允许立即同步
        syncData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 监听窗口获得焦点时同步
    const handleFocus = () => {
      console.log('[DataSync] 窗口获得焦点，重新同步...')
      syncedRef.current = false // 重置同步锁，允许立即同步
      syncData()
    }

    window.addEventListener('focus', handleFocus)

    // 定时自动同步（每2秒同步一次）
    const syncInterval = setInterval(() => {
      console.log('[DataSync] 定时自动同步...')
      syncData()
    }, 2000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      clearInterval(syncInterval)
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
    { id: 'stockpool', icon: Database, label: '股票行情', path: '/stock-pool', customIcon: 'stockpool' },
    { id: 'technical', icon: Target, label: '技术指标', path: '/technical-indicators', customIcon: 'technical' },
  ]

  const isTradingPage = tradingMenuItems.some(item => item.path === location.pathname)

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
                <img src="/Zeta.png" alt="Zeta Logo" style={{ height: '26.4px', width: 'auto', marginLeft: '20px' }} />
              </Link>
            </div>

            {/* 导航菜单 */}
            <div className="flex items-center flex-1 justify-start space-x-8 pl-8">
              <div>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center py-2 text-base font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 relative ${isActive ? 'text-gray-900' : ''}`
                  }
                  style={{ fontSize: '16px', paddingLeft: '18px', paddingRight: '18px' }}
                >
                  {({ isActive }) => (
                    <>
                      首页
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '18px',
                            right: '18px',
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
                    `flex items-center py-2 text-base font-medium transition-all duration-300 text-gray-600 hover:text-gray-900 relative ${isActive ? 'text-gray-900' : ''}`
                  }
                  style={{ fontSize: '16px', paddingLeft: '12px', paddingRight: '12px' }}
                >
                  {({ isActive }) => (
                    <>
                      交易
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '12px',
                            right: '12px',
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
        >
          <div className="px-0 space-y-1">
            {tradingMenuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center px-0 pl-5 py-[18px] text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0F1419] text-white'
                      : 'text-[#0F1419] hover:bg-gray-100'
                  }`}
                  style={{ fontSize: '15px' }}
                >
                  {item.customIcon === 'daily' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`}
                    >
                      <path
                        d="M547.84 693.76a34.56 34.56 0 0 1-35.84 32 33.92 33.92 0 0 1-35.84-32V419.2a35.84 35.84 0 0 1 71.68 0z m407.68-528.64a64 64 0 0 0-44.8-21.76H896c-42.24 7.04-79.36 13.44-111.36 19.84a542.08 542.08 0 0 0-76.8 19.84 297.6 297.6 0 0 0-67.84 23.68c-28.8 13.44-64 31.36-100.48 53.12a84.48 84.48 0 0 1-58.88 0c-37.12-18.56-70.4-34.56-96.64-48.64l-64-28.16a810.88 810.88 0 0 0-80-19.84c-31.36-6.4-69.12-12.8-114.56-19.84h-12.8a58.88 58.88 0 0 0-48.64 21.76 78.72 78.72 0 0 0-18.56 50.56v492.8a75.52 75.52 0 0 0 17.28 45.44 69.76 69.76 0 0 0 41.6 25.6c45.44 6.4 85.76 14.08 120.32 22.4l87.68 23.04 64 26.24a1048.96 1048.96 0 0 1 106.88 44.8 102.4 102.4 0 0 0 58.88 0c38.4-19.84 71.68-35.84 100.48-48.64a378.88 378.88 0 0 1 67.84-23.68l87.04-20.48 120.96-24.96a76.8 76.8 0 0 0 40.96-23.68 67.84 67.84 0 0 0 16.64-47.36V215.68a73.6 73.6 0 0 0-20.48-50.56z"
                        fill={isActive ? '#ffffff' : '#0F1419'}
                      />
                    </svg>
                  ) : item.customIcon === 'psych' ? (
                    <svg
                      viewBox="0 0 1026 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`}
                    >
                      <path
                        d="M1022.448485 314.957576c-18.618182-113.260606-108.606061-204.8-220.315152-226.521212-96.193939-18.618182-184.630303 12.412121-246.690909 71.369697-17.066667 17.066667-46.545455 15.515152-62.060606-3.103031-60.509091-68.266667-153.6-107.054545-256-89.987878C124.121212 85.333333 31.030303 175.321212 9.309091 290.133333c-15.515152 83.781818 3.10303 155.151515 48.09697 220.315152v1.551515l1.551515 3.10303c6.206061 12.412121 20.169697 31.030303 31.030303 40.339394l395.636363 429.769697c17.066667 18.618182 46.545455 18.618182 65.163637 0l392.533333-422.012121c4.654545-4.654545 9.309091-10.860606 15.515152-15.515152l3.10303-4.654545c49.648485-60.509091 76.024242-141.187879 60.509091-228.072727zM814.545455 529.066667l-170.666667 1.551515-31.030303 125.672727c-3.10303 12.412121-13.963636 21.721212-26.375758 23.272727h-3.10303c-10.860606 0-21.721212-6.206061-26.375758-15.515151l-139.636363-260.654546-34.133334 119.466667c-3.10303 12.412121-15.515152 21.721212-29.478787 21.721212H192.387879c-17.066667 0-31.030303-13.963636-31.030303-31.030303s13.963636-31.030303 31.030303-31.030303h138.084848l48.09697-169.115151c3.10303-12.412121 13.963636-20.169697 26.375758-21.721213 12.412121-1.551515 24.824242 4.654545 29.478787 15.515152l139.636364 259.10303 18.618182-72.921212c3.10303-13.963636 15.515152-23.272727 29.478788-23.272727l192.387879-3.10303c7.757576 0 15.515152 1.551515 20.169697 7.757575 6.206061 6.206061 10.860606 13.963636 10.860606 23.272728 0 17.066667-13.963636 31.030303-31.030303 31.030303z"
                        fill={isActive ? '#ffffff' : '#0F1419'}
                      />
                    </svg>
                  ) : item.customIcon === 'strategy' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`}
                    >
                      <path
                        d="M92.4 81v861.5H954V81H92.4z m513.5 646.9H220.3V665h385.6v62.9z m0-215.4H220.3v-62.9h385.6v62.9z m225 215.4H702.3V665h128.5v62.9z m0-215.4H702.3v-62.9h128.5v62.9z m61.5-246.9H154v-123h738.5v123z"
                        fill={isActive ? '#ffffff' : '#0F1419'}
                      />
                    </svg>
                  ) : item.customIcon === 'technical' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`}
                    >
                      <path
                        d="M826.4704 79.36c21.4016 18.7392 38.4512 34.4576 51.1488 47.3088 12.6464 12.8512 22.3744 23.7568 29.1328 32.7168 6.7072 8.96 10.9056 16.5376 12.4928 22.784 1.536 6.1952 2.3552 11.6736 2.3552 16.3328v18.688h-174.7968a30.208 30.208 0 0 1-22.016-8.7552 77.9776 77.9776 0 0 1-14.848-20.48 109.5168 109.5168 0 0 1-11.8784-44.3392V0h2.4064c7.1168 0 13.824 0.768 20.1728 2.3552 6.3488 1.536 14.08 5.2224 23.1936 11.0592s20.224 14.0288 33.28 24.576c13.1072 10.4448 29.5424 24.2688 49.3568 41.4208z m-203.264 66.56c0 14.848 2.3552 30.7712 7.1168 47.9232 4.7104 17.1008 12.288 32.8704 22.528 47.2576 10.3424 14.3872 23.4496 26.4704 39.2704 36.1984 15.872 9.728 34.5088 14.592 55.9104 14.592H921.6v585.0112c0 22.528-4.5568 42.8032-13.6704 60.672-9.1136 17.92-21.1968 33.28-36.2496 46.1312a171.008 171.008 0 0 1-49.9712 29.7984 148.5824 148.5824 0 0 1-53.504 10.496H255.7952c-15.104 0-31.5392-4.3008-49.3568-12.8a208.6912 208.6912 0 0 1-49.92-33.8944 192.4096 192.4096 0 0 1-38.656-48.4864A113.9712 113.9712 0 0 1 102.4 872.192V150.6304c0-16.384 3.9424-33.4848 11.8784-51.4048 7.936-17.92 18.432-34.048 31.5392-48.4352 13.056-14.3872 27.904-26.4704 44.544-36.1984C207.0528 4.864 224.4608 0 242.688 0h380.4672v145.92z m-95.1808 526.6432c9.5232-9.3696 14.6944-21.8112 15.4624-37.376 0.8192-15.5648-3.584-27.648-13.056-36.1984L335.4624 406.3232a48.128 48.128 0 0 0-35.1232-14.0288 48.128 48.128 0 0 0-35.072 14.0288 50.3296 50.3296 0 0 0-14.2336 35.6352c0 13.6192 4.7616 25.088 14.2336 34.4064l159.3344 158.8224-159.3344 157.6448a46.3872 46.3872 0 0 0-14.2336 34.4064c0 13.6192 4.7616 25.4976 14.2336 35.6352a48.128 48.128 0 0 0 35.072 14.0288c13.8752 0 25.6-4.7104 35.1232-14.0288l192.5632-190.3104z m243.7632 129.5872h-223.5392v73.5744h223.5392v-73.5744z"
                        fill={isActive ? '#ffffff' : '#0F1419'}
                      />
                    </svg>
                  ) : item.customIcon === 'risk' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`}
                    >
                      <path
                        d="M510.656012 0.00896c6.143946 0 12.351892 0.767993 16.895852 2.30398l380.796668 128.638874a26.23977 26.23977 0 0 1 16.767853 23.615794v535.99531c0 9.855914-6.399944 22.783801-14.143876 28.799748l-386.30062 298.429388a23.039798 23.039798 0 0 1-14.079877 4.543961 23.295796 23.295796 0 0 1-14.143876-4.543961L110.083517 719.362666a41.599636 41.599636 0 0 1-14.143876-28.799748V154.567608c0-9.791914 7.679933-20.479821 16.895852-23.551794l380.796668-128.638875A55.551514 55.551514 0 0 1 510.720011 0.00896z m115.774987 319.9972H483.520249c-1.023991 0-2.047982 0.639994-2.559977 1.855984l-96.575155 206.718191c-1.15199 2.495978 0.255998 5.567951 2.559977 5.567951h65.023431l-33.279709 165.246554c-0.767993 3.583969 2.751976 6.143946 4.927957 3.519969L639.102888 448.00504c1.919983-2.30398 0.639994-6.399944-2.047982-6.399944H554.879625l73.791354-115.582989C630.270965 323.590129 628.926977 320.00616 626.430999 320.00616z"
                        fill={isActive ? '#ffffff' : '#0F1419'}
                      />
                    </svg>
                  ) : item.customIcon === 'stockpool' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`}
                    >
                      <path
                        d="M891.014 919.275l-751.154 0.017c-17.975-0.017-34.445-16.537-34.486-34.487l0-212.937c0-34.589 17.37-52.689 35.606-35.348l101.585 79.955c13.648 11.687 34.159 27.584 45.575 13.724l116.429-141.367c11.418-13.859 32.013-33.427 45.77-21.858l100.187 87.228c13.751 11.553 42.225 31.726 53.415 17.666l249.285-300.427c33.671-38.437 71.223-29.419 71.223 17.673 0 35.093 0 495.69 0 495.69-0.001 17.95-15.469 34.487-33.436 34.47zM598.671 550.304c-9.228 11.821-22.852 19.364-37.754 20.931-14.929 1.769-29.807-3.013-41.266-12.646l-113.01-95.177-113.506 149.821c-9.069 11.939-22.574 19.718-37.46 21.489-2.163 0.251-4.337 0.386-6.509 0.386-12.654 0-25.015-4.38-34.917-12.496l-99.058-81.049c-23.584-19.282-27.061-54.054-7.772-77.639 19.274-23.617 54.038-27.069 77.614-7.772l54.761 44.794 113.987-150.478c9.142-12.075 22.817-19.838 37.839-21.521 15.13-1.65 30.093 2.913 41.662 12.612l113.625 95.709 146.807-184.141-40.912-33.983c-29.03-24.106-22.582-50.224 14.331-58.028l212.767-45.004c36.906-7.805 48.322 10.305 25.37 40.263l-306.597 393.925z"
                        fill={isActive ? '#ffffff' : '#0F1419'}
                      />
                    </svg>
                  ) : item.customIcon === 'order' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`}
                    >
                      <path
                        d="M511.998977 76.895321c-240.304018 0-435.105702 194.801684-435.105702 435.105702s194.801684 435.105702 435.105702 435.105702c240.306064 0 435.107749-194.801684 435.107749-435.105702S752.305041 76.895321 511.998977 76.895321L511.998977 76.895321zM722.356962 679.499875 403.693272 679.499875l4.082992 4.075829c16.46295 16.468067 21.561062 38.035268 5.098111 54.499242-16.46295 16.463973-38.117133 11.369955-54.579059-5.099135l-59.512419-59.591213c-4.130064-4.137227-7.547907-8.591679-10.088776-13.202697-0.183172-0.336668-0.366344-0.676405-0.540306-1.017166-5.574972-10.732435-6.390547-22.258956-0.444115-32.580023 6.457062-13.527085 21.330818-21.182438 38.587853-21.182438l396.054291 0c23.325241 0 42.192961 13.770632 42.192961 37.007869C764.544807 665.727197 745.676064 679.499875 722.356962 679.499875L722.356962 679.499875zM760.770853 431.582459c-6.449899 13.527085-21.323655 21.182438-38.587853 21.182438L326.128709 452.764897c-23.318078 0-42.187845-13.770632-42.187845-37.007869 0-23.319102 18.869766-37.095873 42.187845-37.095873l318.66369 0-4.081968-4.070712c-16.463973-16.46909-21.563108-38.036291-5.099135-54.499242 16.46295-16.46909 38.117133-11.364839 54.581106 5.098111l59.511395 59.592236c4.130064 4.136204 7.547907 8.591679 10.083659 13.202697 0.189312 0.334621 0.366344 0.670266 0.545422 1.016143C765.90785 409.733848 766.724449 421.260369 760.770853 431.582459L760.770853 431.582459zM760.770853 431.582459"
                        fill={isActive ? '#ffffff' : '#0F1419'}
                      />
                    </svg>
                  ) : item.customIcon === 'transaction' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`}
                    >
                      <path
                        d="M160 192h704a32 32 0 0 0 0-64H160a32 32 0 0 0 0 64zM896 256H128a64 64 0 0 0-64 64v576a64 64 0 0 0 64 64h768a64 64 0 0 0 64-64V320a64 64 0 0 0-64-64zM672 640a32 32 0 0 1 0 64H544v96a32 32 0 0 1-64 0v-96H352a32 32 0 0 1 0-64h128v-64H352a32 32 0 0 1 0-64h82.75l-73.38-73.37a32 32 0 0 1 45.26-45.26L512 498.75l105.37-105.38a32 32 0 0 1 45.26 45.26L589.25 512H672a32 32 0 0 1 0 64H544v64z"
                        fill={isActive ? '#ffffff' : '#0F1419'}
                      />
                    </svg>
                  ) : item.customIcon === 'record' ? (
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`}
                    >
                      <path
                        d="M512 89.429333A422.570667 422.570667 0 1 0 934.570667 512 422.570667 422.570667 0 0 0 512 89.429333z m151.210667 573.781334a34.133333 34.133333 0 0 1-48.128 0l-127.317334-126.976A34.133333 34.133333 0 0 1 477.866667 512V257.706667a34.133333 34.133333 0 0 1 68.266666 0v238.933333L663.210667 614.4a34.133333 34.133333 0 0 1 0 48.810667z"
                        fill={isActive ? '#ffffff' : '#0F1419'}
                      />
                    </svg>
                  ) : (
                    <item.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-[#0F1419]'}`} />
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
        <div className="h-screen bg-gray-50 overflow-hidden" style={{ margin: '0', padding: '0' }}>
          <DataSync />
          <Navigation />
          <main className="w-full" style={{ padding: '0', margin: '0', height: 'calc(100vh)', position: 'relative' }}>
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
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
