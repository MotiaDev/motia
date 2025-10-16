'use client'
import { motion } from 'framer-motion'
import type React from 'react'

interface TitleProps {
  className?: string
  delay?: number
  children: React.ReactNode
}

const Title: React.FC<TitleProps> = ({ children, className, delay = 0 }) => {
  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }
  const wordVariant = {
    hidden: {
      opacity: 0,
      y: 6,
      filter: 'blur(6px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition:
        delay > 0
          ? { delay, type: 'spring', mass: 0.15, damping: 20, stiffness: 200 }
          : {
              type: 'spring',
              mass: 0.15,
              damping: 20,
              stiffness: 200,
            },
    },
  }
  const words = children?.toString().split(' ')

  return (
    <motion.h1
      className={`font-tasa text-[32px] leading-[1.25em] font-semibold tracking-[1.44px] text-white md:text-[40px] ${className}`}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      {words?.map((word, index) => (
        <motion.span key={index} variants={wordVariant} className="inline-block">
          {word}&nbsp;
        </motion.span>
      ))}
    </motion.h1>
  )
}

export default Title
