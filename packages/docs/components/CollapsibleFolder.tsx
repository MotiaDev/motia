'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { chevronDownIcon, fileIcon, folderIcon } from './Icons'

type Props = {
  folder: string
  files: string[]
  selectedFile: string
  setSelectedFile: (name: string) => void
}
export default function CollapsibleFolder({ folder, files, selectedFile, setSelectedFile }: Props) {
  //const WINDOW_WIDTH = useWindowWidth()
  const [isOpen, setIsOpen] = useState(true)

  const containerVariants = {
    open: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    closed: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  }

  const itemVariants = {
    closed: { opacity: 0, x: -6 },
    open: { opacity: 1, x: 0 },
  }

  return (
    <div>
      {/* Folder Header */}
      <div
        className="flex h-[32px] cursor-pointer items-center space-x-[12px] text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          initial={false}
          animate={{ rotate: (isOpen ?? false) ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="h-2 w-2"
        >
          {chevronDownIcon}
        </motion.div>
        {folderIcon}
        <span className="text-[14px]">{folder}</span>
      </div>

      {/* Files */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            transition={{ layout: { type: 'spring', mass: 0.15, damping: 20, stiffness: 200 } }}
            className="relative flex flex-col"
            initial="closed"
            animate="open"
            exit="closed"
            variants={containerVariants}
          >
            {/**Left Border */}
            <motion.div
              variants={{
                open: { height: '100%', transition: { duration: files.length * 0.15 } },
                closed: { height: 0, transition: { duration: 0.25 } },
              }}
              className="absolute top-0 left-[3px] w-[1px] bg-[#696969]"
            ></motion.div>
            {files.map((file, index) => (
              <motion.div
                onClick={() => setSelectedFile(file)}
                key={index}
                variants={itemVariants}
                className={`flex w-fit cursor-pointer items-center space-x-[12px] rounded-[8px] px-[16px] py-[10px] text-white transition-colors duration-400 ${
                  selectedFile === file ? 'bg-[#1E2537]' : 'hover:bg-white/10'
                }`}
              >
                {fileIcon}
                <p className="text-[14px] text-nowrap">{file}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
