import Editor from '@monaco-editor/react'
import { useThemeStore } from '@motiadev/ui'
import { type FC, useMemo } from 'react'

type QuickstartCodeDisplayProps = {
  code: string
}

export const QuickstartCodeDisplay: FC<QuickstartCodeDisplayProps> = ({ code }) => {
  const theme = useThemeStore((state) => state.theme)
  const editorTheme = useMemo(() => (theme === 'dark' ? 'vs-dark' : 'light'), [theme])

  return (
    <div className="flex-1 h-full overflow-hidden">
      <Editor
        height="100%"
        language="typescript"
        value={code}
        theme={editorTheme}
        options={{
          readOnly: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          lineNumbers: 'on',
          folding: true,
          fontSize: 14,
          wordWrap: 'on',
        }}
      />
    </div>
  )
}
