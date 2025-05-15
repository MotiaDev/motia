'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import ButtonPrimary from './ButtonPrimary'
import { blueTick, copyIconBlack } from './Icons'

export default function CopyNPX() {
  const [copied, setCopied] = useState(false)
  const command = 'npx motia create -n my-agent'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="w-fit text-nowrap max-lg:!w-full"
      animate={{ width: 'fit' }}
      initial={false}
      transition={{ bounce: 0, duration: 0.2 }}
    >
      <ButtonPrimary onClick={handleCopy} className="w-fit max-lg:w-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? 'copied' : 'copy'}
            initial={{ opacity: 0, width: '230px' }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: '230px' }}
            transition={{ bounce: 0, duration: 0.2 }}
            className="inline-block"
          >
            {copied ? 'Copied!' : command}
          </motion.span>
        </AnimatePresence>
        {copyIconBlack({ color: 'black' })}
      </ButtonPrimary>
    </motion.div>
  )
}
