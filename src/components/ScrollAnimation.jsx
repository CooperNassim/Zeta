import React, { useState, useEffect, useRef, Children, cloneElement } from 'react'
import { motion } from 'framer-motion'

const ScrollAnimation = ({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true)
          hasAnimated.current = true
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  const animations = {
    fadeInUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -30 }
    },
    fadeInLeft: {
      initial: { opacity: 0, x: -30 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 30 }
    },
    fadeInRight: {
      initial: { opacity: 0, x: 30 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -30 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 }
    }
  }

  const selectedAnimation = animations[animation] || animations.fadeInUp

  return (
    <motion.div
      ref={ref}
      initial={selectedAnimation.initial}
      animate={isVisible ? selectedAnimation.animate : selectedAnimation.initial}
      exit={selectedAnimation.exit}
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default ScrollAnimation
