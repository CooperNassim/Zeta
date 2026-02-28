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
  const location = useLocation()
  const account = useStore(state => state.account)

  const tradingMenuItems = [
    { id: 'daily', icon: TrendingUp, label: '每日功课', path: '/daily-work', customIcon: 'daily' },
    { id: 'psych', icon: Brain, label: '心理测试', path: '/psychological-test', customIcon: 'psych' },
    { id: 'strategy', icon: Target, label: '交易策略', path: '/trading-strategy', customIcon: 'strategy' },
    { id: 'risk', icon: Shield, label: '风险模型', path: '/risk-model', customIcon: 'risk' },
    { id: 'order', icon: Clock, label: '预约单', path: '/order-management', customIcon: 'order' },
    { id: 'transaction', icon: Receipt, label: '账单明细', path: '/transaction-history', customIcon: 'transaction' },
    { id: 'record', icon: Activity, label: '交易记录', path: '/trade-records', customIcon: 'record' },
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

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/daily-work"
                  className="flex items-center px-3 py-2 text-base font-medium transition-all duration-300 text-gray-600 hover:text-gray-900"
                  style={{ fontSize: '16px' }}
                >
                  交易
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* 左侧边栏 - 仅在交易页面显示 */}
      {isTradingPage && (
        <motion.aside
          initial={{ x: -200 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed left-0 top-[52px] bottom-0 w-[166px] bg-white border-r border-gray-200 overflow-y-auto z-40 pt-0"
        >
          <div className="px-0 space-y-1">
            {tradingMenuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center px-0 pl-5 py-[20px] text-sm font-medium transition-all duration-200 ${
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
        </motion.aside>
      )}
    </>
  )
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="h-screen bg-gray-50 overflow-hidden" style={{ margin: '0', padding: '0' }}>
        <Navigation />
        <main className="w-full" style={{ padding: '0', margin: '0', height: 'calc(100vh)', position: 'relative' }}>
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
