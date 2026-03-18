import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, TrendingUp, Shield, Target, Brain, LineChart, BarChart3, PieChart, Activity, DollarSign, TrendingDown, Cpu, Zap, Network, Database, ClipboardCheck, AlertTriangle, Clock, Star, Code } from 'lucide-react'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'
import useStore from '../store/useStore'

const Home = () => {
  const account = useStore(state => state.account)
  const orders = useStore(state => state.orders)
  const tradeRecords = useStore(state => state.tradeRecords)

  // 快速滚动效果状态
  const [phase, setPhase] = React.useState('pause') // 'pause' 或 'scroll'
  const [displayChars, setDisplayChars] = React.useState(['技', '术', '分', '析'])
  const wordIndexRef = React.useRef(0)
  const words = ['技术分析', '交易纪律', '制定策略', '风险控制', '交易复盘']

  React.useEffect(() => {
    if (phase === 'pause') {
      // 停留阶段：显示目标词1秒
      const targetWord = words[wordIndexRef.current]
      setDisplayChars(targetWord.split(''))
      const pauseTimer = setTimeout(() => {
        setPhase('scroll')
      }, 1000)
      return () => clearTimeout(pauseTimer)
    }

    if (phase === 'scroll') {
      // 快速滚动阶段：每个位置随机显示字符
      let scrollCount = 0
      const scrollInterval = setInterval(() => {
        scrollCount++
        // 为每个字符位置生成随机字符
        const randomChars = displayChars.map(() => {
          const allChars = words.join('') // 所有可能出现的字符
          return allChars[Math.floor(Math.random() * allChars.length)]
        })
        setDisplayChars(randomChars)

        // 快速滚动一段时间后，切换到下一个目标词
        if (scrollCount >= 8) {
          clearInterval(scrollInterval)
          wordIndexRef.current = (wordIndexRef.current + 1) % words.length
          setPhase('pause')
        }
      }, 60)

      return () => clearInterval(scrollInterval)
    }
  }, [phase])

  // 计算统计数据 - 基于所有订单
  // 由于不再使用状态，这里使用所有订单进行计算
  const allOrders = orders.filter(o => !o.deleted)  // 排除已删除的订单
  const profitableTrades = allOrders.filter(o => o.profit !== undefined && o.profit > 0)

  // 胜率 = 盈利订单数 / 订单总数
  const winRate = allOrders.length > 0
    ? Math.round((profitableTrades.length / allOrders.length) * 100)
    : 0

  const stats = [
    { label: '我的账户', value: account.balance || 0, prefix: '¥' },
    { label: '我的胜率', value: winRate, suffix: '%' },
    { label: '交易次数', value: allOrders.length },
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
      icon: Code,
      title: '技术指标',
      description: '全面分析市场数据，精准把握交易时机',
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
    <div style={{ margin: '0', padding: '0', overflowY: 'auto', height: '100vh' }}>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white" style={{ margin: '0', padding: '0', paddingTop: '72px', paddingLeft: '20px', minHeight: '100vh', maxWidth: '1920px', marginLeft: 'auto', marginRight: 'auto' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ margin: '0', padding: '0', width: '100%', minHeight: '100vh', maxHeight: 'calc(100vh - 72px)' }}>
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
              style={{ padding: '0', margin: '0', marginLeft: '80px', marginTop: '-60px' }}
            >
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="text-5xl md:text-6xl font-bold mb-2 leading-tight"
                style={{ fontSize: '64px', lineHeight: '78px', letterSpacing: 'normal', color: '#111827' }}
              >
                建立自己交易系统
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-5xl md:text-6xl font-bold leading-tight"
                style={{ fontSize: '64px', lineHeight: '78px', letterSpacing: 'normal', color: '#111827' }}
              >
                学习 <span style={{ color: '#3B82F6', fontWeight: '700' }}>{displayChars.map((char, index) => (
                  <span key={index}>{char}</span>
                ))}</span>
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-gray-600 mb-8 leading-relaxed"
                style={{ width: '80%', marginTop: '30px', fontSize: '18px' }}
              >
                告别非理性交易，严格遵守系统规则，做好每一步，将交易变成可重复的标准化
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <Link to="/daily-work">
                  <button
                    className="px-6 py-2 text-white inline-flex items-center group"
                    style={{ backgroundColor: '#0F1419', borderRadius: '0', fontSize: '16px' }}
                  >
                    立即开始
                    <div className="inline-flex items-center ml-2 transition-transform duration-150 group-hover:translate-x-1" style={{ willChange: 'transform' }}>
                      <ArrowRight className="w-5 h-5" style={{ position: 'relative', zIndex: 1 }} />
                      <ChevronRight style={{ marginLeft: '-8px', fontSize: '24px', fontWeight: 'bold', position: 'relative', zIndex: 2 }} />
                    </div>
                  </button>
                </Link>
                <Link to="/psychological-test">
                  <motion.button
                    className="px-6 py-2 transition-all duration-150"
                    style={{ backgroundColor: '#E5E7EB', borderRadius: '0', fontSize: '16px', color: '#0F1419' }}
                    whileHover={{ backgroundColor: '#D1D5DB' }}
                  >
                    心理测试
                  </motion.button>
                </Link>
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
                    交易记录
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
                    操作评级
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
                        <div className="text-sm text-white font-bold">{allOrders.length}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 业务模块概览 */}
      <section style={{ padding: '60px 20px', background: '#ffffff' }}>
        <ScrollAnimation className="mb-12">
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '16px', textAlign: 'center' }}>
            业务模块
          </h2>
          <p style={{ fontSize: '18px', color: '#6B7280', textAlign: 'center', marginBottom: '60px' }}>
            全面覆盖交易全流程，助力决策与执行
          </p>
        </ScrollAnimation>

        {/* 每日功课模块 */}
        <ScrollAnimation>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '24px',
            padding: '48px',
            marginBottom: '40px',
            color: '#ffffff',
            boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <TrendingUp style={{ width: '48px', height: '48px', color: '#ffffff' }} />
              <h3 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>每日功课</h3>
            </div>
            <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '32px', opacity: 0.95 }}>
              记录每日市场数据，追踪全球指数、大宗商品及汇率走势，通过情绪评估和预测模型辅助交易决策
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>市场指数</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>9+</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>情绪评估</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>冰点~沸点</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>数据维度</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>20+</div>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* 四大核心功能 */}
        <ScrollAnimation>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '40px' }}>
            {/* 心理测试 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E5E7EB',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <Brain style={{ width: '32px', height: '32px', color: '#ffffff' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>心理测试</h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6B7280', marginBottom: '24px' }}>
                通过标准心理量表评估交易情绪，生成心理指标报告，帮助识别决策中的情绪偏差
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '6px 14px', background: '#FCE7F3', borderRadius: '20px', fontSize: '14px', color: '#DB2777' }}>情绪稳定性</span>
                <span style={{ padding: '6px 14px', background: '#FCE7F3', borderRadius: '20px', fontSize: '14px', color: '#DB2777' }}>决策质量</span>
                <span style={{ padding: '6px 14px', background: '#FCE7F3', borderRadius: '20px', fontSize: '14px', color: '#DB2777' }}>风险偏好</span>
              </div>
            </motion.div>

            {/* 交易策略 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E5E7EB',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <Target style={{ width: '32px', height: '32px', color: '#ffffff' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>交易策略</h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6B7280', marginBottom: '24px' }}>
                自定义买入卖出策略，多维度评估标准配置，支持策略启用/停用，智能匹配交易机会
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '6px 14px', background: '#DBEAFE', borderRadius: '20px', fontSize: '14px', color: '#3B82F6' }}>策略配置</span>
                <span style={{ padding: '6px 14px', background: '#DBEAFE', borderRadius: '20px', fontSize: '14px', color: '#3B82F6' }}>评估标准</span>
                <span style={{ padding: '6px 14px', background: '#DBEAFE', borderRadius: '20px', fontSize: '14px', color: '#3B82F6' }}>启用/停用</span>
              </div>
            </motion.div>

            {/* 技术指标 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E5E7EB',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <LineChart style={{ width: '32px', height: '32px', color: '#ffffff' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>技术指标</h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6B7280', marginBottom: '24px' }}>
                股票K线数据管理与多维度技术指标计算，支持趋势、均线、震荡等多种分析工具
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '6px 14px', background: '#D1FAE5', borderRadius: '20px', fontSize: '14px', color: '#10B981' }}>K线数据</span>
                <span style={{ padding: '6px 14px', background: '#D1FAE5', borderRadius: '20px', fontSize: '14px', color: '#10B981' }}>技术分析</span>
                <span style={{ padding: '6px 14px', background: '#D1FAE5', borderRadius: '20px', fontSize: '14px', color: '#10B981' }}>指标计算</span>
              </div>
            </motion.div>

            {/* 风险模型 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E5E7EB',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <Shield style={{ width: '32px', height: '32px', color: '#ffffff' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>风险模型</h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#6B7280', marginBottom: '24px' }}>
                动态账户风险计算，最大亏损额度控制，支持多风险模型配置与启用，量化风险管理
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '6px 14px', background: '#FEF3C7', borderRadius: '20px', fontSize: '14px', color: '#D97706' }}>风险计算</span>
                <span style={{ padding: '6px 14px', background: '#FEF3C7', borderRadius: '20px', fontSize: '14px', color: '#D97706' }}>亏损控制</span>
                <span style={{ padding: '6px 14px', background: '#FEF3C7', borderRadius: '20px', fontSize: '14px', color: '#D97706' }}>模型配置</span>
              </div>
            </motion.div>
          </div>
        </ScrollAnimation>

        {/* 交易管理 */}
        <ScrollAnimation>
          <div style={{
            background: 'linear-gradient(135deg, #0F1419 0%, #1F2937 100%)',
            borderRadius: '24px',
            padding: '48px',
            marginTop: '60px',
            color: '#ffffff'
          }}>
            <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>交易管理</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Activity style={{ width: '28px', height: '28px', color: '#ffffff' }} />
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>股票交易</h4>
                <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '1.6' }}>
                  买入/卖出交易，智能关联订单，操作评级与交易评分
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Clock style={{ width: '28px', height: '28px', color: '#ffffff' }} />
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>预约订单</h4>
                <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '1.6' }}>
                  预设交易条件，自动触发执行，支持买入卖出策略
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <ClipboardCheck style={{ width: '28px', height: '28px', color: '#ffffff' }} />
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>交易记录</h4>
                <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '1.6' }}>
                  完整交易历史，支持筛选与统计，多维度数据导出
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <DollarSign style={{ width: '28px', height: '28px', color: '#ffffff' }} />
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>账单明细</h4>
                <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '1.6' }}>
                  资金流水记录，分类统计汇总，支持多格式导出
                </p>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* 股票行情 */}
        <ScrollAnimation>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '48px',
            marginTop: '60px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp style={{ width: '28px', height: '28px', color: '#ffffff' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>股票行情</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: '0' }}>实时监控自选股票，快速查看行情数据</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ padding: '24px', background: '#F9FAFB', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>股票代码</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>快速查询</div>
              </div>
              <div style={{ padding: '24px', background: '#F9FAFB', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>价格数据</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>实时更新</div>
              </div>
              <div style={{ padding: '24px', background: '#F9FAFB', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>自选管理</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>灵活配置</div>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </section>
      </div>
    </div>
  )
}

export default Home
