import { useThemeStore } from '@motiadev/ui'
import { useMemo, useRef } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { WalkthroughCodeStyles, WalkthroughCommentConfig } from './engine/walkthrough-types'

type WalkthroughCodeDisplayProps = {
  code: string
  language?: string
  focusLines: number[]
  expandedComments: Set<string>
  comments: Record<string, WalkthroughCommentConfig>
  codeStyles: WalkthroughCodeStyles
}

const codeTagProps = {
  style: {
    fontFamily: 'DM Mono, monospace',
    fontSize: '14px',
  },
}

const customStyle = {
  margin: 0,
  borderRadius: 0,
  padding: 0,
  background: 'transparent',
}

export const WalkthroughCodeDisplay: React.FC<WalkthroughCodeDisplayProps> = ({
  code,
  language,
  focusLines,
  expandedComments,
  comments,
  codeStyles,
}) => {
  const theme = useThemeStore((state) => state.theme)
  const themeStyle = theme === 'dark' ? oneDark : oneLight
  const ref = useRef<HTMLDivElement>(null)

  // Build a map of which lines belong to which comment
  const lineToComment = useMemo(() => {
    const map = new Map<number, { id: string; config: WalkthroughCommentConfig }>()
    Object.entries(comments).forEach(([id, config]) => {
      for (let line = config.startLine; line <= config.endLine; line++) {
        map.set(line, { id, config })
      }
    })
    return map
  }, [comments])

  // Build processed code with collapsed comments
  const { processedCode, lineMapping } = useMemo(() => {
    const lines = code.split('\n')
    const processedLines: string[] = []
    const lineMapping: number[] = [] // Maps processed line index to original line number
    const processedComments = new Set<string>()

    for (let i = 0; i < lines.length; i++) {
      const originalLineNum = i + 1
      const commentInfo = lineToComment.get(originalLineNum)

      if (commentInfo) {
        if (!processedComments.has(commentInfo.id)) {
          processedComments.add(commentInfo.id)

          if (expandedComments.has(commentInfo.id)) {
            // Add all lines of expanded comment
            for (let j = commentInfo.config.startLine; j <= commentInfo.config.endLine; j++) {
              processedLines.push(lines[j - 1])
              lineMapping.push(j)
            }
          } else {
            // Add collapsed placeholder
            processedLines.push(commentInfo.config.collapsedText)
            lineMapping.push(commentInfo.config.startLine)
          }
        }
        // Skip other lines in the comment range
      } else {
        processedLines.push(lines[i])
        lineMapping.push(originalLineNum)
      }
    }

    return {
      processedCode: processedLines.join('\n'),
      lineMapping,
    }
  }, [code, lineToComment, expandedComments])

  // Check if a processed line should be focused
  const isFocused = (processedLineNum: number) => {
    if (focusLines.length === 0) return true
    const originalLine = lineMapping[processedLineNum - 1]
    return focusLines.includes(originalLine)
  }

  // Check if a line is a collapsed comment
  const isCollapsedComment = (processedLineNum: number) => {
    const originalLine = lineMapping[processedLineNum - 1]
    const commentInfo = lineToComment.get(originalLine)
    return commentInfo && !expandedComments.has(commentInfo.id)
  }

  return (
    <div className="overflow-y-auto h-full" ref={ref}>
      <SyntaxHighlighter
        showLineNumbers
        language={language}
        style={themeStyle}
        codeTagProps={codeTagProps}
        customStyle={customStyle}
        wrapLines
        lineProps={(lineNumber) => {
          const focused = isFocused(lineNumber)
          const collapsed = isCollapsedComment(lineNumber)
          const highlighted = focusLines.includes(lineMapping[lineNumber - 1])

          const baseStyle: React.CSSProperties = {
            display: 'block',
            opacity: focused ? 1 : codeStyles.fadeOpacity,
            transition: 'opacity 0.3s ease, background-color 0.3s ease',
            borderLeft: highlighted ? '3px solid var(--accent-1000)' : '3px solid transparent',
            backgroundColor: highlighted ? 'rgb(from var(--accent-1000) r g b / 0.1)' : 'transparent',
          }

          if (collapsed) {
            return {
              'data-line-number': lineNumber,
              style: {
                ...baseStyle,
                fontStyle: 'italic',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              },
            }
          }

          return {
            'data-line-number': lineNumber,
            style: baseStyle,
          }
        }}
      >
        {processedCode}
      </SyntaxHighlighter>
    </div>
  )
}
