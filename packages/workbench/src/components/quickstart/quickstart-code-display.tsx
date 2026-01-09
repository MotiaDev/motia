import { useThemeStore } from '@motiadev/ui'
import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
  isInactiveStep: boolean
  isComment: boolean
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
  const syntaxTheme = isDark ? oneDark : oneLight

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
      const isComment = content.trimStart().startsWith('//')

      // Check if this line belongs to the active step
      let isActiveComment = false
      let isActiveCode = false

      if (activeStep) {
        isActiveComment = lineNumber >= activeStep.comment.start && lineNumber <= activeStep.comment.end
        isActiveCode = lineNumber >= activeStep.code.start && lineNumber <= activeStep.code.end
      }

      // Check if this line belongs to any inactive step's comment (should be hidden)
      let isInactiveStep = false
      for (const step of steps) {
        if (step.id !== activeStepId) {
          const isInComment = lineNumber >= step.comment.start && lineNumber <= step.comment.end
          if (isInComment) {
            isInactiveStep = true
            break
          }
        }
      }

      return {
        lineNumber,
        content,
        isActiveComment,
        isActiveCode,
        isInactiveStep,
        isComment,
      }
    })
  }, [code, steps, activeStep, activeStepId])

  // Filter out inactive step comments (collapsed)
  const visibleLines = useMemo(() => {
    const result: (LineInfo | { isCollapsed: true; stepId: string; lineCount: number })[] = []
    let i = 0

    while (i < processedLines.length) {
      const line = processedLines[i]

      if (line.isInactiveStep) {
        // Find the step this belongs to
        const step = steps.find(
          (s) => s.id !== activeStepId && line.lineNumber >= s.comment.start && line.lineNumber <= s.comment.end,
        )

        if (step) {
          // Count consecutive lines in this step's comment
          const commentLineCount = step.comment.end - step.comment.start + 1
          result.push({ isCollapsed: true, stepId: step.id, lineCount: commentLineCount })

          // Skip all lines in this comment block
          while (i < processedLines.length && processedLines[i].lineNumber <= step.comment.end) {
            i++
          }
          continue
        }
      }

      result.push(line)
      i++
    }

    return result
  }, [processedLines, steps, activeStepId])

  // Find the first line of the active step for the ref
  const firstActiveLineNumber = activeStep?.comment.start ?? null

  // Auto-scroll to center active step when it changes
  useEffect(() => {
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
  }, [firstActiveLineNumber])

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full overflow-y-auto overflow-x-hidden font-mono"
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className={`min-h-full ${isDark ? 'bg-[#282c34]' : 'bg-[#fafafa]'}`}>
        {visibleLines.map((item) => {
          if ('isCollapsed' in item) {
            // Render collapsed indicator
            return (
              <div
                key={`collapsed-${item.stepId}`}
                className={`flex items-center gap-2 px-4 py-1 ${isDark ? 'bg-[#21252b] text-gray-500' : 'bg-gray-100 text-gray-400'} text-xs italic`}
              >
                <span className="select-none">⋯</span>
                {/* <span>{item.lineCount} lines collapsed</span> */}
              </div>
            )
          }

          const isHighlighted = item.isActiveComment || item.isActiveCode
          const isGrayed = !isHighlighted && activeStepId !== null
          const isFirstActiveLine = item.lineNumber === firstActiveLineNumber

          return (
            <div
              key={item.lineNumber}
              ref={isFirstActiveLine ? activeStepRef : undefined}
              className={`flex transition-opacity duration-200 ${isGrayed ? 'opacity-30' : 'opacity-100'}`}
            >
              {/* Line number */}
              <div
                className={`select-none px-4 py-0.5 text-right min-w-10 shrink-0 ${isDark ? 'text-gray-500 bg-[#282c34]' : 'text-gray-400 bg-gray-50'}`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {item.lineNumber}
              </div>
              {/* Code content with syntax highlighting */}
              <div
                className={`flex-1 min-w-0 py-0.5 ${
                  isHighlighted ? (isDark ? 'bg-[#3e4451]' : 'bg-blue-50') : isDark ? 'bg-[#282c34]' : 'bg-[#fafafa]'
                }`}
              >
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
          )
        })}
      </div>
    </div>
  )
}
