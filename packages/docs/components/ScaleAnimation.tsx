'use client'
import { motion } from 'framer-motion'
import React from 'react'

interface ScaleAnimation {
  children: React.ReactNode
  className?: string
}
export const ScaleAnimation: React.FC<ScaleAnimation> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      animate={{ scale: [1, 1.15, 1], y: [0, -60, 0], x: [0, 40, 0] }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.div>
  )
}
