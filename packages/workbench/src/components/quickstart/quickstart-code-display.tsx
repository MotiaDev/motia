import { useThemeStore } from '@motiadev/ui'
import { type FC, useMemo } from 'react'
import type { TutorialStepConfig } from './quickstart-store'

type QuickstartCodeDisplayProps = {
  code: string
  steps: TutorialStepConfig[]
  activeStepId: string | null
}

type LineInfo = {
  lineNumber: number
  content: string
  isActiveComment: boolean
  isActiveCode: boolean
  isInactiveStep: boolean
  isComment: boolean
}

export const QuickstartCodeDisplay: FC<QuickstartCodeDisplayProps> = ({ code, steps, activeStepId }) => {
  const theme = useThemeStore((state) => state.theme)

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

  const isDark = theme === 'dark'

  return (
    <div className="flex-1 h-full overflow-auto font-mono text-sm">
      <div className={`min-h-full ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
        {visibleLines.map((item) => {
          if ('isCollapsed' in item) {
            // Render collapsed indicator
            return (
              <div
                key={`collapsed-${item.stepId}`}
                className={`flex items-center gap-2 px-4 py-1 ${isDark ? 'bg-[#2d2d2d] text-gray-500' : 'bg-gray-100 text-gray-400'} text-xs italic`}
              >
                <span className="select-none">⋯</span>
                <span>{item.lineCount} lines collapsed</span>
              </div>
            )
          }

          const isHighlighted = item.isActiveComment || item.isActiveCode
          const isGrayed = !isHighlighted && activeStepId !== null

          return (
            <div
              key={item.lineNumber}
              className={`flex transition-opacity duration-200 ${isGrayed ? 'opacity-30' : 'opacity-100'}`}
            >
              {/* Line number */}
              <div
                className={`select-none px-4 py-0.5 text-right min-w-12 shrink-0 ${isDark ? 'text-gray-500 bg-[#1e1e1e]' : 'text-gray-400 bg-gray-50'}`}
              >
                {item.lineNumber}
              </div>
              {/* Code content */}
              <pre
                className={`flex-1 px-4 py-0.5 whitespace-pre-wrap break-words overflow-hidden ${
                  isHighlighted ? (isDark ? 'bg-[#264f78]/30' : 'bg-blue-50') : isDark ? 'bg-[#1e1e1e]' : 'bg-white'
                } ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
              >
                <code className="break-words">{item.content || ' '}</code>
              </pre>
            </div>
          )
        })}
      </div>
    </div>
  )
}
