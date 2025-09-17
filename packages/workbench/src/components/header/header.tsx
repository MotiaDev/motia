import React, { useEffect, useState } from 'react'
import { useThemeStore } from '@/stores/use-theme-store'
import { ThemeToggle } from '../ui/theme-toggle'
import { TutorialButton } from '../tutorial/tutorial-button'
import { DeployButton } from './deploy-button'

export const Header: React.FC = () => {
  const [isDevMode, setIsDevMode] = useState(false)
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    fetch('/__motia')
      .then((res) => res.json())
      .then((data) => setIsDevMode(data.isDev))
      .catch((err) => console.error(err))
  }, [])

  return (
    <header className="min-h-16 px-4 gap-4 flex items-center bg-default text-default-foreground border-b">
      <img src={`/motia-${theme}.png`} className="h-5" id="logo-icon" data-testid="logo-icon" />
      <div className="flex-1" />
      <ThemeToggle />
      {isDevMode && <TutorialButton />}
      {isDevMode && <DeployButton />}
    </header>
  )
}
