import { useThemeStore } from '@motiadev/ui'
import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { TutorialStepConfig } from './quickstart-store'

type QuickstartCodeDisplayProps = {
  code: string
  steps: TutorialStepConfig[]
  activeStepId: string | null
  language?: string
}

type LineInfo = {
  lineNumber: number
  content: string
  isActiveComment: boolean
  isActiveCode: boolean
  isInactiveStepComment: boolean
  stepId: string | null // Which step's comment this belongs to (if any)
}

const FONT_SIZES = [14, 13, 12] // Prefer smaller font before wrapping (min 12pt)

export const QuickstartCodeDisplay: FC<QuickstartCodeDisplayProps> = ({
  code,
  steps,
  activeStepId,
  language = 'typescript',
}) => {
  const theme = useThemeStore((state) => state.theme)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeStepRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(FONT_SIZES[0])

  const isDark = theme === 'dark'
  const syntaxTheme = isDark ? vscDarkPlus : oneLight

  // Calculate optimal font size based on container width and longest line
  useEffect(() => {
    if (!containerRef.current || !code) return

    const container = containerRef.current
    const lines = code.split('\n')
    const maxLineLength = Math.max(...lines.map((line) => line.length))

    const checkFontSize = () => {
      const availableWidth = container.clientWidth - 100 // Account for line numbers and padding

      // Estimate character width (roughly 0.6 * fontSize for monospace)
      for (const size of FONT_SIZES) {
        const estimatedLineWidth = maxLineLength * size * 0.6
        if (estimatedLineWidth <= availableWidth) {
          setFontSize(size)
          return
        }
      }
      // Use smallest font if none fit
      setFontSize(FONT_SIZES[FONT_SIZES.length - 1])
    }

    checkFontSize()

    const resizeObserver = new ResizeObserver(checkFontSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [code])

  const activeStep = useMemo(() => steps.find((s) => s.id === activeStepId), [steps, activeStepId])

  const processedLines = useMemo((): LineInfo[] => {
    const lines = code.split('\n')

    return lines.map((content, index) => {
      const lineNumber = index + 1

      // Check if this line belongs to the active step
      let isActiveComment = false
      let isActiveCode = false

      if (activeStep) {
        isActiveComment = lineNumber >= activeStep.comment.start && lineNumber <= activeStep.comment.end
        isActiveCode = lineNumber >= activeStep.code.start && lineNumber <= activeStep.code.end
      }

      // Check if this line belongs to any inactive step's comment
      let isInactiveStepComment = false
      let stepId: string | null = null

      for (const step of steps) {
        const isInComment = lineNumber >= step.comment.start && lineNumber <= step.comment.end
        if (isInComment) {
          stepId = step.id
          if (step.id !== activeStepId) {
            isInactiveStepComment = true
          }
          break
        }
      }

      return {
        lineNumber,
        content,
        isActiveComment,
        isActiveCode,
        isInactiveStepComment,
        stepId,
      }
    })
  }, [code, steps, activeStep, activeStepId])

  // Find the first line of the active step for the ref
  const firstActiveLineNumber = activeStep?.comment.start ?? null

  // Auto-scroll to center active step when it changes (with delay to allow animation)
  useEffect(() => {
    if (!activeStepRef.current || !containerRef.current) return

    // Delay scroll to allow collapse/expand animation to complete
    const timeoutId = setTimeout(() => {
      if (!activeStepRef.current || !containerRef.current) return

      const container = containerRef.current
      const activeElement = activeStepRef.current

      // Get positions
      const containerRect = container.getBoundingClientRect()
      const activeRect = activeElement.getBoundingClientRect()

      // Calculate the scroll position to center the active element
      const activeMiddle = activeElement.offsetTop + activeRect.height / 2
      const containerMiddle = containerRect.height / 2
      const targetScroll = activeMiddle - containerMiddle

      // Clamp to valid scroll range (don't overscroll)
      const maxScroll = container.scrollHeight - container.clientHeight
      const clampedScroll = Math.max(0, Math.min(targetScroll, maxScroll))

      container.scrollTo({
        top: clampedScroll,
        behavior: 'smooth',
      })
    }, 350) // Wait for animation to complete

    return () => clearTimeout(timeoutId)
  }, [firstActiveLineNumber])

  // VS Code dark+ background: #1e1e1e
  const bgColor = isDark ? 'bg-[#1e1e1e]' : 'bg-[#ffffff]'

  return (
    <div
      ref={containerRef}
      className={`flex-1 h-full overflow-y-auto overflow-x-hidden font-mono ${bgColor}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="min-h-full">
        {processedLines.map((item) => {
          const isHighlighted = item.isActiveComment || item.isActiveCode
          const isInactive = !isHighlighted && activeStepId !== null
          const isFirstActiveLine = item.lineNumber === firstActiveLineNumber
          const isCollapsed = item.isInactiveStepComment

          return (
            <div
              key={item.lineNumber}
              ref={isFirstActiveLine ? activeStepRef : undefined}
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isCollapsed ? 0 : '100px',
                opacity: isCollapsed ? 0 : isInactive ? 0.35 : 1,
                backgroundColor: isHighlighted
                  ? isDark
                    ? 'rgba(40, 98, 254, 0.15)'
                    : 'rgba(40, 98, 254, 0.1)'
                  : 'transparent',
              }}
            >
              <div className="flex">
                {/* Line number */}
                <div
                  className={`select-none px-4 py-0.5 text-right min-w-10 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {item.lineNumber}
                </div>
                {/* Code content with syntax highlighting */}
                <div className="flex-1 min-w-0 py-0.5">
                  <SyntaxHighlighter
                    language={language}
                    style={syntaxTheme}
                    customStyle={{
                      margin: 0,
                      padding: '0 1rem',
                      background: 'transparent',
                      fontSize: `${fontSize}px`,
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: 'inherit',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      },
                    }}
                    wrapLines
                    wrapLongLines
                  >
                    {item.content || ' '}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
