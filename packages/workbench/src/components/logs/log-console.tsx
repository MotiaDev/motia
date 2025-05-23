import { useLogs } from '@/stores/use-logs'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { Logs } from './logs'

const MIN_HEIGHT = 100
const DEFAULT_HEIGHT = 200

const ClearLogsButton = () => {
  const hasLog = useLogs((state) => state.logs.length > 0)
  const resetLogs = useLogs((state) => state.resetLogs)

  if (!hasLog) {
    return null
  }

  return (
    <Button variant="outline" onClick={resetLogs}>
      <Trash2 className="w-4 h-4" />
      Clear logs
    </Button>
  )
}

export const LogConsole = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const dragRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const windowHeight = window.innerHeight
      const mouseY = e.clientY
      const newHeight = windowHeight - mouseY

      if (newHeight >= MIN_HEIGHT) {
        setHeight(newHeight)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/80 border border-solid border-border m-4 rounded-lg">
      <div
        ref={dragRef}
        onMouseDown={handleMouseDown}
        className={cn(
          'absolute -top-1 left-0 right-0 h-1 cursor-ns-resize hover:bg-background/40',
          isDragging && 'bg-background/40',
        )}
      />
      <div className="text-muted-foreground flex justify-between w-full items-center p-4 gap-2">
        <label className="w-full text-left justify-start h-full text-md uppercase">Logs</label>
        <ClearLogsButton />
        <Button variant="outline" onClick={toggleExpand}>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="log-content"
            initial={{ height: 0 }}
            animate={{ height }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Logs />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
