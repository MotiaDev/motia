'use client'
import React from 'react'
import { motion } from 'framer-motion'

interface TextAppearBlurProps {
  children: React.ReactNode
  delay?: number
}

export const TextAppearBlur: React.FC<TextAppearBlurProps> = ({ children, delay = 0 }) => {
  const variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
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
      transition: {
        type: 'spring',
        mass: 0.5,
        damping: 30,
        stiffness: 300,
      },
    },
  }

  const words = children?.toString().split(' ')
  return (
    <motion.span variants={variants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
      {words?.map((word, index) => (
        <motion.span key={index} variants={wordVariant} className="inline-block">
          {word}&nbsp;
        </motion.span>
      ))}
    </motion.span>
  )
}
