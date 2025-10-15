import { cn, type Theme, useThemeStore } from '@motiadev/ui'
import { Moon, Sun } from 'lucide-react'
import type React from 'react'
import { useEffect } from 'react'

export const ThemeToggle: React.FC = () => {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    const colorScheme = url.searchParams.get('color-scheme') as Theme
    if (colorScheme) {
      setTheme(colorScheme)
    }
  }, [setTheme])

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center cursor-pointer w-16 h-8 border bg-muted-foreground/10 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <div
        className={cn(
          'absolute w-6 h-6 bg-background border border-border rounded-full shadow-sm transition-transform duration-200 ease-in-out',
          theme === 'dark' ? 'translate-x-8' : 'translate-x-0',
        )}
      />

      <div className="flex items-center justify-center w-6 h-6 z-10">
        <Sun
          className={cn(
            'h-3.5 w-3.5 transition-colors duration-200',
            theme === 'light' ? 'text-foreground' : 'text-muted-foreground',
          )}
        />
      </div>

      <div className="flex items-center justify-center w-6 h-6 z-10 ml-2">
        <Moon
          className={cn(
            'h-3.5 w-3.5 transition-colors duration-200',
            theme === 'dark' ? 'text-foreground' : 'text-muted-foreground',
          )}
        />
      </div>
    </button>
  )
}
