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

  // 计算统计数据 - 基于所有订单
  // 由于不再使用状态，这里使用所有订单进行计算
  const transactions = useStore(state => state.transactions)

  // 计算交易金额（所有交易的金额总和）
  const tradeAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)

  // 计算盈亏额（所有交易的盈亏总和）
  const profitLoss = transactions.reduce((sum, t) => sum + (t.profit || 0), 0)

  // 计算手续费（所有交易的手续费总和）
  const totalFee = transactions.reduce((sum, t) => sum + (t.fee || 0), 0)

  const stats = [
    { label: '交易金额', value: tradeAmount, prefix: '¥' },
    { label: '盈亏额', value: profitLoss, prefix: '¥' },
    { label: '手续费', value: totalFee, prefix: '¥' },
    { label: '交易记录', value: transactions.length },
  ]

  return (
    <div style={{ margin: '0', padding: '0', overflowY: 'auto', height: '100vh' }}>
      <style>
        {`
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
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white" style={{ margin: '0', padding: '0', paddingTop: '72px', paddingLeft: '20px', minHeight: '100vh', maxWidth: '1920px', marginLeft: 'auto', marginRight: 'auto' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ margin: '0', padding: '0', width: '100%', minHeight: 'calc(100vh - 72px)', maxHeight: '1080px' }}>
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

        <div className="relative z-10" style={{ minHeight: 'calc(100vh - 56px)', padding: '0', margin: '0', width: '100%' }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center h-full" style={{ margin: '0', width: '100%' }}>
            {/* 左侧文字 */}
            <div style={{ padding: '0', margin: '0', marginLeft: '100px', marginTop: '-60px' }}>
              <h1
                className="text-5xl md:text-6xl font-bold mb-2 leading-tight"
                style={{ fontSize: '64px', lineHeight: '78px', letterSpacing: 'normal', color: '#111827', marginTop: '50px', fontWeight: '800' }}
              >
                建立自己交易系统
              </h1>
              <p
                className="text-5xl md:text-6xl font-bold leading-tight"
                style={{ fontSize: '64px', lineHeight: '78px', letterSpacing: 'normal', color: '#111827', fontWeight: '800' }}
              >
                学习 <span style={{
                  fontWeight: '700',
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
                style={{ width: '80%', marginTop: '30px', fontSize: '18px' }}
              >
                告别非理性交易，将交易变成可重复的成功
              </p>

              <div className="flex flex-wrap gap-4">
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
                  <button
                    className="px-8 py-2 inline-flex items-center gap-2"
                    style={{ backgroundColor: '#E5E7EB', borderRadius: '0', fontSize: '16px', color: '#0F1419', transition: 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1D5DB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                  >
                    心理测试
                    <svg
                      viewBox="0 0 1026 1024"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-[18px] h-[18px]"
                      style={{ fill: '#0F1419', marginLeft: '2px', marginTop: '2px' }}
                    >
                      <path
                        d="M1022.448485 314.957576c-18.618182-113.260606-108.606061-204.8-220.315152-226.521212-96.193939-18.618182-184.630303 12.412121-246.690909 71.369697-17.066667 17.066667-46.545455 15.515152-62.060606-3.103031-60.509091-68.266667-153.6-107.054545-256-89.987878C124.121212 85.333333 31.030303 175.321212 9.309091 290.133333c-15.515152 83.781818 3.10303 155.151515 48.09697 220.315152v1.551515l1.551515 3.10303c6.206061 12.412121 20.169697 31.030303 31.030303 40.339394l395.636363 429.769697c17.066667 18.618182 46.545455 18.618182 65.163637 0l392.533333-422.012121c4.654545-4.654545 9.309091-10.860606 15.515152-15.515152l3.10303-4.654545c49.648485-60.509091 76.024242-141.187879 60.509091-228.072727zM814.545455 529.066667l-170.666667 1.551515-31.030303 125.672727c-3.10303 12.412121-13.963636 21.721212-26.375758 23.272727h-3.10303c-10.860606 0-21.721212-6.206061-26.375758-15.515151l-139.636363-260.654546-34.133334 119.466667c-3.10303 12.412121-15.515152 21.721212-29.478787 21.721212H192.387879c-17.066667 0-31.030303-13.963636-31.030303-31.030303s13.963636-31.030303 31.030303-31.030303h138.084848l48.09697-169.115151c3.10303-12.412121 13.963636-20.169697 26.375758-21.721213 12.412121-1.551515 24.824242 4.654545 29.478787 15.515152l139.636364 259.10303 18.618182-72.921212c3.10303-13.963636 15.515152-23.272727 29.478788-23.272727l192.387879-3.10303c7.757576 0 15.515152 1.551515 20.169697 7.757575 6.206061 6.206061 10.860606 13.963636 10.860606 23.272728 0 17.066667-13.963636 31.030303-31.030303 31.030303z"
                      />
                    </svg>
                  </button>
                </Link>
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-2 gap-6 mt-8">
                {stats.map((stat, index) => (
                  <div key={stat.label} style={index === 1 || index === 3 ? { marginLeft: '-30%', textAlign: 'left' } : {}}>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="font-bold text-gray-900" style={{ fontSize: '32px' }}>
                      {stat.prefix}
                      <Counter end={stat.value} duration={2} decimals={0} />
                      {stat.suffix}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧机器人动画 */}
            <div className="relative h-full py-8 flex items-center overflow-visible" style={{ paddingLeft: '50px' }}>
              {/* 机器人主容器 */}
              <div className="relative" style={{ width: '500px', height: '500px' }}>
                {/* 背部火焰效果 - 最低层级，左下角 */}
                <div
                  className="absolute"
                  style={{
                    bottom: '10%',
                    left: '32%',
                    width: '250px',
                    height: '350px',
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
            <div
              className="feature-card"
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
            </div>

            {/* 交易策略 */}
            <div
              className="feature-card"
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
            </div>

            {/* 技术指标 */}
            <div
              className="feature-card"
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
            </div>

            {/* 风险模型 */}
            <div
              className="feature-card"
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
            </div>
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
