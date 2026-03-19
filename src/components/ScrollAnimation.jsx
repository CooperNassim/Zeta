import React, { useState, useEffect, useRef } from 'react'

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
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true)
          hasAnimated.current = true
        }
      },
      { threshold }
    )

    const currentRef = ref.current
    observer.observe(currentRef)

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, [threshold])

  const animations = {
    fadeInUp: {
      initial: { opacity: 0, transform: 'translateY(30px)' },
      animate: { opacity: 1, transform: 'translateY(0)' },
      exit: { opacity: 0, transform: 'translateY(-30px)' }
    },
    fadeInLeft: {
      initial: { opacity: 0, transform: 'translateX(-30px)' },
      animate: { opacity: 1, transform: 'translateX(0)' },
      exit: { opacity: 0, transform: 'translateX(30px)' }
    },
    fadeInRight: {
      initial: { opacity: 0, transform: 'translateX(30px)' },
      animate: { opacity: 1, transform: 'translateX(0)' },
      exit: { opacity: 0, transform: 'translateX(-30px)' }
    },
    scaleIn: {
      initial: { opacity: 0, transform: 'scale(0.9)' },
      animate: { opacity: 1, transform: 'scale(1)' },
      exit: { opacity: 0, transform: 'scale(0.9)' }
    }
  }

  const selectedAnimation = animations[animation] || animations.fadeInUp

  const currentStyle = {
    transition: `opacity ${duration}s ease, transform ${duration}s ease ${delay}s`,
    ...(isVisible ? selectedAnimation.animate : selectedAnimation.initial)
  }

  return (
    <div
      ref={ref}
      style={currentStyle}
      className={className}
    >
      {children}
    </div>
  )
}

export default ScrollAnimation
