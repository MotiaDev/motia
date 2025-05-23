import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import { useTheme } from '@/hooks/use-theme'
import React, { useCallback, useMemo } from 'react'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = useCallback(() => {
    switch (theme) {
      case 'light':
        setTheme('dark')
        break
      case 'dark':
        setTheme('system')
        break
      case 'system':
        setTheme('light')
        break
      default:
        setTheme('light')
    }
  }, [setTheme, theme])

  const tooltipText = useMemo(() => {
    switch (theme) {
      case 'light':
        return 'Light theme - Click to switch to dark'
      case 'dark':
        return 'Dark theme - Click to switch to system'
      case 'system':
        return 'System theme - Click to switch to light'
      default:
        return 'Toggle theme'
    }
  }, [theme])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-9 h-9" onClick={toggleTheme}>
            {theme === 'system' ? (
              <Monitor className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </>
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
