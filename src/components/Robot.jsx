import React from 'react'
import { motion } from 'framer-motion'

const Robot = () => {
  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* 外层光晕 */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(14,165,233,0.3) 0%, transparent 70%)',
          filter: 'blur(20px)'
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 旋转的轨道 */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500/30"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* 第二个轨道 */}
      <motion.div
        className="absolute inset-8 rounded-full border border-primary-400/20"
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* 机器人主体 */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-64 h-64 robot-glow"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 头部 */}
          <circle cx="100" cy="80" r="45" fill="url(#headGradient)" stroke="#0ea5e9" strokeWidth="2" />

          {/* 眼睛 */}
          <motion.g
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <circle cx="85" cy="75" r="8" fill="#0ea5e9">
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                duration="1.5"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="115" cy="75" r="8" fill="#0ea5e9">
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                duration="1.5"
                repeatCount="indefinite"
              />
            </circle>
          </motion.g>

          {/* 天线 */}
          <line x1="100" y1="35" x2="100" y2="20" stroke="#0ea5e9" strokeWidth="2" />
          <motion.circle
            cx="100" cy="18"
            r="4"
            fill="#0ea5e9"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* 身体 */}
          <path
            d="M70 125 L80 125 L80 170 L70 170 Z"
            fill="url(#bodyGradient)"
            stroke="#0ea5e9"
            strokeWidth="1"
          />
          <path
            d="M130 125 L120 125 L120 170 L130 170 Z"
            fill="url(#bodyGradient)"
            stroke="#0ea5e9"
            strokeWidth="1"
          />

          {/* 核心 */}
          <motion.circle
            cx="100"
            cy="140"
            r="12"
            fill="url(#coreGradient)"
            stroke="#0ea5e9"
            strokeWidth="2"
            animate={{
              scale: [1, 1.1, 1],
              filter: ['drop-shadow(0 0 10px rgba(14,165,233,0.5))', 'drop-shadow(0 0 20px rgba(14,165,233,0.8))', 'drop-shadow(0 0 10px rgba(14,165,233,0.5))'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <animate
              attributeName="fill"
              values="#0ea5e9;#38bdf8;#0ea5e9"
              duration="3"
              repeatCount="indefinite"
            />
          </motion.circle>

          {/* 数据流动画 */}
          <motion.path
            d="M50 100 Q75 110, 100 100 Q125 90, 150 100"
            stroke="#0ea5e9"
            strokeWidth="1"
            fill="none"
            strokeDasharray="5 5"
            animate={{
              strokeDashoffset: [0, -20],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <motion.path
            d="M55 150 Q75 140, 100 150 Q125 160, 145 150"
            stroke="#0ea5e9"
            strokeWidth="1"
            fill="none"
            strokeDasharray="5 5"
            animate={{
              strokeDashoffset: [0, -20],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.5,
            }}
          />

          {/* 渐变定义 */}
          <defs>
            <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
            </linearGradient>
            <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* 浮动的粒子 */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary-400"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}

export default Robot
