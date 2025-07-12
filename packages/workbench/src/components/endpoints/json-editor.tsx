import { FC, useEffect, useMemo } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { useThemeStore } from '@/stores/use-theme-store'

type JsonEditorProps = {
  value: string
  schema?: Record<string, unknown>
  onChange: (value: string) => void
  onValidate?: (isValid: boolean) => void
}

export const JsonEditor: FC<JsonEditorProps> = ({ value, schema, onChange, onValidate }) => {
  const monaco = useMonaco()
  const theme = useThemeStore((state) => state.theme)
  const editorTheme = useMemo(() => (theme === 'dark' ? 'vs-dark' : 'light'), [theme])

  useEffect(() => {
    if (!monaco) return

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: schema
        ? [
            {
              uri: window.location.href,
              fileMatch: ['*'],
              schema,
            },
          ]
        : [],
    })
  }, [monaco, schema])

  return (
    <Editor
      data-testid="json-editor"
      height="200px"
      language="json"
      value={value}
      theme={editorTheme}
      onChange={(value) => {
        if (!value) {
          onValidate?.(false)
        }
        onChange(value ?? '')
      }}
      onValidate={(markers) => onValidate?.(markers.length === 0)}
      options={{ lineNumbers: 'off', minimap: { enabled: false } }}
    />
  )
}
