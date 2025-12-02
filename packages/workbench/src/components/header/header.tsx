import { useThemeStore } from '@motiadev/ui'
import type React from 'react'
import { memo, useEffect } from 'react'
// @ts-expect-error
import motiaLogoDark from '../../assets/motia-dark.png'
// @ts-expect-error
import motiaLogoLight from '../../assets/motia-light.png'
import { useMotiaConfigStore } from '../../stores/use-motia-config-store'
import { Tutorial } from '../tutorial/tutorial'
import { TutorialButton } from '../tutorial/tutorial-button'
import { ThemeToggle } from '../ui/theme-toggle'
import { DeployButton } from './deploy-button'

export const Header: React.FC = memo(() => {
  const theme = useThemeStore((state) => state.theme)
  const logo = theme === 'light' ? motiaLogoLight : motiaLogoDark

  const config = useMotiaConfigStore((state) => state.config)
  const fetchConfig = useMotiaConfigStore((state) => state.fetchConfig)

  useEffect(() => {
    fetchConfig()
  }, [])

  const isDevMode = config?.isDev ?? false
  const isTutorialDisabled = config?.isTutorialDisabled ?? true

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
})
Header.displayName = 'Header'
