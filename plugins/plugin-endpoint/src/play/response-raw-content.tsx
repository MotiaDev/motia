import { useThemeStore } from '@motiadev/ui'
import { memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

type ResponseRawContentProps = {
  rawBody: string
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
  padding: '16px',
  background: 'transparent',
}

export const ResponseRawContent = memo(({ rawBody }: ResponseRawContentProps) => {
  const theme = useThemeStore((state) => state.theme)
  const themeStyle = theme === 'dark' ? atomDark : oneLight

  if (!rawBody) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4">
        <p className="text-sm">No response body</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <SyntaxHighlighter
        showLineNumbers
        language="text"
        style={themeStyle}
        codeTagProps={codeTagProps}
        customStyle={customStyle}
        wrapLines
        wrapLongLines
      >
        {rawBody}
      </SyntaxHighlighter>
    </div>
  )
})
