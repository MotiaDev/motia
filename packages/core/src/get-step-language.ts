export const getStepLanguage = (fileExtension?: string): string | undefined => {
  if (!fileExtension) return

  if (fileExtension.endsWith('.js')) {
    return 'javascript'
  }

  if (fileExtension.endsWith('.ts')) {
    return 'typescript'
  }

  if (fileExtension.endsWith('.py')) {
    return 'python'
  }

  if (fileExtension.endsWith('.go')) {
    return 'go'
  }

  if (fileExtension.endsWith('.rb')) {
    return 'ruby'
  }

  if (fileExtension.endsWith('.cs')) {
    return 'csharp'
  }

  if (fileExtension.endsWith('.php')) {
    return 'php'
  }

  return
}
