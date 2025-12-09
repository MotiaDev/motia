import { useThemeStore } from '@motiadev/ui'
import { memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useShallow } from 'zustand/react/shallow'
import { getBodySelector, useEndpointConfiguration } from '../hooks/use-endpoint-configuration'

const codeTagProps = {
  style: {
    fontFamily: 'DM Mono, monospace',
    fontSize: '14px',
  },
}

const customStyle = {
  margin: 0,
  borderRadius: 0,
  padding: '16px',
  background: 'transparent',
}

const detectLanguage = (content: string): string => {
  if (!content) return 'text'
  const trimmed = content.trim()
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return 'json'
  }
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return 'xml'
  }
  return 'text'
}

export const SidePanelRawTab = memo(() => {
  const body = useEndpointConfiguration(useShallow(getBodySelector))
  const theme = useThemeStore((state) => state.theme)
  const themeStyle = theme === 'dark' ? atomDark : oneLight
  const language = detectLanguage(body)

  if (!body) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4">
        <p className="text-sm">No body content</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <SyntaxHighlighter
        showLineNumbers
        language={language}
        style={themeStyle}
        codeTagProps={codeTagProps}
        customStyle={customStyle}
        wrapLines
      >
        {body}
      </SyntaxHighlighter>
    </div>
  )
})
