import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Brain, Target, Shield, Clock, Receipt, Activity, Home as HomeIcon, ChevronDown, Wallet2 } from 'lucide-react'
import Home from './pages/Home'
import DailyWork from './pages/DailyWork'
import PsychologicalTest from './pages/PsychologicalTest'
import TradingStrategy from './pages/TradingStrategy'
import RiskModel from './pages/RiskModel'
import OrderManagement from './pages/OrderManagement'
import TransactionHistory from './pages/TransactionHistory'
import TradeRecords from './pages/TradeRecords'
import useStore from './store/useStore'

function Navigation() {
  const [showTradingMenu, setShowTradingMenu] = useState(false)
  const location = useLocation()
  const account = useStore(state => state.account)

  const tradingMenuItems = [
    { id: 'daily', icon: TrendingUp, label: '每日功课', path: '/daily-work' },
    { id: 'psych', icon: Brain, label: '心理测试', path: '/psychological-test' },
    { id: 'strategy', icon: Target, label: '交易策略', path: '/trading-strategy' },
    { id: 'risk', icon: Shield, label: '风险模型', path: '/risk-model' },
    { id: 'order', icon: Clock, label: '预约单', path: '/order-management' },
    { id: 'transaction', icon: Receipt, label: '账单明细', path: '/transaction-history' },
    { id: 'record', icon: Activity, label: '交易记录', path: '/trade-records' },
  ]

  const isTradingPage = tradingMenuItems.some(item => item.path === location.pathname)

  return (
    <>
      {/* 顶部导航栏 */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50"
      >
        <div className="w-full px-5">
          <div className="flex items-center justify-between h-[52px]">
            {/* Logo */}
            <div className="flex items-center px-5">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Link to="/" className="flex items-center">
                  <img src="/Zeta.png" alt="Zeta Logo" style={{ height: '24px', width: 'auto' }} />
                </Link>
              </motion.div>
            </div>

            {/* 导航菜单 */}
            <div className="flex items-center flex-1 justify-start space-x-8 pl-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 text-base font-medium transition-all duration-300 text-gray-600 hover:text-gray-900"
                  style={{ fontSize: '16px' }}
                >
                  首页
                </Link>
              </motion.div>

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setShowTradingMenu(true)}
                  onMouseLeave={() => setShowTradingMenu(false)}
                  className="flex items-center px-3 py-2 text-base font-medium transition-all duration-300 text-gray-600 hover:text-gray-900"
                  style={{ fontSize: '16px' }}
                >
                  交易
                  <motion.div
                    animate={{ rotate: showTradingMenu ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {showTradingMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xl"
                      onMouseEnter={() => setShowTradingMenu(true)}
                      onMouseLeave={() => setShowTradingMenu(false)}
                    >
                      {tradingMenuItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                        >
                          <Link
                            to={item.path}
                            className="flex items-center px-4 py-3 text-sm transition-all duration-300 hover:pl-6 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            style={{ fontSize: '16px' }}
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  )
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50 pt-[52px]" style={{ margin: '0', padding: '0' }}>
        <Navigation />
        <main className="w-full" style={{ padding: '0', margin: '0' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/daily-work" element={<DailyWork />} />
            <Route path="/psychological-test" element={<PsychologicalTest />} />
            <Route path="/trading-strategy" element={<TradingStrategy />} />
            <Route path="/risk-model" element={<RiskModel />} />
            <Route path="/order-management" element={<OrderManagement />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
            <Route path="/trade-records" element={<TradeRecords />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
