import { useCallback, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

const storageKey = 'motia-workbench-theme'
const defaultTheme = 'system'

const updateTheme = (theme: Theme) => {
  const root = window.document.body

  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    root.classList.add(systemTheme)
    return
  }

  root.classList.add(theme)
}

export const useTheme = () => {
  const [theme, _setTheme] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || defaultTheme)

  useEffect(() => {
    updateTheme(theme)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    _setTheme(newTheme)
    updateTheme(newTheme)
  }, [])

  return {
    theme,
    setTheme,
  }
}
