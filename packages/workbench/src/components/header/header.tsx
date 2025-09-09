import type React from 'react'
import { useThemeStore } from '@/stores/use-theme-store'
import { TutorialButton } from '../tutorial/tutorial-button'
import { ThemeToggle } from '../ui/theme-toggle'

export const Header: React.FC = () => {
  const theme = useThemeStore((state) => state.theme)

  return (
    <header className="min-h-16 px-4 gap-4 flex items-center bg-default text-default-foreground border-b">
      <img src={`/motia-${theme}.png`} className="h-5" id="logo-icon" data-testid="logo-icon" />
      <div className="flex-1" />
      <TutorialButton />
      <ThemeToggle />
    </header>
  )
}
