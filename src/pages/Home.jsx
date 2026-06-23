import React from 'react'
// import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, TrendingUp, Shield, Target, Brain, LineChart, Activity, DollarSign, ClipboardCheck, Clock, Star } from 'lucide-react'
import Counter from '../components/Counter'
import ScrollAnimation from '../components/ScrollAnimation'
import useStore from '../store/useStore'

const Home = () => {

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

  // 计算统计数据 - 基于交易记录
  // 使用 tradeRecords（交易记录）而不是 transactions（账单明细）
  const tradeRecords = useStore(state => state.tradeRecords)

  // 过滤非软删除记录（统一处理）
  const activeTradeRecords = tradeRecords.filter(t => !t.deleted)

  // 按 tradeNumber 去重（与交易记录页面逻辑一致，相同交易编号只保留一条）
  const deduplicatedRecordsMap = new Map()
  activeTradeRecords.forEach(r => {
    if (!deduplicatedRecordsMap.has(r.tradeNumber)) {
      deduplicatedRecordsMap.set(r.tradeNumber, { ...r })
    }
  })
  const deduplicatedRecords = Array.from(deduplicatedRecordsMap.values())

  // 1. 交易金额：Σ(买入金额+卖出金额)，取整四舍五入
  const tradeAmountRaw = deduplicatedRecords.reduce((sum, t) => {
    const buyAmt = parseFloat(t.buyAmount || t.buy_amount || 0)
    const sellAmt = parseFloat(t.sellAmount || t.sell_amount || 0)
    return sum + buyAmt + sellAmt
  }, 0)
  const tradeAmount = Math.round(tradeAmountRaw)

  // 2. 盈亏额：与交易记录页面逻辑一致，动态计算 (sellPrice - buyPrice) × sellQuantity
  const profitLossRaw = deduplicatedRecords.reduce((sum, t) => {
    const buyAmount = parseFloat(t.buyAmount || t.buy_amount || 0)
    const sellAmount = parseFloat(t.sellAmount || t.sell_amount || 0)
    const buyQuantity = parseFloat(t.buyQuantity || t.buy_quantity || 0)
    const sellQuantity = parseFloat(t.sellQuantity || t.sell_quantity || 0)
    if (sellQuantity === 0) return sum
    const buyPrice = t.buyPrice != null ? t.buyPrice : (buyQuantity > 0 ? buyAmount / buyQuantity : 0)
    const sellPrice = t.sellPrice != null ? t.sellPrice : (sellQuantity > 0 ? sellAmount / sellQuantity : 0)
    return sum + (sellPrice - buyPrice) * sellQuantity
  }, 0)
  const profitLoss = Math.round(profitLossRaw)

  // 3. 手续费：Σ手续费，取整四舍五入
  const totalFeeRaw = deduplicatedRecords.reduce((sum, t) => {
    const tradeCommission = parseFloat(t.tradeCommission || t.trade_commission || 0)
    const sellTradeCommission = parseFloat(t.sellTradeCommission || t.sell_trade_commission || 0)
    const otherFees = parseFloat(t.otherFees || t.other_fees || 0)
    const sellOtherFees = parseFloat(t.sellOtherFees || t.sell_other_fees || 0)
    return sum + tradeCommission + sellTradeCommission + otherFees + sellOtherFees
  }, 0)
  const totalFee = Math.round(totalFeeRaw)

  // 4. 交易记录：Σ数据量（相同交易编号的买入和卖出算1条），取整四舍五入
  const tradeRecordsCount = deduplicatedRecords.length

  const stats = [
    { label: '交易金额', value: tradeAmount, prefix: '' },
    { label: '盈亏额', value: profitLoss, prefix: '', showSign: true },
    { label: '手续费', value: totalFee, prefix: '' },
    { label: '交易记录', value: tradeRecordsCount, prefix: '' },
  ]

  return (
    <div style={{ margin: '0', padding: '0', overflowY: 'auto', height: '100vh' }}>
      <style>
        {`
          /* 响应式布局 - 工作流卡片 */
          .workflow-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          @media (min-width: 600px) {
            .workflow-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 16px !important;
            }
          }
          @media (min-width: 900px) {
            .workflow-grid {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 20px !important;
            }
          }
          @media (min-width: 1200px) {
            .workflow-grid {
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 24px !important;
            }
          }
          @media (min-width: 1600px) {
            .workflow-grid {
              grid-template-columns: repeat(5, 1fr) !important;
              gap: 24px !important;
            }
          }
          /* 响应式布局 - 核心功能模块 */
          @media (max-width: 1100px) {
            .features-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }
          @keyframes flamePulse {
            0%, 100% {
              rx: 10px;
              ry: 15px;
            }
            50% {
              rx: 15px;
              ry: 22px;
            }
          }
          @keyframes flameWave {
            0%, 100% {
              transform: scale(1) scaleX(1);
            }
            50% {
              transform: scale(1.2) scaleX(1);
            }
          }
          @keyframes glowPulse1 {
            0%, 100% {
              transform: scale(1);
              opacity: 0.1;
            }
            50% {
              transform: scale(1.3);
              opacity: 0.2;
            }
          }
          @keyframes glowPulse2 {
            0%, 100% {
              transform: scale(1);
              opacity: 0.08;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.15;
            }
          }
          @keyframes iconPulse {
            0%, 100% {
              transform: scale(1) rotate(0deg);
            }
            25% {
              transform: scale(1.1) rotate(5deg);
            }
            50% {
              transform: scale(1) rotate(0deg);
            }
            75% {
              transform: scale(1.1) rotate(-5deg);
            }
          }
          .feature-card {
            transition: all 0.3s ease;
          }
          .feature-card:hover {
            transform: scale(1.02) translateY(-5px);
          }
          @keyframes ripple {
            0% {
              transform: scale(0.8);
              opacity: 0.8;
            }
            100% {
              transform: scale(2.5);
              opacity: 0;
            }
          }
          .z-line {
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
          }
        `}
      </style>
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white" style={{ margin: '0', padding: '0', paddingTop: 'clamp(48px, 6vw, 72px)', paddingLeft: 'clamp(10px, 2vw, 20px)', minHeight: '100vh', maxWidth: '1920px', marginLeft: 'auto', marginRight: 'auto' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden flex flex-col" style={{ margin: '0', padding: '0', width: '100%', minHeight: 'calc(100vh - clamp(48px, 6vw, 72px))' }}>
        {/* 装饰性背景元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 渐变光晕 */}
          <div
            className="absolute top-1/4 right-[5%] w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
            style={{
              animation: 'glowPulse1 8s ease-in-out infinite'
            }}
          />
          <div
            className="absolute bottom-1/4 right-[20%] w-80 h-80 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"
            style={{
              animation: 'glowPulse2 10s ease-in-out infinite 2s'
            }}
          />


        </div>

        <div className="relative z-10 flex-1 flex flex-col" style={{ padding: '0', margin: '0', width: '100%' }}>
          <div className="grid lg:grid-cols-2 gap-12 w-full h-full" style={{ margin: '0', width: '100%', gap: 'clamp(20px, 3vw, 48px)' }}>
            {/* 左侧区域 - 分为上下两部分 */}
            <div style={{ padding: '0', margin: '0', marginLeft: 'clamp(40px, 6vw, 140px)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '8%' }}>
              <div>
                <h1
                  className="text-5xl md:text-6xl font-bold leading-tight"
                  style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: '1.22', letterSpacing: 'normal', color: '#111827', fontWeight: '1000', marginBottom: '0.5%' }}
                >
                  模拟交易协助系统
                </h1>
              <p
                className="text-5xl md:text-6xl font-bold leading-tight"
                style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: '1.22', letterSpacing: 'normal', color: '#111827', fontWeight: '1000', marginBottom: '6%' }}
              >
                学习 <span style={{
                  fontWeight: '1000',
                  background: 'linear-gradient(90deg, #06b6d4 0%, #3B82F6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>{displayChars.map((char, index) => (
                  <span key={index}>{char}</span>
                ))}</span>
              </p>
              <p
                className="text-gray-600 mb-8 leading-relaxed"
                style={{ width: 'clamp(60%, 80%, 90%)', marginTop: '5.5%', fontSize: 'clamp(14px, 1.5vw, 18px)' }}
              >
                帮助你建立专属的交易体系，该系统适合所有人
              </p>

              <div className="flex flex-wrap gap-4" style={{ marginTop: '6%' }}>
                <Link to="/daily-work">
                  <button
                    className="px-6 py-2 text-white inline-flex items-center group"
                    style={{ backgroundColor: '#0F1419', borderRadius: '0', fontSize: 'clamp(14px, 1.2vw, 16px)', padding: 'clamp(8px, 1vw, 12px) clamp(16px, 2vw, 24px)' }}
                  >
                    立即开始
                    <div className="inline-flex items-center ml-2 transition-transform duration-150 group-hover:translate-x-1" style={{ willChange: 'transform' }}>
                      <ArrowRight className="w-5 h-5" style={{ position: 'relative', zIndex: 1, width: 'clamp(16px, 2vw, 20px)', height: 'clamp(16px, 2vw, 20px)' }} />
                      <ChevronRight style={{ marginLeft: '-8px', fontSize: 'clamp(20px, 2.5vw, 24px)', fontWeight: 'bold', position: 'relative', zIndex: 2 }} />
                    </div>
                  </button>
                </Link>
                <Link to="/psychological-test">
                  <button
                    className="px-8 py-2 inline-flex items-center gap-2"
                    style={{ backgroundColor: '#E5E7EB', borderRadius: '0', fontSize: 'clamp(14px, 1.2vw, 16px)', color: '#0F1419', transition: 'none', padding: 'clamp(8px, 1vw, 12px) clamp(24px, 3vw, 32px)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1D5DB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                  >
                    心理测试
                    <svg
                      viewBox="0 0 1024 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-[18px] h-[18px]"
                      style={{ fill: '#0F1419', marginLeft: '2px', marginTop: '2px', width: 'clamp(19.6px, 2.1vw, 25.2px)', height: 'clamp(19.6px, 2.1vw, 25.2px)' }}
                    >
                      <path d="M512 97.52381c228.912762 0 414.47619 185.563429 414.47619 414.47619s-185.563429 414.47619-414.47619 414.47619S97.52381 740.912762 97.52381 512 283.087238 97.52381 512 97.52381z m185.002667 450.876952c-69.046857 192.219429-319.366095 192.219429-369.054477 3.072l-70.753523 18.578286c68.559238 260.87619 416.036571 260.87619 508.659809 3.072l-68.851809-24.722286zM414.47619 341.333333a48.761905 48.761905 0 0 0-48.761904 48.761905v73.142857a48.761905 48.761905 0 1 0 97.523809 0v-73.142857a48.761905 48.761905 0 0 0-48.761905-48.761905z m195.04762 0a48.761905 48.761905 0 0 0-48.761905 48.761905v73.142857a48.761905 48.761905 0 1 0 97.523809 0v-73.142857a48.761905 48.761905 0 0 0-48.761904-48.761905z" />
                    </svg>
                  </button>
                </Link>
              </div>
              </div>

              {/* 统计数据 - 下半部分 */}
              <div className="grid grid-cols-2 gap-6" style={{ paddingBottom: '16%', gap: 'clamp(20px, 2.5vw, 30px)', marginTop: '10px' }}>
                {stats.map((stat, index) => (
                  <div key={stat.label} style={index === 1 || index === 3 ? { marginLeft: '-30%', textAlign: 'left' } : {}}>
                    <p className="text-sm text-gray-600 mb-1" style={{ fontSize: 'clamp(12px, 1.3vw, 16px)' }}>{stat.label}</p>
                    <p className="font-bold text-gray-900" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>
                      {stat.prefix}
                      {stat.showSign && stat.value < 0 ? '-' : ''}
                      <Counter end={Math.abs(stat.value)} duration={2} decimals={0} />
                      {stat.suffix}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧机器人动画 - 垂直居中 */}
            <div className="relative h-full flex items-center" style={{ paddingLeft: 'clamp(20px, 3vw, 50px)' }}>
              {/* 机器人主容器 */}
              <div className="relative" style={{ width: '80%', height: '80%', maxWidth: '600px', maxHeight: '600px' }}>
                {/* 背部火焰效果 - 最低层级，左下角 */}
                <div
                  className="absolute"
                  style={{
                    bottom: '10%',
                    left: '32%',
                    width: '50%',
                    height: '70%',
                    zIndex: -1,
                    animation: 'float 3s ease-in-out infinite'
                  }}
                >
                  <div style={{ transform: 'rotate(-45deg)', width: '100%', height: '100%' }}>
                  {/* 单条大的喷射火焰 */}
                  <svg
                    className="absolute bottom-0 left-1/2 -translate-x-1/2"
                    width="100"
                    height="300"
                    viewBox="0 0 100 300"
                    style={{ filter: 'blur(4px)' }}
                  >
                    <defs>
                      {/* 主火焰渐变 - 从喷射口向上 */}
                      <linearGradient id="flameGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                        <stop offset="25%" stopColor="#22d3ee" stopOpacity="0.95" />
                        <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
                        <stop offset="75%" stopColor="#38bdf8" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.6" />
                      </linearGradient>

                      {/* 核心火焰渐变 */}
                      <linearGradient id="coreGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                        <stop offset="30%" stopColor="#22d3ee" stopOpacity="0.9" />
                        <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
                      </linearGradient>

                      {/* 外部光晕渐变 */}
                      <radialGradient id="glowGradient" cx="50%" cy="85%" r="50%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* 外部光晕 */}
                    <ellipse
                      cx="50"
                      cy="260"
                      rx="40"
                      ry="15"
                      fill="url(#glowGradient)"
                      style={{
                        animation: 'flamePulse 0.5s ease-in-out infinite'
                      }}
                    />

                      {/* 主火焰 - 单条大的拖尾 */}
                    <path
                      d="M50 300 L52 250 Q68 200 64 150 Q74 100 68 60 Q78 40 74 20 Q76 10 74 0 Q71 5 69 15 Q66 30 64 45 Q70 70 66 95 Q76 120 70 150 Q62 180 65 210 Q58 240 60 270 Q50 285 40 270 Q42 240 34 210 Q28 180 32 150 Q28 120 34 95 Q30 70 34 45 Q28 30 26 15 Q24 5 22 0 Q20 10 18 20 Q16 40 32 60 Q22 100 30 150 Q24 200 34 250 L50 300 Z"
                      fill="url(#flameGradient)"
                      style={{
                        animation: 'flameWave 0.3s ease-in-out infinite',
                        transformOrigin: '50% 100%'
                      }}
                    />

                    {/* 核心火焰 - 更亮更集中的拖尾 */}
                    <path
                      d="M50 300 L51 260 Q61 220 57 175 Q66 140 61 105 Q68 85 64 60 Q66 50 64 40 Q65 45 64 50 Q62 60 60 70 Q65 85 62 100 Q70 125 65 160 Q59 190 62 220 Q56 250 58 275 Q50 288 42 275 Q44 250 37 220 Q31 190 35 160 Q34 125 40 100 Q36 85 34 70 Q32 60 30 50 Q32 45 34 40 Q32 50 30 60 Q28 85 37 105 Q26 140 30 175 Q24 220 31 260 L50 300 Z"
                      fill="url(#coreGradient)"
                      style={{
                        animation: 'flameWave 0.25s ease-in-out infinite',
                        transformOrigin: '50% 100%'
                      }}
                    />
                  </svg>
                  </div>
                </div>

                {/* 机器人图片 */}
                <img
                  src="/Robot3.png"
                  alt="AI Robot"
                  className="relative w-full h-full object-contain"
                  style={{
                    zIndex: 1,
                    animation: 'float 3s ease-in-out infinite'
                  }}
                />



                {/* 功能图标围绕机器人 */}
                <div className="absolute top-[5%] right-[5%]">
                  <div
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center justify-center relative overflow-hidden"
                    style={{
                      animation: 'iconPulse 3s ease-in-out infinite',
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
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs rounded-full whitespace-nowrap border border-cyan-400/30 backdrop-blur-sm">
                    策略评估
                  </div>
                </div>

                <div className="absolute top-[25%] left-[2%]">
                  <div
                    className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl shadow-2xl shadow-purple-500/30 flex items-center justify-center relative overflow-hidden"
                    style={{
                      animation: 'iconPulse 3.5s ease-in-out infinite',
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
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs rounded-full whitespace-nowrap border border-purple-400/30 backdrop-blur-sm">
                    风险管控
                  </div>
                </div>

                <div className="absolute bottom-[25%] right-[2%]">
                  <div
                    className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-2xl shadow-green-500/30 flex items-center justify-center relative overflow-hidden"
                    style={{
                      animation: 'iconPulse 4s ease-in-out infinite',
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
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs rounded-full whitespace-nowrap border border-green-400/30 backdrop-blur-sm">
                    交易记录
                  </div>
                </div>

                <div className="absolute bottom-[5%] left-[5%]">
                  <div
                    className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-2xl shadow-amber-500/30 flex items-center justify-center relative overflow-hidden"
                    style={{
                      animation: 'iconPulse 3.5s ease-in-out infinite',
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
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs rounded-full whitespace-nowrap border border-orange-400/30 backdrop-blur-sm">
                    操作评级
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 模块展示区域 - HuggingFace 风格 ========== */}
      <style>
        {`
          .module-screenshot {
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
            border: 1px solid #E5E7EB;
            overflow: hidden;
            transition: all 0.4s ease;
            background: #ffffff;
          }
          .module-screenshot:hover {
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
            transform: translateY(-4px);
          }
          .module-screenshot img {
            width: 100%;
            height: auto;
            display: block;
          }
          .module-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          .module-title {
            font-size: clamp(28px, 3.5vw, 40px);
            font-weight: 800;
            color: #111827;
            margin-bottom: 16px;
            line-height: 1.2;
          }
          .module-desc {
            font-size: 16px;
            color: #6B7280;
            line-height: 1.8;
            margin-bottom: 24px;
          }
          .module-features {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 28px;
          }
          .module-feature-tag {
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            background: #F3F4F6;
            color: #4B5563;
          }
          .module-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .module-link:hover {
            gap: 12px;
          }
          .module-divider {
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
            height: 1px;
            background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
          }
          .module-section {
            padding: 80px 20px;
          }
          .module-section:nth-child(odd) {
            background: #ffffff;
          }
          .module-section:nth-child(even) {
            background: #FAFBFC;
          }
          .module-inner {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            gap: 60px;
          }
          .module-inner.reverse {
            flex-direction: row-reverse;
          }
          .module-text {
            flex: 1;
            min-width: 0;
          }
          .module-image {
            flex: 1.2;
            min-width: 0;
          }
          @media (max-width: 1024px) {
            .module-inner, .module-inner.reverse {
              flex-direction: column;
              gap: 40px;
            }
            .module-image {
              width: 100%;
            }
          }
        `}
      </style>

      {/* 模块1: 每日功课 - 截图在右 */}
      <section className="module-section">
        <div className="module-inner">
          <div className="module-text">
            <ScrollAnimation>
              <div className="module-tag" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                <TrendingUp style={{ width: '16px', height: '16px' }} />
                数据驱动
              </div>
              <h2 className="module-title">每日功课</h2>
              <p className="module-desc">
                记录每日全球市场数据，追踪纳斯达克、英国富时、德国DAX、恒生指数等主要指数走势，
                结合大宗商品、外汇汇率等多维度数据，通过情绪评估和预测模型辅助交易决策。
              </p>
              <div className="module-features">
                <span className="module-feature-tag">全球指数追踪</span>
                <span className="module-feature-tag">大宗商品监控</span>
                <span className="module-feature-tag">外汇汇率</span>
                <span className="module-feature-tag">情绪评估</span>
                <span className="module-feature-tag">数据导入导出</span>
              </div>
              <Link to="/daily-work" className="module-link" style={{ color: '#4F46E5' }}>
                进入每日功课
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </ScrollAnimation>
          </div>
          <div className="module-image">
            <ScrollAnimation>
              <div className="module-screenshot">
                <img src="/images/home/daily-work.png" alt="每日功课界面" loading="lazy" />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      <div className="module-divider" />

      {/* 模块2: 心理测试 - 截图在左 */}
      <section className="module-section">
        <div className="module-inner reverse">
          <div className="module-text">
            <ScrollAnimation>
              <div className="module-tag" style={{ background: '#FDF2F8', color: '#DB2777' }}>
                <Brain style={{ width: '16px', height: '16px' }} />
                情绪管理
              </div>
              <h2 className="module-title">心理测试</h2>
              <p className="module-desc">
                通过标准心理量表评估每日交易情绪状态，涵盖身体感觉、情绪状态、精力水平、
                睡眠质量等核心指标，生成心理指标报告，帮助识别决策中的情绪偏差，提升交易纪律性。
              </p>
              <div className="module-features">
                <span className="module-feature-tag">身体状态评估</span>
                <span className="module-feature-tag">情绪稳定性</span>
                <span className="module-feature-tag">精力水平</span>
                <span className="module-feature-tag">睡眠质量</span>
                <span className="module-feature-tag">指标趋势</span>
              </div>
              <Link to="/psychological-test" className="module-link" style={{ color: '#DB2777' }}>
                开始心理测试
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </ScrollAnimation>
          </div>
          <div className="module-image">
            <ScrollAnimation>
              <div className="module-screenshot">
                <img src="/images/home/psychological-test.png" alt="心理测试界面" loading="lazy" />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      <div className="module-divider" />

      {/* 模块3: 交易策略 - 截图在右 */}
      <section className="module-section">
        <div className="module-inner">
          <div className="module-text">
            <ScrollAnimation>
              <div className="module-tag" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                <Target style={{ width: '16px', height: '16px' }} />
                策略管理
              </div>
              <h2 className="module-title">交易策略</h2>
              <p className="module-desc">
                自定义买入卖出策略，多维度评估标准配置，支持策略启用/停用管理。
                智能匹配交易机会，自动关联心理测试与风险模型，让每一笔交易都有策略依据，
                提升决策效率与一致性。
              </p>
              <div className="module-features">
                <span className="module-feature-tag">策略配置</span>
                <span className="module-feature-tag">评估标准</span>
                <span className="module-feature-tag">智能匹配</span>
                <span className="module-feature-tag">启用/停用</span>
                <span className="module-feature-tag">策略评分</span>
              </div>
              <Link to="/trading-strategy" className="module-link" style={{ color: '#2563EB' }}>
                查看交易策略
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </ScrollAnimation>
          </div>
          <div className="module-image">
            <ScrollAnimation>
              <div className="module-screenshot">
                <img src="/images/home/trading-strategy.png" alt="交易策略界面" loading="lazy" />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      <div className="module-divider" />

      {/* 模块4: 风险模型 - 截图在左 */}
      <section className="module-section">
        <div className="module-inner reverse">
          <div className="module-text">
            <ScrollAnimation>
              <div className="module-tag" style={{ background: '#FFFBEB', color: '#D97706' }}>
                <Shield style={{ width: '16px', height: '16px' }} />
                风险控制
              </div>
              <h2 className="module-title">风险模型</h2>
              <p className="module-desc">
                动态账户风险计算与仓位管理，实时展示账户风险使用率、已用额度、
                本月亏损等关键指标。支持保守、均衡、激进三种风险模型，量化风险管理，
                让每一笔交易都在可控范围内。
              </p>
              <div className="module-features">
                <span className="module-feature-tag">账户风险监控</span>
                <span className="module-feature-tag">仓位计算</span>
                <span className="module-feature-tag">亏损控制</span>
                <span className="module-feature-tag">多模型配置</span>
                <span className="module-feature-tag">持仓追踪</span>
              </div>
              <Link to="/risk-model" className="module-link" style={{ color: '#D97706' }}>
                查看风险模型
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </ScrollAnimation>
          </div>
          <div className="module-image">
            <ScrollAnimation>
              <div className="module-screenshot">
                <img src="/images/home/risk-model.png" alt="风险模型界面" loading="lazy" />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      <div className="module-divider" />

      {/* 模块5: 股票交易 - 截图在右 */}
      <section className="module-section">
        <div className="module-inner">
          <div className="module-text">
            <ScrollAnimation>
              <div className="module-tag" style={{ background: '#ECFDF5', color: '#059669' }}>
                <Activity style={{ width: '16px', height: '16px' }} />
                交易执行
              </div>
              <h2 className="module-title">股票交易</h2>
              <p className="module-desc">
                完整的买入/卖出交易执行系统，智能关联心理测试、交易策略与风险模型，
                自动计算操作评级与交易评分。支持交易分类筛选、数据导出，
                让每一笔交易都有据可查。
              </p>
              <div className="module-features">
                <span className="module-feature-tag">买入/卖出管理</span>
                <span className="module-feature-tag">操作评级</span>
                <span className="module-feature-tag">策略关联</span>
                <span className="module-feature-tag">交易评分</span>
                <span className="module-feature-tag">数据导出</span>
              </div>
              <Link to="/order-management" className="module-link" style={{ color: '#059669' }}>
                进入股票交易
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </ScrollAnimation>
          </div>
          <div className="module-image">
            <ScrollAnimation>
              <div className="module-screenshot">
                <img src="/images/home/order-management.png" alt="股票交易界面" loading="lazy" />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      <div className="module-divider" />

      {/* 模块6: 交易记录 - 截图在左 */}
      <section className="module-section">
        <div className="module-inner reverse">
          <div className="module-text">
            <ScrollAnimation>
              <div className="module-tag" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                <ClipboardCheck style={{ width: '16px', height: '16px' }} />
                历史分析
              </div>
              <h2 className="module-title">交易记录</h2>
              <p className="module-desc">
                完整的交易历史管理系统，支持多维度筛选与统计分析。
                可视化盈亏分析，策略效果回溯，让每一次交易经验都成为未来决策的参考，
                持续优化交易体系。
              </p>
              <div className="module-features">
                <span className="module-feature-tag">交易历史</span>
                <span className="module-feature-tag">盈亏分析</span>
                <span className="module-feature-tag">策略回溯</span>
                <span className="module-feature-tag">多维筛选</span>
                <span className="module-feature-tag">数据导出</span>
              </div>
              <Link to="/trade-records" className="module-link" style={{ color: '#7C3AED' }}>
                查看交易记录
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </ScrollAnimation>
          </div>
          <div className="module-image">
            <ScrollAnimation>
              <div className="module-screenshot">
                <img src="/images/home/trade-records.png" alt="交易记录界面" loading="lazy" />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      <div className="module-divider" />

      {/* 模块7: 账单明细 - 截图在右 */}
      <section className="module-section">
        <div className="module-inner">
          <div className="module-text">
            <ScrollAnimation>
              <div className="module-tag" style={{ background: '#F0F9FF', color: '#0284C7' }}>
                <DollarSign style={{ width: '16px', height: '16px' }} />
                资金管理
              </div>
              <h2 className="module-title">账单明细</h2>
              <p className="module-desc">
                完整的账户资金流水记录，实时展示总资产、本月收支等关键财务指标。
                支持股票买卖、佣金、其他费用等多种记账类型分类统计，
                支持手动记账与数据导出，让资金管理一目了然。
              </p>
              <div className="module-features">
                <span className="module-feature-tag">资金流水</span>
                <span className="module-feature-tag">收支统计</span>
                <span className="module-feature-tag">手动记账</span>
                <span className="module-feature-tag">分类汇总</span>
                <span className="module-feature-tag">数据导出</span>
              </div>
              <Link to="/transaction-history" className="module-link" style={{ color: '#0284C7' }}>
                查看账单明细
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </ScrollAnimation>
          </div>
          <div className="module-image">
            <ScrollAnimation>
              <div className="module-screenshot">
                <img src="/images/home/transaction-history.png" alt="账单明细界面" loading="lazy" />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}

export default Home
