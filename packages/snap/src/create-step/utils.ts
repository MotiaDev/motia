import type { Language } from './types'

export const getFileExtension = (language: Language): string => {
  const extensions: Record<Language, string> = {
    typescript: '.ts',
    javascript: '.js',
    python: '.py',
    ruby: '.rb',
  }

  return extensions[language]
}
