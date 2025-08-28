type MonacoEditor = {
  getModel: () => { getLineCount: () => number }
  setValue: (value: string) => void
  revealLine: (line: number) => void
}

declare const monaco: { editor: { getEditors: () => MonacoEditor[] } } | undefined
