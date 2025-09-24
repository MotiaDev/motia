import motiaLogoDark from '@/assets/motia-dark.png'
import motiaLogoLight from '@/assets/motia-light.png'
import { useThemeStore } from '@motiadev/ui'
import React, { useEffect, useState } from 'react'
import { Tutorial } from '../tutorial/tutorial'
import { TutorialButton } from '../tutorial/tutorial-button'
import { ThemeToggle } from '../ui/theme-toggle'
import { DeployButton } from './deploy-button'

export const Header: React.FC = () => {
  const [isDevMode, setIsDevMode] = useState(false)
  const [isTutorialDisabled, setIsTutorialDisabled] = useState(true)
  const theme = useThemeStore((state) => state.theme)
  const logo = theme === 'light' ? motiaLogoLight : motiaLogoDark

  useEffect(() => {
    fetch('/__motia')
      .then((res) => res.json())
      .then((data) => {
        setIsDevMode(data.isDev)
        setIsTutorialDisabled(data.isTutorialDisabled)
      })
      .catch((err) => console.error(err))
  }, [])

  return (
    <header className="min-h-16 px-4 gap-4 flex items-center bg-default text-default-foreground border-b">
      <img src={logo} className="h-5" id="logo-icon" data-testid="logo-icon" />
      <div className="flex-1" />
      <ThemeToggle />
      {isDevMode && !isTutorialDisabled && <TutorialButton />}
      {isDevMode && <DeployButton />}
      {!isTutorialDisabled && <Tutorial />}
    </header>
  )
}
