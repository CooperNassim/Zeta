import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, Shield, Target, Brain, LineChart, BarChart3, PieChart, Activity, DollarSign, TrendingDown, Cpu, Zap, Network, Database, ClipboardCheck, AlertTriangle, Clock, Star } from 'lucide-react'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'
import useStore from '../store/useStore'

const Home = () => {
  const account = useStore(state => state.account)
  const orders = useStore(state => state.orders)
  const tradeRecords = useStore(state => state.tradeRecords)

  // 计算统计数据 - 基于已执行的订单
  const executedOrders = orders.filter(o => o.status === 'executed')
  const profitableTrades = executedOrders.filter(o => o.profit !== undefined && o.profit > 0)

  // 胜率 = 盈利订单数 / 已执行订单总数
  const winRate = executedOrders.length > 0
    ? Math.round((profitableTrades.length / executedOrders.length) * 100)
    : 0

  const stats = [
    { label: '我的账户', value: account.balance || 0, prefix: '¥' },
    { label: '我的胜率', value: winRate, suffix: '%' },
    { label: '交易次数', value: executedOrders.length },
  ]

  const features = [
    {
      icon: Brain,
      title: '心理测试',
      description: '评估心理状态，确保交易决策时的情绪稳定',
      color: 'from-primary-50 to-primary-100',
    },
    {
      icon: Target,
      title: '交易策略',
      description: '灵活配置买卖策略，智能评估交易机会',
      color: 'from-primary-50 to-primary-100',
    },
    {
      icon: Shield,
      title: '风险模型',
      description: '科学管控风险，严格控制单笔亏损',
      color: 'from-primary-50 to-primary-100',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white" style={{ margin: '0', padding: '0', paddingTop: '72px', paddingLeft: '20px' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ margin: '0', padding: '0', width: '100%' }}>
        {/* 装饰性背景元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 渐变光晕 */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 right-[5%] w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.08, 0.15, 0.08],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-1/4 right-[20%] w-80 h-80 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"
          />


        </div>

        <div className="relative z-10" style={{ minHeight: 'calc(100vh - 56px)', padding: '0', margin: '0', width: '100%' }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center h-full" style={{ margin: '0', width: '100%' }}>
            {/* 左侧文字 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
              style={{ padding: '40px 0 0 0', margin: '0', marginLeft: '80px' }}
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg font-semibold text-primary-600 mb-4 tracking-wide"
              >
                AI驱动的智能交易系统
              </motion.h2>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
                style={{ height: '120px', fontSize: '48px', lineHeight: '60px', letterSpacing: 'normal', color: '#111827' }}
              >
                Where Trading
                <br />
                Meets Intelligence
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-xl text-gray-600 mb-8 leading-relaxed"
                style={{ width: '80%' }}
              >
                通过心理测试、交易策略和风险模型的智能评估，帮助您做出更理性的交易决策
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 122, 204, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-gradient-to-r from-primary-500 to-blue-600 rounded-xl text-white font-bold text-lg transition-all duration-300 inline-flex items-center"
                >
                  立即开始交易
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 font-bold text-lg hover:border-primary-500 transition-all duration-300"
                >
                  了解更多
                </motion.button>
              </motion.div>

              {/* 统计数据 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8"
              >
                {stats.map((stat, index) => (
                  <div key={stat.label}>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.prefix}
                      <Counter end={stat.value} duration={2} decimals={0} />
                      {stat.suffix}
                    </p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* 右侧机器人动画 */}
            <div className="relative h-full py-8 flex items-center overflow-visible" style={{ paddingLeft: '50px' }}>
              {/* 机器人主容器 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative"
                style={{ width: '500px', height: '500px' }}
              >
                {/* 背部火焰效果 - 最低层级，左下角 */}
                <motion.div
                  className="absolute"
                  style={{
                    bottom: '15%',
                    left: '25%',
                    width: '250px',
                    height: '350px',
                    zIndex: -1,
                    transform: 'rotate(-45deg)',
                  }}
                >
                  {/* 单条大的喷射火焰 */}
                  <motion.svg
                    className="absolute bottom-0 left-1/2 -translate-x-1/2"
                    width="100"
                    height="300"
                    viewBox="0 0 100 300"
                    style={{ filter: 'blur(4px)' }}
                  >
                    <defs>
                      {/* 主火焰渐变 - 从喷射口向上 */}
                      <linearGradient id="flameGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                        <stop offset="25%" stopColor="#7dd3fc" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.7" />
                        <stop offset="75%" stopColor="#22d3ee" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
                      </linearGradient>

                      {/* 核心火焰渐变 */}
                      <linearGradient id="coreGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0" />
                        <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.6" />
                        <stop offset="65%" stopColor="#22d3ee" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
                      </linearGradient>

                      {/* 外部光晕渐变 */}
                      <radialGradient id="glowGradient" cx="50%" cy="85%" r="50%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* 外部光晕 */}
                    <motion.ellipse
                      cx="50"
                      cy="260"
                      rx="40"
                      ry="15"
                      fill="url(#glowGradient)"
                      animate={{
                        rx: [40, 45, 40],
                        ry: [15, 18, 15],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* 主火焰 - 单条大的拖尾 */}
                    <motion.path
                      d="M50 300 L55 250 Q80 200 70 150 Q85 100 75 60 Q90 40 85 20 Q88 10 85 0 Q82 5 80 15 Q75 30 72 45 Q80 70 75 95 Q85 120 78 150 Q68 180 72 210 Q62 240 65 270 Q50 285 35 270 Q38 240 28 210 Q18 180 25 150 Q20 120 30 95 Q25 70 28 45 Q22 30 18 15 Q15 5 12 0 Q10 10 7 20 Q5 40 20 60 Q10 100 25 150 Q15 200 30 250 L50 300 Z"
                      fill="url(#flameGradient)"
                      animate={{
                        d: [
                          "M50 300 L55 250 Q80 200 70 150 Q85 100 75 60 Q90 40 85 20 Q88 10 85 0 Q82 5 80 15 Q75 30 72 45 Q80 70 75 95 Q85 120 78 150 Q68 180 72 210 Q62 240 65 270 Q50 285 35 270 Q38 240 28 210 Q18 180 25 150 Q20 120 30 95 Q25 70 28 45 Q22 30 18 15 Q15 5 12 0 Q10 10 7 20 Q5 40 20 60 Q10 100 25 150 Q15 200 30 250 L50 300 Z",
                          "M50 300 L58 248 Q82 198 72 148 Q87 98 77 58 Q92 38 87 18 Q90 8 87 -2 Q84 3 82 13 Q77 28 74 43 Q82 68 77 93 Q87 118 80 148 Q70 178 74 208 Q64 238 67 268 Q50 283 33 268 Q36 238 26 208 Q16 178 23 148 Q18 118 28 93 Q23 68 26 43 Q20 28 16 13 Q13 3 10 -2 Q8 8 5 18 Q3 38 18 58 Q8 98 23 148 Q13 198 28 248 L50 300 Z",
                          "M50 300 L52 252 Q78 202 68 152 Q83 102 73 62 Q88 42 83 22 Q86 12 83 2 Q80 7 78 17 Q73 32 70 47 Q78 72 73 97 Q83 122 76 152 Q66 182 70 212 Q60 242 63 272 Q50 287 37 272 Q40 242 30 212 Q20 182 27 152 Q22 122 32 97 Q27 72 30 47 Q24 32 20 17 Q17 7 14 2 Q12 12 9 22 Q7 42 22 62 Q12 102 27 152 Q17 202 42 252 L50 300 Z",
                          "M50 300 L55 250 Q80 200 70 150 Q85 100 75 60 Q90 40 85 20 Q88 10 85 0 Q82 5 80 15 Q75 30 72 45 Q80 70 75 95 Q85 120 78 150 Q68 180 72 210 Q62 240 65 270 Q50 285 35 270 Q38 240 28 210 Q18 180 25 150 Q20 120 30 95 Q25 70 28 45 Q22 30 18 15 Q15 5 12 0 Q10 10 7 20 Q5 40 20 60 Q10 100 25 150 Q15 200 30 250 L50 300 Z"
                        ]
                      }}
                      transition={{
                        duration: 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* 核心火焰 - 更亮更集中的拖尾 */}
                    <motion.path
                      d="M50 300 L53 260 Q68 220 62 175 Q75 140 68 105 Q78 85 74 60 Q77 50 74 40 Q76 45 74 50 Q71 60 69 70 Q76 85 72 100 Q82 125 76 160 Q68 190 72 220 Q64 250 66 275 Q50 288 34 275 Q36 250 28 220 Q20 190 24 160 Q18 125 28 100 Q24 85 21 70 Q19 60 16 50 Q18 45 20 40 Q17 50 14 60 Q12 85 22 105 Q8 140 12 175 Q6 220 17 260 L50 300 Z"
                      fill="url(#coreGradient)"
                      animate={{
                        d: [
                          "M50 300 L53 260 Q68 220 62 175 Q75 140 68 105 Q78 85 74 60 Q77 50 74 40 Q76 45 74 50 Q71 60 69 70 Q76 85 72 100 Q82 125 76 160 Q68 190 72 220 Q64 250 66 275 Q50 288 34 275 Q36 250 28 220 Q20 190 24 160 Q18 125 28 100 Q24 85 21 70 Q19 60 16 50 Q18 45 20 40 Q17 50 14 60 Q12 85 22 105 Q8 140 12 175 Q6 220 17 260 L50 300 Z",
                          "M50 300 L56 258 Q71 218 65 173 Q78 138 71 103 Q81 83 77 58 Q80 48 77 38 Q79 43 77 48 Q74 58 72 68 Q79 83 75 98 Q85 123 79 158 Q71 188 75 218 Q67 248 69 273 Q50 286 31 273 Q33 248 25 218 Q17 188 21 158 Q15 123 25 98 Q21 83 18 68 Q16 58 13 48 Q15 43 17 38 Q14 48 11 58 Q9 83 19 103 Q5 138 9 173 Q3 218 14 258 L50 300 Z",
                          "M50 300 L51 259 Q66 219 60 174 Q73 139 66 104 Q76 84 72 59 Q75 49 72 39 Q74 44 72 49 Q69 59 67 69 Q74 84 70 99 Q80 124 74 159 Q66 189 70 219 Q62 249 64 274 Q50 287 36 274 Q38 249 30 219 Q22 189 26 159 Q20 124 30 99 Q26 84 23 69 Q21 59 18 49 Q20 44 22 39 Q19 49 16 59 Q14 84 24 104 Q10 139 14 174 Q8 219 19 259 L50 300 Z",
                          "M50 300 L53 260 Q68 220 62 175 Q75 140 68 105 Q78 85 74 60 Q77 50 74 40 Q76 45 74 50 Q71 60 69 70 Q76 85 72 100 Q82 125 76 160 Q68 190 72 220 Q64 250 66 275 Q50 288 34 275 Q36 250 28 220 Q20 190 24 160 Q18 125 28 100 Q24 85 21 70 Q19 60 16 50 Q18 45 20 40 Q17 50 14 60 Q12 85 22 105 Q8 140 12 175 Q6 220 17 260 L50 300 Z"
                        ]
                      }}
                      transition={{
                        duration: 0.25,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.svg>
                </motion.div>

                {/* 机器人图片 */}
                <motion.img
                  src="/Robot3.png"
                  alt="AI Robot"
                  className="relative w-full h-full object-contain"
                  style={{ zIndex: 1 }}
                  animate={{
                    y: [0, -15, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />



                {/* 功能图标围绕机器人 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-[5%] right-[5%]"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center justify-center relative overflow-hidden"
                    style={{
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
                    <Target className="w-8 h-8 text-white relative z-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-300" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-300" />
                  </motion.div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs rounded-full whitespace-nowrap border border-cyan-400/30 backdrop-blur-sm">
                    策略评估
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute top-[25%] left-[2%]"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl shadow-2xl shadow-purple-500/30 flex items-center justify-center relative overflow-hidden"
                    style={{
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
                    <Shield className="w-7 h-7 text-white relative z-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-300" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-300" />
                  </motion.div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs rounded-full whitespace-nowrap border border-purple-400/30 backdrop-blur-sm">
                    风险管控
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="absolute bottom-[25%] right-[2%]"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-2xl shadow-green-500/30 flex items-center justify-center relative overflow-hidden"
                    style={{
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-300 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
                    <Clock className="w-7 h-7 text-white relative z-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-300" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-300" />
                  </motion.div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs rounded-full whitespace-nowrap border border-green-400/30 backdrop-blur-sm">
                    预约订单
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="absolute bottom-[5%] left-[5%]"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-2xl shadow-amber-500/30 flex items-center justify-center relative overflow-hidden"
                    style={{
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
                    <Star className="w-8 h-8 text-white relative z-10 drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-orange-300" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-orange-300" />
                  </motion.div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs rounded-full whitespace-nowrap border border-orange-400/30 backdrop-blur-sm">
                    交易评分
                  </div>
                </motion.div>

                {/* 下方数据流卡片 */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.5 }}
                  className="absolute bottom-[0%] left-1/2 -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-blue-600/90 to-cyan-600/90 backdrop-blur-xl rounded-xl border border-blue-400/30 shadow-2xl shadow-blue-500/30 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20" />
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400" />
                  <div className="relative flex items-center gap-4">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                    />
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] text-blue-200">我的账户</div>
                        <div className="text-sm text-white font-bold">¥{(account.balance || 0).toLocaleString()}</div>
                      </div>
                      <div className="w-px h-8 bg-white/20" />
                      <div>
                        <div className="text-[10px] text-blue-200">我的胜率</div>
                        <div className="text-sm text-white font-bold">{winRate}%</div>
                      </div>
                      <div className="w-px h-8 bg-white/20" />
                      <div>
                        <div className="text-[10px] text-blue-200">交易次数</div>
                        <div className="text-sm text-white font-bold">{executedOrders.length}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 核心功能 */}
      <section className="py-20 bg-white" style={{ margin: '0', padding: '0', width: '100%' }}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">核心功能</h2>
            <p className="text-xl text-gray-600">智能化交易，全方位保障</p>
          </motion.div>

          <ScrollAnimation className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group"
              >
                <motion.div
                  className="glass rounded-2xl p-8 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover-float cursor-pointer h-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <feature.icon className="w-8 h-8 text-gray-900" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </ScrollAnimation>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-500 to-blue-600" style={{ margin: '0', padding: '0', width: '100%' }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              开启您的智能交易之旅
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              立即加入，体验AI驱动的智能交易系统，让每一次交易都更加理性
            </p>
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg transition-all duration-300 inline-flex items-center hover:shadow-2xl"
            >
              立即开始
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
