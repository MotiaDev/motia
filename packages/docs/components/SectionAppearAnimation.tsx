'use client'
import { motion } from 'framer-motion'

interface Props {
  transition?: object
  delay?: number
  children: React.ReactNode
  className?: string
  initialY?: number
}

const SectionAppearAnimation: React.FC<Props> = ({
  children,
  transition,
  delay = 0,
  className = '',
  initialY = 40,
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: initialY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.15, delay: delay, ...transition }}
    >
      {children}
    </motion.div>
  )
}

export default SectionAppearAnimation
