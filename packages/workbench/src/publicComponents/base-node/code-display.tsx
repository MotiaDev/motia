import { useThemeStore } from '@motiadev/ui'
import type React from 'react'
import { useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Feature } from '../../types/file'
import { FeatureCard } from './feature-card'
import { LanguageIndicator } from './language-indicator'

type CodeDisplayProps = {
  code: string
  language?: string
  features?: Feature[]
}

const codeTagProps = {
  style: {
    fontFamily: 'DM Mono, monospace',
    fontSize: '16px',
  },
}

const customStyle = {
  margin: 0,
  borderRadius: 0,
  padding: 0,
}

const isHighlighted = (lines: string[], lineNumber: number) => {
  return lines.some((line) => {
    const [start, end] = line.split('-').map((num) => parseInt(num, 10))

    if (end !== undefined) {
      return lineNumber >= start && lineNumber <= end
    }

    return lineNumber == start
  })
}

const getFirstLineNumber = (line: string) => {
  const [start] = line.split('-').map((num) => parseInt(num, 10))
  return start
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, language, features }) => {
  const theme = useThemeStore((state) => state.theme)
  const themeStyle = theme === 'dark' ? oneDark : oneLight
  const [highlightedLines, setHighlightedLines] = useState<string[]>([])
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature)
    setHighlightedLines(feature.lines)
    const lineNumber = getFirstLineNumber(feature.lines[0])
    const line = ref.current?.querySelector(`[data-line-number="${lineNumber}"]`)

    if (line) {
      line.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center py-2 px-5 dark:bg-[#1e1e1e] gap-2 justify-center">
        <div className="text-sm text-muted-foreground">Read only</div>
        <div className="flex-1" />
        <LanguageIndicator language={language} className="w-4 h-4" size={16} showLabel />
      </div>
      <div className="flex flex-row h-[calc(100%-36px)]">
        {features && features.length > 0 && (
          <div className="flex flex-col gap-2 p-2 bg-card overflow-y-auto min-w-[200px] w-[300px]">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                highlighted={selectedFeature === feature}
                onClick={() => handleFeatureClick(feature)}
                onHover={() => handleFeatureClick(feature)}
              />
            ))}
          </div>
        )}

        <div className="overflow-y-auto" ref={ref}>
          <SyntaxHighlighter
            showLineNumbers
            language={language}
            style={themeStyle}
            codeTagProps={codeTagProps}
            customStyle={customStyle}
            wrapLines
            lineProps={(lineNumber) => {
              if (isHighlighted(highlightedLines, lineNumber)) {
                return {
                  'data-line-number': lineNumber,
                  style: {
                    borderLeft: '2px solid var(--accent-1000)',
                    backgroundColor: 'rgb(from var(--accent-1000) r g b / 0.2)',
                  },
                }
              }

              return {
                'data-line-number': lineNumber,
                style: {
                  borderLeft: '2px solid transparent',
                },
              }
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  )
}
